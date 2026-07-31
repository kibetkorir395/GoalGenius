const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const mpesaFlow = require('../../services/paymentFlow/mpesaFlow');
const cardFlow = require('../../services/paymentFlow/cardFlow');
const bankTransferFlow = require('../../services/paymentFlow/bankTransferFlow');

// Make paymentWebSocket accessible
let paymentWebSocket = null;

const setPaymentWebSocket = (ws) => {
  paymentWebSocket = ws;
};

// Generate unique transaction reference
const generateTxRef = () => {
  return `FLW-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
};

// Initiate M-Pesa Payment
router.post('/mpesa', async (req, res) => {
  try {
    const { amount, phone, email, fullname, currency, userId } = req.body;

    if (!amount || !phone) {
      return res.status(400).json({
        success: false,
        error: 'Amount and phone are required',
      });
    }

    const tx_ref = generateTxRef();
    const checkoutId = `MPESA-${Date.now()}`;

    const payload = {
      tx_ref: tx_ref,
      amount: amount,
      currency: currency || 'KES',
      email: email || 'customer@example.com',
      phone_number: phone,
      fullname: fullname || 'Customer',
    };

    const response = await mpesaFlow.initiate(payload);

    if (response.status === 'success') {
      // Create payment session
      if (paymentWebSocket) {
        paymentWebSocket.createPaymentSession(checkoutId, {
          userId: userId || null,
          amount: amount,
          phone: phone,
          reference: tx_ref,
          merchantRequestId: response.data?.id || null,
        });
      }

      return res.status(200).json({
        success: true,
        checkoutId: checkoutId,
        tx_ref: tx_ref,
        data: response.data,
        message: 'M-Pesa payment initiated successfully',
      });
    } else {
      return res.status(400).json({
        success: false,
        error: response.message || 'Payment initiation failed',
        data: response,
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Initiate Card Payment
router.post('/card', async (req, res) => {
  try {
    const {
      card_number,
      cvv,
      expiry_month,
      expiry_year,
      amount,
      currency,
      email,
      fullname,
      phone_number,
      redirect_url,
      userId,
    } = req.body;

    if (!card_number || !cvv || !expiry_month || !expiry_year || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Card details and amount are required',
      });
    }

    const tx_ref = generateTxRef();
    const checkoutId = `CARD-${Date.now()}`;

    const payload = {
      card_number: card_number,
      cvv: cvv,
      expiry_month: expiry_month,
      expiry_year: expiry_year,
      amount: amount,
      currency: currency || 'NGN',
      email: email || 'customer@example.com',
      fullname: fullname || 'Customer',
      phone_number: phone_number || '09000000000',
      redirect_url: redirect_url || 'https://yourwebsite.com/callback',
      enckey: process.env.FLW_ENCRYPTION_KEY,
      tx_ref: tx_ref,
    };

    const response = await cardFlow.initiate(payload);

    if (response.status === 'success') {
      if (paymentWebSocket) {
        paymentWebSocket.createPaymentSession(checkoutId, {
          userId: userId || null,
          amount: amount,
          phone: phone_number || 'N/A',
          reference: tx_ref,
          merchantRequestId: response.data?.id || null,
        });
      }

      return res.status(200).json({
        success: true,
        checkoutId: checkoutId,
        tx_ref: tx_ref,
        data: response.data,
        message: 'Card payment initiated successfully',
      });
    } else {
      return res.status(400).json({
        success: false,
        error: response.message || 'Card payment initiation failed',
        data: response,
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Initiate Bank Transfer
router.post('/bank-transfer', async (req, res) => {
  try {
    const {
      amount,
      email,
      phone_number,
      currency,
      client_ip,
      device_fingerprint,
      userId,
    } = req.body;

    if (!amount) {
      return res.status(400).json({
        success: false,
        error: 'Amount is required',
      });
    }

    const tx_ref = generateTxRef();
    const checkoutId = `BT-${Date.now()}`;

    const payload = {
      tx_ref: tx_ref,
      amount: amount,
      email: email || 'customer@example.com',
      phone_number: phone_number || '054709929220',
      currency: currency || 'NGN',
      client_ip: client_ip || '154.123.220.1',
      device_fingerprint: device_fingerprint || '62wd23423rq324323qew1',
      expires: 3600,
    };

    const response = await bankTransferFlow.initiate(payload);

    if (response.status === 'success') {
      if (paymentWebSocket) {
        paymentWebSocket.createPaymentSession(checkoutId, {
          userId: userId || null,
          amount: amount,
          phone: phone_number || 'N/A',
          reference: tx_ref,
          merchantRequestId: response.data?.id || null,
        });
      }

      return res.status(200).json({
        success: true,
        checkoutId: checkoutId,
        tx_ref: tx_ref,
        data: response.data,
        message: 'Bank transfer initiated successfully',
      });
    } else {
      return res.status(400).json({
        success: false,
        error: response.message || 'Bank transfer initiation failed',
        data: response,
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Card PIN authorization
router.post('/card/authorize-pin', async (req, res) => {
  try {
    const { payload, pin, checkoutId } = req.body;

    if (!payload || !pin) {
      return res.status(400).json({
        success: false,
        error: 'Payload and PIN are required',
      });
    }

    payload.authorization = {
      mode: 'pin',
      fields: ['pin'],
      pin: pin,
    };

    const response = await cardFlow.initiate(payload);

    // Update session status if checkoutId provided
    if (checkoutId && paymentWebSocket) {
      const session = paymentWebSocket.paymentSessions?.get(checkoutId);
      if (session) {
        session.status = 'awaiting_otp';
        session.updatedAt = Date.now();
      }
    }

    return res.status(200).json({
      success: true,
      data: response,
      message: 'PIN authorization successful',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Card OTP validation
router.post('/card/validate-otp', async (req, res) => {
  try {
    const { otp, flw_ref, checkoutId } = req.body;

    if (!otp || !flw_ref) {
      return res.status(400).json({
        success: false,
        error: 'OTP and flw_ref are required',
      });
    }

    const response = await cardFlow.validate({
      otp: otp,
      flw_ref: flw_ref,
    });

    // Update session if checkoutId provided
    if (checkoutId && paymentWebSocket) {
      if (response.status === 'success') {
        paymentWebSocket.updatePaymentStatus(checkoutId, 'completed', {
          transactionId: response.data?.id || flw_ref,
        });
      } else {
        paymentWebSocket.updatePaymentStatus(checkoutId, 'failed', {
          errorCode: 'OTP_VALIDATION_FAILED',
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: response,
      message: 'OTP validation successful',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = { router, setPaymentWebSocket };
