import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Frustration keywords that trigger escalation flag
const FRUSTRATION_KEYWORDS = [
  "reembolso", "devolver", "devolução", "devolvam", "golpe", "golpista",
  "enganação", "enganar", "mentira", "mentiroso", "processo", "processar",
  "procon", "jurídico", "advogado", "polícia", "reclameaqui", "reclame aqui",
  "meu dinheiro", "quero meu dinheiro", "cadê meu dinheiro",
  "máquina", "robô", "bot", "falando com máquina",
];

function detectFrustration(message: string): boolean {
  const lower = message.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return FRUSTRATION_KEYWORDS.some(kw => {
    const kwNorm = kw.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return lower.includes(kwNorm);
  });
}

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

    // ====== DEBOUNCE 10 SECONDS — prevent duplicate AI replies ======
    const tenSecondsAgo = new Date(Date.now() - 10000).toISOString();

    // Check for duplicate incoming message (same text within 10s)
    const { data: recentIncoming } = await supabase
      .from("whatsapp_conversations")
      .select("id")
      .eq("phone", cleanPhone)
      .eq("direction", "incoming")
      .eq("message", text)
      .gte("created_at", tenSecondsAgo)
      .limit(1);

    if (recentIncoming && recentIncoming.length > 0) {
      return new Response(JSON.stringify({ ok: true, duplicate: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Save incoming message immediately
    await supabase.from("whatsapp_conversations").insert({
      phone: cleanPhone,
      direction: "incoming",
      message: text,
      ai_generated: false,
    });

    // Check if there's an outgoing message being processed right now (within 10s)
    const { data: recentOutgoing } = await supabase
      .from("whatsapp_conversations")
      .select("id")
      .eq("phone", cleanPhone)
      .eq("direction", "outgoing")
      .gte("created_at", tenSecondsAgo)
      .limit(1);

    if (recentOutgoing && recentOutgoing.length > 0) {
      console.log(`⏸️ [Webhook] Debounced for ${cleanPhone} — recent outgoing exists`);
      return new Response(JSON.stringify({ ok: true, debounced: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ====== WAIT 3s to aggregate rapid messages ======
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Fetch any additional messages that arrived during the wait
    const { data: recentMessages } = await supabase
      .from("whatsapp_conversations")
      .select("message")
      .eq("phone", cleanPhone)
      .eq("direction", "incoming")
      .gte("created_at", tenSecondsAgo)
      .order("created_at", { ascending: true });

    // Combine all recent messages into one for the AI
    const aggregatedMessage = recentMessages && recentMessages.length > 1
      ? recentMessages.map(m => m.message).join("\n")
      : text;

    // ====== FRUSTRATION DETECTION ======
    const isFrustrated = detectFrustration(aggregatedMessage);

    if (isFrustrated) {
      // Save to pending followups for manual intervention
      const { data: existingFollowup } = await supabase
        .from("whatsapp_pending_followups")
        .select("id, unanswered_count")
        .eq("phone", cleanPhone)
        .eq("resolved", false)
        .limit(1);

      if (existingFollowup && existingFollowup.length > 0) {
        await supabase
          .from("whatsapp_pending_followups")
          .update({
            unanswered_count: (existingFollowup[0].unanswered_count || 0) + 1,
            last_incoming_message: aggregatedMessage,
            reason: "frustration_detected",
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingFollowup[0].id);
      } else {
        await supabase.from("whatsapp_pending_followups").insert({
          phone: cleanPhone,
          last_incoming_message: aggregatedMessage,
          reason: "frustration_detected",
        });
      }
      console.log(`🚨 [Webhook] Frustration detected for ${cleanPhone}: "${aggregatedMessage.substring(0, 50)}..."`);
    }

    // ====== CALL AI REPLY ======
    const aiReplyUrl = `${supabaseUrl}/functions/v1/whatsapp-ai-reply`;
    const aiRes = await fetch(aiReplyUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        phone: cleanPhone,
        incoming_message: aggregatedMessage,
        is_frustrated: isFrustrated,
      }),
    });

    const aiData = await aiRes.json();

    // If AI reply failed and instance is down, save to pending followups
    if (!aiRes.ok || aiData.error) {
      const { data: existingFollowup } = await supabase
        .from("whatsapp_pending_followups")
        .select("id, unanswered_count")
        .eq("phone", cleanPhone)
        .eq("resolved", false)
        .limit(1);

      if (existingFollowup && existingFollowup.length > 0) {
        await supabase
          .from("whatsapp_pending_followups")
          .update({
            unanswered_count: (existingFollowup[0].unanswered_count || 0) + 1,
            last_incoming_message: aggregatedMessage,
            reason: "send_failed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingFollowup[0].id);
      } else {
        await supabase.from("whatsapp_pending_followups").insert({
          phone: cleanPhone,
          last_incoming_message: aggregatedMessage,
          reason: "send_failed",
        });
      }
      console.log(`❌ [Webhook] AI reply failed for ${cleanPhone}, added to pending followups`);
    }

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
