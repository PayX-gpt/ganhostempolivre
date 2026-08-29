import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Trophy, Users, Flag, RefreshCw, Loader2, TrendingDown, Crown } from "lucide-react";

interface EdRow {
  edition: string; visitors: number; quiz_complete: number; saw_button: number;
  clicked: number; sales: number; revenue: number;
}
interface StepRow { edition: string; step: string; step_num: number; views: number; }
interface Data { period_days: number; editions: EdRow[]; steps: StepRow[]; }

const PERIODS = [{ label: "Hoje", days: 1 }, { label: "7 dias", days: 7 }, { label: "30 dias", days: 30 }];
const ED_META: Record<string, { name: string; color: string; bar: string; ring: string }> = {
  A: { name: "Quiz A (principal)", color: "text-sky-300", bar: "bg-sky-500/40", ring: "border-sky-500/40" },
  B: { name: "Quiz B", color: "text-violet-300", bar: "bg-violet-500/40", ring: "border-violet-500/40" },
  C: { name: "Quiz C (Guardião)", color: "text-amber-300", bar: "bg-amber-500/40", ring: "border-amber-500/40" },
};
const pct = (a: number, b: number) => (b > 0 ? (a / b) * 100 : 0);
const f1 = (n: number) => n.toFixed(1);
const brl = (n: number) => `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function LiveEditionAB() {
  const [days, setDays] = useState(7);
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (d: number) => {
    setLoading(true);
    try {
      const { data: res, error } = await supabase.rpc("get_edition_comparison" as any, { p_days: d });
      if (!error && res) setData(res as any);
    } catch (e) { console.error("[EditionAB]", e); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(days); }, [days, fetchData]);
  useEffect(() => { const t = setInterval(() => fetchData(days), 60_000); return () => clearInterval(t); }, [days, fetchData]);

  if (loading && !data) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 text-emerald-400 animate-spin" /></div>;

  const eds = (data?.editions || []);
  const withData = eds.filter(e => e.visitors > 0);
  const rpvOf = (e: EdRow) => (e.visitors > 0 ? e.revenue / e.visitors : 0);
  // vencedor = maior RPV com amostra mínima
  const MIN = 30;
  const eligible = withData.filter(e => e.visitors >= MIN);
  const winner = (eligible.length ? eligible : withData).slice().sort((a, b) => rpvOf(b) - rpvOf(a))[0];
  const enough = winner && winner.visitors >= MIN && withData.length >= 2;

  const stepsByEd = (ed: string) => (data?.steps || []).filter(s => s.edition === ed).sort((a, b) => a.step_num - b.step_num);

  const funnelRow = (label: string, val: number, base: number, sub?: string) => (
    <div className="flex items-center gap-2">
      <div className="w-24 shrink-0 text-[10px] text-[#999]">{label}</div>
      <div className="flex-1 h-4 rounded bg-[#0a0a0a] overflow-hidden"><div className="h-full bg-emerald-500/40" style={{ width: `${pct(val, base)}%` }} /></div>
      <div className="w-24 shrink-0 text-right text-[10px]"><span className="text-white font-bold tabular-nums">{val}</span> <span className="text-[#666]">{sub || `${f1(pct(val, base))}%`}</span></div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-white">Comparação de Quiz — A vs B vs C</h3>
          <span className="text-[11px] text-[#888]">qual vende mais</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-0.5">
            {PERIODS.map(p => (
              <button key={p.days} onClick={() => setDays(p.days)}
                className={cn("px-2.5 py-1 rounded-md text-xs", days === p.days ? "bg-emerald-500/20 text-emerald-400 font-semibold" : "text-[#888] hover:text-white")}>{p.label}</button>
            ))}
          </div>
          <button onClick={() => fetchData(days)} className="p-1.5 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-[#888] hover:text-white"><RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} /></button>
        </div>
      </div>

      {/* Veredito */}
      <div className={cn("rounded-xl border p-3 flex items-center gap-3", enough ? "bg-emerald-500/5 border-emerald-500/30" : "bg-[#111] border-[#2a2a2a]")}>
        <Crown className={cn("w-5 h-5 shrink-0", enough ? "text-amber-400" : "text-[#555]")} />
        {winner && withData.length > 0 ? (
          enough ? (
            <p className="text-[12px] text-[#ddd]">Liderando: <span className={cn("font-black", ED_META[winner.edition]?.color)}>Quiz {winner.edition}</span> — melhor <b>RPV {brl(rpvOf(winner))}</b> ({winner.sales} vendas em {winner.visitors} visitantes). {withData.length < eds.length ? "Ligue as outras edições pra comparar." : ""}</p>
          ) : (
            <p className="text-[12px] text-[#aaa]">Amostra ainda pequena pra cravar vencedor (mín. {MIN} visitantes/edição). Por enquanto quem está à frente é <span className={cn("font-bold", ED_META[winner.edition]?.color)}>Quiz {winner.edition}</span> (RPV {brl(rpvOf(winner))}).</p>
          )
        ) : <p className="text-[12px] text-[#888]">Sem dados no período. Ligue o teste (split) ou mande tráfego pros links das edições.</p>}
      </div>

      {/* Colunas A / B / C */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {["A", "B", "C"].map(edKey => {
          const e = eds.find(x => x.edition === edKey) || { edition: edKey, visitors: 0, quiz_complete: 0, saw_button: 0, clicked: 0, sales: 0, revenue: 0 };
          const meta = ED_META[edKey];
          const isWinner = enough && winner?.edition === edKey;
          const rpv = rpvOf(e);
          const conv = pct(e.sales, e.visitors);
          const steps = stepsByEd(edKey);
          const maxV = Math.max(1, ...steps.map(s => s.views));
          return (
            <div key={edKey} className={cn("rounded-xl border p-3", isWinner ? "border-amber-500/50 bg-amber-500/5" : "bg-[#111] border-[#2a2a2a]")}>
              <div className="flex items-center justify-between mb-2">
                <span className={cn("text-xs font-black", meta.color)}>{isWinner && "🏆 "}QUIZ {edKey}</span>
                <span className="text-[9px] text-[#666]">{meta.name}</span>
              </div>
              {e.visitors === 0 ? (
                <div className="text-[11px] text-[#666] py-6 text-center">Sem tráfego no período.<br /><span className="text-[10px]">Link: <code>?edition={edKey}</code></span></div>
              ) : (
                <>
                  {/* KPIs de destaque */}
                  <div className="grid grid-cols-3 gap-1.5 mb-2">
                    <div className="rounded-lg bg-[#0a0a0a] p-2 text-center"><div className="text-[9px] text-[#888]">Visitantes</div><div className="text-lg font-black text-white tabular-nums">{e.visitors}</div></div>
                    <div className="rounded-lg bg-[#0a0a0a] p-2 text-center"><div className="text-[9px] text-[#888]">Vendas</div><div className="text-lg font-black text-emerald-400 tabular-nums">{e.sales}</div></div>
                    <div className="rounded-lg bg-[#0a0a0a] p-2 text-center"><div className="text-[9px] text-[#888]">RPV</div><div className="text-sm font-black text-amber-400 tabular-nums">{brl(rpv)}</div></div>
                  </div>
                  {/* Funil */}
                  <div className="space-y-1 mb-2">
                    {funnelRow("Chegou oferta", e.quiz_complete, e.visitors)}
                    {funnelRow("Viu botão", e.saw_button, e.visitors)}
                    {funnelRow("Clicou", e.clicked, e.visitors)}
                    {funnelRow("Comprou", e.sales, e.visitors)}
                  </div>
                  {/* Taxas */}
                  <div className="grid grid-cols-2 gap-1 text-[10px] mb-2">
                    <div className="rounded bg-[#0a0a0a] px-2 py-1 flex justify-between"><span className="text-[#888]">Conversão</span><span className="font-bold text-emerald-400">{f1(conv)}%</span></div>
                    <div className="rounded bg-[#0a0a0a] px-2 py-1 flex justify-between"><span className="text-[#888]">CTR botão</span><span className="font-bold text-amber-400">{f1(pct(e.clicked, e.saw_button))}%</span></div>
                    <div className="rounded bg-[#0a0a0a] px-2 py-1 flex justify-between"><span className="text-[#888]">Fecham.</span><span className="font-bold text-sky-400">{f1(pct(e.sales, e.clicked))}%</span></div>
                    <div className="rounded bg-[#0a0a0a] px-2 py-1 flex justify-between"><span className="text-[#888]">Receita</span><span className="font-bold text-white">{brl(e.revenue)}</span></div>
                  </div>
                  {/* Retenção por etapa */}
                  {steps.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1 mb-1"><TrendingDown className="w-3 h-3 text-[#666]" /><span className="text-[9px] text-[#888]">Retenção por etapa</span></div>
                      <div className="space-y-0.5">
                        {steps.map((s, i) => {
                          const prev = i > 0 ? steps[i - 1] : null;
                          const drop = prev ? pct(prev.views - s.views, prev.views) : 0;
                          return (
                            <div key={s.step} className="flex items-center gap-1">
                              <span className="w-4 text-[8px] text-[#555] tabular-nums">{s.step_num}</span>
                              <div className="flex-1 h-2.5 rounded bg-[#0a0a0a] overflow-hidden"><div className={cn("h-full", meta.bar)} style={{ width: `${pct(s.views, maxV)}%` }} /></div>
                              <span className="w-8 text-right text-[8px] text-white tabular-nums">{s.views}</span>
                              <span className={cn("w-8 text-right text-[8px] tabular-nums", drop >= 40 ? "text-red-400" : "text-[#555]")}>{prev && drop > 0 ? `-${drop.toFixed(0)}%` : ""}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
      <div className="text-[9px] text-[#555]">Edição de cada sessão vem do <code>session_attribution.quiz_edition</code>. Vendas atribuídas por session_id. RPV = receita ÷ visitantes (a métrica que decide o vencedor).</div>
    </div>
  );
}
