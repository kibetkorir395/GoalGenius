const PAYMENT_API_BASE = "https://genuine-flow-production-b0ae.up.railway.app/api";
const appId = import.meta.env.VITE_APP_ID

async function safeJson(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { error: "Invalid JSON response", raw: text, status: response.status };
  }
}

function buildHeaders() {
  return { "Content-Type": "application/json" };
}

function handleError(data, response, fallback) {
  const message =
    data?.message ||
    data?.error ||
    data?.paystack_error?.message ||
    data?.error_type ||
    `${fallback}: ${response.status}`;
  return new Error(message);
}

export const PaymentApiService = {
  async initialize({ email, amount, phone, userId, activation_type }) {
    const response = await fetch(`${PAYMENT_API_BASE}/initialize`, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify({
        appId,
        email,
        amount: amount.toString(),
        phone,
        userId: userId || "anonymous",
        activation_type: activation_type || "account_activation"
      }),
    });
    const data = await safeJson(response);
    if (!response.ok || !data.success) {
      throw handleError(data, response, "Payment initialization failed");
    }
    return data;
  },

  async checkStatus(reference) {
    const response = await fetch(`${PAYMENT_API_BASE}/status/${encodeURIComponent(reference)}?appId=${appId}`, {
      method: "GET",
      headers: buildHeaders(),
    });
    const data = await safeJson(response);
    if (!response.ok || !data.success) {
      throw handleError(data, response, "Status check failed");
    }
    return data;
  },

  async verify(reference) {
    const response = await fetch(`${PAYMENT_API_BASE}/verify/${encodeURIComponent(reference)}?appId=${appId}`, {
      method: "GET",
      headers: buildHeaders(),
    });
    const data = await safeJson(response);
    if (!response.ok || !data.success) {
      throw handleError(data, response, "Verification failed");
    }
    return data;
  },

  async submitOtp(reference, otp) {
    const response = await fetch(`${PAYMENT_API_BASE}/submit-otp`, {
      appId,
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify({ otp: otp.toString(), reference }),
    });
    const data = await safeJson(response);
    if (!response.ok || !data.success) {
      throw handleError(data, response, "OTP submission failed");
    }
    return data;
  },

  // Polls /api/status/:reference every 5s. Resolves on paid === true,
  // rejects on terminal failure (can_retry) or timeout. If the gateway
  // requests an OTP, calls onRequireOtp(reference) and suspends polling
  // until resume()/cancel() is called.
  pollTransaction(reference, onSuccess, onFailure, onRequireOtp, maxAttempts = 36) {
    let attempts = 0;
    let suspended = false;
    let cancelled = false;
    let timer = null;

    const tick = async () => {
      if (cancelled || suspended) return;
      attempts++;
      try {
        const data = await PaymentApiService.checkStatus(reference);
        if (cancelled) return;

        if (data.paid) {
          const verified = await PaymentApiService.verify(reference).catch(() => null);
          onSuccess(verified || data);
          return;
        }
        if (data.requires_action && data.status === "send_otp" && onRequireOtp) {
          suspended = true;
          onRequireOtp(reference);
          return;
        }
        if (data.can_retry) {
          onFailure({ message: data.message || "Payment failed. Please try again." });
          return;
        }
        if (attempts >= maxAttempts) {
          onFailure({ timeout: true });
        }
      } catch (error) {
        if (cancelled) return;
        if (attempts >= maxAttempts) {
          onFailure({ timeout: true, error: error.message });
        }
      }
    };

    timer = setInterval(tick, 5000);
    tick();

    return {
      async resume() {
        if (cancelled) return;
        suspended = false;
        attempts = 0;
        tick();
      },
      cancel() {
        cancelled = true;
        if (timer) clearInterval(timer);
      },
    };
  },
};
