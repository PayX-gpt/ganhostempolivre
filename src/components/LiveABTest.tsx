import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { FlaskConical, Trophy, TrendingUp, TrendingDown, Eye, Calendar, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/* ── Types ── */
interface VariantData {
  variant: string;
  visitors: number;
  ctaClicks: number;
  ctaRate: number;
  quizComplete: number;
  quizRate: number;
  checkouts: number;
  frontSales: number;
  totalSales: number;
  convRate: number;
  frontRevenue: number;
  totalRevenue: number;
  revenuePerVisitor: number;
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

/* ── Stats helpers ── */
function zTest(p1: number, n1: number, p2: number, n2: number): number {
  if (n1 === 0 || n2 === 0) return 0;
  const p = (p1 * n1 + p2 * n2) / (n1 + n2);
  if (p === 0 || p === 1) return 0;
  const se = Math.sqrt(p * (1 - p) * (1 / n1 + 1 / n2));
  if (se === 0) return 0;
  return Math.abs(p1 - p2) / se;
}

function getConfidence(z: number): { label: string; color: string } {
  if (z >= 1.96) return { label: "95%", color: "text-emerald-400" };
  if (z >= 1.645) return { label: "90%", color: "text-yellow-400" };
  return { label: "—", color: "text-[#555]" };
}

function parseVariants(raw: any[]): VariantData[] {
  return (raw || [])
    .filter((v: any) => ["A", "B", "C", "D"].includes(String(v.variant || "").toUpperCase()))
    .map((v: any) => {
      const visitors = Number(v.visitors) || 0;
      const ctaClicks = Number(v.cta_clicks) || 0;
      const quizComplete = Number(v.quiz_complete) || 0;
      const checkouts = Number(v.checkouts) || 0;
      const frontSales = Number(v.front_sales) || 0;
      const totalSales = Number(v.total_sales) || 0;
      const frontRevenue = Number(v.front_revenue) || 0;
      const totalRevenue = Number(v.total_revenue) || 0;
      return {
        variant: String(v.variant).toUpperCase(),
        visitors, ctaClicks, ctaRate: visitors > 0 ? (ctaClicks / visitors) * 100 : 0,
        quizComplete, quizRate: ctaClicks > 0 ? (quizComplete / ctaClicks) * 100 : 0,
        checkouts, frontSales, totalSales,
        convRate: visitors > 0 ? (frontSales / visitors) * 100 : 0,
        frontRevenue, totalRevenue,
        revenuePerVisitor: visitors > 0 ? totalRevenue / visitors : 0,
      };
    })
    .sort((a, b) => b.revenuePerVisitor - a.revenuePerVisitor);
}

function delta(curr: number, prev: number): { value: string; positive: boolean | null } {
  if (prev === 0 && curr === 0) return { value: "—", positive: null };
  if (prev === 0) return { value: "+∞", positive: true };
  const pct = ((curr - prev) / prev) * 100;
  return { value: `${pct > 0 ? "+" : ""}${pct.toFixed(0)}%`, positive: pct > 0 ? true : pct < 0 ? false : null };
}

/* ── Delta badge ── */
function DeltaBadge({ curr, prev }: { curr: number; prev: number }) {
  const d = delta(curr, prev);
  if (d.positive === null) return null;
  return (
    <span className={cn("text-[9px] ml-1 font-medium", d.positive ? "text-emerald-400" : "text-red-400")}>
      {d.value}
    </span>
  );
}

/* ── Main Component ── */
export default function LiveABTest() {
  const [todayData, setTodayData] = useState<VariantData[]>([]);
  const [yesterdayData, setYesterdayData] = useState<VariantData[]>([]);
  const [showYesterday, setShowYesterday] = useState(true);
  const [previewVariant, setPreviewVariant] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Today from existing RPC (more complete)
      const { data: todayRpc } = await supabase.rpc("get_dashboard_summary_today" as any);
      const todaySummary = todayRpc as any;
      setTodayData(parseVariants(todaySummary?.ab_sales || []));

      // Yesterday from new RPC
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yStr = yesterday.toISOString().split("T")[0];
      const { data: yRpc } = await supabase.rpc("get_ab_summary_by_date" as any, { target_date: yStr });
      const ySummary = yRpc as any;
      setYesterdayData(parseVariants(ySummary?.ab_sales || []));
    } catch (err) {
      console.warn("[ABTest] fetch error:", err);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 120000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const data = todayData;
  const best = data.length > 0 ? data.reduce((b, v) => v.revenuePerVisitor > b.revenuePerVisitor ? v : b) : null;
  const worst = data.length > 0 ? data.reduce((w, v) => v.revenuePerVisitor < w.revenuePerVisitor ? v : w) : null;
  const control = data.find((v) => v.variant === "A");
  const leader = data.length > 0 ? data.reduce((l, v) => v.frontSales > l.frontSales ? v : l) : null;

  // Yesterday lookup
  const yMap = new Map(yesterdayData.map(v => [v.variant, v]));

  // Cumulative winner (today + yesterday combined)
  const cumulMap = new Map<string, { visitors: number; frontSales: number; totalRevenue: number; rpv: number }>();
  ["A", "B", "C", "D"].forEach(variant => {
    const t = data.find(d => d.variant === variant);
    const y = yMap.get(variant);
    const visitors = (t?.visitors || 0) + (y?.visitors || 0);
    const frontSales = (t?.frontSales || 0) + (y?.frontSales || 0);
    const totalRevenue = (t?.totalRevenue || 0) + (y?.totalRevenue || 0);
    cumulMap.set(variant, { visitors, frontSales, totalRevenue, rpv: visitors > 0 ? totalRevenue / visitors : 0 });
  });
  const cumulWinner = [...cumulMap.entries()].sort((a, b) => b[1].rpv - a[1].rpv)[0];

  const declareWinner = (variant: string) => {
    localStorage.setItem("quiz_variant_winner", variant);
    toast.success(`Variação ${variant} declarada vencedora! 100% do tráfego será direcionado.`);
  };

  if (data.every((v) => v.visitors === 0) && data.length === 0) {
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
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-violet-400" />
          <h3 className="text-sm font-semibold text-white">A/B Test — Tela Inicial</h3>
        </div>
        <button
          onClick={() => setShowYesterday(!showYesterday)}
          className={cn(
            "flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-lg border transition-all",
            showYesterday ? "bg-violet-500/10 border-violet-500/30 text-violet-300" : "bg-[#1a1a1a] border-[#2a2a2a] text-[#888]"
          )}
        >
          <Calendar className="w-3 h-3" />
          {showYesterday ? "Comparando com ontem" : "Comparar com ontem"}
        </button>
      </div>

      {/* Winner highlight card */}
      {cumulWinner && cumulWinner[1].rpv > 0 && (
        <div className="rounded-xl bg-gradient-to-r from-amber-500/10 to-emerald-500/10 border border-amber-500/20 p-3 flex items-center gap-3">
          <Trophy className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-amber-400">Variação {cumulWinner[0]} lidera (acumulado)</span>
              <Badge className="text-[8px] bg-amber-500/20 text-amber-300 border-0 px-1.5">
                RPV R$ {cumulWinner[1].rpv.toFixed(2)}
              </Badge>
              <Badge className="text-[8px] bg-emerald-500/20 text-emerald-300 border-0 px-1.5">
                {cumulWinner[1].frontSales} vendas
              </Badge>
            </div>
            <p className="text-[10px] text-[#999] mt-0.5">
              {VARIANT_INFO[cumulWinner[0]]?.angle || ""} — Clique na variação para ver a copy
            </p>
          </div>
          <button
            onClick={() => setPreviewVariant(cumulWinner[0])}
            className="shrink-0 px-2 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-[10px] font-medium hover:bg-amber-500/30 transition-colors"
          >
            <Eye className="w-3 h-3 inline mr-1" />Ver
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto -mx-4 px-4">
        <table className="w-full text-xs min-w-[850px]">
          <thead>
            <tr className="text-[#888] border-b border-[#2a2a2a]">
              <th className="text-left py-2 px-2 font-medium">Variação</th>
              <th className="text-right py-2 px-2 font-medium">Visitantes</th>
              <th className="text-right py-2 px-2 font-medium">CTA Click</th>
              <th className="text-right py-2 px-2 font-medium">Taxa CTA</th>
              <th className="text-right py-2 px-2 font-medium">Quiz OK</th>
              <th className="text-right py-2 px-2 font-medium">IC</th>
              <th className="text-right py-2 px-2 font-medium">Vendas</th>
              <th className="text-right py-2 px-2 font-medium">Conv%</th>
              <th className="text-right py-2 px-2 font-medium">Receita</th>
              <th className="text-right py-2 px-2 font-medium">R$/Visit.</th>
              <th className="text-center py-2 px-2 font-medium">Conf.</th>
              <th className="text-center py-2 px-2 font-medium">Preview</th>
            </tr>
          </thead>
          <tbody>
            {data.map((v) => {
              const isBest = best?.variant === v.variant && data.filter(d => d.visitors > 0).length > 1;
              const isWorst = worst?.variant === v.variant && data.filter(d => d.visitors > 0).length > 1 && worst.variant !== best?.variant;
              const isLeader = leader?.variant === v.variant;
              const confidence = control && v.variant !== "A"
                ? getConfidence(zTest(v.convRate / 100, v.visitors, control.convRate / 100, control.visitors))
                : { label: "Ctrl", color: "text-sky-400" };
              const yv = yMap.get(v.variant);

              return (
                <tr
                  key={v.variant}
                  className={cn(
                    "border-b border-[#1a1a1a] transition-colors hover:bg-white/[0.02]",
                    isBest && "bg-emerald-500/5",
                    isWorst && "bg-red-500/5"
                  )}
                >
                  <td className="py-2 px-2">
                    <div className="flex items-center gap-1.5">
                      <span className={cn("font-bold", isBest ? "text-emerald-400" : isWorst ? "text-red-400" : "text-white")}>
                        {v.variant}
                      </span>
                      {v.variant === "A" && <Badge className="text-[8px] bg-sky-500/20 text-sky-400 border-0 px-1">Ctrl</Badge>}
                      {isLeader && <Badge className="text-[8px] bg-emerald-500/20 text-emerald-400 border-0 px-1">Líder</Badge>}
                      {isBest && <Trophy className="w-3 h-3 text-amber-400" />}
                    </div>
                  </td>
                  <td className="text-right py-2 px-2 text-white tabular-nums">
                    {v.visitors}
                    {showYesterday && yv && <DeltaBadge curr={v.visitors} prev={yv.visitors} />}
                  </td>
                  <td className="text-right py-2 px-2 text-white tabular-nums">
                    {v.ctaClicks}
                    {showYesterday && yv && <DeltaBadge curr={v.ctaClicks} prev={yv.ctaClicks} />}
                  </td>
                  <td className="text-right py-2 px-2 text-white tabular-nums">{v.ctaRate.toFixed(1)}%</td>
                  <td className="text-right py-2 px-2 text-white tabular-nums">{v.quizComplete}</td>
                  <td className="text-right py-2 px-2 text-white tabular-nums">{v.checkouts}</td>
                  <td className="text-right py-2 px-2 text-emerald-400 tabular-nums font-bold">
                    {v.frontSales}
                    {showYesterday && yv && <DeltaBadge curr={v.frontSales} prev={yv.frontSales} />}
                  </td>
                  <td className="text-right py-2 px-2 text-white tabular-nums">
                    {v.convRate.toFixed(1)}%
                    {showYesterday && yv && <DeltaBadge curr={v.convRate} prev={yv.convRate} />}
                  </td>
                  <td className="text-right py-2 px-2 text-white tabular-nums">R$ {v.totalRevenue.toFixed(0)}</td>
                  <td className={cn("text-right py-2 px-2 font-bold tabular-nums", isBest ? "text-emerald-400" : isWorst ? "text-red-400" : "text-white")}>
                    R$ {v.revenuePerVisitor.toFixed(2)}
                    {showYesterday && yv && <DeltaBadge curr={v.revenuePerVisitor} prev={yv.revenuePerVisitor} />}
                  </td>
                  <td className="text-center py-2 px-2">
                    <span className={cn("text-[10px] font-medium", confidence.color)}>{confidence.label}</span>
                  </td>
                  <td className="text-center py-2 px-2">
                    <button
                      onClick={() => setPreviewVariant(v.variant)}
                      className="text-[#666] hover:text-violet-400 transition-colors"
                      title={`Ver copy da variação ${v.variant}`}
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

      {/* Yesterday comparison row */}
      {showYesterday && yesterdayData.length > 0 && (
        <div className="rounded-xl bg-[#111] border border-[#222] p-3 space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-3 h-3 text-[#666]" />
            <span className="text-[10px] font-semibold text-[#888]">Ontem (comparativo)</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {yesterdayData.map(yv => (
              <div key={yv.variant} className="rounded-lg bg-[#0d0d0d] border border-[#1a1a1a] px-2.5 py-2 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#888]">{yv.variant}</span>
                  <span className="text-[10px] text-[#555]">{yv.visitors} vis.</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#666]">Vendas</span>
                  <span className="text-[10px] text-white tabular-nums">{yv.frontSales}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#666]">R$/Visit.</span>
                  <span className="text-[10px] text-white tabular-nums">R$ {yv.revenuePerVisitor.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Funnel bars per variant */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {data.map((v) => {
          const steps = [
            { label: "Visitantes", value: v.visitors },
            { label: "CTA", value: v.ctaClicks },
            { label: "Quiz OK", value: v.quizComplete },
            { label: "IC", value: v.checkouts },
            { label: "Vendas", value: v.frontSales },
          ];
          const max = Math.max(...steps.map((s) => s.value), 1);
          return (
            <div
              key={v.variant}
              className="rounded-xl bg-[#141414] border border-[#2a2a2a] p-3 space-y-2 cursor-pointer hover:border-violet-500/30 transition-colors"
              onClick={() => setPreviewVariant(v.variant)}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white">Variação {v.variant}</span>
                {best?.variant === v.variant && <Trophy className="w-3 h-3 text-amber-400" />}
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
                      className={cn(
                        "h-full rounded-full transition-all duration-700",
                        best?.variant === v.variant ? "bg-emerald-500" : "bg-violet-500"
                      )}
                      style={{ width: `${(step.value / max) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Winner button */}
      {best && control && best.variant !== "A" && best.visitors >= 500 && (() => {
        const z = zTest(best.convRate / 100, best.visitors, control.convRate / 100, control.visitors);
        if (z >= 1.96) {
          return (
            <button
              onClick={() => declareWinner(best.variant)}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold text-sm hover:brightness-110 transition-all"
            >
              <Trophy className="w-4 h-4 inline mr-2" />
              Declarar Variação {best.variant} como vencedora — Enviar 100% do tráfego
            </button>
          );
        }
        return null;
      })()}

      {/* Preview Dialog */}
      <Dialog open={!!previewVariant} onOpenChange={(open) => !open && setPreviewVariant(null)}>
        <DialogContent className="bg-[#111] border-[#2a2a2a] text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <FlaskConical className="w-4 h-4 text-violet-400" />
              Variação {previewVariant} — Preview
            </DialogTitle>
            <DialogDescription className="text-[#888]">
              Estrutura, copy e CTA da tela inicial desta variação
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
                  <span className="text-[10px] text-sky-400 font-semibold uppercase tracking-wider">Headline Principal</span>
                  <p className="text-sm text-[#ccc] mt-1">{VARIANT_INFO[previewVariant].headline}</p>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">CTA</span>
                  <div className="mt-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2 text-sm font-bold text-emerald-400 text-center">
                    {VARIANT_INFO[previewVariant].cta}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider">Descrição da Estrutura</span>
                  <p className="text-xs text-[#999] mt-1 leading-relaxed">{VARIANT_INFO[previewVariant].description}</p>
                </div>
              </div>

              {/* Performance comparison in dialog */}
              {(() => {
                const tv = todayData.find(d => d.variant === previewVariant);
                const yv = yMap.get(previewVariant!);
                const cumul = cumulMap.get(previewVariant!);
                if (!tv && !yv) return null;
                return (
                  <div className="rounded-xl bg-[#0d0d0d] border border-[#2a2a2a] p-4 space-y-2">
                    <span className="text-[10px] text-[#888] font-semibold uppercase tracking-wider">Performance</span>
                    <div className="grid grid-cols-3 gap-3 mt-2">
                      <div className="text-center">
                        <p className="text-[10px] text-[#666]">Hoje</p>
                        <p className="text-sm font-bold text-white">{tv?.frontSales || 0} vendas</p>
                        <p className="text-[10px] text-[#888]">RPV R$ {(tv?.revenuePerVisitor || 0).toFixed(2)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-[#666]">Ontem</p>
                        <p className="text-sm font-bold text-white">{yv?.frontSales || 0} vendas</p>
                        <p className="text-[10px] text-[#888]">RPV R$ {(yv?.revenuePerVisitor || 0).toFixed(2)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-[#666]">Acumulado</p>
                        <p className="text-sm font-bold text-amber-400">{cumul?.frontSales || 0} vendas</p>
                        <p className="text-[10px] text-amber-300">RPV R$ {(cumul?.rpv || 0).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Open live preview link */}
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
