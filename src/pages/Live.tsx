import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  RefreshCw, Users, Eye, Activity, Clock, TrendingUp, BarChart3,
  ArrowDown, Zap, Table, Download, ChevronLeft, ChevronRight,
  Volume2, Bell, Radio, DollarSign, ShoppingCart, CreditCard, Target,
} from "lucide-react";
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

const STEP_META: Record<string, { label: string; short: string; icon: React.ReactNode }> = {
  "step-1":  { label: "Intro",           short: "Início",   icon: <Users className="w-5 h-5" /> },
  "step-2":  { label: "Idade",           short: "Idade",    icon: <Eye className="w-5 h-5" /> },
  "step-3":  { label: "Nome",            short: "Nome",     icon: <Eye className="w-5 h-5" /> },
  "step-4":  { label: "Prova Social",    short: "Social",   icon: <Eye className="w-5 h-5" /> },
  "step-5":  { label: "Tentou Online",   short: "Online",   icon: <Eye className="w-5 h-5" /> },
  "step-6":  { label: "Meta de Renda",   short: "Meta",     icon: <Eye className="w-5 h-5" /> },
  "step-7":  { label: "Obstáculo",       short: "Obstác.",  icon: <Eye className="w-5 h-5" /> },
  "step-8":  { label: "Sonho Financeiro",short: "Sonho",    icon: <Eye className="w-5 h-5" /> },
  "step-9":  { label: "Saldo na Conta",  short: "Saldo",    icon: <Eye className="w-5 h-5" /> },
  "step-10": { label: "Vídeo Mentor",    short: "Vídeo",    icon: <Eye className="w-5 h-5" /> },
  "step-11": { label: "Dispositivo",     short: "Device",   icon: <Eye className="w-5 h-5" /> },
  "step-12": { label: "Disponibilidade", short: "Tempo",    icon: <Eye className="w-5 h-5" /> },
  "step-13": { label: "Demo Plataforma", short: "Demo",     icon: <Eye className="w-5 h-5" /> },
  "step-14": { label: "Loading",         short: "Load",     icon: <Zap className="w-5 h-5" /> },
  "step-15": { label: "Prova Social 2",  short: "Social2",  icon: <Eye className="w-5 h-5" /> },
  "step-16": { label: "WhatsApp Proof",  short: "WA",       icon: <Eye className="w-5 h-5" /> },
  "step-17": { label: "Método Contato",  short: "Contato",  icon: <Eye className="w-5 h-5" /> },
  "step-18": { label: "Input Contato",   short: "Input",    icon: <Eye className="w-5 h-5" /> },
  "step-19": { label: "Oferta Final",    short: "Oferta",   icon: <ShoppingCart className="w-5 h-5" /> },
};

// ─── Section Card Wrapper ─────────────────────────────────
const SectionCard = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn(
    "rounded-2xl border border-border/60 bg-card/50 backdrop-blur-sm p-5 sm:p-6",
    className
  )}>
    {children}
  </div>
);

const SectionHeader = ({ icon, title, subtitle, right }: { icon: React.ReactNode; title: string; subtitle?: string; right?: React.ReactNode }) => (
  <div className="flex items-center justify-between mb-5">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center text-primary">
        {icon}
      </div>
      <div>
        <h2 className="text-base sm:text-lg font-bold text-foreground">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
    {right && <div className="flex items-center gap-2">{right}</div>}
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
  const [activeLeads, setActiveLeads] = useState<Map<string, { step: string; lastSeen: string }>>(new Map());

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
      prev.forEach((_, key) => {
        if (!leadsMap.has(key)) {
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

  useEffect(() => {
    const channel = supabase
      .channel("live-funnel-events")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "funnel_events", filter: "event_name=eq.step_viewed" },
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
      sessionLatest.forEach((val, key) => merged.set(key, val));
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

  // ─── Responses table ────────────────────────────────────
  const ANSWER_STEP_MAP: Record<string, string> = {
    intro: "step-1", idade: "step-2", nome: "step-3", prova_social: "step-4",
    tentou_online: "step-5", meta_renda: "step-6", obstaculo: "step-7",
    sonho_financeiro: "step-8", saldo_conta: "step-9", video_mentor: "step-10",
    dispositivo: "step-11", disponibilidade: "step-12", demo_plataforma: "step-13",
    loading: "step-14", prova_social_2: "step-15", whatsapp_proof: "step-16",
    metodo_contato: "step-17", input_contato: "step-18", oferta_final: "step-19",
  };

  const responsesData = useMemo(() => {
    const sessions: Record<string, {
      id: string; firstSeen: string; lastStep: string;
      answers: Record<string, string>; stepsCompleted: Set<string>;
    }> = {};
    funnelEvents.forEach(evt => {
      const data = evt.event_data as Record<string, unknown> | null;
      if (!data) return;
      const sid = evt.session_id;
      if (!sessions[sid]) {
        sessions[sid] = { id: sid, firstSeen: evt.created_at, lastStep: "", answers: {}, stepsCompleted: new Set() };
      }
      const s = sessions[sid];
      if (evt.created_at < s.firstSeen) s.firstSeen = evt.created_at;
      const stepSlug = data.step as string || "";
      const answer = data.answer_value as string || "";
      if (evt.event_name === "step_viewed" || evt.event_name === "step_completed") {
        if (stepSlug) s.stepsCompleted.add(stepSlug);
      }
      if (evt.event_name === "step_completed" && stepSlug) {
        s.lastStep = stepSlug;
        s.answers[stepSlug] = answer || "✓";
      }
      if (evt.event_name === "lead_captured") {
        const contact = (data.contact_value || data.email || data.phone || "") as string;
        if (contact) s.answers["contact"] = contact;
      }
      if (evt.event_name === "checkout_click") {
        s.answers["checkout"] = "clicou";
      }
    });
    return Object.values(sessions).sort((a, b) => b.firstSeen.localeCompare(a.firstSeen));
  }, [funnelEvents]);

  const totalResponses = responsesData.length;
  const leadsCount = responsesData.filter(s => s.answers["contact"]).length;
  const checkoutClicks = responsesData.filter(s => s.answers["checkout"]).length;
  const completedFlows = responsesData.filter(s => s.stepsCompleted.has("step-19")).length;
  const interactionRate = totalResponses > 0 ? ((responsesData.filter(s => s.stepsCompleted.size > 1).length / totalResponses) * 100).toFixed(1) : "0";
  const totalPages = Math.ceil(totalResponses / RESPONSES_PER_PAGE);
  const paginatedResponses = responsesData.slice(responsesPage * RESPONSES_PER_PAGE, (responsesPage + 1) * RESPONSES_PER_PAGE);

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
      i + 1, s.id.slice(-6),
      new Date(s.firstSeen).toLocaleDateString("pt-BR"),
      ...ANSWER_COLUMNS.map(c => s.answers[c.slug] || "—"),
      s.answers["contact"] || "—", s.answers["checkout"] || "—",
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
    background: "hsl(220 25% 10%)",
    border: "1px solid hsl(220 15% 20%)",
    borderRadius: "12px",
    color: "#e2e8f0",
    fontSize: "12px",
    padding: "8px 12px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
  };

  return (
    <div className="min-h-screen bg-[hsl(220,25%,6%)] text-foreground">
      {/* ─── Header ──────────────────────────────── */}
      <header className="border-b border-border/40 bg-[hsl(220,25%,8%)]/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">
                <span className="text-primary">Dashboard</span>
              </h1>
              <p className="text-[11px] text-muted-foreground -mt-0.5">Monitoramento em tempo real</p>
            </div>
            <Badge className="ml-2 bg-primary/15 text-primary border-primary/30 gap-1.5 text-xs font-medium px-2.5 py-1">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              {totalOnline} online
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1 bg-[hsl(220,20%,12%)] rounded-xl p-1 border border-border/30">
              {(["1h", "6h", "24h"] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTimeRange(t)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    timeRange === t
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "text-muted-foreground hover:text-foreground hover:bg-[hsl(220,20%,16%)]"
                  )}
                >
                  {t === "24h" ? "24 horas" : t}
                </button>
              ))}
            </div>
            <button
              onClick={() => { fetchAuditData(); fetchFunnelEvents(); }}
              className="w-9 h-9 rounded-xl bg-[hsl(220,20%,12%)] border border-border/30 flex items-center justify-center hover:bg-[hsl(220,20%,16%)] transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
            </button>
            <button
              onClick={exportCSV}
              className="w-9 h-9 rounded-xl bg-[hsl(220,20%,12%)] border border-border/30 flex items-center justify-center hover:bg-[hsl(220,20%,16%)] transition-colors"
            >
              <Download className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-5 sm:py-8 space-y-5 sm:space-y-6">

        {/* ─── Top Stats Row ───────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: "Receita Hoje", value: "—", sub: `${uniqueSessions} sessões`, icon: <DollarSign className="w-5 h-5" />, iconBg: "bg-primary/15 text-primary" },
            { label: "Sessões Hoje", value: uniqueSessions, sub: null, icon: <ShoppingCart className="w-5 h-5" />, iconBg: "bg-blue-500/15 text-blue-400" },
            { label: "Taxa de Conversão", value: `${conversionRate}%`, sub: `${completedFlows} completos`, icon: <CreditCard className="w-5 h-5" />, iconBg: "bg-purple-500/15 text-purple-400" },
            { label: "Online Agora", value: totalOnline, sub: null, icon: <Target className="w-5 h-5" />, iconBg: "bg-emerald-500/15 text-emerald-400", accent: true },
          ].map((stat, i) => (
            <div key={i} className={cn(
              "rounded-2xl border p-4 sm:p-5 flex items-start justify-between transition-all",
              stat.accent
                ? "border-primary/30 bg-primary/5"
                : "border-border/40 bg-[hsl(220,20%,10%)]"
            )}>
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
                <p className={cn(
                  "text-2xl sm:text-3xl font-bold tabular-nums tracking-tight",
                  stat.accent ? "text-primary" : "text-foreground"
                )}>
                  {stat.value}
                </p>
                {stat.sub && <p className="text-[11px] text-primary/70">↗ {stat.sub}</p>}
              </div>
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", stat.iconBg)}>
                {stat.icon}
              </div>
            </div>
          ))}
        </div>

        {/* ─── Usuários no Funil ───────────────────── */}
        <SectionCard>
          <SectionHeader
            icon={<Users className="w-5 h-5" />}
            title="Usuários no Funil"
            subtitle="Tempo real"
            right={
              <div className="flex items-center gap-3">
                <Badge className="bg-primary/15 text-primary border-primary/30 gap-1.5 text-xs px-2.5 py-1">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  {totalOnline} online
                </Badge>
                <button onClick={fetchRecentPresence} className="text-muted-foreground hover:text-foreground transition-colors">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            }
          />

          <div className="grid grid-cols-4 sm:grid-cols-7 lg:grid-cols-10 gap-2 sm:gap-3">
            {steps.map((step) => {
              const meta = STEP_META[step.id];
              return (
                <div
                  key={step.id}
                  className={cn(
                    "rounded-xl border p-3 sm:p-4 text-center transition-all",
                    step.count > 0
                      ? "border-primary/40 bg-primary/10 shadow-md shadow-primary/10"
                      : "border-border/30 bg-[hsl(220,20%,10%)]"
                  )}
                >
                  <div className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center mx-auto mb-1.5",
                    step.count > 0 ? "bg-primary/20 text-primary" : "bg-muted/30 text-muted-foreground/50"
                  )}>
                    {meta?.icon}
                  </div>
                  <div className={cn(
                    "text-xl sm:text-2xl font-bold tabular-nums",
                    step.count > 0 ? "text-primary" : "text-muted-foreground/30"
                  )}>
                    {step.count}
                  </div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground leading-tight mt-0.5 truncate">
                    {step.shortLabel}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-muted-foreground text-center mt-4">
            Atualizado: {lastUpdated.toLocaleTimeString("pt-BR")}
          </p>
        </SectionCard>

        {/* ─── Performance Charts ──────────────────── */}
        <SectionCard>
          <SectionHeader
            icon={<TrendingUp className="w-5 h-5" />}
            title={`Performance ${timeRange}`}
            subtitle="Receita e sessões por hora"
            right={
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                  Sessões
                </div>
                <button onClick={fetchAuditData} className="text-muted-foreground hover:text-foreground transition-colors">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            }
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
            <div className="rounded-xl border border-border/30 bg-[hsl(220,20%,10%)] p-4">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Sessões {timeRange}</span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-foreground tabular-nums">{uniqueSessions}</p>
            </div>
            <div className="rounded-xl border border-border/30 bg-[hsl(220,20%,10%)] p-4">
              <div className="flex items-center gap-2 mb-1">
                <ShoppingCart className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Checkout Clicks {timeRange}</span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-foreground tabular-nums">{checkoutClicks}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="h-56 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,18%)" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 9, fill: "hsl(220,10%,50%)" }}
                    angle={-45}
                    textAnchor="end"
                    height={50}
                    stroke="hsl(220,15%,18%)"
                    interval={0}
                  />
                  <YAxis stroke="hsl(220,15%,18%)" tick={{ fontSize: 10, fill: "hsl(220,10%,50%)" }} width={35} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="sessions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="h-56 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,18%)" />
                  <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "hsl(220,10%,50%)" }} stroke="hsl(220,15%,18%)" interval={2} />
                  <YAxis stroke="hsl(220,15%,18%)" tick={{ fontSize: 10, fill: "hsl(220,10%,50%)" }} width={35} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area
                    type="monotone"
                    dataKey="visits"
                    stroke="hsl(var(--primary))"
                    fill="url(#greenGradient)"
                    strokeWidth={2.5}
                  />
                  <defs>
                    <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </SectionCard>

        {/* ─── Drop-off Table ──────────────────────── */}
        <SectionCard>
          <SectionHeader
            icon={<ArrowDown className="w-5 h-5" />}
            title="Taxa de Abandono"
            subtitle="Onde seus leads estão saindo"
          />

          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30 text-muted-foreground text-xs">
                  <th className="text-left py-3 px-4">#</th>
                  <th className="text-left py-3 px-4">Etapa</th>
                  <th className="text-right py-3 px-4">Sessões</th>
                  <th className="text-right py-3 px-4">Drop-off</th>
                  <th className="text-left py-3 px-4 w-44">Retenção</th>
                </tr>
              </thead>
              <tbody>
                {dropoffData.map((row, i) => (
                  <tr key={i} className="border-b border-border/15 hover:bg-[hsl(220,20%,12%)] transition-colors">
                    <td className="py-3 px-4 text-muted-foreground text-xs tabular-nums">{i + 1}</td>
                    <td className="py-3 px-4 font-medium text-sm">{row.step}</td>
                    <td className="py-3 px-4 text-right tabular-nums text-sm">{row.sessions}</td>
                    <td className={cn(
                      "py-3 px-4 text-right tabular-nums font-semibold text-sm",
                      row.dropoff > 50 ? "text-red-400" : row.dropoff > 25 ? "text-yellow-400" : "text-primary"
                    )}>
                      {row.dropoff}%
                    </td>
                    <td className="py-3 px-4">
                      <div className="h-2 bg-[hsl(220,20%,14%)] rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            row.dropoff > 50 ? "bg-red-500" : row.dropoff > 25 ? "bg-yellow-500" : "bg-primary"
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

          <div className="sm:hidden space-y-1.5">
            {dropoffData.map((row, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-2.5 bg-[hsl(220,20%,10%)] border border-border/20">
                <span className="text-xs text-muted-foreground w-4 tabular-nums">{i + 1}</span>
                <span className="text-xs font-medium flex-1 truncate">{row.short}</span>
                <span className="text-xs tabular-nums text-muted-foreground">{row.sessions}</span>
                <span className={cn(
                  "text-xs font-bold tabular-nums min-w-[36px] text-right",
                  row.dropoff > 50 ? "text-red-400" : row.dropoff > 25 ? "text-yellow-400" : "text-primary"
                )}>
                  {row.dropoff}%
                </span>
                <div className="w-12 h-1.5 bg-[hsl(220,20%,14%)] rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      row.dropoff > 50 ? "bg-red-500" : row.dropoff > 25 ? "bg-yellow-500" : "bg-primary"
                    )}
                    style={{ width: `${Math.max(100 - row.dropoff, 5)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* ─── Eventos do Funil ────────────────────── */}
        <SectionCard>
          <SectionHeader
            icon={<Zap className="w-5 h-5" />}
            title={`Eventos do Funil`}
            subtitle={`Últimas ${timeRange}`}
            right={
              <Badge className="bg-[hsl(220,20%,12%)] text-muted-foreground border-border/30 text-xs">
                {funnelEvents.length} eventos
              </Badge>
            }
          />

          {(() => {
            const counts: Record<string, number> = {};
            funnelEvents.forEach(e => { counts[e.event_name] = (counts[e.event_name] || 0) + 1; });
            const eventLabels: Record<string, { label: string; color: string }> = {
              step_viewed: { label: "Visualizações", color: "text-blue-400" },
              step_completed: { label: "Completas", color: "text-primary" },
              checkout_click: { label: "Checkout", color: "text-yellow-400" },
              lead_captured: { label: "Leads", color: "text-purple-400" },
              offer_page_viewed: { label: "Viram Oferta", color: "text-orange-400" },
              offer_cta_revealed: { label: "CTA Revelado", color: "text-pink-400" },
            };
            return (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3 mb-5">
                {Object.entries(eventLabels).map(([key, { label, color }]) => (
                  <div key={key} className="text-center p-3 rounded-xl bg-[hsl(220,20%,10%)] border border-border/20">
                    <p className={cn("text-xl sm:text-2xl font-bold tabular-nums", color)}>{counts[key] || 0}</p>
                    <p className="text-[10px] text-muted-foreground leading-tight mt-1">{label}</p>
                  </div>
                ))}
              </div>
            );
          })()}

          <div className="max-h-72 overflow-y-auto space-y-0.5 custom-scrollbar">
            {funnelEvents.slice(0, 50).map((evt, i) => {
              const data = evt.event_data as Record<string, unknown> | null;
              const stepName = data?.step_name as string || "";
              const answer = data?.answer_value as string || "";
              const timeSpent = data?.time_spent_seconds as number || 0;
              return (
                <div key={i} className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg hover:bg-[hsl(220,20%,12%)] transition-colors">
                  <span className="text-[11px] text-muted-foreground/60 tabular-nums w-16 shrink-0">
                    {new Date(evt.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </span>
                  <Badge variant={
                    evt.event_name === "checkout_click" ? "destructive" :
                    evt.event_name === "lead_captured" ? "default" : "secondary"
                  } className="text-[10px] px-2 py-0.5 shrink-0 rounded-lg">
                    {evt.event_name.replace(/_/g, " ")}
                  </Badge>
                  {stepName && <span className="text-muted-foreground truncate">{stepName}</span>}
                  {answer && <span className="text-primary font-medium truncate">→ {answer}</span>}
                  {timeSpent > 0 && <span className="text-muted-foreground/50 shrink-0">{timeSpent}s</span>}
                  <span className="text-muted-foreground/30 ml-auto shrink-0 font-mono text-[10px]">{evt.session_id.slice(-6)}</span>
                </div>
              );
            })}
            {funnelEvents.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum evento registrado neste período</p>
            )}
          </div>
        </SectionCard>

        {/* ─── BEHAVIORAL INTELLIGENCE ─────────────── */}
        <LiveIntelligence />

        {/* ─── RESPOSTAS DO FUNIL ──────────────────── */}
        <SectionCard>
          <SectionHeader
            icon={<Table className="w-5 h-5" />}
            title="Respostas do Funil"
            subtitle={`${totalResponses} leads rastreados`}
            right={
              <Button size="sm" variant="outline" onClick={exportCSV} className="h-8 text-xs gap-1.5 rounded-xl border-border/40 bg-[hsl(220,20%,12%)] hover:bg-[hsl(220,20%,16%)]">
                <Download className="w-3.5 h-3.5" /> Exportar CSV
              </Button>
            }
          />

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 mb-5">
            {[
              { label: "Visitas", value: totalResponses },
              { label: "Leads", value: leadsCount },
              { label: "Taxa interação", value: `${interactionRate}%`, accent: true },
              { label: "Checkout", value: checkoutClicks },
              { label: "Fluxos completos", value: completedFlows },
            ].map((s, i) => (
              <div key={i} className={cn(
                "text-center p-3 sm:p-4 rounded-xl border",
                s.accent ? "border-primary/30 bg-primary/5" : "border-border/20 bg-[hsl(220,20%,10%)]"
              )}>
                <p className={cn("text-xl sm:text-2xl font-bold tabular-nums", s.accent ? "text-primary" : "text-foreground")}>{s.value}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-xs min-w-[900px]">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="text-left py-3 px-3 text-muted-foreground font-medium sticky left-0 bg-card/50 z-10 min-w-[40px]">#</th>
                  <th className="text-left py-3 px-3 text-muted-foreground font-medium sticky left-[40px] bg-card/50 z-10 min-w-[70px]">Lead</th>
                  <th className="text-left py-3 px-3 text-muted-foreground font-medium min-w-[80px]">Data</th>
                  {ANSWER_COLUMNS.map(col => {
                    const filled = responsesData.filter(s => s.answers[col.slug] && s.answers[col.slug] !== "—").length;
                    const pct = totalResponses > 0 ? Math.round((filled / totalResponses) * 100) : 0;
                    return (
                      <th key={col.slug} className="text-left py-3 px-3 text-muted-foreground font-medium min-w-[90px]">
                        <div className="flex flex-col gap-0.5">
                          <span>{col.short}</span>
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] tabular-nums">{pct}%</span>
                            <div className="w-8 h-1 bg-[hsl(220,20%,14%)] rounded-full overflow-hidden">
                              <div className="h-full bg-primary/60 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        </div>
                      </th>
                    );
                  })}
                  <th className="text-left py-3 px-3 text-muted-foreground font-medium min-w-[100px]">Contato</th>
                  <th className="text-left py-3 px-3 text-muted-foreground font-medium min-w-[70px]">Checkout</th>
                </tr>
              </thead>
              <tbody>
                {paginatedResponses.map((session, i) => (
                  <tr key={session.id} className="border-b border-border/10 hover:bg-[hsl(220,20%,12%)] transition-colors">
                    <td className="py-2.5 px-3 text-muted-foreground tabular-nums sticky left-0 bg-card/50">
                      {responsesPage * RESPONSES_PER_PAGE + i + 1}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-muted-foreground sticky left-[40px] bg-card/50">
                      {session.id.slice(-6)}
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground tabular-nums">
                      {new Date(session.firstSeen).toLocaleDateString("pt-BR")}
                    </td>
                    {ANSWER_COLUMNS.map(col => {
                      const val = session.answers[col.slug];
                      return (
                        <td key={col.slug} className="py-2.5 px-3">
                          {val ? (
                            val === "✓" ? (
                              <span className="text-primary font-medium">✓</span>
                            ) : (
                              <span className="text-foreground font-medium truncate block max-w-[120px]" title={val}>{val}</span>
                            )
                          ) : (
                            <span className="text-muted-foreground/20">—</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="py-2.5 px-3">
                      {session.answers["contact"] ? (
                        <span className="text-primary font-medium truncate block max-w-[120px]" title={session.answers["contact"]}>
                          {session.answers["contact"]}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/20">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      {session.answers["checkout"] ? (
                        <Badge className="text-[9px] px-2 py-0.5 bg-primary/15 text-primary border-primary/30 rounded-lg">clicou</Badge>
                      ) : (
                        <span className="text-muted-foreground/20">—</span>
                      )}
                    </td>
                  </tr>
                ))}
                {paginatedResponses.length === 0 && (
                  <tr>
                    <td colSpan={ANSWER_COLUMNS.length + 4} className="py-10 text-center text-muted-foreground text-sm">
                      Nenhuma resposta registrada neste período
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-2">
            {paginatedResponses.map((session, i) => (
              <div key={session.id} className="rounded-xl border border-border/20 bg-[hsl(220,20%,10%)] p-3 space-y-2">
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
                    <div key={col.slug} className="bg-[hsl(220,20%,14%)] rounded-lg px-2.5 py-1.5">
                      <p className="text-[9px] text-muted-foreground uppercase">{col.short}</p>
                      <p className="text-xs font-medium text-foreground truncate">{session.answers[col.slug]}</p>
                    </div>
                  ))}
                  {session.answers["contact"] && (
                    <div className="bg-primary/10 rounded-lg px-2.5 py-1.5 col-span-2">
                      <p className="text-[9px] text-muted-foreground uppercase">Contato</p>
                      <p className="text-xs font-medium text-primary truncate">{session.answers["contact"]}</p>
                    </div>
                  )}
                </div>
                {session.answers["checkout"] && (
                  <Badge className="text-[9px] bg-primary/15 text-primary border-primary/30 rounded-lg">Clicou no checkout</Badge>
                )}
              </div>
            ))}
            {paginatedResponses.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhuma resposta neste período</p>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/20">
              <span className="text-xs text-muted-foreground">
                {responsesPage * RESPONSES_PER_PAGE + 1}–{Math.min((responsesPage + 1) * RESPONSES_PER_PAGE, totalResponses)} de {totalResponses}
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={responsesPage === 0}
                  onClick={() => setResponsesPage(p => p - 1)}
                  className="h-8 w-8 p-0 rounded-xl"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-xs text-muted-foreground tabular-nums px-2">
                  {responsesPage + 1}/{totalPages}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={responsesPage >= totalPages - 1}
                  onClick={() => setResponsesPage(p => p + 1)}
                  className="h-8 w-8 p-0 rounded-xl"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </SectionCard>
      </main>
    </div>
  );
};

export default Live;
