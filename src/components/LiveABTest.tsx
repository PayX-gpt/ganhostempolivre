import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FlaskConical, Trophy, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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

function zTest(p1: number, n1: number, p2: number, n2: number): number {
  if (n1 === 0 || n2 === 0) return 0;
  const p = (p1 * n1 + p2 * n2) / (n1 + n2);
  if (p === 0 || p === 1) return 0;
  const se = Math.sqrt(p * (1 - p) * (1 / n1 + 1 / n2));
  if (se === 0) return 0;
  return Math.abs(p1 - p2) / se;
}

function getConfidence(z: number): { label: string; color: string; level: string } {
  if (z >= 1.96) return { label: "95% confianca", color: "text-emerald-400", level: "high" };
  if (z >= 1.645) return { label: "90% confianca", color: "text-yellow-400", level: "medium" };
  return { label: "Coletando dados", color: "text-[#888]", level: "low" };
}

export default function LiveABTest() {
  const [data, setData] = useState<VariantData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: rpcResult } = await supabase.rpc("get_dashboard_summary_today" as any);
      const summary = rpcResult as any;
      if (!summary || !summary.ab_sales) {
        setData([]);
        setIsLoading(false);
        return;
      }

      const variants: VariantData[] = (summary.ab_sales as any[])
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
            variant: v.variant,
            visitors,
            ctaClicks,
            ctaRate: visitors > 0 ? (ctaClicks / visitors) * 100 : 0,
            quizComplete,
            quizRate: ctaClicks > 0 ? (quizComplete / ctaClicks) * 100 : 0,
            checkouts,
            frontSales,
            totalSales,
            convRate: visitors > 0 ? (frontSales / visitors) * 100 : 0,
            frontRevenue,
            totalRevenue,
            revenuePerVisitor: visitors > 0 ? totalRevenue / visitors : 0,
          };
        })
        .sort((a, b) => {
          // Put A/B/C/D first sorted by frontSales, then sem_variante last
          const aIsNamed = ["A", "B", "C", "D"].includes(a.variant);
          const bIsNamed = ["A", "B", "C", "D"].includes(b.variant);
          if (aIsNamed && !bIsNamed) return -1;
          if (!aIsNamed && bIsNamed) return 1;
          return b.frontSales - a.frontSales;
        });

      setData(variants);
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

  const namedVariants = data.filter(v => ["A", "B", "C", "D"].includes(v.variant));
  const bestVariant = namedVariants.length > 0 ? namedVariants.reduce((best, v) => v.revenuePerVisitor > best.revenuePerVisitor ? v : best) : null;
  const worstVariant = namedVariants.length > 0 ? namedVariants.reduce((worst, v) => v.revenuePerVisitor < worst.revenuePerVisitor ? v : worst) : null;
  const controlVariant = data.find((v) => v.variant === "A");
  const leaderVariant = namedVariants.length > 0 ? namedVariants.reduce((best, v) => v.frontSales > best.frontSales ? v : best) : null;
  const totalABSales = data.reduce((sum, v) => sum + v.frontSales, 0);

  const hasEnoughData = data.some((v) => v.visitors >= 100);

  const declareWinner = (variant: string) => {
    localStorage.setItem("quiz_variant_winner", variant);
    toast.success(`Variacao ${variant} declarada vencedora! 100% do trafego sera direcionado.`);
  };

  if (!hasEnoughData && data.every((v) => v.visitors === 0)) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a] p-4">
        <div className="flex items-center gap-2 mb-3">
          <FlaskConical className="w-4 h-4 text-violet-400" />
          <h3 className="text-sm font-semibold text-white">A/B Test — Tela Inicial</h3>
        </div>
        <p className="text-xs text-[#888]">Aguardando dados. As variacoes serao distribuidas automaticamente para novos visitantes.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a] p-4 space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-violet-400" />
          <h3 className="text-sm font-semibold text-white">A/B Test — Tela Inicial (hoje)</h3>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto -mx-4 px-4">
        <table className="w-full text-xs min-w-[800px]">
          <thead>
            <tr className="text-[#888] border-b border-[#2a2a2a]">
              <th className="text-left py-2 px-2 font-medium">Variacao</th>
              <th className="text-right py-2 px-2 font-medium">Visitantes</th>
              <th className="text-right py-2 px-2 font-medium">CTA Click</th>
              <th className="text-right py-2 px-2 font-medium">Taxa CTA</th>
              <th className="text-right py-2 px-2 font-medium">Quiz OK</th>
              <th className="text-right py-2 px-2 font-medium">IC</th>
              <th className="text-right py-2 px-2 font-medium">Vendas Front</th>
              <th className="text-right py-2 px-2 font-medium">Total Vendas</th>
              <th className="text-right py-2 px-2 font-medium">Conv%</th>
              <th className="text-right py-2 px-2 font-medium">Receita</th>
              <th className="text-right py-2 px-2 font-medium">R$/Visitante</th>
              <th className="text-center py-2 px-2 font-medium">Confianca</th>
            </tr>
          </thead>
          <tbody>
            {data.map((v) => {
              const isBest = bestVariant?.variant === v.variant && data.filter((d) => d.visitors > 0).length > 1;
              const isWorst = worstVariant?.variant === v.variant && data.filter((d) => d.visitors > 0).length > 1 && worstVariant.variant !== bestVariant?.variant;
              const isLeader = leaderVariant?.variant === v.variant;
              const confidence = controlVariant && v.variant !== "A"
                ? getConfidence(zTest(v.convRate / 100, v.visitors, controlVariant.convRate / 100, controlVariant.visitors))
                : { label: "Controle", color: "text-sky-400", level: "control" };

              return (
                <tr
                  key={v.variant}
                  className={cn(
                    "border-b border-[#1a1a1a] transition-colors",
                    isBest && "bg-emerald-500/5",
                    isWorst && "bg-red-500/5"
                  )}
                >
                  <td className="py-2 px-2">
                    <div className="flex items-center gap-1.5">
                      <span className={cn(
                        "font-bold",
                        v.variant === "sem_variante" ? "text-[#666]" : isBest ? "text-emerald-400" : isWorst ? "text-red-400" : "text-white"
                      )}>
                        {v.variant === "sem_variante" ? "Sem variante" : v.variant}
                      </span>
                      {v.variant === "A" && <Badge className="text-[8px] bg-sky-500/20 text-sky-400 border-0 px-1">Controle</Badge>}
                      {v.variant === "sem_variante" && <Badge className="text-[8px] bg-[#333] text-[#888] border-0 px-1">Sem atribuicao</Badge>}
                      {isLeader && <Badge className="text-[8px] bg-emerald-500/20 text-emerald-400 border-0 px-1">Lider</Badge>}
                      {isBest && <Trophy className="w-3 h-3 text-amber-400" />}
                    </div>
                  </td>
                  <td className="text-right py-2 px-2 text-white tabular-nums">{v.visitors}</td>
                  <td className="text-right py-2 px-2 text-white tabular-nums">{v.ctaClicks}</td>
                  <td className="text-right py-2 px-2 text-white tabular-nums">{v.ctaRate.toFixed(1)}%</td>
                  <td className="text-right py-2 px-2 text-white tabular-nums">{v.quizComplete}</td>
                  <td className="text-right py-2 px-2 text-white tabular-nums">{v.checkouts}</td>
                  <td className="text-right py-2 px-2 text-emerald-400 tabular-nums font-bold">{v.frontSales}</td>
                  <td className="text-right py-2 px-2 text-white tabular-nums">{v.totalSales}</td>
                  <td className="text-right py-2 px-2 text-white tabular-nums">{v.convRate.toFixed(1)}%</td>
                  <td className="text-right py-2 px-2 text-white tabular-nums">R$ {v.totalRevenue.toFixed(0)}</td>
                  <td className={cn("text-right py-2 px-2 font-bold tabular-nums", isBest ? "text-emerald-400" : isWorst ? "text-red-400" : "text-white")}>
                    R$ {v.revenuePerVisitor.toFixed(2)}
                  </td>
                  <td className="text-center py-2 px-2">
                    <span className={cn("text-[10px] font-medium", confidence.color)}>
                      {confidence.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Insight text */}
      {leaderVariant && leaderVariant.frontSales > 0 && (
        <div className="rounded-xl bg-[#141414] border border-[#2a2a2a] p-3 text-xs text-[#ccc]">
          <span className="text-white font-semibold">Insight:</span> Variante {leaderVariant.variant} lidera em vendas com {leaderVariant.frontSales} conversoes ({leaderVariant.convRate.toFixed(1)}% de conv.), receita por visitante: R$ {leaderVariant.revenuePerVisitor.toFixed(2)}.
          {leaderVariant.variant !== bestVariant?.variant && bestVariant && (
            <> Porem, variante {bestVariant.variant} tem maior receita/visitante (R$ {bestVariant.revenuePerVisitor.toFixed(2)}).</>
          )}
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
            <div key={v.variant} className="rounded-xl bg-[#141414] border border-[#2a2a2a] p-3 space-y-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white">Variacao {v.variant}</span>
                {bestVariant?.variant === v.variant && <Trophy className="w-3 h-3 text-amber-400" />}
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
                        bestVariant?.variant === v.variant ? "bg-emerald-500" : "bg-violet-500"
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
      {bestVariant && controlVariant && bestVariant.variant !== "A" && bestVariant.visitors >= 500 && (() => {
        const z = zTest(bestVariant.convRate / 100, bestVariant.visitors, controlVariant.convRate / 100, controlVariant.visitors);
        if (z >= 1.96) {
          return (
            <button
              onClick={() => declareWinner(bestVariant.variant)}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold text-sm hover:brightness-110 transition-all"
            >
              <Trophy className="w-4 h-4 inline mr-2" />
              Declarar Variacao {bestVariant.variant} como vencedora — Enviar 100% do trafego
            </button>
          );
        }
        return null;
      })()}
    </div>
  );
}
