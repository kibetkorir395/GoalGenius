const express = require('express');
const router = express.Router();
const createRefund = require('../../services/transactions/createRefund');

router.post('/', async (req, res) => {
  try {
    const { id, amount } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Transaction ID is required',
      });
    }

    const payload = {
      id: id,
      amount: amount || undefined, // Optional, if not provided full amount will be refunded
    };

    const result = await createRefund(payload);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create refund',
      error: error.message,
    });
  }
});

module.exports = router;
