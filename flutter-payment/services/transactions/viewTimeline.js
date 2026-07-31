const Flutterwave = require('flutterwave-node-v3');

const flw = new Flutterwave(
  process.env.FLW_PUBLIC_KEY,
  process.env.FLW_SECRET_KEY
);

const viewTimeline = async (payload) => {
  try {
    const response = await flw.Transaction.event(payload);
    return response;
  } catch (error) {
    console.error('View Timeline API error:', error);
    throw error;
  }
};

module.exports = viewTimeline;
