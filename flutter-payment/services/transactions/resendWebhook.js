const Flutterwave = require('flutterwave-node-v3');

const flw = new Flutterwave(
  process.env.FLW_PUBLIC_KEY,
  process.env.FLW_SECRET_KEY
);

const resendWebhook = async (payload) => {
  try {
    const response = await flw.Transaction.resend_hooks(payload);
    return response;
  } catch (error) {
    console.error('Resend Webhook API error:', error);
    throw error;
  }
};

module.exports = resendWebhook;
