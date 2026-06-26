const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

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
    if (!response.ok) throw new Error(`Payment initiation failed: ${response.status}`);
    return await response.json();
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
    if (!response.ok) throw new Error(`Status check failed: ${response.status}`);
    return await response.json();
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
          onFailure({ timeout: true });
        }
      }
    }, 5000);
    return () => clearInterval(interval);
  },
};
