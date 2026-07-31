const express = require('express');
const cors = require('cors');
const http = require('http');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Import Payment WebSocket
const PaymentWebSocket = require('./websocket/paymentWebSocket');
const paymentWebSocket = new PaymentWebSocket(server);

// Import Payment Flow Routes
const initPaymentRouter = require('./routes/paymentFlow/initPaymentRouter');
const checkStatusRouter = require('./routes/paymentFlow/checkStatusRouter');
const webhookRouter = require('./routes/paymentFlow/webhookRouter');

// Set WebSocket reference in routes
initPaymentRouter.setPaymentWebSocket(paymentWebSocket);
checkStatusRouter.setPaymentWebSocket(paymentWebSocket);
webhookRouter.setPaymentWebSocket(paymentWebSocket);

// Middleware

// CORS - Allow all origins (quick fix for testing)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  //allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

app.use(express.json());

// Payment Flow Routes (Front-End Only)
app.use('/api/flow/initiate', initPaymentRouter.router);
app.use('/api/flow/status', checkStatusRouter.router);
app.use('/api/flow/webhook', webhookRouter.router);

// Health check
app.get('/api/flow/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    activeSessions: paymentWebSocket.getActiveSessions(),
    services: {
      mpesa: '/api/flow/initiate/mpesa',
      card: '/api/flow/initiate/card',
      bankTransfer: '/api/flow/initiate/bank-transfer',
      status: '/api/flow/status',
      webhook: '/api/flow/webhook',
    },
  });
});

// Start status checker (checks pending payments every 30 seconds)
paymentWebSocket.startStatusChecker(30000);

const PORT = process.env.FLOW_PORT || 3001;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Payment Flow Server is running!`);
  console.log(`📡 HTTP server: http://localhost:${PORT}`);
  console.log(`🔌 WebSocket server: ws://localhost:${PORT}`);
  console.log(`💰 Payment initiation: POST /api/flow/initiate/mpesa`);
  console.log(`💰 Card payment: POST /api/flow/initiate/card`);
  console.log(`💰 Bank transfer: POST /api/flow/initiate/bank-transfer`);
  console.log(`✅ Payment status: POST /api/flow/status`);
  console.log(`🔄 Webhook endpoint: POST /api/flow/webhook/flutterwave`);
  console.log(`❤️ Health check: GET /api/flow/health\n`);
});

module.exports = { app, server, paymentWebSocket };
