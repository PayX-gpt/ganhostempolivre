import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    console.log("📦 [Kirvano Webhook] Payload received:", JSON.stringify(body));

    // Kirvano sends different field naming conventions - normalize
    const event = body.event || body.tipo_evento || body.type || "purchase";
    const status = body.status || body.purchase_status || body.payment_status || "approved";

    // Extract transaction/sale info
    const transactionId = body.transaction_id || body.transaction || body.sale_id || body.id || body.codigo || null;
    const planId = body.plan_id || body.plan || body.produto_id || body.product_id || null;
    const productName = body.product_name || body.produto || body.product || body.nome_produto || null;
    const amount = parseFloat(body.amount || body.valor || body.price || body.preco || "0") || null;

    // Extract buyer info
    const email = body.email || body.buyer_email || body.cliente_email || body.customer?.email || null;
    const buyerName = body.buyer_name || body.nome || body.customer?.name || body.cliente_nome || null;
    const phone = body.phone || body.telefone || body.buyer_phone || body.customer?.phone || null;

    // Extract payment details
    const paymentMethod = body.payment_method || body.forma_pagamento || body.metodo_pagamento || null;
    const paymentId = body.payment_id || body.pagamento_id || null;

    // Extract tracking/UTM params that Kirvano forwards
    const utmData = body.utm || {};
    const utmSource = utmData.utm_source || body.utm_source || null;
    const utmMedium = utmData.utm_medium || body.utm_medium || null;
    const utmCampaign = utmData.utm_campaign || body.utm_campaign || null;
    const utmContent = utmData.utm_content || body.utm_content || null;
    const utmTerm = utmData.utm_term || body.utm_term || null;
    const sck = body.sck || null;
    const src = utmData.src || body.src || null;
    const fbclid = body.cookies?.fbclid || body.fbclid || null;
    const gclid = body.gclid || null;

    // Extract session_id: Kirvano forwards it in utm.src
    const sessionId = (src && src.startsWith("sess_")) ? src : null;

    // Map Kirvano status to our internal status
    const statusMap: Record<string, string> = {
      approved: "approved",
      aprovado: "approved",
      paid: "approved",
      pago: "approved",
      completed: "approved",
      completo: "approved",
      refused: "refused",
      recusado: "refused",
      refunded: "refunded",
      reembolsado: "refunded",
      chargeback: "chargeback",
      waiting_payment: "pending",
      aguardando_pagamento: "pending",
      pending: "pending",
      pendente: "pending",
      canceled: "canceled",
      cancelado: "canceled",
    };

    const normalizedStatus = statusMap[status.toLowerCase()] || status;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Try to match existing record by transaction_id or email+plan
    let matched = false;

    if (transactionId) {
      const { data, error } = await supabase
        .from("purchase_tracking")
        .update({
          status: normalizedStatus,
          amount,
          email,
          product_name: productName,
          plan_id: planId,
          whop_payment_id: paymentId,
          session_id: sessionId,
          utm_source: utmSource,
          utm_medium: utmMedium,
          utm_campaign: utmCampaign,
          utm_content: utmContent,
          utm_term: utmTerm,
          fbclid,
          gclid,
        })
        .eq("transaction_id", transactionId)
        .select()
        .single();

      if (!error && data) {
        matched = true;
        console.log("✅ [Kirvano] Updated existing record by transaction_id:", transactionId);
      }
    }

    if (!matched) {
      // Insert new purchase record
      const insertData: Record<string, unknown> = {
        transaction_id: transactionId,
        plan_id: planId,
        product_name: productName,
        amount,
        email,
        status: normalizedStatus,
        session_id: sessionId,
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
        utm_content: utmContent,
        utm_term: utmTerm,
        fbclid,
        gclid,
        redirect_source: "kirvano_webhook",
        funnel_step: "purchase",
        user_agent: req.headers.get("user-agent") || "kirvano-webhook",
      };

      // Store extra fields in event_id as JSON for reference
      const extraMeta = {
        event,
        buyer_name: buyerName,
        phone,
        payment_method: paymentMethod,
        sck,
        src,
        raw_status: status,
        received_at: new Date().toISOString(),
      };
      insertData.event_id = JSON.stringify(extraMeta);

      const { data, error } = await supabase
        .from("purchase_tracking")
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error("❌ [Kirvano] Insert error:", error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log("✅ [Kirvano] New purchase recorded:", data.id);
    }

    // Log to audit
    await supabase.from("funnel_audit_logs").insert({
      event_type: `kirvano_${normalizedStatus}`,
      page_id: "webhook",
      session_id: `webhook_${Date.now()}`,
      status: normalizedStatus === "approved" ? "success" : "pending",
      metadata: {
        transaction_id: transactionId,
        email,
        amount,
        product_name: productName,
        event,
        raw_status: status,
      },
    });

    return new Response(JSON.stringify({ success: true, status: normalizedStatus }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ [Kirvano Webhook] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
