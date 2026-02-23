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
  utm_source: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  fbclid: string | null;
}

/** Strip Facebook/Kirvano ad IDs from campaign names: "[OB LOVABLE]|12024..." → "[OB LOVABLE]" */
const parseCampaignName = (raw: string | null): string | null => {
  if (!raw) return null;
  const pipeIdx = raw.indexOf("|");
  return pipeIdx > 0 ? raw.substring(0, pipeIdx).trim() : raw;
};

/** Detect if traffic is from Meta (FB/IG) — includes FBjLj prefix pattern from Kirvano */
const isMetaSource = (sale: Sale): boolean => {
  if (sale.fbclid) return true;
  const src = sale.utm_source?.toLowerCase() || "";
  return src.startsWith("fb") || src.includes("facebook") || src.includes("instagram") || src.includes("meta");
};

/** Detect if traffic is from TikTok */
const isTiktokSource = (sale: Sale): boolean => {
  const src = sale.utm_source?.toLowerCase() || "";
  return src.includes("tiktok") || src.includes("ttclid");
};

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
      .select("id, buyer_name, email, amount, product_name, funnel_step, status, created_at, utm_source, utm_campaign, utm_term, fbclid")
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
          const isTiktok = isTiktokSource(sale);
          const isMeta = isMetaSource(sale);
          const campaign = parseCampaignName(sale.utm_campaign);
          const placement = sale.utm_term || null;

          return (
            <div
              key={sale.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border transition-all duration-500",
                isNew
                  ? isTiktok ? "bg-red-500/10 border-red-500/40 scale-[1.01]" : "bg-emerald-500/10 border-emerald-500/40 scale-[1.01]"
                  : "bg-[#0d0d0d] border-[#2a2a2a]"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold",
                isNew ? (isTiktok ? "bg-red-500/20 text-red-300" : "bg-emerald-500/20 text-emerald-300") : "bg-[#1a1a1a] text-[#888]"
              )}>
                {displayName[0].toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-white font-semibold text-sm truncate">{displayName}</span>
                  {isNew && (
                    <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full border font-medium flex-shrink-0",
                      isTiktok ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                    )}>
                      NOVO
                    </span>
                  )}
                  {/* Source badge */}
                  {isTiktok && (
                    <span className="text-[8px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full border border-red-500/30 font-bold flex-shrink-0 shadow-[0_0_6px_rgba(239,68,68,0.3)]">
                      TikTok
                    </span>
                  )}
                  {isMeta && (
                    <span className="text-[8px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full border border-blue-500/30 font-bold flex-shrink-0">
                      Meta
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-[#888] truncate">
                  {label}
                  {campaign && <span className="text-[#555] ml-1">· {campaign}</span>}
                  {placement && <span className="text-[#444] ml-1">· {placement}</span>}
                </p>
              </div>

              <div className="flex flex-col items-end flex-shrink-0 gap-0.5">
                <span className={cn("font-bold text-sm tabular-nums", isTiktok ? "text-red-400" : "text-emerald-400")}>
                  R$ {Number(sale.amount || 0).toFixed(0)}
                </span>
                <span className="text-[9px] text-[#666] flex items-center gap-0.5">
                  <Clock className="w-2.5 h-2.5" />
                  {new Date(sale.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>

              <CheckCircle2 className={cn("w-4 h-4 flex-shrink-0", isTiktok ? "text-red-400" : "text-emerald-400")} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
