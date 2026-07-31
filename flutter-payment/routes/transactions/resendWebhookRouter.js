const express = require('express');
const router = express.Router();
const resendWebhook = require('../../services/transactions/resendWebhook');

router.post('/', async (req, res) => {
  try {
    const { tx_ref } = req.body;

    if (!tx_ref) {
      return res.status(400).json({
        success: false,
        message: 'Transaction reference (tx_ref) is required',
      });
    }

    const payload = {
      tx_ref: tx_ref,
    };

    const result = await resendWebhook(payload);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to resend webhook',
      error: error.message,
    });
  }
});

module.exports = router;
