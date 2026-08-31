import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Activity, RefreshCw, Loader2, ArrowDown, ArrowUp, Minus } from "lucide-react";

interface Step { step: string; step_num: number; viewers: number; completions: number; abandon_pct: number; }

const LABELS: Record<number, string> = {
  1: "Intro", 2: "Idade", 3: "Nome", 4: "Prova Social", 5: "Tentou Online", 6: "Meta Renda",
  7: "Obstáculo", 8: "Vídeo Mentor", 9: "Saldo", 10: "Disponibilidade", 11: "Demo Plataforma",
  12: "WhatsApp", 13: "Método Contato", 14: "Input Contato", 15: "Análise", 16: "Projeção", 17: "Oferta/VSL",
};

async function fetchRet(days: number, shift = 0): Promise<Step[]> {
  const { data } = await supabase.rpc("get_step_retention" as any, { p_days: days, p_shift: shift });
  return (data as any) || [];
}
const pct = (n?: number) => (n == null ? "—" : `${n.toFixed(1)}%`);
const color = (v: number) => (v >= 30 ? "text-red-400" : v >= 15 ? "text-amber-400" : v >= 8 ? "text-yellow-300" : "text-[#aaa]");

export default function LiveStepTracker() {
  const [hoje, setHoje] = useState<Step[]>([]);
  const [ontem, setOntem] = useState<Step[]>([]);
  const [d7, setD7] = useState<Step[]>([]);
  const [d30, setD30] = useState<Step[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [a, b, c, d] = await Promise.all([fetchRet(1, 0), fetchRet(1, 1), fetchRet(7, 0), fetchRet(30, 0)]);
    setHoje(a); setOntem(b); setD7(c); setD30(d); setLoading(false);
  }, []);
  useEffect(() => { fetchAll(); }, [fetchAll]);

  const map = (arr: Step[]) => Object.fromEntries(arr.map(s => [s.step_num, s]));
  const mH = map(hoje), mO = map(ontem), m7 = map(d7), m30 = map(d30);
  const nums = Array.from({ length: 17 }, (_, i) => i + 1);

  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a] p-4 sm:p-5">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/25"><Activity className="w-4 h-4 text-emerald-400" /></div>
          <div>
            <h3 className="text-sm font-bold text-white">Retenção por Etapa — dia a dia</h3>
            <p className="text-[10px] text-[#666]">abandono interno (viu → saiu) vs histórico</p>
          </div>
        </div>
        <button onClick={fetchAll} className="p-1.5 rounded-lg bg-[#111] border border-[#2a2a2a] text-[#888] hover:text-white"><RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} /></button>
      </div>

      {loading && hoje.length === 0 ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-emerald-400 animate-spin" /></div>
      ) : (
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-[11px] min-w-[520px]">
            <thead>
              <tr className="text-[9px] text-[#666] uppercase tracking-wider">
                <th className="text-left font-medium py-1.5 pl-1">Etapa</th>
                <th className="text-center font-medium">Viram hoje</th>
                <th className="text-center font-medium">Hoje</th>
                <th className="text-center font-medium">Ontem</th>
                <th className="text-center font-medium">Méd. 7d</th>
                <th className="text-center font-medium">Méd. 30d</th>
                <th className="text-center font-medium">vs 7d</th>
              </tr>
            </thead>
            <tbody>
              {nums.map(n => {
                const h = mH[n], base = m7[n];
                const hoAb = h?.abandon_pct, baseAb = base?.abandon_pct;
                const delta = (hoAb != null && baseAb != null) ? hoAb - baseAb : null;
                const worse = delta != null && delta > 2.5;
                const better = delta != null && delta < -2.5;
                return (
                  <tr key={n} className={cn("border-t border-[#1c1c1c]", worse && "bg-red-500/5")}>
                    <td className="py-1.5 pl-1 text-white font-medium whitespace-nowrap">{n}. {LABELS[n] || `Etapa ${n}`}</td>
                    <td className="text-center text-[#aaa] tabular-nums">{h?.viewers ?? "—"}</td>
                    <td className={cn("text-center font-bold tabular-nums", hoAb != null ? color(hoAb) : "text-[#555]")}>{pct(hoAb)}</td>
                    <td className="text-center tabular-nums text-[#888]">{pct(mO[n]?.abandon_pct)}</td>
                    <td className="text-center tabular-nums text-[#888]">{pct(baseAb)}</td>
                    <td className="text-center tabular-nums text-[#888]">{pct(m30[n]?.abandon_pct)}</td>
                    <td className="text-center">
                      {delta == null ? <span className="text-[#555]">—</span> : (
                        <span className={cn("inline-flex items-center gap-0.5 font-bold tabular-nums", worse ? "text-red-400" : better ? "text-emerald-400" : "text-[#777]")}>
                          {worse ? <ArrowUp className="w-3 h-3" /> : better ? <ArrowDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                          {delta > 0 ? "+" : ""}{delta.toFixed(1)}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-[9px] text-[#555] mt-2">Abandono interno = % de quem VIU a etapa e saiu sem completar (imune a desvios de versão). <span className="text-red-400">Vermelho / seta pra cima</span> = hoje está pior que a média de 7 dias (perdendo mais que o normal). Verde = melhor que o normal.</p>
    </div>
  );
}
