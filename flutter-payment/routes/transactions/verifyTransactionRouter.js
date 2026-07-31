const express = require('express');
const router = express.Router();
const verifyTransaction = require('../../services/transactions/verifyTransaction');

router.post('/', async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Transaction ID is required',
      });
    }

    const payload = {
      id: id,
    };

    const result = await verifyTransaction(payload);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to verify transaction',
      error: error.message,
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Transaction ID is required',
      });
    }

    const payload = {
      id: id,
    };

    const result = await verifyTransaction(payload);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to verify transaction',
      error: error.message,
    });
  }
});

module.exports = router;
