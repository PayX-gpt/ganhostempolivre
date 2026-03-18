import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { DollarSign, MousePointerClick, ShoppingCart, TrendingUp, Users, BarChart3, RefreshCw } from "lucide-react";

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

interface FunnelEventRow {
  session_id: string;
  event_data: Record<string, unknown> | null;
  created_at: string;
  page_url: string | null;
}

interface PurchaseRow {
  id: string;
  transaction_id: string | null;
  session_id: string | null;
  amount: number | null;
  status: string | null;
  funnel_step: string | null;
  email: string | null;
  created_at: string;
}

interface LeadBehaviorRow {
  session_id: string;
  quiz_answers: Record<string, unknown> | null;
}

const PLAN_ORDER: PlanKey[] = ["starter", "essencial", "profissional", "vip"];
const PLAN_LABELS: Record<PlanKey, string> = {
  starter: "Starter (R$37)",
  essencial: "Essencial (R$47)",
  profissional: "Profissional (R$97)",
  vip: "VIP (R$197)",
};
const PLAN_PRICES: Record<PlanKey, number> = { starter: 37, essencial: 47, profissional: 97, vip: 197 };
const QUERY_PAGE_SIZE = 1000;
const SESSION_CHUNK_SIZE = 500;

export default function LivePricingMonitor() {
  const [metrics, setMetrics] = useState<PlanMetrics[]>([]);
  const [profiles, setProfiles] = useState<LeadProfile[]>([]);
  const [planProfiles, setPlanProfiles] = useState<Record<PlanKey, LeadProfile[]>>({
    starter: [],
    essencial: [],
    profissional: [],
    vip: [],
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchData = useCallback(async () => {
    setLoading(true);

    try {
      const dayStart = getTodayStartInSaoPaulo();

      const [clickEvents, icEventsRaw, purchases] = await Promise.all([
        fetchAllRows<FunnelEventRow>("funnel_events", "session_id, event_data, created_at, page_url", (query) =>
          query
            .eq("event_name", "checkout_click")
            .gte("created_at", dayStart)
            .like("page_url", "%/oferta%")
            .order("created_at", { ascending: false })
        ),
        fetchAllRows<FunnelEventRow>("funnel_events", "session_id, event_data, created_at, page_url", (query) =>
          query
            .eq("event_name", "capi_ic_sent")
            .gte("created_at", dayStart)
            .order("created_at", { ascending: false })
        ),
        fetchAllRows<PurchaseRow>("purchase_tracking", "id, transaction_id, session_id, amount, status, funnel_step, email, created_at", (query) =>
          query
            .gte("created_at", dayStart)
            .eq("status", "approved")
            .order("created_at", { ascending: false })
        ),
      ]);

      const latestClickPlanBySession = new Map<string, PlanKey>();
      clickEvents.forEach((event) => {
        const plan = resolveEventPlan(event);
        if (plan && !latestClickPlanBySession.has(event.session_id)) {
          latestClickPlanBySession.set(event.session_id, plan);
        }
      });

      const sessionIds = new Set<string>(latestClickPlanBySession.keys());
      purchases.forEach((purchase) => {
        if (purchase.session_id) sessionIds.add(purchase.session_id);
      });

      const behaviors = await fetchLeadBehaviors(Array.from(sessionIds));
      const behaviorMap = new Map<string, Record<string, unknown>>();
      behaviors.forEach((behavior) => {
        if (behavior.quiz_answers && typeof behavior.quiz_answers === "object") {
          behaviorMap.set(behavior.session_id, behavior.quiz_answers);
        }
      });

      const planClickSessions = createPlanSessionMap();
      const planICSessions = createPlanSessionMap();
      const planSales = createPlanNumberMap();
      const planRevenue = createPlanNumberMap();
      const ageMap = new Map<string, { count: number; sales: number; revenue: number }>();
      const planAgeMap = createPlanAgeMap();

      latestClickPlanBySession.forEach((plan, sessionId) => {
        planClickSessions[plan].add(sessionId);
      });

      icEventsRaw.forEach((event) => {
        const plan = resolveEventPlan(event) || latestClickPlanBySession.get(event.session_id) || null;
        if (plan) {
          planICSessions[plan].add(event.session_id);
        }
      });

      const countedSales = new Set<string>();
      purchases.forEach((purchase) => {
        const plan = resolvePurchasePlan(purchase) || (purchase.session_id ? latestClickPlanBySession.get(purchase.session_id) || null : null);
        if (!plan) return;

        const saleKey = purchase.transaction_id || purchase.id;
        if (countedSales.has(saleKey)) return;
        countedSales.add(saleKey);

        planSales[plan] += 1;
        planRevenue[plan] += Number(purchase.amount) || 0;

        if (!purchase.session_id) return;

        const quizAnswers = behaviorMap.get(purchase.session_id);
        const age = (quizAnswers?.age as string) || "unknown";
        const globalAge = ageMap.get(age) || { count: 0, sales: 0, revenue: 0 };
        globalAge.count += 1;
        globalAge.sales += 1;
        globalAge.revenue += Number(purchase.amount) || 0;
        ageMap.set(age, globalAge);

        const planAge = planAgeMap[plan].get(age) || { count: 0, sales: 0, revenue: 0 };
        planAge.count += 1;
        planAge.sales += 1;
        planAge.revenue += Number(purchase.amount) || 0;
        planAgeMap[plan].set(age, planAge);
      });

      const metricsArr: PlanMetrics[] = PLAN_ORDER.map((plan) => {
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

      const profilesArr: LeadProfile[] = Array.from(ageMap.entries())
        .map(([age, data]) => ({ age, ...data }))
        .sort((a, b) => b.count - a.count);

      const planProfilesObj = PLAN_ORDER.reduce<Record<PlanKey, LeadProfile[]>>((acc, plan) => {
        acc[plan] = Array.from(planAgeMap[plan].entries())
          .map(([age, data]) => ({ age, ...data }))
          .sort((a, b) => b.count - a.count);
        return acc;
      }, {
        starter: [],
        essencial: [],
        profissional: [],
        vip: [],
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

  const totalClicks = metrics.reduce((sum, metric) => sum + metric.clicks, 0);
  const totalSales = metrics.reduce((sum, metric) => sum + metric.sales, 0);
  const totalRevenue = metrics.reduce((sum, metric) => sum + metric.revenue, 0);
  const bestPlan = metrics.reduce<PlanMetrics | null>((best, metric) => {
    if (metric.clicks === 0 || metric.sales === 0) return best;
    if (!best || metric.convRate > best.convRate) return metric;
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
              <p className="text-[10px] text-[#666]">Sessões únicas por plano + vendas aprovadas reais</p>
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
          <SummaryCard icon={DollarSign} label="Receita" value={`R$${totalRevenue.toFixed(0)}`} color="text-amber-400" />
          <SummaryCard icon={TrendingUp} label="Melhor Conv." value={bestPlan ? `${PLAN_LABELS[bestPlan.plan].split(" ")[0]}` : "—"} color="text-violet-400" />
        </div>

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
              {metrics.map((metric) => {
                const isBest = bestPlan?.plan === metric.plan;
                return (
                  <tr key={metric.plan} className={`border-b border-[#1a1a1a] ${isBest ? "bg-emerald-500/5" : ""}`}>
                    <td className="py-2.5 px-2">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{PLAN_LABELS[metric.plan]}</span>
                        {isBest && <Badge className="text-[9px] bg-emerald-500/20 text-emerald-400 border-0">Melhor</Badge>}
                      </div>
                    </td>
                    <td className="text-right py-2.5 px-2 text-white tabular-nums">{metric.clicks}</td>
                    <td className="text-right py-2.5 px-2 text-white tabular-nums">{metric.ics}</td>
                    <td className="text-right py-2.5 px-2 text-emerald-400 font-semibold tabular-nums">{metric.sales}</td>
                    <td className="text-right py-2.5 px-2 text-amber-400 font-semibold tabular-nums">R${metric.revenue.toFixed(0)}</td>
                    <td className="text-right py-2.5 px-2">
                      <span className={`tabular-nums font-semibold ${metric.convRate > 5 ? "text-emerald-400" : metric.convRate > 0 ? "text-amber-400" : "text-[#666]"}`}>
                        {metric.convRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="text-right py-2.5 px-2 text-[#aaa] tabular-nums">{metric.icRate.toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {profiles.length > 0 && (
        <div className="rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a] p-4">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-violet-400" />
            <h3 className="text-sm font-bold text-white">Perfil do Comprador por Plano</h3>
          </div>

          <div className="mb-4">
            <p className="text-xs text-[#888] mb-2">Distribuição por faixa etária (compradores)</p>
            <div className="flex flex-wrap gap-2">
              {profiles.map((profile) => (
                <div key={profile.age} className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-2 text-center">
                  <div className="text-xs text-white font-semibold">{profile.age === "unknown" ? "N/D" : profile.age}</div>
                  <div className="text-[10px] text-[#888]">{profile.count} vendas</div>
                  <div className="text-[10px] text-amber-400">R${profile.revenue.toFixed(0)}</div>
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

function getTodayStartInSaoPaulo() {
  const nowInSaoPaulo = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
  const year = nowInSaoPaulo.getFullYear();
  const month = String(nowInSaoPaulo.getMonth() + 1).padStart(2, "0");
  const day = String(nowInSaoPaulo.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}T00:00:00-03:00`;
}

async function fetchAllRows<T>(
  table: "funnel_events" | "purchase_tracking" | "lead_behavior",
  select: string,
  configure: (query: ReturnType<typeof supabase.from>) => unknown,
): Promise<T[]> {
  const rows: T[] = [];
  let page = 0;

  while (true) {
    const query = configure(supabase.from(table).select(select) as ReturnType<typeof supabase.from>) as {
      range: (from: number, to: number) => Promise<{ data: T[] | null; error: Error | null }>;
    };
    const { data, error } = await query.range(page * QUERY_PAGE_SIZE, (page + 1) * QUERY_PAGE_SIZE - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;

    rows.push(...data);
    if (data.length < QUERY_PAGE_SIZE) break;
    page += 1;
  }

  return rows;
}

async function fetchLeadBehaviors(sessionIds: string[]) {
  if (sessionIds.length === 0) return [];

  const chunks = chunkArray(sessionIds, SESSION_CHUNK_SIZE);
  const results = await Promise.all(
    chunks.map(async (chunk) => {
      const { data, error } = await supabase
        .from("lead_behavior")
        .select("session_id, quiz_answers")
        .in("session_id", chunk);

      if (error) throw error;
      return (data || []) as LeadBehaviorRow[];
    })
  );

  return results.flat();
}

function createPlanSessionMap() {
  return {
    starter: new Set<string>(),
    essencial: new Set<string>(),
    profissional: new Set<string>(),
    vip: new Set<string>(),
  } satisfies Record<PlanKey, Set<string>>;
}

function createPlanNumberMap() {
  return {
    starter: 0,
    essencial: 0,
    profissional: 0,
    vip: 0,
  } satisfies Record<PlanKey, number>;
}

function createPlanAgeMap() {
  return {
    starter: new Map<string, { count: number; sales: number; revenue: number }>(),
    essencial: new Map<string, { count: number; sales: number; revenue: number }>(),
    profissional: new Map<string, { count: number; sales: number; revenue: number }>(),
    vip: new Map<string, { count: number; sales: number; revenue: number }>(),
  } satisfies Record<PlanKey, Map<string, { count: number; sales: number; revenue: number }>>;
}

function resolveEventPlan(event: FunnelEventRow): PlanKey | null {
  const data = event.event_data || {};
  const explicitPlan = typeof data.plan === "string" ? normalizePlan(data.plan) : null;
  if (explicitPlan) return explicitPlan;

  const amount = typeof data.amount === "number" ? data.amount : Number(data.amount);
  return resolvePlanFromExactAmount(Number.isFinite(amount) ? amount : null);
}

function resolvePurchasePlan(purchase: PurchaseRow): PlanKey | null {
  const stepPlan = resolvePlanFromFrontStep(purchase.funnel_step);
  if (stepPlan) return stepPlan;
  return resolvePlanFromExactAmount(purchase.amount);
}

function resolvePlanFromFrontStep(step: string | null | undefined): PlanKey | null {
  switch (step) {
    case "front_37":
      return "starter";
    case "front_47":
      return "essencial";
    case "front_97":
      return "profissional";
    case "front_197":
      return "vip";
    default:
      return null;
  }
}

function resolvePlanFromExactAmount(amount: number | null | undefined): PlanKey | null {
  if (amount == null) return null;

  if (Math.abs(amount - 37) < 0.01) return "starter";
  if (Math.abs(amount - 47) < 0.01) return "essencial";
  if (Math.abs(amount - 97) < 0.01) return "profissional";
  if (Math.abs(amount - 197) < 0.01) return "vip";

  return null;
}

function normalizePlan(value: string): PlanKey | null {
  if (PLAN_ORDER.includes(value as PlanKey)) {
    return value as PlanKey;
  }
  return null;
}

function chunkArray<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}
