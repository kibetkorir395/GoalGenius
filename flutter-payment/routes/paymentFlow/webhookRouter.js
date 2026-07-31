const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// Store reference to paymentWebSocket
let paymentWebSocket = null;

const setPaymentWebSocket = (ws) => {
  paymentWebSocket = ws;
};

// Verify webhook signature
const verifySignature = (rawBody, signature, secret) => {
  if (!signature || !secret) {
    console.error('Missing signature or secret');
    return false;
  }

  try {
    const expectedSignature =
      'sha256=' +
      crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(signature)
    );
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
};

// Flutterwave webhook endpoint
router.post('/flutterwave', async (req, res) => {
  console.log('📨 Flutterwave webhook received:', new Date().toISOString());

  try {
    // Verify webhook signature (if you have a secret)
    const signature = req.headers['verif-hash'];
    // Add your signature verification logic here

    const {
      event,
      data: {
        id: transactionId,
        tx_ref,
        amount,
        currency,
        status,
        customer: { email, phone_number, name },
      },
    } = req.body;

    console.log('Webhook payload:', JSON.stringify(req.body, null, 2));

    // Check if this is a successful transaction
    const isSuccessful = status === 'successful' || status === 'completed';

    if (isSuccessful && paymentWebSocket) {
      // Find the checkoutId from tx_ref or transactionId
      // You would need to maintain a mapping between tx_ref and checkoutId
      // For simplicity, we'll iterate through sessions
      const sessions = paymentWebSocket.paymentSessions;

      for (const [checkoutId, session] of sessions.entries()) {
        if (
          session.reference === tx_ref ||
          session.transactionId === transactionId
        ) {
          // Update session status
          paymentWebSocket.updatePaymentStatus(checkoutId, 'completed', {
            transactionId: transactionId,
            amount: amount,
            phone: phone_number || session.phone,
            reference: tx_ref,
          });

          console.log(`✅ Payment completed for checkout: ${checkoutId}`);
          break;
        }
      }
    } else if (!isSuccessful && paymentWebSocket) {
      // Handle failed payment
      const sessions = paymentWebSocket.paymentSessions;

      for (const [checkoutId, session] of sessions.entries()) {
        if (
          session.reference === tx_ref ||
          session.transactionId === transactionId
        ) {
          paymentWebSocket.updatePaymentStatus(checkoutId, 'failed', {
            errorCode: status || 'FAILED',
          });
          console.log(`❌ Payment failed for checkout: ${checkoutId}`);
          break;
        }
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: error.message });
  }
});

// HashPay style webhook endpoint (for compatibility)
router.post('/hashpay', async (req, res) => {
  console.log('📨 HashPay webhook received:', new Date().toISOString());

  try {
    // Verify signature
    const signature = req.headers['x-hashpay-signature'];
    const webhookSecret =
      process.env.HASHPAY_WEBHOOK_SECRET || 'your-secret-key';

    if (!verifySignature(JSON.stringify(req.body), signature, webhookSecret)) {
      console.error('❌ Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const {
      ResponseCode,
      ResponseDescription,
      CheckoutRequestID,
      TransactionID,
      TransactionAmount,
      Msisdn,
      TransactionReference,
    } = req.body;

    const isSuccessful = ResponseCode === '0' || ResponseCode === 0;
    console.log(
      `Payment ${
        isSuccessful ? 'successful' : 'failed'
      } for checkout: ${CheckoutRequestID}`
    );

    if (isSuccessful && CheckoutRequestID && paymentWebSocket) {
      paymentWebSocket.updatePaymentStatus(CheckoutRequestID, 'completed', {
        transactionId: TransactionID,
        amount: TransactionAmount,
        phone: Msisdn,
        reference: TransactionReference,
      });
    } else if (!isSuccessful && CheckoutRequestID && paymentWebSocket) {
      paymentWebSocket.updatePaymentStatus(CheckoutRequestID, 'failed', {
        errorCode: ResponseCode,
      });
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('HashPay webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generic webhook endpoint
router.post('/generic', async (req, res) => {
  console.log('📨 Generic webhook received:', new Date().toISOString());

  try {
    const {
      checkoutId,
      status,
      transactionId,
      amount,
      phone,
      reference,
      errorCode,
    } = req.body;

    if (!checkoutId) {
      return res.status(400).json({ error: 'checkoutId is required' });
    }

    if (paymentWebSocket) {
      const isValidStatus = ['completed', 'failed', 'pending'].includes(status);

      if (isValidStatus) {
        paymentWebSocket.updatePaymentStatus(checkoutId, status, {
          transactionId: transactionId,
          amount: amount,
          phone: phone,
          reference: reference,
          errorCode: errorCode,
        });
      } else {
        console.log(`⚠️ Invalid status received: ${status}`);
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Generic webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = { router, setPaymentWebSocket };
