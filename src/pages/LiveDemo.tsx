import { useState, useEffect, useRef, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  RefreshCw, TrendingUp, TrendingDown, Clock, DollarSign, Users,
  Activity, Target, Eye, ShoppingCart, CreditCard, ArrowUpRight,
  CheckCircle2, XCircle, Database, Radio, Filter,
  Bell, BellOff, Volume2, VolumeX, Globe, LayoutDashboard,
  FlaskConical, Megaphone, Palette, Receipt, ShieldCheck,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  DEMO_METRICS, DEMO_PERIOD_DATA, getDemoHourlyData, getDemoFunnelSteps,
  getDemoTiktokFunnelSteps, getDemoCampaigns, getDemoCreatives,
  getDemoSalesFeed, getDemoAuditLogs, getDemoABData,
  createRealtimeSimulator, getDemoUpsellStats,
  getDemoMetrics, getDemoPeriodData,
} from "@/lib/demoData";
import type { Sale, AuditLog } from "@/lib/demoData";
import { cn } from "@/lib/utils";

// ── Format helpers ─────────────────────────────────────────────
const fmtBRL = (v: number) =>
  `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtNum = (v: number) => v.toLocaleString("pt-BR");

// ── Period comparison helper ───────────────────────────────────
function pctChange(curr: number, prev: number): { pct: string; trend: "up" | "down" | "neutral" } {
  if (prev === 0) return { pct: "+0%", trend: "neutral" };
  const diff = ((curr - prev) / prev) * 100;
  const sign = diff >= 0 ? "+" : "";
  return {
    pct: `${sign}${diff.toFixed(1)}%`,
    trend: diff > 0.5 ? "up" : diff < -0.5 ? "down" : "neutral",
  };
}

// ── Metric Card (copied from Live.tsx) ─────────────────────────
const MetricCard = ({
  title, value, subtitle, icon: Icon, trend, trendLabel, className, valueClassName, iconClassName, flash,
}: {
  title: string; value: string | number; subtitle?: string; icon?: React.ElementType;
  trend?: "up" | "down" | "neutral"; trendLabel?: string; className?: string;
  valueClassName?: string; iconClassName?: string; flash?: boolean;
}) => (
  <div className={cn(
    "relative overflow-hidden rounded-2xl p-3 sm:p-4 transition-all duration-300 hover:scale-[1.02]",
    "bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a]",
    "shadow-xl hover:shadow-2xl hover:shadow-emerald-500/5",
    flash && "ring-2 ring-emerald-400/60 shadow-emerald-500/20",
    className,
  )}>
    <div className="flex items-start justify-between gap-2">
      <div className="space-y-1 min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {Icon && (
            <div className={cn(
              "p-1.5 rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/20 flex-shrink-0",
              iconClassName,
            )}>
              <Icon className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          )}
          <p className="text-[#888] text-xs font-medium truncate">{title}</p>
        </div>
        <p className={cn("text-xl sm:text-2xl font-bold text-white tracking-tight truncate tabular-nums", valueClassName)}>
          {value}
        </p>
        {subtitle && <p className="text-[#666] text-[10px] sm:text-xs truncate">{subtitle}</p>}
        {trendLabel && (
          <div className={cn(
            "flex items-center gap-1 text-[10px] sm:text-xs font-medium",
            trend === "up" && "text-emerald-400",
            trend === "down" && "text-red-400",
            trend === "neutral" && "text-[#888]",
          )}>
            {trend === "up" && <TrendingUp className="w-3 h-3 flex-shrink-0" />}
            {trend === "down" && <TrendingDown className="w-3 h-3 flex-shrink-0" />}
            <span className="truncate">{trendLabel}</span>
          </div>
        )}
      </div>
    </div>
  </div>
);

// ── Progress ring ──────────────────────────────────────────────
const ProgressRing = ({ value, label, color = "emerald" }: { value: number; label: string; color?: string }) => {
  const circumference = 2 * Math.PI * 36;
  const strokeDashoffset = circumference - (Math.min(value, 100) / 100) * circumference;
  const strokeColor = color === "emerald" ? "#10b981" : color === "violet" ? "#8b5cf6" : "#f59e0b";
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 transform -rotate-90">
          <circle cx="40" cy="40" r="36" stroke="#2a2a2a" strokeWidth="6" fill="none" />
          <circle cx="40" cy="40" r="36" stroke={strokeColor} strokeWidth="6" fill="none"
            strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-white">{value.toFixed(0)}%</span>
        </div>
      </div>
      <span className="text-xs text-[#888] font-medium">{label}</span>
    </div>
  );
};

// ── Event badge color ──────────────────────────────────────────
function eventBadgeClass(evt: string): string {
  if (evt.includes("payment") || evt === "upsell_accepted") return "bg-emerald-500/20 text-emerald-400";
  if (evt.includes("checkout") || evt.includes("cta")) return "bg-violet-500/20 text-violet-400";
  if (evt.includes("redirect")) return "bg-blue-500/20 text-blue-400";
  if (evt.includes("error") || evt.includes("fail") || evt === "upsell_declined") return "bg-red-500/20 text-red-400";
  if (evt.includes("lead") || evt.includes("quiz")) return "bg-amber-500/20 text-amber-400";
  return "bg-[#2a2a2a] text-[#888]";
}

// ── Custom recharts tooltip ────────────────────────────────────
const DarkTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] px-3 py-2 shadow-xl">
      <p className="text-xs text-[#888] mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-sm font-semibold text-white">
          {p.name === "revenue" ? fmtBRL(p.value) : fmtNum(p.value)}
        </p>
      ))}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ════════════════════════════════════════════════════════════════
export default function LiveDemo() {
  // ── Mutable state for realtime simulation ──────────────────
  const [activeUsers, setActiveUsers] = useState(DEMO_METRICS.activeUsersOnline);
  const [revenueToday, setRevenueToday] = useState(DEMO_METRICS.revenueToday);
  const [salesToday, setSalesToday] = useState(DEMO_METRICS.totalSalesApproved);
  const [salesFeed, setSalesFeed] = useState<Sale[]>(() => getDemoSalesFeed());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => getDemoAuditLogs());
  const [revenueFlash, setRevenueFlash] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [dateFilter, setDateFilter] = useState("24h");

  const auditScrollRef = useRef<HTMLDivElement>(null);
  const simulatorRef = useRef(createRealtimeSimulator());

  // ── Funnel presence map (fake online users per step) ───────
  const QUIZ_STEPS = [
    { key: "intro", label: "Intro", icon: "⚡" },
    { key: "idade", label: "Idade", icon: "👤" },
    { key: "nome", label: "Nome", icon: "👥" },
    { key: "prova_social", label: "Prova Social", icon: "🎯" },
    { key: "tentou_online", label: "Tentou Online", icon: "🌐" },
    { key: "meta_renda", label: "Meta Renda", icon: "💰" },
    { key: "obstaculo", label: "Obstáculo", icon: "🔓" },
    { key: "video_mentor", label: "Video Mentor", icon: "👁" },
    { key: "saldo", label: "Saldo", icon: "💳" },
    { key: "disponibilidade", label: "Disponibilidade", icon: "⏰" },
    { key: "demo", label: "Demo", icon: "👁" },
    { key: "whatsapp", label: "WhatsApp", icon: "💬" },
    { key: "contato", label: "Contato", icon: "💬" },
    { key: "input", label: "Input", icon: "✉" },
    { key: "analise", label: "Análise", icon: "⏳" },
    { key: "projecao", label: "Projeção", icon: "👥" },
    { key: "video_venda", label: "Vídeo Venda", icon: "⭐" },
    { key: "checkout", label: "Checkout", icon: "🛒" },
    { key: "thanks", label: "Thanks", icon: "✅" },
    { key: "up1_acel", label: "UP1 Acel.", icon: "🚀" },
    { key: "up2_multi", label: "UP2 Multi.", icon: "📊" },
    { key: "up3_blind", label: "UP3 Blind.", icon: "🗄" },
    { key: "up4_circ", label: "UP4 Circ.", icon: "🔄" },
    { key: "up5_safety", label: "UP5 Safety", icon: "🛡" },
    { key: "up6_forex", label: "UP6 FOREX", icon: "📈" },
  ];
  const TK_STEPS = [
    { key: "tk_intro", label: "Intro", icon: "⚡" },
    { key: "tk_idade", label: "Idade", icon: "👤" },
    { key: "tk_prova", label: "Prova Social", icon: "⭐" },
    { key: "tk_meta", label: "Meta Renda", icon: "🎯" },
    { key: "tk_10min", label: "10 min?", icon: "⏰" },
    { key: "tk_demo", label: "Demo", icon: "📱" },
    { key: "tk_email", label: "E-mail", icon: "✉" },
    { key: "tk_analise", label: "Análise", icon: "⏳" },
    { key: "tk_projecao", label: "Projeção", icon: "👥" },
    { key: "tk_oferta", label: "Oferta", icon: "⭐" },
  ];
  const TKES_STEPS = [
    { key: "es_intro", label: "Intro", icon: "⚡" },
    { key: "es_edad", label: "Edad", icon: "👤" },
    { key: "es_prueba", label: "Prueba", icon: "⭐" },
    { key: "es_meta", label: "Meta", icon: "🎯" },
    { key: "es_10min", label: "10 min", icon: "⏰" },
    { key: "es_contacto", label: "Contacto", icon: "✉" },
    { key: "es_loading", label: "Loading", icon: "⏳" },
    { key: "es_proyeccion", label: "Proyección", icon: "👥" },
    { key: "es_oferta", label: "Oferta", icon: "⭐" },
  ];

  const initPresence = (steps: typeof QUIZ_STEPS, total: number, decay: number) => {
    const result: Record<string, number> = {};
    let remaining = total;
    steps.forEach((s, i) => {
      const base = Math.max(0, Math.round(remaining * (1 - decay + Math.random() * 0.02)));
      result[s.key] = Math.max(0, Math.round(remaining - base + Math.random() * 3));
      remaining = base;
    });
    return result;
  };

  const [quizPresence, setQuizPresence] = useState(() => initPresence(QUIZ_STEPS, 89, 0.12));
  const [tkPresence, setTkPresence] = useState(() => initPresence(TK_STEPS, 31, 0.15));
  const [tkesPresence, setTkesPresence] = useState(() => initPresence(TKES_STEPS, 7, 0.18));

  // ── Realtime intervals ─────────────────────────────────────
  useEffect(() => {
    const simulator = simulatorRef.current;

    // 1) Audit log injection every 5-8s
    const auditInterval = setInterval(() => {
      const newLog = simulator();
      setAuditLogs((prev) => [newLog, ...prev.slice(0, 99)]);
    }, 5000 + Math.random() * 3000);

    // 2) Active users + funnel presence fluctuation every 5s
    const usersInterval = setInterval(() => {
      setActiveUsers((prev) => {
        const delta = Math.floor(Math.random() * 7) - 3;
        return Math.max(90, Math.min(160, prev + delta));
      });
      const fluctuate = (prev: Record<string, number>) => {
        const next = { ...prev };
        for (const k of Object.keys(next)) {
          const d = Math.floor(Math.random() * 5) - 2;
          next[k] = Math.max(0, next[k] + d);
        }
        return next;
      };
      setQuizPresence(fluctuate);
      setTkPresence(fluctuate);
      setTkesPresence(fluctuate);
    }, 5000);

    // 3) New sale every 30-60s
    const saleInterval = setInterval(() => {
      const firstNames = [
        "Joao", "Maria", "Carlos", "Ana", "Pedro", "Fernanda", "Lucas",
        "Camila", "Rafael", "Juliana", "Bruno", "Leticia", "Thiago",
        "Aline", "Felipe", "Larissa", "Gabriel", "Beatriz", "Diego",
        "Mariana", "Gustavo", "Priscila", "Eduardo", "Natalia",
      ];
      const lastNames = [
        "Silva", "Santos", "Oliveira", "Souza", "Pereira", "Costa",
        "Ferreira", "Almeida", "Nascimento", "Lima", "Araujo", "Ribeiro",
      ];
      const name = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
      const amount = 87;
      const newSale: Sale = {
        id: `sale-${Date.now()}`,
        buyerName: name,
        amount,
        productName: "Chave Token ChatGPT",
        source: Math.random() > 0.3 ? "facebook" : "tiktok",
        funnelStep: "step-21",
        createdAt: new Date().toISOString(),
        sessionId: `sim-${Date.now()}`,
      };
      setSalesFeed((prev) => [newSale, ...prev.slice(0, 29)]);
      setRevenueToday((prev) => prev + amount);
      setSalesToday((prev) => prev + 1);

      // Flash revenue card
      setRevenueFlash(true);
      setTimeout(() => setRevenueFlash(false), 1500);
    }, 30000 + Math.random() * 30000);

    return () => {
      clearInterval(auditInterval);
      clearInterval(usersInterval);
      clearInterval(saleInterval);
    };
  }, []);

  // ── Static data (computed once) ────────────────────────────
  const hourlyData = getDemoHourlyData();
  const funnelSteps = getDemoFunnelSteps();
  const tiktokFunnel = getDemoTiktokFunnelSteps();
  const campaigns = getDemoCampaigns();
  const creatives = getDemoCreatives();
  const abData = getDemoABData();
  const upsellStats = getDemoUpsellStats();

  const { current: curr, previous: prev } = DEMO_PERIOD_DATA;
  const m = DEMO_METRICS;

  const revChange = pctChange(curr.revenue, prev.revenue);
  const salesChange = pctChange(curr.sales, prev.sales);
  const leadsChange = pctChange(curr.leads, prev.leads);
  const icChange = pctChange(m.icToSaleRate, (prev.checkouts > 0 ? (prev.sales / prev.checkouts) * 100 : 0));

  const formatDate = useCallback((iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
  }, []);

  // ════════════════════════════════════════════════════════════
  //  RENDER
  // ════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-[1600px] mx-auto px-4 py-6 space-y-6">

        {/* ── Header ──────────────────────────────────────────── */}
        <header className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-emerald-500/80 to-emerald-700/80 flex items-center justify-center flex-shrink-0">
              <Activity className="w-3 h-3 text-white" />
            </div>
            <h1 className="text-sm font-semibold text-white">Dashboard GTL</h1>
            <Badge className="ml-1 bg-violet-500/20 text-violet-400 border-violet-500/30 text-[10px]">DEMO</Badge>

            <div className="flex items-center gap-1 ml-auto">
              <button onClick={() => setSoundEnabled(!soundEnabled)}
                className={cn("w-6 h-6 rounded flex items-center justify-center flex-shrink-0",
                  soundEnabled ? "text-emerald-400" : "text-[#555]")}>
                {soundEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
              </button>
              <button onClick={() => setNotificationsEnabled(!notificationsEnabled)}
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
              <button className="w-6 h-6 rounded flex items-center justify-center text-[#555] flex-shrink-0">
                <RefreshCw className="w-3 h-3" />
              </button>
              <button className="w-6 h-6 rounded flex items-center justify-center text-emerald-400 flex-shrink-0">
                <Radio className="w-3 h-3 animate-pulse" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded">
              <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              <span className="text-[10px] font-medium text-emerald-400 tabular-nums">{activeUsers} online agora</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-0.5 bg-[#141414] border border-[#222] rounded">
              <Globe className="w-2.5 h-2.5 text-sky-400/70 flex-shrink-0" />
              <span className="text-[10px] text-white/70 tabular-nums">{fmtNum(m.totalPageviews)} visitas</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-0.5 bg-[#141414] border border-[#222] rounded">
              <Clock className="w-2.5 h-2.5 text-[#444] flex-shrink-0" />
              <span className="text-[10px] text-[#444] tabular-nums">
                {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
            </div>
          </div>
        </header>

        {/* ── Top KPI Cards (4) ───────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricCard title="Receita Hoje" value={fmtBRL(revenueToday)} icon={DollarSign}
            trend={revChange.trend} trendLabel={`${revChange.pct} vs ontem`} flash={revenueFlash} />
          <MetricCard title="Vendas Hoje" value={fmtNum(salesToday)}
            subtitle={`${m.salesRefunded} reemb. | ${fmtNum(salesToday)} aprovadas`}
            icon={ShoppingCart} trend={salesChange.trend} trendLabel={`${salesChange.pct} vs ontem`} />
          <MetricCard title="Leads Hoje" value={fmtNum(m.leadsCapturados)} icon={Users}
            subtitle={`${fmtNum(7404)} completaram quiz`}
            trend={leadsChange.trend} trendLabel={`${leadsChange.pct} vs ontem`} />
          <MetricCard title="IC para Vendas" value={`${m.icToSaleRate}%`}
            subtitle={`${fmtNum(m.checkoutInitiations)} ICs | 1:3.4`} icon={Target}
            trend={icChange.trend} trendLabel={`${icChange.pct} vs ontem`} />
        </div>

        {/* ── Tabs ─────────────────────────────────────────────── */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="overflow-x-auto -mx-4 px-4">
            <TabsList className="bg-[#1a1a1a] border border-[#2a2a2a] p-1 rounded-xl inline-flex min-w-max">
              <TabsTrigger value="overview" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 rounded-lg text-[#888] px-3 whitespace-nowrap text-xs">
                <LayoutDashboard className="w-3.5 h-3.5 mr-1.5" />Visao Geral
              </TabsTrigger>
              <TabsTrigger value="abtest" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 rounded-lg text-[#888] px-3 whitespace-nowrap text-xs">
                <FlaskConical className="w-3.5 h-3.5 mr-1.5" />Teste A/B
              </TabsTrigger>
              <TabsTrigger value="campaigns" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 rounded-lg text-[#888] px-3 whitespace-nowrap text-xs">
                <Megaphone className="w-3.5 h-3.5 mr-1.5" />Campanhas
              </TabsTrigger>
              <TabsTrigger value="creatives" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 rounded-lg text-[#888] px-3 whitespace-nowrap text-xs">
                <Palette className="w-3.5 h-3.5 mr-1.5" />Criativos
              </TabsTrigger>
              <TabsTrigger value="funnel" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 rounded-lg text-[#888] px-3 whitespace-nowrap text-xs">
                <Filter className="w-3.5 h-3.5 mr-1.5" />Funil
              </TabsTrigger>
              <TabsTrigger value="sales" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 rounded-lg text-[#888] px-3 whitespace-nowrap text-xs">
                <Receipt className="w-3.5 h-3.5 mr-1.5" />Vendas
              </TabsTrigger>
              <TabsTrigger value="audit" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 rounded-lg text-[#888] px-3 whitespace-nowrap text-xs">
                <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />Auditoria
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ═══════════ TAB: VISAO GERAL ═══════════ */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            {/* Secondary KPI row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <MetricCard title="Taxa Aprovacao" value={`${m.approvalRate}%`}
                subtitle={`${m.salesApproved} pagos | ${m.salesPending} pend. | ${m.salesRefused} recus.`}
                icon={CreditCard}
                trend={pctChange(curr.approvalRate, prev.approvalRate).trend}
                trendLabel={`${pctChange(curr.approvalRate, prev.approvalRate).pct} vs ontem`} />
              <MetricCard title="Ticket Medio" value={`R$ ${m.ticketMedio}`}
                subtitle={`LTV: R$ ${Math.round(curr.revenue / curr.sales)}`}
                icon={DollarSign}
                iconClassName="from-violet-500/20 to-violet-600/10 border-violet-500/20"
                valueClassName="text-violet-400" />
              <MetricCard title="Taxa Interacao" value={`${m.pitchArrivalRate}%`}
                subtitle={`${fmtNum(m.totalPageviews)} visitantes`}
                icon={Activity}
                iconClassName="from-amber-500/20 to-amber-600/10 border-amber-500/20"
                valueClassName="text-amber-400" />
              <MetricCard title="Bounce Step 1" value={`${m.bounceStep1}%`}
                subtitle={`${fmtNum(Math.round(17629 * 0.31))} abandonaram no step 1`}
                icon={TrendingDown}
                iconClassName="from-amber-500/20 to-amber-600/10 border-amber-500/20"
                valueClassName="text-amber-400"
                trend="neutral" trendLabel="Normal" />
            </div>

            {/* Horizontal scroll cards */}
            <div className="overflow-x-auto pb-2 -mx-4 px-4" style={{ maxWidth: "calc(100% + 2rem)" }}>
              <div className="flex gap-3 w-max">
                {/* Aprovacao Gateway */}
                <div className="rounded-xl p-4 bg-[#141414] border border-[#2a2a2a] min-w-[220px] w-[220px] flex-shrink-0">
                  <div className="flex items-center justify-between mb-3 gap-2">
                    <h3 className="text-xs font-medium text-[#888] truncate">Aprovacao Gateway</h3>
                    <Globe className="w-4 h-4 text-orange-400 flex-shrink-0" />
                  </div>
                  <div className="flex items-center justify-around gap-2">
                    <ProgressRing value={m.approvalRate} label="Aprovacao" color="emerald" />
                    <div className="flex flex-col gap-2 min-w-0">
                      <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" /><span className="text-xs text-white truncate tabular-nums">{m.salesApproved} Pagos</span></div>
                      <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-yellow-500 flex-shrink-0" /><span className="text-xs text-white truncate tabular-nums">{m.salesPending} Pendentes</span></div>
                      <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0" /><span className="text-xs text-white truncate tabular-nums">{m.salesRefused} Recusados</span></div>
                      <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-[#666] flex-shrink-0" /><span className="text-xs text-white truncate tabular-nums">{m.salesApproved + m.salesPending + m.salesRefused} Total</span></div>
                    </div>
                  </div>
                </div>
                {/* Funil IC -> Venda */}
                <div className="rounded-xl p-4 bg-[#141414] border border-[#2a2a2a] min-w-[220px] w-[220px] flex-shrink-0">
                  <div className="flex items-center justify-between mb-3 gap-2">
                    <h3 className="text-xs font-medium text-[#888] truncate">Funil IC para Venda</h3>
                    <Target className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  </div>
                  <div className="flex items-center justify-around gap-2">
                    <ProgressRing value={m.icToSaleRate} label="Conversao" color="emerald" />
                    <div className="flex flex-col gap-2 min-w-0">
                      <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-amber-500 flex-shrink-0" /><span className="text-xs text-white truncate tabular-nums">{fmtNum(m.checkoutInitiations)} ICs</span></div>
                      <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" /><span className="text-xs text-white truncate tabular-nums">{fmtNum(m.salesApproved)} Vendas</span></div>
                      <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-violet-500 flex-shrink-0" /><span className="text-xs text-white truncate tabular-nums">Ratio 1:3.4</span></div>
                    </div>
                  </div>
                </div>
                {/* Sessoes Unicas */}
                <div className="rounded-xl p-4 bg-[#141414] border border-[#2a2a2a] min-w-[220px] w-[220px] flex-shrink-0">
                  <div className="flex items-center justify-between mb-3 gap-2">
                    <h3 className="text-xs font-medium text-[#888] truncate">Sessoes Unicas</h3>
                    <Eye className="w-4 h-4 text-sky-400 flex-shrink-0" />
                  </div>
                  <div className="flex items-center justify-around gap-2">
                    <ProgressRing value={Math.min((activeUsers / m.checkoutInitiations) * 100, 100)} label="Ativas" color="violet" />
                    <div className="flex flex-col gap-2 min-w-0">
                      <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-sky-500 flex-shrink-0" /><span className="text-xs text-white truncate tabular-nums">{activeUsers} Online</span></div>
                      <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-amber-500 flex-shrink-0" /><span className="text-xs text-white truncate tabular-nums">{fmtNum(m.checkoutInitiations)} ICs hoje</span></div>
                      <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" /><span className="text-xs text-white truncate tabular-nums">{fmtNum(m.salesApproved)} Compraram</span></div>
                    </div>
                  </div>
                </div>
                {/* Ticket Medio */}
                <div className="rounded-xl p-4 bg-[#141414] border border-[#2a2a2a] min-w-[220px] w-[220px] flex-shrink-0">
                  <div className="flex items-center justify-between mb-3 gap-2">
                    <h3 className="text-xs font-medium text-[#888] truncate">Ticket Medio</h3>
                    <DollarSign className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  </div>
                  <div className="flex items-center justify-around gap-2">
                    <ProgressRing value={Math.min((m.ticketMedio / 200) * 100, 100)} label="Ticket" color="amber" />
                    <div className="flex flex-col gap-2 min-w-0">
                      <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" /><span className="text-xs text-white truncate tabular-nums">R$ {m.ticketMedio}</span></div>
                      <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-sky-500 flex-shrink-0" /><span className="text-xs text-white truncate tabular-nums">{fmtBRL(revenueToday)} total</span></div>
                      <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-violet-500 flex-shrink-0" /><span className="text-xs text-white truncate tabular-nums">{fmtNum(salesToday)} vendas</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Revenue chart */}
            <div className="rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a] p-4">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">Receita por Hora</h3>
                <span className="text-[10px] text-[#666] ml-auto">Hoje, 24h</span>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={hourlyData}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="hour" stroke="#444" tick={{ fontSize: 10, fill: "#666" }}
                    tickFormatter={(h) => `${String(h).padStart(2, "0")}h`} />
                  <YAxis stroke="#444" tick={{ fontSize: 10, fill: "#666" }}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<DarkTooltip />} />
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2}
                    fill="url(#revGrad)" name="revenue" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* ── Mapa do Funil — Tempo Real ── */}
            <div className="rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a] p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <Users className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Mapa do Funil — Tempo Real</h3>
                  <p className="text-[10px] text-[#666]">Zero delay • Presença instantânea</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs">{activeUsers}</Badge>
                </div>
              </div>

              {/* Quiz funnel grid */}
              <div className="grid grid-cols-5 sm:grid-cols-7 lg:grid-cols-10 gap-2 mb-4">
                {QUIZ_STEPS.map((s) => {
                  const count = quizPresence[s.key] || 0;
                  return (
                    <div key={s.key} className={cn(
                      "flex flex-col items-center justify-center rounded-xl border p-2 transition-all",
                      count > 0 ? "border-emerald-500/20 bg-emerald-500/5" : "border-[#2a2a2a] bg-[#0d0d0d]"
                    )}>
                      <span className="text-sm mb-0.5">{s.icon}</span>
                      <span className={cn("text-lg font-bold tabular-nums", count > 0 ? "text-white" : "text-[#555]")}>{count}</span>
                      <span className="text-[9px] text-[#888] truncate w-full text-center">{s.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* TikTok funnel */}
              <div className="rounded-xl border border-[#2a2a2a] bg-[#0d0d0d] p-3 mb-3">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold text-red-400 uppercase tracking-wider">FUNIL TIKTOK</span>
                  <span className="text-[10px] text-[#666]">10 etapas</span>
                </div>
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                  {TK_STEPS.map((s) => {
                    const count = tkPresence[s.key] || 0;
                    return (
                      <div key={s.key} className={cn(
                        "flex flex-col items-center justify-center rounded-xl border p-2",
                        count > 0 ? "border-red-500/20 bg-red-500/5" : "border-[#2a2a2a] bg-[#111]"
                      )}>
                        <span className="text-sm mb-0.5">{s.icon}</span>
                        <span className={cn("text-lg font-bold tabular-nums", count > 0 ? "text-white" : "text-[#555]")}>{count}</span>
                        <span className="text-[9px] text-[#888] truncate w-full text-center">{s.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* TikTok ES funnel */}
              <div className="rounded-xl border border-[#2a2a2a] bg-[#0d0d0d] p-3">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold text-red-400 uppercase tracking-wider">FUNIL TIKTOK ES</span>
                  <span className="text-[10px] text-[#666]">9 etapas</span>
                </div>
                <div className="grid grid-cols-5 sm:grid-cols-9 gap-2">
                  {TKES_STEPS.map((s) => {
                    const count = tkesPresence[s.key] || 0;
                    return (
                      <div key={s.key} className={cn(
                        "flex flex-col items-center justify-center rounded-xl border p-2",
                        count > 0 ? "border-orange-500/20 bg-orange-500/5" : "border-[#2a2a2a] bg-[#111]"
                      )}>
                        <span className="text-sm mb-0.5">{s.icon}</span>
                        <span className={cn("text-lg font-bold tabular-nums", count > 0 ? "text-white" : "text-[#555]")}>{count}</span>
                        <span className="text-[9px] text-[#888] truncate w-full text-center">{s.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <p className="text-[10px] text-[#555] text-center mt-3">Atualizado: {new Date().toLocaleTimeString("pt-BR")}</p>
            </div>

            {/* Sales feed (live) */}
            <div className="rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a] p-4">
              <div className="flex items-center gap-2 mb-3">
                <ShoppingCart className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">Vendas Recentes</h3>
                <span className="relative flex h-2 w-2 ml-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
              </div>
              <ScrollArea className="h-[280px]">
                <div className="space-y-2">
                  {salesFeed.slice(0, 15).map((s, i) => (
                    <div key={s.id} className={cn(
                      "flex items-center justify-between p-2.5 rounded-xl border transition-all",
                      "bg-[#0d0d0d] border-[#2a2a2a]",
                      i === 0 && "border-emerald-500/30 bg-emerald-500/5 animate-pulse",
                    )}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate">{s.buyerName}</p>
                          <p className="text-[10px] text-[#666] truncate">{s.productName} &middot; {s.source}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <p className="text-sm font-bold text-emerald-400 tabular-nums">{fmtBRL(s.amount)}</p>
                        <p className="text-[10px] text-[#666]">{formatDate(s.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          {/* ═══════════ TAB: TESTE A/B ═══════════ */}
          <TabsContent value="abtest" className="space-y-4 mt-4">
            <div className="rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a] p-4">
              <div className="flex items-center gap-2 mb-4">
                <FlaskConical className="w-4 h-4 text-violet-400" />
                <h3 className="text-sm font-semibold text-white">Teste A/B - Variantes</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[#2a2a2a]">
                      {["Variante", "Visitantes", "CTA %", "Quiz %", "IC %", "Conv %", "Vendas", "Receita", "RPV", "Ticket", "Score"].map((h) => (
                        <th key={h} className="text-left py-2 px-3 text-[#888] font-medium whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {abData.map((row) => (
                      <tr key={row.variant} className={cn(
                        "border-b border-[#1a1a1a] hover:bg-[#141414] transition-colors",
                        row.variant === "A" && "bg-emerald-500/5",
                      )}>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">{row.variant}</span>
                            {row.variant === "A" && (
                              <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-[9px] px-1.5">WINNER</Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-white tabular-nums">{fmtNum(row.visitors)}</td>
                        <td className="py-2.5 px-3 text-white tabular-nums">{row.ctaRate}%</td>
                        <td className="py-2.5 px-3 text-white tabular-nums">{row.quizRate}%</td>
                        <td className="py-2.5 px-3 text-white tabular-nums">{row.icRate}%</td>
                        <td className="py-2.5 px-3 text-emerald-400 font-semibold tabular-nums">{row.convRate}%</td>
                        <td className="py-2.5 px-3 text-white tabular-nums">{fmtNum(row.frontSales)}</td>
                        <td className="py-2.5 px-3 text-white tabular-nums">{fmtBRL(row.totalRevenue)}</td>
                        <td className="py-2.5 px-3 text-white tabular-nums">R$ {row.rpv.toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-white tabular-nums">R$ {row.avgTicket}</td>
                        <td className="py-2.5 px-3">
                          <div className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold",
                            row.score >= 90 ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400",
                          )}>
                            {row.score}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[11px] text-emerald-400/70 mt-3">
                Variante A tem 17% mais receita por visitante (RPV) e 11% maior taxa de conversao. Confianca estatistica: 97.2%.
              </p>
            </div>
          </TabsContent>

          {/* ═══════════ TAB: CAMPANHAS ═══════════ */}
          <TabsContent value="campaigns" className="space-y-4 mt-4">
            <div className="rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a] p-4">
              <div className="flex items-center gap-2 mb-4">
                <Megaphone className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-white">Performance por Campanha</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[#2a2a2a]">
                      {["Campanha", "Leads", "CK", "Vendas", "Conv%", "Receita", "Gasto", "CPA", "ROAS"].map((h) => (
                        <th key={h} className="text-left py-2 px-3 text-[#888] font-medium whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((c) => (
                      <tr key={c.campaign} className="border-b border-[#1a1a1a] hover:bg-[#141414] transition-colors">
                        <td className="py-2.5 px-3 text-white font-medium max-w-[200px] truncate">{c.campaign}</td>
                        <td className="py-2.5 px-3 text-white tabular-nums">{fmtNum(c.leads)}</td>
                        <td className="py-2.5 px-3 text-white tabular-nums">{fmtNum(c.checkouts)}</td>
                        <td className="py-2.5 px-3 text-emerald-400 font-semibold tabular-nums">{fmtNum(c.sales)}</td>
                        <td className="py-2.5 px-3 text-white tabular-nums">{c.convRate.toFixed(1)}%</td>
                        <td className="py-2.5 px-3 text-white tabular-nums">{fmtBRL(c.revenue)}</td>
                        <td className="py-2.5 px-3 text-red-400/80 tabular-nums">{fmtBRL(c.spend)}</td>
                        <td className="py-2.5 px-3 text-white tabular-nums">R$ {c.cpa.toFixed(2)}</td>
                        <td className="py-2.5 px-3">
                          <span className={cn(
                            "tabular-nums font-semibold",
                            c.roas >= 2 ? "text-emerald-400" : c.roas >= 1.5 ? "text-amber-400" : "text-red-400",
                          )}>
                            {c.roas.toFixed(2)}x
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-[#2a2a2a]">
                      <td className="py-2.5 px-3 text-[#888] font-semibold">Total</td>
                      <td className="py-2.5 px-3 text-white font-semibold tabular-nums">{fmtNum(campaigns.reduce((s, c) => s + c.leads, 0))}</td>
                      <td className="py-2.5 px-3 text-white font-semibold tabular-nums">{fmtNum(campaigns.reduce((s, c) => s + c.checkouts, 0))}</td>
                      <td className="py-2.5 px-3 text-emerald-400 font-semibold tabular-nums">{fmtNum(campaigns.reduce((s, c) => s + c.sales, 0))}</td>
                      <td className="py-2.5 px-3" />
                      <td className="py-2.5 px-3 text-white font-semibold tabular-nums">{fmtBRL(campaigns.reduce((s, c) => s + c.revenue, 0))}</td>
                      <td className="py-2.5 px-3 text-red-400/80 font-semibold tabular-nums">{fmtBRL(campaigns.reduce((s, c) => s + c.spend, 0))}</td>
                      <td className="py-2.5 px-3" />
                      <td className="py-2.5 px-3 text-emerald-400 font-semibold tabular-nums">
                        {(campaigns.reduce((s, c) => s + c.revenue, 0) / campaigns.reduce((s, c) => s + c.spend, 0)).toFixed(2)}x
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* ═══════════ TAB: CRIATIVOS ═══════════ */}
          <TabsContent value="creatives" className="space-y-4 mt-4">
            <div className="rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a] p-4">
              <div className="flex items-center gap-2 mb-4">
                <Palette className="w-4 h-4 text-sky-400" />
                <h3 className="text-sm font-semibold text-white">Performance por Canal / Criativo</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[#2a2a2a]">
                      {["Canal", "Criativo", "Leads", "CK", "Vendas", "Conv%", "Receita", "% Pitch"].map((h) => (
                        <th key={h} className="text-left py-2 px-3 text-[#888] font-medium whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {creatives.map((c) => (
                      <tr key={`${c.channel}-${c.creative}`} className="border-b border-[#1a1a1a] hover:bg-[#141414] transition-colors">
                        <td className="py-2.5 px-3">
                          <Badge className={cn(
                            "text-[10px] border-0 px-1.5",
                            c.channel === "Facebook" ? "bg-blue-500/20 text-blue-400" : "bg-pink-500/20 text-pink-400",
                          )}>{c.channel}</Badge>
                        </td>
                        <td className="py-2.5 px-3 text-white font-medium">{c.creative}</td>
                        <td className="py-2.5 px-3 text-white tabular-nums">{fmtNum(c.leads)}</td>
                        <td className="py-2.5 px-3 text-white tabular-nums">{fmtNum(c.checkouts)}</td>
                        <td className="py-2.5 px-3 text-emerald-400 font-semibold tabular-nums">{fmtNum(c.sales)}</td>
                        <td className="py-2.5 px-3 text-white tabular-nums">{c.convRate.toFixed(1)}%</td>
                        <td className="py-2.5 px-3 text-white tabular-nums">{fmtBRL(c.revenue)}</td>
                        <td className="py-2.5 px-3 text-amber-400 tabular-nums">{c.pitchRate.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* ═══════════ TAB: FUNIL ═══════════ */}
          <TabsContent value="funnel" className="space-y-4 mt-4">
            {/* Quiz funnel */}
            <div className="rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a] p-4">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">Funil Quiz (23 steps)</h3>
                <span className="text-[10px] text-[#666] ml-auto">{fmtNum(funnelSteps[0].views)} entradas</span>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={funnelSteps} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <XAxis dataKey="step" stroke="#444" tick={{ fontSize: 9, fill: "#666" }} angle={-45} textAnchor="end" height={50} />
                  <YAxis stroke="#444" tick={{ fontSize: 10, fill: "#666" }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] px-3 py-2 shadow-xl">
                        <p className="text-xs text-[#888] mb-1">{d.label}</p>
                        <p className="text-sm font-semibold text-white">{fmtNum(d.views)} visitas</p>
                        <p className="text-[10px] text-red-400">Drop-off: {d.dropOff}%</p>
                      </div>
                    );
                  }} />
                  <Bar dataKey="views" radius={[4, 4, 0, 0]}
                    fill="#10b981"
                    fillOpacity={0.7} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* TikTok funnel */}
            <div className="rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a] p-4">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-4 h-4 text-pink-400" />
                <h3 className="text-sm font-semibold text-white">Funil TikTok VSL (10 steps)</h3>
                <span className="text-[10px] text-[#666] ml-auto">{fmtNum(tiktokFunnel[0].views)} entradas</span>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={tiktokFunnel} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <XAxis dataKey="step" stroke="#444" tick={{ fontSize: 10, fill: "#666" }} />
                  <YAxis stroke="#444" tick={{ fontSize: 10, fill: "#666" }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] px-3 py-2 shadow-xl">
                        <p className="text-xs text-[#888] mb-1">{d.label}</p>
                        <p className="text-sm font-semibold text-white">{fmtNum(d.views)} visitas</p>
                        <p className="text-[10px] text-red-400">Drop-off: {d.dropOff}%</p>
                      </div>
                    );
                  }} />
                  <Bar dataKey="views" radius={[4, 4, 0, 0]} fill="#ec4899" fillOpacity={0.7} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          {/* ═══════════ TAB: VENDAS ═══════════ */}
          <TabsContent value="sales" className="space-y-4 mt-4">
            {/* Sales feed */}
            <div className="rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a] p-4">
              <div className="flex items-center gap-2 mb-3">
                <ShoppingCart className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">Feed de Vendas</h3>
                <span className="relative flex h-2 w-2 ml-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-[10px] text-[#666] ml-auto">{fmtNum(salesToday)} vendas hoje</span>
              </div>
              <ScrollArea className="h-[320px]">
                <div className="space-y-2">
                  {salesFeed.slice(0, 20).map((s, i) => (
                    <div key={s.id} className={cn(
                      "flex items-center justify-between p-2.5 rounded-xl border transition-all",
                      "bg-[#0d0d0d] border-[#2a2a2a]",
                      i === 0 && "border-emerald-500/30 bg-emerald-500/5",
                    )}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate">{s.buyerName}</p>
                          <p className="text-[10px] text-[#666] truncate">{s.productName} &middot; {s.source} &middot; {s.funnelStep}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <p className="text-sm font-bold text-emerald-400 tabular-nums">{fmtBRL(s.amount)}</p>
                        <p className="text-[10px] text-[#666]">{formatDate(s.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Upsell stats */}
            <div className="rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a] p-4">
              <div className="flex items-center gap-2 mb-4">
                <ArrowUpRight className="w-4 h-4 text-violet-400" />
                <h3 className="text-sm font-semibold text-white">Upsells</h3>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.values(upsellStats).map((u) => (
                  <div key={u.name} className="rounded-xl p-3 bg-[#0d0d0d] border border-[#2a2a2a]">
                    <h4 className="text-xs font-medium text-white mb-2 truncate">{u.name}</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-[#888]">Views</span>
                        <span className="text-white tabular-nums">{fmtNum(u.views)}</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-[#888]">Compras</span>
                        <span className="text-emerald-400 tabular-nums">{fmtNum(u.buys)}</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-[#888]">Receita</span>
                        <span className="text-white font-semibold tabular-nums">{fmtBRL(u.revenue)}</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-[#888]">Conv%</span>
                        <span className="text-violet-400 font-semibold tabular-nums">{u.convRate.toFixed(1)}%</span>
                      </div>
                    </div>
                    {/* Mini progress bar */}
                    <div className="mt-2 h-1.5 rounded-full bg-[#2a2a2a] overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-violet-400 transition-all duration-500"
                        style={{ width: `${u.convRate}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* ═══════════ TAB: AUDITORIA ═══════════ */}
          <TabsContent value="audit" className="space-y-4 mt-4">
            <div className="rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a] p-4">
              <div className="flex items-center gap-2 mb-3">
                <Database className="w-4 h-4 text-sky-400" />
                <h3 className="text-sm font-semibold text-white">Audit Log (Realtime)</h3>
                <span className="relative flex h-2 w-2 ml-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500" />
                </span>
                <span className="text-[10px] text-[#666] ml-auto tabular-nums">{auditLogs.length} eventos</span>
              </div>

              <ScrollArea className="h-[500px]" ref={auditScrollRef}>
                <div className="space-y-1.5">
                  {auditLogs.map((log, i) => (
                    <div key={log.id} className={cn(
                      "flex items-center gap-3 p-2 rounded-lg border transition-all",
                      "bg-[#0d0d0d] border-[#1a1a1a] hover:border-[#2a2a2a]",
                      i === 0 && "border-sky-500/30 bg-sky-500/5",
                    )}>
                      <span className="text-[10px] text-[#555] tabular-nums flex-shrink-0 w-[100px]">
                        {formatDate(log.created_at)}
                      </span>
                      <Badge className={cn("text-[9px] border-0 px-1.5 flex-shrink-0 min-w-[110px] justify-center", eventBadgeClass(log.event_type))}>
                        {log.event_type.replace(/_/g, " ")}
                      </Badge>
                      <code className="text-[10px] text-[#555] truncate flex-1 min-w-0">
                        {log.session_id.slice(0, 20)}...
                      </code>
                      {log.page_id && (
                        <Badge className="text-[9px] bg-[#2a2a2a] text-[#888] border-0 px-1.5 flex-shrink-0">
                          {log.page_id}
                        </Badge>
                      )}
                      <div className={cn(
                        "w-2 h-2 rounded-full flex-shrink-0",
                        log.status === "success" ? "bg-emerald-500" : log.status === "error" ? "bg-red-500" : "bg-amber-500",
                      )} />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
