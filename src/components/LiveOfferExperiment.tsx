import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Tag, RefreshCw, Loader2, Crown } from "lucide-react";

interface V { exp: string; visitors: number; saw_offer: number; clicked: number; sales: number; upsell_sales: number; upsell_revenue: number; revenue: number; conv: number; rpv: number; }
const PERIODS = [{ label: "Hoje", d: 1 }, { label: "7 dias", d: 7 }, { label: "30 dias", d: 30 }];
const META: Record<string, { name: string; color: string }> = {
  current: { name: "Oferta ATUAL", color: "text-sky-300" },
  v147: { name: "VSL R$147", color: "text-amber-300" },
};
const brl = (n: number) => `R$ ${Number(n || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function LiveOfferExperiment() {
  const [days, setDays] = useState(7);
  const [data, setData] = useState<V[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (d: number) => {
    setLoading(true);
    const { data: res } = await supabase.rpc("get_offer_comparison" as any, { p_days: d });
    if (res) setData((res as any).variants || []);
    setLoading(false);
  }, []);
  useEffect(() => { fetchData(days); }, [days, fetchData]);

  const get = (e: string) => data.find(v => v.exp === e) || { exp: e, visitors: 0, saw_offer: 0, clicked: 0, sales: 0, upsell_sales: 0, upsell_revenue: 0, revenue: 0, conv: 0, rpv: 0 } as V;
  const A = get("current"), B = get("v147");
  const hasData = A.visitors + B.visitors > 0;
  const enough = A.visitors >= 30 && B.visitors >= 30;
  const winner = !enough ? null : (B.rpv > A.rpv ? "v147" : A.rpv > B.rpv ? "current" : null);

  const Row = ({ label, a, b }: { label: string; a: string; b: string }) => (
    <div className="grid grid-cols-[1fr_auto_auto] gap-2 items-center py-1 border-t border-[#1c1c1c] text-[11px]">
      <span className="text-[#999]">{label}</span>
      <span className="w-20 text-right font-bold text-sky-300 tabular-nums">{a}</span>
      <span className="w-20 text-right font-bold text-amber-300 tabular-nums">{b}</span>
    </div>
  );

  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a] p-4 sm:p-5">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/25"><Tag className="w-4 h-4 text-amber-400" /></div>
          <div>
            <h3 className="text-sm font-bold text-white">Teste de Oferta — Atual vs VSL R$147</h3>
            <p className="text-[10px] text-[#666]">step-17 · qual vende mais</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-[#111] border border-[#2a2a2a] rounded-lg p-0.5">
            {PERIODS.map(p => <button key={p.d} onClick={() => setDays(p.d)} className={cn("px-2.5 py-1 rounded-md text-xs", days === p.d ? "bg-amber-500/20 text-amber-300 font-semibold" : "text-[#888] hover:text-white")}>{p.label}</button>)}
          </div>
          <button onClick={() => fetchData(days)} className="p-1.5 rounded-lg bg-[#111] border border-[#2a2a2a] text-[#888] hover:text-white"><RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} /></button>
        </div>
      </div>

      {loading && data.length === 0 ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 text-amber-400 animate-spin" /></div>
      ) : !hasData ? (
        <div className="text-center py-8">
          <p className="text-[12px] text-[#888]">Aguardando os primeiros visitantes do teste (50/50). Conforme o pessoal passa pela oferta, os números de cada versão aparecem aqui.</p>
        </div>
      ) : (
        <>
          {winner && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-2 mb-3 flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-400 shrink-0" />
              <p className="text-[12px] text-[#ddd]">Liderando: <b className={META[winner].color}>{META[winner].name}</b> — melhor RPV ({brl((winner === "current" ? A : B).rpv)} vs {brl((winner === "current" ? B : A).rpv)}).</p>
            </div>
          )}
          <div className="grid grid-cols-[1fr_auto_auto] gap-2 items-end mb-1">
            <span />
            <span className="w-20 text-right text-[10px] font-bold text-sky-300">ATUAL</span>
            <span className="w-20 text-right text-[10px] font-bold text-amber-300">R$147</span>
          </div>
          <Row label="Visitantes" a={String(A.visitors)} b={String(B.visitors)} />
          <Row label="Viu a oferta (botão)" a={String(A.saw_offer)} b={String(B.saw_offer)} />
          <Row label="Clicou" a={String(A.clicked)} b={String(B.clicked)} />
          <Row label="Vendas (front)" a={String(A.sales)} b={String(B.sales)} />
          <Row label="Upsells (qtd)" a={String(A.upsell_sales)} b={String(B.upsell_sales)} />
          <Row label="Receita upsell" a={brl(A.upsell_revenue)} b={brl(B.upsell_revenue)} />
          <Row label="Receita total" a={brl(A.revenue)} b={brl(B.revenue)} />
          <Row label="Conversão" a={`${A.conv}%`} b={`${B.conv}%`} />
          <Row label="RPV (receita/visitante)" a={brl(A.rpv)} b={brl(B.rpv)} />
          {!enough && <p className="text-[10px] text-[#666] mt-2">Amostra ainda pequena (mín. 30 visitantes por versão pra cravar vencedor).</p>}
        </>
      )}
      <p className="text-[9px] text-[#555] mt-2">A variação R$147 usa a VSL e o checkout próprios (a definir). RPV = receita ÷ visitantes — a métrica que decide o vencedor.</p>
    </div>
  );
}
