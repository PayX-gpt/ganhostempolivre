import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { DollarSign, MousePointerClick, ShoppingCart, TrendingUp, Users, BarChart3, RefreshCw, AlertTriangle } from "lucide-react";

type PlanKey = "starter" | "essencial" | "profissional" | "vip";

interface PlanMetrics {
  plan: PlanKey;
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

const PLAN_ORDER: PlanKey[] = ["starter", "essencial", "profissional", "vip"];
const PLAN_LABELS: Record<PlanKey, string> = {
  starter: "Starter (R$37)",
  essencial: "Essencial (R$47)",
  profissional: "Profissional (R$97)",
  vip: "VIP (R$197)",
};
const PLAN_PRICES: Record<PlanKey, number> = { starter: 37, essencial: 47, profissional: 97, vip: 197 };

export default function LivePricingMonitor() {
  const [metrics, setMetrics] = useState<PlanMetrics[]>([]);
  const [profiles, setProfiles] = useState<LeadProfile[]>([]);
  const [planProfiles, setPlanProfiles] = useState<Record<PlanKey, LeadProfile[]>>({
    starter: [], essencial: [], profissional: [], vip: [],
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [orphanCount, setOrphanCount] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const dayStart = getTodayBRT();

      // 1. Fetch clicks from /oferta only
      const clickEvents = await fetchAllPaged("funnel_events", "session_id, event_data, page_url", (q) =>
        q.eq("event_name", "checkout_click").gte("created_at", dayStart).like("page_url", "%/oferta%")
      );

      // 2. Fetch ICs
      const icEvents = await fetchAllPaged("funnel_events", "session_id, event_data, page_url", (q) =>
        q.eq("event_name", "capi_ic_sent").gte("created_at", dayStart)
      );

      // 3. Fetch ALL front sales (approved)
      const allPurchases = await fetchAllPaged("purchase_tracking",
        "id, transaction_id, session_id, amount, status, funnel_step, email, buyer_name",
        (q) => q.gte("created_at", dayStart).eq("status", "approved")
      );

      const frontSales = allPurchases.filter((p: any) => p.funnel_step?.startsWith("front"));

      // 4. Resolve orphan sessions via email fallback
      const orphanEmails = frontSales
        .filter((p: any) => !p.session_id && p.email)
        .map((p: any) => p.email.toLowerCase().trim());

      let emailSessionMap = new Map<string, string>();
      if (orphanEmails.length > 0) {
        const uniqueEmails = [...new Set(orphanEmails)];
        for (let i = 0; i < uniqueEmails.length; i += 50) {
          const chunk = uniqueEmails.slice(i, i + 50);
          const { data } = await supabase.from("email_session_map")
            .select("email, session_id").in("email", chunk);
          data?.forEach((r: any) => emailSessionMap.set(r.email.toLowerCase().trim(), r.session_id));
        }
      }

      // 5. Build click plan map (unique per session, last click wins)
      const sessionPlanMap = new Map<string, PlanKey>();
      clickEvents.forEach((e: any) => {
        const plan = resolveEventPlan(e.event_data);
        if (plan && !sessionPlanMap.has(e.session_id)) {
          sessionPlanMap.set(e.session_id, plan);
        }
      });

      // 6. Aggregate
      const planClicks: Record<PlanKey, Set<string>> = { starter: new Set(), essencial: new Set(), profissional: new Set(), vip: new Set() };
      const planICs: Record<PlanKey, Set<string>> = { starter: new Set(), essencial: new Set(), profissional: new Set(), vip: new Set() };
      const planSalesCount: Record<PlanKey, number> = { starter: 0, essencial: 0, profissional: 0, vip: 0 };
      const planRevenueSum: Record<PlanKey, number> = { starter: 0, essencial: 0, profissional: 0, vip: 0 };
      const ageGlobal = new Map<string, { count: number; sales: number; revenue: number }>();
      const ageByPlan: Record<PlanKey, Map<string, { count: number; sales: number; revenue: number }>> = {
        starter: new Map(), essencial: new Map(), profissional: new Map(), vip: new Map(),
      };

      // Clicks
      sessionPlanMap.forEach((plan, sid) => planClicks[plan].add(sid));

      // ICs — use explicit plan or fallback to click plan
      icEvents.forEach((e: any) => {
        const plan = resolveEventPlan(e.event_data) || sessionPlanMap.get(e.session_id) || null;
        if (plan) planICs[plan].add(e.session_id);
      });

      // Sales — use funnel_step as source of truth
      const countedTx = new Set<string>();
      let orphans = 0;

      // Collect all sessions we need quiz data for
      const sessionsForQuiz = new Set<string>();

      frontSales.forEach((p: any) => {
        const txKey = p.transaction_id || p.id;
        if (countedTx.has(txKey)) return;
        countedTx.add(txKey);

        const plan = resolveFunnelStep(p.funnel_step, p.amount);
        if (!plan) return;

        planSalesCount[plan]++;
        planRevenueSum[plan] += Number(p.amount) || 0;

        // Resolve session
        let sessionId = p.session_id;
        if (!sessionId && p.email) {
          sessionId = emailSessionMap.get(p.email.toLowerCase().trim()) || null;
        }
        if (!sessionId) {
          orphans++;
        } else {
          sessionsForQuiz.add(sessionId);
        }
      });

      setOrphanCount(orphans);

      // Fetch quiz answers for buyer sessions
      const quizMap = new Map<string, Record<string, unknown>>();
      const sessionArr = Array.from(sessionsForQuiz);
      for (let i = 0; i < sessionArr.length; i += 500) {
        const chunk = sessionArr.slice(i, i + 500);
        const { data } = await supabase.from("lead_behavior")
          .select("session_id, quiz_answers").in("session_id", chunk);
        data?.forEach((b: any) => {
          if (b.quiz_answers && typeof b.quiz_answers === "object" && Object.keys(b.quiz_answers).length > 0) {
            quizMap.set(b.session_id, b.quiz_answers);
          }
        });
      }

      // Build age profiles
      frontSales.forEach((p: any) => {
        const txKey = p.transaction_id || p.id;
        // Already counted uniqueness above, just build profiles
        const plan = resolveFunnelStep(p.funnel_step, p.amount);
        if (!plan) return;

        let sessionId = p.session_id;
        if (!sessionId && p.email) {
          sessionId = emailSessionMap.get(p.email.toLowerCase().trim()) || null;
        }

        const qa = sessionId ? quizMap.get(sessionId) : null;
        const age = (qa?.age as string) || null;
        // Skip N/D — only count if we have real age data
        if (!age) return;

        const update = (map: Map<string, { count: number; sales: number; revenue: number }>) => {
          const existing = map.get(age) || { count: 0, sales: 0, revenue: 0 };
          existing.count++;
          existing.sales++;
          existing.revenue += Number(p.amount) || 0;
          map.set(age, existing);
        };

        update(ageGlobal);
        update(ageByPlan[plan]);
      });

      // Build metrics
      const metricsArr: PlanMetrics[] = PLAN_ORDER.map((plan) => {
        const clicks = planClicks[plan].size;
        const ics = planICs[plan].size;
        const sales = planSalesCount[plan];
        const revenue = planRevenueSum[plan];
        return {
          plan, clicks, ics, sales, revenue,
          convRate: clicks > 0 ? (sales / clicks) * 100 : 0,
          icRate: clicks > 0 ? (ics / clicks) * 100 : 0,
          avgTicket: sales > 0 ? revenue / sales : PLAN_PRICES[plan],
        };
      });

      const profilesArr: LeadProfile[] = Array.from(ageGlobal.entries())
        .map(([age, data]) => ({ age, ...data }))
        .sort((a, b) => b.count - a.count);

      const planProfilesObj = PLAN_ORDER.reduce<Record<PlanKey, LeadProfile[]>>((acc, plan) => {
        acc[plan] = Array.from(ageByPlan[plan].entries())
          .map(([age, data]) => ({ age, ...data }))
          .sort((a, b) => b.count - a.count);
        return acc;
      }, { starter: [], essencial: [], profissional: [], vip: [] });

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
  const bestPlan = metrics.reduce<PlanMetrics | null>((best, m) => {
    if (m.clicks === 0 || m.sales === 0) return best;
    if (!best || m.convRate > best.convRate) return m;
    return best;
  }, null);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a] p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Monitor de Preços — Página /oferta</h3>
              <p className="text-[10px] text-[#666]">Sessões únicas • Vendas aprovadas via webhook</p>
            </div>
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

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <SummaryCard icon={MousePointerClick} label="Cliques Únicos" value={totalClicks} color="text-blue-400" />
          <SummaryCard icon={ShoppingCart} label="Vendas Front" value={totalSales} color="text-emerald-400" />
          <SummaryCard icon={DollarSign} label="Receita Front" value={`R$${totalRevenue.toFixed(0)}`} color="text-amber-400" />
          <SummaryCard icon={TrendingUp} label="Melhor Conv." value={bestPlan ? PLAN_LABELS[bestPlan.plan].split(" ")[0] : "—"} color="text-violet-400" />
        </div>

        {orphanCount > 0 && (
          <div className="flex items-center gap-2 mb-3 px-2 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span className="text-[10px] text-amber-400">{orphanCount} vendas sem sessão identificada (contabilizadas por funnel_step)</span>
          </div>
        )}

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
                const isBest = bestPlan?.plan === m.plan;
                return (
                  <tr key={m.plan} className={`border-b border-[#1a1a1a] ${isBest ? "bg-emerald-500/5" : ""}`}>
                    <td className="py-2.5 px-2">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{PLAN_LABELS[m.plan]}</span>
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
              {/* Total row */}
              <tr className="border-t border-[#333]">
                <td className="py-2.5 px-2 text-[#888] font-semibold">Total</td>
                <td className="text-right py-2.5 px-2 text-white font-semibold tabular-nums">{totalClicks}</td>
                <td className="text-right py-2.5 px-2 text-white font-semibold tabular-nums">{metrics.reduce((s, m) => s + m.ics, 0)}</td>
                <td className="text-right py-2.5 px-2 text-emerald-400 font-bold tabular-nums">{totalSales}</td>
                <td className="text-right py-2.5 px-2 text-amber-400 font-bold tabular-nums">R${totalRevenue.toFixed(0)}</td>
                <td className="text-right py-2.5 px-2 text-white font-semibold tabular-nums">
                  {totalClicks > 0 ? ((totalSales / totalClicks) * 100).toFixed(1) : "0.0"}%
                </td>
                <td className="text-right py-2.5 px-2 text-[#aaa] tabular-nums">—</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Buyer profile — only real data, no N/D */}
      {profiles.length > 0 && (
        <div className="rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a] p-4">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-violet-400" />
            <h3 className="text-sm font-bold text-white">Perfil do Comprador por Plano</h3>
          </div>

          <div className="mb-4">
            <p className="text-xs text-[#888] mb-2">Distribuição por faixa etária (compradores com dados)</p>
            <div className="flex flex-wrap gap-2">
              {profiles.map((p) => (
                <div key={p.age} className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-2 text-center">
                  <div className="text-xs text-white font-semibold">{p.age}</div>
                  <div className="text-[10px] text-[#888]">{p.count} vendas</div>
                  <div className="text-[10px] text-amber-400">R${p.revenue.toFixed(0)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PLAN_ORDER.map((plan) => {
              const entries = planProfiles[plan] || [];
              if (entries.length === 0) return null;
              return (
                <div key={plan} className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl p-3">
                  <p className="text-xs font-semibold text-white mb-2">{PLAN_LABELS[plan]}</p>
                  <div className="space-y-1.5">
                    {entries.map((profile) => (
                      <div key={profile.age} className="flex items-center justify-between text-xs">
                        <span className="text-[#aaa]">{profile.age}</span>
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

// ── Helpers ──

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

function getTodayBRT(): string {
  const sp = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
  return `${sp.getFullYear()}-${String(sp.getMonth() + 1).padStart(2, "0")}-${String(sp.getDate()).padStart(2, "0")}T00:00:00-03:00`;
}

async function fetchAllPaged(table: "funnel_events" | "purchase_tracking" | "lead_behavior", select: string, configure: (q: any) => any): Promise<any[]> {
  const PAGE = 1000;
  const rows: any[] = [];
  let page = 0;
  while (true) {
    const q = configure(supabase.from(table).select(select));
    const { data, error } = await q.range(page * PAGE, (page + 1) * PAGE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < PAGE) break;
    page++;
  }
  return rows;
}

function resolveEventPlan(eventData: any): PlanKey | null {
  if (!eventData) return null;
  const plan = typeof eventData.plan === "string" ? normalizePlan(eventData.plan) : null;
  if (plan) return plan;
  const amount = Number(eventData.amount);
  return Number.isFinite(amount) ? exactAmountToPlan(amount) : null;
}

function resolveFunnelStep(step: string | null, amount: number | null): PlanKey | null {
  switch (step) {
    case "front_37": return "starter";
    case "front_47": return "essencial";
    case "front_97": return "profissional";
    case "front_197": return "vip";
    case "front_66": return null; // standby — not active, ignore
    default: return step?.startsWith("front") ? (exactAmountToPlan(amount) || "essencial") : null;
  }
}

function exactAmountToPlan(amount: number | null | undefined): PlanKey | null {
  if (amount == null) return null;
  if (Math.abs(amount - 37) < 1) return "starter";
  if (Math.abs(amount - 47) < 1) return "essencial";
  if (Math.abs(amount - 66.83) < 1) return "profissional"; // dynamic pricing tier
  if (Math.abs(amount - 97) < 1) return "profissional";
  if (Math.abs(amount - 197) < 1) return "vip";
  return null;
}

function normalizePlan(value: string): PlanKey | null {
  if ((["starter", "essencial", "profissional", "vip"] as PlanKey[]).includes(value as PlanKey)) {
    return value as PlanKey;
  }
  return null;
}
