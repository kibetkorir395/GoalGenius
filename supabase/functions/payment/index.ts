import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const API_BASE = "https://powerful-flexibility-production-989e.up.railway.app";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

async function safeJson(response: Response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text, status: response.status };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.replace("/payment", "");

    if (req.method === "POST" && path === "/initiate/mpesa") {
      const body = await req.json();
      const { amount, currency, phone, email, fullname } = body;

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
      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "POST" && path === "/status") {
      const body = await req.json();
      const { checkoutId } = body;

      const response = await fetch(`${API_BASE}/api/flow/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkoutId }),
      });

      const data = await safeJson(response);
      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "POST" && path === "/initiate/card") {
      const body = await req.json();
      const { amount, currency, email, fullname, card_number, cvv, expiry_month, expiry_year, pin } = body;

      const response = await fetch(`${API_BASE}/api/flow/initiate/card`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amount.toString(),
          currency: currency || "KES",
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
      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "POST" && path === "/kora/verify") {
      const body = await req.json();
      const { reference } = body;

      if (!reference) {
        return new Response(JSON.stringify({ error: "Transaction reference is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const secretKey = Deno.env.get("KORAPAY_SECRET_KEY");
      if (!secretKey) {
        return new Response(JSON.stringify({ error: "KoraPay secret key is not configured" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const response = await fetch(`https://api.korapay.com/merchant/api/v1/charges/${encodeURIComponent(reference)}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
      });

      const data = await safeJson(response);
      const status = data?.data?.status;
      const success = response.ok && status === "success";

      return new Response(JSON.stringify({
        success,
        status,
        reference,
        data: data?.data || null,
      }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid endpoint" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
