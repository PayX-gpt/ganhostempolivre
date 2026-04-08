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
  if (name.includes("circulo") || name.includes("círculo") || offer.includes("circulo")) return "circulo_interno";
  if (name.includes("safety") || offer.includes("safety") || name.includes("proteção") || offer.includes("proteção")) return "safety_pro";
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

function identifyFunnelStep(body: any, amount: number | null): string {
  const offerId = body.products?.[0]?.offer_id || null;
  const offerName = body.products?.[0]?.offer_name || null;
  const productName = body.products?.[0]?.name || body.product_name || null;
  if (offerId && OFFER_ID_MAP[offerId]) return OFFER_ID_MAP[offerId];
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

function extractAmount(body: any): number | null {
  const candidates: unknown[] = [
    body.total_price,
    body.total,
    body.amount,
    body.valor,
    body.price,
    body.preco,
    body.value,
    body.fiscal?.total_value,
    body.fiscal?.original_value,
    body.products?.[0]?.price,
    body.products?.[0]?.total_price,
    body.products?.[0]?.amount,
    body.payment?.amount,
  ];

  for (const candidate of candidates) {
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
    const funnelStep = identifyFunnelStep(body, amount);

    const email = body.customer?.email || body.email || body.buyer_email || body.cliente_email || null;
    const normalizedEmail = typeof email === "string" ? email.toLowerCase().trim() : null;
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
    const gtlSid = utmData.gtl_sid || body.gtl_sid || null;
    const fbclid = body.cookies?.fbclid || body.fbclid || null;
    const gclid = body.cookies?.gclid || body.gclid || null;
    const fbp = body.cookies?.fbp || null;
    const fbc = body.cookies?.fbc || null;
    const ttclid = body.cookies?.ttclid || body.ttclid || utmData.ttclid || null;
    const ttp = body.cookies?.ttp || body.ttp || null;
    const clientIp = body.ip || null;

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
    
    console.log(`🔍 [Kirvano] Session resolution: gtl_sid=${gtlSid}, src=${src}, resolved=${sessionId}`);

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
          console.log(`📱 [Kirvano] Resolved session via phone: ${phoneSuffix} → ${sessionId}`);
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
        console.log(`📧 [Kirvano] Resolved session via email: ${normalizedEmail} → ${sessionId}`);
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
        console.log(`♻️ [Kirvano] Resolved session via purchase history: ${normalizedEmail} → ${sessionId}`);
      }
    }

    // ====== SAVE EMAIL→SESSION MAPPING (for future lookups) ======
    if (sessionId && normalizedEmail) {
      await supabase.from("email_session_map").upsert(
        { email: normalizedEmail, session_id: sessionId },
        { onConflict: "email,session_id", ignoreDuplicates: true }
      ).then(() => {});
    }

    // ====== DECODE UTMs from Kirvano payload ======
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
        // Always overwrite with session_attribution data when available
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
        console.log(`🎯 [Kirvano] Resolved from session_attribution: campaign=${resolvedUtmCampaign}, variant=${resolvedVariant}`);
      }
    }

    const statusMap: Record<string, string> = {
      approved: "approved", aprovado: "approved", paid: "approved", pago: "approved",
      completed: "approved", completo: "approved", sale_approved: "approved",
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
          console.log(`✅ [Kirvano] Updated existing record ${transactionId} (${existing.status} → ${normalizedStatus}) → ${funnelStep}`);
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
        redirect_source: "kirvano_webhook",
        user_agent: req.headers.get("user-agent") || "kirvano-webhook",
      };

      const extraMeta = {
        event, buyer_name: buyerName, phone,
        payment_method: paymentMethod, checkout_id: checkoutId,
        offer_id: offerId, offer_name: offerName,
        sck, src, raw_status: status,
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

      recordId = data.id;
      console.log(`✅ [Kirvano] New record: ${data.id} → ${funnelStep} R$${amount}`);
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

        console.log(`♻️ [Kirvano] Backfilled ${orphanIds.length} orphan purchase(s) for ${normalizedEmail}`);
      }
    }

    // ====== FACEBOOK CAPI — DISABLED ======
    const capiSent = false;

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
              source_url: "https://ganhostempolivre.lovable.app",
              session_id: sessionId,
            }),
          });
          const ttResult = await ttResp.json();
          tiktokSent = ttResult.sent === true;
          console.log(`🎵 [TikTok] ${tiktokSent ? "✅ Sent" : "⏭️ Skipped"}`, ttResult);
        }
      } catch (ttErr) {
        console.warn("⚠️ [TikTok CAPI] Error:", ttErr);
      }
    }

    // ====== WHATSAPP: COMPRA APROVADA → ENVIAR WELCOME IMEDIATO ======
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
          console.log(`📱 [Kirvano→WhatsApp] Welcome sent to ${cleanPhone}: ${sendRes.ok}`, sendData);
        } else {
          console.log(`📱 [Kirvano→WhatsApp] Phone ${cleanPhone} already has conversation, skipping welcome`);
        }
      } catch (wqErr) {
        console.warn("⚠️ [Kirvano→WhatsApp] Error sending welcome:", wqErr);
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
          console.log(`📱 [WhatsApp Queue] Marked purchase for phone suffix: ${phoneSuffix}`);
        }
      } catch (wqErr) {
        console.warn("⚠️ [WhatsApp Queue] Error marking purchase:", wqErr);
      }
    }

    // ====== AUDIT LOG ======
    await supabase.from("funnel_audit_logs").insert({
      event_type: `kirvano_${normalizedStatus}`,
      page_id: funnelStep,
      session_id: sessionId || `webhook_${Date.now()}`,
      status: normalizedStatus === "approved" ? "success" : "pending",
      metadata: {
        transaction_id: transactionId,
        email, amount, phone,
        product_name: productName,
        offer_id: offerId, offer_name: offerName,
        funnel_step: funnelStep,
        payment_method: paymentMethod, buyer_name: buyerName,
        event, raw_status: status,
        capi_sent: capiSent,
        tiktok_sent: tiktokSent,
      },
    });

    return new Response(JSON.stringify({ success: true, status: normalizedStatus, amount, funnel_step: funnelStep, capi_sent: capiSent, tiktok_sent: tiktokSent }), {
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
