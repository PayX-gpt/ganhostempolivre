import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { FlaskConical, RefreshCw, Loader2, Crown } from "lucide-react";

interface StepV { step: number; viewers: number; }
interface Row { exp: string; visitors: number; saw: number; clicked: number; ic: number; sales: number; revenue: number; steps: StepV[]; }
interface VarDef { key: string; label: string; color: string; bar: string; }
interface Exp { col: string; title: string; sub: string; variants: VarDef[]; }

// Registro de experimentos de ETAPA (A/B). Adicionar um novo aqui = aparece automático.
const EXPERIMENTS: Exp[] = [
  { col: "offer_exp", title: "Oferta step-17 — Atual vs VSL R$147", sub: "vídeo/checkout da oferta final",
    variants: [
      { key: "current", label: "Atual", color: "text-sky-300", bar: "bg-sky-500/40" },
      { key: "v147", label: "VSL R$147", color: "text-amber-300", bar: "bg-amber-500/40" },
    ] },
  { col: "step_exp", title: "Etapas 9 + 11 — Antiga vs Nova", sub: "pergunta do saldo + demo",
    variants: [
      { key: "A", label: "Antiga", color: "text-sky-300", bar: "bg-sky-500/40" },
      { key: "B", label: "Nova", color: "text-emerald-300", bar: "bg-emerald-500/40" },
    ] },
];

const PERIODS = [{ label: "Hoje", d: 1 }, { label: "7 dias", d: 7 }, { label: "30 dias", d: 30 }];
const brl = (n: number) => `R$ ${Number(n || 0).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const pct = (a: number, b: number) => (b > 0 ? ((a / b) * 100).toFixed(1) : "0.0");
const STEP_LABELS: Record<number, string> = {
  1: "Intro", 2: "Idade", 3: "Nome", 4: "Prova", 5: "Tentou", 6: "Meta", 7: "Obstác.", 8: "Mentor",
  9: "Saldo", 10: "Dispon.", 11: "Demo", 12: "WhatsApp", 13: "Contato", 14: "Input", 15: "Análise", 16: "Projeção", 17: "Oferta",
};

function ExperimentCard({ exp, days }: { exp: Exp; days: number }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.rpc("get_experiment_funnel" as any, { p_col: exp.col, p_variants: exp.variants.map(v => v.key), p_days: days });
    setRows((data as any) || []); setLoading(false);
  }, [exp.col, days]);
  useEffect(() => { fetch(); }, [fetch]);

  const get = (k: string): Row => rows.find(r => r.exp === k) || { exp: k, visitors: 0, saw: 0, clicked: 0, ic: 0, sales: 0, revenue: 0, steps: [] };
  const total = exp.variants.reduce((s, v) => s + get(v.key).visitors, 0);
  const rpv = (r: Row) => (r.visitors > 0 ? r.revenue / r.visitors : 0);
  const eligible = exp.variants.every(v => get(v.key).visitors >= 30);
  const winner = eligible ? exp.variants.slice().sort((a, b) => rpv(get(b.key)) - rpv(get(a.key)))[0] : null;

  return (
    <div className="rounded-xl border border-[#2a2a2a] bg-[#0d0d0d] p-3">
      <div className="flex items-center justify-between mb-2">
        <div><h4 className="text-[13px] font-bold text-white">{exp.title}</h4><p className="text-[10px] text-[#666]">{exp.sub}</p></div>
        {loading && <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />}
      </div>

      {total === 0 ? (
        <p className="text-[11px] text-[#666] py-4 text-center">Aguardando visitantes nesse teste no período.</p>
      ) : (
        <>
          {winner && <div className="flex items-center gap-1.5 mb-2 text-[11px]"><Crown className="w-3.5 h-3.5 text-amber-400" /><span className="text-[#ccc]">Liderando: <b className={winner.color}>{winner.label}</b> (RPV {brl(rpv(get(winner.key)))})</span></div>}
          <div className="grid grid-cols-2 gap-2">
            {exp.variants.map(v => {
              const r = get(v.key);
              const maxV = Math.max(1, ...r.steps.map(s => s.viewers));
              return (
                <div key={v.key} className="rounded-lg bg-[#111] border border-[#222] p-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={cn("text-xs font-black", v.color)}>{v.label}</span>
                    <span className="text-[10px] text-[#888]">{r.visitors} visit.</span>
                  </div>
                  {/* funil da oferta */}
                  <div className="grid grid-cols-2 gap-1 text-[10px] mb-2">
                    <div className="flex justify-between rounded bg-[#0a0a0a] px-1.5 py-0.5"><span className="text-[#888]">Viu botão</span><b className="text-white">{r.saw}</b></div>
                    <div className="flex justify-between rounded bg-[#0a0a0a] px-1.5 py-0.5"><span className="text-[#888]">Clicou</span><b className="text-white">{r.clicked}</b></div>
                    <div className="flex justify-between rounded bg-[#0a0a0a] px-1.5 py-0.5"><span className="text-[#888]">IC</span><b className="text-white">{r.ic}</b></div>
                    <div className="flex justify-between rounded bg-[#0a0a0a] px-1.5 py-0.5"><span className="text-[#888]">Comprou</span><b className="text-emerald-400">{r.sales}</b></div>
                    <div className="flex justify-between rounded bg-[#0a0a0a] px-1.5 py-0.5"><span className="text-[#888]">Conv.</span><b className="text-emerald-400">{pct(r.sales, r.visitors)}%</b></div>
                    <div className="flex justify-between rounded bg-[#0a0a0a] px-1.5 py-0.5"><span className="text-[#888]">RPV</span><b className="text-amber-400">{brl(rpv(r))}</b></div>
                  </div>
                  {/* passagem por etapa */}
                  <div className="space-y-0.5">
                    {r.steps.map((s, i) => {
                      const prev = i > 0 ? r.steps[i - 1] : null;
                      const drop = prev && prev.viewers > 0 ? ((prev.viewers - s.viewers) / prev.viewers) * 100 : 0;
                      return (
                        <div key={s.step} className="flex items-center gap-1">
                          <span className="w-14 text-[8px] text-[#666] truncate">{s.step}.{STEP_LABELS[s.step] || ""}</span>
                          <div className="flex-1 h-2 rounded bg-[#0a0a0a] overflow-hidden"><div className={cn("h-full", v.bar)} style={{ width: `${(s.viewers / maxV) * 100}%` }} /></div>
                          <span className="w-6 text-right text-[8px] text-white tabular-nums">{s.viewers}</span>
                          <span className={cn("w-8 text-right text-[8px] tabular-nums", drop >= 30 ? "text-red-400" : "text-[#555]")}>{prev && drop > 0 ? `-${drop.toFixed(0)}%` : ""}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          {!eligible && <p className="text-[9px] text-[#666] mt-1.5">Amostra pequena (mín. 30/versão pra cravar vencedor).</p>}
        </>
      )}
    </div>
  );
}

export default function LiveExperiments() {
  const [days, setDays] = useState(1);
  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a] p-4 sm:p-5">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-violet-500/15 border border-violet-500/25"><FlaskConical className="w-4 h-4 text-violet-400" /></div>
          <div>
            <h3 className="text-sm font-bold text-white">Testes A/B de Etapas</h3>
            <p className="text-[10px] text-[#666]">funil completo por versão — viu botão, clicou, IC, comprou, etapa a etapa</p>
          </div>
        </div>
        <div className="flex bg-[#111] border border-[#2a2a2a] rounded-lg p-0.5">
          {PERIODS.map(p => <button key={p.d} onClick={() => setDays(p.d)} className={cn("px-2.5 py-1 rounded-md text-xs", days === p.d ? "bg-violet-500/20 text-violet-300 font-semibold" : "text-[#888] hover:text-white")}>{p.label}</button>)}
        </div>
      </div>
      <div className="space-y-3">
        {EXPERIMENTS.map(e => <ExperimentCard key={e.col} exp={e} days={days} />)}
      </div>
      <p className="text-[9px] text-[#555] mt-2">Qualquer teste A/B de etapa novo entra aqui automaticamente. RPV (receita ÷ visitante) decide o vencedor.</p>
    </div>
  );
}
