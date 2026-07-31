const express = require('express');
const router = express.Router();
const ussd = require('../services/ussd');

router.post('/', async (req, res) => {
  try {
    const { account_bank, amount, currency, email, phone_number, fullname } =
      req.body;

    const payload = {
      tx_ref: `USSD-${Date.now()}`,
      account_bank: account_bank || '058',
      amount: amount || '1500',
      currency: currency || 'NGN',
      email: email || 'user@flw.com',
      phone_number: phone_number || '07033923458',
      fullname: fullname || 'Yemi Desola',
    };

    const result = await ussd(payload);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'USSD charge initiation failed',
      error: error.message,
    });
  }
});

module.exports = router;
