import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { FlaskConical, Trophy, Medal, TrendingUp, TrendingDown, Eye, Calendar, AlertTriangle, Target, Zap, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/* ── Types ── */
interface VariantRaw {
  variant: string;
  visitors: number;
  cta_clicks: number;
  quiz_complete: number;
  checkouts: number;
  front_sales: number;
  front_revenue: number;
  upsell_sales: number;
  upsell_revenue: number;
  total_sales: number;
  total_revenue: number;
}

interface VariantData {
  variant: string;
  visitors: number;
  ctaClicks: number;
  taxaCta: number;
  quizComplete: number;
  taxaQuiz: number;
  checkouts: number;
  taxaIc: number;
  frontSales: number;
  taxaConvFront: number;
  upsellSales: number;
  taxaUpsell: number;
  frontRevenue: number;
  upsellRevenue: number;
  totalSales: number;
  totalRevenue: number;
  rpv: number;
  ticketMedio: number;
  notaFinal: number;
}

/* ── Variant descriptions for preview ── */
const VARIANT_INFO: Record<string, { angle: string; headline: string; cta: string; description: string }> = {
  A: {
    angle: "Controle — Abordagem Direta",
    headline: "R$50 a R$300 por dia. 10 minutos. A IA faz o resto.",
    cta: "EU QUERO MEUS R$300 POR DIA →",
    description: "Promessa direta de ganho com IA. Foco em simplicidade, triggers de objeção (sem investir, sem aparecer, sem vender, sem experiência). Prova social com contador de brasileiros usando.",
  },
  B: {
    angle: "Curiosidade Cega + Exclusividade",
    headline: "⚡ [X] pessoas acessaram nos últimos 30 min — Notificações simuladas de transferência PIX",
    cta: "QUERO DESCOBRIR COMO →",
    description: "Badge de urgência com contador em tempo real. Notificações flutuantes simulando transferências PIX recebidas. Foco em FOMO e curiosidade sobre o método secreto. Estrutura visual mais dinâmica com animações.",
  },
  C: {
    angle: "Gamificação + Baixo Compromisso",
    headline: "✓ Teste verificado por [X] brasileiros — Barra de progresso visual",
    cta: "COMEÇAR TESTE GRATUITO →",
    description: "Badge de verificação social. Barra de progresso mostrando etapa 1/3. Depoimento com avatar real (Claudia). Foco em baixo compromisso: 'teste grátis de 2 minutos'. Estrutura gamificada com senso de progresso.",
  },
  D: {
    angle: "Prova Social Pesada — Extratos Reais",
    headline: "Essas pessoas comuns estão gerando R$50-300/dia — Cards com avatares e ganhos",
    cta: "QUERO COMEÇAR AGORA →",
    description: "3 cards de pessoas reais (Maria 52, José 34, Amanda 28) com ganhos diários e semanais. Estrelas 5/5. Prova social pesada antes da promessa. Alerta visual: 'Última turma com vagas'. Foco em identificação com pessoas comuns.",
  },
};

/* ── Criteria weights ── */
const WEIGHTS = {
  taxaCta: 0.10,
  taxaQuiz: 0.10,
  taxaIc: 0.15,
  taxaConvFront: 0.20,
  frontSales: 0.05,
  taxaUpsell: 0.10,
  rpv: 0.25,
  ticketMedio: 0.05,
};

const CRITERIA_NAMES: Record<string, string> = {
  taxaCta: "taxa de CTA",
  taxaQuiz: "taxa de quiz completo",
  taxaIc: "taxa de início de checkout",
  taxaConvFront: "taxa de conversão front",
  frontSales: "volume de vendas front",
  taxaUpsell: "taxa de upsell",
  rpv: "receita por visitante (RPV)",
  ticketMedio: "ticket médio",
};

const CRITERIA_KEYS = Object.keys(WEIGHTS) as (keyof typeof WEIGHTS)[];

/* ── Parse raw data into VariantData ── */
function parseVariants(raw: any[]): VariantData[] {
  const parsed = (raw || [])
    .filter((v: any) => ["A", "B", "C", "D"].includes(String(v.variant || "").toUpperCase()))
    .map((v: any) => {
      const visitors = Number(v.visitors) || 0;
      const ctaClicks = Number(v.cta_clicks) || 0;
      const quizComplete = Number(v.quiz_complete) || 0;
      const checkouts = Number(v.checkouts) || 0;
      const frontSales = Number(v.front_sales) || 0;
      const upsellSales = Number(v.upsell_sales) || 0;
      const frontRevenue = Number(v.front_revenue) || 0;
      const upsellRevenue = Number(v.upsell_revenue) || 0;
      const totalSales = Number(v.total_sales) || 0;
      const totalRevenue = Number(v.total_revenue) || 0;

      return {
        variant: String(v.variant).toUpperCase(),
        visitors,
        ctaClicks,
        taxaCta: visitors > 0 ? Math.min((ctaClicks / visitors) * 100, 100) : 0,
        quizComplete,
        taxaQuiz: visitors > 0 ? Math.min((quizComplete / visitors) * 100, 100) : 0,
        checkouts,
        taxaIc: visitors > 0 ? Math.min((checkouts / visitors) * 100, 100) : 0,
        frontSales,
        taxaConvFront: visitors > 0 ? Math.min((frontSales / visitors) * 100, 100) : 0,
        upsellSales,
        taxaUpsell: frontSales > 0 ? Math.min((upsellSales / frontSales) * 100, 100) : 0,
        frontRevenue,
        upsellRevenue,
        totalSales,
        totalRevenue,
        rpv: visitors > 0 ? totalRevenue / visitors : 0,
        ticketMedio: totalSales > 0 ? totalRevenue / totalSales : 0,
        notaFinal: 0,
      };
    });

  // Calculate weighted scores
  return calculateScores(parsed);
}

function calculateScores(variants: VariantData[]): VariantData[] {
  if (variants.length === 0) return variants;

  // For each criterion, find max value
  const maxValues: Record<string, number> = {};
  CRITERIA_KEYS.forEach(key => {
    maxValues[key] = Math.max(...variants.map(v => v[key] as number), 0.001);
  });

  // Normalize each criterion to 0-100 and apply weights
  return variants.map(v => {
    let nota = 0;
    CRITERIA_KEYS.forEach(key => {
      const normalized = (v[key] as number) / maxValues[key] * 100;
      nota += normalized * WEIGHTS[key];
    });
    return { ...v, notaFinal: Math.round(nota) };
  }).sort((a, b) => b.notaFinal - a.notaFinal);
}

/* ── Verdict generation ── */
function getStrongestCriteria(v: VariantData, all: VariantData[]): string[] {
  return CRITERIA_KEYS.filter(key => {
    const val = v[key] as number;
    return val >= Math.max(...all.map(x => x[key] as number));
  }).map(key => CRITERIA_NAMES[key]);
}

function getWeakestCriterion(v: VariantData, all: VariantData[]): string {
  let worstKey = CRITERIA_KEYS[0];
  let worstRank = 0;
  CRITERIA_KEYS.forEach(key => {
    const rank = all.filter(x => (x[key] as number) > (v[key] as number)).length + 1;
    if (rank > worstRank) {
      worstRank = rank;
      worstKey = key;
    }
  });
  return CRITERIA_NAMES[worstKey];
}

function generateMotivo(v: VariantData, all: VariantData[]): string {
  const rpvMedia = all.reduce((s, x) => s + x.rpv, 0) / all.length;
  const rpvDiff = rpvMedia > 0 ? ((v.rpv - rpvMedia) / rpvMedia * 100).toFixed(0) : "0";
  const parts: string[] = [];

  const hasMaxRpv = v.rpv >= Math.max(...all.map(x => x.rpv));
  const hasMaxConv = v.taxaConvFront >= Math.max(...all.map(x => x.taxaConvFront));
  const hasMaxUpsell = v.taxaUpsell >= Math.max(...all.map(x => x.taxaUpsell));
  const hasMaxVolume = v.frontSales >= Math.max(...all.map(x => x.frontSales));
  const hasLowCta = v.taxaCta < rpvMedia;

  if (hasMaxRpv) {
    parts.push(`Gera R$${v.rpv.toFixed(2)} por visitante (RPV), ${rpvDiff}% acima da média.`);
  }

  if (hasMaxRpv && hasMaxConv) {
    parts.push(`Domina em receita e conversão — a combinação ideal para escalar.`);
  } else if (hasMaxRpv && hasLowCta) {
    parts.push(`Atrai público mais qualificado — menos cliques, mas quem clica compra mais.`);
  }

  if (hasMaxConv && !hasMaxRpv) {
    parts.push(`Maior taxa de conversão front (${v.taxaConvFront.toFixed(1)}%), convertendo visitantes em compradores com eficiência.`);
  }

  if (hasMaxUpsell) {
    parts.push(`Maior taxa de upsell (${v.taxaUpsell.toFixed(1)}%) — gera compradores de maior valor que também compram upsell.`);
  }

  if (hasMaxVolume && !hasMaxRpv) {
    parts.push(`Maior volume absoluto de vendas front (${v.frontSales}), ideal para escala rápida.`);
  }

  if (parts.length === 0) {
    parts.push(`RPV de R$${v.rpv.toFixed(2)} e ${v.frontSales} vendas front no período.`);
  }

  return parts.join(" ");
}

function getConfianca(variants: VariantData[]): { text: string; level: "low" | "moderate" | "high" | "very_high" } {
  const minV = Math.min(...variants.map(v => v.visitors));
  if (minV < 100) return { text: `Dados insuficientes (${minV} visitantes/variante) — aguardar mais tráfego.`, level: "low" };
  if (minV < 300) return { text: `Confiança moderada (${minV} visitantes/variante). Recomendado 500+ para decisão definitiva.`, level: "moderate" };
  if (minV < 500) return { text: `Confiança alta (${minV} visitantes/variante). Dados suficientes para decisão preliminar.`, level: "high" };
  return { text: `Confiança muito alta (${minV}+ visitantes/variante). Dados suficientes para decisão definitiva.`, level: "very_high" };
}

function generateRecomendacao(ranked: VariantData[]): string {
  if (ranked.length < 2) return "Dados insuficientes para recomendação.";
  const best = ranked[0];
  const second = ranked[1];
  const worst = ranked.slice(2).map(v => v.variant).join(" e ");
  return `Escalar a variante ${best.variant} como tela principal. Manter a variante ${second.variant} como segunda opção. Pausar variantes ${worst}.`;
}

/* ── Delta helpers ── */
function DeltaBadge({ curr, prev }: { curr: number; prev: number }) {
  if (prev === 0 && curr === 0) return null;
  if (prev === 0) return <span className="text-[9px] ml-1 font-medium text-emerald-400">+∞</span>;
  const pct = ((curr - prev) / prev) * 100;
  if (pct === 0) return null;
  return (
    <span className={cn("text-[9px] ml-1 font-medium", pct > 0 ? "text-emerald-400" : "text-red-400")}>
      {pct > 0 ? "+" : ""}{pct.toFixed(0)}%
    </span>
  );
}

/* ── Period options ── */
const PERIODS = [
  { value: "today", label: "Hoje" },
  { value: "yesterday", label: "Ontem" },
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
];

/* ── Main Component ── */
export default function LiveABTest() {
  const [period, setPeriod] = useState("today");
  const [data, setData] = useState<VariantData[]>([]);
  const [compareData, setCompareData] = useState<VariantData[]>([]);
  const [showCompare, setShowCompare] = useState(true);
  const [previewVariant, setPreviewVariant] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchForDate = useCallback(async (dateStr: string) => {
    const { data: rpc } = await supabase.rpc("get_ab_summary_by_date" as any, { target_date: dateStr });
    return parseVariants((rpc as any)?.ab_sales || []);
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const today = new Date();
      const fmt = (d: Date) => d.toISOString().split("T")[0];

      if (period === "today") {
        // Use the main RPC for today (more accurate, uses NOW())
        const { data: todayRpc } = await supabase.rpc("get_dashboard_summary_today" as any);
        const summary = todayRpc as any;
        // Parse with upsell fallback
        const rawAb = (summary?.ab_sales || []).map((v: any) => ({
          ...v,
          upsell_sales: Number(v.upsell_sales) || (Number(v.total_sales || 0) - Number(v.front_sales || 0)),
          upsell_revenue: Number(v.upsell_revenue) || (Number(v.total_revenue || 0) - Number(v.front_revenue || 0)),
        }));
        setData(parseVariants(rawAb));

        // Compare with yesterday
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        setCompareData(await fetchForDate(fmt(yesterday)));
      } else if (period === "yesterday") {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        setData(await fetchForDate(fmt(yesterday)));

        // Compare with day before yesterday
        const dayBefore = new Date(today);
        dayBefore.setDate(dayBefore.getDate() - 2);
        setCompareData(await fetchForDate(fmt(dayBefore)));
      } else {
        // Multi-day: fetch each day and aggregate
        const days = period === "7d" ? 7 : 30;
        const allDays: VariantData[][] = [];
        const compareDays: VariantData[][] = [];

        const fetchPromises = [];
        for (let i = 0; i < days; i++) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          fetchPromises.push(fetchForDate(fmt(d)));
        }
        for (let i = days; i < days * 2; i++) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          fetchPromises.push(fetchForDate(fmt(d)));
        }

        const results = await Promise.all(fetchPromises);
        for (let i = 0; i < days; i++) allDays.push(results[i]);
        for (let i = days; i < days * 2; i++) compareDays.push(results[i]);

        setData(aggregateMultiDay(allDays));
        setCompareData(aggregateMultiDay(compareDays));
      }
    } catch (err) {
      console.warn("[ABTest] fetch error:", err);
    }
    setIsLoading(false);
  }, [period, fetchForDate]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 120000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const cMap = new Map(compareData.map(v => [v.variant, v]));
  const ranked = [...data].sort((a, b) => b.notaFinal - a.notaFinal);
  const best = ranked[0] || null;
  const second = ranked[1] || null;
  const confianca = data.length > 0 ? getConfianca(data) : null;

  const declareWinner = (variant: string) => {
    localStorage.setItem("quiz_variant_winner", variant);
    toast.success(`Variação ${variant} declarada vencedora! 100% do tráfego será direcionado.`);
  };

  if (data.length === 0) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a] p-4">
        <div className="flex items-center gap-2 mb-3">
          <FlaskConical className="w-4 h-4 text-violet-400" />
          <h3 className="text-sm font-semibold text-white">A/B Test — Tela Inicial</h3>
        </div>
        <p className="text-xs text-[#888]">Aguardando dados.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a] p-4 space-y-4">
      {/* Header with period filter */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-violet-400" />
          <h3 className="text-sm font-semibold text-white">A/B Test — Tela Inicial</h3>
        </div>
        <div className="flex items-center gap-1.5">
          {PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={cn(
                "text-[10px] px-2.5 py-1 rounded-lg border transition-all",
                period === p.value
                  ? "bg-violet-500/10 border-violet-500/30 text-violet-300"
                  : "bg-[#1a1a1a] border-[#2a2a2a] text-[#888] hover:text-[#ccc]"
              )}
            >
              {p.label}
            </button>
          ))}
          <button
            onClick={() => setShowCompare(!showCompare)}
            className={cn(
              "flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-lg border transition-all ml-1",
              showCompare ? "bg-sky-500/10 border-sky-500/30 text-sky-300" : "bg-[#1a1a1a] border-[#2a2a2a] text-[#888]"
            )}
          >
            <Calendar className="w-3 h-3" />
            Δ
          </button>
        </div>
      </div>

      {/* ─── FULL TABLE with 8 criteria ─── */}
      <div className="overflow-x-auto -mx-4 px-4">
        <table className="w-full text-xs min-w-[1100px]">
          <thead>
            <tr className="text-[#888] border-b border-[#2a2a2a]">
              <th className="text-left py-2 px-1.5 font-medium">Var.</th>
              <th className="text-right py-2 px-1.5 font-medium">Visitantes</th>
              <th className="text-right py-2 px-1.5 font-medium">CTA%</th>
              <th className="text-right py-2 px-1.5 font-medium">Quiz%</th>
              <th className="text-right py-2 px-1.5 font-medium">IC%</th>
              <th className="text-right py-2 px-1.5 font-medium">Conv%</th>
              <th className="text-right py-2 px-1.5 font-medium">V.Front</th>
              <th className="text-right py-2 px-1.5 font-medium">V.Total</th>
              <th className="text-right py-2 px-1.5 font-medium">Upsell%</th>
              <th className="text-right py-2 px-1.5 font-medium">R$ Front</th>
              <th className="text-right py-2 px-1.5 font-medium">R$ Upsell</th>
              <th className="text-right py-2 px-1.5 font-medium">R$ Total</th>
              <th className="text-right py-2 px-1.5 font-medium">RPV</th>
              <th className="text-right py-2 px-1.5 font-medium">Ticket</th>
              <th className="text-center py-2 px-1.5 font-medium">NOTA</th>
              <th className="text-center py-2 px-1.5 font-medium">
                <Eye className="w-3 h-3 mx-auto" />
              </th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((v, i) => {
              const isBest = i === 0 && v.notaFinal > 0;
              const isSecond = i === 1 && v.notaFinal > 0;
              const cv = cMap.get(v.variant);

              return (
                <tr
                  key={v.variant}
                  className={cn(
                    "border-b border-[#1a1a1a] transition-colors hover:bg-white/[0.02]",
                    isBest && "bg-emerald-500/[0.06]",
                    isSecond && "bg-sky-500/[0.04]"
                  )}
                >
                  <td className="py-2 px-1.5">
                    <div className="flex items-center gap-1">
                      <span className={cn("font-bold", isBest ? "text-emerald-400" : isSecond ? "text-sky-400" : "text-white")}>
                        {v.variant}
                      </span>
                      {isBest && <Trophy className="w-3 h-3 text-amber-400" />}
                      {isSecond && <Medal className="w-3 h-3 text-sky-400" />}
                    </div>
                  </td>
                  <td className="text-right py-2 px-1.5 text-white tabular-nums">
                    {v.visitors}
                    {showCompare && cv && <DeltaBadge curr={v.visitors} prev={cv.visitors} />}
                  </td>
                  <td className="text-right py-2 px-1.5 text-white tabular-nums">
                    {v.taxaCta.toFixed(1)}%
                    {showCompare && cv && <DeltaBadge curr={v.taxaCta} prev={cv.taxaCta} />}
                  </td>
                  <td className="text-right py-2 px-1.5 text-white tabular-nums">{v.taxaQuiz.toFixed(1)}%</td>
                  <td className="text-right py-2 px-1.5 text-white tabular-nums">{v.taxaIc.toFixed(1)}%</td>
                  <td className="text-right py-2 px-1.5 text-white tabular-nums">
                    {v.taxaConvFront.toFixed(1)}%
                    {showCompare && cv && <DeltaBadge curr={v.taxaConvFront} prev={cv.taxaConvFront} />}
                  </td>
                  <td className="text-right py-2 px-1.5 text-emerald-400 tabular-nums font-bold">
                    {v.frontSales}
                    {showCompare && cv && <DeltaBadge curr={v.frontSales} prev={cv.frontSales} />}
                  </td>
                  <td className="text-right py-2 px-1.5 text-white tabular-nums">{v.totalSales}</td>
                  <td className="text-right py-2 px-1.5 text-white tabular-nums">{v.taxaUpsell.toFixed(1)}%</td>
                  <td className="text-right py-2 px-1.5 text-white tabular-nums">R${v.frontRevenue.toFixed(0)}</td>
                  <td className="text-right py-2 px-1.5 text-white tabular-nums">R${v.upsellRevenue.toFixed(0)}</td>
                  <td className="text-right py-2 px-1.5 text-white tabular-nums font-semibold">
                    R${v.totalRevenue.toFixed(0)}
                    {showCompare && cv && <DeltaBadge curr={v.totalRevenue} prev={cv.totalRevenue} />}
                  </td>
                  <td className={cn("text-right py-2 px-1.5 font-bold tabular-nums", isBest ? "text-emerald-400" : isSecond ? "text-sky-400" : "text-white")}>
                    R${v.rpv.toFixed(2)}
                    {showCompare && cv && <DeltaBadge curr={v.rpv} prev={cv.rpv} />}
                  </td>
                  <td className="text-right py-2 px-1.5 text-white tabular-nums">R${v.ticketMedio.toFixed(0)}</td>
                  <td className="text-center py-2 px-1.5">
                    <span className={cn(
                      "inline-block min-w-[28px] px-1.5 py-0.5 rounded-md text-[10px] font-bold",
                      isBest ? "bg-emerald-500/20 text-emerald-400" :
                      isSecond ? "bg-sky-500/20 text-sky-400" :
                      "bg-[#2a2a2a] text-[#888]"
                    )}>
                      {v.notaFinal}
                    </span>
                  </td>
                  <td className="text-center py-2 px-1.5">
                    <button
                      onClick={() => setPreviewVariant(v.variant)}
                      className="text-[#666] hover:text-violet-400 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ─── ANÁLISE INTELIGENTE — VEREDITO ─── */}
      {best && best.notaFinal > 0 && (
        <div className="rounded-xl bg-gradient-to-br from-[#111] to-[#0a0a0a] border border-[#2a2a2a] p-4 space-y-4">
          <div className="flex items-center gap-2 border-b border-[#2a2a2a] pb-3">
            <Target className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Análise Inteligente — Teste A/B de Tela Inicial
            </h4>
          </div>

          {/* MELHOR TELA */}
          <div className="rounded-lg bg-emerald-500/[0.05] border border-emerald-500/20 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-xs font-bold text-emerald-400">
                MELHOR TELA: Variante {best.variant} — Nota {best.notaFinal}/100
              </span>
            </div>
            <p className="text-[11px] text-[#ccc] leading-relaxed pl-6">
              <strong className="text-white">Por quê:</strong> {generateMotivo(best, ranked)}
            </p>
            <div className="flex flex-wrap gap-3 pl-6">
              <div>
                <span className="text-[9px] text-emerald-400 font-semibold uppercase">Pontos fortes: </span>
                <span className="text-[10px] text-[#ccc]">{getStrongestCriteria(best, ranked).join(", ") || "equilibrado"}</span>
              </div>
              <div>
                <span className="text-[9px] text-red-400 font-semibold uppercase">Ponto fraco: </span>
                <span className="text-[10px] text-[#ccc]">{getWeakestCriterion(best, ranked)}</span>
              </div>
            </div>
          </div>

          {/* SEGUNDA MELHOR */}
          {second && second.notaFinal > 0 && (
            <div className="rounded-lg bg-sky-500/[0.05] border border-sky-500/20 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Medal className="w-4 h-4 text-sky-400 shrink-0" />
                <span className="text-xs font-bold text-sky-400">
                  SEGUNDA MELHOR: Variante {second.variant} — Nota {second.notaFinal}/100
                </span>
              </div>
              <p className="text-[11px] text-[#ccc] leading-relaxed pl-6">
                <strong className="text-white">Por quê:</strong> {generateMotivo(second, ranked)}
              </p>
              <div className="flex flex-wrap gap-3 pl-6">
                <div>
                  <span className="text-[9px] text-sky-400 font-semibold uppercase">Pontos fortes: </span>
                  <span className="text-[10px] text-[#ccc]">{getStrongestCriteria(second, ranked).join(", ") || "equilibrado"}</span>
                </div>
                <div>
                  <span className="text-[9px] text-red-400 font-semibold uppercase">Ponto fraco: </span>
                  <span className="text-[10px] text-[#ccc]">{getWeakestCriterion(second, ranked)}</span>
                </div>
              </div>
            </div>
          )}

          {/* RECOMENDAÇÃO */}
          <div className="rounded-lg bg-[#0d0d0d] border border-[#222] p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] font-bold text-amber-400 uppercase">Recomendação</span>
            </div>
            <p className="text-[11px] text-[#ccc] leading-relaxed pl-5.5">
              {generateRecomendacao(ranked)}
            </p>
          </div>

          {/* CONFIANÇA */}
          {confianca && (
            <div className="flex items-center gap-2 px-1">
              <Shield className={cn("w-3.5 h-3.5 shrink-0", {
                "text-red-400": confianca.level === "low",
                "text-yellow-400": confianca.level === "moderate",
                "text-emerald-400": confianca.level === "high",
                "text-emerald-300": confianca.level === "very_high",
              })} />
              <span className="text-[10px] text-[#888]">{confianca.text}</span>
            </div>
          )}
        </div>
      )}

      {/* Declare Winner button */}
      {best && confianca && (confianca.level === "high" || confianca.level === "very_high") && best.notaFinal >= 70 && (
        <button
          onClick={() => declareWinner(best.variant)}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold text-sm hover:brightness-110 transition-all"
        >
          <Trophy className="w-4 h-4 inline mr-2" />
          Declarar Variação {best.variant} como vencedora — Enviar 100% do tráfego
        </button>
      )}

      {/* Funnel bars per variant */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {ranked.map((v) => {
          const steps = [
            { label: "Visitantes", value: v.visitors },
            { label: "CTA", value: v.ctaClicks },
            { label: "Quiz OK", value: v.quizComplete },
            { label: "IC", value: v.checkouts },
            { label: "Vendas", value: v.frontSales },
          ];
          const max = Math.max(...steps.map((s) => s.value), 1);
          const isBest = ranked[0]?.variant === v.variant;
          return (
            <div
              key={v.variant}
              className={cn(
                "rounded-xl border p-3 space-y-2 cursor-pointer hover:border-violet-500/30 transition-colors",
                isBest ? "bg-emerald-500/[0.04] border-emerald-500/20" : "bg-[#141414] border-[#2a2a2a]"
              )}
              onClick={() => setPreviewVariant(v.variant)}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white">Var. {v.variant}</span>
                <Badge className={cn("text-[8px] border-0 px-1.5", isBest ? "bg-emerald-500/20 text-emerald-400" : "bg-[#2a2a2a] text-[#888]")}>
                  {v.notaFinal}pts
                </Badge>
                <Eye className="w-3 h-3 text-[#555] ml-auto" />
              </div>
              {steps.map((step) => (
                <div key={step.label} className="space-y-0.5">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-[#888]">{step.label}</span>
                    <span className="text-white tabular-nums">{step.value}</span>
                  </div>
                  <div className="h-1.5 bg-[#2a2a2a] rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all duration-700", isBest ? "bg-emerald-500" : "bg-violet-500")}
                      style={{ width: `${(step.value / max) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewVariant} onOpenChange={(open) => !open && setPreviewVariant(null)}>
        <DialogContent className="bg-[#111] border-[#2a2a2a] text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <FlaskConical className="w-4 h-4 text-violet-400" />
              Variação {previewVariant} — Preview
            </DialogTitle>
            <DialogDescription className="text-[#888]">
              Estrutura, copy e CTA da tela inicial
            </DialogDescription>
          </DialogHeader>
          {previewVariant && VARIANT_INFO[previewVariant] && (
            <div className="space-y-4 mt-2">
              <div className="rounded-xl bg-[#0d0d0d] border border-[#2a2a2a] p-4 space-y-3">
                <div>
                  <span className="text-[10px] text-violet-400 font-semibold uppercase tracking-wider">Ângulo</span>
                  <p className="text-sm text-white font-bold mt-1">{VARIANT_INFO[previewVariant].angle}</p>
                </div>
                <div>
                  <span className="text-[10px] text-sky-400 font-semibold uppercase tracking-wider">Headline</span>
                  <p className="text-sm text-[#ccc] mt-1">{VARIANT_INFO[previewVariant].headline}</p>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">CTA</span>
                  <div className="mt-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2 text-sm font-bold text-emerald-400 text-center">
                    {VARIANT_INFO[previewVariant].cta}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider">Estrutura</span>
                  <p className="text-xs text-[#999] mt-1 leading-relaxed">{VARIANT_INFO[previewVariant].description}</p>
                </div>
              </div>

              {/* Performance in dialog */}
              {(() => {
                const tv = data.find(d => d.variant === previewVariant);
                if (!tv) return null;
                const cv = cMap.get(previewVariant!);
                return (
                  <div className="rounded-xl bg-[#0d0d0d] border border-[#2a2a2a] p-4 space-y-2">
                    <span className="text-[10px] text-[#888] font-semibold uppercase tracking-wider">Performance — Nota {tv.notaFinal}/100</span>
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {[
                        { label: "RPV", value: `R$${tv.rpv.toFixed(2)}`, prev: cv?.rpv },
                        { label: "Conv%", value: `${tv.taxaConvFront.toFixed(1)}%`, prev: cv?.taxaConvFront },
                        { label: "Vendas", value: `${tv.frontSales}`, prev: cv?.frontSales },
                        { label: "Upsell%", value: `${tv.taxaUpsell.toFixed(1)}%`, prev: cv?.taxaUpsell },
                      ].map(m => (
                        <div key={m.label} className="text-center">
                          <p className="text-[9px] text-[#666]">{m.label}</p>
                          <p className="text-sm font-bold text-white">{m.value}</p>
                          {showCompare && m.prev !== undefined && (
                            <DeltaBadge curr={parseFloat(m.value.replace(/[^0-9.-]/g, '') || '0')} prev={m.prev} />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              <a
                href={`/?variant=${previewVariant}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center py-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-semibold hover:bg-violet-500/20 transition-colors"
              >
                <Eye className="w-3.5 h-3.5 inline mr-1.5" />
                Abrir Preview ao Vivo da Variação {previewVariant}
              </a>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── Multi-day aggregation ── */
function aggregateMultiDay(days: VariantData[][]): VariantData[] {
  const map = new Map<string, {
    visitors: number; ctaClicks: number; quizComplete: number; checkouts: number;
    frontSales: number; upsellSales: number; frontRevenue: number; upsellRevenue: number;
    totalSales: number; totalRevenue: number;
  }>();

  ["A", "B", "C", "D"].forEach(v => map.set(v, {
    visitors: 0, ctaClicks: 0, quizComplete: 0, checkouts: 0,
    frontSales: 0, upsellSales: 0, frontRevenue: 0, upsellRevenue: 0,
    totalSales: 0, totalRevenue: 0,
  }));

  days.forEach(dayData => {
    dayData.forEach(v => {
      const acc = map.get(v.variant);
      if (!acc) return;
      acc.visitors += v.visitors;
      acc.ctaClicks += v.ctaClicks;
      acc.quizComplete += v.quizComplete;
      acc.checkouts += v.checkouts;
      acc.frontSales += v.frontSales;
      acc.upsellSales += v.upsellSales;
      acc.frontRevenue += v.frontRevenue;
      acc.upsellRevenue += v.upsellRevenue;
      acc.totalSales += v.totalSales;
      acc.totalRevenue += v.totalRevenue;
    });
  });

  const raw = [...map.entries()].map(([variant, acc]) => ({
    variant,
    visitors: acc.visitors,
    cta_clicks: acc.ctaClicks,
    quiz_complete: acc.quizComplete,
    checkouts: acc.checkouts,
    front_sales: acc.frontSales,
    front_revenue: acc.frontRevenue,
    upsell_sales: acc.upsellSales,
    upsell_revenue: acc.upsellRevenue,
    total_sales: acc.totalSales,
    total_revenue: acc.totalRevenue,
  }));

  return parseVariants(raw);
}
