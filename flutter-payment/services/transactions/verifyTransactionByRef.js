const Flutterwave = require('flutterwave-node-v3');

const flw = new Flutterwave(
  process.env.FLW_PUBLIC_KEY,
  process.env.FLW_SECRET_KEY
);

const verifyTransactionByRef = async (payload) => {
  try {
    const response = await flw.Transaction.verify_by_tx(payload);
    return response;
  } catch (error) {
    console.error('Verify Transaction By Reference API error:', error);
    throw error;
  }
};

module.exports = verifyTransactionByRef;
