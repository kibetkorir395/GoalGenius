// routes/mpesaRouter.js
const express = require('express');
const router = express.Router();
const mpesa = require('../services/mpesa.js');

router.post('/', async (req, res) => {
  try {
    // 1. Destructure or extract incoming data from the request body
    const { amount, currency, email, phone_number, fullname } = req.body;

    // 2. Build the payload dynamically (generate unique tx_ref values)
    const payload = {
      tx_ref: `MC-${Date.now()}`, // Highly recommended to make this unique per transaction
      amount: amount || '10',
      currency: currency || 'KES',
      email: email || 'stefan.wexler@hotmail.eu',
      phone_number: phone_number, // Passed from client e.g. '25454...'
      fullname: fullname,
    };

    // 3. Call the service and wait for the result
    const result = await mpesa(payload);

    // 4. Send the result back to the frontend client
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    // Handle failures gracefully
    return res.status(500).json({
      success: false,
      message: 'Payment initiation failed',
      error: error.message,
    });
  }
});

module.exports = router;
