const Flutterwave = require('flutterwave-node-v3');

const flw = new Flutterwave(
  process.env.FLW_PUBLIC_KEY,
  process.env.FLW_SECRET_KEY
);

const fetchTransactions = async (payload) => {
  try {
    const response = await flw.Transaction.fetch(payload);
    return response;
  } catch (error) {
    console.error('Fetch Transactions API error:', error);
    throw error;
  }
};

module.exports = fetchTransactions;
