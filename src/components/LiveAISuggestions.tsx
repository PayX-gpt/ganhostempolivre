import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Lightbulb, RefreshCw, ArrowRight, TestTube } from "lucide-react";
import { cn } from "@/lib/utils";

interface Suggestion {
  id: string;
  category: "cta" | "creative" | "funnel" | "pricing" | "upsell";
  priority: "high" | "medium" | "low";
  title: string;
  action: string;
  reasoning: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  cta: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  creative: "text-pink-400 bg-pink-500/10 border-pink-500/30",
  funnel: "text-sky-400 bg-sky-500/10 border-sky-500/30",
  pricing: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  upsell: "text-violet-400 bg-violet-500/10 border-violet-500/30",
};

const CATEGORY_LABELS: Record<string, string> = {
  cta: "CTA", creative: "Criativo", funnel: "Funil", pricing: "Preço", upsell: "Upsell",
};

async function fetchAllRows(table: string, select: string, filters: (q: any) => any, pageSize = 1000): Promise<any[]> {
  const all: any[] = [];
  let from = 0;
  while (true) {
    let q = supabase.from(table as any).select(select).range(from, from + pageSize - 1);
    q = filters(q);
    const { data, error } = await q;
    if (error || !data || data.length === 0) break;
    all.push(...(data as any[]));
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return all;
}

export default function LiveAISuggestions() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);

  const analyze = useCallback(async () => {
    setLoading(true);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayISO = todayStart.toISOString();

    const [stepEvents, leads, purchases, icEvents, upsellLogs] = await Promise.all([
      fetchAllRows("funnel_events", "session_id, event_data", (q: any) => q.eq("event_name", "step_viewed").gte("created_at", todayISO)),
      fetchAllRows("lead_behavior", "session_id, quiz_answers, checkout_clicked, intent_score, account_balance, cta_clicks, first_cta_click_ms, video_watch_time_ms", (q: any) => q.gte("created_at", todayISO)),
      fetchAllRows("purchase_tracking", "amount, status, utm_source, utm_campaign, funnel_step", (q: any) => q.gte("created_at", todayISO)),
      fetchAllRows("funnel_events", "session_id", (q: any) => q.in("event_name", ["checkout_click", "capi_ic_sent"]).gte("created_at", todayISO)),
      fetchAllRows("funnel_audit_logs", "event_type, page_id, session_id", (q: any) => q.in("event_type", ["upsell_oneclick_buy", "upsell_oneclick_decline"]).gte("created_at", todayISO)),
    ]);

    const newSuggestions: Suggestion[] = [];

    // 1. CTA timing analysis
    const ctaTimings = leads.filter((l: any) => l.first_cta_click_ms && l.first_cta_click_ms > 0);
    if (ctaTimings.length >= 5) {
      const avgCtaMs = ctaTimings.reduce((s: number, l: any) => s + l.first_cta_click_ms, 0) / ctaTimings.length;
      if (avgCtaMs > 120000) {
        newSuggestions.push({
          id: "cta-timing",
          category: "cta",
          priority: "high",
          title: "CTA aparece muito tarde",
          action: `Reduza o tempo do VSL antes do CTA. Média atual: ${(avgCtaMs / 60000).toFixed(1)}min`,
          reasoning: "Leads que esperam muito para ver o CTA têm menor probabilidade de converter.",
        });
      }
    }

    // 2. Video watch analysis
    const videoWatchers = leads.filter((l: any) => l.video_watch_time_ms && l.video_watch_time_ms > 0);
    const checkoutersWithVideo = videoWatchers.filter((l: any) => l.checkout_clicked);
    if (videoWatchers.length >= 5) {
      const watchRate = (checkoutersWithVideo.length / videoWatchers.length) * 100;
      if (watchRate < 15) {
        newSuggestions.push({
          id: "video-engagement",
          category: "creative",
          priority: "high",
          title: "Vídeo não converte",
          action: "Teste um VSL mais curto ou mude o hook dos primeiros 30s",
          reasoning: `Apenas ${watchRate.toFixed(0)}% dos que assistem o vídeo clicam no checkout.`,
        });
      }
    }

    // 3. Step drop-off specific suggestions
    const stepCounts: Record<string, Set<string>> = {};
    stepEvents.forEach((e: any) => {
      const step = (e.event_data as any)?.step as string;
      if (step) {
        const key = step.startsWith("/") ? step : `/${step}`;
        if (!stepCounts[key]) stepCounts[key] = new Set();
        stepCounts[key].add(e.session_id);
      }
    });

    const step2 = stepCounts["/step-2"]?.size || 0;
    const step1 = stepCounts["/step-1"]?.size || 0;
    if (step1 > 10 && step2 > 0) {
      const introDropOff = ((step1 - step2) / step1) * 100;
      if (introDropOff > 40) {
        newSuggestions.push({
          id: "intro-dropoff",
          category: "funnel",
          priority: "high",
          title: "Intro com alto abandono",
          action: "Simplifique o Step 1 ou adicione curiosidade. Teste headline diferente.",
          reasoning: `${introDropOff.toFixed(0)}% saem na intro — o hook não está prendendo.`,
        });
      }
    }

    // 4. Balance-based pricing
    const balanceGroups: Record<string, { count: number; checkouts: number }> = {};
    leads.forEach((l: any) => {
      const balance = l.account_balance;
      if (balance) {
        if (!balanceGroups[balance]) balanceGroups[balance] = { count: 0, checkouts: 0 };
        balanceGroups[balance].count++;
        if (l.checkout_clicked) balanceGroups[balance].checkouts++;
      }
    });
    const bestBalance = Object.entries(balanceGroups)
      .filter(([, v]) => v.count >= 3)
      .sort((a, b) => (b[1].checkouts / b[1].count) - (a[1].checkouts / a[1].count))[0];
    if (bestBalance && bestBalance[1].count >= 3) {
      const rate = ((bestBalance[1].checkouts / bestBalance[1].count) * 100).toFixed(0);
      newSuggestions.push({
        id: "pricing-balance",
        category: "pricing",
        priority: "medium",
        title: `Leads com saldo "${bestBalance[0]}" convertem mais`,
        action: `Direcione criativos para esse perfil — ${rate}% de checkout`,
        reasoning: `Leads que informam "${bestBalance[0]}" têm a maior taxa de checkout entre os grupos.`,
      });
    }

    // 5. Upsell analysis
    const upsellBuys: Record<string, number> = {};
    const upsellDeclines: Record<string, number> = {};
    upsellLogs.forEach((l: any) => {
      const page = l.page_id || "";
      if (l.event_type === "upsell_oneclick_buy") upsellBuys[page] = (upsellBuys[page] || 0) + 1;
      else upsellDeclines[page] = (upsellDeclines[page] || 0) + 1;
    });
    
    Object.keys(upsellDeclines).forEach(page => {
      const buys = upsellBuys[page] || 0;
      const declines = upsellDeclines[page] || 0;
      const total = buys + declines;
      if (total >= 3 && buys / total < 0.1) {
        newSuggestions.push({
          id: `upsell-low-${page}`,
          category: "upsell",
          priority: "medium",
          title: `Upsell ${page} com conversão baixa`,
          action: `Ajuste a oferta ou o preço do ${page}. Taxa: ${((buys / total) * 100).toFixed(0)}%`,
          reasoning: `${declines} rejeições vs ${buys} compras. Considere mudar o copy ou desconto.`,
        });
      }
    });

    // 6. Campaign performance
    const approved = purchases.filter((p: any) => ["approved", "completed", "purchased", "redirected"].includes(p.status));
    const campaignRevenue: Record<string, number> = {};
    approved.forEach((p: any) => {
      const camp = p.utm_campaign || p.utm_source || "Direto";
      campaignRevenue[camp] = (campaignRevenue[camp] || 0) + (Number(p.amount) || 0);
    });
    const topCampaign = Object.entries(campaignRevenue).sort((a, b) => b[1] - a[1])[0];
    if (topCampaign && topCampaign[1] > 0) {
      newSuggestions.push({
        id: "top-campaign",
        category: "creative",
        priority: "low",
        title: `Campanha "${topCampaign[0]}" lidera em receita`,
        action: `Escale essa campanha — R$ ${topCampaign[1].toFixed(0)} hoje. Aumente o budget.`,
        reasoning: "Campanhas com melhor ROI devem receber mais investimento.",
      });
    }

    setSuggestions(newSuggestions.sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.priority] - order[b.priority];
    }));
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(analyze, 15000); // Stagger: load 15s after mount
    const interval = setInterval(analyze, 180000); // Refresh every 3min
    return () => { clearTimeout(timer); clearInterval(interval); };
  }, [analyze]);

  if (suggestions.length === 0 && !loading) return null;

  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a] p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-xl bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border border-yellow-500/20">
          <Lightbulb className="w-4 h-4 text-yellow-400" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-white text-sm">IA — Sugestões de Otimização</h3>
          <p className="text-[10px] text-[#666]">{suggestions.length} insights baseados em dados de hoje</p>
        </div>
        <button onClick={analyze} className="w-7 h-7 rounded-lg bg-[#0d0d0d] border border-[#2a2a2a] flex items-center justify-center">
          <RefreshCw className={cn("w-3 h-3 text-[#888]", loading && "animate-spin")} />
        </button>
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
        {suggestions.map(s => (
          <div key={s.id} className={cn("p-3 rounded-xl border", CATEGORY_COLORS[s.category])}>
            <div className="flex items-start gap-2">
              <TestTube className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 opacity-70" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[9px] font-bold uppercase tracking-wider opacity-60">{CATEGORY_LABELS[s.category]}</span>
                  <span className={cn("text-[8px] px-1.5 py-0.5 rounded-full font-bold",
                    s.priority === "high" ? "bg-red-500/20 text-red-300" :
                    s.priority === "medium" ? "bg-amber-500/20 text-amber-300" :
                    "bg-[#2a2a2a] text-[#888]"
                  )}>{s.priority === "high" ? "URGENTE" : s.priority === "medium" ? "MÉDIO" : "BAIXO"}</span>
                </div>
                <p className="text-xs font-medium text-white">{s.title}</p>
                <p className="text-[10px] mt-1 flex items-center gap-1">
                  <ArrowRight className="w-3 h-3 flex-shrink-0" />
                  <span>{s.action}</span>
                </p>
                <p className="text-[9px] text-[#666] mt-1 italic">{s.reasoning}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
