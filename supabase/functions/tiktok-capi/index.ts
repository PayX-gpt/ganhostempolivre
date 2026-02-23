/**
 * TikTok Events API (server-side) — CompletePayment
 * Called from kirvano-webhook on approved purchases
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TIKTOK_PIXEL_ID = "D4RHV5BC77UET7S4GB00";

async function hashSHA256(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const accessToken = Deno.env.get("TIKTOK_ACCESS_TOKEN");
  if (!accessToken) {
    console.error("❌ [TikTok CAPI] TIKTOK_ACCESS_TOKEN not configured");
    return new Response(JSON.stringify({ sent: false, reason: "missing_token" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const {
      event_name = "CompletePayment",
      event_id,
      email,
      phone,
      amount,
      currency = "BRL",
      ttclid,
      ttp,
      ip,
      user_agent,
      source_url,
      session_id,
    } = body;

    // Build user data with hashing
    const userData: Record<string, unknown> = {};
    if (email) {
      userData.email = await hashSHA256(email.trim().toLowerCase());
    }
    if (phone) {
      const phoneNorm = phone.replace(/\D/g, "");
      userData.phone = await hashSHA256(phoneNorm);
    }
    if (ttclid) userData.ttclid = ttclid;
    if (ttp) userData.ttp = ttp;
    if (ip) userData.ip = ip;
    if (user_agent) userData.user_agent = user_agent;

    const eventData: Record<string, unknown> = {
      event: event_name,
      event_id: event_id || `tt_${session_id || "unknown"}_${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: userData,
      page: {
        url: source_url || "https://ganhostempolivre.lovable.app",
      },
    };

    // Add properties for CompletePayment
    if (event_name === "CompletePayment" && amount) {
      eventData.properties = {
        content_type: "product",
        content_id: "chave_token_chatgpt",
        value: amount,
        currency,
      };
    }

    const url = `https://business-api.tiktok.com/open_api/v1.3/event/track/`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Access-Token": accessToken,
      },
      body: JSON.stringify({
        pixel_code: TIKTOK_PIXEL_ID,
        event: event_name,
        event_id: eventData.event_id,
        timestamp: eventData.timestamp,
        context: {
          user: userData,
          page: eventData.page,
          ip: ip || undefined,
          user_agent: user_agent || undefined,
        },
        properties: eventData.properties || {},
      }),
    });

    const result = await response.json();
    
    if (response.ok && result.code === 0) {
      console.log(`✅ [TikTok CAPI] ${event_name} sent (event_id: ${eventData.event_id})`);
      return new Response(JSON.stringify({ sent: true, event_id: eventData.event_id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      console.error(`❌ [TikTok CAPI] ${event_name} failed:`, JSON.stringify(result));
      return new Response(JSON.stringify({ sent: false, error: result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (err) {
    console.error("❌ [TikTok CAPI] Error:", err);
    return new Response(JSON.stringify({ sent: false, error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
