import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Inbox, CheckCircle2, AlertTriangle, Activity,
  RefreshCw, Search, ChevronDown, ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface OrphanSale {
  id: string;
  created_at: string;
  amount: number | null;
  email: string | null;
  buyer_name: string | null;
  status: string | null;
  session_id: string | null;
  funnel_step: string | null;
}

interface CorrelationStats {
  method: string;
  count: number;
  pct: number;
}

export default function LiveAuditTab() {
  const [loading, setLoading] = useState(false);
  const [totalToday, setTotalToday] = useState(0);
  const [correlated, setCorrelated] = useState(0);
  const [orphans, setOrphans] = useState(0);
  const [successRate, setSuccessRate] = useState(0);
  const [orphanSales, setOrphanSales] = useState<OrphanSale[]>([]);
  const [correlationStats, setCorrelationStats] = useState<CorrelationStats[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState("");

  const fetchAuditData = useCallback(async () => {
    setLoading(true);
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayISO = todayStart.toISOString();

      // Get all purchases today
      const { data: purchases } = await supabase
        .from("purchase_tracking")
        .select("id, created_at, amount, email, buyer_name, status, session_id, funnel_step")
        .gte("created_at", todayISO)
        .order("created_at", { ascending: false });

      const all = purchases || [];
      const total = all.length;
      const withSession = all.filter(p => p.session_id != null && p.session_id !== "");
      const withoutSession = all.filter(p => !p.session_id);

      setTotalToday(total);
      setCorrelated(withSession.length);
      setOrphans(withoutSession.length);
      setSuccessRate(total > 0 ? (withSession.length / total) * 100 : 0);
      setOrphanSales(withoutSession);

      // Correlation method stats from session_attribution
      const { data: attrData } = await supabase
        .from("session_attribution")
        .select("attribution_method")
        .gte("created_at", todayISO);

      const methodCounts: Record<string, number> = {};
      (attrData || []).forEach(r => {
        const m = r.attribution_method || "original";
        methodCounts[m] = (methodCounts[m] || 0) + 1;
      });
      const totalAttr = Object.values(methodCounts).reduce((a, b) => a + b, 0);
      const stats = Object.entries(methodCounts)
        .map(([method, count]) => ({ method, count, pct: totalAttr > 0 ? (count / totalAttr) * 100 : 0 }))
        .sort((a, b) => b.count - a.count);
      setCorrelationStats(stats);
    } catch (e) {
      console.error("Audit fetch error:", e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAuditData();
  }, [fetchAuditData]);

  const filteredOrphans = orphanSales.filter(o => {
    if (!searchFilter) return true;
    const s = searchFilter.toLowerCase();
    return (o.email?.toLowerCase().includes(s)) || (o.buyer_name?.toLowerCase().includes(s));
  });

  const formatDate = (d: string) => new Date(d).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit"
  });

  const maxPct = correlationStats.length > 0 ? Math.max(...correlationStats.map(s => s.pct)) : 100;

  return (
    <div className="space-y-4">
      {/* Health cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <AuditCard icon={Inbox} title="Webhooks Hoje" value={totalToday} color="sky" />
        <AuditCard icon={CheckCircle2} title="Correlacionados" value={correlated} color="emerald" />
        <AuditCard icon={AlertTriangle} title="Orfaos" value={orphans} color={orphans > 0 ? "amber" : "emerald"} />
        <AuditCard icon={Activity} title="Taxa de Sucesso" value={`${successRate.toFixed(1)}%`} color={successRate >= 90 ? "emerald" : "amber"} />
      </div>

      {/* Correlation method distribution */}
      {correlationStats.length > 0 && (
        <div className="rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a] p-4">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-semibold text-white">Distribuicao por Metodo de Atribuicao</h3>
            <button onClick={fetchAuditData} className="ml-auto w-7 h-7 rounded-lg bg-[#0d0d0d] border border-[#2a2a2a] flex items-center justify-center hover:bg-[#1a1a1a]">
              <RefreshCw className={cn("w-3 h-3 text-[#888]", loading && "animate-spin")} />
            </button>
          </div>
          <div className="space-y-2">
            {correlationStats.map(s => (
              <div key={s.method} className="flex items-center gap-3">
                <span className="text-[11px] text-[#888] w-32 truncate font-medium">{s.method}</span>
                <div className="flex-1 h-5 bg-[#0d0d0d] rounded overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-sky-500/60 to-sky-400/40 rounded transition-all duration-500"
                    style={{ width: `${(s.pct / maxPct) * 100}%` }}
                  />
                </div>
                <span className="text-[11px] text-white font-bold tabular-nums w-12 text-right">{s.pct.toFixed(0)}%</span>
                <span className="text-[10px] text-[#666] tabular-nums w-8 text-right">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Orphan sales table */}
      <div className="rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a] p-4">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-white">Vendas Orfas (sem session_id)</h3>
          <Badge className="text-[9px] bg-amber-500/20 text-amber-400 border-0 ml-1">{orphanSales.length}</Badge>
        </div>

        {orphanSales.length > 0 && (
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#666]" />
            <Input
              placeholder="Buscar por email ou nome..."
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
              className="pl-9 h-8 bg-[#0d0d0d] border-[#2a2a2a] text-white text-xs rounded-lg"
            />
          </div>
        )}

        <ScrollArea className="max-h-[300px]">
          {filteredOrphans.length === 0 ? (
            <div className="text-center py-8 text-[#666]">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">Nenhuma venda orfa encontrada</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {filteredOrphans.map(o => (
                <div key={o.id}
                  className="p-2.5 rounded-xl bg-[#0d0d0d] border border-[#2a2a2a] hover:border-[#3a3a3a] cursor-pointer transition-all"
                  onClick={() => setExpandedId(expandedId === o.id ? null : o.id)}>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#666] tabular-nums">{formatDate(o.created_at)}</span>
                    <span className="text-xs text-emerald-400 font-bold tabular-nums">
                      R$ {(o.amount || 0).toFixed(2)}
                    </span>
                    {o.email && <span className="text-[10px] text-[#888] truncate max-w-[140px]">{o.email}</span>}
                    {o.buyer_name && <span className="text-[10px] text-[#666] truncate max-w-[100px]">{o.buyer_name}</span>}
                    {o.funnel_step && (
                      <Badge className={cn("text-[8px] border-0 px-1",
                        o.funnel_step.startsWith("front") ? "bg-emerald-500/20 text-emerald-400" : "bg-sky-500/20 text-sky-400"
                      )}>{o.funnel_step}</Badge>
                    )}
                    <div className="flex-1" />
                    {expandedId === o.id ? <ChevronUp className="w-3 h-3 text-[#666]" /> : <ChevronDown className="w-3 h-3 text-[#666]" />}
                  </div>
                  {expandedId === o.id && (
                    <div className="mt-2 pt-2 border-t border-[#2a2a2a]">
                      <pre className="text-[9px] text-[#666] overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify({ id: o.id, status: o.status, funnel_step: o.funnel_step, email: o.email, buyer_name: o.buyer_name }, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}

function AuditCard({ icon: Icon, title, value, color }: {
  icon: React.ElementType; title: string; value: string | number; color: string;
}) {
  const colorMap: Record<string, string> = {
    sky: "from-sky-500/20 to-sky-600/10 border-sky-500/20 text-sky-400",
    emerald: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/20 text-emerald-400",
    amber: "from-amber-500/20 to-amber-600/10 border-amber-500/20 text-amber-400",
  };
  const c = colorMap[color] || colorMap.sky;
  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a] p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <div className={cn("p-1.5 rounded-lg bg-gradient-to-br border flex-shrink-0", c)}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        <p className="text-[#888] text-xs font-medium truncate">{title}</p>
      </div>
      <p className="text-xl font-bold text-white tabular-nums">{value}</p>
    </div>
  );
}
