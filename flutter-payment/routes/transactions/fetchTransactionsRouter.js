const express = require('express');
const router = express.Router();
const fetchTransactions = require('../../services/transactions/fetchTransactions');

router.post('/', async (req, res) => {
  try {
    const { from, to, page, limit } = req.body;

    const payload = {
      from: from || '2020-01-01',
      to: to || '2020-05-05',
      page: page || 1,
      limit: limit || 10,
    };

    const result = await fetchTransactions(payload);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
      error: error.message,
    });
  }
});

router.get('/', async (req, res) => {
  try {
    const { from, to, page, limit } = req.query;

    const payload = {
      from: from || '2020-01-01',
      to: to || '2020-05-05',
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
    };

    const result = await fetchTransactions(payload);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
      error: error.message,
    });
  }
});

module.exports = router;
