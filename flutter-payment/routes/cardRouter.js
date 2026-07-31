const express = require('express');
const router = express.Router();
const card = require('../services/card');

router.post('/', async (req, res) => {
  try {
    const {
      card_number,
      cvv,
      expiry_month,
      expiry_year,
      amount,
      currency,
      email,
      fullname,
      phone_number,
      redirect_url,
    } = req.body;

    const payload = {
      card_number: card_number,
      cvv: cvv,
      expiry_month: expiry_month,
      expiry_year: expiry_year,
      amount: amount || '100',
      currency: currency || 'NGN',
      email: email || 'developers@flutterwavego.com',
      fullname: fullname || 'Flutterwave Developers',
      phone_number: phone_number || '09000000000',
      redirect_url: redirect_url || 'https://www.google.com',
      enckey: process.env.FLW_ENCRYPTION_KEY,
      tx_ref: `CARD-${Date.now()}`,
    };

    const result = await card(payload);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Card payment initiation failed',
      error: error.message,
    });
  }
});

// Route for PIN authorization
router.post('/authorize/pin', async (req, res) => {
  try {
    const { payload, pin } = req.body;

    payload.authorization = {
      mode: 'pin',
      fields: ['pin'],
      pin: pin,
    };

    const result = await card(payload);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Card PIN authorization failed',
      error: error.message,
    });
  }
});

// Route for OTP validation
router.post('/validate', async (req, res) => {
  try {
    const { otp, flw_ref } = req.body;

    const flw = new Flutterwave(
      process.env.FLW_PUBLIC_KEY,
      process.env.FLW_SECRET_KEY
    );

    const result = await flw.Charge.validate({
      otp: otp,
      flw_ref: flw_ref,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'OTP validation failed',
      error: error.message,
    });
  }
});

module.exports = router;
