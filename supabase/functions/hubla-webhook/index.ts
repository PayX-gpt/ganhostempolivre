import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ====== PRODUCT IDENTIFICATION ======
const OFFER_ID_MAP: Record<string, string> = {
  "4630333d-d5d1-4591-b767-2151f77c6b13": "front_37",
  "a404a378-2a59-4efd-86a8-dc57363c054c": "front_47",
  "69208bd0-7fc5-4000-958c-948dc73b1f6b": "front_66",
  "863c8fe9-ca48-452f-9fa4-22e14df182cf": "acelerador_basico",
  "59a5cba3-f876-46a8-b0e4-6e2c72cf725a": "acelerador_duplo",
  "c7f4277f-ad68-4952-92ba-8e2ea9bea47f": "safety_pro",
  "0a54e723-14b9-4835-a20d-07a2289b4fc8": "safety_pro",
  "c15f93e0-982e-47cd-ade1-b24791b79fab": "safety_pro",
  "bf6428b5-4257-496c-8d22-46e53c4e6689": "forex_mentoria",
};

function classifyByPrice(amount: number | null, offerName: string | null, productName: string | null): string {
  const name = (productName || "").toLowerCase();
  const offer = (offerName || "").toLowerCase();
  const isFrontProduct =
    name.includes("chatgpt") ||
    name.includes("token") ||
    offer.includes("chave") ||
    offer.includes("token");

  if (isFrontProduct) {
    if (amount !== null) {
      if (amount >= 60) return "front_66";
      if (amount >= 42) return "front_47";
      return "front_37";
    }
    return "front_47";
  }

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
  if (name.includes("circulo") || name.includes("circulo") || offer.includes("circulo")) return "circulo_interno";
  if (name.includes("safety") || offer.includes("safety") || name.includes("protecao") || offer.includes("protecao")) return "safety_pro";
  if (name.includes("forex") || offer.includes("forex") || name.includes("mentoria") || offer.includes("mentoria")) return "forex_mentoria";
  if (name.includes("guia") || offer.includes("guia") || (amount && amount < 35 && amount > 25)) return "downsell_guia";
  if (amount === 37) return "front_37";
  if (amount === 47) return "front_47";
  if (amount === 66.83) return "front_66";
  if (amount && amount <= 40) return "front_37";
  if (amount && amount <= 55) return "front_47";
  if (amount && amount <= 90) return "front_66";
  return "purchase";
}

function identifyFunnelStep(productId: string | null, offerId: string | null, offerName: string | null, productName: string | null, amount: number | null): string {
  if (offerId && OFFER_ID_MAP[offerId]) return OFFER_ID_MAP[offerId];
  if (productId && OFFER_ID_MAP[productId]) return OFFER_ID_MAP[productId];
  return classifyByPrice(amount, offerName, productName);
}

function parseCurrency(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value > 0 ? value : null;
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/[^\d,.-]/g, "").replace(",", ".");
  const parsed = parseFloat(cleaned);
  return !isNaN(parsed) && parsed > 0 ? parsed : null;
}

/**
 * Extract amount from Hub.la payload.
 * Hub.la sends amounts in CENTS (e.g. 4700 = R$47.00), so we divide by 100.
 * We also handle flat fallback fields that might already be in reais.
 */
function extractAmount(body: any): number | null {
  const saleData = body.data?.sale || {};
  const eventData = body.event || {};
  const subscriptionData = eventData.subscription || {};
  const invoiceData = eventData.lastInvoice || subscriptionData.lastInvoice || {};
  const invoiceAmount = invoiceData.amount || {};

  // Hub.la primary fields — amounts in CENTS
  const centsCandidates: unknown[] = [
    saleData.total,
    saleData.amount,
    saleData.value,
    invoiceAmount.totalCents,
    invoiceAmount.subtotalCents,
  ];

  for (const candidate of centsCandidates) {
    const parsed = parseCurrency(candidate);
    if (parsed !== null) {
      // Hub.la sends cents — values >= 100 are almost certainly cents
      // (a R$1.00 purchase is unlikely in this context)
      if (parsed >= 100) return parsed / 100;
      // Small values might already be in reais (defensive)
      return parsed;
    }
  }

  // Flat fallback — these may already be in reais
  const flatCandidates: unknown[] = [
    body.total_price,
    body.total,
    body.amount,
    body.valor,
    body.price,
    body.preco,
    body.value,
    eventData.totalAmount,
  ];

  for (const candidate of flatCandidates) {
    const parsed = parseCurrency(candidate);
    if (parsed !== null) return parsed;
  }

  return null;
}

async function hashSHA256(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Map Hub.la event names to normalized status.
 * Hub.la events: sale.approved, sale.refunded, sale.chargeback, sale.canceled,
 *                subscription.created, subscription.canceled, etc.
 */
function mapHublaStatus(event: unknown, rawStatus: string | null): string {
  const eventText = typeof event === "string" ? event.toLowerCase() : "";
  if (eventText.includes("abandoned")) return "abandoned_cart";
  if (eventText.includes("pending")) return "pending";
  if (eventText.includes("payment_succeeded") || eventText.includes("approved") || eventText.includes("paid") || eventText.includes("activated")) return "approved";
  if (eventText.includes("refunded")) return "refunded";
  if (eventText.includes("chargeback")) return "chargeback";
  if (eventText.includes("canceled") || eventText.includes("cancelled")) return "canceled";

  // Try to extract status from event name (e.g. "sale.approved" -> "approved")
  if (typeof event === "string" && event.includes(".")) {
    const parts = event.split(".");
    const eventStatus = parts[parts.length - 1].toLowerCase();
    const eventMap: Record<string, string> = {
      approved: "approved",
      paid: "approved",
      completed: "approved",
      created: "approved",
      refunded: "refunded",
      chargeback: "chargeback",
      canceled: "canceled",
      cancelled: "canceled",
      expired: "canceled",
      refused: "refused",
      pending: "pending",
      waiting: "pending",
    };
    if (eventMap[eventStatus]) return eventMap[eventStatus];
  }

  // Fallback to raw status field
  if (rawStatus) {
    const statusMap: Record<string, string> = {
      approved: "approved", aprovado: "approved", paid: "approved", pago: "approved",
      completed: "approved", completo: "approved", active: "approved",
      refused: "refused", recusado: "refused",
      refunded: "refunded", reembolsado: "refunded",
      chargeback: "chargeback",
      waiting_payment: "pending", aguardando_pagamento: "pending",
      pending: "pending", pendente: "pending",
      canceled: "canceled", cancelado: "canceled",
      cancelled: "canceled",
      abandoned_cart: "ABANDONED_CART",
    };
    return statusMap[rawStatus.toLowerCase()] || rawStatus;
  }

  return "pending";
}

function readQueryParam(rawUrl: unknown, key: string): string | null {
  if (typeof rawUrl !== "string" || !rawUrl) return null;
  try {
    return new URL(rawUrl).searchParams.get(key);
  } catch {
    return null;
  }
}

// ====== MAIN HANDLER ======
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
    console.log("[Hub.la] Payload received:", JSON.stringify(body));

    // ====== EXTRACT DATA FROM HUB.LA NESTED FORMAT ======
    const saleData = body.data?.sale || {};
    const buyerData = body.data?.buyer || {};
    const productData = body.data?.product || {};
    const offerData = body.data?.offer || {};
    const trackingData = body.data?.tracking || {};
    const checkoutData = body.data?.checkout || {};

    // Event & status
    // IMPORTANT: Hub.la v2 payloads put the event NAME in `body.type` (string)
    // and use `body.event` as an OBJECT container. Prefer string fields first.
    const eventCandidates = [body.type, body.tipo_evento, body.event_name, body.event];
    const event = eventCandidates.find((v) => typeof v === "string" && v.length > 0) || "purchase";
    const rawStatus = saleData.status || body.status || body.purchase_status || body.payment_status || null;
    const normalizedStatus = mapHublaStatus(event, rawStatus);

    // Transaction & IDs
    const transactionId = saleData.id || body.id || body.sale_id || body.transaction_id || null;
    const checkoutId = checkoutData.id || body.checkout_id || null;

    // Product info
    const productId = productData.id || body.product_id || body.produto_id || null;
    const productName = productData.name || body.product_name || body.produto || null;
    const offerId = offerData.id || body.offer_id || null;
    const offerName = offerData.name || body.offer_name || null;
    const planId = productId || body.plan_id || body.plan || null;

    // Amount (Hub.la sends cents — extractAmount handles division)
    const amount = extractAmount(body);

    // Funnel step identification
    const funnelStep = identifyFunnelStep(productId, offerId, offerName, productName, amount);

    // Buyer info — Hub.la uses data.buyer, flat fallback
    const email = buyerData.email || body.email || body.buyer_email || body.customer?.email || body.cliente_email || null;
    const normalizedEmail = typeof email === "string" ? email.toLowerCase().trim() : null;
    const buyerName = buyerData.name || body.buyer_name || body.customer?.name || body.nome || null;
    const phone = buyerData.phone || body.phone || body.customer?.phone_number || body.telefone || body.buyer_phone || null;

    // Payment info
    const paymentMethod = saleData.payment_method || body.payment_method || body.payment?.method || null;
    const paymentId = saleData.payment_id || body.payment_id || null;
    const currency = saleData.currency || body.currency || "BRL";

    // UTMs — Hub.la uses data.tracking, flat fallback
    const utmSource = trackingData.utm_source || body.utm_source || null;
    const utmMedium = trackingData.utm_medium || body.utm_medium || null;
    const utmCampaign = trackingData.utm_campaign || body.utm_campaign || null;
    const utmContent = trackingData.utm_content || body.utm_content || null;
    const utmTerm = trackingData.utm_term || body.utm_term || null;
    const sck = trackingData.sck || body.sck || null;
    const src = trackingData.src || body.src || null;
    const gtlSid = trackingData.gtl_sid || body.gtl_sid || null;
    const fbclid = trackingData.fbclid || body.cookies?.fbclid || body.fbclid || null;
    const gclid = trackingData.gclid || body.cookies?.gclid || body.gclid || null;
    const fbp = trackingData.fbp || body.cookies?.fbp || null;
    const fbc = trackingData.fbc || body.cookies?.fbc || null;
    const ttclid = trackingData.ttclid || body.cookies?.ttclid || body.ttclid || null;
    const ttp = trackingData.ttp || body.cookies?.ttp || body.ttp || null;
    const clientIp = body.ip || body.data?.ip || null;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let purchaseFallback: {
      session_id: string | null;
      utm_source: string | null;
      utm_medium: string | null;
      utm_campaign: string | null;
      utm_content: string | null;
      utm_term: string | null;
      fbclid: string | null;
      gclid: string | null;
      fbp: string | null;
      fbc: string | null;
      landing_page: string | null;
      referrer: string | null;
      vsl_variant: string | null;
    } | null = null;

    // Resolve session_id: prefer gtl_sid, then src, then fallback to phone/email
    let sessionId = (gtlSid && gtlSid.startsWith("sess_")) ? gtlSid
      : (src && src.startsWith("sess_")) ? src
      : null;

    console.log(`[Hub.la] Session resolution: gtl_sid=${gtlSid}, src=${src}, resolved=${sessionId}`);

    // ====== PHONE-BASED SESSION RESOLUTION ======
    if (!sessionId && phone) {
      const cleanPhone = phone.replace(/\D/g, "");
      const phoneSuffix = cleanPhone.slice(-9);
      if (phoneSuffix.length >= 8) {
        const { data: phoneMatch } = await supabase
          .from("phone_session_map")
          .select("session_id")
          .ilike("phone", `%${phoneSuffix}`)
          .order("created_at", { ascending: false })
          .limit(1);
        if (phoneMatch && phoneMatch.length > 0) {
          sessionId = phoneMatch[0].session_id;
          console.log(`[Hub.la] Resolved session via phone: ${phoneSuffix} -> ${sessionId}`);
        }
      }
    }

    // ====== EMAIL-BASED SESSION RESOLUTION ======
    if (!sessionId && normalizedEmail) {
      const { data: emailMatch } = await supabase
        .from("email_session_map")
        .select("session_id")
        .eq("email", normalizedEmail)
        .order("created_at", { ascending: false })
        .limit(1);
      if (emailMatch && emailMatch.length > 0) {
        sessionId = emailMatch[0].session_id;
        console.log(`[Hub.la] Resolved session via email: ${normalizedEmail} -> ${sessionId}`);
      }
    }

    // ====== PURCHASE-BASED FALLBACK ======
    if (!sessionId && normalizedEmail) {
      const { data: purchaseMatch } = await supabase
        .from("purchase_tracking")
        .select("session_id, utm_source, utm_medium, utm_campaign, utm_content, utm_term, fbclid, gclid, fbp, fbc, landing_page, referrer, vsl_variant")
        .eq("email", normalizedEmail)
        .not("session_id", "is", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (purchaseMatch?.session_id) {
        purchaseFallback = purchaseMatch;
        sessionId = purchaseMatch.session_id;
        console.log(`[Hub.la] Resolved session via purchase history: ${normalizedEmail} -> ${sessionId}`);
      }
    }

    // ====== SAVE EMAIL->SESSION MAPPING (for future lookups) ======
    if (sessionId && normalizedEmail) {
      await supabase.from("email_session_map").upsert(
        { email: normalizedEmail, session_id: sessionId },
        { onConflict: "email,session_id", ignoreDuplicates: true }
      ).then(() => {});
    }

    // ====== DECODE UTMs ======
    const decodeUtm = (v: string | null): string | null => {
      if (!v) return v;
      try { return decodeURIComponent(v); } catch { return v; }
    };

    let resolvedUtmCampaign = decodeUtm(utmCampaign);
    let resolvedUtmSource = decodeUtm(utmSource);
    let resolvedUtmMedium = decodeUtm(utmMedium);
    let resolvedUtmContent = decodeUtm(utmContent);
    let resolvedUtmTerm = decodeUtm(utmTerm);
    let resolvedVariant: string | null = purchaseFallback?.vsl_variant || null;
    let resolvedFbclid = fbclid;
    let resolvedGclid = gclid;
    let resolvedFbp = fbp;
    let resolvedFbc = fbc;
    let resolvedTtclid = ttclid;
    let resolvedTtp = ttp;
    let resolvedLandingPage: string | null = purchaseFallback?.landing_page || null;
    let resolvedReferrer: string | null = purchaseFallback?.referrer || null;

    if (purchaseFallback) {
      resolvedUtmCampaign = purchaseFallback.utm_campaign || resolvedUtmCampaign;
      resolvedUtmSource = purchaseFallback.utm_source || resolvedUtmSource;
      resolvedUtmMedium = purchaseFallback.utm_medium || resolvedUtmMedium;
      resolvedUtmContent = purchaseFallback.utm_content || resolvedUtmContent;
      resolvedUtmTerm = purchaseFallback.utm_term || resolvedUtmTerm;
      resolvedFbclid = purchaseFallback.fbclid || resolvedFbclid;
      resolvedGclid = purchaseFallback.gclid || resolvedGclid;
      resolvedFbp = purchaseFallback.fbp || resolvedFbp;
      resolvedFbc = purchaseFallback.fbc || resolvedFbc;
    }

    // ====== SESSION-BASED UTM RESOLUTION — ALWAYS prioritize session_attribution ======
    if (sessionId) {
      const { data: saData } = await supabase
        .from("session_attribution")
        .select("utm_campaign, utm_source, utm_medium, utm_content, utm_term, quiz_variant, fbclid, ttclid, fbp, fbc, gclid, ttp, landing_page, referrer")
        .eq("session_id", sessionId)
        .maybeSingle();
      if (saData) {
        resolvedUtmCampaign = saData.utm_campaign || resolvedUtmCampaign;
        resolvedUtmSource = saData.utm_source || resolvedUtmSource;
        resolvedUtmMedium = saData.utm_medium || resolvedUtmMedium;
        resolvedUtmContent = saData.utm_content || resolvedUtmContent;
        resolvedUtmTerm = saData.utm_term || resolvedUtmTerm;
        resolvedVariant = saData.quiz_variant || null;
        resolvedFbclid = saData.fbclid || resolvedFbclid;
        resolvedTtclid = saData.ttclid || resolvedTtclid;
        resolvedFbp = saData.fbp || resolvedFbp;
        resolvedFbc = saData.fbc || resolvedFbc;
        resolvedGclid = saData.gclid || resolvedGclid;
        resolvedTtp = saData.ttp || resolvedTtp;
        resolvedLandingPage = saData.landing_page || resolvedLandingPage;
        resolvedReferrer = saData.referrer || resolvedReferrer;
        console.log(`[Hub.la] Resolved from session_attribution: campaign=${resolvedUtmCampaign}, variant=${resolvedVariant}`);
      }

      // ====== FUNNEL_EVENTS FALLBACK — if session_attribution had no UTMs ======
      if (!resolvedUtmCampaign && !resolvedUtmSource) {
        const { data: feData } = await supabase
          .from("funnel_events")
          .select("event_data")
          .eq("session_id", sessionId)
          .eq("event_name", "step_viewed")
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();
        if (feData?.event_data) {
          const ed = feData.event_data as Record<string, unknown>;
          resolvedUtmCampaign = (ed.utm_campaign as string) || resolvedUtmCampaign;
          resolvedUtmSource = (ed.utm_source as string) || resolvedUtmSource;
          resolvedUtmMedium = (ed.utm_medium as string) || resolvedUtmMedium;
          resolvedUtmContent = (ed.utm_content as string) || resolvedUtmContent;
          resolvedUtmTerm = (ed.utm_term as string) || resolvedUtmTerm;
          resolvedFbclid = (ed.fbclid as string) || resolvedFbclid;
          resolvedTtclid = (ed.ttclid as string) || resolvedTtclid;
          if (resolvedUtmSource || resolvedFbclid) {
            console.log(`[Hub.la] Resolved UTMs from funnel_events: source=${resolvedUtmSource}, fbclid=${resolvedFbclid?.slice(-8)}`);
          }
        }
      }
    }

    // ====== FBCLID-BASED SOURCE — if we have fbclid but still no utm_source ======
    if (resolvedFbclid && !resolvedUtmSource) {
      resolvedUtmSource = "FB";
      console.log(`[Hub.la] Set utm_source=FB based on fbclid presence`);
    }
    if (resolvedTtclid && !resolvedUtmSource) {
      resolvedUtmSource = "tiktok";
      console.log(`[Hub.la] Set utm_source=tiktok based on ttclid presence`);
    }

    console.log(`[Hub.la] Amount: ${amount}, Status: ${normalizedStatus}, Step: ${funnelStep}, Email: ${email}, Product: ${productName}, OfferId: ${offerId}, OfferName: ${offerName}`);

    let matched = false;
    let recordId: string | null = null;
    let alreadySentCAPI = false;

    // ====== DEDUPLICATION ======
    if (transactionId) {
      const { data: existing } = await supabase
        .from("purchase_tracking")
        .select("id, status, conversion_api_sent")
        .eq("transaction_id", transactionId)
        .maybeSingle();

      if (existing) {
        alreadySentCAPI = existing.conversion_api_sent === true;
        const { data, error } = await supabase
          .from("purchase_tracking")
          .update({
            status: normalizedStatus,
            amount, email: normalizedEmail ?? email,
            buyer_name: buyerName,
            product_name: productName,
            plan_id: planId,
            funnel_step: funnelStep,
            whop_payment_id: paymentId,
            session_id: sessionId,
            utm_source: resolvedUtmSource, utm_medium: resolvedUtmMedium,
            utm_campaign: resolvedUtmCampaign, utm_content: resolvedUtmContent, utm_term: resolvedUtmTerm,
            fbclid: resolvedFbclid, gclid: resolvedGclid, fbp: resolvedFbp, fbc: resolvedFbc,
            landing_page: resolvedLandingPage, referrer: resolvedReferrer,
            vsl_variant: resolvedVariant,
          })
          .eq("transaction_id", transactionId)
          .select()
          .single();

        if (!error && data) {
          matched = true;
          recordId = data.id;
          console.log(`[Hub.la] Updated existing record ${transactionId} (${existing.status} -> ${normalizedStatus}) -> ${funnelStep}`);
        }
      }
    }

    if (!matched) {
      const insertData: Record<string, unknown> = {
        transaction_id: transactionId,
        plan_id: planId,
        product_name: productName,
        amount, email: normalizedEmail ?? email,
        buyer_name: buyerName,
        status: normalizedStatus,
        funnel_step: funnelStep,
        session_id: sessionId,
        utm_source: resolvedUtmSource, utm_medium: resolvedUtmMedium,
        utm_campaign: resolvedUtmCampaign, utm_content: resolvedUtmContent, utm_term: resolvedUtmTerm,
        fbclid: resolvedFbclid, gclid: resolvedGclid, fbp: resolvedFbp, fbc: resolvedFbc,
        landing_page: resolvedLandingPage, referrer: resolvedReferrer,
        vsl_variant: resolvedVariant,
        redirect_source: "hubla_webhook",
        user_agent: req.headers.get("user-agent") || "hubla-webhook",
      };

      const extraMeta = {
        event, buyer_name: buyerName, phone,
        payment_method: paymentMethod, checkout_id: checkoutId,
        offer_id: offerId, offer_name: offerName,
        product_id: productId, currency,
        sck, src, raw_status: rawStatus,
        hubla_event_id: body.id,
        received_at: new Date().toISOString(),
      };
      insertData.event_id = JSON.stringify(extraMeta);

      const { data, error } = await supabase
        .from("purchase_tracking")
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error("[Hub.la] Insert error:", error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      recordId = data.id;
      console.log(`[Hub.la] New record: ${data.id} -> ${funnelStep} R$${amount}`);
    }

    // ====== RETROACTIVE BACKFILL FOR SAME EMAIL ======
    if (sessionId && normalizedEmail && recordId) {
      const { data: orphanRows } = await supabase
        .from("purchase_tracking")
        .select("id, session_id, utm_campaign")
        .eq("email", normalizedEmail)
        .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .neq("id", recordId)
        .order("created_at", { ascending: false })
        .limit(10);

      const orphanIds = (orphanRows || [])
        .filter((row) => !row.session_id || !row.utm_campaign)
        .map((row) => row.id);

      if (orphanIds.length > 0) {
        await supabase
          .from("purchase_tracking")
          .update({
            session_id: sessionId,
            utm_source: resolvedUtmSource,
            utm_medium: resolvedUtmMedium,
            utm_campaign: resolvedUtmCampaign,
            utm_content: resolvedUtmContent,
            utm_term: resolvedUtmTerm,
            fbclid: resolvedFbclid,
            gclid: resolvedGclid,
            fbp: resolvedFbp,
            fbc: resolvedFbc,
            landing_page: resolvedLandingPage,
            referrer: resolvedReferrer,
            vsl_variant: resolvedVariant,
          })
          .in("id", orphanIds);

        console.log(`[Hub.la] Backfilled ${orphanIds.length} orphan purchase(s) for ${normalizedEmail}`);
      }
    }

    // ====== FACEBOOK CAPI — PURCHASE EVENT ======
    let capiSent = false;
    if (normalizedStatus === "approved" && !alreadySentCAPI) {
      try {
        const pixels = [
          { id: Deno.env.get("FB_PIXEL_ID"), token: Deno.env.get("FB_ACCESS_TOKEN") },
          { id: "952975541025077", token: Deno.env.get("FB_ACCESS_TOKEN_2") },
          { id: "1595773305052852", token: Deno.env.get("FB_ACCESS_TOKEN_3") },
          { id: "1347337003982438", token: Deno.env.get("FB_ACCESS_TOKEN_4") },
        ].filter(p => p.id && p.token);

        if (pixels.length > 0) {
          const userData: Record<string, string> = {};
          if (normalizedEmail) {
            userData.em = await hashSHA256(normalizedEmail);
          }
          if (phone) {
            userData.ph = await hashSHA256(phone.replace(/\D/g, ""));
          }
          if (resolvedFbc) userData.fbc = resolvedFbc;
          else if (resolvedFbclid) userData.fbc = `fb.1.${Date.now()}.${resolvedFbclid}`;
          if (resolvedFbp) userData.fbp = resolvedFbp;
          if (clientIp) userData.client_ip_address = clientIp;
          const userAgent = req.headers.get("user-agent");
          if (userAgent) userData.client_user_agent = userAgent;

          const eventId = `purchase_${transactionId || Date.now()}_${Date.now()}`;

          const eventData = {
            event_name: "Purchase",
            event_time: Math.floor(Date.now() / 1000),
            event_id: eventId,
            action_source: "website",
            user_data: userData,
            custom_data: { currency: "BRL", value: amount },
          };

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
            if (r.status === "rejected") console.warn(`[Hub.la CAPI] Pixel ${pixels[i].id} failed:`, r.reason);
          });

          if (anySuccess) {
            capiSent = true;
            if (recordId) {
              await supabase
                .from("purchase_tracking")
                .update({ conversion_api_sent: true })
                .eq("id", recordId);
            }
            console.log(`[Hub.la CAPI] Sent Purchase for ${normalizedEmail} to ${pixels.length} pixels (event_id: ${eventId})`);
          } else {
            console.error(`[Hub.la CAPI] All pixels failed for ${normalizedEmail}`);
          }
        } else {
          console.warn("[Hub.la CAPI] No FB pixel credentials configured");
        }
      } catch (capiErr) {
        console.warn("[Hub.la CAPI] Error:", capiErr);
      }
    }

    // ====== TIKTOK EVENTS API ======
    let tiktokSent = false;
    if (normalizedStatus === "approved") {
      try {
        const tiktokToken = Deno.env.get("TIKTOK_ACCESS_TOKEN");
        if (tiktokToken) {
          const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
          const ttResp = await fetch(`${supabaseUrl}/functions/v1/tiktok-capi`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              event_name: "CompletePayment",
              event_id: `tt_purchase_${transactionId || Date.now()}`,
              email, phone, amount,
              currency: "BRL",
              ttclid: resolvedTtclid,
              ttp: resolvedTtp,
              ip: clientIp,
              user_agent: req.headers.get("user-agent"),
              source_url: "https://payx-gpt.github.io/ganhostempolivre",
              session_id: sessionId,
            }),
          });
          const ttResult = await ttResp.json();
          tiktokSent = ttResult.sent === true;
          console.log(`[Hub.la TikTok] ${tiktokSent ? "Sent" : "Skipped"}`, ttResult);
        }
      } catch (ttErr) {
        console.warn("[Hub.la TikTok] Error:", ttErr);
      }
    }

    // ====== WHATSAPP: COMPRA APROVADA — ENVIAR WELCOME IMEDIATO ======
    if (normalizedStatus === "approved" && phone && (funnelStep === "front_37" || funnelStep === "front_47" || funnelStep === "front_66")) {
      try {
        const cleanPhone = phone.replace(/\D/g, "");
        const firstName = buyerName ? buyerName.split(" ")[0] : "";
        const greeting = firstName ? `, ${firstName}` : "";

        // Mark any existing queue entries as purchased
        const phoneSuffix = cleanPhone.slice(-9);
        if (phoneSuffix.length >= 8) {
          await supabase
            .from("whatsapp_welcome_queue")
            .update({ purchased: true, purchased_at: new Date().toISOString(), lead_type: "post_purchase" })
            .eq("sent", false)
            .ilike("phone", `%${phoneSuffix}`);
        }

        // Check if we already sent a welcome to this phone
        const { data: existingConvo } = await supabase
          .from("whatsapp_conversations")
          .select("id")
          .eq("phone", cleanPhone)
          .eq("direction", "outgoing")
          .limit(1);

        if (!existingConvo || existingConvo.length === 0) {
          // No conversation yet — send welcome immediately
          const welcomeMsg = `Opa${greeting}! Aqui é o Mark. Seja muito bem-vindo(a) à nossa plataforma! 🎉

Seu acesso já está liberado! Anota aí:

- Site: https://alfahibrida.com/login
- Email: ${email || "(o mesmo que você usou na compra)"}
- Senha: 123456

Consegue acessar agora pra gente já dar os próximos passos juntos?`;

          // Save to conversations
          await supabase.from("whatsapp_conversations").insert({
            phone: cleanPhone,
            direction: "outgoing",
            message: welcomeMsg,
            ai_generated: true,
            lead_name: firstName || null,
          });

          // Send via whatsapp-send
          const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
          const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
          const sendRes = await fetch(`${supabaseUrl}/functions/v1/whatsapp-send`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({ phone: cleanPhone, message: welcomeMsg }),
          });
          const sendData = await sendRes.json();
          console.log(`[Hub.la WhatsApp] Welcome sent to ${cleanPhone}: ${sendRes.ok}`, sendData);
        } else {
          console.log(`[Hub.la WhatsApp] Phone ${cleanPhone} already has conversation, skipping welcome`);
        }
      } catch (wqErr) {
        console.warn("[Hub.la WhatsApp] Error sending welcome:", wqErr);
      }
    }

    // ====== WHATSAPP WELCOME QUEUE: Mark purchase for non-front products ======
    if (normalizedStatus === "approved" && phone) {
      try {
        const phoneSuffix = phone.replace(/\D/g, "").slice(-9);
        if (phoneSuffix.length >= 8) {
          await supabase
            .from("whatsapp_welcome_queue")
            .update({ purchased: true, purchased_at: new Date().toISOString() })
            .eq("sent", false)
            .ilike("phone", `%${phoneSuffix}`);
          console.log(`[Hub.la WhatsApp Queue] Marked purchase for phone suffix: ${phoneSuffix}`);
        }
      } catch (wqErr) {
        console.warn("[Hub.la WhatsApp Queue] Error marking purchase:", wqErr);
      }
    }

    // ====== AUDIT LOG ======
    await supabase.from("funnel_audit_logs").insert({
      event_type: `hubla_${normalizedStatus}`,
      page_id: funnelStep,
      session_id: sessionId || `webhook_${Date.now()}`,
      status: normalizedStatus === "approved" ? "success" : "pending",
      metadata: {
        transaction_id: transactionId,
        email, amount, phone,
        product_name: productName,
        product_id: productId,
        offer_id: offerId, offer_name: offerName,
        funnel_step: funnelStep,
        payment_method: paymentMethod, buyer_name: buyerName,
        event, raw_status: rawStatus,
        hubla_event_id: body.id,
        capi_sent: capiSent,
        tiktok_sent: tiktokSent,
      },
    });

    return new Response(JSON.stringify({ success: true, status: normalizedStatus, amount, funnel_step: funnelStep, capi_sent: capiSent, tiktok_sent: tiktokSent }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[Hub.la] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
