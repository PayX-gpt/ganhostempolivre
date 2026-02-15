import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Users, Eye, Activity, Clock, TrendingUp, BarChart3, ArrowDown, Zap, Table, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import LiveIntelligence from "@/components/LiveIntelligence";
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
  const [responsesPage, setResponsesPage] = useState(0);
  const RESPONSES_PER_PAGE = 20;

  // ─── Active leads tracking (individual leads per step) ──
  const [activeLeads, setActiveLeads] = useState<Map<string, { step: string; lastSeen: string }>>(new Map());

  // Helper: rebuild steps counts from activeLeads map
  const rebuildCounts = useCallback((leadsMap: Map<string, { step: string; lastSeen: string }>) => {
    const counts: Record<string, Set<string>> = {};
    STEP_SLUGS.forEach(s => { counts[s] = new Set(); });
    let total = 0;
    leadsMap.forEach((val, sid) => {
      if (counts[val.step]) {
        counts[val.step].add(sid);
        total++;
      }
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

  // ─── Real-time presence (Supabase Presence channel) ─────
  const processPresence = useCallback((state: Record<string, PresenceEntry[]>) => {
    const leadsMap = new Map<string, { step: string; lastSeen: string }>();

    Object.entries(state).forEach(([sessionId, presences]) => {
      if (!presences.length) return;
      const p = presences[0];
      const pageId = p.page_id || "";
      if (pageId.includes("/live") || pageId.includes("/admin")) return;

      const matched = STEP_SLUGS.find(slug => pageId.includes(`/${slug}`));
      if (matched) {
        leadsMap.set(sessionId, { step: matched, lastSeen: p.joined_at || new Date().toISOString() });
      }
    });

    setActiveLeads(prev => {
      const merged = new Map(prev);
      leadsMap.forEach((val, key) => merged.set(key, val));
      // Remove leads no longer in presence
      prev.forEach((_, key) => {
        if (!leadsMap.has(key)) {
          // Keep if recently seen via DB (within 90s), otherwise remove
          const existing = merged.get(key);
          if (existing && (Date.now() - new Date(existing.lastSeen).getTime()) > 90000) {
            merged.delete(key);
          }
        }
      });
      rebuildCounts(merged);
      return merged;
    });
  }, [rebuildCounts]);

  useEffect(() => {
    const channel = supabase.channel("funnel-presence");
    channel
      .on("presence", { event: "sync" }, () => processPresence(channel.presenceState() as any))
      .on("presence", { event: "join" }, () => processPresence(channel.presenceState() as any))
      .on("presence", { event: "leave" }, () => processPresence(channel.presenceState() as any))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [processPresence]);

  // ─── Real-time DB subscription: instant step changes ────
  useEffect(() => {
    const channel = supabase
      .channel("live-funnel-events")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "funnel_events",
          filter: "event_name=eq.step_viewed",
        },
        (payload) => {
          const row = payload.new as { session_id: string; event_data: Record<string, unknown> | null; created_at: string };
          const step = (row.event_data as any)?.step as string;
          if (!step || !STEP_SLUGS.includes(step)) return;

          setActiveLeads(prev => {
            const updated = new Map(prev);
            updated.set(row.session_id, { step, lastSeen: row.created_at });
            rebuildCounts(updated);
            return updated;
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [rebuildCounts]);

  // ─── Polling fallback (every 15s) + cleanup stale leads ─
  const fetchRecentPresence = useCallback(async () => {
    const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    const { data } = await supabase
      .from("funnel_events")
      .select("session_id, event_data, created_at")
      .eq("event_name", "step_viewed")
      .gte("created_at", twoMinAgo)
      .order("created_at", { ascending: false })
      .limit(500);

    if (!data) return;

    const sessionLatest = new Map<string, { step: string; lastSeen: string }>();
    (data as { session_id: string; event_data: Record<string, unknown> | null; created_at: string }[]).forEach(row => {
      if (sessionLatest.has(row.session_id)) return;
      const step = (row.event_data as any)?.step as string;
      if (step && STEP_SLUGS.includes(step)) {
        sessionLatest.set(row.session_id, { step, lastSeen: row.created_at });
      }
    });

    setActiveLeads(prev => {
      const merged = new Map<string, { step: string; lastSeen: string }>();
      // Keep DB-fresh sessions
      sessionLatest.forEach((val, key) => merged.set(key, val));
      // Keep realtime presence sessions even if not in DB yet
      prev.forEach((val, key) => {
        if (!merged.has(key) && (Date.now() - new Date(val.lastSeen).getTime()) < 120000) {
          merged.set(key, val);
        }
      });
      rebuildCounts(merged);
      return merged;
    });
  }, [rebuildCounts]);

  useEffect(() => {
    fetchRecentPresence();
    const interval = setInterval(fetchRecentPresence, 15000);
    return () => clearInterval(interval);
  }, [fetchRecentPresence]);

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
      .limit(1000);

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
    const lastStep = stepSessions["step-19"]?.size || 0;
    const conversionRate = firstStep > 0 ? ((lastStep / firstStep) * 100).toFixed(1) : "0.0";

    return { funnelChart, hourlyChart, uniqueSessions: allSessions.size, dropoffData, conversionRate };
  }, [auditData]);

  // ─── Build responses table data ─────────────────────────
  const ANSWER_STEP_MAP: Record<string, string> = {
    intro: "step-1", idade: "step-2", nome: "step-3", prova_social: "step-4",
    tentou_online: "step-5", meta_renda: "step-6", obstaculo: "step-7",
    sonho_financeiro: "step-8", saldo_conta: "step-9", video_mentor: "step-10",
    dispositivo: "step-11", disponibilidade: "step-12", demo_plataforma: "step-13",
    loading: "step-14", prova_social_2: "step-15", whatsapp_proof: "step-16",
    metodo_contato: "step-17", input_contato: "step-18", oferta_final: "step-19",
  };

  const responsesData = useMemo(() => {
    // Group events by session
    const sessions: Record<string, {
      id: string;
      firstSeen: string;
      lastStep: string;
      answers: Record<string, string>;
      stepsCompleted: Set<string>;
    }> = {};

    funnelEvents.forEach(evt => {
      const data = evt.event_data as Record<string, unknown> | null;
      if (!data) return;
      const sid = evt.session_id;
      if (!sessions[sid]) {
        sessions[sid] = {
          id: sid,
          firstSeen: evt.created_at,
          lastStep: "",
          answers: {},
          stepsCompleted: new Set(),
        };
      }
      const s = sessions[sid];
      // Track earlier timestamps
      if (evt.created_at < s.firstSeen) s.firstSeen = evt.created_at;

      const stepName = data.step_name as string || "";
      const stepSlug = data.step as string || "";
      const answer = data.answer_value as string || "";

      if (evt.event_name === "step_viewed" || evt.event_name === "step_completed") {
        if (stepSlug) s.stepsCompleted.add(stepSlug);
      }
      if (evt.event_name === "step_completed" && stepSlug) {
        s.lastStep = stepSlug;
        if (answer) {
          s.answers[stepSlug] = answer;
        } else {
          // For steps without answer (click-through), mark as completed
          s.answers[stepSlug] = "✓";
        }
      }
      // Capture lead data
      if (evt.event_name === "lead_captured") {
        const contact = (data.contact_value || data.email || data.phone || "") as string;
        if (contact) s.answers["contact"] = contact;
      }
      if (evt.event_name === "checkout_click") {
        s.answers["checkout"] = "clicou";
      }
    });

    // Convert to sorted array
    return Object.values(sessions)
      .sort((a, b) => b.firstSeen.localeCompare(a.firstSeen));
  }, [funnelEvents]);

  const totalResponses = responsesData.length;
  const leadsCount = responsesData.filter(s => s.answers["contact"]).length;
  const checkoutClicks = responsesData.filter(s => s.answers["checkout"]).length;
  const completedFlows = responsesData.filter(s => s.stepsCompleted.has("step-19")).length;
  const interactionRate = totalResponses > 0 ? ((responsesData.filter(s => s.stepsCompleted.size > 1).length / totalResponses) * 100).toFixed(1) : "0";

  const totalPages = Math.ceil(totalResponses / RESPONSES_PER_PAGE);
  const paginatedResponses = responsesData.slice(
    responsesPage * RESPONSES_PER_PAGE,
    (responsesPage + 1) * RESPONSES_PER_PAGE
  );

  // Steps that capture answers (columns for the table)
  const ANSWER_COLUMNS = [
    { slug: "step-1", label: "Intro", short: "Intro" },
    { slug: "step-2", label: "Idade", short: "Idade" },
    { slug: "step-3", label: "Nome", short: "Nome" },
    { slug: "step-5", label: "Online?", short: "Online" },
    { slug: "step-6", label: "Meta Renda", short: "Meta" },
    { slug: "step-7", label: "Obstáculo", short: "Obstác." },
    { slug: "step-8", label: "Sonho", short: "Sonho" },
    { slug: "step-9", label: "Saldo", short: "Saldo" },
    { slug: "step-11", label: "Dispositivo", short: "Device" },
    { slug: "step-12", label: "Disponib.", short: "Tempo" },
    { slug: "step-17", label: "Contato", short: "Contato" },
  ];

  const exportCSV = useCallback(() => {
    const headers = ["#", "ID Lead", "Data", ...ANSWER_COLUMNS.map(c => c.label), "Contato", "Checkout"];
    const rows = responsesData.map((s, i) => [
      i + 1,
      s.id.slice(-6),
      new Date(s.firstSeen).toLocaleDateString("pt-BR"),
      ...ANSWER_COLUMNS.map(c => s.answers[c.slug] || "—"),
      s.answers["contact"] || "—",
      s.answers["checkout"] || "—",
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.map(v => `"${v}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `respostas-funil-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [responsesData]);

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
          <StatCard label="Na oferta" value={steps.find(s => s.id === "step-19")?.count || 0} icon={<Eye className="w-3.5 h-3.5" />} accent />
        </div>

        {/* ─── Live Presence Grid ──────────────────── */}
        <section className="rounded-xl border border-border bg-card p-3 sm:p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs sm:text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <Eye className="w-3.5 h-3.5" /> PRESENÇA EM TEMPO REAL
            </h2>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1 text-xs border-primary/40 text-primary">
                <Users className="w-3 h-3" />
                {totalOnline} online
              </Badge>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {lastUpdated.toLocaleTimeString("pt-BR")}
              </span>
            </div>
          </div>

          {/* Desktop: grid with leads */}
          <div className="hidden sm:grid sm:grid-cols-6 lg:grid-cols-9 gap-2">
            {steps.map((step) => {
              const meta = STEP_META[step.id];
              const leadsInStep = Array.from(activeLeads.entries()).filter(([, v]) => v.step === step.id);
              return (
                <div
                  key={step.id}
                  className={cn(
                    "rounded-lg border p-2.5 text-center transition-all",
                    step.count > 0
                      ? "border-primary/50 bg-primary/10 shadow-sm shadow-primary/20"
                      : "border-border/50 bg-card/30"
                  )}
                >
                  <span className="text-sm">{meta?.emoji}</span>
                  <div className={cn(
                    "text-xl font-bold mt-0.5",
                    step.count > 0 ? "text-primary" : "text-muted-foreground/40"
                  )}>
                    {step.count}
                  </div>
                  <div className="text-[9px] text-muted-foreground leading-tight mt-0.5 truncate">
                    {step.shortLabel}
                  </div>
                  {leadsInStep.length > 0 && (
                    <div className="mt-1.5 space-y-0.5">
                      {leadsInStep.slice(0, 3).map(([sid]) => (
                        <div key={sid} className="text-[8px] bg-primary/20 rounded px-1 py-0.5 text-primary truncate">
                          👤 {sid.slice(-6)}
                        </div>
                      ))}
                      {leadsInStep.length > 3 && (
                        <div className="text-[8px] text-muted-foreground">+{leadsInStep.length - 3}</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Mobile list with leads */}
          <div className="sm:hidden space-y-1">
            {steps.map((step, i) => {
              const meta = STEP_META[step.id];
              const leadsInStep = Array.from(activeLeads.entries()).filter(([, v]) => v.step === step.id);
              return (
                <div key={step.id}>
                  <div
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2 transition-all",
                      step.count > 0
                        ? "bg-primary/10 border border-primary/30"
                        : "bg-card/30 border border-transparent"
                    )}
                  >
                    <span className="text-sm w-6 text-center">{meta?.emoji}</span>
                    <span className="text-xs text-muted-foreground w-4 tabular-nums">{i + 1}.</span>
                    <span className="text-xs font-medium text-foreground flex-1 truncate">{step.label}</span>
                    <span className={cn(
                      "text-sm font-bold tabular-nums min-w-[24px] text-right",
                      step.count > 0 ? "text-primary" : "text-muted-foreground/40"
                    )}>
                      {step.count}
                    </span>
                  </div>
                  {leadsInStep.length > 0 && (
                    <div className="ml-12 mt-0.5 mb-1 flex flex-wrap gap-1">
                      {leadsInStep.map(([sid]) => (
                        <span key={sid} className="text-[10px] bg-primary/15 text-primary rounded-full px-2 py-0.5">
                          👤 {sid.slice(-6)}
                        </span>
                      ))}
                    </div>
                  )}
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

        {/* ─── BEHAVIORAL INTELLIGENCE ─────────────── */}
        <LiveIntelligence />

        {/* ─── RESPOSTAS DO FUNIL (spreadsheet view) ── */}
        <section className="rounded-xl border border-border bg-card p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
            <h3 className="text-xs sm:text-sm font-semibold flex items-center gap-2">
              <Table className="w-3.5 h-3.5 text-primary" /> Respostas do Funil
              <Badge variant="secondary" className="text-[10px]">{totalResponses} leads</Badge>
            </h3>
            <Button size="sm" variant="outline" onClick={exportCSV} className="h-7 text-xs gap-1.5">
              <Download className="w-3 h-3" /> Exportar CSV
            </Button>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
            <div className="text-center p-2.5 rounded-lg border border-border bg-secondary/20">
              <p className="text-lg sm:text-xl font-bold tabular-nums text-foreground">{totalResponses}</p>
              <p className="text-[10px] text-muted-foreground">Visitas</p>
            </div>
            <div className="text-center p-2.5 rounded-lg border border-border bg-secondary/20">
              <p className="text-lg sm:text-xl font-bold tabular-nums text-foreground">{leadsCount}</p>
              <p className="text-[10px] text-muted-foreground">Leads</p>
            </div>
            <div className="text-center p-2.5 rounded-lg border border-primary/30 bg-primary/5">
              <p className="text-lg sm:text-xl font-bold tabular-nums text-primary">{interactionRate}%</p>
              <p className="text-[10px] text-muted-foreground">Taxa interação</p>
            </div>
            <div className="text-center p-2.5 rounded-lg border border-border bg-secondary/20">
              <p className="text-lg sm:text-xl font-bold tabular-nums text-foreground">{checkoutClicks}</p>
              <p className="text-[10px] text-muted-foreground">Checkout</p>
            </div>
            <div className="text-center p-2.5 rounded-lg border border-border bg-secondary/20">
              <p className="text-lg sm:text-xl font-bold tabular-nums text-foreground">{completedFlows}</p>
              <p className="text-[10px] text-muted-foreground">Fluxos completos</p>
            </div>
          </div>

          {/* Desktop: horizontal scroll table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-xs min-w-[900px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2 text-muted-foreground font-medium sticky left-0 bg-card z-10 min-w-[40px]">#</th>
                  <th className="text-left py-2 px-2 text-muted-foreground font-medium sticky left-[40px] bg-card z-10 min-w-[70px]">Lead</th>
                  <th className="text-left py-2 px-2 text-muted-foreground font-medium min-w-[80px]">Data</th>
                  {ANSWER_COLUMNS.map(col => {
                    // Calculate completion % for this column
                    const filled = responsesData.filter(s => s.answers[col.slug] && s.answers[col.slug] !== "—").length;
                    const pct = totalResponses > 0 ? Math.round((filled / totalResponses) * 100) : 0;
                    return (
                      <th key={col.slug} className="text-left py-2 px-2 text-muted-foreground font-medium min-w-[90px]">
                        <div className="flex flex-col gap-0.5">
                          <span>{col.short}</span>
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] tabular-nums">{pct}%</span>
                            <div className="w-8 h-1 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-primary/60 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        </div>
                      </th>
                    );
                  })}
                  <th className="text-left py-2 px-2 text-muted-foreground font-medium min-w-[100px]">Contato</th>
                  <th className="text-left py-2 px-2 text-muted-foreground font-medium min-w-[70px]">Checkout</th>
                </tr>
              </thead>
              <tbody>
                {paginatedResponses.map((session, i) => (
                  <tr key={session.id} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                    <td className="py-2 px-2 text-muted-foreground tabular-nums sticky left-0 bg-card">
                      {responsesPage * RESPONSES_PER_PAGE + i + 1}
                    </td>
                    <td className="py-2 px-2 font-mono text-muted-foreground sticky left-[40px] bg-card">
                      {session.id.slice(-6)}
                    </td>
                    <td className="py-2 px-2 text-muted-foreground tabular-nums">
                      {new Date(session.firstSeen).toLocaleDateString("pt-BR")}
                    </td>
                    {ANSWER_COLUMNS.map(col => {
                      const val = session.answers[col.slug];
                      return (
                        <td key={col.slug} className="py-2 px-2">
                          {val ? (
                            val === "✓" ? (
                              <span className="text-primary font-medium">✓</span>
                            ) : (
                              <span className="text-foreground font-medium truncate block max-w-[120px]" title={val}>
                                {val}
                              </span>
                            )
                          ) : (
                            <span className="text-muted-foreground/30">—</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="py-2 px-2">
                      {session.answers["contact"] ? (
                        <span className="text-primary font-medium truncate block max-w-[120px]" title={session.answers["contact"]}>
                          {session.answers["contact"]}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/30">—</span>
                      )}
                    </td>
                    <td className="py-2 px-2">
                      {session.answers["checkout"] ? (
                        <Badge variant="default" className="text-[9px] px-1.5 py-0">clicou</Badge>
                      ) : (
                        <span className="text-muted-foreground/30">—</span>
                      )}
                    </td>
                  </tr>
                ))}
                {paginatedResponses.length === 0 && (
                  <tr>
                    <td colSpan={ANSWER_COLUMNS.length + 4} className="py-8 text-center text-muted-foreground text-sm">
                      Nenhuma resposta registrada neste período
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile: card list */}
          <div className="sm:hidden space-y-2">
            {paginatedResponses.map((session, i) => (
              <div key={session.id} className="rounded-lg border border-border/40 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground tabular-nums">#{responsesPage * RESPONSES_PER_PAGE + i + 1}</span>
                    <span className="text-xs font-mono text-muted-foreground">{session.id.slice(-6)}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(session.firstSeen).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {ANSWER_COLUMNS.filter(col => session.answers[col.slug]).map(col => (
                    <div key={col.slug} className="bg-secondary/30 rounded px-2 py-1">
                      <p className="text-[9px] text-muted-foreground uppercase">{col.short}</p>
                      <p className="text-xs font-medium text-foreground truncate">
                        {session.answers[col.slug]}
                      </p>
                    </div>
                  ))}
                  {session.answers["contact"] && (
                    <div className="bg-primary/10 rounded px-2 py-1 col-span-2">
                      <p className="text-[9px] text-muted-foreground uppercase">Contato</p>
                      <p className="text-xs font-medium text-primary truncate">{session.answers["contact"]}</p>
                    </div>
                  )}
                </div>
                {session.answers["checkout"] && (
                  <Badge variant="default" className="text-[9px]">Clicou no checkout</Badge>
                )}
              </div>
            ))}
            {paginatedResponses.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">Nenhuma resposta neste período</p>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
              <span className="text-[10px] text-muted-foreground">
                {responsesPage * RESPONSES_PER_PAGE + 1}–{Math.min((responsesPage + 1) * RESPONSES_PER_PAGE, totalResponses)} de {totalResponses}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={responsesPage === 0}
                  onClick={() => setResponsesPage(p => p - 1)}
                  className="h-7 w-7 p-0"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>
                <span className="text-xs text-muted-foreground tabular-nums px-2">
                  {responsesPage + 1}/{totalPages}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={responsesPage >= totalPages - 1}
                  onClick={() => setResponsesPage(p => p + 1)}
                  className="h-7 w-7 p-0"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Live;
