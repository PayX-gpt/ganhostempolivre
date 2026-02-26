import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const payload = await req.json();

    const phone = payload.phone || payload.chatId?.replace("@c.us", "") || null;
    const text = payload.text?.message || payload.body || payload.message?.text || null;
    const isFromMe = payload.fromMe === true;

    if (!phone || !text || isFromMe) {
      return new Response(JSON.stringify({ ok: true, ignored: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cleanPhone = phone.replace(/\D/g, "");

    // Anti-race-condition: check if we already replied to this phone in the last 3 seconds
    const threeSecondsAgo = new Date(Date.now() - 3000).toISOString();
    const { data: recentOutgoing } = await supabase
      .from("whatsapp_conversations")
      .select("id")
      .eq("phone", cleanPhone)
      .eq("direction", "outgoing")
      .gte("created_at", threeSecondsAgo)
      .limit(1);

    if (recentOutgoing && recentOutgoing.length > 0) {
      // There's a reply being processed right now, just save the incoming message
      // but DON'T trigger another AI reply to avoid duplicate responses
      await supabase.from("whatsapp_conversations").insert({
        phone: cleanPhone,
        direction: "incoming",
        message: text,
        ai_generated: false,
      });
      return new Response(JSON.stringify({ ok: true, debounced: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Also check if there's a recent incoming message we already saved (duplicate webhook call)
    const { data: recentIncoming } = await supabase
      .from("whatsapp_conversations")
      .select("id")
      .eq("phone", cleanPhone)
      .eq("direction", "incoming")
      .eq("message", text)
      .gte("created_at", threeSecondsAgo)
      .limit(1);

    if (recentIncoming && recentIncoming.length > 0) {
      return new Response(JSON.stringify({ ok: true, duplicate: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase.from("whatsapp_conversations").insert({
      phone: cleanPhone,
      direction: "incoming",
      message: text,
      ai_generated: false,
    });

    const aiReplyUrl = `${supabaseUrl}/functions/v1/whatsapp-ai-reply`;
    const aiRes = await fetch(aiReplyUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({ phone: cleanPhone, incoming_message: text }),
    });

    const aiData = await aiRes.json();

    return new Response(JSON.stringify({ ok: true, ai_response: aiData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
