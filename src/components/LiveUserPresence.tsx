import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  RefreshCw, Users, Eye, ShoppingCart, Zap, CheckCircle2,
  PlayCircle, Smartphone, Clock, Brain, MessageCircle, 
  UserCheck, Target, Star, Sparkles, Gift, Mail,
  Rocket, BarChart3, CreditCard, ArrowDownCircle, Trophy, ShieldCheck, TrendingUp, DollarSign
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FunnelStep {
  id: string;
  route: string;
  label: string;
  icon: React.ElementType;
  count: number;
}

interface PresencePayload {
  session_id: string;
  page_id: string;
  lead_name?: string;
  joined_at: string;
}

interface OnlineUser {
  session_id: string;
  name: string;
  page: string;
  joined_at: string;
}

interface RecentPurchase {
  session_id: string | null;
  buyer_name: string | null;
  amount: number | null;
  funnel_step: string | null;
}

interface LiveUserPresenceProps {
  onTotalChange?: (total: number) => void;
}

const STEPS: FunnelStep[] = [
  { id: "step1", route: "/step-1", label: "Intro", icon: Zap, count: 0 },
  { id: "step2", route: "/step-2", label: "Idade", icon: Users, count: 0 },
  { id: "step3", route: "/step-3", label: "Nome", icon: UserCheck, count: 0 },
  { id: "step4", route: "/step-4", label: "Prova Social", icon: Star, count: 0 },
  { id: "step5", route: "/step-5", label: "Tentou Online", icon: Target, count: 0 },
  { id: "step6", route: "/step-6", label: "Meta Renda", icon: Target, count: 0 },
  { id: "step7", route: "/step-7", label: "Obstáculo", icon: Brain, count: 0 },
  { id: "step8", route: "/step-8", label: "Vídeo Mentor", icon: PlayCircle, count: 0 },
  { id: "step9", route: "/step-9", label: "Saldo", icon: Eye, count: 0 },
  { id: "step10", route: "/step-10", label: "Disponibilidade", icon: Clock, count: 0 },
  { id: "step11", route: "/step-11", label: "Demo", icon: Eye, count: 0 },
  { id: "step12", route: "/step-12", label: "Loading", icon: RefreshCw, count: 0 },
  { id: "step13", route: "/step-13", label: "Prova Social 2", icon: Star, count: 0 },
  { id: "step14", route: "/step-14", label: "WhatsApp", icon: MessageCircle, count: 0 },
  { id: "step15", route: "/step-15", label: "Contato", icon: Mail, count: 0 },
  { id: "step16", route: "/step-16", label: "Input", icon: UserCheck, count: 0 },
  { id: "step17", route: "/step-17", label: "Oferta Final", icon: ShoppingCart, count: 0 },
  { id: "checkout", route: "/checkout", label: "Checkout", icon: Gift, count: 0 },
  { id: "thanks", route: "/thanks", label: "Thanks", icon: CheckCircle2, count: 0 },
  { id: "upsell1", route: "/upsell1", label: "UP1 Acel.", icon: Rocket, count: 0 },
  { id: "upsell2", route: "/upsell2", label: "UP2 Multi.", icon: BarChart3, count: 0 },
  { id: "upsell3", route: "/upsell3", label: "UP3 Blind.", icon: CreditCard, count: 0 },
  { id: "upsell4", route: "/upsell4", label: "UP4 Círc.", icon: Trophy, count: 0 },
  { id: "upsell5", route: "/upsell5", label: "UP5 Safety", icon: ShieldCheck, count: 0 },
  { id: "upsell6", route: "/upsell6", label: "UP6 FOREX", icon: TrendingUp, count: 0 },
];

const FUNNEL_STEP_LABELS: Record<string, string> = {
  front_37: "R$37",
  front_47: "R$47",
  acelerador_basico: "UP1",
  acelerador_duplo: "UP1",
  acelerador_maximo: "UP1",
  multiplicador_prata: "UP2",
  multiplicador_ouro: "UP2",
  multiplicador_diamante: "UP2",
  blindagem: "UP3",
  circulo_interno: "UP4",
  safety_pro: "UP5",
  forex_mentoria: "UP6",
  downsell_guia: "DS",
};

const toStepId = (page: string): string | null => {
  const p = page.toLowerCase();
  if (p.includes("/upsell6") || p.includes("forex")) return "upsell6";
  if (p.includes("/upsell5") || p.includes("safety")) return "upsell5";
  if (p.includes("/upsell4") || p.includes("/upsell-sucesso") || p.includes("upsell4-")) return "upsell4";
  if (p.includes("/upsell3") || p.includes("blindagem")) return "upsell3";
  if (p.includes("/upsell2") || p.includes("multiplicador")) return "upsell2";
  if (p.includes("/upsell")) return "upsell1";
  if (p.includes("/thanks")) return "thanks";
  if (p.includes("/checkout") || p.includes("/processing")) return "checkout";
  // Map old 19-step routes to current 17-step structure
  const OLD_STEP_MAP: Record<number, string> = { 18: "step16", 19: "step17" };
  for (let i = 19; i >= 1; i--) {
    if (p.includes(`/step-${i}`)) return OLD_STEP_MAP[i] || `step${i}`;
  }
  if (p === "/") return "step1";
  return null;
};

const SKIP = new Set(["/admin", "/live", "/docs"]);
const shouldSkip = (pageId: string, sessionKey?: string) => {
  if (sessionKey && sessionKey.startsWith("admin_observer_")) return true;
  const p = pageId.toLowerCase();
  return Array.from(SKIP).some(s => p.includes(s));
};

export default function LiveUserPresence({ onTotalChange }: LiveUserPresenceProps) {
  const [funnelSteps, setFunnelSteps] = useState<FunnelStep[]>(STEPS);
  const [totalOnline, setTotalOnline] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [recentPurchases, setRecentPurchases] = useState<RecentPurchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const onTotalChangeRef = useRef(onTotalChange);
  onTotalChangeRef.current = onTotalChange;

  // Fetch recent purchases (today) for cross-referencing online users
  const fetchRecentPurchases = useCallback(async () => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { data } = await supabase
      .from("purchase_tracking")
      .select("session_id, buyer_name, amount, funnel_step")
      .eq("status", "approved")
      .gte("created_at", todayStart.toISOString())
      .order("created_at", { ascending: false });
    if (data) setRecentPurchases(data as RecentPurchase[]);
  }, []);

  // Stable ref-based handler — never changes, never causes channel recreation
  const handlePresenceSync = useCallback((channel: ReturnType<typeof supabase.channel>) => {
    const state = channel.presenceState<PresencePayload>();
    const counts: Record<string, number> = {};
    STEPS.forEach(s => { counts[s.id] = 0; });

    let total = 0;
    const users: OnlineUser[] = [];

    Object.entries(state).forEach(([sessionKey, presences]) => {
      if (!presences || presences.length === 0) return;
      const latest = presences[presences.length - 1];
      const pageId = latest.page_id || "";
      if (shouldSkip(pageId, sessionKey)) return;
      const stepId = toStepId(pageId);
      if (stepId && counts[stepId] !== undefined) {
        counts[stepId]++;
        total++;
        const stepLabel = STEPS.find(s => s.id === stepId)?.label || pageId;
        users.push({
          session_id: latest.session_id,
          name: latest.lead_name || "Visitante",
          page: stepLabel,
          joined_at: latest.joined_at,
        });
      }
    });

    setFunnelSteps(prev => {
      let changed = false;
      const next = prev.map(step => {
        const newCount = counts[step.id] || 0;
        if (step.count !== newCount) { changed = true; return { ...step, count: newCount }; }
        return step;
      });
      return changed ? next : prev;
    });

    setTotalOnline(prev => { if (prev !== total) return total; return prev; });
    setOnlineUsers(users);
    setLastUpdated(new Date());
    onTotalChangeRef.current?.(total);
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetchRecentPurchases();

    const ADMIN_OBSERVER_KEY = `admin_observer_${Date.now()}`;
    const channel = supabase.channel("funnel-presence", {
      config: { presence: { key: ADMIN_OBSERVER_KEY } },
    });

    const sync = () => handlePresenceSync(channel);

    channel
      .on("presence", { event: "sync" }, sync)
      .on("presence", { event: "join" }, sync)
      .on("presence", { event: "leave" }, sync)
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setIsLoading(false);
          sync();
        }
      });

    // Refresh purchases every 30s to catch new sales
    const purchaseInterval = setInterval(fetchRecentPurchases, 30_000);

    // Realtime listener for new purchases
    const purchaseChannel = supabase
      .channel("presence-purchase-feed")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "purchase_tracking",
      }, () => fetchRecentPurchases())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(purchaseChannel);
      clearInterval(purchaseInterval);
    };
  }, [handlePresenceSync, fetchRecentPurchases]);

  // Build a map of session_id → purchase for quick lookup
  const purchaseBySession = recentPurchases.reduce<Record<string, RecentPurchase>>((acc, p) => {
    if (p.session_id) acc[p.session_id] = p;
    return acc;
  }, {});

  // Also build name → purchase for users whose name matches buyer_name (fallback)
  const purchaseByName = recentPurchases.reduce<Record<string, RecentPurchase>>((acc, p) => {
    if (p.buyer_name && p.buyer_name.trim()) {
      const firstName = p.buyer_name.trim().split(" ")[0].toLowerCase();
      if (!acc[firstName]) acc[firstName] = p;
    }
    return acc;
  }, {});

  const getPurchaseForUser = (user: OnlineUser): RecentPurchase | null => {
    // Try session_id match first
    if (purchaseBySession[user.session_id]) return purchaseBySession[user.session_id];
    // Fallback: match by first name
    if (user.name && user.name !== "Visitante") {
      const firstName = user.name.toLowerCase();
      if (purchaseByName[firstName]) return purchaseByName[firstName];
    }
    return null;
  };

  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a] p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/20 flex-shrink-0">
            <Users className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-white text-sm truncate">Mapa do Funil — Tempo Real</h3>
            <p className="text-[10px] text-[#666]">Zero delay • Presença instantânea</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 text-xs">
            <span className="relative flex h-2 w-2 mr-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
            {totalOnline}
          </Badge>
          <Button variant="ghost" size="sm" onClick={() => setLastUpdated(new Date())} disabled={isLoading}
            className="h-7 w-7 p-0 text-[#888] hover:text-white hover:bg-white/5 rounded-lg">
            <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 sm:grid-cols-11 gap-1.5 sm:gap-2">
        {funnelSteps.map((step) => {
          const Icon = step.icon;
          const hasUsers = step.count > 0;
          return (
            <div key={step.id} className={cn(
              "flex flex-col items-center justify-center p-1.5 sm:p-2.5 rounded-xl transition-all overflow-hidden",
              "bg-[#0d0d0d] border",
              hasUsers ? "border-emerald-500/30 shadow-lg shadow-emerald-500/10" : "border-[#2a2a2a]"
            )}>
              <Icon className={cn("w-3.5 h-3.5 mb-0.5 flex-shrink-0", hasUsers ? "text-emerald-400" : "text-[#666]")} />
              <span className={cn("text-sm sm:text-lg font-bold tabular-nums leading-none", hasUsers ? "text-white" : "text-[#444]")}>{step.count}</span>
              <span className="text-[7px] sm:text-[9px] text-[#666] text-center leading-tight truncate w-full">{step.label}</span>
            </div>
          );
        })}
      </div>

      {/* Online Users List */}
      {onlineUsers.length > 0 && (
        <div className="mt-4 rounded-xl border border-[#2a2a2a] bg-[#0d0d0d] p-3">
          <h4 className="text-[10px] font-medium text-[#888] uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-emerald-400" /> Usuários Online Agora
          </h4>
          <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
            {onlineUsers.map((user) => {
              const purchase = getPurchaseForUser(user);
              const isVisitante = user.name === "Visitante";
              return (
                <div key={user.session_id} className={cn(
                  "flex items-center gap-2 text-xs py-1.5 px-2 rounded-lg",
                  purchase ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-[#1a1a1a]"
                )}>
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                  </span>
                  <span className={cn("font-medium truncate flex-1", isVisitante ? "text-[#666] italic" : "text-white")}>
                    {user.name}
                  </span>
                  {/* Purchase badge */}
                  {purchase && (
                    <span className="flex items-center gap-0.5 text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full border border-emerald-500/30 font-bold shrink-0">
                      <DollarSign className="w-2.5 h-2.5" />
                      R${Number(purchase.amount || 0).toFixed(0)}
                      {purchase.funnel_step && FUNNEL_STEP_LABELS[purchase.funnel_step] && (
                        <span className="ml-0.5 opacity-70">{FUNNEL_STEP_LABELS[purchase.funnel_step]}</span>
                      )}
                    </span>
                  )}
                  <span className="text-[#888] text-[10px] shrink-0">{user.page}</span>
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
