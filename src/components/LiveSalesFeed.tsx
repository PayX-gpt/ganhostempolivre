import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, DollarSign, ShoppingBag, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Sale {
  id: string;
  buyer_name: string | null;
  email: string | null;
  amount: number | null;
  product_name: string | null;
  funnel_step: string | null;
  status: string | null;
  created_at: string;
}

const STEP_LABELS: Record<string, string> = {
  front_37: "Produto Principal R$37",
  front_47: "Produto Principal R$47",
  acelerador_basico: "Acelerador Básico",
  acelerador_duplo: "Acelerador Duplo",
  acelerador_maximo: "Acelerador Máximo",
  multiplicador_prata: "Multiplicador Prata",
  multiplicador_ouro: "Multiplicador Ouro",
  multiplicador_diamante: "Multiplicador Diamante",
  blindagem: "Blindagem",
  circulo_interno: "Círculo Interno",
  safety_pro: "Safety Pro",
  forex_mentoria: "FOREX Mentoria",
  downsell_guia: "Guia Downsell",
};

const formatName = (buyer_name: string | null, email: string | null): string => {
  if (buyer_name && buyer_name.trim()) {
    const parts = buyer_name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0]} ${parts[1][0]}.`;
    return parts[0];
  }
  if (email) {
    const local = email.split("@")[0];
    return local.length > 10 ? local.substring(0, 10) + "…" : local;
  }
  return "Comprador";
};

export default function LiveSalesfeed() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [newSaleId, setNewSaleId] = useState<string | null>(null);

  const fetchSales = async () => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { data } = await supabase
      .from("purchase_tracking")
      .select("id, buyer_name, email, amount, product_name, funnel_step, status, created_at")
      .eq("status", "approved")
      .gte("created_at", todayStart.toISOString())
      .order("created_at", { ascending: false })
      .limit(15);
    if (data) setSales(data as Sale[]);
  };

  useEffect(() => {
    fetchSales();

    // Realtime listener
    const channel = supabase
      .channel("live-sales-feed")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "purchase_tracking",
      }, (payload) => {
        const row = payload.new as Sale;
        if (row?.status === "approved") {
          setNewSaleId(row.id);
          setTimeout(() => setNewSaleId(null), 3000);
          setSales(prev => {
            const filtered = prev.filter(s => s.id !== row.id);
            return [row, ...filtered].slice(0, 15);
          });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  if (sales.length === 0) return null;

  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a] p-5">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/20 flex-shrink-0">
          <ShoppingBag className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h3 className="font-semibold text-white text-sm">Compras em Tempo Real</h3>
          <p className="text-[10px] text-[#666]">Atualizações instantâneas do webhook</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
          </span>
          <span className="text-[10px] text-emerald-400 font-medium">AO VIVO</span>
        </div>
      </div>

      {/* Sales list */}
      <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
        {sales.map((sale) => {
          const isNew = sale.id === newSaleId;
          const label = STEP_LABELS[sale.funnel_step || ""] || sale.product_name || "Produto";
          const displayName = formatName(sale.buyer_name, sale.email);

          return (
            <div
              key={sale.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border transition-all duration-500",
                isNew
                  ? "bg-emerald-500/10 border-emerald-500/40 scale-[1.01]"
                  : "bg-[#0d0d0d] border-[#2a2a2a]"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold",
                isNew ? "bg-emerald-500/20 text-emerald-300" : "bg-[#1a1a1a] text-[#888]"
              )}>
                {displayName[0].toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-white font-semibold text-sm truncate">{displayName}</span>
                  {isNew && (
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full border border-emerald-500/30 font-medium flex-shrink-0">
                      NOVO
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-[#888] truncate">{label}</p>
              </div>

              <div className="flex flex-col items-end flex-shrink-0 gap-0.5">
                <span className="text-emerald-400 font-bold text-sm tabular-nums">
                  R$ {Number(sale.amount || 0).toFixed(0)}
                </span>
                <span className="text-[9px] text-[#666] flex items-center gap-0.5">
                  <Clock className="w-2.5 h-2.5" />
                  {new Date(sale.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>

              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
