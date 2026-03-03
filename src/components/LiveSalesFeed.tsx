import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, ShoppingBag, Clock, Package } from "lucide-react";
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
  session_id: string | null;
  utm_source: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  fbclid: string | null;
  own_source?: string | null;
  own_ttclid?: string | null;
  own_fbclid?: string | null;
}

const parseCampaignName = (raw: string | null): string | null => {
  if (!raw) return null;
  const pipeIdx = raw.indexOf("|");
  return pipeIdx > 0 ? raw.substring(0, pipeIdx).trim() : raw;
};

const isMetaSource = (sale: Sale): boolean => {
  if (sale.own_fbclid) return true;
  if (sale.own_source) {
    const s = sale.own_source.toLowerCase();
    return s.startsWith("fb") || s.includes("facebook") || s.includes("instagram") || s.includes("meta");
  }
  if (sale.fbclid) return true;
  const src = sale.utm_source?.toLowerCase() || "";
  return src.startsWith("fb") || src.includes("facebook") || src.includes("instagram") || src.includes("meta");
};

const isTiktokSource = (sale: Sale): boolean => {
  if (sale.own_ttclid) return true;
  if (sale.own_source) {
    const s = sale.own_source.toLowerCase();
    return s.includes("tiktok");
  }
  const src = sale.utm_source?.toLowerCase() || "";
  return src.includes("tiktok") || src.includes("ttclid");
};

const STEP_LABELS: Record<string, { label: string; type: 'front' | 'upsell' | 'downsell'; color: string }> = {
  front_37: { label: "Front R$37", type: "front", color: "emerald" },
  front_47: { label: "Front R$47", type: "front", color: "emerald" },
  front_66: { label: "Front R$66", type: "front", color: "emerald" },
  acelerador_basico: { label: "Acel. Básico", type: "upsell", color: "violet" },
  acelerador_duplo: { label: "Acel. Duplo", type: "upsell", color: "violet" },
  acelerador_maximo: { label: "Acel. Máximo", type: "upsell", color: "violet" },
  multiplicador_prata: { label: "Mult. Prata", type: "upsell", color: "blue" },
  multiplicador_ouro: { label: "Mult. Ouro", type: "upsell", color: "blue" },
  multiplicador_diamante: { label: "Mult. Diamante", type: "upsell", color: "blue" },
  blindagem: { label: "Blindagem", type: "upsell", color: "cyan" },
  circulo_interno: { label: "Círculo Interno", type: "upsell", color: "cyan" },
  safety_pro: { label: "Safety Pro", type: "upsell", color: "amber" },
  forex_mentoria: { label: "Forex Mentoria", type: "upsell", color: "amber" },
  downsell_guia: { label: "Guia Downsell", type: "downsell", color: "orange" },
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

const TYPE_BADGES: Record<string, { label: string; className: string }> = {
  front: { label: "FRONT", className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  upsell: { label: "UPSELL", className: "bg-violet-500/20 text-violet-400 border-violet-500/30" },
  downsell: { label: "DOWN", className: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
};

export default function LiveSalesfeed() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [newSaleId, setNewSaleId] = useState<string | null>(null);

  const fetchSales = async () => {
    const now = new Date();
    const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const { data } = await supabase
      .from("purchase_tracking")
      .select("id, buyer_name, email, amount, product_name, funnel_step, status, created_at, session_id, utm_source, utm_campaign, utm_term, fbclid")
      .eq("status", "approved")
      .gte("created_at", todayUTC.toISOString())
      .order("created_at", { ascending: false })
      .limit(30);
    
    if (!data) return;

    const sessionIds = data.map(s => s.session_id).filter(Boolean) as string[];
    let attributionMap: Record<string, { utm_source: string | null; ttclid: string | null; fbclid: string | null }> = {};
    
    if (sessionIds.length > 0) {
      const { data: attrs } = await supabase
        .from("session_attribution" as any)
        .select("session_id, utm_source, ttclid, fbclid")
        .in("session_id", sessionIds);
      if (attrs) {
        (attrs as any[]).forEach((a: any) => {
          attributionMap[a.session_id] = { utm_source: a.utm_source, ttclid: a.ttclid, fbclid: a.fbclid };
        });
      }
    }

    const enriched: Sale[] = data.map(sale => {
      const own = sale.session_id ? attributionMap[sale.session_id] : null;
      return { ...sale, own_source: own?.utm_source || null, own_ttclid: own?.ttclid || null, own_fbclid: own?.fbclid || null } as Sale;
    });

    setSales(enriched);
  };

  useEffect(() => {
    fetchSales();
    const channel = supabase
      .channel("live-sales-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "purchase_tracking" }, (payload) => {
        const row = payload.new as Sale;
        if (row?.status === "approved") {
          setNewSaleId(row.id);
          setTimeout(() => setNewSaleId(null), 3000);
          setSales(prev => {
            const filtered = prev.filter(s => s.id !== row.id);
            return [row, ...filtered].slice(0, 30);
          });
        }
        fetchSales();
      }).subscribe();
    const pollInterval = setInterval(fetchSales, 15000);
    return () => { supabase.removeChannel(channel); clearInterval(pollInterval); };
  }, []);

  if (sales.length === 0) return null;

  // Separate front and upsell
  const frontSales = sales.filter(s => (s.funnel_step || '').startsWith('front'));
  const upsellSales = sales.filter(s => !(s.funnel_step || '').startsWith('front'));

  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a] p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/20 flex-shrink-0">
          <ShoppingBag className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h3 className="font-semibold text-white text-sm">Vendas em Tempo Real</h3>
          <p className="text-[10px] text-[#666]">🟢 {frontSales.length} front · 🟣 {upsellSales.length} upsell</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span></span>
          <span className="text-[10px] text-emerald-400 font-medium">AO VIVO</span>
        </div>
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
        {sales.map((sale) => {
          const isNew = sale.id === newSaleId;
          const stepInfo = STEP_LABELS[sale.funnel_step || ""] || { label: sale.product_name || "Produto", type: "front" as const, color: "emerald" };
          const typeBadge = TYPE_BADGES[stepInfo.type];
          const displayName = formatName(sale.buyer_name, sale.email);
          const isTiktok = isTiktokSource(sale);
          const isMeta = isMetaSource(sale);
          const campaign = parseCampaignName(sale.utm_campaign);

          return (
            <div key={sale.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border transition-all duration-500",
                isNew
                  ? isTiktok ? "bg-red-500/10 border-red-500/40 scale-[1.01]" : "bg-emerald-500/10 border-emerald-500/40 scale-[1.01]"
                  : "bg-[#0d0d0d] border-[#2a2a2a]"
              )}>
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold",
                stepInfo.type === 'upsell' ? "bg-violet-500/20 text-violet-300" :
                isNew ? (isTiktok ? "bg-red-500/20 text-red-300" : "bg-emerald-500/20 text-emerald-300") : "bg-[#1a1a1a] text-[#888]"
              )}>
                {stepInfo.type === 'upsell' ? <Package className="w-4 h-4" /> : displayName[0].toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-white font-semibold text-sm truncate">{displayName}</span>
                  {/* Type badge */}
                  <span className={cn("text-[8px] px-1.5 py-0.5 rounded-full border font-bold flex-shrink-0", typeBadge.className)}>
                    {typeBadge.label}
                  </span>
                  {isNew && (
                    <span className="text-[8px] px-1.5 py-0.5 rounded-full border font-medium flex-shrink-0 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">NOVO</span>
                  )}
                  {isTiktok && (
                    <span className="text-[8px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full border border-red-500/30 font-bold flex-shrink-0">TikTok</span>
                  )}
                  {isMeta && (
                    <span className="text-[8px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full border border-blue-500/30 font-bold flex-shrink-0">Meta</span>
                  )}
                </div>
                <p className="text-[10px] text-[#888] truncate">
                  {stepInfo.label}
                  {campaign && <span className="text-[#555] ml-1">· {campaign}</span>}
                </p>
              </div>

              <div className="flex flex-col items-end flex-shrink-0 gap-0.5">
                <span className={cn("font-bold text-sm tabular-nums",
                  stepInfo.type === 'upsell' ? "text-violet-400" :
                  isTiktok ? "text-red-400" : "text-emerald-400"
                )}>
                  R$ {Number(sale.amount || 0).toFixed(0)}
                </span>
                <span className="text-[9px] text-[#666] flex items-center gap-0.5">
                  <Clock className="w-2.5 h-2.5" />
                  {new Date(sale.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>

              <CheckCircle2 className={cn("w-4 h-4 flex-shrink-0",
                stepInfo.type === 'upsell' ? "text-violet-400" :
                isTiktok ? "text-red-400" : "text-emerald-400"
              )} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
