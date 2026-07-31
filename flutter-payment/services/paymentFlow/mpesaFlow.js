const Flutterwave = require('flutterwave-node-v3');

const flw = new Flutterwave(
  process.env.FLW_PUBLIC_KEY,
  process.env.FLW_SECRET_KEY
);

const mpesaFlow = {
  // Initiate M-Pesa payment
  initiate: async (payload) => {
    try {
      const response = await flw.MobileMoney.mpesa(payload);
      return response;
    } catch (error) {
      console.error('M-Pesa Flow initiation error:', error);
      throw error;
    }
  },

  // Verify M-Pesa payment status
  verify: async (transactionId) => {
    try {
      const response = await flw.Transaction.verify({ id: transactionId });
      return response;
    } catch (error) {
      console.error('M-Pesa Flow verification error:', error);
      throw error;
    }
  },

  // Verify by reference
  verifyByRef: async (tx_ref) => {
    try {
      const response = await flw.Transaction.verify_by_tx({ tx_ref });
      return response;
    } catch (error) {
      console.error('M-Pesa Flow verification by ref error:', error);
      throw error;
    }
  },
};

module.exports = mpesaFlow;
