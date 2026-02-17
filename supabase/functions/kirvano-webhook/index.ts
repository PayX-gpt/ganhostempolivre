import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ====== PRODUCT IDENTIFICATION ======
// Map Kirvano offer_ids to funnel steps. Update these when you add new offers.
const OFFER_ID_MAP: Record<string, string> = {
  // Front-end offers
  "4630333d-d5d1-4591-b767-2151f77c6b13": "front_37",
  "a404a378-2a59-4efd-86a8-dc57363c054c": "front_47",
  // Upsell offers
  "863c8fe9-ca48-452f-9fa4-22e14df182cf": "acelerador_basico",
  // "offer-id-acelerador-duplo": "acelerador_duplo",
  // "offer-id-acelerador-maximo": "acelerador_maximo",
  // "offer-id-multiplicador-prata": "multiplicador_prata",
  // "offer-id-multiplicador-ouro": "multiplicador_ouro",
  // "offer-id-multiplicador-diamante": "multiplicador_diamante",
  // "offer-id-blindagem": "blindagem",
  // "offer-id-circulo": "circulo_interno",
  // "offer-id-downsell-guia": "downsell_guia",
};

// Fallback: classify by price + product name when offer_id is unknown
function classifyByPrice(amount: number | null, offerName: string | null, productName: string | null): string {
  const name = (productName || "").toLowerCase();
  const offer = (offerName || "").toLowerCase();

  // Check if product name contains upsell identifiers
  if (name.includes("acelerador") || offer.includes("acelerador")) {
    if (amount && amount <= 25) return "acelerador_basico";
    if (amount && amount <= 35) return "acelerador_duplo";
    return "acelerador_maximo";
  }
  if (name.includes("multiplicador") || offer.includes("multiplicador")) {
    if (amount && amount <= 50) return "multiplicador_prata";
    if (amount && amount <= 70) return "multiplicador_ouro";
    return "multiplicador_diamante";
  }
  if (name.includes("blindagem") || offer.includes("blindagem")) return "blindagem";
  if (name.includes("circulo") || name.includes("círculo") || offer.includes("circulo")) return "circulo_interno";
  if (name.includes("guia") || offer.includes("guia") || (amount && amount < 35 && amount > 25)) return "downsell_guia";

  // Pure price-based fallback for front-end (same product name)
  if (amount === 37) return "front_37";
  if (amount === 47) return "front_47";
  if (amount && amount <= 40) return "front_37";
  if (amount && amount <= 50) return "front_47";

  return "purchase"; // generic fallback
}

function identifyFunnelStep(body: any, amount: number | null): string {
  const offerId = body.products?.[0]?.offer_id || null;
  const offerName = body.products?.[0]?.offer_name || null;
  const productName = body.products?.[0]?.name || body.product_name || null;

  // 1. Exact match by offer_id (most reliable)
  if (offerId && OFFER_ID_MAP[offerId]) {
    return OFFER_ID_MAP[offerId];
  }

  // 2. Fallback by price + product name
  return classifyByPrice(amount, offerName, productName);
}

function extractAmount(body: any): number | null {
  // 1. Try total_price "R$ 37,00" → 37.00
  if (body.total_price && typeof body.total_price === "string") {
    const cleaned = body.total_price.replace(/[^\d,.-]/g, "").replace(",", ".");
    const val = parseFloat(cleaned);
    if (!isNaN(val) && val > 0) return val;
  }
  // 2. Try fiscal.total_value (numeric)
  if (body.fiscal?.total_value) {
    const val = parseFloat(body.fiscal.total_value);
    if (!isNaN(val) && val > 0) return val;
  }
  // 3. Try fiscal.original_value
  if (body.fiscal?.original_value) {
    const val = parseFloat(body.fiscal.original_value);
    if (!isNaN(val) && val > 0) return val;
  }
  // 4. Try products[0].price "R$ 37,00"
  if (body.products?.[0]?.price && typeof body.products[0].price === "string") {
    const cleaned = body.products[0].price.replace(/[^\d,.-]/g, "").replace(",", ".");
    const val = parseFloat(cleaned);
    if (!isNaN(val) && val > 0) return val;
  }
  // 5. Try products[0].offer_name
  if (body.products?.[0]?.offer_name) {
    const val = parseFloat(body.products[0].offer_name);
    if (!isNaN(val) && val > 0) return val;
  }
  // 6. Try direct numeric fields
  const directFields = ["amount", "valor", "price", "preco", "value"];
  for (const field of directFields) {
    if (body[field]) {
      const val = parseFloat(body[field]);
      if (!isNaN(val) && val > 0) return val;
    }
  }
  // 7. Try fiscal.commission
  if (body.fiscal?.commission) {
    const val = parseFloat(body.fiscal.commission);
    if (!isNaN(val) && val > 0) return val;
  }
  // 8. Fallback
  if (body.products?.[0]?.name?.includes("CHATGPT") || body.products?.[0]?.name?.includes("TOKEN")) {
    return 37;
  }
  return null;
}

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

    const event = body.event || body.tipo_evento || body.type || "purchase";
    const status = body.status || body.purchase_status || body.payment_status || "approved";

    const transactionId = body.sale_id || body.transaction_id || body.transaction || body.id || body.codigo || null;
    const checkoutId = body.checkout_id || null;
    const planId = body.plan_id || body.plan || body.produto_id || body.product_id || body.products?.[0]?.id || null;
    const productName = body.products?.[0]?.name || body.product_name || body.produto || body.product || body.nome_produto || null;
    const offerName = body.products?.[0]?.offer_name || null;
    const offerId = body.products?.[0]?.offer_id || null;
    const amount = extractAmount(body);

    // ====== IDENTIFY FUNNEL STEP ======
    const funnelStep = identifyFunnelStep(body, amount);

    const email = body.customer?.email || body.email || body.buyer_email || body.cliente_email || null;
    const buyerName = body.customer?.name || body.buyer_name || body.nome || body.cliente_nome || null;
    const phone = body.customer?.phone_number || body.phone || body.telefone || body.buyer_phone || null;

    const paymentMethod = body.payment?.method || body.payment_method || body.forma_pagamento || null;
    const paymentId = body.payment_id || body.pagamento_id || null;

    const utmData = body.utm || {};
    const utmSource = utmData.utm_source || body.utm_source || null;
    const utmMedium = utmData.utm_medium || body.utm_medium || null;
    const utmCampaign = utmData.utm_campaign || body.utm_campaign || null;
    const utmContent = utmData.utm_content || body.utm_content || null;
    const utmTerm = utmData.utm_term || body.utm_term || null;
    const sck = body.sck || null;
    const src = utmData.src || body.src || null;
    const fbclid = body.cookies?.fbclid || body.fbclid || null;
    const gclid = body.cookies?.gclid || body.gclid || null;
    const fbp = body.cookies?.fbp || null;

    const sessionId = (src && src.startsWith("sess_")) ? src : null;

    const statusMap: Record<string, string> = {
      approved: "approved", aprovado: "approved", paid: "approved", pago: "approved",
      completed: "approved", completo: "approved",
      sale_approved: "approved",
      refused: "refused", recusado: "refused",
      refunded: "refunded", reembolsado: "refunded",
      chargeback: "chargeback",
      waiting_payment: "pending", aguardando_pagamento: "pending",
      pending: "pending", pendente: "pending",
      canceled: "canceled", cancelado: "canceled",
      abandoned_cart: "ABANDONED_CART",
    };

    const normalizedStatus = statusMap[status.toLowerCase()] || status;

    console.log(`💰 [Kirvano] Amount: ${amount}, Status: ${normalizedStatus}, Step: ${funnelStep}, Email: ${email}, Product: ${productName}, OfferId: ${offerId}, OfferName: ${offerName}`);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let matched = false;

    // ====== DEDUPLICATION: check if this exact transaction+status already exists ======
    if (transactionId) {
      const { data: existing } = await supabase
        .from("purchase_tracking")
        .select("id, status")
        .eq("transaction_id", transactionId)
        .maybeSingle();

      if (existing) {
        // Record exists — update it with latest data
        const { data, error } = await supabase
          .from("purchase_tracking")
          .update({
            status: normalizedStatus,
            amount,
            email,
            product_name: productName,
            plan_id: planId,
            funnel_step: funnelStep,
            whop_payment_id: paymentId,
            session_id: sessionId,
            utm_source: utmSource,
            utm_medium: utmMedium,
            utm_campaign: utmCampaign,
            utm_content: utmContent,
            utm_term: utmTerm,
            fbclid,
            gclid,
            fbp,
          })
          .eq("transaction_id", transactionId)
          .select()
          .single();

        if (!error && data) {
          matched = true;
          console.log(`✅ [Kirvano] Updated existing record ${transactionId} (${existing.status} → ${normalizedStatus}) → ${funnelStep}`);
        }
      }
    }

    if (!matched) {
      const insertData: Record<string, unknown> = {
        transaction_id: transactionId,
        plan_id: planId,
        product_name: productName,
        amount,
        email,
        status: normalizedStatus,
        funnel_step: funnelStep,
        session_id: sessionId,
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
        utm_content: utmContent,
        utm_term: utmTerm,
        fbclid,
        gclid,
        fbp,
        redirect_source: "kirvano_webhook",
        user_agent: req.headers.get("user-agent") || "kirvano-webhook",
      };

      const extraMeta = {
        event,
        buyer_name: buyerName,
        phone,
        payment_method: paymentMethod,
        checkout_id: checkoutId,
        offer_id: offerId,
        offer_name: offerName,
        sck,
        src,
        raw_status: status,
        fiscal: body.fiscal || null,
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

      console.log(`✅ [Kirvano] New record: ${data.id} → ${funnelStep} R$${amount}`);
    }

    await supabase.from("funnel_audit_logs").insert({
      event_type: `kirvano_${normalizedStatus}`,
      page_id: funnelStep,
      session_id: sessionId || `webhook_${Date.now()}`,
      status: normalizedStatus === "approved" ? "success" : "pending",
      metadata: {
        transaction_id: transactionId,
        email,
        amount,
        product_name: productName,
        offer_id: offerId,
        offer_name: offerName,
        funnel_step: funnelStep,
        payment_method: paymentMethod,
        buyer_name: buyerName,
        event,
        raw_status: status,
      },
    });

    return new Response(JSON.stringify({ success: true, status: normalizedStatus, amount, funnel_step: funnelStep }), {
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
