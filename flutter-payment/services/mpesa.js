const Flutterwave = require('flutterwave-node-v3');
const flw = new Flutterwave(
  process.env.FLW_PUBLIC_KEY,
  process.env.FLW_SECRET_KEY
);

const mpesa = async (payload) => {
  try {
    const response = await flw.MobileMoney.mpesa(payload);
    return response;
  } catch (error) {
    console.error('M-Pesa API error:', error);
    throw error;
  }
};

module.exports = mpesa;
