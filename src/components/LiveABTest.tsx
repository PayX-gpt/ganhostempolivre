import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  offerViewed: number;
  checkouts: number;
  sales: number;
  convRate: number;
  revenue: number;
  revenuePerVisitor: number;
}

// Z-test for two proportions
function zTest(p1: number, n1: number, p2: number, n2: number): number {
  if (n1 === 0 || n2 === 0) return 0;
  const p = (p1 * n1 + p2 * n2) / (n1 + n2);
  if (p === 0 || p === 1) return 0;
  const se = Math.sqrt(p * (1 - p) * (1 / n1 + 1 / n2));
  if (se === 0) return 0;
  return Math.abs(p1 - p2) / se;
}

function getConfidence(z: number): { label: string; color: string; level: string } {
  if (z >= 1.96) return { label: "95% confiança", color: "text-emerald-400", level: "high" };
  if (z >= 1.645) return { label: "90% confiança", color: "text-yellow-400", level: "medium" };
  return { label: "Coletando dados", color: "text-[#888]", level: "low" };
}

export default function LiveABTest() {
  const [data, setData] = useState<VariantData[]>([]);
  const [period, setPeriod] = useState("24h");
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const now = new Date();
    const start = new Date();
    switch (period) {
      case "1h": start.setHours(now.getHours() - 1); break;
      case "24h": start.setDate(now.getDate() - 1); break;
      case "7d": start.setDate(now.getDate() - 7); break;
      case "30d": start.setDate(now.getDate() - 30); break;
      default: start.setDate(now.getDate() - 1);
    }
    const startISO = start.toISOString();

    try {
      // Get all sessions with variant assignment
      const { data: sessions } = await supabase
        .from("session_attribution")
        .select("session_id, quiz_variant")
        .not("quiz_variant", "is", null)
        .gte("created_at", startISO);

      if (!sessions || sessions.length === 0) {
        setData([]);
        setIsLoading(false);
        return;
      }

      const sessionsByVariant: Record<string, Set<string>> = { A: new Set(), B: new Set(), C: new Set(), D: new Set() };
      sessions.forEach((s: any) => {
        const v = s.quiz_variant;
        if (v && sessionsByVariant[v]) sessionsByVariant[v].add(s.session_id);
      });

      const allSessionIds = sessions.map((s: any) => s.session_id);

      // Get funnel events for these sessions
      const { data: events } = await supabase
        .from("funnel_events")
        .select("session_id, event_name, event_data")
        .in("session_id", allSessionIds.slice(0, 500))
        .gte("created_at", startISO);

      // Get purchases
      const { data: purchases } = await supabase
        .from("purchase_tracking")
        .select("session_id, amount, status, email")
        .in("session_id", allSessionIds.slice(0, 500))
        .gte("created_at", startISO);

      const variants: VariantData[] = ["A", "B", "C", "D"].map((v) => {
        const vSessions = sessionsByVariant[v];
        const vEvents = (events || []).filter((e) => vSessions.has(e.session_id));
        const vPurchases = (purchases || []).filter(
          (p) => p.session_id && vSessions.has(p.session_id) &&
            ["completed", "purchased", "approved", "redirected"].includes(p.status || "")
        );

        const ctaClicks = new Set(vEvents.filter((e) => {
          const ed = e.event_data as any;
          return e.event_name === "step_completed" && ed?.step === "step-1";
        }).map((e) => e.session_id)).size;

        const quizComplete = new Set(vEvents.filter((e) => {
          const ed = e.event_data as any;
          return e.event_name === "step_viewed" && (ed?.step === "step-15" || ed?.step === "step-16" || ed?.step === "step-17");
        }).map((e) => e.session_id)).size;

        const offerViewed = new Set(vEvents.filter((e) => {
          const ed = e.event_data as any;
          return e.event_name === "step_viewed" && ed?.step === "step-17";
        }).map((e) => e.session_id)).size;

        const checkouts = new Set(vEvents.filter((e) =>
          e.event_name === "checkout_click" || e.event_name === "capi_ic_sent"
        ).map((e) => e.session_id)).size;

        const uniqueBuyers = new Set(vPurchases.filter((p) => p.email).map((p) => p.email!.toLowerCase())).size;
        const sales = uniqueBuyers || vPurchases.length;
        const revenue = vPurchases.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

        return {
          variant: v,
          visitors: vSessions.size,
          ctaClicks,
          ctaRate: vSessions.size > 0 ? (ctaClicks / vSessions.size) * 100 : 0,
          quizComplete,
          quizRate: ctaClicks > 0 ? (quizComplete / ctaClicks) * 100 : 0,
          offerViewed,
          checkouts,
          sales,
          convRate: vSessions.size > 0 ? (sales / vSessions.size) * 100 : 0,
          revenue,
          revenuePerVisitor: vSessions.size > 0 ? revenue / vSessions.size : 0,
        };
      });

      setData(variants);
    } catch (err) {
      console.warn("[ABTest] fetch error:", err);
    }
    setIsLoading(false);
  }, [period]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 120000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const bestVariant = data.length > 0 ? data.reduce((best, v) => v.revenuePerVisitor > best.revenuePerVisitor ? v : best) : null;
  const worstVariant = data.length > 0 ? data.reduce((worst, v) => v.revenuePerVisitor < worst.revenuePerVisitor ? v : worst) : null;
  const controlVariant = data.find((v) => v.variant === "A");

  const hasEnoughData = data.some((v) => v.visitors >= 100);

  const declareWinner = (variant: string) => {
    localStorage.setItem("quiz_variant_winner", variant);
    toast.success(`Variação ${variant} declarada vencedora! 100% do tráfego será direcionado.`);
  };

  if (!hasEnoughData && data.every((v) => v.visitors === 0)) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a] p-4">
        <div className="flex items-center gap-2 mb-3">
          <FlaskConical className="w-4 h-4 text-violet-400" />
          <h3 className="text-sm font-semibold text-white">🧪 A/B Test — Tela Inicial</h3>
        </div>
        <p className="text-xs text-[#888]">Aguardando dados. As variações serão distribuídas automaticamente para novos visitantes.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a] p-4 space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-violet-400" />
          <h3 className="text-sm font-semibold text-white">🧪 A/B Test — Tela Inicial</h3>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="h-7 w-auto bg-[#141414] border-[#222] text-white/80 rounded text-[10px] px-2 gap-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#141414] border-[#222]">
            <SelectItem value="1h">1h</SelectItem>
            <SelectItem value="24h">24h</SelectItem>
            <SelectItem value="7d">7d</SelectItem>
            <SelectItem value="30d">30d</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto -mx-4 px-4">
        <table className="w-full text-xs min-w-[700px]">
          <thead>
            <tr className="text-[#888] border-b border-[#2a2a2a]">
              <th className="text-left py-2 px-2 font-medium">Variação</th>
              <th className="text-right py-2 px-2 font-medium">Visitantes</th>
              <th className="text-right py-2 px-2 font-medium">CTA Click</th>
              <th className="text-right py-2 px-2 font-medium">Taxa CTA</th>
              <th className="text-right py-2 px-2 font-medium">Quiz ✓</th>
              <th className="text-right py-2 px-2 font-medium">IC</th>
              <th className="text-right py-2 px-2 font-medium">Vendas</th>
              <th className="text-right py-2 px-2 font-medium">Conv%</th>
              <th className="text-right py-2 px-2 font-medium">Receita</th>
              <th className="text-right py-2 px-2 font-medium">R$/Visitante</th>
              <th className="text-center py-2 px-2 font-medium">Confiança</th>
            </tr>
          </thead>
          <tbody>
            {data.map((v) => {
              const isBest = bestVariant?.variant === v.variant && data.filter((d) => d.visitors > 0).length > 1;
              const isWorst = worstVariant?.variant === v.variant && data.filter((d) => d.visitors > 0).length > 1 && worstVariant.variant !== bestVariant?.variant;
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
                        isBest ? "text-emerald-400" : isWorst ? "text-red-400" : "text-white"
                      )}>
                        {v.variant}
                      </span>
                      {v.variant === "A" && <Badge className="text-[8px] bg-sky-500/20 text-sky-400 border-0 px-1">Controle</Badge>}
                      {isBest && <Trophy className="w-3 h-3 text-amber-400" />}
                    </div>
                  </td>
                  <td className="text-right py-2 px-2 text-white tabular-nums">{v.visitors}</td>
                  <td className="text-right py-2 px-2 text-white tabular-nums">{v.ctaClicks}</td>
                  <td className="text-right py-2 px-2 text-white tabular-nums">{v.ctaRate.toFixed(1)}%</td>
                  <td className="text-right py-2 px-2 text-white tabular-nums">{v.quizComplete}</td>
                  <td className="text-right py-2 px-2 text-white tabular-nums">{v.checkouts}</td>
                  <td className="text-right py-2 px-2 text-white tabular-nums">{v.sales}</td>
                  <td className="text-right py-2 px-2 text-white tabular-nums">{v.convRate.toFixed(1)}%</td>
                  <td className="text-right py-2 px-2 text-white tabular-nums">R$ {v.revenue.toFixed(0)}</td>
                  <td className={cn("text-right py-2 px-2 font-bold tabular-nums", isBest ? "text-emerald-400" : isWorst ? "text-red-400" : "text-white")}>
                    R$ {v.revenuePerVisitor.toFixed(2)}
                  </td>
                  <td className="text-center py-2 px-2">
                    <span className={cn("text-[10px] font-medium", confidence.color)}>
                      {confidence.level === "high" ? "🟢" : confidence.level === "medium" ? "🟡" : confidence.level === "low" ? "🟡" : "🔵"} {confidence.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Funnel bars per variant */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {data.map((v) => {
          const steps = [
            { label: "Visitantes", value: v.visitors },
            { label: "CTA", value: v.ctaClicks },
            { label: "Quiz ✓", value: v.quizComplete },
            { label: "IC", value: v.checkouts },
            { label: "Vendas", value: v.sales },
          ];
          const max = Math.max(...steps.map((s) => s.value), 1);
          return (
            <div key={v.variant} className="rounded-xl bg-[#141414] border border-[#2a2a2a] p-3 space-y-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white">Variação {v.variant}</span>
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
              🏆 Declarar Variação {bestVariant.variant} como vencedora — Enviar 100% do tráfego
            </button>
          );
        }
        return null;
      })()}
    </div>
  );
}
