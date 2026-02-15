import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  RefreshCw, Users, Eye, ShoppingCart, Zap, CheckCircle2,
  PlayCircle, Smartphone, Clock, Brain, MessageCircle, 
  UserCheck, Target, Star, Sparkles, Gift, Mail,
  Rocket, BarChart3, CreditCard, ArrowDownCircle, Trophy
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
  joined_at: string;
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
  { id: "step8", route: "/step-8", label: "Sonho", icon: Sparkles, count: 0 },
  { id: "step9", route: "/step-9", label: "Saldo", icon: Eye, count: 0 },
  { id: "step10", route: "/step-10", label: "Vídeo Mentor", icon: PlayCircle, count: 0 },
  { id: "step11", route: "/step-11", label: "Dispositivo", icon: Smartphone, count: 0 },
  { id: "step12", route: "/step-12", label: "Disponibilidade", icon: Clock, count: 0 },
  { id: "step13", route: "/step-13", label: "Demo", icon: Eye, count: 0 },
  { id: "step14", route: "/step-14", label: "Loading", icon: RefreshCw, count: 0 },
  { id: "step15", route: "/step-15", label: "Prova Social 2", icon: Star, count: 0 },
  { id: "step16", route: "/step-16", label: "WhatsApp", icon: MessageCircle, count: 0 },
  { id: "step17", route: "/step-17", label: "Contato", icon: Mail, count: 0 },
  { id: "step18", route: "/step-18", label: "Input", icon: UserCheck, count: 0 },
  { id: "step19", route: "/step-19", label: "Oferta Final", icon: ShoppingCart, count: 0 },
  { id: "checkout", route: "/checkout", label: "Checkout", icon: Gift, count: 0 },
  { id: "thanks", route: "/thanks", label: "Thanks", icon: CheckCircle2, count: 0 },
  { id: "upsell-confirm", route: "/upsell-confirmacao", label: "UP: Confirm", icon: Rocket, count: 0 },
  { id: "upsell-analise", route: "/upsell-analise", label: "UP: Análise", icon: BarChart3, count: 0 },
  { id: "upsell-planos", route: "/upsell-planos", label: "UP: Planos", icon: ShoppingCart, count: 0 },
  { id: "upsell-checkout", route: "/upsell-checkout", label: "UP: Checkout", icon: CreditCard, count: 0 },
  { id: "upsell-downsell", route: "/upsell-downsell", label: "UP: Downsell", icon: ArrowDownCircle, count: 0 },
  { id: "upsell-sucesso", route: "/upsell-sucesso", label: "UP: Sucesso", icon: Trophy, count: 0 },
];

const toStepId = (page: string): string | null => {
  const p = page.toLowerCase();
  // Upsell steps
  if (p.includes("/upsell-confirmacao")) return "upsell-confirm";
  if (p.includes("/upsell-analise")) return "upsell-analise";
  if (p.includes("/upsell-planos")) return "upsell-planos";
  if (p.includes("/upsell-checkout")) return "upsell-checkout";
  if (p.includes("/upsell-downsell")) return "upsell-downsell";
  if (p.includes("/upsell-sucesso")) return "upsell-sucesso";
  // Original steps
  if (p.includes("/thanks")) return "thanks";
  if (p.includes("/checkout") || p.includes("/processing")) return "checkout";
  for (let i = 19; i >= 1; i--) {
    if (p.includes(`/step-${i}`)) return `step${i}`;
  }
  if (p === "/") return "step1";
  return null;
};

const SKIP = new Set(["/admin", "/live", "/docs"]);
const shouldSkip = (pageId: string) => {
  const p = pageId.toLowerCase();
  return Array.from(SKIP).some(s => p.includes(s));
};

export default function LiveUserPresence({ onTotalChange }: LiveUserPresenceProps) {
  const [funnelSteps, setFunnelSteps] = useState<FunnelStep[]>(STEPS);
  const [totalOnline, setTotalOnline] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const onTotalChangeRef = useRef(onTotalChange);
  onTotalChangeRef.current = onTotalChange;

  // Stable ref-based handler — never changes, never causes channel recreation
  const handlePresenceSync = useCallback((channel: ReturnType<typeof supabase.channel>) => {
    const state = channel.presenceState<PresencePayload>();
    const counts: Record<string, number> = {};
    STEPS.forEach(s => { counts[s.id] = 0; });

    let total = 0;

    Object.entries(state).forEach(([, presences]) => {
      if (!presences || presences.length === 0) return;
      const latest = presences[presences.length - 1];
      const pageId = latest.page_id || "";
      if (shouldSkip(pageId)) return;
      const stepId = toStepId(pageId);
      if (stepId && counts[stepId] !== undefined) {
        counts[stepId]++;
        total++;
      }
    });

    setFunnelSteps(prev => {
      // Only update if counts actually changed (avoids unnecessary re-renders)
      let changed = false;
      const next = prev.map(step => {
        const newCount = counts[step.id] || 0;
        if (step.count !== newCount) { changed = true; return { ...step, count: newCount }; }
        return step;
      });
      return changed ? next : prev;
    });

    setTotalOnline(prev => { if (prev !== total) return total; return prev; });
    setLastUpdated(new Date());
    onTotalChangeRef.current?.(total);
  }, []); // Empty deps — stable forever

  useEffect(() => {
    setIsLoading(true);

    const channel = supabase.channel("funnel-presence");

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

    return () => {
      supabase.removeChannel(channel);
    };
  }, [handlePresenceSync]); // handlePresenceSync is stable (empty deps), so this runs once

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

      <div className="flex items-center justify-center mt-3 text-[10px] text-[#666]">
        <span>Atualizado: {lastUpdated.toLocaleTimeString("pt-BR")}</span>
      </div>
    </div>
  );
}
