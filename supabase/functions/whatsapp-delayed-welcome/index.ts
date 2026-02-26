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
    const { data: pendingEntries, error: fetchError } = await supabase
      .from("whatsapp_welcome_queue")
      .select("*")
      .eq("sent", false)
      .lte("send_at", now)
      .order("send_at", { ascending: true })
      .limit(20);

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

    for (const entry of pendingEntries) {
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

      let message;
      if (hasPurchased) {
        message = `Fala! Aqui é o Henrique Matos. Seja muito bem-vindo à família HM Copy! Parabéns por essa decisão, de verdade. A partir de agora você vai copiar as minhas operações de forma 100% automática.\n\nPra sua conta começar a lucrar junto com a minha, só falta um passo: abrir sua conta na corretora MultiBank. É a corretora que eu uso pessoalmente há anos, regulamentada internacionalmente e com saque rápido direto pra sua conta.\n\nEsse é o link pra abrir sua conta, leva menos de 5 minutos: https://multibankfx.com/account/live-account?acc=9924595&off=1767\n\nE aqui tem um video curtinho mostrando o passo a passo do cadastro: https://files.manuscdn.com/user_upload_by_module/session_file/310419663029830305/gGSqGzqcnwGrXaix.mp4\n\nAbre lá e me avisa quando terminar que eu te guio no próximo passo!`;
      } else {
        message = `Fala! Aqui é o Henrique Matos. Vi que você fez o quiz e descobriu seu potencial de lucro com copy trading, mas não finalizou sua inscrição. Aconteceu alguma coisa? Ficou com alguma dúvida sobre como funciona?\n\nTô aqui pra te explicar tudo pessoalmente. Me conta: o que te travou?`;
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
