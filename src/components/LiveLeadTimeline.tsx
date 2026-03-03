import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, Eye, ShoppingCart, CheckCircle2, XCircle, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimelineEvent {
  time: string;
  type: string;
  detail: string;
  icon: "view" | "action" | "checkout" | "purchase" | "decline" | "contact";
}

interface LeadTimelineProps {
  sessionId: string;
  onClose: () => void;
}

const ICON_MAP = {
  view: <Eye className="w-3.5 h-3.5 text-sky-400" />,
  action: <Clock className="w-3.5 h-3.5 text-amber-400" />,
  checkout: <ShoppingCart className="w-3.5 h-3.5 text-violet-400" />,
  purchase: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
  decline: <XCircle className="w-3.5 h-3.5 text-red-400" />,
  contact: <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />,
};

export default function LeadTimeline({ sessionId, onClose }: LeadTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [leadInfo, setLeadInfo] = useState<Record<string, string>>({});

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [funnelRes, auditRes, purchaseRes, behaviorRes] = await Promise.all([
        supabase.from("funnel_events").select("*").eq("session_id", sessionId).order("created_at"),
        supabase.from("funnel_audit_logs").select("*").eq("session_id", sessionId).order("created_at"),
        supabase.from("purchase_tracking").select("*").eq("session_id", sessionId).order("created_at"),
        supabase.from("lead_behavior").select("quiz_answers, intent_score, intent_label, account_balance, time_on_page_ms").eq("session_id", sessionId).limit(1),
      ]);

      const timeline: TimelineEvent[] = [];

      // Funnel events
      (funnelRes.data || []).forEach((e: any) => {
        const ed = e.event_data as Record<string, unknown> | null;
        const step = (ed?.step as string) || "";
        let icon: TimelineEvent["icon"] = "view";
        let detail = e.event_name;

        if (e.event_name === "step_viewed") {
          detail = `Visualizou ${step}`;
        } else if (e.event_name === "step_completed") {
          detail = `Completou ${step}`;
          const timeMs = ed?.time_spent_ms as number;
          if (timeMs) detail += ` (${(timeMs / 1000).toFixed(0)}s)`;
          icon = "action";
        } else if (e.event_name === "lead_captured") {
          detail = "Lead capturado";
          icon = "contact";
        } else if (e.event_name === "checkout_click" || e.event_name === "capi_ic_sent") {
          detail = "Clicou no checkout";
          icon = "checkout";
        }

        timeline.push({ time: e.created_at, type: e.event_name, detail, icon });
      });

      // Audit logs (upsells)
      (auditRes.data || []).forEach((e: any) => {
        if (e.event_type === "upsell_oneclick_buy") {
          timeline.push({ time: e.created_at, type: "upsell_buy", detail: `Comprou upsell: ${e.page_id || ""}`, icon: "purchase" });
        } else if (e.event_type === "upsell_oneclick_decline") {
          timeline.push({ time: e.created_at, type: "upsell_decline", detail: `Recusou upsell: ${e.page_id || ""}`, icon: "decline" });
        }
      });

      // Purchases
      (purchaseRes.data || []).forEach((e: any) => {
        const status = e.status;
        const amount = Number(e.amount) || 0;
        timeline.push({
          time: e.created_at,
          type: "purchase",
          detail: `Compra R$${amount.toFixed(2)} — ${status} ${e.product_name || ""}`.trim(),
          icon: ["approved", "completed", "purchased", "redirected"].includes(status) ? "purchase" : "decline",
        });
      });

      timeline.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
      setEvents(timeline);

      // Lead info
      const b = behaviorRes.data?.[0];
      if (b) {
        const qa = (b.quiz_answers as Record<string, string>) || {};
        setLeadInfo({
          Nome: qa.name || "—",
          Idade: qa.age || "—",
          Obstáculo: qa.obstacle || "—",
          Saldo: b.account_balance || "—",
          Score: String(b.intent_score ?? "—"),
          Intenção: b.intent_label || "—",
          "Tempo total": b.time_on_page_ms ? `${(b.time_on_page_ms / 1000 / 60).toFixed(1)}min` : "—",
        });
      }
      setLoading(false);
    }
    load();
  }, [sessionId]);

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="bg-[#0d0d0d] border-[#2a2a2a] text-white max-w-lg max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            Timeline do Lead <code className="text-[10px] text-[#888] ml-2">{sessionId.slice(-10)}</code>
          </DialogTitle>
        </DialogHeader>

        {/* Lead info */}
        {Object.keys(leadInfo).length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-3">
            {Object.entries(leadInfo).map(([k, v]) => (
              <div key={k} className="rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] p-2">
                <p className="text-[9px] text-[#666] uppercase">{k}</p>
                <p className="text-xs font-medium text-white truncate">{v}</p>
              </div>
            ))}
          </div>
        )}

        <ScrollArea className="h-[400px] pr-2">
          {loading ? (
            <p className="text-center text-[#666] py-8 text-xs">Carregando...</p>
          ) : events.length === 0 ? (
            <p className="text-center text-[#666] py-8 text-xs">Nenhum evento encontrado</p>
          ) : (
            <div className="relative pl-6">
              <div className="absolute left-2.5 top-0 bottom-0 w-px bg-[#2a2a2a]" />
              {events.map((evt, i) => (
                <div key={i} className="relative mb-3">
                  <div className="absolute left-[-18px] top-1 w-5 h-5 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center">
                    {ICON_MAP[evt.icon]}
                  </div>
                  <div className="rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] p-2.5">
                    <p className="text-xs text-white">{evt.detail}</p>
                    <p className="text-[9px] text-[#666] mt-0.5 tabular-nums">
                      {new Date(evt.time).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
