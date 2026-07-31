const Flutterwave = require('flutterwave-node-v3');

const flw = new Flutterwave(
  process.env.FLW_PUBLIC_KEY,
  process.env.FLW_SECRET_KEY
);

const createRefund = async (payload) => {
  try {
    const response = await flw.Transaction.refund(payload);
    return response;
  } catch (error) {
    console.error('Create Refund API error:', error);
    throw error;
  }
};

module.exports = createRefund;
