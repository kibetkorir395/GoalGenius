const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const cors = require('cors');
const http = require('http');
const path = require('path');
const { resolve } = require('path');
const axios = require('axios');
require('dotenv').config();

// Import all routers
const mpesaRouter = require('./routes/mpesaRouter');
const cardRouter = require('./routes/cardRouter');
const bankTransferRouter = require('./routes/bankTransferRouter');
const ngBankAccountRouter = require('./routes/ngBankAccountRouter');
const ukBankAccountRouter = require('./routes/ukBankAccountRouter');
const achPaymentRouter = require('./routes/achPaymentRouter');
const ussdRouter = require('./routes/ussdRouter');
const ghanaMobileMoneyRouter = require('./routes/ghanaMobileMoneyRouter');
const rwandaMobileMoneyRouter = require('./routes/rwandaMobileMoneyRouter');
const ugandaMobileMoneyRouter = require('./routes/ugandaMobileMoneyRouter');
const francophoneMobileMoneyRouter = require('./routes/francophoneMobileMoneyRouter');
const zambiaMobileMoneyRouter = require('./routes/zambiaMobileMoneyRouter');
const tanzaniaMobileMoneyRouter = require('./routes/tanzaniaMobileMoneyRouter');
const enairaRouter = require('./routes/enairaRouter');
const applePayRouter = require('./routes/applePayRouter');
const googlePayRouter = require('./routes/googlePayRouter');

// Import transaction routers
const fetchTransactionsRouter = require('./routes/transactions/fetchTransactionsRouter');
const getTransactionFeeRouter = require('./routes/transactions/getTransactionFeeRouter');
const resendWebhookRouter = require('./routes/transactions/resendWebhookRouter');
const verifyTransactionRouter = require('./routes/transactions/verifyTransactionRouter');
const verifyTransactionByRefRouter = require('./routes/transactions/verifyTransactionByRefRouter');
const createRefundRouter = require('./routes/transactions/createRefundRouter');
const viewTimelineRouter = require('./routes/transactions/viewTimelineRouter');

// ============== NEW: Import Virtual Card routers ==============
const createVirtualCardRouter = require('./routes/virtualCards/createVirtualCardRouter');
const fetchAllVirtualCardsRouter = require('./routes/virtualCards/fetchAllVirtualCardsRouter');
const fetchVirtualCardRouter = require('./routes/virtualCards/fetchVirtualCardRouter');
const fundVirtualCardRouter = require('./routes/virtualCards/fundVirtualCardRouter');
const withdrawVirtualCardRouter = require('./routes/virtualCards/withdrawVirtualCardRouter');
const terminateVirtualCardRouter = require('./routes/virtualCards/terminateVirtualCardRouter');
const blockVirtualCardRouter = require('./routes/virtualCards/blockVirtualCardRouter');
const unblockVirtualCardRouter = require('./routes/virtualCards/unblockVirtualCardRouter');
const getVirtualCardTransactionsRouter = require('./routes/virtualCards/getVirtualCardTransactionsRouter');

const app = express();
const PORT = process.env.PORT || 3010;
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
// CORS - Allow all origins
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Add this line to use main.ejs as layout
app.use(expressLayouts);
app.set('layout', 'layouts/main');  // This tells it to use main.ejs

// Middleware to make base URL available in all routes
app.use((req, res, next) => {
  const protocol = req.protocol;
  const host = req.get('host');
  const baseUrl = `${protocol}://${host}`;
  
  // Make available in res.locals for EJS templates
  res.locals.apiBaseUrl = baseUrl;
  
  // Also make available in req for routes
  req.apiBaseUrl = baseUrl;
  
  next();
});

// Routes
app.get('/', (req, res) => {
  res.render('pages/index', {
      title: 'API Documentation',
      apiBaseUrl: req.apiBaseUrl, // Dynamic base URL
      currentPage: 'home'
  });
});

app.get('/endpoints/payments', (req, res) => {
  res.render('pages/endpoints/payments', {
      title: 'Payment API Documentation',
      apiBaseUrl: req.apiBaseUrl, // Dynamic base URL
      currentPage: 'payments'
  });
});

app.get('/endpoints/transactions', (req, res) => {
  res.render('pages/endpoints/transactions', {
      title: 'Transaction API Documentation',
      apiBaseUrl: req.apiBaseUrl, // Dynamic base URL
      currentPage: 'transactions'
  });
});

app.get('/endpoints/virtual-cards', (req, res) => {
  res.render('pages/endpoints/virtual-cards', {
      title: 'Virtual Card API Documentation',
      apiBaseUrl: req.apiBaseUrl, // Dynamic base URL
      currentPage: 'virtual-cards'
  });
});

// API Proxy endpoints for testing
app.post('/api/proxy', async (req, res) => {
  try {
      const { url, method, headers, body } = req.body;
      const response = await axios({
          method: method || 'POST',
          url: url,
          headers: headers || {},
          data: body || {},
          timeout: 30000
      });
      res.json(response.data);
  } catch (error) {
      res.status(error.response?.status || 500).json({
          error: error.message,
          response: error.response?.data
      });
  }
});

// API Routes
app.use('/api/mpesa', mpesaRouter);
app.use('/api/card', cardRouter);
app.use('/api/bank-transfer', bankTransferRouter);
app.use('/api/ng-bank-account', ngBankAccountRouter);
app.use('/api/uk-bank-account', ukBankAccountRouter);
app.use('/api/ach-payment', achPaymentRouter);
app.use('/api/ussd', ussdRouter);
app.use('/api/ghana-mobile-money', ghanaMobileMoneyRouter);
app.use('/api/rwanda-mobile-money', rwandaMobileMoneyRouter);
app.use('/api/uganda-mobile-money', ugandaMobileMoneyRouter);
app.use('/api/francophone-mobile-money', francophoneMobileMoneyRouter);
app.use('/api/zambia-mobile-money', zambiaMobileMoneyRouter);
app.use('/api/tanzania-mobile-money', tanzaniaMobileMoneyRouter);
app.use('/api/enaira', enairaRouter);
app.use('/api/apple-pay', applePayRouter);
app.use('/api/google-pay', googlePayRouter);

// ============== Transaction API Routes ==============
app.use('/api/transactions/fetch', fetchTransactionsRouter);
app.use('/api/transactions/fee', getTransactionFeeRouter);
app.use('/api/transactions/resend-webhook', resendWebhookRouter);
app.use('/api/transactions/verify', verifyTransactionRouter);
app.use('/api/transactions/verify-by-ref', verifyTransactionByRefRouter);
app.use('/api/transactions/refund', createRefundRouter);
app.use('/api/transactions/timeline', viewTimelineRouter);

// ============== NEW: Virtual Card API Routes ==============
app.use('/api/virtual-cards/create', createVirtualCardRouter);
app.use('/api/virtual-cards/all', fetchAllVirtualCardsRouter);
app.use('/api/virtual-cards/fetch', fetchVirtualCardRouter);
app.use('/api/virtual-cards/fund', fundVirtualCardRouter);
app.use('/api/virtual-cards/withdraw', withdrawVirtualCardRouter);
app.use('/api/virtual-cards/terminate', terminateVirtualCardRouter);
app.use('/api/virtual-cards/block', blockVirtualCardRouter);
app.use('/api/virtual-cards/unblock', unblockVirtualCardRouter);
app.use('/api/virtual-cards/transactions', getVirtualCardTransactionsRouter);

// Payment Flow Routes (Front-End Only)
app.use('/api/flow/initiate', initPaymentRouter.router);
app.use('/api/flow/status', checkStatusRouter.router);
app.use('/api/flow/webhook', webhookRouter.router);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date(),
    services: [
      '/api/mpesa',
      '/api/card',
      '/api/bank-transfer',
      '/api/ng-bank-account',
      '/api/uk-bank-account',
      '/api/ach-payment',
      '/api/ussd',
      '/api/ghana-mobile-money',
      '/api/rwanda-mobile-money',
      '/api/uganda-mobile-money',
      '/api/francophone-mobile-money',
      '/api/zambia-mobile-money',
      '/api/tanzania-mobile-money',
      '/api/enaira',
      '/api/apple-pay',
      '/api/google-pay',
    ],

    transactions: [
      '/api/transactions/fetch',
      '/api/transactions/fee',
      '/api/transactions/resend-webhook',
      '/api/transactions/verify',
      '/api/transactions/verify-by-ref',
      '/api/transactions/refund',
      '/api/transactions/timeline',
    ],

    virtualCards: [
      '/api/virtual-cards/create',
      '/api/virtual-cards/all',
      '/api/virtual-cards/fetch',
      '/api/virtual-cards/fund',
      '/api/virtual-cards/withdraw',
      '/api/virtual-cards/terminate',
      '/api/virtual-cards/block',
      '/api/virtual-cards/unblock',
      '/api/virtual-cards/transactions'
    ]
  });
});

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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`💳 Payment endpoints available at /api/*`);
  console.log(`📊 Transaction endpoints available at /api/transactions/*`);
  console.log(`💳 Virtual Card endpoints available at /api/virtual-cards/*`);

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

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

module.exports = { app, server, paymentWebSocket };
