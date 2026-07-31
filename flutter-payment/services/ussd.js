const Flutterwave = require('flutterwave-node-v3');
const flw = new Flutterwave(
  process.env.FLW_PUBLIC_KEY,
  process.env.FLW_SECRET_KEY
);

const ussd = async (payload) => {
  try {
    const response = await flw.Charge.ussd(payload);
    return response;
  } catch (error) {
    console.error('USSD API error:', error);
    throw error;
  }
};

module.exports = ussd;
