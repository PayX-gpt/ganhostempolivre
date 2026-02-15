import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Rocket, BarChart3, CreditCard, Trophy, RefreshCw,
  CheckCircle2, XCircle, Eye, ArrowRight, DollarSign,
  Users, TrendingUp, Clock
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UpsellActivity {
  id: string;
  session_id: string;
  event_type: string;
  page_id: string;
  created_at: string;
  metadata: Record<string, unknown> | null;
}

interface UpsellStats {
  views: number;
  buys: number;
  declines: number;
  revenue: number;
}

const UPSELL_LABELS: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  upsell1: { label: "UP1 — Acelerador", icon: Rocket, color: "emerald" },
  upsell2: { label: "UP2 — Multiplicador", icon: BarChart3, color: "violet" },
  upsell3: { label: "UP3 — Blindagem", icon: CreditCard, color: "amber" },
  upsell4: { label: "UP4 — Círculo", icon: Trophy, color: "sky" },
};

const classifyUpsellPage = (pageId: string): string | null => {
  const p = pageId.toLowerCase();
  if (p.includes("/upsell4") || p.includes("/upsell-sucesso")) return "upsell4";
  if (p.includes("/upsell3")) return "upsell3";
  if (p.includes("/upsell2")) return "upsell2";
  if (p.includes("/upsell") || p.includes("/upsell-confirmacao") || p.includes("/upsell-analise") || p.includes("/upsell-planos") || p.includes("/upsell-checkout") || p.includes("/upsell-downsell") || p.includes("/upsell-redirect")) return "upsell1";
  return null;
};

export default function LiveUpsellMonitor() {
  const [stats, setStats] = useState<Record<string, UpsellStats>>({
    upsell1: { views: 0, buys: 0, declines: 0, revenue: 0 },
    upsell2: { views: 0, buys: 0, declines: 0, revenue: 0 },
    upsell3: { views: 0, buys: 0, declines: 0, revenue: 0 },
    upsell4: { views: 0, buys: 0, declines: 0, revenue: 0 },
  });
  const [recentActivity, setRecentActivity] = useState<UpsellActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchUpsellData = useCallback(async () => {
    setIsLoading(true);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayISO = todayStart.toISOString();

    // Fetch upsell page views from audit logs
    const { data: viewLogs } = await supabase
      .from("funnel_audit_logs")
      .select("session_id, page_id, created_at")
      .eq("event_type", "page_loaded")
      .ilike("page_id", "%upsell%")
      .gte("created_at", todayISO)
      .order("created_at", { ascending: false })
      .limit(500);

    // Fetch upsell events (buy/decline) from funnel_events
    const { data: upsellEvents } = await supabase
      .from("funnel_events")
      .select("id, session_id, event_name, event_data, created_at")
      .in("event_name", ["upsell_step_view", "upsell_oneclick_buy", "upsell_oneclick_decline"])
      .gte("created_at", todayISO)
      .order("created_at", { ascending: false })
      .limit(500);

    // Calculate per-upsell stats
    const newStats: Record<string, UpsellStats> = {
      upsell1: { views: 0, buys: 0, declines: 0, revenue: 0 },
      upsell2: { views: 0, buys: 0, declines: 0, revenue: 0 },
      upsell3: { views: 0, buys: 0, declines: 0, revenue: 0 },
      upsell4: { views: 0, buys: 0, declines: 0, revenue: 0 },
    };

    // Count unique sessions per upsell view
    const viewSessions: Record<string, Set<string>> = {
      upsell1: new Set(), upsell2: new Set(), upsell3: new Set(), upsell4: new Set(),
    };

    viewLogs?.forEach((log) => {
      const upsell = classifyUpsellPage(log.page_id || "");
      if (upsell && viewSessions[upsell]) {
        viewSessions[upsell].add(log.session_id);
      }
    });

    Object.keys(viewSessions).forEach((key) => {
      newStats[key].views = viewSessions[key].size;
    });

    // Process buy/decline events
    const activity: UpsellActivity[] = [];

    upsellEvents?.forEach((evt) => {
      const data = evt.event_data as Record<string, unknown> | null;
      const pageId = (data?.page_id || data?.page || "") as string;
      const upsell = classifyUpsellPage(pageId);

      if (evt.event_name === "upsell_oneclick_buy" && upsell) {
        newStats[upsell].buys++;
        const price = Number(data?.price) || 0;
        newStats[upsell].revenue += price;
        activity.push({
          id: evt.id,
          session_id: evt.session_id,
          event_type: "buy",
          page_id: upsell,
          created_at: evt.created_at,
          metadata: data,
        });
      } else if (evt.event_name === "upsell_oneclick_decline" && upsell) {
        newStats[upsell].declines++;
        activity.push({
          id: evt.id,
          session_id: evt.session_id,
          event_type: "decline",
          page_id: upsell,
          created_at: evt.created_at,
          metadata: data,
        });
      }
    });

    // Also count step views that are unique entries to upsell1 flow
    upsellEvents?.forEach((evt) => {
      const data = evt.event_data as Record<string, unknown> | null;
      if (evt.event_name === "upsell_step_view") {
        const pageId = (data?.page_id || "") as string;
        const upsell = classifyUpsellPage(pageId);
        if (upsell && !viewSessions[upsell].has(evt.session_id)) {
          viewSessions[upsell].add(evt.session_id);
          newStats[upsell].views++;
        }
      }
    });

    setStats(newStats);
    setRecentActivity(activity.slice(0, 20));
    setLastUpdated(new Date());
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchUpsellData();
    const interval = setInterval(fetchUpsellData, 15000);
    return () => clearInterval(interval);
  }, [fetchUpsellData]);

  // Realtime listener for new upsell events
  useEffect(() => {
    const channel = supabase
      .channel("upsell-monitor-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "funnel_events" }, (payload) => {
        const evt = payload.new as { event_name: string };
        if (evt.event_name?.includes("upsell")) {
          fetchUpsellData();
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchUpsellData]);

  const totalUpsellViews = Object.values(stats).reduce((s, v) => s + v.views, 0);
  const totalUpsellBuys = Object.values(stats).reduce((s, v) => s + v.buys, 0);
  const totalUpsellRevenue = Object.values(stats).reduce((s, v) => s + v.revenue, 0);

  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a] p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-600/10 border border-violet-500/20 flex-shrink-0">
            <Rocket className="w-5 h-5 text-violet-400" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-white text-sm truncate">Upsell Monitor — Hoje</h3>
            <p className="text-[10px] text-[#666]">Conversões, recusas e receita por etapa</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge className="bg-violet-500/20 text-violet-400 border border-violet-500/30 px-2 text-xs">
            {totalUpsellViews} entradas
          </Badge>
          <Button variant="ghost" size="sm" onClick={fetchUpsellData} disabled={isLoading}
            className="h-7 w-7 p-0 text-[#888] hover:text-white hover:bg-white/5 rounded-lg">
            <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="rounded-xl bg-[#0d0d0d] border border-[#2a2a2a] p-3 text-center">
          <DollarSign className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-white tabular-nums">R$ {totalUpsellRevenue.toFixed(0)}</p>
          <p className="text-[9px] text-[#666]">Receita Upsell</p>
        </div>
        <div className="rounded-xl bg-[#0d0d0d] border border-[#2a2a2a] p-3 text-center">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-white tabular-nums">{totalUpsellBuys}</p>
          <p className="text-[9px] text-[#666]">Compras Upsell</p>
        </div>
        <div className="rounded-xl bg-[#0d0d0d] border border-[#2a2a2a] p-3 text-center">
          <TrendingUp className="w-4 h-4 text-amber-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-white tabular-nums">
            {totalUpsellViews > 0 ? ((totalUpsellBuys / totalUpsellViews) * 100).toFixed(1) : "0"}%
          </p>
          <p className="text-[9px] text-[#666]">Taxa Conversão</p>
        </div>
      </div>

      {/* Per-Upsell Breakdown */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
        {Object.entries(UPSELL_LABELS).map(([key, { label, icon: Icon, color }]) => {
          const s = stats[key];
          const convRate = s.views > 0 ? ((s.buys / s.views) * 100).toFixed(0) : "0";
          const colorMap: Record<string, string> = {
            emerald: "border-emerald-500/30 text-emerald-400",
            violet: "border-violet-500/30 text-violet-400",
            amber: "border-amber-500/30 text-amber-400",
            sky: "border-sky-500/30 text-sky-400",
          };
          const borderColor = colorMap[color] || colorMap.emerald;

          return (
            <div key={key} className={cn("rounded-xl bg-[#0d0d0d] border p-3", s.views > 0 ? borderColor.split(" ")[0] : "border-[#2a2a2a]")}>
              <div className="flex items-center gap-1.5 mb-2">
                <Icon className={cn("w-3.5 h-3.5", borderColor.split(" ")[1])} />
                <span className="text-[10px] font-medium text-[#888] truncate">{label}</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-[#666]">Entradas</span>
                  <span className="text-white font-medium tabular-nums">{s.views}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-[#666]">Compras</span>
                  <span className="text-emerald-400 font-medium tabular-nums">{s.buys}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-[#666]">Recusas</span>
                  <span className="text-red-400 font-medium tabular-nums">{s.declines}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-[#666]">Conversão</span>
                  <span className={cn("font-bold tabular-nums", Number(convRate) > 0 ? "text-emerald-400" : "text-[#444]")}>{convRate}%</span>
                </div>
                {s.revenue > 0 && (
                  <div className="flex justify-between text-[10px]">
                    <span className="text-[#666]">Receita</span>
                    <span className="text-emerald-400 font-medium tabular-nums">R$ {s.revenue.toFixed(0)}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity Feed */}
      {recentActivity.length > 0 && (
        <div className="rounded-xl border border-[#2a2a2a] bg-[#0d0d0d] p-3">
          <h4 className="text-[10px] font-medium text-[#888] uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-violet-400" /> Atividade Recente Upsell
          </h4>
          <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
            {recentActivity.map((act) => {
              const info = UPSELL_LABELS[act.page_id];
              const isBuy = act.event_type === "buy";
              const price = act.metadata?.price ? `R$ ${act.metadata.price}` : "";
              return (
                <div key={act.id} className="flex items-center gap-2 text-xs py-1 px-2 rounded-lg bg-[#1a1a1a]">
                  {isBuy ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                  )}
                  <span className={cn("font-medium truncate flex-1", isBuy ? "text-emerald-400" : "text-red-400")}>
                    {isBuy ? "Comprou" : "Recusou"}
                  </span>
                  <Badge className="text-[9px] bg-[#2a2a2a] text-[#888] border-0 px-1.5 flex-shrink-0">
                    {info?.label?.split("—")[0]?.trim() || act.page_id}
                  </Badge>
                  {price && (
                    <span className="text-emerald-400 text-[10px] font-medium flex-shrink-0">{price}</span>
                  )}
                  <span className="text-[#666] text-[10px] flex-shrink-0">
                    {new Date(act.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-center justify-center mt-3 text-[10px] text-[#666]">
        <span>Atualizado: {lastUpdated.toLocaleTimeString("pt-BR")}</span>
      </div>
    </div>
  );
}
