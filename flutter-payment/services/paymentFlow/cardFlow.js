const Flutterwave = require('flutterwave-node-v3');

const flw = new Flutterwave(
  process.env.FLW_PUBLIC_KEY,
  process.env.FLW_SECRET_KEY
);

const cardFlow = {
  // Initiate Card payment
  initiate: async (payload) => {
    try {
      const response = await flw.Charge.card(payload);
      return response;
    } catch (error) {
      console.error('Card Flow initiation error:', error);
      throw error;
    }
  },

  // Verify Card payment
  verify: async (transactionId) => {
    try {
      const response = await flw.Transaction.verify({ id: transactionId });
      return response;
    } catch (error) {
      console.error('Card Flow verification error:', error);
      throw error;
    }
  },

  // Validate OTP
  validate: async (payload) => {
    try {
      const response = await flw.Charge.validate(payload);
      return response;
    } catch (error) {
      console.error('Card Flow validation error:', error);
      throw error;
    }
  },
};

module.exports = cardFlow;
