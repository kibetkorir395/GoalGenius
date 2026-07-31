const express = require('express');
const router = express.Router();

// Store reference to paymentWebSocket
let paymentWebSocket = null;

const setPaymentWebSocket = (ws) => {
  paymentWebSocket = ws;
};

// Check payment status
router.post('/', async (req, res) => {
  try {
    const { checkoutId } = req.body;

    if (!checkoutId) {
      return res.status(400).json({
        success: false,
        error: 'checkoutId is required',
      });
    }

    if (!paymentWebSocket) {
      return res.status(503).json({
        success: false,
        error: 'Payment service not available',
      });
    }

    const status = paymentWebSocket.getPaymentStatus(checkoutId);

    if (!status) {
      return res.status(404).json({
        success: false,
        status: 'not_found',
        message: 'Payment session not found',
      });
    }

    return res.status(200).json({
      success: true,
      checkoutId: checkoutId,
      ...status,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Check status via GET with checkoutId as parameter
router.get('/:checkoutId', async (req, res) => {
  try {
    const { checkoutId } = req.params;

    if (!checkoutId) {
      return res.status(400).json({
        success: false,
        error: 'checkoutId is required',
      });
    }

    if (!paymentWebSocket) {
      return res.status(503).json({
        success: false,
        error: 'Payment service not available',
      });
    }

    const status = paymentWebSocket.getPaymentStatus(checkoutId);

    if (!status) {
      return res.status(404).json({
        success: false,
        status: 'not_found',
        message: 'Payment session not found',
      });
    }

    return res.status(200).json({
      success: true,
      checkoutId: checkoutId,
      ...status,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Batch status check
router.post('/batch', async (req, res) => {
  try {
    const { checkoutIds } = req.body;

    if (!checkoutIds || !Array.isArray(checkoutIds)) {
      return res.status(400).json({
        success: false,
        error: 'checkoutIds array is required',
      });
    }

    if (!paymentWebSocket) {
      return res.status(503).json({
        success: false,
        error: 'Payment service not available',
      });
    }

    const results = {};
    for (const checkoutId of checkoutIds) {
      const status = paymentWebSocket.getPaymentStatus(checkoutId);
      results[checkoutId] = status || { status: 'not_found' };
    }

    return res.status(200).json({
      success: true,
      results: results,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = { router, setPaymentWebSocket };
