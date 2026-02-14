import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Users, Eye, Activity, Clock, TrendingUp, BarChart3 } from "lucide-react";
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
  count: number;
}

interface AuditRow {
  page_id: string | null;
  session_id: string;
  created_at: string;
  event_type: string;
}

// ─── Auto-discover steps from STEP_SLUGS in QuizFunnel ───
const STEP_SLUGS = [
  "step-1","step-2","step-3","step-4","step-5","step-6","step-7","step-8",
  "step-9","step-10","step-11","step-12","step-13","step-14","step-15","step-16","step-17",
];

const STEP_LABELS: Record<string, string> = {
  "step-1": "Intro",
  "step-2": "Idade",
  "step-3": "Nome",
  "step-4": "Prova Social",
  "step-5": "Tentou Online",
  "step-6": "Meta de Renda",
  "step-7": "Obstáculo",
  "step-8": "Vídeo Mentor",
  "step-9": "Dispositivo",
  "step-10": "Disponibilidade",
  "step-11": "Demo Plataforma",
  "step-12": "Loading",
  "step-13": "Prova Social 2",
  "step-14": "WhatsApp Proof",
  "step-15": "Método Contato",
  "step-16": "Input Contato",
  "step-17": "Oferta Final",
};

const Live = () => {
  const [steps, setSteps] = useState<StepData[]>(
    STEP_SLUGS.map(s => ({ id: s, label: STEP_LABELS[s] || s, count: 0 }))
  );
  const [totalOnline, setTotalOnline] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [auditData, setAuditData] = useState<AuditRow[]>([]);
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

      // Match to step
      const matched = STEP_SLUGS.find(slug => pageId.includes(`/${slug}`));
      if (matched) {
        counts[matched].add(sessionId);
      }
      total++;
    });

    setSteps(STEP_SLUGS.map(s => ({
      id: s,
      label: STEP_LABELS[s] || s,
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

  useEffect(() => {
    fetchAuditData();
    const interval = setInterval(fetchAuditData, 30000);
    return () => clearInterval(interval);
  }, [fetchAuditData]);

  // ─── Computed analytics ─────────────────────────────────
  const { funnelChart, hourlyChart, uniqueSessions, dropoffData } = useMemo(() => {
    // Funnel chart - total unique sessions per step
    const stepSessions: Record<string, Set<string>> = {};
    STEP_SLUGS.forEach(s => { stepSessions[s] = new Set(); });

    auditData.forEach(row => {
      if (!row.page_id) return;
      const matched = STEP_SLUGS.find(slug => row.page_id!.includes(`/${slug}`));
      if (matched) stepSessions[matched].add(row.session_id);
    });

    const funnelChart = STEP_SLUGS.map(s => ({
      name: STEP_LABELS[s] || s,
      sessions: stepSessions[s].size,
    }));

    // Hourly chart
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

    // Unique sessions total
    const allSessions = new Set(auditData.map(r => r.session_id));

    // Drop-off
    const dropoffData = STEP_SLUGS.map((s, i) => {
      const current = stepSessions[s].size;
      const prev = i > 0 ? stepSessions[STEP_SLUGS[i - 1]].size : current;
      const dropoff = prev > 0 ? Math.round(((prev - current) / prev) * 100) : 0;
      return { step: STEP_LABELS[s] || s, dropoff, sessions: current };
    });

    return { funnelChart, hourlyChart, uniqueSessions: allSessions.size, dropoffData };
  }, [auditData]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            <h1 className="text-xl font-bold">
              <span className="text-primary">ALFA</span> HÍBRIDA — Painel Live
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="gap-1">
              <Users className="w-3 h-3" />
              {totalOnline} online
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Activity className="w-3 h-3" />
              {uniqueSessions} sessões ({timeRange})
            </Badge>
            <div className="flex gap-1">
              {(["1h", "6h", "24h"] as const).map(t => (
                <Button
                  key={t}
                  size="sm"
                  variant={timeRange === t ? "default" : "ghost"}
                  onClick={() => setTimeRange(t)}
                  className="text-xs h-7 px-2"
                >
                  {t}
                </Button>
              ))}
            </div>
            <Button size="sm" variant="ghost" onClick={fetchAuditData}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* ─── Live Presence Grid ──────────────────── */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
            <Eye className="w-4 h-4" /> PRESENÇA EM TEMPO REAL
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-2">
            {steps.map((step) => (
              <div
                key={step.id}
                className={cn(
                  "rounded-lg border p-3 text-center transition-all",
                  step.count > 0
                    ? "border-green-500/50 bg-green-500/10 shadow-sm shadow-green-500/20"
                    : "border-border bg-card/50"
                )}
              >
                <div className={cn(
                  "text-2xl font-bold",
                  step.count > 0 ? "text-green-400" : "text-muted-foreground"
                )}>
                  {step.count}
                </div>
                <div className="text-[10px] text-muted-foreground leading-tight mt-1 truncate">
                  {step.label}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            <Clock className="w-3 h-3 inline mr-1" />
            Atualizado: {lastUpdated.toLocaleTimeString("pt-BR")}
          </p>
        </section>

        {/* ─── Funnel Chart ────────────────────────── */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" /> Funil de Conversão ({timeRange})
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 9 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--foreground))",
                    }}
                  />
                  <Bar dataKey="sessions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Hourly traffic */}
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Tráfego por Hora ({timeRange})
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="hour" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--foreground))",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="visits"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary) / 0.2)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* ─── Drop-off Table ──────────────────────── */}
        <section className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold mb-3">📉 Taxa de Abandono por Etapa</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left py-2 px-3">Etapa</th>
                  <th className="text-right py-2 px-3">Sessões</th>
                  <th className="text-right py-2 px-3">Drop-off</th>
                  <th className="text-left py-2 px-3 w-48">Barra</th>
                </tr>
              </thead>
              <tbody>
                {dropoffData.map((row, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-2 px-3 font-medium">{row.step}</td>
                    <td className="py-2 px-3 text-right tabular-nums">{row.sessions}</td>
                    <td className={cn(
                      "py-2 px-3 text-right tabular-nums font-semibold",
                      row.dropoff > 50 ? "text-red-400" : row.dropoff > 25 ? "text-yellow-400" : "text-green-400"
                    )}>
                      {row.dropoff}%
                    </td>
                    <td className="py-2 px-3">
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            row.dropoff > 50 ? "bg-red-500" : row.dropoff > 25 ? "bg-yellow-500" : "bg-green-500"
                          )}
                          style={{ width: `${100 - row.dropoff}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Live;
