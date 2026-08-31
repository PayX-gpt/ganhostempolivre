import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { FlaskConical, RefreshCw, Loader2, Crown } from "lucide-react";

interface V { exp: string; visitors: number; s9_abandon: number; s11_abandon: number; s9_views: number; s11_views: number; reached: number; clicked: number; sales: number; conv: number; }
const PERIODS = [{ label: "Hoje", d: 1 }, { label: "7 dias", d: 7 }, { label: "30 dias", d: 30 }];
const META: Record<string, { name: string; desc: string; color: string; ring: string }> = {
  A: { name: "Versão ANTIGA", desc: "pergunta atual + demo de ~1 min", color: "text-sky-300", ring: "border-sky-500/40" },
  B: { name: "Versão NOVA", desc: "pergunta suave + demo rápida c/ promessa", color: "text-emerald-300", ring: "border-emerald-500/40" },
};

export default function LiveStepExperiment() {
  const [days, setDays] = useState(7);
  const [data, setData] = useState<V[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (d: number) => {
    setLoading(true);
    const { data: res } = await supabase.rpc("get_step_experiment_comparison" as any, { p_days: d });
    if (res) setData((res as any).variants || []);
    setLoading(false);
  }, []);
  useEffect(() => { fetchData(days); }, [days, fetchData]);

  const get = (e: string) => data.find(v => v.exp === e) || { exp: e, visitors: 0, s9_abandon: 0, s11_abandon: 0, s9_views: 0, s11_views: 0, reached: 0, clicked: 0, sales: 0, conv: 0 } as V;
  const A = get("A"), B = get("B");
  const hasData = A.visitors + B.visitors > 0;
  const enough = A.visitors >= 30 && B.visitors >= 30;
  const winner = !enough ? null : (B.conv > A.conv ? "B" : A.conv > B.conv ? "A" : null);

  const Row = ({ label, a, b, betterLow }: { label: string; a: string; b: string; betterLow?: boolean }) => (
    <div className="grid grid-cols-[1fr_auto_auto] gap-2 items-center py-1 border-t border-[#1c1c1c] text-[11px]">
      <span className="text-[#999]">{label}</span>
      <span className="w-16 text-right font-bold text-sky-300 tabular-nums">{a}</span>
      <span className="w-16 text-right font-bold text-emerald-300 tabular-nums">{b}</span>
    </div>
  );

  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a] p-4 sm:p-5">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-violet-500/15 border border-violet-500/25"><FlaskConical className="w-4 h-4 text-violet-400" /></div>
          <div>
            <h3 className="text-sm font-bold text-white">Teste de Etapas — Saldo (9) + Demo (11)</h3>
            <p className="text-[10px] text-[#666]">antiga vs nova versão</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-[#111] border border-[#2a2a2a] rounded-lg p-0.5">
            {PERIODS.map(p => <button key={p.d} onClick={() => setDays(p.d)} className={cn("px-2.5 py-1 rounded-md text-xs", days === p.d ? "bg-violet-500/20 text-violet-300 font-semibold" : "text-[#888] hover:text-white")}>{p.label}</button>)}
          </div>
          <button onClick={() => fetchData(days)} className="p-1.5 rounded-lg bg-[#111] border border-[#2a2a2a] text-[#888] hover:text-white"><RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} /></button>
        </div>
      </div>

      {loading && data.length === 0 ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 text-violet-400 animate-spin" /></div>
      ) : !hasData ? (
        <p className="text-[12px] text-[#888] text-center py-8">Aguardando tráfego no teste. Os visitantes novos entram 50/50 na versão antiga (A) ou nova (B) — os números aparecem aqui conforme passam pelas etapas 9 e 11.</p>
      ) : (
        <>
          {winner && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-2 mb-3 flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-400 shrink-0" />
              <p className="text-[12px] text-[#ddd]">Liderando: <b className={META[winner].color}>{META[winner].name}</b> — melhor conversão ({(winner === "A" ? A : B).conv}% vs {(winner === "A" ? B : A).conv}%).</p>
            </div>
          )}
          <div className="grid grid-cols-[1fr_auto_auto] gap-2 items-end mb-1">
            <span />
            <span className="w-16 text-right text-[10px] font-bold text-sky-300">ANTIGA (A)</span>
            <span className="w-16 text-right text-[10px] font-bold text-emerald-300">NOVA (B)</span>
          </div>
          <Row label="Visitantes" a={String(A.visitors)} b={String(B.visitors)} />
          <Row label="Abandono etapa 9 (Saldo)" a={`${A.s9_abandon}%`} b={`${B.s9_abandon}%`} betterLow />
          <Row label="Abandono etapa 11 (Demo)" a={`${A.s11_abandon}%`} b={`${B.s11_abandon}%`} betterLow />
          <Row label="Chegou na oferta" a={String(A.reached)} b={String(B.reached)} />
          <Row label="Clicou" a={String(A.clicked)} b={String(B.clicked)} />
          <Row label="Vendas" a={String(A.sales)} b={String(B.sales)} />
          <Row label="Conversão" a={`${A.conv}%`} b={`${B.conv}%`} />
          {!enough && <p className="text-[10px] text-[#666] mt-2">Amostra ainda pequena (mín. 30 visitantes por versão pra cravar vencedor).</p>}
        </>
      )}
      <p className="text-[9px] text-[#555] mt-2">B: etapa 9 pergunta "com quanto quer começar" (sem pressão) + demo da etapa 11 mais rápida, com promessa no topo e botão de continuar cedo. Menor abandono e maior conversão = versão vencedora.</p>
    </div>
  );
}
