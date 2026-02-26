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
