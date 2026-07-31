const Flutterwave = require('flutterwave-node-v3');

const flw = new Flutterwave(
  process.env.FLW_PUBLIC_KEY,
  process.env.FLW_SECRET_KEY
);

const getTransactionFee = async (payload) => {
  try {
    const response = await flw.Transaction.fee(payload);
    return response;
  } catch (error) {
    console.error('Get Transaction Fee API error:', error);
    throw error;
  }
};

module.exports = getTransactionFee;
