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
import type { CampaignFilterState } from "./CampaignFilter";
import { cleanCampaignName, deriveCampaignLabel } from "./CampaignFilter";

interface FunnelStep {
  id: string;
  route: string;
  label: string;
  icon: React.ElementType;
  count: number;
  sources?: string[];
}

interface PresencePayload {
  session_id: string;
  page_id: string;
  lead_name?: string;
  traffic_source?: string;
  joined_at: string;
}

interface OnlineUser {
  session_id: string;
  name: string;
  page: string;
  traffic_source: string;
  joined_at: string;
}

interface RecentPurchase {
  session_id: string | null;
  buyer_name: string | null;
  amount: number | null;
  funnel_step: string | null;
}

interface AuditPresenceRow {
  session_id: string;
  page_id: string | null;
  created_at: string;
  metadata?: Record<string, unknown> | null;
}

interface LiveUserPresenceProps {
  onTotalChange?: (total: number) => void;
  campaignFilter?: CampaignFilterState;
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
  { id: "step12", route: "/step-12", label: "WhatsApp", icon: MessageCircle, count: 0 },
  { id: "step13", route: "/step-13", label: "Contato", icon: MessageCircle, count: 0 },
  { id: "step14", route: "/step-14", label: "Input", icon: Mail, count: 0 },
  { id: "step15", route: "/step-15", label: "Análise", icon: Clock, count: 0 },
  { id: "step16", route: "/step-16", label: "Projeção", icon: UserCheck, count: 0 },
  { id: "step17", route: "/step-17", label: "Vídeo Venda", icon: Star, count: 0 },
  
  { id: "checkout", route: "/checkout", label: "Checkout", icon: Gift, count: 0 },
  { id: "thanks", route: "/thanks", label: "Thanks", icon: CheckCircle2, count: 0 },
  { id: "upsell1", route: "/upsell1", label: "UP1 Acel.", icon: Rocket, count: 0 },
  { id: "upsell2", route: "/upsell2", label: "UP2 Multi.", icon: BarChart3, count: 0 },
  { id: "upsell3", route: "/upsell3", label: "UP3 Blind.", icon: CreditCard, count: 0 },
  { id: "upsell4", route: "/upsell4", label: "UP4 Círc.", icon: Trophy, count: 0 },
  { id: "upsell5", route: "/upsell5", label: "UP5 Safety", icon: ShieldCheck, count: 0 },
  { id: "upsell6", route: "/upsell6", label: "UP6 FOREX", icon: TrendingUp, count: 0 },
];

const TIKTOK_STEPS: FunnelStep[] = [
  { id: "tk_step1", route: "/tiktok/step-1", label: "Intro", icon: Zap, count: 0 },
  { id: "tk_step2", route: "/tiktok/step-2", label: "Idade", icon: Users, count: 0 },
  { id: "tk_step3", route: "/tiktok/step-3", label: "Prova Social", icon: Star, count: 0 },
  { id: "tk_step4", route: "/tiktok/step-4", label: "Meta Renda", icon: Target, count: 0 },
  { id: "tk_step5", route: "/tiktok/step-5", label: "10 min?", icon: Clock, count: 0 },
  { id: "tk_step6", route: "/tiktok/step-6", label: "Demo", icon: Smartphone, count: 0 },
  { id: "tk_step7", route: "/tiktok/step-7", label: "E-mail", icon: Mail, count: 0 },
  { id: "tk_step8", route: "/tiktok/step-8", label: "Análise", icon: Clock, count: 0 },
  { id: "tk_step9", route: "/tiktok/step-9", label: "Projeção", icon: UserCheck, count: 0 },
  { id: "tk_step10", route: "/tiktok/step-10", label: "Oferta", icon: Star, count: 0 },
];

const TIKTOK_ES_STEPS: FunnelStep[] = [
  { id: "tkes_step1", route: "/tiktok-es/step-1", label: "Intro", icon: Zap, count: 0 },
  { id: "tkes_step2", route: "/tiktok-es/step-2", label: "Edad", icon: Users, count: 0 },
  { id: "tkes_step3", route: "/tiktok-es/step-3", label: "Prueba", icon: Star, count: 0 },
  { id: "tkes_step4", route: "/tiktok-es/step-4", label: "Meta", icon: Target, count: 0 },
  { id: "tkes_step5", route: "/tiktok-es/step-5", label: "10 min", icon: Clock, count: 0 },
  { id: "tkes_step6", route: "/tiktok-es/step-6", label: "Contacto", icon: Mail, count: 0 },
  { id: "tkes_step7", route: "/tiktok-es/step-7", label: "Loading", icon: Clock, count: 0 },
  { id: "tkes_step8", route: "/tiktok-es/step-8", label: "Proyección", icon: UserCheck, count: 0 },
  { id: "tkes_step9", route: "/tiktok-es/step-9", label: "Oferta", icon: Star, count: 0 },
];

const ALL_STEPS = [...STEPS, ...TIKTOK_STEPS, ...TIKTOK_ES_STEPS];

const FUNNEL_STEP_LABELS: Record<string, string> = {
  front_37: "R$37", front_47: "R$47",
  acelerador_basico: "UP1", acelerador_duplo: "UP1", acelerador_maximo: "UP1",
  multiplicador_prata: "UP2", multiplicador_ouro: "UP2", multiplicador_diamante: "UP2",
  blindagem: "UP3", circulo_interno: "UP4", safety_pro: "UP5", forex_mentoria: "UP6", downsell_guia: "DS",
};

const PRESENCE_FALLBACK_WINDOW_MS = 90_000;

const normalizeTrafficSource = (value?: string | null): string => {
  const source = (value || "").toLowerCase();
  if (!source) return "organic";
  if (source.includes("tiktok")) return "tiktok";
  if (source.includes("facebook") || source.includes("instagram") || source.includes("meta") || source === "fb") return "meta";
  if (source.includes("google")) return "google";
  return source;
};

const inferTrafficSourceFromMetadata = (metadata?: Record<string, unknown> | null): string => {
  const utmSource = typeof metadata?.utm_source === "string" ? metadata.utm_source : null;
  return normalizeTrafficSource(utmSource);
};

const toStepId = (page: string): string | null => {
  const p = page.toLowerCase();
  // TikTok ES funnel routes (check before PT to avoid false match)
  if (p.includes("/tiktok-es/")) {
    for (let i = 9; i >= 1; i--) {
      if (p.includes(`/tiktok-es/step-${i}`)) return `tkes_step${i}`;
    }
    return null;
  }
  // TikTok PT funnel routes
  if (p.includes("/tiktok/")) {
    for (let i = 10; i >= 1; i--) {
      if (p.includes(`/tiktok/step-${i}`)) return `tk_step${i}`;
    }
    return null;
  }
  if (p.includes("/upsell6") || p.includes("forex")) return "upsell6";
  if (p.includes("/upsell5") || p.includes("safety")) return "upsell5";
  if (p.includes("/upsell4") || p.includes("/upsell-sucesso") || p.includes("upsell4-")) return "upsell4";
  if (p.includes("/upsell3") || p.includes("blindagem")) return "upsell3";
  if (p.includes("/upsell2") || p.includes("multiplicador")) return "upsell2";
  if (p.includes("/upsell")) return "upsell1";
  if (p.includes("/thanks")) return "thanks";
  if (p.includes("/checkout") || p.includes("/processing")) return "checkout";
  // step-18 and step-19 are legacy — map to step17
  const LEGACY_STEP_MAP: Record<number, string> = { 18: "step17", 19: "step17" };
  for (let i = 19; i >= 1; i--) {
    if (p.includes(`/step-${i}`)) return LEGACY_STEP_MAP[i] || `step${i}`;
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

export default function LiveUserPresence({ onTotalChange, campaignFilter }: LiveUserPresenceProps) {
  const [funnelSteps, setFunnelSteps] = useState<FunnelStep[]>(ALL_STEPS);
  const [totalOnline, setTotalOnline] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [allOnlineUsers, setAllOnlineUsers] = useState<OnlineUser[]>([]);
  const [recentPurchases, setRecentPurchases] = useState<RecentPurchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [sessionCampaignMap, setSessionCampaignMap] = useState<Record<string, string>>({});
  const onTotalChangeRef = useRef(onTotalChange);
  onTotalChangeRef.current = onTotalChange;
  const allPresenceDataRef = useRef<{ counts: Record<string, number>; users: OnlineUser[]; stepSources: Record<string, Set<string>>; total: number } | null>(null);
  const presenceChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const auditPresenceRef = useRef<Record<string, AuditPresenceRow>>({});

  // Fetch session → campaign mapping
  const fetchSessionCampaigns = useCallback(async () => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { data } = await supabase
      .from("session_attribution")
      .select("session_id, utm_campaign, utm_source, ttclid, fbclid")
      .gte("created_at", todayStart.toISOString());
    const map: Record<string, string> = {};
    (data || []).forEach((a: any) => {
      map[a.session_id] = deriveCampaignLabel(a);
    });
    setSessionCampaignMap(map);
  }, []);

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

  const applyPresenceSnapshot = useCallback((channel: ReturnType<typeof supabase.channel> | null) => {
    const counts: Record<string, number> = {};
    ALL_STEPS.forEach(s => { counts[s.id] = 0; });

    let total = 0;
    const users: OnlineUser[] = [];
    const stepSources: Record<string, Set<string>> = {};
    ALL_STEPS.forEach(s => { stepSources[s.id] = new Set(); });

    const mergedUsers = new Map<string, OnlineUser & { stepId: string; timestamp: number }>();

    if (channel) {
      const state = channel.presenceState<PresencePayload>();

      Object.entries(state).forEach(([sessionKey, presences]) => {
        if (!presences || presences.length === 0) return;
        const latest = presences[presences.length - 1];
        const pageId = latest.page_id || "";
        if (shouldSkip(pageId, sessionKey)) return;

        const stepId = toStepId(pageId);
        if (!stepId || counts[stepId] === undefined) return;

        const stepLabel = ALL_STEPS.find(s => s.id === stepId)?.label || pageId;
        const timestamp = new Date(latest.joined_at).getTime();

        mergedUsers.set(latest.session_id || sessionKey, {
          session_id: latest.session_id,
          name: latest.lead_name || "Visitante",
          page: stepLabel,
          traffic_source: normalizeTrafficSource(latest.traffic_source),
          joined_at: latest.joined_at,
          stepId,
          timestamp: Number.isFinite(timestamp) ? timestamp : Date.now(),
        });
      });
    }

    const cutoff = Date.now() - PRESENCE_FALLBACK_WINDOW_MS;
    Object.values(auditPresenceRef.current).forEach((row) => {
      if (!row.page_id || shouldSkip(row.page_id, row.session_id)) return;

      const timestamp = new Date(row.created_at).getTime();
      if (!Number.isFinite(timestamp) || timestamp < cutoff) return;

      const stepId = toStepId(row.page_id);
      if (!stepId || counts[stepId] === undefined) return;

      const existing = mergedUsers.get(row.session_id);
      if (existing && existing.timestamp >= timestamp) return;

      const stepLabel = ALL_STEPS.find(s => s.id === stepId)?.label || row.page_id;
      mergedUsers.set(row.session_id, {
        session_id: row.session_id,
        name: existing?.name && existing.name !== "Visitante" ? existing.name : "Visitante",
        page: stepLabel,
        traffic_source: existing?.traffic_source || inferTrafficSourceFromMetadata(row.metadata),
        joined_at: row.created_at,
        stepId,
        timestamp,
      });
    });

    mergedUsers.forEach((user) => {
      if (counts[user.stepId] !== undefined) {
        counts[user.stepId]++;
        total++;
        stepSources[user.stepId].add(user.traffic_source || "organic");
        users.push({
          session_id: user.session_id,
          name: user.name,
          page: user.page,
          traffic_source: user.traffic_source,
          joined_at: user.joined_at,
        });
      }
    });

    allPresenceDataRef.current = { counts, users, stepSources, total };
    setAllOnlineUsers(users);
    setLastUpdated(new Date());
  }, []);

  const fetchRecentAuditPresence = useCallback(async () => {
    const sinceIso = new Date(Date.now() - PRESENCE_FALLBACK_WINDOW_MS).toISOString();
    const { data } = await supabase
      .from("funnel_audit_logs")
      .select("session_id, page_id, created_at, metadata")
      .eq("event_type", "page_loaded")
      .gte("created_at", sinceIso)
      .order("created_at", { ascending: false })
      .limit(200);

    const next: Record<string, AuditPresenceRow> = {};
    (data || []).forEach((row) => {
      const typedRow = row as AuditPresenceRow;
      if (typedRow.session_id && !next[typedRow.session_id]) {
        next[typedRow.session_id] = typedRow;
      }
    });

    auditPresenceRef.current = next;
    applyPresenceSnapshot(presenceChannelRef.current);
  }, [applyPresenceSnapshot]);

  // Apply campaign filter to presence data
  const selectedCampaigns = campaignFilter?.selectedCampaigns || new Set<string>();
  const campaignMode = selectedCampaigns.size > 0;

  useEffect(() => {
    const data = allPresenceDataRef.current;
    if (!data) return;

    if (!campaignMode) {
      // No filter - show all
      setFunnelSteps(prev => {
        let changed = false;
        const next = prev.map(step => {
          const newCount = data.counts[step.id] || 0;
          const newSources = Array.from(data.stepSources[step.id] || []);
          if (step.count !== newCount || JSON.stringify(step.sources) !== JSON.stringify(newSources)) {
            changed = true;
            return { ...step, count: newCount, sources: newSources };
          }
          return step;
        });
        return changed ? next : prev;
      });
      setTotalOnline(data.total);
      setOnlineUsers(data.users);
      onTotalChangeRef.current?.(data.total);
      return;
    }

    // Filter by selected campaigns
    const filteredUsers = data.users.filter(u => {
      const camp = sessionCampaignMap[u.session_id] || "Direto";
      return selectedCampaigns.has(camp);
    });

    // Recalculate counts from filtered users
    const filteredCounts: Record<string, number> = {};
    const filteredSources: Record<string, Set<string>> = {};
    ALL_STEPS.forEach(s => { filteredCounts[s.id] = 0; filteredSources[s.id] = new Set(); });

    filteredUsers.forEach(u => {
      const stepId = ALL_STEPS.find(s => s.label === u.page)?.id;
      if (stepId) {
        filteredCounts[stepId]++;
        filteredSources[stepId].add(u.traffic_source);
      }
    });

    setFunnelSteps(prev => {
      let changed = false;
      const next = prev.map(step => {
        const newCount = filteredCounts[step.id] || 0;
        const newSources = Array.from(filteredSources[step.id] || []);
        if (step.count !== newCount || JSON.stringify(step.sources) !== JSON.stringify(newSources)) {
          changed = true;
          return { ...step, count: newCount, sources: newSources };
        }
        return step;
      });
      return changed ? next : prev;
    });

    const filteredTotal = filteredUsers.length;
    setTotalOnline(filteredTotal);
    setOnlineUsers(filteredUsers);
    onTotalChangeRef.current?.(filteredTotal);
  }, [allOnlineUsers, campaignMode, selectedCampaigns, sessionCampaignMap]);

  useEffect(() => {
    setIsLoading(true);
    fetchRecentPurchases();
    fetchSessionCampaigns();
    fetchRecentAuditPresence();

    const ADMIN_OBSERVER_KEY = `admin_observer_${Date.now()}`;
    const channel = supabase.channel("funnel-presence", {
      config: { presence: { key: ADMIN_OBSERVER_KEY } },
    });
    presenceChannelRef.current = channel;

    const sync = () => applyPresenceSnapshot(channel);

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

    const purchaseInterval = setInterval(fetchRecentPurchases, 30_000);
    const campaignInterval = setInterval(fetchSessionCampaigns, 30_000);
    const auditFallbackInterval = setInterval(() => {
      const cutoff = Date.now() - PRESENCE_FALLBACK_WINDOW_MS;
      auditPresenceRef.current = Object.fromEntries(
        Object.entries(auditPresenceRef.current).filter(([, row]) => {
          const ts = new Date(row.created_at).getTime();
          return Number.isFinite(ts) && ts >= cutoff;
        })
      );
      applyPresenceSnapshot(channel);
    }, 10_000);

    const purchaseChannel = supabase
      .channel("presence-purchase-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "purchase_tracking" },
        () => fetchRecentPurchases())
      .subscribe();

    const auditChannel = supabase
      .channel("presence-audit-fallback")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "funnel_audit_logs", filter: "event_type=eq.page_loaded" },
        (payload) => {
          const row = payload.new as AuditPresenceRow;
          if (!row.session_id || !row.page_id) return;

          const existing = auditPresenceRef.current[row.session_id];
          const existingTs = existing ? new Date(existing.created_at).getTime() : 0;
          const nextTs = new Date(row.created_at).getTime();

          if (!existing || nextTs >= existingTs) {
            auditPresenceRef.current = {
              ...auditPresenceRef.current,
              [row.session_id]: row,
            };
            applyPresenceSnapshot(channel);
          }
        }
      )
      .subscribe();

    return () => {
      presenceChannelRef.current = null;
      supabase.removeChannel(channel);
      supabase.removeChannel(purchaseChannel);
      supabase.removeChannel(auditChannel);
      clearInterval(purchaseInterval);
      clearInterval(campaignInterval);
      clearInterval(auditFallbackInterval);
    };
  }, [applyPresenceSnapshot, fetchRecentPurchases, fetchSessionCampaigns, fetchRecentAuditPresence]);

  const purchaseBySession = recentPurchases.reduce<Record<string, RecentPurchase>>((acc, p) => {
    if (p.session_id) acc[p.session_id] = p;
    return acc;
  }, {});

  const purchaseByName = recentPurchases.reduce<Record<string, RecentPurchase>>((acc, p) => {
    if (p.buyer_name && p.buyer_name.trim()) {
      const firstName = p.buyer_name.trim().split(" ")[0].toLowerCase();
      if (!acc[firstName]) acc[firstName] = p;
    }
    return acc;
  }, {});

  const getPurchaseForUser = (user: OnlineUser): RecentPurchase | null => {
    if (purchaseBySession[user.session_id]) return purchaseBySession[user.session_id];
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
            <p className="text-[10px] text-[#666]">
              {campaignMode ? "Filtrado por campanha" : "Zero delay • Presença instantânea"}
            </p>
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

      {/* Original Funnel */}
      <div className="grid grid-cols-7 sm:grid-cols-11 gap-1.5 sm:gap-2">
        {funnelSteps.filter(s => !s.id.startsWith("tk_") && !s.id.startsWith("tkes_")).map((step) => {
          const Icon = step.icon;
          const hasUsers = step.count > 0;
          const sources = step.sources || [];
          const hasTiktok = sources.some(s => s === "tiktok");
          const hasMeta = sources.some(s => s === "meta");
          const isMixed = hasTiktok && hasMeta;
          const borderColor = !hasUsers ? "border-[#2a2a2a]"
            : isMixed ? "border-yellow-400/40"
            : hasTiktok ? "border-red-500/40 shadow-lg shadow-red-500/10"
            : hasMeta ? "border-emerald-500/30 shadow-lg shadow-emerald-500/10"
            : "border-emerald-500/30 shadow-lg shadow-emerald-500/10";
          const iconColor = !hasUsers ? "text-[#666]"
            : isMixed ? "text-yellow-400"
            : hasTiktok ? "text-red-400"
            : hasMeta ? "text-emerald-400"
            : "text-emerald-400";
          return (
            <div key={step.id} className={cn(
              "flex flex-col items-center justify-center p-1.5 sm:p-2.5 rounded-xl transition-all overflow-hidden",
              "bg-[#0d0d0d] border", borderColor
            )}>
              <Icon className={cn("w-3.5 h-3.5 mb-0.5 flex-shrink-0", iconColor)} />
              <span className={cn("text-sm sm:text-lg font-bold tabular-nums leading-none", hasUsers ? "text-white" : "text-[#444]")}>{step.count}</span>
              <span className="text-[7px] sm:text-[9px] text-[#666] text-center leading-tight truncate w-full">{step.label}</span>
              {hasUsers && (hasTiktok || hasMeta) && (
                <div className="flex items-center gap-0.5 mt-0.5">
                  {hasTiktok && <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.7)]" title="TikTok" />}
                  {hasMeta && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.7)]" title="Meta" />}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* TikTok Funnel */}
      {(() => {
        const tkSteps = funnelSteps.filter(s => s.id.startsWith("tk_"));
        const tkTotal = tkSteps.reduce((sum, s) => sum + s.count, 0);
        return (
          <div className="mt-4 rounded-xl border border-red-500/20 bg-[#0d0d0d] p-3">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-red-500/15 border border-red-500/25 flex-shrink-0">
                <Zap className="w-3.5 h-3.5 text-red-400" />
              </div>
              <h4 className="text-xs font-semibold text-red-400 uppercase tracking-wider">Funil TikTok</h4>
              <span className="text-[10px] text-[#666]">10 etapas</span>
              {tkTotal > 0 && (
                <Badge className="bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 text-[10px] ml-auto">
                  {tkTotal} online
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 sm:gap-2">
              {tkSteps.map((step) => {
                const Icon = step.icon;
                const hasUsers = step.count > 0;
                const borderColor = hasUsers ? "border-red-500/40 shadow-lg shadow-red-500/10" : "border-[#2a2a2a]";
                const iconColor = hasUsers ? "text-red-400" : "text-[#666]";
                return (
                  <div key={step.id} className={cn(
                    "flex flex-col items-center justify-center p-1.5 sm:p-2.5 rounded-xl transition-all overflow-hidden",
                    "bg-[#0d0d0d] border", borderColor
                  )}>
                    <Icon className={cn("w-3.5 h-3.5 mb-0.5 flex-shrink-0", iconColor)} />
                    <span className={cn("text-sm sm:text-lg font-bold tabular-nums leading-none", hasUsers ? "text-white" : "text-[#444]")}>{step.count}</span>
                    <span className="text-[7px] sm:text-[9px] text-[#666] text-center leading-tight truncate w-full">{step.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* TikTok ES Funnel */}
      {(() => {
        const tkesSteps = funnelSteps.filter(s => s.id.startsWith("tkes_"));
        const tkesTotal = tkesSteps.reduce((sum, s) => sum + s.count, 0);
        return (
          <div className="mt-4 rounded-xl border border-orange-500/20 bg-[#0d0d0d] p-3">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-orange-500/15 border border-orange-500/25 flex-shrink-0">
                <Zap className="w-3.5 h-3.5 text-orange-400" />
              </div>
              <h4 className="text-xs font-semibold text-orange-400 uppercase tracking-wider">Funil TikTok ES</h4>
              <span className="text-[10px] text-[#666]">9 etapas</span>
              {tkesTotal > 0 && (
                <Badge className="bg-orange-500/20 text-orange-400 border border-orange-500/30 px-1.5 text-[10px] ml-auto">
                  {tkesTotal} online
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-5 sm:grid-cols-9 gap-1.5 sm:gap-2">
              {tkesSteps.map((step) => {
                const Icon = step.icon;
                const hasUsers = step.count > 0;
                const borderColor = hasUsers ? "border-orange-500/40 shadow-lg shadow-orange-500/10" : "border-[#2a2a2a]";
                const iconColor = hasUsers ? "text-orange-400" : "text-[#666]";
                return (
                  <div key={step.id} className={cn(
                    "flex flex-col items-center justify-center p-1.5 sm:p-2.5 rounded-xl transition-all overflow-hidden",
                    "bg-[#0d0d0d] border", borderColor
                  )}>
                    <Icon className={cn("w-3.5 h-3.5 mb-0.5 flex-shrink-0", iconColor)} />
                    <span className={cn("text-sm sm:text-lg font-bold tabular-nums leading-none", hasUsers ? "text-white" : "text-[#444]")}>{step.count}</span>
                    <span className="text-[7px] sm:text-[9px] text-[#666] text-center leading-tight truncate w-full">{step.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {onlineUsers.length > 0 && (
        <div className="mt-4 rounded-xl border border-[#2a2a2a] bg-[#0d0d0d] p-3">
          <h4 className="text-[10px] font-medium text-[#888] uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-emerald-400" /> Usuários Online Agora
          </h4>
          <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
            {onlineUsers.map((user) => {
              const purchase = getPurchaseForUser(user);
              const isVisitante = user.name === "Visitante";
              const isTiktok = user.traffic_source === "tiktok";
              const isTiktokEs = user.page?.includes("/tiktok-es/");
              const isMeta = user.traffic_source === "meta";
              const dotColor = isTiktok ? (isTiktokEs ? "bg-orange-500" : "bg-red-500") : isMeta ? "bg-emerald-400" : "bg-gray-400";
              const dotGlow = dotColor;
              const userCampaign = sessionCampaignMap[user.session_id];
              return (
                <div key={user.session_id} className={cn(
                  "flex items-center gap-2 text-xs py-1.5 px-2 rounded-lg",
                  purchase ? "bg-emerald-500/10 border border-emerald-500/20"
                  : isTiktokEs ? "bg-orange-500/5 border border-orange-500/15"
                  : isTiktok ? "bg-red-500/5 border border-red-500/15"
                  : "bg-[#1a1a1a]"
                )}>
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", dotGlow)}></span>
                    <span className={cn("relative inline-flex rounded-full h-2 w-2", dotColor)}></span>
                  </span>
                  <span className={cn("font-medium truncate flex-1", isVisitante ? "text-[#666] italic" : "text-white")}>
                    {user.name}
                  </span>
                  {isTiktokEs && (
                    <span className="text-[8px] bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded-full border border-orange-500/30 font-bold shrink-0 shadow-[0_0_6px_rgba(249,115,22,0.3)]">
                      TikTok ES
                    </span>
                  )}
                  {isTiktok && !isTiktokEs && (
                    <span className="text-[8px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full border border-red-500/30 font-bold shrink-0 shadow-[0_0_6px_rgba(239,68,68,0.3)]">
                      TikTok
                    </span>
                  )}
                  {isMeta && (
                    <span className="text-[8px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full border border-blue-500/30 font-bold shrink-0">
                      Meta
                    </span>
                  )}
                  {/* Campaign badge when filtering */}
                  {campaignMode && userCampaign && (
                    <span className="text-[7px] px-1.5 py-0.5 rounded-full border font-medium shrink-0 truncate max-w-[80px]"
                      style={{
                        backgroundColor: (campaignFilter?.campaignColors?.[userCampaign] || "#666") + "22",
                        borderColor: campaignFilter?.campaignColors?.[userCampaign] || "#666",
                        color: campaignFilter?.campaignColors?.[userCampaign] || "#888",
                      }}>
                      {userCampaign}
                    </span>
                  )}
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
