const express = require('express');
const router = express.Router();
const verifyTransactionByRef = require('../../services/transactions/verifyTransactionByRef');

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

    const result = await verifyTransactionByRef(payload);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to verify transaction by reference',
      error: error.message,
    });
  }
});

router.get('/:tx_ref', async (req, res) => {
  try {
    const { tx_ref } = req.params;

    if (!tx_ref) {
      return res.status(400).json({
        success: false,
        message: 'Transaction reference (tx_ref) is required',
      });
    }

    const payload = {
      tx_ref: tx_ref,
    };

    const result = await verifyTransactionByRef(payload);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to verify transaction by reference',
      error: error.message,
    });
  }
});

module.exports = router;
