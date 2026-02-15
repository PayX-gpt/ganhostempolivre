import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  RefreshCw, 
  Users, 
  Eye, 
  ShoppingCart, 
  Zap, 
  CheckCircle2
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

export default function LiveUserPresence({ onTotalChange }: LiveUserPresenceProps = {}) {
  const [funnelSteps, setFunnelSteps] = useState<FunnelStep[]>([
    { id: "step1", label: "Step 1", icon: Users, count: 0 },
    { id: "step2", label: "Step 2", icon: Eye, count: 0 },
    { id: "step3", label: "Step 3", icon: Eye, count: 0 },
    { id: "step4", label: "Step 4", icon: Eye, count: 0 },
    { id: "step5", label: "Step 5", icon: Eye, count: 0 },
    { id: "step6", label: "Step 6", icon: Eye, count: 0 },
    { id: "step7", label: "Step 7", icon: Eye, count: 0 },
    { id: "step8", label: "Step 8", icon: Eye, count: 0 },
    { id: "step9", label: "Step 9", icon: Eye, count: 0 },
    { id: "step10", label: "Loading", icon: Eye, count: 0 },
    { id: "step11", label: "Social", icon: Eye, count: 0 },
    { id: "step12", label: "Capture", icon: Eye, count: 0 },
    { id: "step13", label: "Oferta", icon: ShoppingCart, count: 0 },
    { id: "checkout", label: "Checkout", icon: ShoppingCart, count: 0 },
    { id: "thanks", label: "Thanks", icon: CheckCircle2, count: 0 },
  ]);
  const [totalOnline, setTotalOnline] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const categorizePageToStep = useCallback((page: string): string | null => {
    const pageLower = page.toLowerCase();
    
    if (pageLower.includes("/thanks")) return "thanks";
    if (pageLower.includes("/checkout") || pageLower.includes("/processing")) return "checkout";
    if (pageLower.includes("/step-13") || pageLower.includes("step13")) return "step13";
    if (pageLower.includes("/step-12") || pageLower.includes("step12")) return "step12";
    if (pageLower.includes("/step-11") || pageLower.includes("step11")) return "step11";
    if (pageLower.includes("/step-10") || pageLower.includes("step10")) return "step10";
    if (pageLower.includes("/step-9") || pageLower.includes("step9")) return "step9";
    if (pageLower.includes("/step-8") || pageLower.includes("step8")) return "step8";
    if (pageLower.includes("/step-7") || pageLower.includes("step7")) return "step7";
    if (pageLower.includes("/step-6") || pageLower.includes("step6")) return "step6";
    if (pageLower.includes("/step-5") || pageLower.includes("step5")) return "step5";
    if (pageLower.includes("/step-4") || pageLower.includes("step4")) return "step4";
    if (pageLower.includes("/step-3") || pageLower.includes("step3")) return "step3";
    if (pageLower.includes("/step-2") || pageLower.includes("step2")) return "step2";
    if (pageLower.includes("/step-1") || pageLower.includes("step1") || pageLower === "/") return "step1";
    
    return null;
  }, []);

  const isLikelyDevSession = useCallback((_sessionId: string, pageId: string): boolean => {
    if (pageId.includes('/admin') || pageId.includes('/live') || pageId.includes('/docs')) {
      return true;
    }
    return false;
  }, []);

  const isStalePresence = useCallback((joinedAt: string): boolean => {
    try {
      const joinedTime = new Date(joinedAt).getTime();
      const now = Date.now();
      const TEN_MINUTES = 10 * 60 * 1000;
      return (now - joinedTime) > TEN_MINUTES;
    } catch {
      return true;
    }
  }, []);

  const processPresenceState = useCallback((presenceState: Record<string, PresencePayload[]>) => {
    const pageGroups: Record<string, Set<string>> = {};
    funnelSteps.forEach(step => { pageGroups[step.id] = new Set(); });

    Object.entries(presenceState).forEach(([sessionId, presences]) => {
      if (presences.length > 0) {
        const latestPresence = presences[0];
        const pageId = latestPresence.page_id || "";
        const joinedAt = latestPresence.joined_at || "";
        
        if (isLikelyDevSession(sessionId, pageId)) return;
        if (isStalePresence(joinedAt)) return;
        
        const step = categorizePageToStep(pageId);
        if (step && pageGroups[step]) {
          pageGroups[step].add(sessionId);
        }
      }
    });

    setFunnelSteps((prev) =>
      prev.map((step) => ({
        ...step,
        count: pageGroups[step.id]?.size || 0,
      }))
    );

    const uniqueSessions = new Set<string>();
    Object.entries(presenceState).forEach(([sessionId, presences]) => {
      if (presences.length > 0) {
        const pageId = presences[0].page_id || "";
        const joinedAt = presences[0].joined_at || "";
        if (!isLikelyDevSession(sessionId, pageId) && !isStalePresence(joinedAt)) {
          uniqueSessions.add(sessionId);
        }
      }
    });
    const total = uniqueSessions.size;
    setTotalOnline(total);
    setLastUpdated(new Date());
    onTotalChange?.(total);
  }, [categorizePageToStep, isLikelyDevSession, isStalePresence, onTotalChange, funnelSteps]);

  useEffect(() => {
    setIsLoading(true);
    
    const channel = supabase.channel("funnel-presence");

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<PresencePayload>();
        processPresenceState(state);
        setIsLoading(false);
      })
      .on("presence", { event: "join" }, () => {
        const state = channel.presenceState<PresencePayload>();
        processPresenceState(state);
      })
      .on("presence", { event: "leave" }, () => {
        const state = channel.presenceState<PresencePayload>();
        processPresenceState(state);
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setIsLoading(false);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
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
            <h3 className="font-semibold text-white">Usuários no Funil</h3>
            <p className="text-xs text-[#666]">Tempo real</p>
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
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/10 rounded-lg"
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-5 sm:grid-cols-8 gap-2 sm:gap-3">
        {funnelSteps.map((step) => {
          const Icon = step.icon;
          const hasUsers = step.count > 0;
          
          return (
            <div
              key={step.id}
              className={cn(
                "flex flex-col items-center p-2 sm:p-3 rounded-xl transition-all",
                "bg-[#0d0d0d] border",
                hasUsers 
                  ? "border-emerald-500/30 shadow-lg shadow-emerald-500/10" 
                  : "border-[#2a2a2a]"
              )}
            >
              <Icon className={cn(
                "w-4 h-4 mb-1",
                hasUsers ? "text-emerald-400" : "text-[#666]"
              )} />
              <span className={cn(
                "text-lg sm:text-xl font-bold",
                hasUsers ? "text-white" : "text-[#444]"
              )}>
                {step.count}
              </span>
              <span className="text-[9px] sm:text-[10px] text-[#666] text-center leading-tight">
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-center mt-4 text-[10px] text-[#666]">
        <span>Atualizado: {lastUpdated.toLocaleTimeString("pt-BR")}</span>
      </div>
    </div>
  );
}
