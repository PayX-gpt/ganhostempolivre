import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { DollarSign, MousePointerClick, ShoppingCart, TrendingUp, Users, BarChart3, RefreshCw } from "lucide-react";

interface PlanMetrics {
  plan: string;
  clicks: number;
  ics: number;
  sales: number;
  revenue: number;
  convRate: number;
  icRate: number;
  avgTicket: number;
}

interface LeadProfile {
  age: string;
  count: number;
  sales: number;
  revenue: number;
}

const PLAN_ORDER = ["starter", "essencial", "profissional", "vip"];
const PLAN_LABELS: Record<string, string> = {
  starter: "Starter (R$37)",
  essencial: "Essencial (R$47)",
  profissional: "Profissional (R$97)",
  vip: "VIP (R$197)",
};
const PLAN_PRICES: Record<string, number> = { starter: 37, essencial: 47, profissional: 97, vip: 197 };

export default function LivePricingMonitor() {
  const [metrics, setMetrics] = useState<PlanMetrics[]>([]);
  const [profiles, setProfiles] = useState<LeadProfile[]>([]);
  const [planProfiles, setPlanProfiles] = useState<Record<string, LeadProfile[]>>({});
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchData = useCallback(async () => {
    try {
      const todayStart = new Date();
      todayStart.setHours(todayStart.getHours() - todayStart.getTimezoneOffset() / 60 - 3); // BRT
      const dateStr = todayStart.toISOString().slice(0, 10);
      const dayStart = `${dateStr}T00:00:00-03:00`;

      // Fetch checkout clicks ONLY from /oferta page (exclude quiz step-17 dynamic pricing)
      const { data: clickEvents } = await supabase
        .from("funnel_events")
        .select("session_id, event_data, created_at, page_url")
        .eq("event_name", "checkout_click")
        .gte("created_at", dayStart)
        .like("page_url", "%/oferta%")
        .order("created_at", { ascending: false });

      // Fetch IC events
      const { data: icEvents } = await supabase
        .from("funnel_events")
        .select("session_id, event_data, created_at")
        .eq("event_name", "capi_ic_sent")
        .gte("created_at", dayStart);

      // Fetch purchases
      const { data: purchases } = await supabase
        .from("purchase_tracking")
        .select("session_id, plan_id, amount, status, funnel_step, email, created_at")
        .gte("created_at", dayStart)
        .eq("status", "approved");

      // Fetch lead behaviors for profile correlation
      const sessionIds = new Set<string>();
      clickEvents?.forEach(e => sessionIds.add(e.session_id));
      icEvents?.forEach(e => sessionIds.add(e.session_id));
      purchases?.forEach(p => { if (p.session_id) sessionIds.add(p.session_id); });

      const { data: behaviors } = await supabase
        .from("lead_behavior")
        .select("session_id, quiz_answers")
        .in("session_id", Array.from(sessionIds).slice(0, 500));

      const behaviorMap = new Map<string, Record<string, unknown>>();
      behaviors?.forEach(b => {
        if (b.quiz_answers && typeof b.quiz_answers === "object") {
          behaviorMap.set(b.session_id, b.quiz_answers as Record<string, unknown>);
        }
      });

      // Aggregate per plan
      const planClickSessions: Record<string, Set<string>> = {};
      const planICSessions: Record<string, Set<string>> = {};
      const planSales: Record<string, number> = {};
      const planRevenue: Record<string, number> = {};

      PLAN_ORDER.forEach(p => {
        planClickSessions[p] = new Set();
        planICSessions[p] = new Set();
        planSales[p] = 0;
        planRevenue[p] = 0;
      });

      // Map clicks to plans
      clickEvents?.forEach(e => {
        const data = e.event_data as Record<string, unknown> | null;
        const plan = (data?.plan as string) || inferPlanFromAmount(data?.amount as number);
        if (plan && planClickSessions[plan]) {
          planClickSessions[plan].add(e.session_id);
        }
      });

      // Map ICs to plans
      icEvents?.forEach(e => {
        const data = e.event_data as Record<string, unknown> | null;
        const plan = (data?.plan as string) || inferPlanFromAmount(data?.amount as number);
        if (plan && planICSessions[plan]) {
          planICSessions[plan].add(e.session_id);
        }
      });

      // Map purchases to plans
      const planBuyerProfiles: Record<string, LeadProfile[]> = {};
      PLAN_ORDER.forEach(p => { planBuyerProfiles[p] = []; });

      purchases?.forEach(p => {
        if (p.funnel_step && p.funnel_step.startsWith("front")) {
          const plan = p.plan_id || inferPlanFromAmount(p.amount || 0);
          if (plan && planSales[plan] !== undefined) {
            planSales[plan]++;
            planRevenue[plan] += p.amount || 0;
          }
        }
      });

      // Build metrics
      const totalClicks = Object.values(planClickSessions).reduce((s, set) => s + set.size, 0);
      const metricsArr: PlanMetrics[] = PLAN_ORDER.map(plan => {
        const clicks = planClickSessions[plan].size;
        const ics = planICSessions[plan].size;
        const sales = planSales[plan];
        const revenue = planRevenue[plan];
        return {
          plan,
          clicks,
          ics,
          sales,
          revenue,
          convRate: clicks > 0 ? (sales / clicks) * 100 : 0,
          icRate: clicks > 0 ? (ics / clicks) * 100 : 0,
          avgTicket: sales > 0 ? revenue / sales : PLAN_PRICES[plan],
        };
      });

      // Build age profiles for buyers
      const ageMap = new Map<string, { count: number; sales: number; revenue: number }>();
      const planAgeMap: Record<string, Map<string, { count: number; sales: number; revenue: number }>> = {};
      PLAN_ORDER.forEach(p => { planAgeMap[p] = new Map(); });

      purchases?.forEach(p => {
        if (p.status === "approved" && p.funnel_step?.startsWith("front") && p.session_id) {
          const qa = behaviorMap.get(p.session_id);
          const age = (qa?.age as string) || "unknown";
          const plan = p.plan_id || inferPlanFromAmount(p.amount || 0);

          // Global
          const existing = ageMap.get(age) || { count: 0, sales: 0, revenue: 0 };
          existing.count++;
          existing.sales++;
          existing.revenue += p.amount || 0;
          ageMap.set(age, existing);

          // Per plan
          if (plan && planAgeMap[plan]) {
            const ex = planAgeMap[plan].get(age) || { count: 0, sales: 0, revenue: 0 };
            ex.count++;
            ex.sales++;
            ex.revenue += p.amount || 0;
            planAgeMap[plan].set(age, ex);
          }
        }
      });

      const profilesArr: LeadProfile[] = Array.from(ageMap.entries())
        .map(([age, data]) => ({ age, ...data }))
        .sort((a, b) => b.count - a.count);

      const planProfilesObj: Record<string, LeadProfile[]> = {};
      PLAN_ORDER.forEach(plan => {
        planProfilesObj[plan] = Array.from(planAgeMap[plan].entries())
          .map(([age, data]) => ({ age, ...data }))
          .sort((a, b) => b.count - a.count);
      });

      setMetrics(metricsArr);
      setProfiles(profilesArr);
      setPlanProfiles(planProfilesObj);
      setLastUpdate(new Date());
    } catch (err) {
      console.error("LivePricingMonitor fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const totalClicks = metrics.reduce((s, m) => s + m.clicks, 0);
  const totalSales = metrics.reduce((s, m) => s + m.sales, 0);
  const totalRevenue = metrics.reduce((s, m) => s + m.revenue, 0);
  const bestPlan = metrics.reduce((best, m) => m.convRate > (best?.convRate || 0) ? m : best, metrics[0]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a] p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Monitor de Preços — Página /oferta</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#666]">
              {lastUpdate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </span>
            <button onClick={fetchData} className="p-1.5 rounded-lg bg-[#0d0d0d] border border-[#2a2a2a] hover:bg-[#1a1a1a]">
              <RefreshCw className={`w-3 h-3 text-[#888] ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <SummaryCard icon={MousePointerClick} label="Cliques Hoje" value={totalClicks} color="text-blue-400" />
          <SummaryCard icon={ShoppingCart} label="Vendas Hoje" value={totalSales} color="text-emerald-400" />
          <SummaryCard icon={DollarSign} label="Receita" value={`R$${totalRevenue.toFixed(0)}`} color="text-amber-400" />
          <SummaryCard icon={TrendingUp} label="Melhor Conv." value={bestPlan ? `${PLAN_LABELS[bestPlan.plan]?.split(" ")[0] || bestPlan.plan}` : "—"} color="text-violet-400" />
        </div>

        {/* Per-plan table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[#888] border-b border-[#2a2a2a]">
                <th className="text-left py-2 px-2 font-medium">Plano</th>
                <th className="text-right py-2 px-2 font-medium">Cliques</th>
                <th className="text-right py-2 px-2 font-medium">ICs</th>
                <th className="text-right py-2 px-2 font-medium">Vendas</th>
                <th className="text-right py-2 px-2 font-medium">Receita</th>
                <th className="text-right py-2 px-2 font-medium">Conv %</th>
                <th className="text-right py-2 px-2 font-medium">IC %</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((m) => {
                const isBest = bestPlan && m.plan === bestPlan.plan && m.sales > 0;
                return (
                  <tr key={m.plan} className={`border-b border-[#1a1a1a] ${isBest ? "bg-emerald-500/5" : ""}`}>
                    <td className="py-2.5 px-2">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{PLAN_LABELS[m.plan] || m.plan}</span>
                        {isBest && <Badge className="text-[9px] bg-emerald-500/20 text-emerald-400 border-0">Melhor</Badge>}
                      </div>
                    </td>
                    <td className="text-right py-2.5 px-2 text-white tabular-nums">{m.clicks}</td>
                    <td className="text-right py-2.5 px-2 text-white tabular-nums">{m.ics}</td>
                    <td className="text-right py-2.5 px-2 text-emerald-400 font-semibold tabular-nums">{m.sales}</td>
                    <td className="text-right py-2.5 px-2 text-amber-400 font-semibold tabular-nums">R${m.revenue.toFixed(0)}</td>
                    <td className="text-right py-2.5 px-2">
                      <span className={`tabular-nums font-semibold ${m.convRate > 5 ? "text-emerald-400" : m.convRate > 0 ? "text-amber-400" : "text-[#666]"}`}>
                        {m.convRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="text-right py-2.5 px-2 text-[#aaa] tabular-nums">{m.icRate.toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Buyer profile per plan */}
      {profiles.length > 0 && (
        <div className="rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a] p-4">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-violet-400" />
            <h3 className="text-sm font-bold text-white">Perfil do Comprador por Plano</h3>
          </div>

          {/* Global age distribution */}
          <div className="mb-4">
            <p className="text-xs text-[#888] mb-2">Distribuição por faixa etária (compradores)</p>
            <div className="flex flex-wrap gap-2">
              {profiles.map(p => (
                <div key={p.age} className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-2 text-center">
                  <div className="text-xs text-white font-semibold">{p.age === "unknown" ? "N/D" : p.age}</div>
                  <div className="text-[10px] text-[#888]">{p.count} vendas</div>
                  <div className="text-[10px] text-amber-400">R${p.revenue.toFixed(0)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Per-plan breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PLAN_ORDER.map(plan => {
              const pp = planProfiles[plan] || [];
              if (pp.length === 0) return null;
              return (
                <div key={plan} className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl p-3">
                  <p className="text-xs font-semibold text-white mb-2">{PLAN_LABELS[plan]}</p>
                  <div className="space-y-1.5">
                    {pp.map(profile => (
                      <div key={profile.age} className="flex items-center justify-between text-xs">
                        <span className="text-[#aaa]">{profile.age === "unknown" ? "N/D" : profile.age}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-white tabular-nums">{profile.count}x</span>
                          <span className="text-amber-400 tabular-nums">R${profile.revenue.toFixed(0)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, color }: { icon: typeof DollarSign; label: string; value: string | number; color: string }) {
  return (
    <div className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className={`w-3.5 h-3.5 ${color}`} />
        <span className="text-[10px] text-[#888]">{label}</span>
      </div>
      <span className="text-lg font-bold text-white tabular-nums">{value}</span>
    </div>
  );
}

function inferPlanFromAmount(amount: number | undefined | null): string {
  if (!amount) return "starter";
  if (amount <= 40) return "starter";
  if (amount <= 50) return "essencial";
  if (amount <= 100) return "profissional";
  return "vip";
}
