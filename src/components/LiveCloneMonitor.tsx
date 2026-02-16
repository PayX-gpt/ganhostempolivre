import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShieldAlert, Globe, Clock, Monitor, Smartphone, AlertTriangle, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface CloneAttempt {
  id: string;
  created_at: string;
  session_id: string;
  event_data: {
    url?: string;
    referrer?: string;
    user_agent?: string;
    screen?: string;
    language?: string;
    timestamp?: string;
  } | null;
}

const parseDevice = (ua: string): { type: string; icon: typeof Monitor } => {
  const lower = ua.toLowerCase();
  if (lower.includes("mobile") || lower.includes("android") || lower.includes("iphone")) {
    return { type: "Mobile", icon: Smartphone };
  }
  return { type: "Desktop", icon: Monitor };
};

const parseBrowser = (ua: string): string => {
  if (ua.includes("Chrome") && !ua.includes("Edg")) return "Chrome";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
  if (ua.includes("Edg")) return "Edge";
  return "Outro";
};

const getRiskLevel = (attempts: CloneAttempt[]): { level: string; color: string } => {
  if (attempts.length >= 10) return { level: "ALTO", color: "text-red-400" };
  if (attempts.length >= 5) return { level: "MÉDIO", color: "text-amber-400" };
  return { level: "BAIXO", color: "text-emerald-400" };
};

export default function LiveCloneMonitor() {
  const [attempts, setAttempts] = useState<CloneAttempt[]>([]);
  const [todayCount, setTodayCount] = useState(0);
  const [weekCount, setWeekCount] = useState(0);
  const [uniqueIPs, setUniqueIPs] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAttempts = useCallback(async () => {
    setIsLoading(true);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data } = await supabase
      .from("funnel_events")
      .select("id, created_at, session_id, event_data")
      .eq("event_name", "clone_attempt_blocked")
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: false })
      .limit(200);

    const items = (data || []) as CloneAttempt[];
    setAttempts(items);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);

    setTodayCount(items.filter(a => new Date(a.created_at) >= todayStart).length);
    setWeekCount(items.filter(a => new Date(a.created_at) >= weekStart).length);

    // Count unique sessions as proxy for unique visitors
    const uniqueSessions = new Set(items.map(a => a.session_id));
    setUniqueIPs(uniqueSessions.size);

    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchAttempts();
    // Listen for new blocked attempts in real-time
    const channel = supabase
      .channel("clone-monitor")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "funnel_events",
        filter: "event_name=eq.clone_attempt_blocked",
      }, (payload) => {
        const newAttempt = payload.new as CloneAttempt;
        setAttempts(prev => [newAttempt, ...prev.slice(0, 199)]);
        setTodayCount(prev => prev + 1);
        setWeekCount(prev => prev + 1);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchAttempts]);

  const risk = getRiskLevel(attempts.filter(a => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    return new Date(a.created_at) >= todayStart;
  }));

  // Group by referrer for pattern detection
  const referrerGroups = attempts.reduce<Record<string, number>>((acc, a) => {
    const ref = (a.event_data?.referrer || "direct").replace(/https?:\/\//, "").split("/")[0];
    acc[ref] = (acc[ref] || 0) + 1;
    return acc;
  }, {});
  const topReferrers = Object.entries(referrerGroups)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
    });

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl p-4 bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a]">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-red-500/20 border border-red-500/20">
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
            </div>
            <span className="text-xs text-[#888]">Bloqueios Hoje</span>
          </div>
          <p className="text-2xl font-bold text-white">{todayCount}</p>
          <p className={cn("text-xs font-medium mt-1", risk.color)}>Risco: {risk.level}</p>
        </div>

        <div className="rounded-2xl p-4 bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a]">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-amber-500/20 border border-amber-500/20">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <span className="text-xs text-[#888]">Últimos 7 dias</span>
          </div>
          <p className="text-2xl font-bold text-white">{weekCount}</p>
          <p className="text-xs text-[#666] mt-1">{(weekCount / 7).toFixed(1)}/dia média</p>
        </div>

        <div className="rounded-2xl p-4 bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a]">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-violet-500/20 border border-violet-500/20">
              <Eye className="w-3.5 h-3.5 text-violet-400" />
            </div>
            <span className="text-xs text-[#888]">Sessões Únicas</span>
          </div>
          <p className="text-2xl font-bold text-white">{uniqueIPs}</p>
          <p className="text-xs text-[#666] mt-1">visitantes bloqueados</p>
        </div>

        <div className="rounded-2xl p-4 bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a]">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-sky-500/20 border border-sky-500/20">
              <Globe className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <span className="text-xs text-[#888]">Top Origem</span>
          </div>
          <p className="text-lg font-bold text-white truncate">{topReferrers[0]?.[0] || "—"}</p>
          <p className="text-xs text-[#666] mt-1">{topReferrers[0]?.[1] || 0} tentativas</p>
        </div>
      </div>

      {/* Top Referrers Pattern */}
      {topReferrers.length > 0 && (
        <div className="rounded-2xl p-4 bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a]">
          <h3 className="text-xs font-medium text-[#888] mb-3 flex items-center gap-2">
            <Globe className="w-3.5 h-3.5" />
            Padrão de Origens Suspeitas
          </h3>
          <div className="space-y-2">
            {topReferrers.map(([ref, count]) => (
              <div key={ref} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-white truncate">{ref}</span>
                    <span className="text-xs text-[#888] tabular-nums flex-shrink-0 ml-2">{count}x</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#2a2a2a] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-500 to-amber-500 rounded-full transition-all"
                      style={{ width: `${Math.min((count / (topReferrers[0]?.[1] || 1)) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attempts Feed */}
      <div className="rounded-2xl p-4 bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a]">
        <h3 className="text-xs font-medium text-[#888] mb-3 flex items-center gap-2">
          <ShieldAlert className="w-3.5 h-3.5" />
          Tentativas Bloqueadas Recentes
        </h3>
        <ScrollArea className="h-[400px]">
          <div className="space-y-2">
            {attempts.map((attempt) => {
              const device = parseDevice(attempt.event_data?.user_agent || "");
              const DeviceIcon = device.icon;
              const browser = parseBrowser(attempt.event_data?.user_agent || "");
              const referrer = (attempt.event_data?.referrer || "direct").replace(/https?:\/\//, "").split("/")[0];

              return (
                <div key={attempt.id} className="p-3 rounded-xl bg-[#0d0d0d] border border-[#2a2a2a] hover:border-red-500/20 transition-all">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="p-1.5 rounded-lg bg-red-500/10 text-red-400 flex-shrink-0">
                      <ShieldAlert className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-medium text-white">Acesso Bloqueado</span>
                    <div className="flex-1" />
                    <Badge className="text-[9px] bg-red-500/10 text-red-400 border-red-500/20 px-1.5">BLOCKED</Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[10px] text-[#666]">
                    <div className="flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      <span className="truncate max-w-[120px]">{referrer}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DeviceIcon className="w-3 h-3" />
                      <span>{device.type} · {browser}</span>
                    </div>
                    {attempt.event_data?.screen && (
                      <div className="flex items-center gap-1">
                        <Monitor className="w-3 h-3" />
                        <span>{attempt.event_data.screen}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 ml-auto">
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(attempt.created_at)}</span>
                    </div>
                  </div>
                  {attempt.event_data?.url && (
                    <div className="mt-1.5 text-[10px] text-[#555] truncate">
                      URL: {attempt.event_data.url}
                    </div>
                  )}
                </div>
              );
            })}
            {attempts.length === 0 && !isLoading && (
              <div className="text-center py-12 text-[#666]">
                <ShieldAlert className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Nenhuma tentativa bloqueada registrada</p>
                <p className="text-xs mt-1">O sistema está monitorando acessos não autorizados</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}