import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from "recharts";
import { BarChart3, TrendingDown, RefreshCw, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepData {
  step: string;
  label: string;
  views: number;
  dropOff: number;
  [key: string]: string | number; // dynamic campaign keys
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

const ROUTE_ALIASES: Record<string, string> = {
  "/step-18": "/step-16",
  "/step-19": "/step-17",
};

const CAMPAIGN_COLORS = [
  "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4",
  "#ec4899", "#84cc16", "#f97316", "#6366f1", "#14b8a6",
  "#e879f9", "#fbbf24", "#22d3ee", "#a78bfa", "#fb923c",
];

const tooltipStyle = {
  background: "#1a1a1a",
  border: "1px solid #2a2a2a",
  borderRadius: "12px",
  color: "#e2e8f0",
  fontSize: "12px",
  padding: "8px 12px",
};

const cleanCampaignName = (name: string): string => {
  if (!name) return "Direto";
  // Remove IDs after | and trim
  const clean = name.split("|")[0].trim();
  return clean.length > 25 ? clean.substring(0, 22) + "…" : clean;
};

const LiveFunnelAnalytics = () => {
  const [funnelData, setFunnelData] = useState<StepData[]>([]);
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalViews, setTotalViews] = useState(0);
  const [totalCompleted, setTotalCompleted] = useState(0);
  const [offerViews, setOfferViews] = useState(0);
  const [checkoutClicks, setCheckoutClicks] = useState(0);
  const [allCampaigns, setAllCampaigns] = useState<string[]>([]);
  const [selectedCampaigns, setSelectedCampaigns] = useState<Set<string>>(new Set());
  const [showFilter, setShowFilter] = useState(false);

  const campaignMode = selectedCampaigns.size > 0;

  const fetchFunnelData = useCallback(async () => {
    setLoading(true);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayISO = todayStart.toISOString();

    // Fetch page loads and session attribution in parallel
    const [pageLoadsRes, attributionRes, checkoutRes] = await Promise.all([
      supabase
        .from("funnel_audit_logs")
        .select("page_id, session_id, created_at")
        .eq("event_type", "page_loaded")
        .gte("created_at", todayISO),
      supabase
        .from("session_attribution")
        .select("session_id, utm_campaign")
        .gte("created_at", todayISO),
      supabase
        .from("funnel_events")
        .select("session_id")
        .eq("event_name", "checkout_click")
        .gte("created_at", todayISO),
    ]);

    const pageLoads = pageLoadsRes.data;
    if (!pageLoads) { setLoading(false); return; }

    // Build session → campaign map
    const sessionCampaign: Record<string, string> = {};
    const campaignSet = new Set<string>();
    (attributionRes.data || []).forEach(a => {
      const camp = a.utm_campaign ? cleanCampaignName(a.utm_campaign) : "Direto";
      sessionCampaign[a.session_id] = camp;
      campaignSet.add(camp);
    });
    const campaigns = Array.from(campaignSet).sort();
    setAllCampaigns(campaigns);

    // Count per step (total + per campaign)
    const stepCounts: Record<string, Set<string>> = {};
    const stepCampaignCounts: Record<string, Record<string, Set<string>>> = {};
    FUNNEL_STEPS.forEach(s => {
      stepCounts[s.route] = new Set();
      stepCampaignCounts[s.route] = {};
    });

    const hourCounts: Record<string, number> = {};
    for (let i = 0; i < 24; i++) {
      hourCounts[`${i.toString().padStart(2, "0")}h`] = 0;
    }

    pageLoads.forEach(log => {
      let pid = log.page_id || "";
      if (pid.startsWith("/upsell")) {
        if (pid.startsWith("/upsell6") || pid.includes("forex")) pid = "/upsell6";
        else if (pid.startsWith("/upsell5") || pid.includes("safety")) pid = "/upsell5";
        else if (pid.startsWith("/upsell4") || pid.includes("upsell4-") || pid.includes("sucesso") || pid.includes("circulo")) pid = "/upsell4";
        else if (pid.startsWith("/upsell3") || pid.includes("blindagem")) pid = "/upsell3";
        else if (pid.startsWith("/upsell2") || pid.includes("multiplicador")) pid = "/upsell2";
        else if (pid.startsWith("/upsell1") || pid.startsWith("/upsell-")) pid = "/upsell1";
      }
      if (ROUTE_ALIASES[pid]) pid = ROUTE_ALIASES[pid];

      if (stepCounts[pid]) {
        stepCounts[pid].add(log.session_id);

        // Track per campaign
        const camp = sessionCampaign[log.session_id] || "Direto";
        if (!stepCampaignCounts[pid][camp]) stepCampaignCounts[pid][camp] = new Set();
        stepCampaignCounts[pid][camp].add(log.session_id);
      }

      const hour = new Date(log.created_at).getHours();
      const key = `${hour.toString().padStart(2, "0")}h`;
      hourCounts[key] = (hourCounts[key] || 0) + 1;
    });

    // Build funnel data with campaign breakdown
    const steps: StepData[] = FUNNEL_STEPS.map((s, i) => {
      const views = stepCounts[s.route]?.size || 0;
      const prevViews = i > 0 ? (stepCounts[FUNNEL_STEPS[i - 1].route]?.size || 0) : views;
      const dropOff = prevViews > 0 ? Math.round(((prevViews - views) / prevViews) * 100) : 0;

      const row: StepData = { step: s.route, label: s.label, views, dropOff: i === 0 ? 0 : dropOff };

      // Add campaign counts
      campaigns.forEach(camp => {
        row[camp] = stepCampaignCounts[s.route]?.[camp]?.size || 0;
      });
      // Also add "Direto" for sessions without attribution
      if (!campaigns.includes("Direto")) {
        row["Direto"] = stepCampaignCounts[s.route]?.["Direto"]?.size || 0;
      }

      return row;
    });

    const hourly: HourlyData[] = Object.entries(hourCounts).map(([hour, visits]) => ({ hour, visits }));

    setFunnelData(steps);
    setHourlyData(hourly);
    setTotalViews(steps[0]?.views || 0);
    setTotalCompleted(steps[steps.length - 1]?.views || 0);
    setOfferViews(stepCounts["/step-17"]?.size || 0);

    const uniqueCheckouts = new Set(checkoutRes.data?.map(e => e.session_id) || []);
    setCheckoutClicks(uniqueCheckouts.size);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchFunnelData();
    const interval = setInterval(fetchFunnelData, 30000);
    const channel = supabase.channel("funnel-analytics-realtime")
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "funnel_audit_logs",
        filter: "event_type=eq.page_loaded",
      }, () => fetchFunnelData())
      .subscribe();
    return () => { clearInterval(interval); supabase.removeChannel(channel); };
  }, [fetchFunnelData]);

  const toggleCampaign = (camp: string) => {
    setSelectedCampaigns(prev => {
      const next = new Set(prev);
      if (next.has(camp)) next.delete(camp);
      else next.add(camp);
      return next;
    });
  };

  // Determine which campaigns to show bars for
  const activeCampaigns = useMemo(() => {
    if (selectedCampaigns.size > 0) return Array.from(selectedCampaigns);
    return []; // No filter = show total only
  }, [selectedCampaigns]);

  // Ensure "Direto" is always in allCampaigns for the filter
  const displayCampaigns = useMemo(() => {
    const set = new Set(allCampaigns);
    set.add("Direto");
    return Array.from(set).sort();
  }, [allCampaigns]);

  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a] p-5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 min-w-0">
        <div className="p-2 rounded-xl bg-gradient-to-br from-sky-500/20 to-sky-600/10 border border-sky-500/20 flex-shrink-0">
          <BarChart3 className="w-4 h-4 text-sky-400" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-white text-sm truncate">Funil 24h</h3>
          <p className="text-[10px] text-[#666]">
            {campaignMode
              ? `Filtrando: ${Array.from(selectedCampaigns).join(", ")}`
              : "Visualizações por etapa"}
          </p>
        </div>
        <button onClick={() => setShowFilter(!showFilter)}
          className={cn("w-7 h-7 rounded-lg border flex items-center justify-center transition-colors flex-shrink-0",
            showFilter || campaignMode
              ? "bg-sky-500/20 border-sky-500/40 text-sky-400"
              : "bg-[#0d0d0d] border-[#2a2a2a] text-[#888] hover:bg-[#1a1a1a]"
          )}>
          <Filter className="w-3 h-3" />
        </button>
        <button onClick={fetchFunnelData}
          className="w-7 h-7 rounded-lg bg-[#0d0d0d] border border-[#2a2a2a] flex items-center justify-center hover:bg-[#1a1a1a] transition-colors flex-shrink-0">
          <RefreshCw className={cn("w-3 h-3 text-[#888]", loading && "animate-spin")} />
        </button>
      </div>

      {/* Campaign Filter */}
      {showFilter && (
        <div className="mb-3 rounded-xl border border-[#2a2a2a] bg-[#0d0d0d] p-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-[10px] font-medium text-[#888] uppercase tracking-wider">Filtrar por Campanha</h4>
            {selectedCampaigns.size > 0 && (
              <button onClick={() => setSelectedCampaigns(new Set())}
                className="text-[9px] text-sky-400 hover:text-sky-300 transition-colors">
                Limpar filtro
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {displayCampaigns.map((camp, i) => {
              const color = CAMPAIGN_COLORS[i % CAMPAIGN_COLORS.length];
              const isActive = selectedCampaigns.has(camp);
              return (
                <button key={camp} onClick={() => toggleCampaign(camp)}
                  className={cn(
                    "text-[10px] px-2.5 py-1 rounded-lg border transition-all truncate max-w-[160px]",
                    isActive
                      ? "border-transparent text-white font-medium"
                      : "border-[#2a2a2a] text-[#888] hover:text-white hover:border-[#444]"
                  )}
                  style={isActive ? { backgroundColor: color + "33", borderColor: color } : {}}>
                  <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5" style={{ backgroundColor: color }} />
                  {camp}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* KPI Row */}
      <div className="overflow-x-auto -mx-5 px-5 pb-3">
        <div className="flex gap-2 w-max">
          {[
            { label: "Visualizações", value: totalViews, color: "text-sky-400" },
            { label: "Viram Oferta", value: offerViews, color: "text-violet-400" },
            { label: "Checkout", value: checkoutClicks, color: "text-amber-400" },
            { label: "Completaram", value: totalCompleted, color: "text-emerald-400" },
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
                activeCampaigns.map((camp, i) => {
                  const colorIndex = displayCampaigns.indexOf(camp);
                  const color = CAMPAIGN_COLORS[(colorIndex >= 0 ? colorIndex : i) % CAMPAIGN_COLORS.length];
                  return (
                    <Bar key={camp} dataKey={camp} stackId="campaigns" fill={color} radius={i === activeCampaigns.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} name={camp} />
                  );
                })
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
