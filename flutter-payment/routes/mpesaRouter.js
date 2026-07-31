const express = require('express');
const router = express.Router();
const mpesa = require('../services/mpesa');

router.post('/', async (req, res) => {
  try {
    const { amount, currency, email, phone_number, fullname } = req.body;

    const payload = {
      tx_ref: `MC-${Date.now()}`,
      amount: amount || '10',
      currency: currency || 'KES',
      email: email || 'stefan.wexler@hotmail.eu',
      phone_number: phone_number,
      fullname: fullname || 'Customer',
    };

    const result = await mpesa(payload);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'M-Pesa payment initiation failed',
      error: error.message,
    });
  }
});

module.exports = router;
