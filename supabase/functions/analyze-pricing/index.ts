import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Fetch all approved purchases grouped by funnel_step
    const { data: purchases, error } = await supabase
      .from("purchase_tracking")
      .select("funnel_step, amount, status, created_at")
      .order("created_at", { ascending: false })
      .limit(1000);

    if (error) throw error;

    // Aggregate by funnel_step and status
    const stepStats: Record<string, {
      approved: number; pending: number; canceled: number; refused: number; abandoned: number;
      revenue: number; amounts: number[];
    }> = {};

    for (const p of purchases || []) {
      const step = p.funnel_step || "unknown";
      if (!stepStats[step]) {
        stepStats[step] = { approved: 0, pending: 0, canceled: 0, refused: 0, abandoned: 0, revenue: 0, amounts: [] };
      }
      const s = stepStats[step];
      const amt = Number(p.amount) || 0;

      if (p.status === "approved") { s.approved++; s.revenue += amt; s.amounts.push(amt); }
      else if (p.status === "pending") s.pending++;
      else if (p.status === "canceled") s.canceled++;
      else if (p.status === "refused") s.refused++;
      else if (p.status === "ABANDONED_CART") s.abandoned++;
    }

    // Calculate metrics per step
    const analysis: Record<string, any> = {};
    for (const [step, s] of Object.entries(stepStats)) {
      const total = s.approved + s.pending + s.canceled + s.refused + s.abandoned;
      const conversionRate = total > 0 ? ((s.approved / total) * 100).toFixed(1) : "0";
      const avgTicket = s.amounts.length > 0 ? (s.revenue / s.amounts.length).toFixed(2) : "0";
      const cancelRate = total > 0 ? ((s.canceled / total) * 100).toFixed(1) : "0";
      const refuseRate = total > 0 ? ((s.refused / total) * 100).toFixed(1) : "0";
      const abandonRate = total > 0 ? ((s.abandoned / total) * 100).toFixed(1) : "0";
      const pixApprovalRate = (s.approved + s.pending) > 0 ? ((s.approved / (s.approved + s.pending)) * 100).toFixed(1) : "0";

      analysis[step] = {
        total_transactions: total,
        approved: s.approved,
        pending: s.pending,
        canceled: s.canceled,
        refused: s.refused,
        abandoned: s.abandoned,
        revenue: s.revenue,
        avg_ticket: parseFloat(avgTicket),
        conversion_rate: `${conversionRate}%`,
        cancel_rate: `${cancelRate}%`,
        refuse_rate: `${refuseRate}%`,
        abandon_rate: `${abandonRate}%`,
        pix_approval_rate: `${pixApprovalRate}%`,
      };
    }

    // Build AI prompt
    const dataForAI = JSON.stringify(analysis, null, 2);
    const aiPrompt = `Você é um analista de precificação expert em funis de vendas digitais no Brasil.

Analise os dados de vendas abaixo por etapa do funil e forneça recomendações de precificação PRECISAS.

DADOS POR ETAPA DO FUNIL:
${dataForAI}

CONTEXTO:
- "front_37" e "front_47" são o produto principal (entrada do funil) em dois preços
- "acelerador_*" é o Upsell 1 (pós-compra imediato)
- "multiplicador_*" é o Upsell 2 com planos Prata/Ouro/Diamante
- "blindagem" é o Upsell 3
- "circulo_interno" é o Upsell 4 (premium)
- "downsell_guia" é a oferta alternativa para quem recusa
- "purchase" são vendas não classificadas (legado)

ANALISE:
1. Para cada etapa, avalie se o preço atual está ideal, alto demais, ou se pode aumentar
2. Compare taxas de conversão, cancelamento e recusa entre etapas
3. Identifique qual preço do front-end converte melhor (R$37 vs R$47)
4. Avalie se a taxa de aprovação PIX indica resistência ao preço
5. Calcule o LTV médio por cliente considerando upsells
6. Sugira preços específicos para teste A/B

Responda em português, de forma direta e acionável. Use dados para justificar cada recomendação.
Formato: JSON com campos "resumo", "recomendacoes" (array), "metricas_chave", "teste_ab_sugerido"`;

    // Call AI via Lovable gateway
    const lovableKey = Deno.env.get("LOVABLE_API_KEY")!;
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${lovableKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: aiPrompt }],
      }),
    });

    let aiAnalysis = null;
    if (aiResponse.ok) {
      const aiData = await aiResponse.json();
      const content = aiData.choices?.[0]?.message?.content || "";
      // Try to parse JSON from response
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          aiAnalysis = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        } catch {
          aiAnalysis = { raw: content };
        }
      } else {
        aiAnalysis = { raw: content };
      }
    }

    return new Response(JSON.stringify({
      success: true,
      data: analysis,
      ai_analysis: aiAnalysis,
      generated_at: new Date().toISOString(),
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ [Pricing Analysis] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
