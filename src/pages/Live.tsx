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
  Globe, TrendingDown
} from "lucide-react";
import LiveRevenueChart from "@/components/LiveRevenueChart";
import LiveUserPresence from "@/components/LiveUserPresence";
import LiveIntelligence from "@/components/LiveIntelligence";
import LiveFunnelAnalytics from "@/components/LiveFunnelAnalytics";
import LiveLeadsTable from "@/components/LiveLeadsTable";
import LiveUpsellMonitor from "@/components/LiveUpsellMonitor";
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

const ProgressRing = ({ value, label, color = "emerald" }: { value: number; label: string; color?: string }) => {
  const circumference = 2 * Math.PI * 36;
  const strokeDashoffset = circumference - (value / 100) * circumference;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 transform -rotate-90">
          <circle cx="40" cy="40" r="36" stroke="#2a2a2a" strokeWidth="6" fill="none" />
          <circle cx="40" cy="40" r="36"
            stroke={color === "emerald" ? "#10b981" : color === "violet" ? "#8b5cf6" : "#f59e0b"}
            strokeWidth="6" fill="none" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-white">{value.toFixed(0)}%</span>
        </div>
      </div>
      <span className="text-xs text-[#888] font-medium">{label}</span>
    </div>
  );
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
  
  const [frontendICs, setFrontendICs] = useState(0);
  const [hotmartSalesToday, setHotmartSalesToday] = useState(0);
  const [icToSalesRate, setIcToSalesRate] = useState(0);
  const [icToSalesRatio, setIcToSalesRatio] = useState("0:0");
  const [hotmartApproved, setHotmartApproved] = useState(0);
  const [hotmartRefunded, setHotmartRefunded] = useState(0);
  const [hotmartApprovalRate, setHotmartApprovalRate] = useState(0);
  
  const USD_TO_BRL = 5.80;
  const [totalRevenueToday, setTotalRevenueToday] = useState(0);
  const [totalLeadsToday, setTotalLeadsToday] = useState(0);
  const [qualifiedLeadsToday, setQualifiedLeadsToday] = useState(0);
  const [interactionRateToday, setInteractionRateToday] = useState(0);
  const [totalVisitsToday, setTotalVisitsToday] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
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

    const { data: checkoutPageLoads } = await supabase.from("funnel_audit_logs").select("session_id")
      .eq("event_type", "page_loaded").in("page_id", ["/checkout", "/step-19"]).gte("created_at", todayISO);

    const icSessions = new Set<string>();
    checkoutPageLoads?.forEach(r => icSessions.add(r.session_id));
    setFrontendICs(icSessions.size);

    const { data: purchaseData } = await supabase.from("purchase_tracking").select("amount, status, email").gte("created_at", todayISO);

    const approvedPurchases = purchaseData?.filter(r => 
      r.status === "completed" || r.status === "purchased" || r.status === "approved" || r.status === "redirected"
    ) || [];
    const refundedPurchases = purchaseData?.filter(r => r.status === "refunded" || r.status === "canceled") || [];
    
    const totalRevenueBRL = approvedPurchases.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    const uniqueBuyers = new Set(approvedPurchases.filter(r => r.email).map(r => r.email!.toLowerCase())).size;
    
    setHotmartSalesToday(approvedPurchases.length);
    setTotalRevenueToday(totalRevenueBRL);
    setHotmartApproved(approvedPurchases.length);
    setHotmartRefunded(refundedPurchases.length);
    
    const totalAttempts = approvedPurchases.length + refundedPurchases.length;
    setHotmartApprovalRate(totalAttempts > 0 ? (approvedPurchases.length / totalAttempts) * 100 : 0);

    const rate = icSessions.size > 0 ? (uniqueBuyers / icSessions.size) * 100 : 0;
    setIcToSalesRate(rate);
    setIcToSalesRatio(uniqueBuyers > 0 ? `1:${Math.round(icSessions.size / uniqueBuyers)}` : "0:0");

    // Fetch lead behavior KPIs
    const { data: leadData } = await supabase.from("lead_behavior")
      .select("cta_clicks, intent_score, checkout_clicked")
      .gte("created_at", todayISO);
    const tLeads = leadData?.length || 0;
    setTotalLeadsToday(tLeads);
    setQualifiedLeadsToday(leadData?.filter(l => (l.intent_score || 0) >= 50).length || 0);
    setInteractionRateToday(tLeads > 0 ? ((leadData?.filter(l => l.cta_clicks > 0).length || 0) / tLeads) * 100 : 0);

    // Count unique sessions (visitors) today
    const { data: visitRows } = await supabase.from("funnel_audit_logs")
      .select("session_id")
      .eq("event_type", "page_loaded")
      .eq("page_id", "/step-1")
      .gte("created_at", todayISO);
    const uniqueVisits = new Set(visitRows?.map(r => r.session_id)).size;
    setTotalVisitsToday(uniqueVisits);

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
        if (newPurchase.status === 'purchased' || newPurchase.status === 'completed') fetchData();
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
    if (autoRefresh) { const interval = setInterval(fetchData, 10000); return () => clearInterval(interval); }
  }, [fetchData, autoRefresh]);
  
  useEffect(() => {
    const handleVisibilityChange = () => { if (document.visibilityState === 'visible') fetchData(); };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => { document.removeEventListener('visibilitychange', handleVisibilityChange); };
  }, [fetchData]);

  const exportLogs = () => {
    const data = JSON.stringify(logs, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `funnel-audit-logs-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    toast.success("Logs exported!");
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
              <button onClick={toggleSound}
                className={cn("w-6 h-6 rounded flex items-center justify-center flex-shrink-0",
                  soundEnabled ? "text-emerald-400" : "text-[#555]")}>
                {soundEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
              </button>
              <button onClick={toggleNotifications}
                className={cn("w-6 h-6 rounded flex items-center justify-center flex-shrink-0",
                  notificationsEnabled ? "text-emerald-400" : "text-[#555]")}>
                {notificationsEnabled ? <Bell className="w-3 h-3" /> : <BellOff className="w-3 h-3" />}
              </button>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="h-6 w-auto bg-[#141414] border-[#222] text-white/80 rounded text-[10px] px-1.5 gap-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#141414] border-[#222]">
                  <SelectItem value="1h">1h</SelectItem>
                  <SelectItem value="24h">24h</SelectItem>
                  <SelectItem value="7d">7d</SelectItem>
                  <SelectItem value="30d">30d</SelectItem>
                </SelectContent>
              </Select>
              <button onClick={fetchData} disabled={isLoading}
                className="w-6 h-6 rounded flex items-center justify-center text-[#555] flex-shrink-0">
                <RefreshCw className={cn("w-3 h-3", isLoading && "animate-spin")} />
              </button>
              <button onClick={() => setAutoRefresh(!autoRefresh)}
                className={cn("w-6 h-6 rounded flex items-center justify-center flex-shrink-0",
                  autoRefresh ? "text-emerald-400" : "text-[#555]")}>
                <Radio className={cn("w-3 h-3", autoRefresh && "animate-pulse")} />
              </button>
              <button onClick={exportLogs}
                className="w-6 h-6 rounded flex items-center justify-center text-[#555] flex-shrink-0">
                <Download className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded">
              <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-medium text-emerald-400 tabular-nums">{activeUsers} online</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-0.5 bg-[#141414] border border-[#222] rounded">
              <Globe className="w-2.5 h-2.5 text-sky-400/70 flex-shrink-0" />
              <span className="text-[10px] text-white/70 tabular-nums">{totalVisitsToday} visitas</span>
            </div>
            {lastUpdated && (
              <div className="flex items-center gap-1 px-2 py-0.5 bg-[#141414] border border-[#222] rounded">
                <Clock className="w-2.5 h-2.5 text-[#444] flex-shrink-0" />
                <span className="text-[10px] text-[#444] tabular-nums">{lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              </div>
            )}
          </div>
        </header>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricCard title="Receita Hoje"
            value={`R$ ${totalRevenueToday.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon={DollarSign} trend="up" trendLabel={`${hotmartSalesToday} vendas`} />
          <MetricCard title="Vendas Hoje" value={hotmartSalesToday} subtitle={`${hotmartRefunded} reembolsos`} icon={ShoppingCart} />
          <MetricCard title="Taxa de Aprovação" value={`${hotmartApprovalRate.toFixed(1)}%`}
            subtitle={`${hotmartApproved} aprov. · ${hotmartRefunded} reemb.`} icon={CreditCard} />
          <MetricCard title="IC → Vendas" value={`${icToSalesRate.toFixed(1)}%`}
            subtitle={`${frontendICs} ICs · ${icToSalesRatio}`} icon={Target} />
        </div>

        <div className="grid grid-cols-3 lg:grid-cols-3 gap-3">
          <MetricCard title="Leads Hoje" value={totalLeadsToday} icon={Users}
            subtitle={`${qualifiedLeadsToday} qualificados`} />
          <MetricCard title="Qualificados" value={qualifiedLeadsToday}
            subtitle={totalLeadsToday > 0 ? `${((qualifiedLeadsToday / totalLeadsToday) * 100).toFixed(1)}% dos leads` : "0%"}
            icon={Eye} iconClassName="from-violet-500/20 to-violet-600/10 border-violet-500/20" valueClassName="text-violet-400" />
          <MetricCard title="Taxa Interação" value={`${interactionRateToday.toFixed(1)}%`}
            subtitle={`${totalLeadsToday} visitantes`}
            icon={Activity} iconClassName="from-amber-500/20 to-amber-600/10 border-amber-500/20" valueClassName="text-amber-400" />
        </div>

        <div className="overflow-x-auto pb-2 -mx-4 px-4" style={{ maxWidth: 'calc(100% + 2rem)' }}>
          <div className="flex gap-3 w-max">
            {/* Aprovação Gateway */}
            <div className="rounded-xl p-4 bg-[#141414] border border-[#2a2a2a] min-w-[220px] w-[220px] flex-shrink-0 overflow-hidden">
              <div className="flex items-center justify-between mb-3 gap-2">
                <h3 className="text-xs font-medium text-[#888] truncate">Aprovação Gateway</h3>
                <Globe className="w-4 h-4 text-orange-400 flex-shrink-0" />
              </div>
              <div className="flex items-center justify-around gap-2">
                <ProgressRing value={hotmartApprovalRate} label="Aprovação" color="emerald" />
                <div className="flex flex-col gap-2 min-w-0">
                  <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" /><span className="text-xs text-white truncate tabular-nums">{hotmartApproved} Aprov.</span></div>
                  <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0" /><span className="text-xs text-white truncate tabular-nums">{hotmartRefunded} Reemb.</span></div>
                  <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-[#666] flex-shrink-0" /><span className="text-xs text-white truncate tabular-nums">{hotmartApproved + hotmartRefunded} Total</span></div>
                </div>
              </div>
            </div>

            {/* Funil IC → Venda */}
            <div className="rounded-xl p-4 bg-[#141414] border border-[#2a2a2a] min-w-[220px] w-[220px] flex-shrink-0 overflow-hidden">
              <div className="flex items-center justify-between mb-3 gap-2">
                <h3 className="text-xs font-medium text-[#888] truncate">Funil IC → Venda</h3>
                <Target className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              </div>
              <div className="flex items-center justify-around gap-2">
                <ProgressRing value={icToSalesRate} label="Conversão" color="emerald" />
                <div className="flex flex-col gap-2 min-w-0">
                  <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-amber-500 flex-shrink-0" /><span className="text-xs text-white truncate tabular-nums">{frontendICs} ICs</span></div>
                  <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" /><span className="text-xs text-white truncate tabular-nums">{hotmartSalesToday} Vendas</span></div>
                  <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-violet-500 flex-shrink-0" /><span className="text-xs text-white truncate tabular-nums">Ratio {icToSalesRatio}</span></div>
                </div>
              </div>
            </div>

            {/* Sessões Únicas */}
            <div className="rounded-xl p-4 bg-[#141414] border border-[#2a2a2a] min-w-[220px] w-[220px] flex-shrink-0 overflow-hidden">
              <div className="flex items-center justify-between mb-3 gap-2">
                <h3 className="text-xs font-medium text-[#888] truncate">Sessões Únicas</h3>
                <Eye className="w-4 h-4 text-sky-400 flex-shrink-0" />
              </div>
              <div className="flex items-center justify-around gap-2">
                <ProgressRing value={frontendICs > 0 ? Math.min((activeUsers / frontendICs) * 100, 100) : 0} label="Ativas" color="violet" />
                <div className="flex flex-col gap-2 min-w-0">
                  <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-sky-500 flex-shrink-0" /><span className="text-xs text-white truncate tabular-nums">{activeUsers} Online</span></div>
                  <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-amber-500 flex-shrink-0" /><span className="text-xs text-white truncate tabular-nums">{frontendICs} ICs hoje</span></div>
                  <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" /><span className="text-xs text-white truncate tabular-nums">{hotmartSalesToday} Compraram</span></div>
                </div>
              </div>
            </div>

            {/* Ticket Médio */}
            <div className="rounded-xl p-4 bg-[#141414] border border-[#2a2a2a] min-w-[220px] w-[220px] flex-shrink-0 overflow-hidden">
              <div className="flex items-center justify-between mb-3 gap-2">
                <h3 className="text-xs font-medium text-[#888] truncate">Ticket Médio</h3>
                <DollarSign className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              </div>
              <div className="flex items-center justify-around gap-2">
                <ProgressRing value={Math.min(hotmartSalesToday > 0 ? (totalRevenueToday / hotmartSalesToday / 200) * 100 : 0, 100)} label="Ticket" color="amber" />
                <div className="flex flex-col gap-2 min-w-0">
                  <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" /><span className="text-xs text-white truncate tabular-nums">R$ {hotmartSalesToday > 0 ? (totalRevenueToday / hotmartSalesToday).toFixed(0) : '0'}</span></div>
                  <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-sky-500 flex-shrink-0" /><span className="text-xs text-white truncate tabular-nums">R$ {totalRevenueToday.toFixed(0)} total</span></div>
                  <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-violet-500 flex-shrink-0" /><span className="text-xs text-white truncate tabular-nums">{hotmartSalesToday} vendas</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <LiveUserPresence onTotalChange={handlePresenceTotalChange} />
        <LiveUpsellMonitor />
        <LiveFunnelAnalytics />
        <LiveRevenueChart usdToBrl={1} />
        <LiveIntelligence />
        <LiveLeadsTable />


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
    </div>
  );
}
