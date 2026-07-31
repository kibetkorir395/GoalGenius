const express = require('express');
const router = express.Router();
const bankTransfer = require('../services/bankTransfer');

router.post('/', async (req, res) => {
  try {
    const {
      amount,
      email,
      phone_number,
      currency,
      client_ip,
      device_fingerprint,
      expires,
    } = req.body;

    const payload = {
      tx_ref: `BT-${Date.now()}`,
      amount: amount || '1500',
      email: email || 'johnmadakin@gmail.com',
      phone_number: phone_number || '054709929220',
      currency: currency || 'NGN',
      client_ip: client_ip || '154.123.220.1',
      device_fingerprint: device_fingerprint || '62wd23423rq324323qew1',
      expires: expires || 3600,
    };

    const result = await bankTransfer(payload);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Bank transfer initiation failed',
      error: error.message,
    });
  }
});

module.exports = router;
