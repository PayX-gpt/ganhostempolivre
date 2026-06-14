import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function hashSHA256(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const body = await req.json();
    const { event_name, email, phone, session_id, fbclid, fbp, fbc, amount, content_id } = body;

    const ALLOWED_EVENTS = ["ViewContent", "AddToCart", "Lead", "CompleteRegistration"];
    if (!ALLOWED_EVENTS.includes(event_name)) {
      return new Response(JSON.stringify({ error: "Invalid event", allowed: ALLOWED_EVENTS }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const pixels = [
      { id: Deno.env.get("FB_PIXEL_ID"), token: Deno.env.get("FB_ACCESS_TOKEN") },
      { id: "952975541025077", token: Deno.env.get("FB_ACCESS_TOKEN_2") },
      { id: "1595773305052852", token: Deno.env.get("FB_ACCESS_TOKEN_3") },
      { id: "1347337003982438", token: Deno.env.get("FB_ACCESS_TOKEN_4") },
    ].filter(p => p.id && p.token);

    if (pixels.length === 0) {
      return new Response(JSON.stringify({ success: false, error: "No FB credentials" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const userData: Record<string, string> = {};
    if (email) userData.em = await hashSHA256(email.trim().toLowerCase());
    if (phone) userData.ph = await hashSHA256(phone.replace(/\D/g, ""));
    if (fbc) userData.fbc = fbc;
    else if (fbclid) userData.fbc = `fb.1.${Date.now()}.${fbclid}`;
    if (fbp) userData.fbp = fbp;

    const eventId = `${event_name.toLowerCase()}_${session_id || Date.now()}_${Date.now()}`;

    const eventData: Record<string, unknown> = {
      event_name,
      event_time: Math.floor(Date.now() / 1000),
      event_id: eventId,
      action_source: "website",
      user_data: userData,
    };
    if (amount) eventData.custom_data = { currency: "BRL", value: amount, content_ids: [content_id || "chave_token_chatgpt"], content_type: "product" };

    const results = await Promise.allSettled(
      pixels.map(async (p) => {
        const url = `https://graph.facebook.com/v21.0/${p.id}/events?access_token=${p.token}`;
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: [eventData] }),
        });
        if (!response.ok) throw new Error(`Pixel ${p.id}: ${await response.text()}`);
        return { pixelId: p.id };
      })
    );

    const sent = results.filter(r => r.status === "fulfilled").length;
    console.log(`✅ [CAPI-${event_name}] Sent to ${sent}/${pixels.length} pixels (event_id: ${eventId})`);

    return new Response(JSON.stringify({ success: true, sent, event_id: eventId }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error(`❌ [CAPI] Error:`, error);
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
