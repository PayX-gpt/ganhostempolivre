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

    if (action === "score") {
      return handleScoring(supabase);
    }

    if (action === "insights") {
      return handleInsights(supabase, lovableKey);
    }

    if (action === "buyer-analysis") {
      return handleBuyerAnalysis(supabase, lovableKey);
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-leads error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ─── SCORING ────────────────────────────────────────────────
async function handleScoring(supabase: any) {
  const { data: leads } = await supabase
    .from("lead_behavior")
    .select("*")
    .is("intent_score", null)
    .order("created_at", { ascending: false })
    .limit(20);

  if (!leads || leads.length === 0) {
    return jsonResponse({ scored: 0 });
  }

  let scored = 0;
  for (const lead of leads) {
    const score = computeIntentScore(lead);
    const label = score >= 80 ? "buyer" : score >= 60 ? "hot" : score >= 35 ? "warm" : "cold";
    const tags = computeSegmentTags(lead);

    await supabase
      .from("lead_behavior")
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
    .from("lead_behavior")
    .select("*")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(100);

  if (!leads || leads.length === 0) {
    return jsonResponse({ insights: "Sem dados suficientes nas últimas 24h para gerar insights." });
  }

  const stats = aggregateStats(leads);

  // Fetch purchase data for correlation
  const buyerCorrelation = await correlateLeadsWithPurchases(supabase, leads, since);

  const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        {
          role: "system",
          content: `Você é um analista de conversão especializado em funis de vendas digitais no Brasil. 
Analise os dados comportamentais e gere insights ACIONÁVEIS em português brasileiro.
Foque em:
1. Por que leads não estão comprando (padrões de abandono)
2. Quais segmentos convertem melhor
3. Oportunidades de upsell (quem poderia pagar mais)
4. Sugestões concretas de otimização do funil
5. Padrões de hesitação nos CTAs
6. COMPARATIVO COMPRADOR vs NÃO-COMPRADOR: analise as diferenças de comportamento
7. SUGESTÃO DE PREÇO: baseado na taxa de conversão por segmento, sugira ranges de preço ideais

Responda em formato estruturado com emojis, máximo 600 palavras. Seja direto e prático.`,
        },
        {
          role: "user",
          content: `Dados das últimas 24h do funil de vendas:

RESUMO GERAL:
- Total de leads na oferta: ${stats.total}
- Clicaram no checkout: ${stats.checkoutClicks} (${stats.checkoutRate}%)
- Score médio de intenção: ${stats.avgScore}/100
- Tempo médio na página: ${stats.avgTimeOnPage}s
- Scroll médio: ${stats.avgScroll}%
- Assistiram vídeo: ${stats.videoStarted} (${stats.videoRate}%)

CORRELAÇÃO LEAD → COMPRA:
${JSON.stringify(buyerCorrelation, null, 2)}

SEGMENTAÇÃO POR FAIXA ETÁRIA:
${JSON.stringify(stats.byAge, null, 2)}

SEGMENTAÇÃO POR OBSTÁCULO:
${JSON.stringify(stats.byObstacle, null, 2)}

SEGMENTAÇÃO POR META DE RENDA:
${JSON.stringify(stats.byGoal, null, 2)}

SEGMENTAÇÃO POR SALDO:
${JSON.stringify(stats.byBalance, null, 2)}

COMPORTAMENTO CTA:
- Média de visualizações do CTA: ${stats.avgCtaViews}
- Média de hesitações: ${stats.avgHesitations}
- Tempo médio até primeiro clique: ${stats.avgFirstClickMs}ms

TOP FAQs ABERTAS:
${JSON.stringify(stats.topFaqs, null, 2)}

DISTRIBUIÇÃO DE SCORES:
- Cold (0-34): ${stats.scoreDist.cold}
- Warm (35-59): ${stats.scoreDist.warm}
- Hot (60-79): ${stats.scoreDist.hot}
- Buyer (80-100): ${stats.scoreDist.buyer}`,
        },
      ],
    }),
  });

  if (!aiResponse.ok) {
    const errText = await aiResponse.text();
    console.error("AI error:", aiResponse.status, errText);
    if (aiResponse.status === 429) return jsonResponse({ error: "Rate limit exceeded, try again later." }, 429);
    if (aiResponse.status === 402) return jsonResponse({ error: "Payment required for AI analysis." }, 402);
    return jsonResponse({ error: "AI analysis failed" }, 500);
  }

  const aiData = await aiResponse.json();
  const insights = aiData.choices?.[0]?.message?.content || "Sem insights disponíveis.";

  return jsonResponse({ insights, stats, buyerCorrelation });
}

// ─── BUYER ANALYSIS (new action) ────────────────────────────
async function handleBuyerAnalysis(supabase: any, lovableKey: string) {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: leads } = await supabase
    .from("lead_behavior")
    .select("*")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(500);

  if (!leads || leads.length === 0) {
    return jsonResponse({ analysis: "Sem dados suficientes nos últimos 7 dias." });
  }

  const correlation = await correlateLeadsWithPurchases(supabase, leads, since);

  // Price suggestion by segment
  const priceSuggestions = computePriceSuggestions(leads, correlation);

  const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        {
          role: "system",
          content: `Você é um estrategista de precificação e conversão de funis digitais no Brasil.
Analise os dados de compradores vs não-compradores e forneça:

1. 🎯 PERFIL DO COMPRADOR IDEAL: características comportamentais e demográficas
2. 🚫 PERFIL DO ABANDONADOR: o que eles têm em comum
3. 💰 ESTRATÉGIA DE PREÇO: para cada segmento (idade, saldo, obstáculo), sugira se o preço pode subir, descer, ou manter
4. 🔧 AJUSTES NO FUNIL: mudanças específicas para converter mais de cada segmento
5. 📊 SCORE DE OPORTUNIDADE: classifique cada segmento de 1-10 em potencial de melhoria

Seja extremamente prático e direto. Use dados concretos. Máximo 800 palavras. Português brasileiro.`,
        },
        {
          role: "user",
          content: `DADOS DOS ÚLTIMOS 7 DIAS:

CORRELAÇÃO COMPRADOR vs NÃO-COMPRADOR:
${JSON.stringify(correlation, null, 2)}

SUGESTÕES DE PREÇO POR SEGMENTO (baseado em dados):
${JSON.stringify(priceSuggestions, null, 2)}

TOTAL DE LEADS: ${leads.length}
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
    if (aiResponse.status === 402) return jsonResponse({ error: "Payment required." }, 402);
    return jsonResponse({ error: "AI analysis failed" }, 500);
  }

  const aiData = await aiResponse.json();
  const analysis = aiData.choices?.[0]?.message?.content || "Sem análise disponível.";

  return jsonResponse({ analysis, correlation, priceSuggestions });
}

// ─── CORRELATION ENGINE ─────────────────────────────────────
async function correlateLeadsWithPurchases(supabase: any, leads: any[], since: string) {
  // Get all purchases in the period
  const { data: purchases } = await supabase
    .from("purchase_tracking")
    .select("email, amount, status, session_id, created_at")
    .gte("created_at", since);

  const buyerEmails = new Set(
    (purchases || [])
      .filter((p: any) => ["approved", "completed", "purchased", "redirected"].includes(p.status))
      .map((p: any) => p.email?.toLowerCase())
      .filter(Boolean)
  );

  const buyerSessions = new Set(
    (purchases || [])
      .filter((p: any) => ["approved", "completed", "purchased", "redirected"].includes(p.status))
      .map((p: any) => p.session_id)
      .filter(Boolean)
  );

  // Classify leads as buyer or non-buyer
  const buyers: any[] = [];
  const nonBuyers: any[] = [];

  for (const lead of leads) {
    const isBuyer = buyerSessions.has(lead.session_id) ||
      (lead.quiz_answers?.email && buyerEmails.has(lead.quiz_answers.email.toLowerCase()));

    if (isBuyer) {
      buyers.push(lead);
    } else {
      nonBuyers.push(lead);
    }
  }

  const profileBuyers = buildBehaviorProfile(buyers, "compradores");
  const profileNonBuyers = buildBehaviorProfile(nonBuyers, "nao_compradores");

  // Segment comparison
  const segmentComparison = buildSegmentComparison(buyers, nonBuyers);

  return {
    totalLeads: leads.length,
    totalBuyers: buyers.length,
    totalNonBuyers: nonBuyers.length,
    conversionRate: leads.length > 0 ? ((buyers.length / leads.length) * 100).toFixed(1) : "0",
    buyers: profileBuyers,
    nonBuyers: profileNonBuyers,
    segmentComparison,
  };
}

function buildBehaviorProfile(leads: any[], label: string) {
  if (leads.length === 0) return { label, count: 0 };

  const n = leads.length;
  return {
    label,
    count: n,
    avgTimeOnPageS: Math.round(leads.reduce((a, l) => a + (l.time_on_page_ms || 0), 0) / n / 1000),
    avgScroll: Math.round(leads.reduce((a, l) => a + (l.max_scroll_depth || 0), 0) / n),
    avgCtaClicks: +(leads.reduce((a, l) => a + (l.cta_clicks || 0), 0) / n).toFixed(1),
    avgHesitations: +(leads.reduce((a, l) => a + (l.cta_hesitation_count || 0), 0) / n).toFixed(1),
    videoRate: +((leads.filter(l => l.video_started).length / n) * 100).toFixed(1),
    avgVideoWatchS: Math.round(leads.reduce((a, l) => a + (l.video_watch_time_ms || 0), 0) / n / 1000),
    checkoutRate: +((leads.filter(l => l.checkout_clicked).length / n) * 100).toFixed(1),
    avgIntentScore: Math.round(leads.filter(l => l.intent_score != null).reduce((a, l) => a + (l.intent_score || 0), 0) / (leads.filter(l => l.intent_score != null).length || 1)),
    avgDynamicPrice: +(leads.reduce((a, l) => a + (l.dynamic_price || 0), 0) / n).toFixed(2),
    topAges: getTopValues(leads, "age"),
    topObstacles: getTopValues(leads, "obstacle"),
    topGoals: getTopValues(leads, "incomeGoal"),
    topBalances: getTopValues(leads, "accountBalance"),
  };
}

function getTopValues(leads: any[], quizKey: string) {
  const counts: Record<string, number> = {};
  leads.forEach(l => {
    const val = l.quiz_answers?.[quizKey] || "unknown";
    counts[val] = (counts[val] || 0) + 1;
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, count]) => ({ name, count, pct: +((count / leads.length) * 100).toFixed(1) }));
}

function buildSegmentComparison(buyers: any[], nonBuyers: any[]) {
  const keys = ["age", "obstacle", "incomeGoal", "accountBalance"];
  const result: Record<string, any> = {};

  for (const key of keys) {
    const buyerGroups: Record<string, number> = {};
    const nonBuyerGroups: Record<string, number> = {};

    buyers.forEach(l => {
      const v = l.quiz_answers?.[key] || "unknown";
      buyerGroups[v] = (buyerGroups[v] || 0) + 1;
    });
    nonBuyers.forEach(l => {
      const v = l.quiz_answers?.[key] || "unknown";
      nonBuyerGroups[v] = (nonBuyerGroups[v] || 0) + 1;
    });

    const allValues = new Set([...Object.keys(buyerGroups), ...Object.keys(nonBuyerGroups)]);
    result[key] = Array.from(allValues).map(v => ({
      value: v,
      buyers: buyerGroups[v] || 0,
      nonBuyers: nonBuyerGroups[v] || 0,
      convRate: (buyerGroups[v] || 0) + (nonBuyerGroups[v] || 0) > 0
        ? +(((buyerGroups[v] || 0) / ((buyerGroups[v] || 0) + (nonBuyerGroups[v] || 0))) * 100).toFixed(1)
        : 0,
    })).sort((a, b) => b.convRate - a.convRate);
  }

  return result;
}

// ─── PRICE SUGGESTIONS ──────────────────────────────────────
function computePriceSuggestions(leads: any[], correlation: any) {
  const segments = correlation.segmentComparison || {};
  const suggestions: Record<string, any[]> = {};

  for (const [key, values] of Object.entries(segments)) {
    suggestions[key] = (values as any[]).map((seg: any) => {
      const segLeads = leads.filter(l => l.quiz_answers?.[key] === seg.value);
      const avgPrice = segLeads.length > 0
        ? +(segLeads.reduce((a: number, l: any) => a + (l.dynamic_price || 0), 0) / segLeads.length).toFixed(2)
        : 0;

      let recommendation = "manter";
      let reason = "";

      if (seg.convRate > 15) {
        recommendation = "pode_aumentar";
        reason = `Alta conversão (${seg.convRate}%) - margem para aumento de preço`;
      } else if (seg.convRate > 5) {
        recommendation = "manter";
        reason = `Conversão saudável (${seg.convRate}%) - preço equilibrado`;
      } else if (seg.convRate > 0) {
        recommendation = "testar_reducao";
        reason = `Baixa conversão (${seg.convRate}%) - testar preço menor`;
      } else {
        recommendation = "revisar_funil";
        reason = `Sem conversão - problema pode não ser preço`;
      }

      return {
        segment: seg.value,
        currentAvgPrice: avgPrice,
        conversionRate: seg.convRate,
        totalLeads: seg.buyers + seg.nonBuyers,
        recommendation,
        reason,
      };
    });
  }

  return suggestions;
}

// ─── SCORING HELPERS ────────────────────────────────────────
function computeIntentScore(lead: any): number {
  let score = 0;
  const timeS = (lead.time_on_page_ms || 0) / 1000;
  if (timeS > 300) score += 20;
  else if (timeS > 120) score += 15;
  else if (timeS > 60) score += 10;
  else if (timeS > 30) score += 5;

  const scroll = lead.max_scroll_depth || 0;
  score += Math.min(20, Math.round(scroll / 5));

  if (lead.video_started) score += 5;
  const watchS = (lead.video_watch_time_ms || 0) / 1000;
  if (watchS > 120) score += 10;
  else if (watchS > 60) score += 7;
  else if (watchS > 30) score += 3;

  if (lead.cta_clicks > 0) score += 15;
  if (lead.checkout_clicked) score += 10;

  const sections = lead.sections_viewed?.length || 0;
  score += Math.min(10, sections * 2);

  const faqs = lead.faq_opened?.length || 0;
  score += Math.min(10, faqs * 3);

  const hesitations = lead.cta_hesitation_count || 0;
  if (hesitations > 0 && !lead.checkout_clicked) {
    score -= Math.min(10, hesitations * 5);
  }

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

  const timeS = (lead.time_on_page_ms || 0) / 1000;
  if (timeS > 180) tags.push("engajado");
  if (lead.checkout_clicked) tags.push("checkout");
  if ((lead.cta_hesitation_count || 0) > 2) tags.push("hesitante");
  if (lead.video_started) tags.push("video_viewer");
  if ((lead.max_scroll_depth || 0) > 80) tags.push("scroll_completo");
  return tags;
}

function aggregateStats(leads: any[]) {
  const total = leads.length;
  const checkoutClicks = leads.filter(l => l.checkout_clicked).length;
  const scores = leads.filter(l => l.intent_score != null).map(l => l.intent_score);
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0;
  const avgTimeOnPage = Math.round(leads.reduce((a: number, l: any) => a + (l.time_on_page_ms || 0), 0) / total / 1000);
  const avgScroll = Math.round(leads.reduce((a: number, l: any) => a + (l.max_scroll_depth || 0), 0) / total);
  const videoStarted = leads.filter(l => l.video_started).length;
  const avgCtaViews = (leads.reduce((a: number, l: any) => a + (l.cta_views || 0), 0) / total).toFixed(1);
  const avgHesitations = (leads.reduce((a: number, l: any) => a + (l.cta_hesitation_count || 0), 0) / total).toFixed(1);
  const clickLeads = leads.filter(l => l.first_cta_click_ms);
  const avgFirstClickMs = clickLeads.length > 0 ? Math.round(clickLeads.reduce((a: number, l: any) => a + l.first_cta_click_ms, 0) / clickLeads.length) : 0;

  const segmentBy = (key: string) => {
    const groups: Record<string, { total: number; checkout: number; avgScore: number }> = {};
    leads.forEach(l => {
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
  leads.forEach(l => {
    (l.faq_opened || []).forEach((f: string) => { faqCounts[f] = (faqCounts[f] || 0) + 1; });
  });
  const topFaqs = Object.entries(faqCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const scoreDist = { cold: 0, warm: 0, hot: 0, buyer: 0 };
  scores.forEach(s => {
    if (s >= 80) scoreDist.buyer++;
    else if (s >= 60) scoreDist.hot++;
    else if (s >= 35) scoreDist.warm++;
    else scoreDist.cold++;
  });

  return {
    total, checkoutClicks,
    checkoutRate: total > 0 ? ((checkoutClicks / total) * 100).toFixed(1) : "0",
    avgScore, avgTimeOnPage, avgScroll,
    videoStarted, videoRate: total > 0 ? ((videoStarted / total) * 100).toFixed(1) : "0",
    avgCtaViews, avgHesitations, avgFirstClickMs,
    byAge: segmentBy("age"), byObstacle: segmentBy("obstacle"),
    byGoal: segmentBy("incomeGoal"), byBalance: segmentBy("accountBalance"),
    topFaqs, scoreDist,
  };
}

// ─── UTILS ──────────────────────────────────────────────────
function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
