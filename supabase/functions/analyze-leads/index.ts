import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action } = await req.json();

    if (action === "score") return handleScoring(supabase);
    if (action === "insights") return handleInsights(supabase, lovableKey);
    if (action === "buyer-analysis") return handleBuyerAnalysis(supabase, lovableKey);
    if (action === "full-funnel") return handleFullFunnelAnalysis(supabase, lovableKey);

    return jsonResponse({ error: "Invalid action" }, 400);
  } catch (e) {
    console.error("analyze-leads error:", e);
    return jsonResponse({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

// ─── SCORING ────────────────────────────────────────────────
async function handleScoring(supabase: any) {
  const { data: leads } = await supabase
    .from("lead_behavior").select("*").is("intent_score", null)
    .order("created_at", { ascending: false }).limit(20);

  if (!leads || leads.length === 0) return jsonResponse({ scored: 0 });

  let scored = 0;
  for (const lead of leads) {
    const score = computeIntentScore(lead);
    const label = score >= 80 ? "buyer" : score >= 60 ? "hot" : score >= 35 ? "warm" : "cold";
    const tags = computeSegmentTags(lead);
    await supabase.from("lead_behavior")
      .update({ intent_score: score, intent_label: label, segment_tags: tags })
      .eq("id", lead.id);
    scored++;
  }
  return jsonResponse({ scored });
}

// ─── INSIGHTS ───────────────────────────────────────────────
async function handleInsights(supabase: any, lovableKey: string) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: leads } = await supabase
    .from("lead_behavior").select("*").gte("created_at", since)
    .order("created_at", { ascending: false }).limit(100);

  if (!leads || leads.length === 0) {
    return jsonResponse({ insights: "Sem dados suficientes nas últimas 24h para gerar insights." });
  }

  const stats = aggregateStats(leads);
  const buyerCorrelation = await correlateLeadsWithPurchases(supabase, leads, since);
  const revenueData = await getRevenueData(supabase, since);
  const funnelFlow = await getFunnelFlowData(supabase, since);

  const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        {
          role: "system",
          content: `Você é um analista de conversão e ROI especializado em funis de vendas digitais no Brasil.
Analise os dados comportamentais, de receita e funil completo. Gere insights ACIONÁVEIS em português brasileiro.
Foque em:
1. 💰 RECEITA: ticket médio, receita total, vendas por hora, tendência
2. 📊 FUNIL: onde mais leads abandonam, taxa de conversão por etapa
3. 🎯 SEGMENTOS: quais convertem mais, quais pagam mais
4. 💡 OPORTUNIDADES: onde aumentar preço, onde melhorar conversão
5. 🔄 UPSELLS: taxas de aceitação, receita adicional
6. ⚡ AÇÕES IMEDIATAS: top 3 coisas para fazer AGORA para vender mais

Seja direto, prático, use números. Máximo 600 palavras.`,
        },
        {
          role: "user",
          content: `DADOS 24H DO FUNIL:

RECEITA:
${JSON.stringify(revenueData, null, 2)}

FUNIL (visitantes por etapa):
${JSON.stringify(funnelFlow, null, 2)}

COMPORTAMENTO:
- Total leads na oferta: ${stats.total}
- Clicaram checkout: ${stats.checkoutClicks} (${stats.checkoutRate}%)
- Score médio: ${stats.avgScore}/100
- Tempo médio: ${stats.avgTimeOnPage}s
- Scroll médio: ${stats.avgScroll}%
- Vídeo: ${stats.videoStarted} (${stats.videoRate}%)
- Hesitações CTA: ${stats.avgHesitations}

CORRELAÇÃO LEAD → COMPRA:
${JSON.stringify(buyerCorrelation, null, 2)}

SEGMENTAÇÃO:
- Idade: ${JSON.stringify(stats.byAge)}
- Obstáculo: ${JSON.stringify(stats.byObstacle)}
- Meta: ${JSON.stringify(stats.byGoal)}
- Saldo: ${JSON.stringify(stats.byBalance)}

SCORES: Cold:${stats.scoreDist.cold} Warm:${stats.scoreDist.warm} Hot:${stats.scoreDist.hot} Buyer:${stats.scoreDist.buyer}`,
        },
      ],
    }),
  });

  if (!aiResponse.ok) {
    const errText = await aiResponse.text();
    console.error("AI error:", aiResponse.status, errText);
    if (aiResponse.status === 429) return jsonResponse({ error: "Rate limit exceeded." }, 429);
    return jsonResponse({ error: "AI analysis failed" }, 500);
  }

  const aiData = await aiResponse.json();
  const insights = aiData.choices?.[0]?.message?.content || "Sem insights disponíveis.";
  return jsonResponse({ insights, stats, buyerCorrelation, revenueData, funnelFlow });
}

// ─── BUYER ANALYSIS ─────────────────────────────────────────
async function handleBuyerAnalysis(supabase: any, lovableKey: string) {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: leads } = await supabase
    .from("lead_behavior").select("*").gte("created_at", since)
    .order("created_at", { ascending: false }).limit(500);

  if (!leads || leads.length === 0) {
    return jsonResponse({ analysis: "Sem dados suficientes nos últimos 7 dias." });
  }

  const correlation = await correlateLeadsWithPurchases(supabase, leads, since);
  const priceSuggestions = computePriceSuggestions(leads, correlation);
  const revenueData = await getRevenueData(supabase, since);

  const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        {
          role: "system",
          content: `Você é um estrategista de precificação, ROI e conversão de funis digitais no Brasil.
Analise compradores vs não-compradores COM DADOS DE RECEITA REAL e forneça:

1. 🎯 PERFIL DO COMPRADOR IDEAL: características + ticket médio
2. 🚫 PERFIL DO ABANDONADOR: o que têm em comum
3. 💰 ESTRATÉGIA DE PREÇO: por segmento, pode subir/descer/manter + quanto
4. 📈 ROI: custo por IC, receita por lead, LTV estimado com upsells
5. 🔧 AJUSTES NO FUNIL: mudanças específicas para converter mais
6. 🔄 UPSELLS: taxa de aceitação atual, como melhorar
7. 📊 SCORE DE OPORTUNIDADE: cada segmento de 1-10

Seja extremamente prático. Use números reais. Máximo 800 palavras. Português brasileiro.`,
        },
        {
          role: "user",
          content: `DADOS 7 DIAS:

RECEITA REAL:
${JSON.stringify(revenueData, null, 2)}

CORRELAÇÃO COMPRADOR vs NÃO-COMPRADOR:
${JSON.stringify(correlation, null, 2)}

SUGESTÕES DE PREÇO POR SEGMENTO:
${JSON.stringify(priceSuggestions, null, 2)}

TOTAL LEADS: ${leads.length}
LEADS COM CHECKOUT: ${leads.filter((l: any) => l.checkout_clicked).length}
PREÇO DINÂMICO MÉDIO: R$${(leads.reduce((a: number, l: any) => a + (l.dynamic_price || 0), 0) / leads.length).toFixed(2)}`,
        },
      ],
    }),
  });

  if (!aiResponse.ok) {
    const errText = await aiResponse.text();
    console.error("AI buyer-analysis error:", aiResponse.status, errText);
    if (aiResponse.status === 429) return jsonResponse({ error: "Rate limit exceeded." }, 429);
    return jsonResponse({ error: "AI analysis failed" }, 500);
  }

  const aiData = await aiResponse.json();
  const analysis = aiData.choices?.[0]?.message?.content || "Sem análise disponível.";
  return jsonResponse({ analysis, correlation, priceSuggestions, revenueData });
}

// ─── FULL FUNNEL ANALYSIS (new) ─────────────────────────────
async function handleFullFunnelAnalysis(supabase: any, lovableKey: string) {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [leads24h, leads7d, revenue24h, revenue7d, funnelFlow, upsellData] = await Promise.all([
    supabase.from("lead_behavior").select("*").gte("created_at", since24h).order("created_at", { ascending: false }).limit(200).then((r: any) => r.data || []),
    supabase.from("lead_behavior").select("*").gte("created_at", since7d).order("created_at", { ascending: false }).limit(500).then((r: any) => r.data || []),
    getRevenueData(supabase, since24h),
    getRevenueData(supabase, since7d),
    getFunnelFlowData(supabase, since24h),
    getUpsellData(supabase, since7d),
  ]);

  const correlation = await correlateLeadsWithPurchases(supabase, leads7d, since7d);

  const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        {
          role: "system",
          content: `Você é o diretor de growth de um funil de vendas digital no Brasil. Faça uma análise COMPLETA e estratégica.

ESTRUTURA DO FUNIL:
- 19 etapas de quiz (step-1 a step-19): qualificação do lead
- Página de oferta (step-19): onde o lead vê o preço personalizado e decide comprar
- Checkout: processamento do pagamento
- Upsell 1 (Acelerador): primeira oferta pós-compra
- Upsell 2 (Multiplicador): planos Prata/Ouro/Diamante
- Upsell 3 (Blindagem): proteção vitalícia
- Upsell 4 (Círculo Interno): comunidade VIP

ANALISE E RESPONDA:

1. 📊 DIAGNÓSTICO GERAL: saúde do funil, receita, conversão
2. 🔍 GARGALOS: onde mais leads abandonam e POR QUÊ
3. 💰 RECEITA: ticket médio, receita por lead, projeção mensal
4. 🔄 UPSELLS: taxa de aceitação de cada um, receita adicional, como melhorar
5. 🎯 SEGMENTOS MAIS LUCRATIVOS: quem compra mais, quem paga mais
6. ⚡ TOP 5 AÇÕES para aumentar receita IMEDIATAMENTE
7. 📈 ESTRATÉGIA DE PREÇO: por segmento, baseado em dados reais
8. 🧠 PADRÕES OCULTOS: correlações não óbvias nos dados
9. 💡 NOVAS OPORTUNIDADES: o que adicionar ao funil

Seja extremamente prático e direto. Use NÚMEROS REAIS. Máximo 1000 palavras.`,
        },
        {
          role: "user",
          content: `===== DADOS REAIS =====

RECEITA 24H:
${JSON.stringify(revenue24h, null, 2)}

RECEITA 7 DIAS:
${JSON.stringify(revenue7d, null, 2)}

FLUXO DO FUNIL (24h - visitantes por etapa):
${JSON.stringify(funnelFlow, null, 2)}

UPSELLS (7 dias):
${JSON.stringify(upsellData, null, 2)}

LEADS 24H: ${leads24h.length}
LEADS 7D: ${leads7d.length}

CORRELAÇÃO COMPRADOR vs NÃO-COMPRADOR (7d):
Total buyers: ${correlation.totalBuyers}
Total non-buyers: ${correlation.totalNonBuyers}
Taxa conversão: ${correlation.conversionRate}%
Buyer profile: ${JSON.stringify(correlation.buyers)}
Non-buyer profile: ${JSON.stringify(correlation.nonBuyers)}

SEGMENTOS (7d):
${JSON.stringify(correlation.segmentComparison, null, 2)}

COMPORTAMENTO MÉDIO (24h):
- Checkout rate: ${leads24h.length > 0 ? ((leads24h.filter((l: any) => l.checkout_clicked).length / leads24h.length) * 100).toFixed(1) : 0}%
- Score médio: ${leads24h.length > 0 ? Math.round(leads24h.filter((l: any) => l.intent_score != null).reduce((a: number, l: any) => a + (l.intent_score || 0), 0) / (leads24h.filter((l: any) => l.intent_score != null).length || 1)) : 0}
- Tempo médio: ${leads24h.length > 0 ? Math.round(leads24h.reduce((a: number, l: any) => a + (l.time_on_page_ms || 0), 0) / leads24h.length / 1000) : 0}s
- Hesitações: ${leads24h.length > 0 ? (leads24h.reduce((a: number, l: any) => a + (l.cta_hesitation_count || 0), 0) / leads24h.length).toFixed(1) : 0}`,
        },
      ],
    }),
  });

  if (!aiResponse.ok) {
    const errText = await aiResponse.text();
    console.error("AI full-funnel error:", aiResponse.status, errText);
    if (aiResponse.status === 429) return jsonResponse({ error: "Rate limit exceeded." }, 429);
    return jsonResponse({ error: "AI analysis failed" }, 500);
  }

  const aiData = await aiResponse.json();
  const analysis = aiData.choices?.[0]?.message?.content || "Sem análise disponível.";
  return jsonResponse({ analysis, revenue24h, revenue7d, funnelFlow, upsellData, correlation });
}

// ─── REVENUE DATA ───────────────────────────────────────────
async function getRevenueData(supabase: any, since: string) {
  const { data: purchases } = await supabase
    .from("purchase_tracking")
    .select("amount, status, email, product_name, created_at, session_id")
    .gte("created_at", since);

  if (!purchases) return { totalRevenue: 0, totalSales: 0, avgTicket: 0, byStatus: {}, byProduct: {}, byHour: {} };

  const approved = purchases.filter((p: any) => ["approved", "completed", "purchased"].includes(p.status));
  const totalRevenue = approved.reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0);
  const totalSales = approved.length;
  const avgTicket = totalSales > 0 ? totalRevenue / totalSales : 0;

  // By status
  const byStatus: Record<string, { count: number; revenue: number }> = {};
  purchases.forEach((p: any) => {
    if (!byStatus[p.status]) byStatus[p.status] = { count: 0, revenue: 0 };
    byStatus[p.status].count++;
    byStatus[p.status].revenue += parseFloat(p.amount) || 0;
  });

  // By product
  const byProduct: Record<string, { count: number; revenue: number }> = {};
  approved.forEach((p: any) => {
    const name = p.product_name || "Principal";
    if (!byProduct[name]) byProduct[name] = { count: 0, revenue: 0 };
    byProduct[name].count++;
    byProduct[name].revenue += parseFloat(p.amount) || 0;
  });

  // Unique buyers
  const uniqueBuyers = new Set(approved.filter((p: any) => p.email).map((p: any) => p.email.toLowerCase())).size;

  return {
    totalRevenue: +totalRevenue.toFixed(2),
    totalSales,
    avgTicket: +avgTicket.toFixed(2),
    uniqueBuyers,
    revenuePerLead: 0, // Will be calculated with lead count
    byStatus,
    byProduct,
    pending: purchases.filter((p: any) => p.status === "pending").length,
    refused: purchases.filter((p: any) => p.status === "refused").length,
    abandoned: purchases.filter((p: any) => p.status === "ABANDONED_CART").length,
  };
}

// ─── FUNNEL FLOW DATA ───────────────────────────────────────
async function getFunnelFlowData(supabase: any, since: string) {
  const STEPS = [
    "/step-1", "/step-2", "/step-3", "/step-4", "/step-5", "/step-6", "/step-7",
    "/step-8", "/step-9", "/step-10", "/step-11", "/step-12", "/step-13",
    "/step-14", "/step-15", "/step-16", "/step-17", "/step-18", "/step-19",
    "/upsell1", "/upsell2", "/upsell3", "/upsell4",
  ];

  const { data: pageLoads } = await supabase
    .from("funnel_audit_logs")
    .select("page_id, session_id")
    .eq("event_type", "page_loaded")
    .gte("created_at", since);

  if (!pageLoads) return {};

  const stepCounts: Record<string, Set<string>> = {};
  STEPS.forEach(s => { stepCounts[s] = new Set(); });

  pageLoads.forEach((log: any) => {
    let pid = log.page_id || "";
    // Map upsell sub-pages
    if (pid.startsWith("/upsell") && !stepCounts[pid]) {
      if (pid.includes("4") || pid.includes("sucesso")) pid = "/upsell4";
      else if (pid.includes("3")) pid = "/upsell3";
      else if (pid.includes("2")) pid = "/upsell2";
      else pid = "/upsell1";
    }
    if (stepCounts[pid]) stepCounts[pid].add(log.session_id);
  });

  const result: Record<string, { visitors: number; dropOff: string }> = {};
  const stepEntries = STEPS.map(s => ({ step: s, count: stepCounts[s]?.size || 0 }));

  for (let i = 0; i < stepEntries.length; i++) {
    const prev = i > 0 ? stepEntries[i - 1].count : stepEntries[i].count;
    const dropOff = prev > 0 ? (((prev - stepEntries[i].count) / prev) * 100).toFixed(1) : "0";
    result[stepEntries[i].step] = { visitors: stepEntries[i].count, dropOff: i === 0 ? "0" : dropOff };
  }

  return result;
}

// ─── UPSELL DATA ────────────────────────────────────────────
async function getUpsellData(supabase: any, since: string) {
  const { data: upsellEvents } = await supabase
    .from("funnel_audit_logs")
    .select("event_type, page_id, session_id, metadata")
    .in("event_type", ["upsell_oneclick_buy", "upsell_oneclick_decline", "page_loaded"])
    .gte("created_at", since);

  if (!upsellEvents) return {};

  const upsells: Record<string, { views: number; buys: number; declines: number; revenue: number }> = {
    "/upsell1": { views: 0, buys: 0, declines: 0, revenue: 0 },
    "/upsell2": { views: 0, buys: 0, declines: 0, revenue: 0 },
    "/upsell3": { views: 0, buys: 0, declines: 0, revenue: 0 },
    "/upsell4": { views: 0, buys: 0, declines: 0, revenue: 0 },
  };

  const viewedSessions: Record<string, Set<string>> = {
    "/upsell1": new Set(), "/upsell2": new Set(), "/upsell3": new Set(), "/upsell4": new Set(),
  };

  upsellEvents.forEach((e: any) => {
    let page = e.page_id || "";
    // Normalize page
    if (page.startsWith("/upsell") && !upsells[page]) {
      if (page.includes("4") || page.includes("sucesso")) page = "/upsell4";
      else if (page.includes("3")) page = "/upsell3";
      else if (page.includes("2")) page = "/upsell2";
      else page = "/upsell1";
    }

    if (!upsells[page]) return;

    if (e.event_type === "page_loaded") {
      if (!viewedSessions[page].has(e.session_id)) {
        viewedSessions[page].add(e.session_id);
        upsells[page].views++;
      }
    } else if (e.event_type === "upsell_oneclick_buy") {
      upsells[page].buys++;
      const meta = e.metadata as any;
      upsells[page].revenue += parseFloat(meta?.price) || 0;
    } else if (e.event_type === "upsell_oneclick_decline") {
      upsells[page].declines++;
    }
  });

  // Add acceptance rates
  const result: Record<string, any> = {};
  for (const [key, data] of Object.entries(upsells)) {
    const total = data.buys + data.declines;
    result[key] = {
      ...data,
      acceptanceRate: total > 0 ? +((data.buys / total) * 100).toFixed(1) : 0,
      viewToActionRate: data.views > 0 ? +(((data.buys + data.declines) / data.views) * 100).toFixed(1) : 0,
    };
  }

  return result;
}

// ─── CORRELATION ENGINE ─────────────────────────────────────
async function correlateLeadsWithPurchases(supabase: any, leads: any[], since: string) {
  const { data: purchases } = await supabase
    .from("purchase_tracking")
    .select("email, amount, status, session_id, product_name, created_at")
    .gte("created_at", since);

  const approvedStatuses = ["approved", "completed", "purchased", "redirected"];

  const approvedPurchases = (purchases || []).filter((p: any) => approvedStatuses.includes(p.status));

  const buyerEmails = new Set(
    approvedPurchases.map((p: any) => p.email?.toLowerCase()).filter(Boolean)
  );
  const buyerSessions = new Set(
    approvedPurchases.map((p: any) => p.session_id).filter(Boolean)
  );

  const buyers: any[] = [];
  const nonBuyers: any[] = [];

  for (const lead of leads) {
    const isBuyer = buyerSessions.has(lead.session_id) ||
      (lead.quiz_answers?.email && buyerEmails.has(lead.quiz_answers.email.toLowerCase()));
    (isBuyer ? buyers : nonBuyers).push(lead);
  }

  const profileBuyers = buildBehaviorProfile(buyers, "compradores");
  const profileNonBuyers = buildBehaviorProfile(nonBuyers, "nao_compradores");
  const segmentComparison = buildSegmentComparison(buyers, nonBuyers);

  // Revenue correlation
  const totalRevenue = approvedPurchases.reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0);
  const avgTicket = approvedPurchases.length > 0 ? totalRevenue / approvedPurchases.length : 0;

  return {
    totalLeads: leads.length,
    totalBuyers: buyers.length,
    totalNonBuyers: nonBuyers.length,
    conversionRate: leads.length > 0 ? ((buyers.length / leads.length) * 100).toFixed(1) : "0",
    totalRevenue: +totalRevenue.toFixed(2),
    avgTicket: +avgTicket.toFixed(2),
    revenuePerLead: leads.length > 0 ? +(totalRevenue / leads.length).toFixed(2) : 0,
    buyers: profileBuyers,
    nonBuyers: profileNonBuyers,
    segmentComparison,
  };
}

function buildBehaviorProfile(leads: any[], label: string) {
  if (leads.length === 0) return { label, count: 0 };
  const n = leads.length;
  return {
    label, count: n,
    avgTimeOnPageS: Math.round(leads.reduce((a: number, l: any) => a + (l.time_on_page_ms || 0), 0) / n / 1000),
    avgScroll: Math.round(leads.reduce((a: number, l: any) => a + (l.max_scroll_depth || 0), 0) / n),
    avgCtaClicks: +(leads.reduce((a: number, l: any) => a + (l.cta_clicks || 0), 0) / n).toFixed(1),
    avgHesitations: +(leads.reduce((a: number, l: any) => a + (l.cta_hesitation_count || 0), 0) / n).toFixed(1),
    videoRate: +((leads.filter((l: any) => l.video_started).length / n) * 100).toFixed(1),
    avgVideoWatchS: Math.round(leads.reduce((a: number, l: any) => a + (l.video_watch_time_ms || 0), 0) / n / 1000),
    checkoutRate: +((leads.filter((l: any) => l.checkout_clicked).length / n) * 100).toFixed(1),
    avgIntentScore: Math.round(leads.filter((l: any) => l.intent_score != null).reduce((a: number, l: any) => a + (l.intent_score || 0), 0) / (leads.filter((l: any) => l.intent_score != null).length || 1)),
    avgDynamicPrice: +(leads.reduce((a: number, l: any) => a + (l.dynamic_price || 0), 0) / n).toFixed(2),
    topAges: getTopValues(leads, "age"),
    topObstacles: getTopValues(leads, "obstacle"),
    topGoals: getTopValues(leads, "incomeGoal"),
    topBalances: getTopValues(leads, "accountBalance"),
  };
}

function getTopValues(leads: any[], quizKey: string) {
  const counts: Record<string, number> = {};
  leads.forEach((l: any) => {
    const val = l.quiz_answers?.[quizKey] || "unknown";
    counts[val] = (counts[val] || 0) + 1;
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1]).slice(0, 3)
    .map(([name, count]) => ({ name, count, pct: +((count / leads.length) * 100).toFixed(1) }));
}

function buildSegmentComparison(buyers: any[], nonBuyers: any[]) {
  const keys = ["age", "obstacle", "incomeGoal", "accountBalance"];
  const result: Record<string, any> = {};
  for (const key of keys) {
    const buyerGroups: Record<string, number> = {};
    const nonBuyerGroups: Record<string, number> = {};
    buyers.forEach((l: any) => { const v = l.quiz_answers?.[key] || "unknown"; buyerGroups[v] = (buyerGroups[v] || 0) + 1; });
    nonBuyers.forEach((l: any) => { const v = l.quiz_answers?.[key] || "unknown"; nonBuyerGroups[v] = (nonBuyerGroups[v] || 0) + 1; });
    const allValues = new Set([...Object.keys(buyerGroups), ...Object.keys(nonBuyerGroups)]);
    result[key] = Array.from(allValues).map(v => ({
      value: v, buyers: buyerGroups[v] || 0, nonBuyers: nonBuyerGroups[v] || 0,
      convRate: (buyerGroups[v] || 0) + (nonBuyerGroups[v] || 0) > 0
        ? +(((buyerGroups[v] || 0) / ((buyerGroups[v] || 0) + (nonBuyerGroups[v] || 0))) * 100).toFixed(1) : 0,
    })).sort((a: any, b: any) => b.convRate - a.convRate);
  }
  return result;
}

function computePriceSuggestions(leads: any[], correlation: any) {
  const segments = correlation.segmentComparison || {};
  const suggestions: Record<string, any[]> = {};
  for (const [key, values] of Object.entries(segments)) {
    suggestions[key] = (values as any[]).map((seg: any) => {
      const segLeads = leads.filter((l: any) => l.quiz_answers?.[key] === seg.value);
      const avgPrice = segLeads.length > 0
        ? +(segLeads.reduce((a: number, l: any) => a + (l.dynamic_price || 0), 0) / segLeads.length).toFixed(2) : 0;
      let recommendation = "manter";
      if (seg.convRate > 15) recommendation = "pode_aumentar";
      else if (seg.convRate > 5) recommendation = "manter";
      else if (seg.convRate > 0) recommendation = "testar_reducao";
      else recommendation = "revisar_funil";
      return { segment: seg.value, currentAvgPrice: avgPrice, conversionRate: seg.convRate, totalLeads: seg.buyers + seg.nonBuyers, recommendation };
    });
  }
  return suggestions;
}

function computeIntentScore(lead: any): number {
  let score = 0;
  const timeS = (lead.time_on_page_ms || 0) / 1000;
  if (timeS > 300) score += 20; else if (timeS > 120) score += 15; else if (timeS > 60) score += 10; else if (timeS > 30) score += 5;
  const scroll = lead.max_scroll_depth || 0;
  score += Math.min(20, Math.round(scroll / 5));
  if (lead.video_started) score += 5;
  const watchS = (lead.video_watch_time_ms || 0) / 1000;
  if (watchS > 120) score += 10; else if (watchS > 60) score += 7; else if (watchS > 30) score += 3;
  if (lead.cta_clicks > 0) score += 15;
  if (lead.checkout_clicked) score += 10;
  score += Math.min(10, (lead.sections_viewed?.length || 0) * 2);
  score += Math.min(10, (lead.faq_opened?.length || 0) * 3);
  if ((lead.cta_hesitation_count || 0) > 0 && !lead.checkout_clicked) score -= Math.min(10, (lead.cta_hesitation_count || 0) * 5);
  return Math.max(0, Math.min(100, score));
}

function computeSegmentTags(lead: any): string[] {
  const tags: string[] = [];
  const answers = lead.quiz_answers || {};
  if (answers.age) tags.push(`idade:${answers.age}`);
  if (answers.incomeGoal) tags.push(`meta:${answers.incomeGoal}`);
  if (answers.obstacle) tags.push(`obstaculo:${answers.obstacle}`);
  if (answers.accountBalance) tags.push(`saldo:${answers.accountBalance}`);
  if (answers.device) tags.push(`device:${answers.device}`);
  if (answers.financialDream) tags.push(`sonho:${answers.financialDream}`);
  if ((lead.time_on_page_ms || 0) / 1000 > 180) tags.push("engajado");
  if (lead.checkout_clicked) tags.push("checkout");
  if ((lead.cta_hesitation_count || 0) > 2) tags.push("hesitante");
  if (lead.video_started) tags.push("video_viewer");
  if ((lead.max_scroll_depth || 0) > 80) tags.push("scroll_completo");
  return tags;
}

function aggregateStats(leads: any[]) {
  const total = leads.length;
  const checkoutClicks = leads.filter((l: any) => l.checkout_clicked).length;
  const scores = leads.filter((l: any) => l.intent_score != null).map((l: any) => l.intent_score);
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0;
  const avgTimeOnPage = Math.round(leads.reduce((a: number, l: any) => a + (l.time_on_page_ms || 0), 0) / total / 1000);
  const avgScroll = Math.round(leads.reduce((a: number, l: any) => a + (l.max_scroll_depth || 0), 0) / total);
  const videoStarted = leads.filter((l: any) => l.video_started).length;
  const avgCtaViews = (leads.reduce((a: number, l: any) => a + (l.cta_views || 0), 0) / total).toFixed(1);
  const avgHesitations = (leads.reduce((a: number, l: any) => a + (l.cta_hesitation_count || 0), 0) / total).toFixed(1);
  const clickLeads = leads.filter((l: any) => l.first_cta_click_ms);
  const avgFirstClickMs = clickLeads.length > 0 ? Math.round(clickLeads.reduce((a: number, l: any) => a + l.first_cta_click_ms, 0) / clickLeads.length) : 0;
  const segmentBy = (key: string) => {
    const groups: Record<string, { total: number; checkout: number; avgScore: number }> = {};
    leads.forEach((l: any) => {
      const val = l.quiz_answers?.[key] || "unknown";
      if (!groups[val]) groups[val] = { total: 0, checkout: 0, avgScore: 0 };
      groups[val].total++;
      if (l.checkout_clicked) groups[val].checkout++;
      groups[val].avgScore += l.intent_score || 0;
    });
    Object.values(groups).forEach(g => { g.avgScore = g.total > 0 ? Math.round(g.avgScore / g.total) : 0; });
    return groups;
  };
  const faqCounts: Record<string, number> = {};
  leads.forEach((l: any) => { (l.faq_opened || []).forEach((f: string) => { faqCounts[f] = (faqCounts[f] || 0) + 1; }); });
  const topFaqs = Object.entries(faqCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const scoreDist = { cold: 0, warm: 0, hot: 0, buyer: 0 };
  scores.forEach((s: number) => {
    if (s >= 80) scoreDist.buyer++; else if (s >= 60) scoreDist.hot++; else if (s >= 35) scoreDist.warm++; else scoreDist.cold++;
  });
  return {
    total, checkoutClicks, checkoutRate: total > 0 ? ((checkoutClicks / total) * 100).toFixed(1) : "0",
    avgScore, avgTimeOnPage, avgScroll, videoStarted,
    videoRate: total > 0 ? ((videoStarted / total) * 100).toFixed(1) : "0",
    avgCtaViews, avgHesitations, avgFirstClickMs,
    byAge: segmentBy("age"), byObstacle: segmentBy("obstacle"),
    byGoal: segmentBy("incomeGoal"), byBalance: segmentBy("accountBalance"),
    topFaqs, scoreDist,
  };
}

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
