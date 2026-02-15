import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Eye, ShoppingCart, CreditCard, Database, XCircle, ArrowUpRight,
  Activity, CheckCircle2, Clock, Radio, Pause, Play, ArrowRight,
  Copy, Check, User, DollarSign, Zap,
} from "lucide-react";
import { toast } from "sonner";

interface SessionLog {
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

interface PurchaseRecord {
  id: string;
  session_id: string | null;
  email: string | null;
  product_name: string | null;
  amount: number | null;
  funnel_step: string | null;
  created_at: string;
  transaction_id: string | null;
  status: string | null;
  failure_reason: string | null;
}

interface TimelineEvent {
  id: string;
  created_at: string;
  type: 'log' | 'purchase';
  data: SessionLog | PurchaseRecord;
}

interface SessionLogsDialogProps {
  sessionId: string | null;
  onClose: () => void;
  realtimeLogs?: SessionLog[];
}

export default function SessionLogsDialog({ sessionId, onClose, realtimeLogs = [] }: SessionLogsDialogProps) {
  const [dbLogs, setDbLogs] = useState<SessionLog[]>([]);
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [copied, setCopied] = useState(false);
  const [customerEmail, setCustomerEmail] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const timelineEvents: TimelineEvent[] = (() => {
    if (!sessionId) return [];
    const sessionRealtimeLogs = realtimeLogs.filter(log => log.session_id === sessionId);
    const dbLogIds = new Set(dbLogs.map(log => log.id));
    const uniqueRealtimeLogs = sessionRealtimeLogs.filter(log => !dbLogIds.has(log.id));
    const allLogs = [...dbLogs, ...uniqueRealtimeLogs];
    const events: TimelineEvent[] = [];
    allLogs.forEach(log => {
      events.push({ id: `log-${log.id}`, created_at: log.created_at, type: 'log', data: log });
    });
    purchases.forEach(purchase => {
      events.push({ id: `purchase-${purchase.id}`, created_at: purchase.created_at, type: 'purchase', data: purchase });
    });
    events.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    return events;
  })();

  useEffect(() => {
    if (!sessionId) return;
    const fetchAllData = async () => {
      setIsLoading(true);
      setCustomerEmail(null);
      const [logsResult, purchasesResult] = await Promise.all([
        supabase.from("funnel_audit_logs").select("*").eq("session_id", sessionId).order("created_at", { ascending: true }),
        supabase.from("purchase_tracking").select("*").eq("session_id", sessionId).order("created_at", { ascending: true }),
      ]);
      if (logsResult.data) setDbLogs(logsResult.data);
      if (purchasesResult.data) {
        setPurchases(purchasesResult.data);
        const firstWithEmail = purchasesResult.data.find(p => p.email);
        if (firstWithEmail) setCustomerEmail(firstWithEmail.email);
      }
      setIsLoading(false);
    };
    fetchAllData();
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId || isPaused) return;
    const logsChannel = supabase.channel(`session-logs-${sessionId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "funnel_audit_logs", filter: `session_id=eq.${sessionId}` },
        (payload) => {
          const newLog = payload.new as SessionLog;
          setDbLogs((prev) => {
            if (prev.some(log => log.id === newLog.id)) return prev;
            return [...prev, newLog];
          });
          autoScroll();
        }
      ).subscribe();
    const purchasesChannel = supabase.channel(`session-purchases-${sessionId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "purchase_tracking", filter: `session_id=eq.${sessionId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newPurchase = payload.new as PurchaseRecord;
            setPurchases((prev) => {
              if (prev.some(p => p.id === newPurchase.id)) return prev;
              return [...prev, newPurchase];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedPurchase = payload.new as PurchaseRecord;
            setPurchases((prev) => prev.map(p => p.id === updatedPurchase.id ? updatedPurchase : p));
          }
          autoScroll();
        }
      ).subscribe();
    return () => {
      supabase.removeChannel(logsChannel);
      supabase.removeChannel(purchasesChannel);
    };
  }, [sessionId, isPaused]);

  const autoScroll = () => {
    setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, 100);
  };

  const copySessionId = () => {
    if (sessionId) {
      navigator.clipboard.writeText(sessionId);
      setCopied(true);
      toast.success("Session ID copiado!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatTime = (dateStr: string) => new Date(dateStr).toLocaleString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const formatFullDate = (dateStr: string) => new Date(dateStr).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });

  const getEventIcon = (eventType: string) => {
    const icons: Record<string, JSX.Element> = {
      page_loaded: <Eye className="w-3.5 h-3.5" />,
      checkout_initiated: <ShoppingCart className="w-3.5 h-3.5" />,
      payment_completed: <CreditCard className="w-3.5 h-3.5" />,
      conversion_saved: <Database className="w-3.5 h-3.5" />,
      conversion_save_failed: <XCircle className="w-3.5 h-3.5" />,
      redirect_executed: <ArrowUpRight className="w-3.5 h-3.5" />,
      redirect_completed: <CheckCircle2 className="w-3.5 h-3.5" />,
      redirect_failed: <XCircle className="w-3.5 h-3.5" />,
    };
    return icons[eventType] || <Activity className="w-3.5 h-3.5" />;
  };

  const getEventColor = (eventType: string) => {
    const colors: Record<string, string> = {
      page_loaded: "bg-sky-500", checkout_initiated: "bg-violet-500", payment_completed: "bg-emerald-500",
      conversion_saved: "bg-teal-500", conversion_save_failed: "bg-red-500", redirect_executed: "bg-indigo-500",
      redirect_completed: "bg-green-500", redirect_failed: "bg-red-500",
    };
    return colors[eventType] || "bg-gray-500";
  };

  const getEventBadgeStyle = (eventType: string) => {
    const styles: Record<string, string> = {
      page_loaded: "bg-sky-500/20 text-sky-400 border-sky-500/30",
      checkout_initiated: "bg-violet-500/20 text-violet-400 border-violet-500/30",
      payment_completed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      conversion_saved: "bg-teal-500/20 text-teal-400 border-teal-500/30",
      conversion_save_failed: "bg-red-500/20 text-red-400 border-red-500/30",
      redirect_executed: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
      redirect_completed: "bg-green-500/20 text-green-400 border-green-500/30",
      redirect_failed: "bg-red-500/20 text-red-400 border-red-500/30",
    };
    return styles[eventType] || "bg-gray-500/20 text-gray-400 border-gray-500/30";
  };

  const getStatusIcon = (status: string | null) => {
    if (status === "success") return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
    if (status === "error") return <XCircle className="w-3.5 h-3.5 text-red-400" />;
    return <Clock className="w-3.5 h-3.5 text-amber-400" />;
  };

  const totalEvents = timelineEvents.length;
  const totalPurchases = purchases.length;
  const totalRevenue = purchases.reduce((sum, p) => sum + (p.amount || 0), 0);
  const hasPayment = purchases.length > 0 || dbLogs.some(l => l.event_type === "payment_completed");
  const firstEvent = timelineEvents[0];
  const pagesVisited = [...new Set(dbLogs.filter(l => l.event_type === "page_loaded" && l.page_id).map(l => l.page_id))];

  return (
    <Dialog open={!!sessionId} onOpenChange={() => onClose()}>
      <DialogContent className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-lg w-[92vw] sm:w-full max-h-[85vh] flex flex-col overflow-hidden bg-[#111113] border border-[#333] text-white rounded-2xl p-0 shadow-2xl z-[100]">
        <DialogHeader className="border-b border-[#333] p-4 pr-10 bg-[#18181b]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg flex-shrink-0">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-lg font-bold text-white">Jornada do Lead</DialogTitle>
              <DialogDescription className="sr-only">Histórico completo de eventos do lead em tempo real</DialogDescription>
              <div className="flex items-center gap-2 mt-1">
                <code className="text-xs bg-[#252528] border border-[#444] px-2 py-0.5 rounded font-mono truncate text-[#aaa]">
                  {sessionId?.slice(-12)}
                </code>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 flex-shrink-0 text-[#aaa] hover:text-white hover:bg-white/10" onClick={copySessionId}>
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${isPaused ? 'bg-[#333]' : 'bg-emerald-600/25 border border-emerald-500/40'}`}>
              <span className={`relative flex h-2 w-2 ${isPaused ? "" : "animate-pulse"}`}>
                <span className={`absolute inline-flex h-full w-full rounded-full ${isPaused ? "bg-[#666]" : "bg-emerald-400"} opacity-75`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isPaused ? "bg-[#666]" : "bg-emerald-400"}`}></span>
              </span>
              <span className={`text-xs font-medium ${isPaused ? 'text-[#999]' : 'text-emerald-300'}`}>
                {isPaused ? "Pausado" : "Tempo real"}
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={() => setIsPaused(!isPaused)}
              className="gap-1.5 h-8 px-3 text-xs bg-[#252528] border-[#444] text-[#aaa] hover:text-white hover:bg-white/10">
              {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </DialogHeader>

        {!isLoading && timelineEvents.length > 0 && (
          <div className="border-b border-[#333] p-4 space-y-3 bg-[#141417]">
            <div className="space-y-2">
              <span className="text-xs text-[#999] font-medium uppercase tracking-wide">Rota completa</span>
              <div className="flex items-center gap-1.5 flex-wrap bg-[#1c1c20] border border-[#3a3a3a] p-3 rounded-xl">
                {pagesVisited.map((page, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <Badge className="text-xs bg-sky-600/30 text-sky-300 border border-sky-500/40 font-medium">📍 {page}</Badge>
                    {i < pagesVisited.length - 1 && <ArrowRight className="w-3 h-3 text-[#666]" />}
                  </div>
                ))}
                {hasPayment && (
                  <>
                    <ArrowRight className="w-3 h-3 text-[#666]" />
                    <Badge className="text-xs bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 gap-1 font-medium">
                      <CreditCard className="w-3 h-3" /> Pagou
                    </Badge>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap text-xs">
              <div className="flex items-center gap-1.5 text-[#999]">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-white font-medium">{firstEvent && formatFullDate(firstEvent.created_at)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#999]">
                <Activity className="w-3.5 h-3.5" />
                <span className="text-white font-medium">{totalEvents}</span> eventos
              </div>
              {totalPurchases > 0 && (
                <Badge className="bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 gap-1 font-medium">
                  <DollarSign className="w-3 h-3" />${totalRevenue}
                </Badge>
              )}
            </div>
            {customerEmail && (
              <div className="flex items-center gap-2 pt-2 border-t border-dashed border-[#3a3a3a]">
                <User className="w-3.5 h-3.5 text-[#999]" />
                <code className="text-xs bg-[#252528] border border-[#444] px-2 py-0.5 rounded font-mono text-[#bbb]">{customerEmail}</code>
              </div>
            )}
          </div>
        )}

        <div className="flex-1 overflow-hidden min-h-0 bg-[#111113]">
          <ScrollArea className="h-full max-h-[320px] sm:max-h-[380px]" ref={scrollRef as any}>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Radio className="w-6 h-6 animate-spin text-[#999]" />
              </div>
            ) : timelineEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-[#999]">
                <Activity className="w-8 h-8 mb-3 opacity-50" />
                <p className="text-sm">Nenhum evento encontrado</p>
              </div>
            ) : (
              <div className="relative pl-6 pr-4 py-4">
                <div className="absolute left-[11px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-violet-500 via-indigo-500 to-emerald-500 opacity-50" />
                <div className="space-y-3">
                  {timelineEvents.map((event) => {
                    if (event.type === 'purchase') {
                      const purchase = event.data as PurchaseRecord;
                      const isSuccess = purchase.status !== 'failed';
                      return (
                        <div key={event.id} className="relative flex gap-4 animate-in fade-in slide-in-from-left-2">
                          <div className={`absolute left-[-13px] w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-[#111113] shadow-lg ${isSuccess ? 'bg-emerald-500' : 'bg-red-500'}`}>
                            <DollarSign className="w-3 h-3 text-white" />
                          </div>
                          <div className={`flex-1 rounded-xl p-3 border shadow-md ${isSuccess ? 'bg-emerald-950/50 border-emerald-600/40' : 'bg-red-950/50 border-red-600/40'}`}>
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2">
                                <Badge className={`gap-1 text-xs border font-medium ${isSuccess ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50' : 'bg-red-600/30 text-red-300 border-red-500/50'}`}>
                                  <CreditCard className="w-3 h-3" />
                                  {isSuccess ? 'Pagamento' : 'Falha no Pagamento'}
                                </Badge>
                                {isSuccess ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <XCircle className="w-3.5 h-3.5 text-red-400" />}
                              </div>
                              <span className="text-xs text-[#999] font-mono">{formatTime(purchase.created_at)}</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              {purchase.product_name && <Badge className="bg-[#333] text-[#ddd] border border-[#444] font-medium">🏷️ {purchase.product_name}</Badge>}
                              {purchase.amount && <Badge className="bg-emerald-600/25 text-emerald-300 border border-emerald-500/40 font-medium">💰 ${purchase.amount}</Badge>}
                              {purchase.funnel_step && (
                                <Badge className="bg-violet-600/25 text-violet-300 border border-violet-500/40 font-medium">
                                  <Zap className="w-2.5 h-2.5 mr-1" />{purchase.funnel_step}
                                </Badge>
                              )}
                            </div>
                            {purchase.failure_reason && (
                              <div className="mt-2 text-xs text-red-300 bg-red-950/60 border border-red-700/50 p-2 rounded-lg">⚠️ {purchase.failure_reason}</div>
                            )}
                            {purchase.transaction_id && (
                              <div className="mt-2 text-xs text-[#999]">TX: <code className="bg-[#333] px-1.5 py-0.5 rounded text-[#bbb]">{purchase.transaction_id.slice(-12)}</code></div>
                            )}
                          </div>
                        </div>
                      );
                    }

                    const log = event.data as SessionLog;
                    const meta = log.metadata as Record<string, unknown> | null;
                    const product = meta?.product as string | undefined;
                    const amount = meta?.amount as number | undefined;

                    return (
                      <div key={event.id} className="relative flex gap-4 animate-in fade-in slide-in-from-left-2">
                        <div className={`absolute left-[-13px] w-5 h-5 rounded-full ${getEventColor(log.event_type)} flex items-center justify-center ring-4 ring-[#111113] shadow-lg`}>
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </div>
                        <div className="flex-1 bg-[#1c1c20] border border-[#3a3a3a] rounded-xl p-3 hover:border-[#555] transition-colors shadow-md">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <Badge className={`gap-1 text-xs border font-medium ${getEventBadgeStyle(log.event_type)}`}>
                                {getEventIcon(log.event_type)}
                                <span className="truncate">{log.event_type.replace(/_/g, " ")}</span>
                              </Badge>
                              {getStatusIcon(log.status)}
                            </div>
                            <span className="text-xs text-[#999] font-mono">{formatTime(log.created_at)}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            {log.page_id && <Badge className="text-sky-300 border-sky-500/40 bg-sky-600/25 border font-medium">📍 {log.page_id}</Badge>}
                            {product && <Badge className="bg-[#333] text-[#ddd] border border-[#444] font-medium">🏷️ {product}</Badge>}
                            {amount && <Badge className="text-emerald-300 bg-emerald-600/25 border border-emerald-500/40 font-medium">💰 ${amount}</Badge>}
                            {log.duration_ms && <Badge className="text-violet-300 border-violet-500/40 bg-violet-600/25 border font-medium">⏱️ {log.duration_ms}ms</Badge>}
                          </div>
                          {log.error_message && (
                            <div className="mt-2 text-xs text-red-300 bg-red-950/60 border border-red-700/50 p-2 rounded-lg">⚠️ {log.error_message}</div>
                          )}
                          {log.redirect_url && <div className="mt-2 text-xs text-[#999] truncate">→ {log.redirect_url}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {!isPaused && (
                  <div className="relative flex gap-4 mt-4">
                    <div className="absolute left-[-13px] w-5 h-5 rounded-full bg-[#333] flex items-center justify-center ring-4 ring-[#111113]">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    </div>
                    <div className="flex-1 text-xs text-[#999] italic py-2">Aguardando novos eventos...</div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
