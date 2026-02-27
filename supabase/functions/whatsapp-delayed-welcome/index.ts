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
    const now = new Date().toISOString();

    // 🔴 PAUSA DE RECUPERAÇÃO — altere para false quando quiser reativar
    const PAUSE_RECOVERY = true;

    // Buscar compradores primeiro (prioridade máxima)
    const { data: purchasedEntries, error: fetchError1 } = await supabase
      .from("whatsapp_welcome_queue")
      .select("*")
      .eq("sent", false)
      .eq("purchased", true)
      .lte("send_at", now)
      .order("send_at", { ascending: true })
      .limit(10);

    // Depois buscar os demais (recovery etc.)
    const { data: otherEntries, error: fetchError2 } = await supabase
      .from("whatsapp_welcome_queue")
      .select("*")
      .eq("sent", false)
      .eq("purchased", false)
      .lte("send_at", now)
      .order("send_at", { ascending: true })
      .limit(PAUSE_RECOVERY ? 0 : 5);

    const fetchError = fetchError1 || fetchError2;
    const pendingEntries = [...(purchasedEntries || []), ...(otherEntries || [])];

    if (fetchError) {
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!pendingEntries || pendingEntries.length === 0) {
      return new Response(JSON.stringify({ processed: 0, message: "No pending entries" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results = [];
    let processedSends = 0;

    for (const entry of pendingEntries) {
      // Mantém no máximo 5 tentativas de envio por execução
      if (processedSends >= 5) break;
      const { phone, lead_name, session_id } = entry;

      let hasPurchased = entry.purchased === true;

      if (!hasPurchased && session_id) {
        const { data: purchase } = await supabase
          .from("purchase_tracking")
          .select("id, status")
          .eq("session_id", session_id)
          .eq("status", "approved")
          .limit(1);

        if (purchase && purchase.length > 0) {
          hasPurchased = true;
        }
      }

      const leadType = hasPurchased ? "post_purchase" : "recovery";

      // Pular leads de recuperação se a pausa estiver ativa
      if (PAUSE_RECOVERY && leadType === "recovery") {
        results.push({ phone, lead_type: leadType, sent: false, skipped: "recovery_paused" });
        continue;
      }

      const firstName = lead_name ? lead_name.split(" ")[0] : "";
      const greeting = firstName || ""; 

      let message;
      if (hasPurchased) {
        message = `Opa${greeting ? ", " + greeting : ""}! Aqui é o Mark. Seja muito bem-vindo(a) à nossa plataforma! Seu acesso já está liberado! Anota aí:\n\n- Site: https://alfahibrida.com/login\n- Email: (o mesmo que você usou na compra)\n- Senha: 123456\n\nConsegue acessar agora pra gente já dar os próximos passos juntos?`;
      } else {
        message = `Opa${greeting ? ", " + greeting : ""}! Aqui é o Mark. Vi que você se interessou em nossa plataforma para ganhar com seu tempo livre, mas não finalizou sua inscrição. Ficou com alguma dúvida que eu possa te ajudar?`;
      }

      await supabase.from("whatsapp_conversations").insert({
        phone,
        lead_name: lead_name || null,
        direction: "outgoing",
        message,
        ai_generated: true,
        session_id: session_id || null,
      });

      const sendUrl = `${supabaseUrl}/functions/v1/whatsapp-send`;
      const sendRes = await fetch(sendUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ phone, message }),
      });

      const sendOk = sendRes.ok;

      await supabase
        .from("whatsapp_welcome_queue")
        .update({
          sent: true,
          sent_at: new Date().toISOString(),
          lead_type: leadType,
          purchased: hasPurchased,
        })
        .eq("id", entry.id);

      results.push({ phone, lead_type: leadType, sent: sendOk });
      processedSends += 1;

      // Delay 8s between sends to avoid overwhelming the instance
      if (sendOk) {
        await new Promise(resolve => setTimeout(resolve, 8000));
      }
    }

    return new Response(
      JSON.stringify({ processed: results.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
