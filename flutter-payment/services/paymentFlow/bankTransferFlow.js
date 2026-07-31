const Flutterwave = require('flutterwave-node-v3');

const flw = new Flutterwave(
  process.env.FLW_PUBLIC_KEY,
  process.env.FLW_SECRET_KEY
);

const bankTransferFlow = {
  // Initiate Bank Transfer
  initiate: async (payload) => {
    try {
      const response = await flw.Charge.bank_transfer(payload);
      return response;
    } catch (error) {
      console.error('Bank Transfer Flow initiation error:', error);
      throw error;
    }
  },

  // Verify Bank Transfer
  verify: async (transactionId) => {
    try {
      const response = await flw.Transaction.verify({ id: transactionId });
      return response;
    } catch (error) {
      console.error('Bank Transfer Flow verification error:', error);
      throw error;
    }
  },
};

module.exports = bankTransferFlow;
