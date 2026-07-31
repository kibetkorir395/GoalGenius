const Flutterwave = require('flutterwave-node-v3');
const flw = new Flutterwave(
  process.env.FLW_PUBLIC_KEY,
  process.env.FLW_SECRET_KEY
);

const bankTransfer = async (payload) => {
  try {
    const response = await flw.Charge.bank_transfer(payload);
    return response;
  } catch (error) {
    console.error('Bank Transfer API error:', error);
    throw error;
  }
};

module.exports = bankTransfer;
