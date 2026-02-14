import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Users, Eye, Activity, Clock, TrendingUp, BarChart3, ArrowDown, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar,
} from "recharts";

// ─── Types ────────────────────────────────────────────────
interface PresenceEntry {
  session_id: string;
  page_id: string;
  joined_at: string;
}

interface StepData {
  id: string;
  label: string;
  shortLabel: string;
  count: number;
}

interface AuditRow {
  page_id: string | null;
  session_id: string;
  created_at: string;
  event_type: string;
}

interface FunnelEventRow {
  event_name: string;
  event_data: Record<string, unknown> | null;
  session_id: string;
  created_at: string;
}

// ─── 19 steps ─────────────────────────────────────────────
const STEP_SLUGS = [
  "step-1","step-2","step-3","step-4","step-5","step-6","step-7","step-8","step-9",
  "step-10","step-11","step-12","step-13","step-14","step-15","step-16","step-17","step-18","step-19",
];

const STEP_META: Record<string, { label: string; short: string; emoji: string }> = {
  "step-1":  { label: "Intro",           short: "Intro",   emoji: "🚀" },
  "step-2":  { label: "Idade",           short: "Idade",   emoji: "🎂" },
  "step-3":  { label: "Nome",            short: "Nome",    emoji: "✏️" },
  "step-4":  { label: "Prova Social",    short: "Social",  emoji: "⭐" },
  "step-5":  { label: "Tentou Online",   short: "Online",  emoji: "🌐" },
  "step-6":  { label: "Meta de Renda",   short: "Meta",    emoji: "💰" },
  "step-7":  { label: "Obstáculo",       short: "Obstác.", emoji: "🧱" },
  "step-8":  { label: "Sonho Financeiro",short: "Sonho",   emoji: "✨" },
  "step-9":  { label: "Saldo na Conta",  short: "Saldo",   emoji: "🏦" },
  "step-10": { label: "Vídeo Mentor",    short: "Vídeo",   emoji: "🎬" },
  "step-11": { label: "Dispositivo",     short: "Device",  emoji: "📱" },
  "step-12": { label: "Disponibilidade", short: "Tempo",   emoji: "⏰" },
  "step-13": { label: "Demo Plataforma", short: "Demo",    emoji: "💻" },
  "step-14": { label: "Loading",         short: "Load",    emoji: "⚙️" },
  "step-15": { label: "Prova Social 2",  short: "Social2", emoji: "🏆" },
  "step-16": { label: "WhatsApp Proof",  short: "WA",      emoji: "📲" },
  "step-17": { label: "Método Contato",  short: "Contato", emoji: "📧" },
  "step-18": { label: "Input Contato",   short: "Input",   emoji: "📝" },
  "step-19": { label: "Oferta Final",    short: "Oferta",  emoji: "🎯" },
};

// ─── Stat Card ────────────────────────────────────────────
const StatCard = ({ label, value, icon, accent }: { label: string; value: string | number; icon: React.ReactNode; accent?: boolean }) => (
  <div className={cn(
    "rounded-xl border p-3 sm:p-4 flex flex-col gap-1",
    accent ? "border-primary/40 bg-primary/5" : "border-border bg-card"
  )}>
    <div className="flex items-center gap-2 text-muted-foreground">
      {icon}
      <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
    </div>
    <p className={cn("text-xl sm:text-2xl font-bold tabular-nums", accent ? "text-primary" : "text-foreground")}>{value}</p>
  </div>
);

const Live = () => {
  const [steps, setSteps] = useState<StepData[]>(
    STEP_SLUGS.map(s => ({
      id: s,
      label: STEP_META[s]?.label || s,
      shortLabel: STEP_META[s]?.short || s,
      count: 0,
    }))
  );
  const [totalOnline, setTotalOnline] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [auditData, setAuditData] = useState<AuditRow[]>([]);
  const [funnelEvents, setFunnelEvents] = useState<FunnelEventRow[]>([]);
  const [timeRange, setTimeRange] = useState<"1h" | "6h" | "24h">("24h");

  // ─── Real-time presence ─────────────────────────────────
  const processPresence = useCallback((state: Record<string, PresenceEntry[]>) => {
    const counts: Record<string, Set<string>> = {};
    STEP_SLUGS.forEach(s => { counts[s] = new Set(); });

    let total = 0;
    Object.entries(state).forEach(([sessionId, presences]) => {
      if (!presences.length) return;
      const p = presences[0];
      const pageId = p.page_id || "";
      if (pageId.includes("/live") || pageId.includes("/admin")) return;

      const matched = STEP_SLUGS.find(slug => pageId.includes(`/${slug}`));
      if (matched) counts[matched].add(sessionId);
      total++;
    });

    setSteps(STEP_SLUGS.map(s => ({
      id: s,
      label: STEP_META[s]?.label || s,
      shortLabel: STEP_META[s]?.short || s,
      count: counts[s]?.size || 0,
    })));
    setTotalOnline(total);
    setLastUpdated(new Date());
  }, []);

  useEffect(() => {
    const channel = supabase.channel("funnel-presence");
    channel
      .on("presence", { event: "sync" }, () => processPresence(channel.presenceState() as any))
      .on("presence", { event: "join" }, () => processPresence(channel.presenceState() as any))
      .on("presence", { event: "leave" }, () => processPresence(channel.presenceState() as any))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [processPresence]);

  // ─── Audit logs fetch ───────────────────────────────────
  const fetchAuditData = useCallback(async () => {
    const hoursMap = { "1h": 1, "6h": 6, "24h": 24 };
    const since = new Date(Date.now() - hoursMap[timeRange] * 60 * 60 * 1000).toISOString();

    const { data } = await supabase
      .from("funnel_audit_logs")
      .select("page_id, session_id, created_at, event_type")
      .eq("event_type", "page_loaded")
      .gte("created_at", since)
      .order("created_at", { ascending: true })
      .limit(5000);

    setAuditData((data as AuditRow[]) || []);
  }, [timeRange]);

  // ─── Funnel events fetch ────────────────────────────────
  const fetchFunnelEvents = useCallback(async () => {
    const hoursMap = { "1h": 1, "6h": 6, "24h": 24 };
    const since = new Date(Date.now() - hoursMap[timeRange] * 60 * 60 * 1000).toISOString();

    const { data } = await supabase
      .from("funnel_events")
      .select("event_name, event_data, session_id, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(200);

    setFunnelEvents((data as FunnelEventRow[]) || []);
  }, [timeRange]);

  useEffect(() => {
    fetchAuditData();
    fetchFunnelEvents();
    const interval = setInterval(() => { fetchAuditData(); fetchFunnelEvents(); }, 30000);
    return () => clearInterval(interval);
  }, [fetchAuditData, fetchFunnelEvents]);

  // ─── Computed analytics ─────────────────────────────────
  const { funnelChart, hourlyChart, uniqueSessions, dropoffData, conversionRate } = useMemo(() => {
    const stepSessions: Record<string, Set<string>> = {};
    STEP_SLUGS.forEach(s => { stepSessions[s] = new Set(); });

    auditData.forEach(row => {
      if (!row.page_id) return;
      const matched = STEP_SLUGS.find(slug => row.page_id!.includes(`/${slug}`));
      if (matched) stepSessions[matched].add(row.session_id);
    });

    const funnelChart = STEP_SLUGS.map(s => ({
      name: STEP_META[s]?.short || s,
      sessions: stepSessions[s].size,
    }));

    const hourlyMap: Record<string, number> = {};
    auditData.forEach(row => {
      const hour = new Date(row.created_at).getHours();
      const key = `${String(hour).padStart(2, '0')}h`;
      hourlyMap[key] = (hourlyMap[key] || 0) + 1;
    });
    const hourlyChart = Array.from({ length: 24 }, (_, i) => {
      const key = `${String(i).padStart(2, '0')}h`;
      return { hour: key, visits: hourlyMap[key] || 0 };
    });

    const allSessions = new Set(auditData.map(r => r.session_id));

    const dropoffData = STEP_SLUGS.map((s, i) => {
      const current = stepSessions[s].size;
      const prev = i > 0 ? stepSessions[STEP_SLUGS[i - 1]].size : current;
      const dropoff = prev > 0 ? Math.round(((prev - current) / prev) * 100) : 0;
      return {
        step: STEP_META[s]?.label || s,
        short: STEP_META[s]?.short || s,
        emoji: STEP_META[s]?.emoji || "",
        dropoff,
        sessions: current,
        slug: s,
      };
    });

    const firstStep = stepSessions["step-1"]?.size || 0;
    const lastStep = stepSessions["step-18"]?.size || 0;
    const conversionRate = firstStep > 0 ? ((lastStep / firstStep) * 100).toFixed(1) : "0.0";

    return { funnelChart, hourlyChart, uniqueSessions: allSessions.size, dropoffData, conversionRate };
  }, [auditData]);

  const tooltipStyle = {
    background: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "8px",
    color: "hsl(var(--foreground))",
    fontSize: "12px",
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ─── Header ──────────────────────────────── */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shrink-0" />
            <h1 className="text-base sm:text-lg font-bold">
              <span className="text-primary">ALFA</span> — Painel Live
            </h1>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="gap-1 text-xs">
              <Users className="w-3 h-3" />
              {totalOnline}
            </Badge>
            <Badge variant="secondary" className="gap-1 text-xs">
              <Activity className="w-3 h-3" />
              {uniqueSessions}
            </Badge>
            <div className="flex gap-0.5 bg-secondary/50 rounded-lg p-0.5">
              {(["1h", "6h", "24h"] as const).map(t => (
                <Button
                  key={t}
                  size="sm"
                  variant={timeRange === t ? "default" : "ghost"}
                  onClick={() => setTimeRange(t)}
                  className="text-xs h-6 px-2 rounded-md"
                >
                  {t}
                </Button>
              ))}
            </div>
            <Button size="sm" variant="ghost" onClick={fetchAuditData} className="h-7 w-7 p-0">
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">

        {/* ─── Stats Row ───────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <StatCard label="Online agora" value={totalOnline} icon={<Users className="w-3.5 h-3.5" />} accent />
          <StatCard label="Sessões" value={uniqueSessions} icon={<Activity className="w-3.5 h-3.5" />} />
          <StatCard label="Conversão" value={`${conversionRate}%`} icon={<TrendingUp className="w-3.5 h-3.5" />} />
          <StatCard label="Na oferta" value={steps.find(s => s.id === "step-18")?.count || 0} icon={<Eye className="w-3.5 h-3.5" />} accent />
        </div>

        {/* ─── Live Presence Grid ──────────────────── */}
        <section className="rounded-xl border border-border bg-card p-3 sm:p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs sm:text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <Eye className="w-3.5 h-3.5" /> PRESENÇA EM TEMPO REAL
            </h2>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {lastUpdated.toLocaleTimeString("pt-BR")}
            </span>
          </div>

          {/* Mobile: vertical list. Desktop: grid */}
          <div className="hidden sm:grid sm:grid-cols-6 lg:grid-cols-9 gap-2">
            {steps.map((step) => {
              const meta = STEP_META[step.id];
              return (
                <div
                  key={step.id}
                  className={cn(
                    "rounded-lg border p-2.5 text-center transition-all",
                    step.count > 0
                      ? "border-green-500/50 bg-green-500/10 shadow-sm shadow-green-500/20"
                      : "border-border/50 bg-card/30"
                  )}
                >
                  <span className="text-sm">{meta?.emoji}</span>
                  <div className={cn(
                    "text-xl font-bold mt-0.5",
                    step.count > 0 ? "text-green-400" : "text-muted-foreground/40"
                  )}>
                    {step.count}
                  </div>
                  <div className="text-[9px] text-muted-foreground leading-tight mt-0.5 truncate">
                    {step.shortLabel}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mobile list */}
          <div className="sm:hidden space-y-1">
            {steps.map((step, i) => {
              const meta = STEP_META[step.id];
              return (
                <div
                  key={step.id}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2 transition-all",
                    step.count > 0
                      ? "bg-green-500/10 border border-green-500/30"
                      : "bg-card/30 border border-transparent"
                  )}
                >
                  <span className="text-sm w-6 text-center">{meta?.emoji}</span>
                  <span className="text-xs text-muted-foreground w-4 tabular-nums">{i + 1}.</span>
                  <span className="text-xs font-medium text-foreground flex-1 truncate">{step.label}</span>
                  <span className={cn(
                    "text-sm font-bold tabular-nums min-w-[24px] text-right",
                    step.count > 0 ? "text-green-400" : "text-muted-foreground/40"
                  )}>
                    {step.count}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* ─── Charts ──────────────────────────────── */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          <div className="rounded-xl border border-border bg-card p-3 sm:p-4">
            <h3 className="text-xs sm:text-sm font-semibold mb-3 flex items-center gap-2">
              <BarChart3 className="w-3.5 h-3.5 text-primary" /> Funil ({timeRange})
            </h3>
            <div className="h-48 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 8 }}
                    angle={-45}
                    textAnchor="end"
                    height={50}
                    stroke="hsl(var(--muted-foreground))"
                    interval={0}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 9 }} width={30} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="sessions" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-3 sm:p-4">
            <h3 className="text-xs sm:text-sm font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-primary" /> Tráfego/Hora ({timeRange})
            </h3>
            <div className="h-48 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="hour" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" interval={2} />
                  <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 9 }} width={30} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area
                    type="monotone"
                    dataKey="visits"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary) / 0.15)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* ─── Drop-off Table ──────────────────────── */}
        <section className="rounded-xl border border-border bg-card p-3 sm:p-4">
          <h3 className="text-xs sm:text-sm font-semibold mb-3 flex items-center gap-2">
            <ArrowDown className="w-3.5 h-3.5 text-destructive" /> Taxa de Abandono
          </h3>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-xs">
                  <th className="text-left py-2 px-3">#</th>
                  <th className="text-left py-2 px-3">Etapa</th>
                  <th className="text-right py-2 px-3">Sessões</th>
                  <th className="text-right py-2 px-3">Drop-off</th>
                  <th className="text-left py-2 px-3 w-40">Retenção</th>
                </tr>
              </thead>
              <tbody>
                {dropoffData.map((row, i) => (
                  <tr key={i} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                    <td className="py-2 px-3 text-muted-foreground text-xs">{i + 1}</td>
                    <td className="py-2 px-3 font-medium text-xs">
                      <span className="mr-1.5">{row.emoji}</span>{row.step}
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums text-xs">{row.sessions}</td>
                    <td className={cn(
                      "py-2 px-3 text-right tabular-nums font-semibold text-xs",
                      row.dropoff > 50 ? "text-red-400" : row.dropoff > 25 ? "text-yellow-400" : "text-green-400"
                    )}>
                      {row.dropoff}%
                    </td>
                    <td className="py-2 px-3">
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            row.dropoff > 50 ? "bg-red-500" : row.dropoff > 25 ? "bg-yellow-500" : "bg-green-500"
                          )}
                          style={{ width: `${Math.max(100 - row.dropoff, 2)}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-1.5">
            {dropoffData.map((row, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg px-3 py-2 bg-card/50 border border-border/30">
                <span className="text-xs text-muted-foreground w-4 tabular-nums">{i + 1}</span>
                <span className="text-sm">{row.emoji}</span>
                <span className="text-xs font-medium flex-1 truncate">{row.short}</span>
                <span className="text-xs tabular-nums text-muted-foreground">{row.sessions}</span>
                <span className={cn(
                  "text-xs font-bold tabular-nums min-w-[36px] text-right",
                  row.dropoff > 50 ? "text-red-400" : row.dropoff > 25 ? "text-yellow-400" : "text-green-400"
                )}>
                  {row.dropoff}%
                </span>
                <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      row.dropoff > 50 ? "bg-red-500" : row.dropoff > 25 ? "bg-yellow-500" : "bg-green-500"
                    )}
                    style={{ width: `${Math.max(100 - row.dropoff, 5)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Event Intelligence Feed ─────────────── */}
        <section className="rounded-xl border border-border bg-card p-3 sm:p-4">
          <h3 className="text-xs sm:text-sm font-semibold mb-3 flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-primary" /> Eventos do Funil ({timeRange})
            <Badge variant="secondary" className="text-[10px] ml-auto">{funnelEvents.length} eventos</Badge>
          </h3>

          {/* Event summary cards */}
          {(() => {
            const counts: Record<string, number> = {};
            funnelEvents.forEach(e => { counts[e.event_name] = (counts[e.event_name] || 0) + 1; });
            const eventLabels: Record<string, { label: string; color: string }> = {
              step_viewed: { label: "Visualizações", color: "text-blue-400" },
              step_completed: { label: "Completas", color: "text-green-400" },
              checkout_click: { label: "Cliques Checkout", color: "text-accent" },
              lead_captured: { label: "Leads", color: "text-primary" },
              offer_page_viewed: { label: "Viram Oferta", color: "text-yellow-400" },
              offer_cta_revealed: { label: "CTA Revelado", color: "text-purple-400" },
            };
            return (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 mb-3">
                {Object.entries(eventLabels).map(([key, { label, color }]) => (
                  <div key={key} className="text-center p-2 rounded-lg bg-secondary/30 border border-border/30">
                    <p className={cn("text-lg font-bold tabular-nums", color)}>{counts[key] || 0}</p>
                    <p className="text-[9px] text-muted-foreground leading-tight">{label}</p>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Recent events feed */}
          <div className="max-h-64 overflow-y-auto space-y-1">
            {funnelEvents.slice(0, 50).map((evt, i) => {
              const data = evt.event_data as Record<string, unknown> | null;
              const stepName = data?.step_name as string || "";
              const answer = data?.answer_value as string || "";
              const timeSpent = data?.time_spent_seconds as number || 0;

              return (
                <div key={i} className="flex items-center gap-2 text-xs px-2 py-1.5 rounded-md hover:bg-muted/20 transition-colors">
                  <span className="text-[10px] text-muted-foreground tabular-nums w-14 shrink-0">
                    {new Date(evt.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </span>
                  <Badge variant={
                    evt.event_name === "checkout_click" ? "destructive" :
                    evt.event_name === "lead_captured" ? "default" : "secondary"
                  } className="text-[9px] px-1.5 py-0 shrink-0">
                    {evt.event_name.replace(/_/g, " ")}
                  </Badge>
                  {stepName && <span className="text-muted-foreground truncate">{stepName}</span>}
                  {answer && <span className="text-primary font-medium truncate">→ {answer}</span>}
                  {timeSpent > 0 && <span className="text-muted-foreground/60 shrink-0">{timeSpent}s</span>}
                  <span className="text-muted-foreground/40 ml-auto shrink-0 truncate max-w-[60px]">{evt.session_id.slice(-6)}</span>
                </div>
              );
            })}
            {funnelEvents.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">Nenhum evento registrado neste período</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Live;
