import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  RefreshCw, TrendingUp, Clock, DollarSign, Users, 
  Activity, Download, Target, Eye,
  ShoppingCart, CreditCard, ArrowUpRight, CheckCircle2,
  XCircle, Database, Radio, Filter, Search,
  Bell, BellOff, Volume2, VolumeX,
  Globe, TrendingDown, Package, AlertTriangle, UserCheck
} from "lucide-react";
import LiveRevenueChart from "@/components/LiveRevenueChart";
import LiveUserPresence from "@/components/LiveUserPresence";
import LiveIntelligence from "@/components/LiveIntelligence";
import LiveFunnelAnalytics from "@/components/LiveFunnelAnalytics";
import CampaignFilter, { type CampaignFilterState } from "@/components/CampaignFilter";
import LiveLeadsTable from "@/components/LiveLeadsTable";
import LiveUpsellMonitor from "@/components/LiveUpsellMonitor";
import LiveSalesFeed from "@/components/LiveSalesFeed";
import LiveAIAlerts from "@/components/LiveAIAlerts";
import LiveCampaignTable from "@/components/LiveCampaignTable";
import LiveChannelCreativeTable from "@/components/LiveChannelCreativeTable";
import LeadTimeline from "@/components/LiveLeadTimeline";
import { usePeriodComparison, getVariation } from "@/components/LivePeriodComparison";
import LiveFunnelVelocity from "@/components/LiveFunnelVelocity";
import LiveScrollHeatmap from "@/components/LiveScrollHeatmap";
import LiveComparisonMode from "@/components/LiveComparisonMode";
import LiveAISuggestions from "@/components/LiveAISuggestions";
import LiveABTest from "@/components/LiveABTest";
import LiveBuyerProfile from "@/components/LiveBuyerProfile";
import { toast } from "sonner";
import SEOHead from "@/components/SEOHead";
import SessionLogsDialog from "@/components/SessionLogsDialog";
import { cn } from "@/lib/utils";

interface AuditLog {
  id: string;
  created_at: string;
  event_type: string;
  page_id: string | null;
  session_id: string;
  payment_id: string | null;
  conversion_id: string | null;
  redirect_url: string | null;
  duration_ms: number | null;
  status: string | null;
  error_message: string | null;
  metadata: unknown;
  user_agent: string | null;
}

interface DashboardSummary {
  front_sales: number;
  front_revenue: number;
  upsell_sales: number;
  upsell_revenue: number;
  total_sales: number;
  total_revenue: number;
  refunds: number;
  pending: number;
  refused: number;
  orphan_sales: number;
  upsell_detail: { step: string; count: number; revenue: number }[];
  ab_sales: { variant: string; front_sales: number; front_revenue: number; total_sales: number; total_revenue: number }[];
  buyer_age: { age: string; count: number }[];
  buyer_hours: { hour: number; count: number }[];
  buyer_devices: { device: string; count: number }[];
  front_ticket_avg: number;
  total_ticket_avg: number;
}

const MetricCard = ({ 
  title, value, subtitle, icon: Icon, trend, trendLabel, className, valueClassName, iconClassName
}: { 
  title: string; value: string | number; subtitle?: string; icon?: React.ElementType;
  trend?: 'up' | 'down' | 'neutral'; trendLabel?: string; className?: string;
  valueClassName?: string; iconClassName?: string;
}) => (
  <div className={cn(
    "relative overflow-hidden rounded-2xl p-3 sm:p-4 transition-all duration-300 hover:scale-[1.02]",
    "bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a]",
    "shadow-xl hover:shadow-2xl hover:shadow-emerald-500/5", className
  )}>
    <div className="flex items-start justify-between gap-2">
      <div className="space-y-1 min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {Icon && (
            <div className={cn("p-1.5 rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/20 flex-shrink-0", iconClassName)}>
              <Icon className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          )}
          <p className="text-[#888] text-xs font-medium truncate">{title}</p>
        </div>
        <p className={cn("text-xl sm:text-2xl font-bold text-white tracking-tight truncate tabular-nums", valueClassName)}>{value}</p>
        {subtitle && <p className="text-[#666] text-[10px] sm:text-xs truncate">{subtitle}</p>}
        {trendLabel && (
          <div className={cn("flex items-center gap-1 text-[10px] sm:text-xs font-medium",
            trend === 'up' && "text-emerald-400", trend === 'down' && "text-red-400", trend === 'neutral' && "text-[#888]"
          )}>
            {trend === 'up' && <TrendingUp className="w-3 h-3 flex-shrink-0" />}
            {trend === 'down' && <TrendingDown className="w-3 h-3 flex-shrink-0" />}
            <span className="truncate">{trendLabel}</span>
          </div>
        )}
      </div>
    </div>
  </div>
);

const UPSELL_LABELS: Record<string, string> = {
  acelerador_basico: "Acel. Básico",
  acelerador_duplo: "Acel. Duplo",
  acelerador_maximo: "Acel. Máximo",
  multiplicador_prata: "Mult. Prata",
  multiplicador_ouro: "Mult. Ouro",
  multiplicador_diamante: "Mult. Diamante",
  blindagem: "Blindagem",
  circulo_interno: "Círculo Interno",
  safety_pro: "Safety Pro",
  forex_mentoria: "Forex Mentoria",
  downsell_guia: "Guia Downsell",
};

export default function AdminFunnelAudit() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [realtimeLogs, setRealtimeLogs] = useState<AuditLog[]>([]);
  const [allRealtimeLogs, setAllRealtimeLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<string>("24h");
  const [eventFilter, setEventFilter] = useState<string>("all");
  const [sessionFilter, setSessionFilter] = useState<string>("");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isLivePaused, setIsLivePaused] = useState(false);
  const [activeUsers, setActiveUsers] = useState(0);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [timelineSessionId, setTimelineSessionId] = useState<string | null>(null);
  const [frontendICs, setFrontendICs] = useState(0);
  const [totalVisitsToday, setTotalVisitsToday] = useState(0);
  const [totalLeadsToday, setTotalLeadsToday] = useState(0);
  const [qualifiedLeadsToday, setQualifiedLeadsToday] = useState(0);
  const [interactionRateToday, setInteractionRateToday] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [campaignFilterState, setCampaignFilterState] = useState<CampaignFilterState>({ selectedCampaigns: new Set(), allCampaigns: [], campaignColors: {} });
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const periodData = usePeriodComparison(dateFilter);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('live-sound-enabled');
    return saved !== null ? saved === 'true' : true;
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    const saved = localStorage.getItem('live-notifications-enabled');
    return saved !== null ? saved === 'true' : true;
  });
  const logsContainerRef = useRef<HTMLDivElement>(null);

  const IMPORTANT_EVENT_TYPES = [
    "page_loaded", "checkout_initiated", "email_prefill", "payment_completed",
    "conversion_saved", "conversion_save_failed", "redirect_executed",
    "redirect_completed", "redirect_failed",
    "upsell_oneclick_buy", "upsell_oneclick_decline",
  ];

  const isImportantEvent = (eventType: string) => IMPORTANT_EVENT_TYPES.includes(eventType);

  const combinedFunnelLogs = (() => {
    const historicalFunnelLogs = logs.filter((log) => isImportantEvent(log.event_type));
    const historicalIds = new Set(historicalFunnelLogs.map(l => l.id));
    const uniqueRealtime = realtimeLogs.filter(l => !historicalIds.has(l.id));
    const combined = [...uniqueRealtime, ...historicalFunnelLogs];
    combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return combined.slice(0, 200);
  })();

  const getDateRange = useCallback(() => {
    const now = new Date();
    const startDate = new Date();
    switch (dateFilter) {
      case "1h": startDate.setHours(now.getHours() - 1); break;
      case "24h": startDate.setDate(now.getDate() - 1); break;
      case "7d": startDate.setDate(now.getDate() - 7); break;
      case "30d": startDate.setDate(now.getDate() - 30); break;
      default: startDate.setDate(now.getDate() - 1);
    }
    return startDate.toISOString();
  }, [dateFilter]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const startDate = getDateRange();

    let query = supabase.from("funnel_audit_logs").select("*")
      .gte("created_at", startDate).order("created_at", { ascending: false }).limit(500);
    if (eventFilter !== "all") query = query.eq("event_type", eventFilter);
    if (sessionFilter) query = query.ilike("session_id", `%${sessionFilter}%`);

    const { data: logsData } = await query;
    setLogs(logsData || []);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayISO = todayStart.toISOString();

    // Fetch dashboard summary from RPC
    try {
      const { data: summaryData } = await supabase.rpc("get_dashboard_summary_today" as any);
      if (summaryData) setSummary(summaryData as unknown as DashboardSummary);
    } catch (e) {
      console.warn("[Dashboard] Summary RPC error:", e);
    }

    // IC = unique sessions that clicked checkout (paginated)
    const allICSessionIds = new Set<string>();
    let icPage = 0;
    const IC_PAGE_SIZE = 1000;
    while (true) {
      const { data: icRows } = await supabase.from("funnel_events")
        .select("session_id")
        .in("event_name", ["checkout_click", "capi_ic_sent"])
        .gte("created_at", todayISO)
        .range(icPage * IC_PAGE_SIZE, (icPage + 1) * IC_PAGE_SIZE - 1);
      if (!icRows || icRows.length === 0) break;
      icRows.forEach(r => allICSessionIds.add(r.session_id));
      if (icRows.length < IC_PAGE_SIZE) break;
      icPage++;
    }
    setFrontendICs(allICSessionIds.size);

    // Leads
    const [leadCapturedResult, leadBehaviorResult] = await Promise.all([
      supabase.from("funnel_events").select("session_id").eq("event_name", "lead_captured").gte("created_at", todayISO),
      supabase.from("lead_behavior").select("session_id").gte("created_at", todayISO),
    ]);
    const allLeadSessions = new Set<string>();
    (leadCapturedResult.data || []).forEach(r => allLeadSessions.add(r.session_id));
    (leadBehaviorResult.data || []).forEach(r => allLeadSessions.add(r.session_id));
    setTotalLeadsToday(allLeadSessions.size);

    const { data: leadData } = await supabase.from("lead_behavior")
      .select("intent_score")
      .gte("created_at", todayISO);
    setQualifiedLeadsToday(leadData?.filter(l => (l.intent_score || 0) >= 50).length || 0);

    // Visits
    const allVisitSessions = new Set<string>();
    let visitPage = 0;
    const PAGE_SIZE = 1000;
    while (true) {
      const { data: visitRows } = await supabase.from("funnel_events")
        .select("session_id")
        .eq("event_name", "step_viewed")
        .gte("created_at", todayISO)
        .range(visitPage * PAGE_SIZE, (visitPage + 1) * PAGE_SIZE - 1);
      if (!visitRows || visitRows.length === 0) break;
      visitRows.forEach(r => allVisitSessions.add(r.session_id));
      if (visitRows.length < PAGE_SIZE) break;
      visitPage++;
    }
    setTotalVisitsToday(allVisitSessions.size);
    setInteractionRateToday(allVisitSessions.size > 0 ? (allLeadSessions.size / allVisitSessions.size) * 100 : 0);

    setLastUpdated(new Date());
    setIsLoading(false);
  }, [getDateRange, eventFilter, sessionFilter]);

  const handlePresenceTotalChange = useCallback((total: number) => { setActiveUsers(total); }, []);

  useEffect(() => {
    if (isLivePaused) return;
    const channel = supabase.channel("funnel-audit-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "funnel_audit_logs" }, (payload) => {
        const newLog = payload.new as AuditLog;
        setAllRealtimeLogs((prev) => {
          const isDuplicate = prev.some(log => log.session_id === newLog.session_id && log.event_type === newLog.event_type &&
            log.page_id === newLog.page_id && Math.abs(new Date(log.created_at).getTime() - new Date(newLog.created_at).getTime()) < 3000);
          if (isDuplicate) return prev;
          return [newLog, ...prev.slice(0, 199)];
        });
        if (!isImportantEvent(newLog.event_type)) return;
        setRealtimeLogs((prev) => {
          const isDuplicate = prev.some(log => log.session_id === newLog.session_id && log.event_type === newLog.event_type &&
            log.page_id === newLog.page_id && Math.abs(new Date(log.created_at).getTime() - new Date(newLog.created_at).getTime()) < 5000);
          if (isDuplicate) return prev;
          return [newLog, ...prev.slice(0, 99)];
        });
        if (logsContainerRef.current && !isLivePaused) logsContainerRef.current.scrollTop = 0;
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isLivePaused]);

  useEffect(() => {
    if (isLivePaused) return;
    const channel = supabase.channel("payment-failures-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "purchase_tracking" }, (payload) => {
        const newPurchase = payload.new as { status: string; failure_reason: string | null; email: string | null };
        if (newPurchase.status === 'failed' && newPurchase.failure_reason && notificationsEnabled) {
          toast.error(`Pagamento Falhou${newPurchase.email ? `: ${newPurchase.email.split('@')[0]}...` : ''}`,
            { description: newPurchase.failure_reason.slice(0, 100), duration: 10000 });
        }
        if (['purchased', 'completed', 'approved'].includes(newPurchase.status)) fetchData();
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isLivePaused, notificationsEnabled, fetchData]);

  useEffect(() => { localStorage.setItem('live-sound-enabled', String(soundEnabled)); }, [soundEnabled]);
  useEffect(() => { localStorage.setItem('live-notifications-enabled', String(notificationsEnabled)); }, [notificationsEnabled]);

  const toggleSound = useCallback(() => setSoundEnabled(prev => !prev), []);
  const toggleNotifications = useCallback(async () => {
    if (!notificationsEnabled && 'Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') { setNotificationsEnabled(true); toast.success('Notificações ativadas!'); }
      else { toast.error('Permissão de notificação negada'); }
    } else { setNotificationsEnabled(prev => !prev); }
  }, [notificationsEnabled]);

  useEffect(() => {
    setRealtimeLogs([]); setAllRealtimeLogs([]); fetchData();
    if (autoRefresh) { const interval = setInterval(fetchData, 15000); return () => clearInterval(interval); }
  }, [fetchData, autoRefresh]);
  
  useEffect(() => {
    const handleVisibilityChange = () => { if (document.visibilityState === 'visible') fetchData(); };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => { document.removeEventListener('visibilitychange', handleVisibilityChange); };
  }, [fetchData]);

  const exportReport = async () => {
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");
      const doc = new jsPDF();
      const now = new Date().toLocaleString("pt-BR");
      doc.setFontSize(18); doc.setTextColor(16, 185, 129);
      doc.text("RELATÓRIO DO FUNIL", 14, 20);
      doc.setFontSize(10); doc.setTextColor(100); doc.text(now, 14, 28);
      doc.setFontSize(14); doc.setTextColor(0); doc.text("KPIs Principais", 14, 40);
      autoTable(doc, {
        startY: 45,
        head: [["Métrica", "Valor"]],
        body: [
          ["Receita Total", `R$ ${summary?.total_revenue?.toFixed(2) || '0'}`],
          ["Vendas Front", String(summary?.front_sales || 0)],
          ["Receita Front", `R$ ${summary?.front_revenue?.toFixed(2) || '0'}`],
          ["Vendas Upsell", String(summary?.upsell_sales || 0)],
          ["Receita Upsell", `R$ ${summary?.upsell_revenue?.toFixed(2) || '0'}`],
          ["Vendas Órfãs", String(summary?.orphan_sales || 0)],
          ["Leads", String(totalLeadsToday)],
          ["Visitas", String(totalVisitsToday)],
        ],
        theme: "grid",
        headStyles: { fillColor: [16, 185, 129] },
      });
      doc.save(`relatorio-funil-${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("PDF exportado!");
    } catch {
      toast.success("Erro na exportação");
    }
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
  });

  const getEventIcon = (eventType: string) => {
    const icons: Record<string, JSX.Element> = {
      page_loaded: <Eye className="w-3.5 h-3.5" />, checkout_initiated: <ShoppingCart className="w-3.5 h-3.5" />,
      payment_completed: <CreditCard className="w-3.5 h-3.5" />, conversion_saved: <Database className="w-3.5 h-3.5" />,
      conversion_save_failed: <XCircle className="w-3.5 h-3.5" />, redirect_executed: <ArrowUpRight className="w-3.5 h-3.5" />,
      redirect_failed: <XCircle className="w-3.5 h-3.5" />,
      upsell_oneclick_buy: <CheckCircle2 className="w-3.5 h-3.5" />,
      upsell_oneclick_decline: <XCircle className="w-3.5 h-3.5" />,
    };
    return icons[eventType] || <Activity className="w-3.5 h-3.5" />;
  };

  const getStatusIcon = (status: string | null) => {
    if (status === "success") return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    if (status === "error") return <XCircle className="w-4 h-4 text-red-500" />;
    return <Clock className="w-4 h-4 text-amber-500" />;
  };

  const s = summary;
  const frontSales = s?.front_sales || 0;
  const upsellSales = s?.upsell_sales || 0;
  const totalSales = s?.total_sales || 0;
  const frontRevenue = s?.front_revenue || 0;
  const upsellRevenue = s?.upsell_revenue || 0;
  const totalRevenue = s?.total_revenue || 0;
  const orphanSales = s?.orphan_sales || 0;
  const totalAttempts = frontSales + (s?.pending || 0) + (s?.refused || 0);
  const approvalRate = totalAttempts > 0 ? (frontSales / totalAttempts) * 100 : 0;
  const icToSalesRate = frontendICs > 0 ? (frontSales / frontendICs) * 100 : 0;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <SEOHead title="Live Dashboard" description="Real-time analytics and monitoring dashboard" url="/live" />

      <div className="max-w-[1600px] mx-auto px-4 py-6 space-y-6">
        <header className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-emerald-500/80 to-emerald-700/80 flex items-center justify-center flex-shrink-0">
              <Activity className="w-3 h-3 text-white" />
            </div>
            <h1 className="text-sm font-semibold text-white">Dashboard</h1>
            <div className="flex items-center gap-1 ml-auto">
              <button onClick={toggleSound} className={cn("w-6 h-6 rounded flex items-center justify-center flex-shrink-0", soundEnabled ? "text-emerald-400" : "text-[#555]")}>
                {soundEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
              </button>
              <button onClick={toggleNotifications} className={cn("w-6 h-6 rounded flex items-center justify-center flex-shrink-0", notificationsEnabled ? "text-emerald-400" : "text-[#555]")}>
                {notificationsEnabled ? <Bell className="w-3 h-3" /> : <BellOff className="w-3 h-3" />}
              </button>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="h-6 w-auto bg-[#141414] border-[#222] text-white/80 rounded text-[10px] px-1.5 gap-1"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#141414] border-[#222]">
                  <SelectItem value="1h">1h</SelectItem><SelectItem value="24h">24h</SelectItem>
                  <SelectItem value="7d">7d</SelectItem><SelectItem value="30d">30d</SelectItem>
                </SelectContent>
              </Select>
              <button onClick={fetchData} disabled={isLoading} className="w-6 h-6 rounded flex items-center justify-center text-[#555] flex-shrink-0">
                <RefreshCw className={cn("w-3 h-3", isLoading && "animate-spin")} />
              </button>
              <button onClick={() => setAutoRefresh(!autoRefresh)} className={cn("w-6 h-6 rounded flex items-center justify-center flex-shrink-0", autoRefresh ? "text-emerald-400" : "text-[#555]")}>
                <Radio className={cn("w-3 h-3", autoRefresh && "animate-pulse")} />
              </button>
              <button onClick={exportReport} className="w-6 h-6 rounded flex items-center justify-center text-[#555] hover:text-emerald-400 flex-shrink-0">
                <Download className="w-3 h-3" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded">
              <span className="relative flex h-1.5 w-1.5 flex-shrink-0"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span></span>
              <span className="text-[10px] font-medium text-emerald-400 tabular-nums">{activeUsers} online</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-0.5 bg-[#141414] border border-[#222] rounded">
              <Globe className="w-2.5 h-2.5 text-sky-400/70 flex-shrink-0" />
              <span className="text-[10px] text-white/70 tabular-nums">{totalVisitsToday} visitas</span>
            </div>
            {orphanSales > 0 && (
              <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded">
                <AlertTriangle className="w-2.5 h-2.5 text-amber-400 flex-shrink-0" />
                <span className="text-[10px] text-amber-400 tabular-nums">{orphanSales} órfãs</span>
              </div>
            )}
            {lastUpdated && (
              <div className="flex items-center gap-1 px-2 py-0.5 bg-[#141414] border border-[#222] rounded">
                <Clock className="w-2.5 h-2.5 text-[#444] flex-shrink-0" />
                <span className="text-[10px] text-[#444] tabular-nums">{lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              </div>
            )}
          </div>
        </header>

        {/* ===== KPIs: FRONT + UPSELL SEPARADOS ===== */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <MetricCard title="Receita Total"
            value={`R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
            subtitle={`Front R$${frontRevenue.toFixed(0)} + Upsell R$${upsellRevenue.toFixed(0)}`}
            icon={DollarSign}
            trend={periodData ? getVariation(totalRevenue, periodData.previous.revenue).trend : "neutral"}
            trendLabel={periodData ? `${getVariation(totalRevenue, periodData.previous.revenue).pct} vs anterior` : undefined} />
          <MetricCard title="Vendas Front"
            value={frontSales}
            subtitle={`R$ ${frontRevenue.toFixed(0)} · TM R$${s?.front_ticket_avg?.toFixed(0) || '0'}`}
            icon={ShoppingCart}
            trend={periodData ? getVariation(frontSales, periodData.previous.sales).trend : undefined}
            trendLabel={periodData ? `${getVariation(frontSales, periodData.previous.sales).pct} vs anterior` : undefined} />
          <MetricCard title="Vendas Upsell"
            value={upsellSales}
            subtitle={`R$ ${upsellRevenue.toFixed(0)} · ${totalSales > 0 ? ((upsellSales / frontSales) * 100).toFixed(0) : 0}% take rate`}
            icon={Package}
            iconClassName="from-violet-500/20 to-violet-600/10 border-violet-500/20"
            valueClassName="text-violet-400" />
          <MetricCard title="Leads Hoje" value={totalLeadsToday}
            subtitle={`${qualifiedLeadsToday} qualificados · ${interactionRateToday.toFixed(0)}% interação`}
            icon={Users}
            trend={periodData ? getVariation(totalLeadsToday, periodData.previous.leads).trend : undefined}
            trendLabel={periodData ? `${getVariation(totalLeadsToday, periodData.previous.leads).pct} vs anterior` : undefined} />
          <MetricCard title="IC → Venda Front"
            value={`${icToSalesRate.toFixed(1)}%`}
            subtitle={`${frontendICs} ICs · ${frontSales > 0 ? `1:${Math.round(frontendICs / frontSales)}` : '0:0'}`}
            icon={Target} />
        </div>

        {/* ===== SCROLL HORIZONTAL: KPIs DETALHADOS ===== */}
        <div className="overflow-x-auto -mx-4 px-4 pb-2">
          <div className="flex gap-3 w-max">
            {/* Receita Hoje */}
            <div className="rounded-2xl p-4 bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a] min-w-[200px]">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/20"><DollarSign className="w-3.5 h-3.5 text-emerald-400" /></div>
                <span className="text-xs text-[#888]">Receita Hoje</span>
              </div>
              <p className="text-2xl font-bold text-white tabular-nums">R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <p className="text-[10px] text-[#666] mt-1">{totalSales} vendas</p>
              {periodData && (
                <div className={cn("flex items-center gap-1 text-[10px] mt-1",
                  getVariation(totalRevenue, periodData.previous.revenue).trend === 'up' ? "text-emerald-400" : "text-red-400"
                )}>
                  {getVariation(totalRevenue, periodData.previous.revenue).trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {getVariation(totalRevenue, periodData.previous.revenue).pct} vs anterior
                </div>
              )}
            </div>

            {/* Vendas Hoje */}
            <div className="rounded-2xl p-4 bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a] min-w-[200px]">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-violet-500/20 border border-violet-500/20"><ShoppingCart className="w-3.5 h-3.5 text-violet-400" /></div>
                <span className="text-xs text-[#888]">Vendas Hoje</span>
              </div>
              <p className="text-2xl font-bold text-white tabular-nums">{frontSales}</p>
              <p className="text-[10px] text-[#666] mt-1">{s?.refunds || 0} reembolsos ({totalSales > 0 ? ((s?.refunds || 0) / totalSales * 100).toFixed(0) : 0}%)</p>
              {periodData && (
                <div className={cn("flex items-center gap-1 text-[10px] mt-1",
                  getVariation(frontSales, periodData.previous.sales).trend === 'up' ? "text-emerald-400" : "text-red-400"
                )}>
                  {getVariation(frontSales, periodData.previous.sales).trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {getVariation(frontSales, periodData.previous.sales).pct} vs anterior
                </div>
              )}
            </div>

            {/* Taxa de Aprovação */}
            <div className="rounded-2xl p-4 bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a] min-w-[200px]">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/20"><CreditCard className="w-3.5 h-3.5 text-emerald-400" /></div>
                <span className="text-xs text-[#888]">Taxa de Aprovação</span>
              </div>
              <p className="text-2xl font-bold text-white tabular-nums">{approvalRate.toFixed(1)}%</p>
              <p className="text-[10px] text-[#666] mt-1">{frontSales} pagos · {s?.pending || 0} pend. · {s?.refused || 0} recus.</p>
              {periodData && (
                <div className={cn("flex items-center gap-1 text-[10px] mt-1",
                  getVariation(approvalRate, periodData.previous.approvalRate || 0).trend === 'up' ? "text-emerald-400" : "text-red-400"
                )}>
                  {getVariation(approvalRate, periodData.previous.approvalRate || 0).trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {getVariation(approvalRate, periodData.previous.approvalRate || 0).pct} vs anterior
                </div>
              )}
            </div>

            {/* IC → Vendas */}
            <div className="rounded-2xl p-4 bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a] min-w-[200px]">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/20"><Target className="w-3.5 h-3.5 text-cyan-400" /></div>
                <span className="text-xs text-[#888]">IC → Vendas</span>
              </div>
              <p className="text-2xl font-bold text-white tabular-nums">{icToSalesRate.toFixed(1)}%</p>
              <p className="text-[10px] text-[#666] mt-1">{frontendICs} ICs · 1:{frontSales > 0 ? Math.round(frontendICs / frontSales) : 0}</p>
              {periodData && periodData.previous.ics > 0 && (() => {
                const prevICRate = periodData.previous.sales > 0 ? (periodData.previous.sales / periodData.previous.ics) * 100 : 0;
                return (
                  <div className={cn("flex items-center gap-1 text-[10px] mt-1",
                    getVariation(icToSalesRate, prevICRate).trend === 'up' ? "text-emerald-400" : "text-red-400"
                  )}>
                    {getVariation(icToSalesRate, prevICRate).trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {getVariation(icToSalesRate, prevICRate).pct} vs anterior
                  </div>
                );
              })()}
            </div>

            {/* Leads Hoje */}
            <div className="rounded-2xl p-4 bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a] min-w-[180px]">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/20"><Users className="w-3.5 h-3.5 text-emerald-400" /></div>
                <span className="text-xs text-[#888]">Leads Hoje</span>
              </div>
              <p className="text-2xl font-bold text-white tabular-nums">{totalLeadsToday}</p>
              <p className="text-[10px] text-[#666] mt-1">{qualifiedLeadsToday} qualificados</p>
              {periodData && (
                <div className={cn("flex items-center gap-1 text-[10px] mt-1",
                  getVariation(totalLeadsToday, periodData.previous.leads).trend === 'up' ? "text-emerald-400" : "text-red-400"
                )}>
                  {getVariation(totalLeadsToday, periodData.previous.leads).trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {getVariation(totalLeadsToday, periodData.previous.leads).pct} vs anterior
                </div>
              )}
            </div>

            {/* Ticket Médio */}
            <div className="rounded-2xl p-4 bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a] min-w-[180px]">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-violet-500/20 border border-violet-500/20"><DollarSign className="w-3.5 h-3.5 text-violet-400" /></div>
                <span className="text-xs text-[#888]">Ticket Médio</span>
              </div>
              <p className="text-2xl font-bold text-violet-400 tabular-nums">R$ {(s?.total_ticket_avg || 0).toFixed(0)}</p>
              <p className="text-[10px] text-[#666] mt-1">LTV: R$ {totalSales > 0 ? (totalRevenue / frontSales).toFixed(0) : '0'}</p>
              {periodData && periodData.previous.avgTicket > 0 && (
                <div className={cn("flex items-center gap-1 text-[10px] mt-1",
                  getVariation(s?.total_ticket_avg || 0, periodData.previous.avgTicket).trend === 'up' ? "text-emerald-400" : "text-red-400"
                )}>
                  {getVariation(s?.total_ticket_avg || 0, periodData.previous.avgTicket).trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {getVariation(s?.total_ticket_avg || 0, periodData.previous.avgTicket).pct} vs anterior
                </div>
              )}
            </div>

            {/* Taxa Interação */}
            <div className="rounded-2xl p-4 bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a] min-w-[180px]">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-amber-500/20 border border-amber-500/20"><UserCheck className="w-3.5 h-3.5 text-amber-400" /></div>
                <span className="text-xs text-[#888]">Taxa Interação</span>
              </div>
              <p className="text-2xl font-bold text-amber-400 tabular-nums">{interactionRateToday.toFixed(1)}%</p>
              <p className="text-[10px] text-[#666] mt-1">{totalVisitsToday} visitantes</p>
            </div>
          </div>
        </div>

        {/* ===== DONUT CHARTS: APROVAÇÃO + FUNIL IC ===== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Aprovação Gateway Donut */}
          <div className="rounded-2xl p-4 bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-white">Aprovação Gateway</span>
              <Globe className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex items-center gap-4">
              <div className="relative w-24 h-24 flex-shrink-0">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#2a2a2a" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#10b981" strokeWidth="3"
                    strokeDasharray={`${approvalRate} ${100 - approvalRate}`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-emerald-400 tabular-nums">{approvalRate.toFixed(0)}%</span>
                </div>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-white">{frontSales} Pagos</span></div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-500" /><span className="text-white">{s?.pending || 0} Pendentes</span></div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500" /><span className="text-white">{s?.refused || 0} Recusados</span></div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#555]" /><span className="text-[#888]">{totalAttempts} Total</span></div>
              </div>
            </div>
            <p className="text-[10px] text-[#666] mt-2 text-center">Aprovação</p>
          </div>

          {/* Funil IC → Venda Donut */}
          <div className="rounded-2xl p-4 bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-white">Funil IC → Venda</span>
              <Target className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="flex items-center gap-4">
              <div className="relative w-24 h-24 flex-shrink-0">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#2a2a2a" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#06b6d4" strokeWidth="3"
                    strokeDasharray={`${icToSalesRate} ${100 - icToSalesRate}`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-cyan-400 tabular-nums">{icToSalesRate.toFixed(0)}%</span>
                </div>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-500" /><span className="text-white">{frontendICs} ICs</span></div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-white">{frontSales} Vendas</span></div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-violet-500" /><span className="text-white">Ratio 1:{frontSales > 0 ? Math.round(frontendICs / frontSales) : 0}</span></div>
              </div>
            </div>
            <p className="text-[10px] text-[#666] mt-2 text-center">Conversão</p>
          </div>
        </div>

        {/* ===== STATUS PAGAMENTO + UPSELL BREAKDOWN ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Payment status */}
          <div className="rounded-2xl p-4 bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a]">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-semibold text-white">Status Pagamentos</h3>
              <span className="text-[10px] text-[#666] ml-auto">{approvalRate.toFixed(0)}% aprovação</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div className="text-center p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-lg font-bold text-emerald-400 tabular-nums">{frontSales}</p>
                <p className="text-[9px] text-emerald-400/70">Aprovados</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-lg font-bold text-amber-400 tabular-nums">{s?.pending || 0}</p>
                <p className="text-[9px] text-amber-400/70">Pendentes</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-lg font-bold text-red-400 tabular-nums">{s?.refused || 0}</p>
                <p className="text-[9px] text-red-400/70">Recusados</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a]">
                <p className="text-lg font-bold text-[#888] tabular-nums">{s?.refunds || 0}</p>
                <p className="text-[9px] text-[#666]">Reembolsos</p>
              </div>
            </div>
          </div>

          {/* Upsell breakdown */}
          <div className="rounded-2xl p-4 bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a]">
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-4 h-4 text-violet-400" />
              <h3 className="text-xs font-semibold text-white">Breakdown Upsell</h3>
              <span className="text-[10px] text-violet-400 ml-auto tabular-nums">R$ {upsellRevenue.toFixed(0)} total</span>
            </div>
            <div className="space-y-1.5 max-h-[120px] overflow-y-auto">
              {(s?.upsell_detail || []).map((u) => (
                <div key={u.step} className="flex items-center justify-between text-xs">
                  <span className="text-white truncate">{UPSELL_LABELS[u.step] || u.step}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-violet-400 tabular-nums font-medium">{u.count}x</span>
                    <span className="text-white tabular-nums font-bold w-20 text-right">R$ {u.revenue.toFixed(0)}</span>
                  </div>
                </div>
              ))}
              {(!s?.upsell_detail || s.upsell_detail.length === 0) && (
                <p className="text-[10px] text-[#666]">Nenhum upsell hoje</p>
              )}
            </div>
          </div>
        </div>

        <LiveABTest summary={summary} />
        <LiveAIAlerts />
        <LiveAISuggestions />
        <LiveFunnelVelocity />
        <CampaignFilter onChange={setCampaignFilterState} />
        <LiveCampaignTable />
        <LiveUserPresence onTotalChange={handlePresenceTotalChange} campaignFilter={campaignFilterState} />
        <LiveSalesFeed />
        <LiveUpsellMonitor />
        <LiveBuyerProfile summary={summary} totalVisits={totalVisitsToday} />
        <LiveFunnelAnalytics campaignFilter={campaignFilterState} />
        <LiveScrollHeatmap />
        <LiveRevenueChart usdToBrl={1} />
        <LiveComparisonMode />
        <LiveIntelligence />
        <LiveChannelCreativeTable />
        <LiveLeadsTable onLeadClick={(sessionId: string) => setTimelineSessionId(sessionId)} />

        <Tabs defaultValue="logs" className="space-y-4">
          <div className="overflow-x-auto -mx-4 px-4">
            <TabsList className="bg-[#1a1a1a] border border-[#2a2a2a] p-1 rounded-xl inline-flex min-w-max">
              <TabsTrigger value="logs" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 rounded-lg text-[#888] px-3 sm:px-4 whitespace-nowrap">
                <Database className="w-4 h-4 mr-1.5" /><span className="text-sm">Logs</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="logs" className="mt-4">
            <div className="rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a] p-3 sm:p-4 overflow-hidden">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#666]" />
                  <Input placeholder="Buscar por session_id..." value={sessionFilter}
                    onChange={(e) => setSessionFilter(e.target.value)}
                    className="pl-10 bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-[#666] rounded-lg text-sm" />
                </div>
                <Select value={eventFilter} onValueChange={setEventFilter}>
                  <SelectTrigger className="w-full sm:w-40 bg-[#0d0d0d] border-[#2a2a2a] text-white rounded-lg text-sm">
                    <Filter className="w-4 h-4 mr-2 text-[#666]" /><SelectValue placeholder="Filtrar" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="checkout_initiated">Checkout Iniciado</SelectItem>
                    <SelectItem value="payment_completed">Pagamento Completo</SelectItem>
                    <SelectItem value="redirect_executed">Redirect</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <ScrollArea className="h-[400px]" ref={logsContainerRef}>
                <div className="space-y-2">
                  {combinedFunnelLogs.map((log) => (
                    <div key={log.id}
                      className={cn("p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer",
                        "bg-[#0d0d0d] border-[#2a2a2a] hover:border-[#3a3a3a]",
                        log.status === "error" && "border-red-500/30 bg-red-500/5"
                      )}
                      onClick={() => setSelectedSessionId(log.session_id)}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className={cn("p-1.5 rounded-lg flex-shrink-0",
                          log.event_type === "payment_completed" && "bg-emerald-500/20 text-emerald-400",
                          log.event_type === "checkout_initiated" && "bg-violet-500/20 text-violet-400",
                          log.event_type === "redirect_executed" && "bg-blue-500/20 text-blue-400",
                          log.event_type === "redirect_completed" && "bg-cyan-500/20 text-cyan-400",
                          log.event_type === "upsell_oneclick_buy" && "bg-emerald-500/20 text-emerald-400",
                          log.event_type === "upsell_oneclick_decline" && "bg-amber-500/20 text-amber-400",
                          log.status === "error" && "bg-red-500/20 text-red-400",
                          !["payment_completed", "checkout_initiated", "redirect_executed", "redirect_completed", "upsell_oneclick_buy", "upsell_oneclick_decline"].includes(log.event_type) &&
                            log.status !== "error" && "bg-[#2a2a2a] text-[#888]"
                        )}>
                          {getEventIcon(log.event_type)}
                        </div>
                        <span className="text-xs sm:text-sm font-medium text-white flex-shrink-0">{log.event_type.replace(/_/g, " ")}</span>
                        {log.page_id && (
                          <Badge className="text-[9px] sm:text-[10px] bg-[#2a2a2a] text-[#888] border-0 px-1 sm:px-1.5 flex-shrink-0 hidden sm:inline-flex">{log.page_id}</Badge>
                        )}
                        <div className="flex-1" />
                        <div className="flex-shrink-0">{getStatusIcon(log.status)}</div>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-[#666]">
                        <code className="truncate max-w-[100px] sm:max-w-[140px]">{log.session_id.slice(0, 18)}...</code>
                        {log.page_id && <Badge className="text-[9px] bg-[#2a2a2a] text-[#888] border-0 px-1 sm:hidden">{log.page_id}</Badge>}
                        <div className="flex-1" />
                        {log.duration_ms && <Badge className="text-[9px] bg-[#1a1a1a] text-[#888] border-0 px-1 flex-shrink-0">{log.duration_ms}ms</Badge>}
                        <span className="flex-shrink-0 whitespace-nowrap">{formatDate(log.created_at)}</span>
                      </div>
                    </div>
                  ))}
                  {combinedFunnelLogs.length === 0 && (
                    <div className="text-center py-12 text-[#666]">
                      <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>Nenhum evento encontrado</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {selectedSessionId && (
        <SessionLogsDialog sessionId={selectedSessionId} onClose={() => setSelectedSessionId(null)} realtimeLogs={allRealtimeLogs} />
      )}
      {timelineSessionId && (
        <LeadTimeline sessionId={timelineSessionId} onClose={() => setTimelineSessionId(null)} />
      )}
    </div>
  );
}
