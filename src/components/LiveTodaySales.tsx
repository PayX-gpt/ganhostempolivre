import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { ShoppingBag, RefreshCw, Package, Loader2 } from "lucide-react";

interface ByProduct { product: string; qty: number; revenue: number; is_front: boolean; }
interface Data { date: string; total_qtd: number; total_valor: number; pending_qtd: number; pending_valor: number; by_product: ByProduct[]; by_product_pending: ByProduct[]; }

const brl = (n: number) => `R$ ${Number(n || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function LiveTodaySales() {
  const [date, setDate] = useState("");                 // "" = hoje
  const [tab, setTab] = useState<"approved" | "pending">("approved");
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(() => {
    setLoading(true);
    const args = date ? { p_date: date } : {};
    supabase.rpc("get_today_sales" as any, args).then(({ data: res }) => {
      if (res) setData(res as any);
      setLoading(false);
    });
  }, [date]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    const ch = supabase.channel("today-sales-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "purchase_tracking" }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchData]);

  const pend = tab === "pending";
  const byProduct = (pend ? data?.by_product_pending : data?.by_product) || [];
  const totQtd = pend ? (data?.pending_qtd ?? 0) : (data?.total_qtd ?? 0);
  const totValor = pend ? (data?.pending_valor ?? 0) : (data?.total_valor ?? 0);
  const maxQty = Math.max(1, ...byProduct.map(p => p.qty));

  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a] p-4 sm:p-5">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/25 shrink-0"><ShoppingBag className="w-4 h-4 text-emerald-400" /></div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-white truncate">Vendas do Dia — por produto</h3>
            <p className="text-[10px] text-[#666]">produto, quantidade e valor</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-[#111] border border-[#2a2a2a] rounded-lg p-0.5">
            <button onClick={() => setTab("approved")} className={cn("px-2.5 py-1 rounded-md text-xs", !pend ? "bg-emerald-500/20 text-emerald-400 font-semibold" : "text-[#888] hover:text-white")}>Aprovadas</button>
            <button onClick={() => setTab("pending")} className={cn("px-2.5 py-1 rounded-md text-xs", pend ? "bg-amber-500/20 text-amber-300 font-semibold" : "text-[#888] hover:text-white")}>Pendentes</button>
          </div>
          <div className="text-right">
            <div className="text-[9px] text-[#888] uppercase tracking-wider">{pend ? "Pendente" : "Total"}</div>
            <div className={cn("text-sm font-black tabular-nums leading-none", pend ? "text-amber-300" : "text-emerald-400")}>{totQtd} · {brl(totValor)}</div>
          </div>
          <input type="date" value={date} max={new Date().toISOString().slice(0, 10)} onChange={e => setDate(e.target.value)}
            className={cn("px-1.5 py-1 rounded-lg text-[11px] bg-[#111] border text-[#aaa] outline-none", date ? "border-emerald-500/40" : "border-[#2a2a2a]")} />
          {date && <button onClick={() => setDate("")} className="px-2 py-1 rounded-lg text-[11px] border border-[#2a2a2a] text-[#888] hover:text-white">hoje</button>}
          <button onClick={fetchData} className="p-1.5 rounded-lg bg-[#111] border border-[#2a2a2a] text-[#888] hover:text-white"><RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} /></button>
        </div>
      </div>

      {loading && !data ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-emerald-400 animate-spin" /></div>
      ) : byProduct.length === 0 ? (
        <p className="text-[12px] text-[#666] py-8 text-center">Sem {pend ? "pendentes" : "vendas"} nesse dia.</p>
      ) : (
        <div className="space-y-1.5">
          {/* cabeçalho */}
          <div className="flex items-center gap-2 px-2.5 text-[9px] text-[#666] uppercase tracking-wider">
            <Package className="w-3 h-3" />
            <span className="flex-1">Produto</span>
            <span className="w-14 text-center">Qtd</span>
            <span className="w-24 text-right">Receita</span>
          </div>
          {byProduct.map((p, i) => (
            <div key={i} className="relative rounded-lg bg-[#111] border border-[#222] overflow-hidden">
              {/* barra proporcional à quantidade */}
              <div className={cn("absolute inset-y-0 left-0", pend ? "bg-amber-500/10" : "bg-emerald-500/10")} style={{ width: `${(p.qty / maxQty) * 100}%` }} />
              <div className="relative flex items-center gap-2 px-2.5 py-2.5">
                <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full shrink-0 border font-bold", p.is_front ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" : "bg-violet-500/15 text-violet-300 border-violet-500/30")}>{p.is_front ? "FRONT" : "UP"}</span>
                <span className="text-[12px] sm:text-sm font-semibold text-white truncate flex-1">{p.product}</span>
                <span className="w-14 text-center text-lg font-black text-white tabular-nums">{p.qty}</span>
                <span className={cn("w-24 text-right text-[12px] font-bold tabular-nums", pend ? "text-amber-300" : "text-emerald-400")}>{brl(p.revenue)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
