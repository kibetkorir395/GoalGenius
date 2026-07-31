const express = require('express');
const router = express.Router();
const getTransactionFee = require('../../services/transactions/getTransactionFee');

router.post('/', async (req, res) => {
  try {
    const { amount, currency } = req.body;

    const payload = {
      amount: amount || '1000',
      currency: currency || 'NGN',
    };

    const result = await getTransactionFee(payload);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to get transaction fee',
      error: error.message,
    });
  }
});

router.get('/', async (req, res) => {
  try {
    const { amount, currency } = req.query;

    const payload = {
      amount: amount || '1000',
      currency: currency || 'NGN',
    };

    const result = await getTransactionFee(payload);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to get transaction fee',
      error: error.message,
    });
  }
});

module.exports = router;
