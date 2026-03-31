import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from "recharts";
import { BarChart3, TrendingDown, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CampaignFilterState } from "./CampaignFilter";
import { cleanCampaignName, deriveCampaignLabel } from "./CampaignFilter";
import FunnelStepModal from "./LiveFunnelStepModal";

interface StepData {
  step: string;
  label: string;
  views: number;
  dropOff: number;
  avgTimeMs: number;
  [key: string]: string | number;
}

interface HourlyData {
  hour: string;
  visits: number;
}

interface LiveFunnelAnalyticsProps {
  campaignFilter?: CampaignFilterState;
}

const FUNNEL_STEPS = [
  { route: "/step-1", label: "Intro" },
  { route: "/step-2", label: "Idade" },
  { route: "/step-3", label: "Nome" },
  { route: "/step-4", label: "Prova Social" },
  { route: "/step-5", label: "Online?" },
  { route: "/step-6", label: "Meta" },
  { route: "/step-7", label: "Obstáculo" },
  { route: "/step-8", label: "Mentor" },
  { route: "/step-9", label: "Saldo" },
  { route: "/step-10", label: "Tempo" },
  { route: "/step-11", label: "Demo" },
  { route: "/step-12", label: "WhatsApp" },
  { route: "/step-13", label: "Contato" },
  { route: "/step-14", label: "Input" },
  { route: "/step-15", label: "Análise" },
  { route: "/step-16", label: "Projeção" },
  { route: "/step-17", label: "Oferta (Vturb)" },
  { route: "/upsell1", label: "UP1 Acel." },
  { route: "/upsell2", label: "UP2 Multi." },
  { route: "/upsell3", label: "UP3 Blind." },
  { route: "/upsell4", label: "UP4 Círc." },
  { route: "/upsell5", label: "UP5 Safety" },
  { route: "/upsell6", label: "UP6 FOREX" },
];

const TIKTOK_FUNNEL_STEPS = [
  { route: "tiktok/step-1", label: "TK Intro" },
  { route: "tiktok/step-2", label: "TK Idade" },
  { route: "tiktok/step-3", label: "TK Prova" },
  { route: "tiktok/step-4", label: "TK Meta" },
  { route: "tiktok/step-5", label: "TK 10min" },
  { route: "tiktok/step-6", label: "TK Email" },
  { route: "tiktok/step-7", label: "TK Análise" },
  { route: "tiktok/step-8", label: "TK Projeção" },
  { route: "tiktok/step-9", label: "TK Oferta" },
];

const ROUTE_ALIASES: Record<string, string> = {
  "/step-18": "/step-17",
  "/step-19": "/step-17",
};

const tooltipStyle = {
  background: "#1a1a1a",
  border: "1px solid #2a2a2a",
  borderRadius: "12px",
  color: "#e2e8f0",
  fontSize: "12px",
  padding: "8px 12px",
};

// Paginated fetch to bypass 1000-row limit
async function fetchAllRows(
  table: string,
  select: string,
  filters: (q: any) => any,
  pageSize = 1000
): Promise<any[]> {
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

const LiveFunnelAnalytics = ({ campaignFilter }: LiveFunnelAnalyticsProps) => {
  const [funnelData, setFunnelData] = useState<StepData[]>([]);
  const [tiktokFunnelData, setTiktokFunnelData] = useState<StepData[]>([]);
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalViews, setTotalViews] = useState(0);
  const [totalCompleted, setTotalCompleted] = useState(0);
  const [offerViews, setOfferViews] = useState(0);
  const [checkoutClicks, setCheckoutClicks] = useState(0);
  const [purchases, setPurchases] = useState(0);
  const [selectedStep, setSelectedStep] = useState<{ route: string; label: string } | null>(null);

  const selectedCampaigns = campaignFilter?.selectedCampaigns || new Set<string>();
  const campaignColors = campaignFilter?.campaignColors || {};
  const allCampaigns = campaignFilter?.allCampaigns || [];
  const campaignMode = selectedCampaigns.size > 0;

  const fetchFunnelData = useCallback(async () => {
    setLoading(true);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayISO = todayStart.toISOString();

    // Fetch from funnel_events (step_viewed + step_completed) for quiz steps + funnel_audit_logs for upsell pages
    const [quizStepEvents, stepCompletedEvents, attributionData, checkoutData, purchaseData, upsellAuditLogs] = await Promise.all([
      fetchAllRows(
        "funnel_events", "session_id, event_data, created_at",
        (q: any) => q.eq("event_name", "step_viewed").gte("created_at", todayISO)
      ),
      fetchAllRows(
        "funnel_events", "session_id, event_data, created_at",
        (q: any) => q.eq("event_name", "step_completed").gte("created_at", todayISO)
      ),
      fetchAllRows(
        "session_attribution", "session_id, utm_campaign, utm_source, ttclid, fbclid",
        (q: any) => q.gte("created_at", todayISO)
      ),
      fetchAllRows(
        "funnel_events", "session_id",
        (q: any) => q.in("event_name", ["checkout_click", "capi_ic_sent"]).gte("created_at", todayISO)
      ),
      fetchAllRows(
        "purchase_tracking", "session_id, email, transaction_id, id",
        (q: any) => q.in("status", ["approved", "completed", "purchased", "redirected"]).gte("created_at", todayISO)
      ),
      fetchAllRows(
        "funnel_audit_logs", "page_id, session_id, created_at",
        (q: any) => q.eq("event_type", "page_loaded").gte("created_at", todayISO)
      ),
    ]);

    // Build avg time per step from step_completed events
    const stepTimes: Record<string, number[]> = {};
    (stepCompletedEvents || []).forEach((evt: any) => {
      const ed = evt.event_data as Record<string, unknown> | null;
      const step = ed?.step as string | undefined;
      const timeMs = ed?.time_spent_ms as number | undefined;
      if (step && timeMs && timeMs > 0 && timeMs < 600000) {
        const key = step.startsWith("/") ? step : `/${step}`;
        if (!stepTimes[key]) stepTimes[key] = [];
        stepTimes[key].push(timeMs);
      }
    });

    // Merge data: quiz steps from funnel_events, upsell from audit_logs
    const mergedPageLoads: { page_id: string; session_id: string; created_at: string }[] = [];

    // Quiz step events: extract step from event_data
    (quizStepEvents || []).forEach((evt: any) => {
      const ed = evt.event_data as Record<string, unknown> | null;
      const step = ed?.step as string | undefined;
      if (step) {
        mergedPageLoads.push({
          page_id: step.startsWith("/") ? step : `/${step}`,
          session_id: evt.session_id,
          created_at: evt.created_at,
        });
      }
    });

    // Upsell page loads from audit_logs
    (upsellAuditLogs || []).forEach((log: any) => {
      if (log.page_id?.startsWith("/upsell")) {
        mergedPageLoads.push(log);
      }
    });

    if (!mergedPageLoads.length) { setLoading(false); return; }

    const sessionCampaign: Record<string, string> = {};
    (attributionData || []).forEach((a: any) => {
      sessionCampaign[a.session_id] = deriveCampaignLabel(a);
    });

    const stepCounts: Record<string, Set<string>> = {};
    const stepCampaignCounts: Record<string, Record<string, Set<string>>> = {};
    [...FUNNEL_STEPS, ...TIKTOK_FUNNEL_STEPS].forEach(s => {
      stepCounts[s.route] = new Set();
      stepCampaignCounts[s.route] = {};
    });

    const hourCounts: Record<string, number> = {};
    for (let i = 0; i < 24; i++) hourCounts[`${i.toString().padStart(2, "0")}h`] = 0;

    mergedPageLoads.forEach(log => {
      let pid = log.page_id || "";
      // Remove leading slash for tiktok routes to match TIKTOK_FUNNEL_STEPS format
      const pidNoSlash = pid.startsWith("/") ? pid.slice(1) : pid;
      if (pid.startsWith("/upsell")) {
        if (pid.startsWith("/upsell6") || pid.includes("forex")) pid = "/upsell6";
        else if (pid.startsWith("/upsell5") || pid.includes("safety")) pid = "/upsell5";
        else if (pid.startsWith("/upsell4") || pid.includes("upsell4-") || pid.includes("sucesso") || pid.includes("circulo")) pid = "/upsell4";
        else if (pid.startsWith("/upsell3") || pid.includes("blindagem")) pid = "/upsell3";
        else if (pid.startsWith("/upsell2") || pid.includes("multiplicador")) pid = "/upsell2";
        else if (pid.startsWith("/upsell1") || pid.startsWith("/upsell-")) pid = "/upsell1";
      }
      if (ROUTE_ALIASES[pid]) pid = ROUTE_ALIASES[pid];
      // Check both formats
      const matchKey = stepCounts[pid] ? pid : stepCounts[pidNoSlash] ? pidNoSlash : null;
      if (matchKey) {
        stepCounts[matchKey].add(log.session_id);
        const camp = sessionCampaign[log.session_id] || "Direto";
        if (!stepCampaignCounts[matchKey][camp]) stepCampaignCounts[matchKey][camp] = new Set();
        stepCampaignCounts[matchKey][camp].add(log.session_id);
      }
      const hour = new Date(log.created_at).getHours();
      hourCounts[`${hour.toString().padStart(2, "0")}h`] = (hourCounts[`${hour.toString().padStart(2, "0")}h`] || 0) + 1;
    });

    const campaigns = allCampaigns.length > 0 ? allCampaigns : Array.from(new Set(Object.values(sessionCampaign))).sort();

    const steps: StepData[] = FUNNEL_STEPS.map((s, i) => {
      const views = stepCounts[s.route]?.size || 0;
      const prevViews = i > 0 ? (stepCounts[FUNNEL_STEPS[i - 1].route]?.size || 0) : views;
      const dropOff = prevViews > 0 ? Math.round(((prevViews - views) / prevViews) * 100) : 0;
      const times = stepTimes[s.route] || [];
      const avgTimeMs = times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;
      const row: StepData = { step: s.route, label: s.label, views, dropOff: i === 0 ? 0 : dropOff, avgTimeMs };
      campaigns.forEach(camp => {
        row[camp] = stepCampaignCounts[s.route]?.[camp]?.size || 0;
      });
      return row;
    });

    // TikTok funnel data
    const tkSteps: StepData[] = TIKTOK_FUNNEL_STEPS.map((s, i) => {
      const views = stepCounts[s.route]?.size || 0;
      const prevViews = i > 0 ? (stepCounts[TIKTOK_FUNNEL_STEPS[i - 1].route]?.size || 0) : views;
      const dropOff = prevViews > 0 ? Math.round(((prevViews - views) / prevViews) * 100) : 0;
      const times = stepTimes[s.route] || stepTimes[`/${s.route}`] || [];
      const avgTimeMs = times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;
      const row: StepData = { step: s.route, label: s.label, views, dropOff: i === 0 ? 0 : dropOff, avgTimeMs };
      return row;
    });

    setFunnelData(steps);
    setTiktokFunnelData(tkSteps);
    setHourlyData(Object.entries(hourCounts).map(([hour, visits]) => ({ hour, visits })));
    setTotalViews(steps[0]?.views || 0);
    setTotalCompleted(steps[steps.length - 1]?.views || 0);
    setOfferViews(stepCounts["/step-17"]?.size || 0);
    setCheckoutClicks(new Set(checkoutData.map(e => e.session_id)).size);
    setPurchases(purchaseData.length);
    setLoading(false);
  }, [allCampaigns]);

  useEffect(() => {
    const timer = setTimeout(fetchFunnelData, 6000); // Stagger: load 6s after mount
    const interval = setInterval(fetchFunnelData, 60000); // Refresh every 60s
    const channel = supabase.channel("funnel-analytics-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "funnel_audit_logs", filter: "event_type=eq.page_loaded" },
        () => fetchFunnelData())
      .subscribe();
    return () => { clearTimeout(timer); clearInterval(interval); supabase.removeChannel(channel); };
  }, [fetchFunnelData]);

  const activeCampaigns = campaignMode ? Array.from(selectedCampaigns) : [];

  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a] p-5 overflow-hidden">
      <div className="flex items-center gap-2 mb-4 min-w-0">
        <div className="p-2 rounded-xl bg-gradient-to-br from-sky-500/20 to-sky-600/10 border border-sky-500/20 flex-shrink-0">
          <BarChart3 className="w-4 h-4 text-sky-400" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-white text-sm truncate">Funil 24h</h3>
          <p className="text-[10px] text-[#666]">
            {campaignMode ? `Filtrando: ${activeCampaigns.join(", ")}` : "Visualizações por etapa"}
          </p>
        </div>
        <button onClick={fetchFunnelData}
          className="w-7 h-7 rounded-lg bg-[#0d0d0d] border border-[#2a2a2a] flex items-center justify-center hover:bg-[#1a1a1a] transition-colors flex-shrink-0">
          <RefreshCw className={cn("w-3 h-3 text-[#888]", loading && "animate-spin")} />
        </button>
      </div>

      {/* KPI Row */}
      <div className="overflow-x-auto -mx-5 px-5 pb-3">
        <div className="flex gap-2 w-max">
          {[
            { label: "Visualizações", value: totalViews, color: "text-sky-400" },
            { label: "Viram Oferta", value: offerViews, color: "text-violet-400" },
            { label: "Checkout", value: checkoutClicks, color: "text-amber-400" },
            { label: "Compras", value: purchases, color: "text-emerald-400" },
            { label: "Oferta→Compra", value: offerViews > 0 ? `${((purchases / offerViews) * 100).toFixed(1)}%` : "0%", color: "text-cyan-400" },
            { label: "IC→Compra", value: checkoutClicks > 0 ? `${((purchases / checkoutClicks) * 100).toFixed(1)}%` : "0%", color: "text-pink-400" },
          ].map((kpi, i) => (
            <div key={i} className="rounded-xl border border-[#2a2a2a] bg-[#0d0d0d] p-2.5 min-w-[100px] w-[100px] flex-shrink-0">
              <p className="text-[9px] text-[#666] uppercase tracking-wider mb-1">{kpi.label}</p>
              <p className={cn("text-lg font-bold tabular-nums", kpi.color)}>{kpi.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Funnel Bar Chart */}
      <div className="rounded-xl border border-[#2a2a2a] bg-[#0d0d0d] p-3 mb-3">
        <h4 className="text-[10px] font-medium text-[#888] uppercase tracking-wider mb-2">
          Funil por Etapa {campaignMode && "— por Campanha"}
        </h4>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={funnelData} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
              <XAxis dataKey="label" tick={{ fill: "#666", fontSize: 8 }} axisLine={false} tickLine={false} interval={0} angle={-55} textAnchor="end" height={60} />
              <YAxis tick={{ fill: "#666", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              {campaignMode ? (
                activeCampaigns.map((camp, i) => (
                  <Bar key={camp} dataKey={camp} stackId="campaigns" fill={campaignColors[camp] || "#10b981"}
                    radius={i === activeCampaigns.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} name={camp} />
                ))
              ) : (
                <Bar dataKey="views" fill="#10b981" radius={[4, 4, 0, 0]} />
              )}
              {campaignMode && <Legend wrapperStyle={{ fontSize: "10px", color: "#888" }} />}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Traffic per Hour */}
      <div className="rounded-xl border border-[#2a2a2a] bg-[#0d0d0d] p-3 mb-3">
        <h4 className="text-[10px] font-medium text-[#888] uppercase tracking-wider mb-2">Tráfego por Hora</h4>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={hourlyData} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
              <XAxis dataKey="hour" tick={{ fill: "#666", fontSize: 9 }} axisLine={false} tickLine={false} interval={2} />
              <YAxis tick={{ fill: "#666", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="visits" stroke="#8b5cf6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Drop-off + Tempo por Etapa */}
      <div className="rounded-xl border border-[#2a2a2a] bg-[#0d0d0d] p-3">
        <h4 className="text-[10px] font-medium text-[#888] uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <TrendingDown className="w-3.5 h-3.5 text-red-400" /> Drop-off & Tempo por Etapa
        </h4>
        <div className="space-y-1 max-h-[320px] overflow-y-auto pr-1">
          {funnelData.map((s, i) => {
            const avgSec = s.avgTimeMs > 0 ? s.avgTimeMs / 1000 : 0;
            const avgLabel = avgSec > 60 ? `${(avgSec / 60).toFixed(1)}min` : `${Math.round(avgSec)}s`;
            const allTimes = funnelData.filter(f => f.avgTimeMs > 0).map(f => f.avgTimeMs);
            const globalAvg = allTimes.length > 0 ? allTimes.reduce((a, b) => a + b, 0) / allTimes.length : 0;
            const isSlowStep = s.avgTimeMs > globalAvg * 2 && s.avgTimeMs > 0;
            
            return (
              <div key={i}>
                <div className="flex items-center gap-1.5 text-[10px] py-0.5 cursor-pointer hover:bg-[#1a1a1a] rounded px-1 -mx-1"
                  onClick={() => setSelectedStep({ route: s.step, label: s.label })}>
                  <span className="text-[#888] w-16 truncate font-medium">{s.label}</span>
                  <span className="text-[#666] w-8 text-right tabular-nums">{s.views}</span>
                  <div className="flex-1 h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all",
                      s.dropOff > 50 ? "bg-red-500" : s.dropOff > 30 ? "bg-amber-500" : s.dropOff > 15 ? "bg-yellow-500" : "bg-emerald-500"
                    )} style={{ width: `${Math.min(s.dropOff, 100)}%` }} />
                  </div>
                  {s.dropOff > 0 && (
                    <span className={cn("font-bold tabular-nums w-10 text-right text-[10px]",
                      s.dropOff > 30 ? (s.dropOff > 50 ? "text-red-400 animate-pulse" : "text-red-400") :
                      s.dropOff > 15 ? "text-amber-400" : "text-emerald-400"
                    )}>-{s.dropOff}%</span>
                  )}
                  {s.dropOff === 0 && <span className="w-10" />}
                  {avgSec > 0 && (
                    <span className={cn("tabular-nums w-12 text-right text-[9px]",
                      isSlowStep ? "text-amber-400 font-bold" : "text-[#555]"
                    )}>~{avgLabel}</span>
                  )}
                  {avgSec === 0 && <span className="w-12" />}
                </div>
              </div>
            );
          })}
          {funnelData.length === 0 && (
            <p className="text-[10px] text-[#666] py-4 text-center">Sem dados ainda</p>
          )}
        </div>
      </div>

      {/* TikTok Funnel Section */}
      {(() => {
        const tkTotal = tiktokFunnelData.reduce((sum, s) => sum + s.views, 0);
        if (tkTotal === 0 && tiktokFunnelData.length > 0) return null;
        return (
          <div className="rounded-xl border border-red-500/20 bg-[#0d0d0d] p-3 mt-3">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-red-500/15 border border-red-500/25 flex-shrink-0">
                <BarChart3 className="w-3.5 h-3.5 text-red-400" />
              </div>
              <h4 className="text-xs font-semibold text-red-400 uppercase tracking-wider">Funil TikTok — 9 Etapas</h4>
              <span className="text-[10px] text-[#666] ml-auto tabular-nums">{tkTotal} views</span>
            </div>
            <div className="h-[180px] mb-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tiktokFunnelData} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
                  <XAxis dataKey="label" tick={{ fill: "#666", fontSize: 8 }} axisLine={false} tickLine={false} interval={0} angle={-45} textAnchor="end" height={50} />
                  <YAxis tick={{ fill: "#666", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="views" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1">
              {tiktokFunnelData.map((s, i) => {
                const avgSec = s.avgTimeMs > 0 ? s.avgTimeMs / 1000 : 0;
                const avgLabel = avgSec > 60 ? `${(avgSec / 60).toFixed(1)}min` : `${Math.round(avgSec)}s`;
                return (
                  <div key={i} className="flex items-center gap-1.5 text-[10px] py-0.5 px-1">
                    <span className="text-[#888] w-16 truncate font-medium">{s.label}</span>
                    <span className="text-[#666] w-8 text-right tabular-nums">{s.views}</span>
                    <div className="flex-1 h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all",
                        s.dropOff > 50 ? "bg-red-500" : s.dropOff > 30 ? "bg-amber-500" : s.dropOff > 15 ? "bg-yellow-500" : "bg-red-400"
                      )} style={{ width: `${Math.min(s.dropOff, 100)}%` }} />
                    </div>
                    {s.dropOff > 0 && <span className={cn("font-bold tabular-nums w-10 text-right text-[10px]", s.dropOff > 30 ? "text-red-400" : "text-amber-400")}>-{s.dropOff}%</span>}
                    {s.dropOff === 0 && <span className="w-10" />}
                    {avgSec > 0 && <span className="tabular-nums w-12 text-right text-[9px] text-[#555]">~{avgLabel}</span>}
                    {avgSec === 0 && <span className="w-12" />}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {selectedStep && (
        <FunnelStepModal stepRoute={selectedStep.route} stepLabel={selectedStep.label} onClose={() => setSelectedStep(null)} />
      )}
    </div>
  );
};

export default LiveFunnelAnalytics;
