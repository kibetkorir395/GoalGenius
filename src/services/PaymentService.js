const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

async function safeJson(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { error: "Invalid JSON response", raw: text, status: response.status };
  }
}

export const PaymentService = {
  async initiateMpesa(amount, currency, phone, email, fullname) {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/payment/initiate/mpesa`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANON_KEY}`,
        'apikey': ANON_KEY,
      },
      body: JSON.stringify({
        amount: amount.toString(),
        currency: currency || 'KES',
        phone,
        email: email || 'customer@example.com',
        fullname: fullname || 'Customer',
      }),
    });
    const data = await safeJson(response);
    if (!response.ok) throw new Error(data.error || data.message || `Payment failed: ${response.status}`);
    return data;
  },

  async checkStatus(checkoutId) {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/payment/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANON_KEY}`,
        'apikey': ANON_KEY,
      },
      body: JSON.stringify({ checkoutId }),
    });
    const data = await safeJson(response);
    if (!response.ok) throw new Error(data.error || data.message || `Status check failed: ${response.status}`);
    return data;
  },

  pollTransaction(checkoutId, onSuccess, onFailure, maxAttempts = 30) {
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const data = await PaymentService.checkStatus(checkoutId);
        if (data.success && data.status === 'SUCCESS') {
          clearInterval(interval);
          onSuccess(data);
        } else if (data.status === 'FAILED') {
          clearInterval(interval);
          onFailure(data);
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          onFailure({ timeout: true });
        }
      } catch (error) {
        if (attempts >= maxAttempts) {
          clearInterval(interval);
          onFailure({ timeout: true, error: error.message });
        }
      }
    }, 5000);
    return () => clearInterval(interval);
  },

  async verifyKora(reference) {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/payment/kora/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANON_KEY}`,
        'apikey': ANON_KEY,
      },
      body: JSON.stringify({ reference }),
    });
    const data = await safeJson(response);
    if (!response.ok) throw new Error(data.error || data.message || `Verification failed: ${response.status}`);
    return data;
  },

  async initiateCard(amount, currency, email, fullname, card_number, cvv, expiry_month, expiry_year, pin) {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/payment/initiate/card`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANON_KEY}`,
        'apikey': ANON_KEY,
      },
      body: JSON.stringify({
        amount: amount.toString(),
        currency: currency || 'KES',
        email,
        fullname,
        card_number,
        cvv,
        expiry_month,
        expiry_year,
        pin,
      }),
    });
    const data = await safeJson(response);
    if (!response.ok) throw new Error(data.error || data.message || `Payment failed: ${response.status}`);
    return data;
  },
};
