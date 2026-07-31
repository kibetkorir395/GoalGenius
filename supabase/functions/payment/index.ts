import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const API_BASE = "https://flutter-payment-production.up.railway.app";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function safeJson(response: Response): Promise<any> {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text, status: response.status };
  }
}

// The upstream flutter-payment API reports lifecycle statuses
// ('pending','awaiting_otp','completed','failed','timeout','not_found').
// The frontend's pollTransaction() only terminates on 'SUCCESS' or 'FAILED',
// so every response is translated here. Without this, polling runs forever.
function translateStatus(upstream: string | undefined): string {
  switch (upstream) {
    case "completed":
    case "success":
      return "SUCCESS";
    case "failed":
    case "timeout":
    case "not_found":
      return "FAILED";
    case "awaiting_otp":
    case "pending":
    default:
      return "pending";
  }
}

// Best-effort persistence. A DB failure must never break a payment, so all
// writes are swallowed and only logged.
async function upsertSession(row: Record<string, unknown>): Promise<void> {
  try {
    const { error } = await supabase
      .from("payments")
      .upsert(row, { onConflict: "checkout_id" });
    if (error) console.error("payments upsert error:", error.message);
  } catch (e) {
    console.error("payments upsert threw:", (e as Error)?.message);
  }
}

async function updateSession(
  checkoutId: string,
  patch: Record<string, unknown>,
): Promise<void> {
  try {
    const { error } = await supabase
      .from("payments")
      .update(patch)
      .eq("checkout_id", checkoutId);
    if (error) console.error("payments update error:", error.message);
  } catch (e) {
    console.error("payments update threw:", (e as Error)?.message);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.replace("/payment", "");

    // ---------- M-Pesa initiate ----------
    if (req.method === "POST" && path === "/initiate/mpesa") {
      const body = await req.json();
      const { amount, currency, phone, email, fullname } = body;

      if (!amount || !phone) {
        return json({ success: false, error: "Amount and phone are required" }, 400);
      }

      const response = await fetch(`${API_BASE}/api/flow/initiate/mpesa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amount.toString(),
          currency: currency || "KES",
          phone,
          email: email || "customer@example.com",
          fullname: fullname || "Customer",
        }),
      });

      const data = await safeJson(response);

      if (response.ok && data?.success && data.checkoutId) {
        await upsertSession({
          checkout_id: data.checkoutId,
          tx_ref: data.tx_ref ?? null,
          user_email: email || "customer@example.com",
          amount: Number(amount),
          currency: currency || "KES",
          phone,
          fullname: fullname || "Customer",
          channel: "mpesa",
          payment_method: "mpesa",
          status: "pending",
          merchant_request_id: data?.data?.id ?? null,
        });
      }

      return json(data, response.status);
    }

    // ---------- Status poll ----------
    if (req.method === "POST" && path === "/status") {
      const body = await req.json();
      const { checkoutId } = body;

      if (!checkoutId) {
        return json({ success: false, error: "checkoutId is required" }, 400);
      }

      const response = await fetch(`${API_BASE}/api/flow/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkoutId }),
      });

      const data = await safeJson(response);

      if (data && typeof data === "object") {
        const upstreamStatus = data.status as string | undefined;
        data.status = translateStatus(upstreamStatus);

        // Persist the terminal state so the record survives instance restarts.
        if (upstreamStatus === "completed") {
          await updateSession(checkoutId, {
            status: "completed",
            transaction_id: data.transactionId ?? null,
            completed_at: data.completedAt ? new Date(data.completedAt).toISOString() : new Date().toISOString(),
          });
        } else if (upstreamStatus === "failed" || upstreamStatus === "timeout") {
          await updateSession(checkoutId, {
            status: upstreamStatus === "timeout" ? "timeout" : "failed",
            error_code: data.errorCode ?? upstreamStatus,
            completed_at: new Date().toISOString(),
          });
        }
      }

      return json(data, response.status);
    }

    // ---------- Card initiate ----------
    if (req.method === "POST" && path === "/initiate/card") {
      const body = await req.json();
      const {
        amount, currency, email, fullname,
        card_number, cvv, expiry_month, expiry_year, pin,
      } = body;

      if (!card_number || !cvv || !expiry_month || !expiry_year || !amount) {
        return json({ success: false, error: "Card details and amount are required" }, 400);
      }

      const response = await fetch(`${API_BASE}/api/flow/initiate/card`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amount.toString(),
          currency: currency || "KES",
          email: email || "customer@example.com",
          fullname: fullname || "Customer",
          card_number,
          cvv,
          expiry_month,
          expiry_year,
          pin,
        }),
      });

      const data = await safeJson(response);

      if (response.ok && data?.success && data.checkoutId) {
        await upsertSession({
          checkout_id: data.checkoutId,
          tx_ref: data.tx_ref ?? null,
          user_email: email || "customer@example.com",
          amount: Number(amount),
          currency: currency || "KES",
          fullname: fullname || "Customer",
          channel: "card",
          payment_method: "card",
          status: "pending",
          merchant_request_id: data?.data?.id ?? null,
        });
      }

      return json(data, response.status);
    }

    // ---------- KoraPay verify ----------
    if (req.method === "POST" && path === "/kora/verify") {
      const body = await req.json();
      const { reference } = body;

      if (!reference) {
        return json({ error: "Transaction reference is required" }, 400);
      }

      const secretKey = Deno.env.get("KORAPAY_SECRET_KEY");
      if (!secretKey) {
        return json({ error: "KoraPay secret key is not configured" }, 500);
      }

      const response = await fetch(
        `https://api.korapay.com/merchant/api/v1/charges/${encodeURIComponent(reference)}`,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${secretKey}`,
            "Content-Type": "application/json",
          },
        },
      );

      const data = await safeJson(response);
      const status = data?.data?.status;
      const success = response.ok && status === "success";

      return json(
        { success, status, reference, data: data?.data || null },
        response.status,
      );
    }

    return json({ error: "Invalid endpoint" }, 404);
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});
