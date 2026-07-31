const WebSocket = require('ws');

class PaymentWebSocket {
  constructor(server) {
    this.wss = new WebSocket.Server({ server });
    this.paymentSessions = new Map();
    this.setupWebSocket();
  }

  setupWebSocket() {
    this.wss.on('connection', (ws) => {
      console.log('🔌 Payment WebSocket client connected');

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          console.log('📨 WebSocket message:', data);

          if (data.type === 'register' && data.checkoutId) {
            this.registerPaymentSession(ws, data.checkoutId);
          }
        } catch (error) {
          console.error('WebSocket message error:', error);
        }
      });

      ws.on('close', () => {
        console.log('🔌 Payment WebSocket client disconnected');
        this.cleanupWebSocket(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });
  }

  registerPaymentSession(ws, checkoutId) {
    const session = this.paymentSessions.get(checkoutId);
    if (session) {
      session.wsConnection = ws;
      console.log(`✅ Registered WebSocket for checkout: ${checkoutId}`);

      ws.send(
        JSON.stringify({
          type: 'registered',
          checkoutId: checkoutId,
          timestamp: new Date().toISOString(),
        })
      );

      // If payment already completed, send cached status
      if (session.status === 'completed') {
        ws.send(
          JSON.stringify({
            type: 'payment_completed',
            data: {
              checkoutId: checkoutId,
              transactionId: session.transactionId,
              amount: session.amount,
              phone: session.phone,
              reference: session.reference,
              timestamp: new Date().toISOString(),
            },
          })
        );
        console.log(`📡 Sent cached payment completion for: ${checkoutId}`);
      }
    } else {
      console.log(`⚠️ No session found for checkout: ${checkoutId}`);
      ws.send(
        JSON.stringify({
          type: 'error',
          message: 'Session not found',
          checkoutId: checkoutId,
        })
      );
    }
  }

  createPaymentSession(checkoutId, data) {
    const session = {
      userId: data.userId || null,
      amount: data.amount,
      phone: data.phone,
      reference: data.reference,
      status: 'pending',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      merchantRequestId: data.merchantRequestId || null,
      transactionId: null,
      errorCode: null,
      wsConnection: null,
      completedAt: null,
      retryCount: 0,
    };

    this.paymentSessions.set(checkoutId, session);
    console.log(`📝 Created payment session for checkout: ${checkoutId}`);
    return session;
  }

  updatePaymentStatus(checkoutId, status, data = {}) {
    const session = this.paymentSessions.get(checkoutId);
    if (!session) {
      console.log(`⚠️ Session not found for checkout: ${checkoutId}`);
      return false;
    }

    session.status = status;
    session.updatedAt = Date.now();
    session.transactionId = data.transactionId || session.transactionId;
    session.amount = data.amount || session.amount;
    session.phone = data.phone || session.phone;
    session.reference = data.reference || session.reference;
    session.errorCode = data.errorCode || null;
    session.retryCount += 1;

    if (status === 'completed') {
      session.completedAt = new Date();
    }

    this.paymentSessions.set(checkoutId, session);

    // Notify WebSocket client if connected
    if (
      session.wsConnection &&
      session.wsConnection.readyState === WebSocket.OPEN
    ) {
      const message = {
        type: `payment_${status}`,
        data: {
          checkoutId: checkoutId,
          transactionId: session.transactionId,
          amount: session.amount,
          phone: session.phone,
          reference: session.reference,
          timestamp: new Date().toISOString(),
        },
      };

      if (status === 'failed') {
        message.data.errorCode = session.errorCode;
      }

      session.wsConnection.send(JSON.stringify(message));
      console.log(
        `📡 WebSocket notification sent for checkout: ${checkoutId} - Status: ${status}`
      );
    }

    // Auto-cleanup after 1 hour
    if (status === 'completed' || status === 'failed') {
      setTimeout(() => {
        this.paymentSessions.delete(checkoutId);
        console.log(`🧹 Cleaned up session for checkout: ${checkoutId}`);
      }, 3600000);
    }

    return true;
  }

  getPaymentStatus(checkoutId) {
    const session = this.paymentSessions.get(checkoutId);
    if (!session) {
      return null;
    }

    return {
      status: session.status,
      transactionId: session.transactionId,
      amount: session.amount,
      phone: session.phone,
      reference: session.reference,
      completedAt: session.completedAt,
      updatedAt: session.updatedAt,
      errorCode: session.errorCode,
    };
  }

  cleanupWebSocket(ws) {
    for (const [checkoutId, session] of this.paymentSessions.entries()) {
      if (session.wsConnection === ws) {
        delete session.wsConnection;
        console.log(`🧹 Cleaned up WebSocket for checkout: ${checkoutId}`);
      }
    }
  }

  getActiveSessions() {
    return this.paymentSessions.size;
  }

  // Method for periodic status checking
  startStatusChecker(interval = 30000) {
    setInterval(() => {
      const pendingSessions = [];
      for (const [checkoutId, session] of this.paymentSessions.entries()) {
        if (session.status === 'pending') {
          // Check if session is too old (more than 5 minutes)
          const age = Date.now() - session.createdAt;
          if (age > 300000) {
            this.updatePaymentStatus(checkoutId, 'timeout', {
              errorCode: 'TIMEOUT',
              message: 'Payment timeout',
            });
            console.log(`⏰ Payment timeout for checkout: ${checkoutId}`);
          } else {
            pendingSessions.push(checkoutId);
          }
        }
      }

      if (pendingSessions.length > 0) {
        console.log(
          `⏳ Checking ${pendingSessions.length} pending payment sessions`
        );
      }
    }, interval);
  }
}

module.exports = PaymentWebSocket;
