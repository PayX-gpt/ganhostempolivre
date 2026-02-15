import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  RefreshCw, Users, Eye, ShoppingCart, Zap, CheckCircle2,
  PlayCircle, Smartphone, Clock, Brain, MessageCircle, 
  UserCheck, Target, Star, Sparkles, Gift, Mail
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FunnelStep {
  id: string;
  label: string;
  icon: React.ElementType;
  count: number;
}

interface PresencePayload {
  session_id: string;
  page_id: string;
  joined_at: string;
}

interface LiveUserPresenceProps {
  onTotalChange?: (total: number) => void;
}

const INITIAL_STEPS: FunnelStep[] = [
  { id: "step1", label: "Intro", icon: Zap, count: 0 },
  { id: "step2", label: "Idade", icon: Users, count: 0 },
  { id: "step3", label: "Nome", icon: UserCheck, count: 0 },
  { id: "step4", label: "Prova Social", icon: Star, count: 0 },
  { id: "step5", label: "Tentou Online", icon: Target, count: 0 },
  { id: "step6", label: "Meta Renda", icon: Target, count: 0 },
  { id: "step7", label: "Obstáculo", icon: Brain, count: 0 },
  { id: "step8", label: "Sonho", icon: Sparkles, count: 0 },
  { id: "step9", label: "Saldo", icon: Eye, count: 0 },
  { id: "step10", label: "Vídeo Mentor", icon: PlayCircle, count: 0 },
  { id: "step11", label: "Dispositivo", icon: Smartphone, count: 0 },
  { id: "step12", label: "Disponibilidade", icon: Clock, count: 0 },
  { id: "step13", label: "Demo", icon: Eye, count: 0 },
  { id: "step14", label: "Loading", icon: RefreshCw, count: 0 },
  { id: "step15", label: "Prova Social 2", icon: Star, count: 0 },
  { id: "step16", label: "WhatsApp", icon: MessageCircle, count: 0 },
  { id: "step17", label: "Contato", icon: Mail, count: 0 },
  { id: "step18", label: "Input", icon: UserCheck, count: 0 },
  { id: "step19", label: "Oferta Final", icon: ShoppingCart, count: 0 },
  { id: "checkout", label: "Checkout", icon: Gift, count: 0 },
  { id: "thanks", label: "Thanks", icon: CheckCircle2, count: 0 },
];

export default function LiveUserPresence({ onTotalChange }: LiveUserPresenceProps) {
  const [funnelSteps, setFunnelSteps] = useState<FunnelStep[]>(INITIAL_STEPS);
  const [totalOnline, setTotalOnline] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const categorizePageToStep = useCallback((page: string): string | null => {
    const p = page.toLowerCase();
    if (p.includes("/thanks")) return "thanks";
    if (p.includes("/checkout") || p.includes("/processing")) return "checkout";
    // Match step-19 before step-1
    if (p.includes("/step-19")) return "step19";
    if (p.includes("/step-18")) return "step18";
    if (p.includes("/step-17")) return "step17";
    if (p.includes("/step-16")) return "step16";
    if (p.includes("/step-15")) return "step15";
    if (p.includes("/step-14")) return "step14";
    if (p.includes("/step-13")) return "step13";
    if (p.includes("/step-12")) return "step12";
    if (p.includes("/step-11")) return "step11";
    if (p.includes("/step-10")) return "step10";
    if (p.includes("/step-9")) return "step9";
    if (p.includes("/step-8")) return "step8";
    if (p.includes("/step-7")) return "step7";
    if (p.includes("/step-6")) return "step6";
    if (p.includes("/step-5")) return "step5";
    if (p.includes("/step-4")) return "step4";
    if (p.includes("/step-3")) return "step3";
    if (p.includes("/step-2")) return "step2";
    if (p.includes("/step-1") || p === "/") return "step1";
    return null;
  }, []);

  const isLikelyDevSession = useCallback((_sessionId: string, pageId: string): boolean => {
    return pageId.includes('/admin') || pageId.includes('/live') || pageId.includes('/docs');
  }, []);

  const isStalePresence = useCallback((joinedAt: string): boolean => {
    try {
      return (Date.now() - new Date(joinedAt).getTime()) > 10 * 60 * 1000;
    } catch { return true; }
  }, []);

  const processPresenceState = useCallback((presenceState: Record<string, PresencePayload[]>) => {
    const pageGroups: Record<string, Set<string>> = {};
    INITIAL_STEPS.forEach(step => { pageGroups[step.id] = new Set(); });

    const uniqueSessions = new Set<string>();
    Object.entries(presenceState).forEach(([sessionId, presences]) => {
      if (presences.length > 0) {
        const latest = presences[0];
        const pageId = latest.page_id || "";
        const joinedAt = latest.joined_at || "";
        if (isLikelyDevSession(sessionId, pageId) || isStalePresence(joinedAt)) return;
        const step = categorizePageToStep(pageId);
        if (step && pageGroups[step]) {
          pageGroups[step].add(sessionId);
        }
        uniqueSessions.add(sessionId);
      }
    });

    setFunnelSteps(prev => prev.map(step => ({ ...step, count: pageGroups[step.id]?.size || 0 })));
    const total = uniqueSessions.size;
    setTotalOnline(total);
    setLastUpdated(new Date());
    onTotalChange?.(total);
  }, [categorizePageToStep, isLikelyDevSession, isStalePresence, onTotalChange]);

  useEffect(() => {
    setIsLoading(true);
    const channel = supabase.channel("funnel-presence");
    channel
      .on("presence", { event: "sync" }, () => { processPresenceState(channel.presenceState<PresencePayload>()); setIsLoading(false); })
      .on("presence", { event: "join" }, () => { processPresenceState(channel.presenceState<PresencePayload>()); })
      .on("presence", { event: "leave" }, () => { processPresenceState(channel.presenceState<PresencePayload>()); })
      .subscribe((status) => { if (status === "SUBSCRIBED") setIsLoading(false); });
    return () => { supabase.removeChannel(channel); };
  }, [processPresenceState]);

  const handleRefresh = useCallback(() => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 500);
  }, []);

  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a] p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/20">
            <Users className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Mapa do Funil — 19 Etapas</h3>
            <p className="text-xs text-[#666]">Presença em tempo real</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3">
            <span className="relative flex h-2 w-2 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
            {totalOnline} online
          </Badge>
          <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isLoading}
            className="h-8 w-8 p-0 text-[#888] hover:text-white hover:bg-white/5 rounded-lg">
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 sm:grid-cols-11 gap-1.5 sm:gap-2">
        {funnelSteps.map((step) => {
          const Icon = step.icon;
          const hasUsers = step.count > 0;
          return (
            <div key={step.id} className={cn(
              "flex flex-col items-center p-1.5 sm:p-2.5 rounded-xl transition-all",
              "bg-[#0d0d0d] border",
              hasUsers ? "border-emerald-500/30 shadow-lg shadow-emerald-500/10" : "border-[#2a2a2a]"
            )}>
              <Icon className={cn("w-3.5 h-3.5 mb-0.5", hasUsers ? "text-emerald-400" : "text-[#666]")} />
              <span className={cn("text-sm sm:text-lg font-bold", hasUsers ? "text-white" : "text-[#444]")}>{step.count}</span>
              <span className="text-[7px] sm:text-[9px] text-[#666] text-center leading-tight truncate w-full">{step.label}</span>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-center mt-3 text-[10px] text-[#666]">
        <span>Atualizado: {lastUpdated.toLocaleTimeString("pt-BR")}</span>
      </div>
    </div>
  );
}
