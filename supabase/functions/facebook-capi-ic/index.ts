import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { email, phone, session_id, fbclid, fbp, fbc, amount, plan, event_name } = body;

    // Only allow IC event
    if (event_name !== "InitiateCheckout") {
      return new Response(JSON.stringify({ error: "Invalid event" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!email && !session_id) {
      return new Response(JSON.stringify({ error: "Missing identifier" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // ====== DEDUP: Check if IC already sent for this email ======
    const dedupKey = email || session_id;
    const { data: existing } = await supabase
      .from("funnel_events")
      .select("id")
      .eq("event_name", "capi_ic_sent")
      .eq("session_id", dedupKey)
      .limit(1);

    if (existing && existing.length > 0) {
      console.log(`⏭️ [CAPI-IC] Skipped — already sent for ${dedupKey}`);
      return new Response(JSON.stringify({ success: true, sent: false, reason: "already_sent" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ====== SEND TO FACEBOOK CAPI (multi-pixel) ======
    const pixels = [
      { id: Deno.env.get("FB_PIXEL_ID"), token: Deno.env.get("FB_ACCESS_TOKEN") },
      { id: "952975541025077", token: Deno.env.get("FB_ACCESS_TOKEN_2") },
    ].filter(p => p.id && p.token);

    if (pixels.length === 0) {
      console.warn("⚠️ [CAPI-IC] Missing FB credentials");
      return new Response(JSON.stringify({ success: false, error: "Missing FB credentials" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userData: Record<string, string> = {};
    if (email) {
      userData.em = await hashSHA256(email.trim().toLowerCase());
    }
    if (phone) {
      userData.ph = await hashSHA256(phone.replace(/\D/g, ""));
    }
    if (fbc) userData.fbc = fbc;
    else if (fbclid) userData.fbc = `fb.1.${Date.now()}.${fbclid}`;
    if (fbp) userData.fbp = fbp;

    const eventId = `ic_${session_id || Date.now()}_${Date.now()}`;

    const eventData = {
      event_name: "InitiateCheckout",
      event_time: Math.floor(Date.now() / 1000),
      event_id: eventId,
      action_source: "website",
      user_data: userData,
      custom_data: amount ? { currency: "BRL", value: amount } : undefined,
    };

    // Send to all pixels in parallel
    const results = await Promise.allSettled(
      pixels.map(async (p) => {
        const url = `https://graph.facebook.com/v21.0/${p.id}/events?access_token=${p.token}`;
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: [eventData] }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(`Pixel ${p.id}: ${JSON.stringify(result)}`);
        return { pixelId: p.id, result };
      })
    );

    const anySuccess = results.some(r => r.status === "fulfilled");
    results.forEach((r, i) => {
      if (r.status === "rejected") console.warn(`⚠️ [CAPI-IC] Pixel ${pixels[i].id} failed:`, r.reason);
    });

    if (anySuccess) {
      await supabase.from("funnel_events").insert({
        event_name: "capi_ic_sent",
        session_id: dedupKey,
        event_data: { email, event_id: eventId, amount, plan, pixels_sent: pixels.map(p => p.id) },
        page_url: "capi_initiate_checkout",
      });
      console.log(`✅ [CAPI-IC] Sent for ${dedupKey} to ${pixels.length} pixels (event_id: ${eventId})`);
      return new Response(JSON.stringify({ success: true, sent: true, event_id: eventId }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      console.error(`❌ [CAPI-IC] All pixels failed`);
      return new Response(JSON.stringify({ success: false, error: "All pixels failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("❌ [CAPI-IC] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
