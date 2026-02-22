import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";
import { BarChart3, TrendingDown, Activity, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepData {
  step: string;
  label: string;
  views: number;
  dropOff: number;
}

interface HourlyData {
  hour: string;
  visits: number;
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
  { route: "/step-12", label: "Loading" },
  { route: "/step-13", label: "Prova 2" },
  { route: "/step-14", label: "WhatsApp" },
  { route: "/step-15", label: "Contato" },
  { route: "/step-16", label: "Input" },
  { route: "/step-17", label: "Oferta" },
  { route: "/upsell1", label: "UP1 Acel." },
  { route: "/upsell2", label: "UP2 Multi." },
  { route: "/upsell3", label: "UP3 Blind." },
  { route: "/upsell4", label: "UP4 Círc." },
  { route: "/upsell5", label: "UP5 Safety" },
  { route: "/upsell6", label: "UP6 FOREX" },
];

const tooltipStyle = {
  background: "#1a1a1a",
  border: "1px solid #2a2a2a",
  borderRadius: "12px",
  color: "#e2e8f0",
  fontSize: "12px",
  padding: "8px 12px",
};

const LiveFunnelAnalytics = () => {
  const [funnelData, setFunnelData] = useState<StepData[]>([]);
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalViews, setTotalViews] = useState(0);
  const [totalCompleted, setTotalCompleted] = useState(0);
  const [offerViews, setOfferViews] = useState(0);
  const [checkoutClicks, setCheckoutClicks] = useState(0);

  const fetchFunnelData = useCallback(async () => {
    setLoading(true);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayISO = todayStart.toISOString();

    const { data: pageLoads } = await supabase
      .from("funnel_audit_logs")
      .select("page_id, session_id, created_at")
      .eq("event_type", "page_loaded")
      .gte("created_at", todayISO);

    if (!pageLoads) { setLoading(false); return; }

    // Count unique sessions per step
    const stepCounts: Record<string, Set<string>> = {};
    FUNNEL_STEPS.forEach(s => { stepCounts[s.route] = new Set(); });

    const hourCounts: Record<string, number> = {};
    for (let i = 0; i < 24; i++) {
      hourCounts[`${i.toString().padStart(2, "0")}h`] = 0;
    }

    // Map old 19-step routes to current 17-step structure
    const ROUTE_ALIASES: Record<string, string> = {
      "/step-18": "/step-16", // old Input → new Input (step-16)
      "/step-19": "/step-17", // old Oferta → new Oferta (step-17)
    };

    pageLoads.forEach(log => {
      let pid = log.page_id || "";
      // Map all upsell pages/sub-pages to their canonical route
      if (pid.startsWith("/upsell")) {
        if (pid.startsWith("/upsell6") || pid.includes("forex")) pid = "/upsell6";
        else if (pid.startsWith("/upsell5") || pid.includes("safety")) pid = "/upsell5";
        else if (pid.startsWith("/upsell4") || pid.includes("upsell4-") || pid.includes("sucesso") || pid.includes("circulo")) pid = "/upsell4";
        else if (pid.startsWith("/upsell3") || pid.includes("blindagem")) pid = "/upsell3";
        else if (pid.startsWith("/upsell2") || pid.includes("multiplicador")) pid = "/upsell2";
        else if (pid.startsWith("/upsell1") || pid.startsWith("/upsell-")) pid = "/upsell1";
      }
      // Apply historical route aliases
      if (ROUTE_ALIASES[pid]) pid = ROUTE_ALIASES[pid];
      if (stepCounts[pid]) {
        stepCounts[pid].add(log.session_id);
      }
      const hour = new Date(log.created_at).getHours();
      const key = `${hour.toString().padStart(2, "0")}h`;
      hourCounts[key] = (hourCounts[key] || 0) + 1;
    });

    // Build funnel data with drop-off
    const steps: StepData[] = FUNNEL_STEPS.map((s, i) => {
      const views = stepCounts[s.route]?.size || 0;
      const prevViews = i > 0 ? (stepCounts[FUNNEL_STEPS[i - 1].route]?.size || 0) : views;
      const dropOff = prevViews > 0 ? Math.round(((prevViews - views) / prevViews) * 100) : 0;
      return { step: s.route, label: s.label, views, dropOff: i === 0 ? 0 : dropOff };
    });

    const hourly: HourlyData[] = Object.entries(hourCounts).map(([hour, visits]) => ({ hour, visits }));

    setFunnelData(steps);
    setHourlyData(hourly);
    setTotalViews(steps[0]?.views || 0);
    setTotalCompleted(steps[steps.length - 1]?.views || 0);
    setOfferViews(stepCounts["/step-17"]?.size || 0);

    // Fetch real checkout clicks from funnel_events
    const { data: checkoutEvents } = await supabase
      .from("funnel_events")
      .select("session_id")
      .eq("event_name", "checkout_click")
      .gte("created_at", todayISO);
    const uniqueCheckouts = new Set(checkoutEvents?.map(e => e.session_id) || []);
    setCheckoutClicks(uniqueCheckouts.size);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchFunnelData();
    const interval = setInterval(fetchFunnelData, 30000);

    // Realtime: refresh on new page_loaded events
    const channel = supabase.channel("funnel-analytics-realtime")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "funnel_audit_logs",
        filter: "event_type=eq.page_loaded",
      }, () => {
        fetchFunnelData();
      })
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [fetchFunnelData]);

  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a] p-5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 min-w-0">
        <div className="p-2 rounded-xl bg-gradient-to-br from-sky-500/20 to-sky-600/10 border border-sky-500/20 flex-shrink-0">
          <BarChart3 className="w-4 h-4 text-sky-400" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-white text-sm truncate">Funil 24h</h3>
          <p className="text-[10px] text-[#666]">Visualizações por etapa</p>
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
            { label: "Completaram", value: totalCompleted, color: "text-emerald-400" },
            { label: "CTA Revelado", value: offerViews, color: "text-orange-400" },
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
        <h4 className="text-[10px] font-medium text-[#888] uppercase tracking-wider mb-2">Funil por Etapa</h4>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={funnelData} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
              <XAxis dataKey="label" tick={{ fill: "#666", fontSize: 8 }} axisLine={false} tickLine={false} interval={0} angle={-55} textAnchor="end" height={60} />
              <YAxis tick={{ fill: "#666", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="views" fill="#10b981" radius={[4, 4, 0, 0]} />
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

      {/* Drop-off Rates */}
      <div className="rounded-xl border border-[#2a2a2a] bg-[#0d0d0d] p-3">
        <h4 className="text-[10px] font-medium text-[#888] uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <TrendingDown className="w-3.5 h-3.5 text-red-400" /> Taxa de Abandono
        </h4>
        <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
          {funnelData.filter(s => s.dropOff > 0).map((s, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className="text-[#888] w-14 truncate">{s.label}</span>
              <div className="flex-1 h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                <div className={cn("h-full rounded-full transition-all", s.dropOff > 50 ? "bg-red-500" : s.dropOff > 30 ? "bg-amber-500" : "bg-emerald-500")}
                  style={{ width: `${Math.min(s.dropOff, 100)}%` }} />
              </div>
              <span className={cn("font-bold tabular-nums w-10 text-right", s.dropOff > 50 ? "text-red-400" : s.dropOff > 30 ? "text-amber-400" : "text-emerald-400")}>
                {s.dropOff}%
              </span>
            </div>
          ))}
          {funnelData.filter(s => s.dropOff > 0).length === 0 && (
            <p className="text-[10px] text-[#666] py-4 text-center">Sem dados ainda</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveFunnelAnalytics;
