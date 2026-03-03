import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, CheckCircle2, TrendingDown, Brain, RefreshCw, Gauge } from "lucide-react";
import { cn } from "@/lib/utils";

interface Alert {
  id: string;
  level: "critical" | "warning" | "opportunity";
  message: string;
  detail?: string;
}

interface FunnelHealthData {
  score: number;
  quizCompletionRate: number;
  checkoutRate: number;
  approvalRate: number;
  upsellRate: number;
  revenueProjection: number;
  funnelVelocityMin: number;
}

// Paginated fetch
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

export default function LiveAIAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [health, setHealth] = useState<FunnelHealthData | null>(null);
  const [loading, setLoading] = useState(false);

  const analyze = useCallback(async () => {
    setLoading(true);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayISO = todayStart.toISOString();

    // Previous period (yesterday)
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const yesterdayISO = yesterdayStart.toISOString();

    const [stepEvents, purchases, purchasesYesterday, leads, checkoutEvents, upsellPurchases] = await Promise.all([
      fetchAllRows("funnel_events", "session_id, event_data, created_at", (q: any) => q.eq("event_name", "step_viewed").gte("created_at", todayISO)),
      fetchAllRows("purchase_tracking", "id, amount, status, created_at, session_id", (q: any) => q.gte("created_at", todayISO)),
      fetchAllRows("purchase_tracking", "id, amount, status", (q: any) => q.gte("created_at", yesterdayISO).lt("created_at", todayISO)),
      fetchAllRows("lead_behavior", "session_id, quiz_answers, checkout_clicked, intent_score, account_balance", (q: any) => q.gte("created_at", todayISO)),
      fetchAllRows("funnel_events", "session_id", (q: any) => q.in("event_name", ["checkout_click", "capi_ic_sent"]).gte("created_at", todayISO)),
      fetchAllRows("purchase_tracking", "funnel_step, amount, status", (q: any) => q.gte("created_at", todayISO).not("funnel_step", "is", null)),
    ]);

    const newAlerts: Alert[] = [];

    // Step counts
    const stepCounts: Record<string, Set<string>> = {};
    stepEvents.forEach((e: any) => {
      const step = (e.event_data as any)?.step as string;
      if (step) {
        if (!stepCounts[step]) stepCounts[step] = new Set();
        stepCounts[step].add(e.session_id);
      }
    });

    const STEP_ORDER = [
      "step-1", "step-2", "step-3", "step-4", "step-5", "step-6", "step-7",
      "step-8", "step-9", "step-10", "step-11", "step-12", "step-13", "step-14",
      "step-15", "step-16", "step-17"
    ];
    const STEP_LABELS: Record<string, string> = {
      "step-1": "Intro", "step-2": "Idade", "step-3": "Nome", "step-4": "Prova Social",
      "step-5": "Online?", "step-6": "Meta", "step-7": "Obstáculo", "step-8": "Mentor",
      "step-9": "Saldo", "step-10": "Tempo", "step-11": "Demo", "step-12": "WhatsApp",
      "step-13": "Contato", "step-14": "Input", "step-15": "Análise", "step-16": "Projeção",
      "step-17": "Oferta"
    };

    // Bottleneck detection
    for (let i = 1; i < STEP_ORDER.length; i++) {
      const prev = stepCounts[STEP_ORDER[i - 1]]?.size || 0;
      const curr = stepCounts[STEP_ORDER[i]]?.size || 0;
      if (prev > 5) {
        const dropOff = ((prev - curr) / prev) * 100;
        if (dropOff > 40) {
          newAlerts.push({
            id: `bottleneck-${STEP_ORDER[i]}`,
            level: "critical",
            message: `⚠️ GARGALO: ${Math.round(dropOff)}% dos leads abandonam em "${STEP_LABELS[STEP_ORDER[i]] || STEP_ORDER[i]}". De ${prev} → ${curr}.`,
            detail: `Considere encurtar ou simplificar essa etapa.`,
          });
        } else if (dropOff > 25) {
          newAlerts.push({
            id: `dropoff-${STEP_ORDER[i]}`,
            level: "warning",
            message: `Drop-off de ${Math.round(dropOff)}% na etapa "${STEP_LABELS[STEP_ORDER[i]]}". De ${prev} → ${curr}.`,
          });
        }
      }
    }

    // Approval rate
    const approved = purchases.filter((p: any) => ["approved", "completed", "purchased", "redirected"].includes(p.status));
    const totalAttempts = purchases.filter((p: any) => ["approved", "completed", "purchased", "redirected", "pending", "refused"].includes(p.status));
    const approvalRate = totalAttempts.length > 0 ? (approved.length / totalAttempts.length) * 100 : 100;
    if (approvalRate < 60 && totalAttempts.length > 3) {
      newAlerts.push({
        id: "approval-low",
        level: "critical",
        message: `⚠️ APROVAÇÃO BAIXA: ${approvalRate.toFixed(0)}% (${approved.length}/${totalAttempts.length}). Verificar gateway.`,
      });
    }

    // Revenue comparison
    const todayRevenue = approved.reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0);
    const yesterdayApproved = purchasesYesterday.filter((p: any) => ["approved", "completed", "purchased", "redirected"].includes(p.status));
    const yesterdayRevenue = yesterdayApproved.reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0);
    if (yesterdayRevenue > 0 && todayRevenue < yesterdayRevenue * 0.5 && approved.length > 0) {
      newAlerts.push({
        id: "revenue-drop",
        level: "warning",
        message: `Receita hoje R$${todayRevenue.toFixed(0)} está ${Math.round(((yesterdayRevenue - todayRevenue) / yesterdayRevenue) * 100)}% menor que ontem (R$${yesterdayRevenue.toFixed(0)}).`,
      });
    }

    // Obstacle conversion opportunity
    const obstacleGroups: Record<string, { total: number; checkout: number }> = {};
    leads.forEach((l: any) => {
      const obstacle = (l.quiz_answers as any)?.obstacle;
      if (obstacle) {
        if (!obstacleGroups[obstacle]) obstacleGroups[obstacle] = { total: 0, checkout: 0 };
        obstacleGroups[obstacle].total++;
        if (l.checkout_clicked) obstacleGroups[obstacle].checkout++;
      }
    });
    const bestObstacle = Object.entries(obstacleGroups)
      .filter(([, v]) => v.total >= 3)
      .sort((a, b) => (b[1].checkout / b[1].total) - (a[1].checkout / a[1].total))[0];
    if (bestObstacle && bestObstacle[1].total >= 3) {
      const rate = ((bestObstacle[1].checkout / bestObstacle[1].total) * 100).toFixed(0);
      if (Number(rate) > 50) {
        newAlerts.push({
          id: "opportunity-obstacle",
          level: "opportunity",
          message: `✅ OPORTUNIDADE: Leads com obstáculo "${bestObstacle[0]}" têm ${rate}% de checkout (${bestObstacle[1].checkout}/${bestObstacle[1].total}). Criar criativo para essa dor.`,
        });
      }
    }

    // Upsell performance
    const UPSELL_NAMES: Record<string, string> = {
      acelerador_basico: "UP1", multiplicador_prata: "UP2", blindagem: "UP3",
      circulo_interno: "UP4", safety_pro: "UP5", forex_mentoria: "UP6",
    };
    const upsellStats: Record<string, { views: number; buys: number }> = {};
    upsellPurchases.forEach((p: any) => {
      const key = p.funnel_step;
      if (!key) return;
      const uKey = UPSELL_NAMES[key] || key;
      if (!upsellStats[uKey]) upsellStats[uKey] = { views: 0, buys: 0 };
      if (["approved", "completed", "purchased"].includes(p.status)) upsellStats[uKey].buys++;
    });

    // Funnel health score
    const introViews = stepCounts["step-1"]?.size || 0;
    const offerViews = stepCounts["step-17"]?.size || 0;
    const quizCompletionRate = introViews > 0 ? (offerViews / introViews) * 100 : 0;
    const icSessions = new Set(checkoutEvents.map((e: any) => e.session_id)).size;
    const checkoutRate = offerViews > 0 ? (icSessions / offerViews) * 100 : 0;
    const upsellBuys = Object.values(upsellStats).reduce((s, v) => s + v.buys, 0);
    const upsellRate = approved.length > 0 ? (upsellBuys / approved.length) * 100 : 0;

    // Revenue projection
    const currentHour = new Date().getHours();
    const hoursRemaining = Math.max(24 - currentHour, 1);
    const revenuePerHour = currentHour > 0 ? todayRevenue / currentHour : 0;
    const revenueProjection = todayRevenue + (revenuePerHour * hoursRemaining);

    // Funnel velocity (avg time from step-1 to purchase)
    const funnelVelocityMin = 0; // Would need session correlation

    const healthScore = Math.min(100, Math.round(
      (Math.min(quizCompletionRate, 40) / 40) * 25 +
      (Math.min(checkoutRate, 30) / 30) * 25 +
      (Math.min(approvalRate, 100) / 100) * 30 +
      (Math.min(upsellRate, 50) / 50) * 20
    ));

    setHealth({
      score: healthScore,
      quizCompletionRate,
      checkoutRate,
      approvalRate,
      upsellRate,
      revenueProjection,
      funnelVelocityMin,
    });
    setAlerts(newAlerts.sort((a, b) => {
      const order = { critical: 0, warning: 1, opportunity: 2 };
      return order[a.level] - order[b.level];
    }));
    setLoading(false);
  }, []);

  useEffect(() => {
    analyze();
    const interval = setInterval(analyze, 60000);
    return () => clearInterval(interval);
  }, [analyze]);

  const healthColor = health ? (health.score >= 70 ? "text-emerald-400" : health.score >= 40 ? "text-amber-400" : "text-red-400") : "text-[#888]";
  const healthBg = health ? (health.score >= 70 ? "from-emerald-500/10 to-emerald-600/5 border-emerald-500/20" : health.score >= 40 ? "from-amber-500/10 to-amber-600/5 border-amber-500/20" : "from-red-500/10 to-red-600/5 border-red-500/20") : "";

  return (
    <div className="space-y-3">
      {/* Health Score + Revenue Projection */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Funnel Health */}
        <div className={cn("rounded-2xl p-4 bg-gradient-to-br border", healthBg)}>
          <div className="flex items-center gap-2 mb-2">
            <Gauge className={cn("w-4 h-4", healthColor)} />
            <span className="text-xs font-medium text-[#888]">Saúde do Funil</span>
          </div>
          <p className={cn("text-3xl font-black tabular-nums", healthColor)}>{health?.score ?? "—"}<span className="text-sm font-normal text-[#666]">/100</span></p>
          {health && (
            <div className="mt-2 grid grid-cols-2 gap-1 text-[9px]">
              <span className="text-[#666]">Quiz: {health.quizCompletionRate.toFixed(0)}%</span>
              <span className="text-[#666]">CK: {health.checkoutRate.toFixed(0)}%</span>
              <span className="text-[#666]">Aprov: {health.approvalRate.toFixed(0)}%</span>
              <span className="text-[#666]">UP: {health.upsellRate.toFixed(0)}%</span>
            </div>
          )}
        </div>

        {/* Revenue Projection */}
        <div className="rounded-2xl p-4 bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a]">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-medium text-[#888]">Projeção Receita</span>
          </div>
          <p className="text-2xl font-bold text-white tabular-nums">R$ {health?.revenueProjection.toFixed(0) ?? "—"}</p>
          <p className="text-[9px] text-[#666] mt-1">Estimativa baseada no ritmo atual</p>
        </div>

        {/* Quiz Completion */}
        <div className="rounded-2xl p-4 bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a]">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-violet-400" />
            <span className="text-xs font-medium text-[#888]">Quiz Completion</span>
          </div>
          <p className="text-2xl font-bold text-white tabular-nums">{health?.quizCompletionRate.toFixed(1) ?? "0"}%</p>
          <p className="text-[9px] text-[#666] mt-1">Intro → Oferta Final</p>
        </div>

        {/* Funnel Velocity (actual) */}
        <div className="rounded-2xl p-4 bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a]">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-medium text-[#888]">Checkout Rate</span>
          </div>
          <p className="text-2xl font-bold text-white tabular-nums">{health?.checkoutRate.toFixed(1) ?? "0"}%</p>
          <p className="text-[9px] text-[#666] mt-1">Oferta → Checkout</p>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="rounded-2xl bg-gradient-to-br from-red-950/30 to-[#0d0d0d] border border-red-500/20 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <h3 className="text-sm font-semibold text-white">🚨 Alertas IA</h3>
            <span className="text-[10px] text-[#666] ml-auto">{alerts.length} alertas</span>
            <button onClick={analyze} className="w-6 h-6 rounded flex items-center justify-center text-[#555]">
              <RefreshCw className={cn("w-3 h-3", loading && "animate-spin")} />
            </button>
          </div>
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {alerts.map(alert => (
              <div key={alert.id} className={cn(
                "p-3 rounded-xl border text-xs",
                alert.level === "critical" && "bg-red-500/10 border-red-500/30",
                alert.level === "warning" && "bg-amber-500/10 border-amber-500/30",
                alert.level === "opportunity" && "bg-emerald-500/10 border-emerald-500/30",
              )}>
                <p className={cn(
                  "font-medium",
                  alert.level === "critical" && "text-red-300",
                  alert.level === "warning" && "text-amber-300",
                  alert.level === "opportunity" && "text-emerald-300",
                )}>{alert.message}</p>
                {alert.detail && <p className="text-[#888] mt-1 text-[10px]">{alert.detail}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
