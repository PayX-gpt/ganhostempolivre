import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  Target, MousePointerClick, Eye, ShoppingCart, Users, TrendingDown,
  AlertTriangle, Trophy, RefreshCw, Loader2, Flag, Lightbulb, Film, Clock
} from "lucide-react";

interface StepRow { step: string; step_num: number; views: number; completions: number; avg_time_ms: number; }
interface VslRow { minute: number; sessions: number; }
interface HourRow { hour: number; reached: number; clicks: number; sales: number; }
interface PersonaRow { step: string; answer: string; count: number; }
interface Diag {
  period_days: number;
  visitors: number;
  reached_step17: number;
  saw_button: number;
  clicked_button: number;
  front_sales: number;
  revenue: number;
  steps: StepRow[];
  vsl_curve: VslRow[];
  hourly: HourRow[];
  persona: PersonaRow[];
}

const PERSONA_LABELS: Record<string, string> = {
  "step-2": "Idade", "step-5": "Já tentou online?", "step-6": "Meta de renda/dia", "step-7": "Maior obstáculo",
};

const STEP_LABELS: Record<number, string> = {
  1: "Intro", 2: "Idade", 3: "Nome", 4: "Prova social", 5: "Tentou online",
  6: "Meta renda", 7: "Obstáculo", 8: "Vídeo mentor", 9: "Saldo", 10: "Disponib.",
  11: "Demo", 12: "WhatsApp", 13: "Contato", 14: "Input contato", 15: "Loading",
  16: "Projeção", 17: "Oferta (VSL)",
};

const pct = (a: number, b: number) => (b > 0 ? (a / b) * 100 : 0);
const fmtPct = (n: number) => `${n.toFixed(1)}%`;
const fmtTime = (ms: number) => {
  if (!ms || ms <= 0) return "—";
  if (ms > 600000) return ">10min";
  const s = ms / 1000;
  return s >= 60 ? `${Math.floor(s / 60)}m${Math.round(s % 60)}s` : `${s.toFixed(1)}s`;
};

const PERIODS = [
  { label: "Hoje", days: 1 },
  { label: "7 dias", days: 7 },
  { label: "30 dias", days: 30 },
];

export default function LiveDecisionDiagnostics() {
  const [days, setDays] = useState(1);
  const [data, setData] = useState<Diag | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (d: number) => {
    setLoading(true);
    try {
      const { data: res, error } = await supabase.rpc("get_funnel_decision_diagnostics" as any, { p_days: d });
      if (!error && res) setData(res as any);
    } catch (e) {
      console.error("[Diagnostics] fetch error:", e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(days); }, [days, fetchData]);
  useEffect(() => {
    const t = setInterval(() => fetchData(days), 60_000);
    return () => clearInterval(t);
  }, [days, fetchData]);

  if (loading && !data) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-emerald-400 animate-spin" /></div>;
  }

  const steps = (data?.steps || []).slice().sort((a, b) => a.step_num - b.step_num);
  const maxViews = Math.max(1, ...steps.map(s => s.views));

  // Biggest leak between consecutive present steps
  let leak = { from: 0, to: 0, dropPct: 0, lostLabel: "" };
  for (let i = 1; i < steps.length; i++) {
    const prev = steps[i - 1], cur = steps[i];
    const drop = pct(prev.views - cur.views, prev.views);
    if (drop > leak.dropPct) {
      leak = { from: prev.step_num, to: cur.step_num, dropPct: drop, lostLabel: `${STEP_LABELS[prev.step_num] || prev.step} → ${STEP_LABELS[cur.step_num] || cur.step}` };
    }
  }

  const reached = data?.reached_step17 || 0;
  const saw = data?.saw_button || 0;
  const clicked = data?.clicked_button || 0;
  const bought = data?.front_sales || 0;
  const visitors = data?.visitors || 0;

  const viewRate = pct(saw, reached);      // % de quem chega na oferta que VÊ o botão
  const ctr = pct(clicked, saw);           // % de quem vê que CLICA
  const closeRate = pct(bought, clicked);  // % de quem clica que COMPRA
  const rpv = visitors > 0 ? (data?.revenue || 0) / visitors : 0;

  // VSL — curva de abandono por minuto
  const vsl = (data?.vsl_curve || []).slice().sort((a, b) => a.minute - b.minute);
  const vslMax = Math.max(1, ...vsl.map(v => v.sessions));
  const vslStart = vsl[0]?.sessions || 0;

  // Melhores horários
  const hours = (data?.hourly || []).slice().sort((a, b) => a.hour - b.hour);
  const hourMax = Math.max(1, ...hours.map(h => h.reached));
  const bestHour = hours.slice().sort((a, b) => (b.sales - a.sales) || (b.clicks - a.clicks) || (b.reached - a.reached))[0];

  // Persona — agrupa respostas por etapa
  const personaSteps = ["step-2", "step-5", "step-6", "step-7"];
  const personaByStep = personaSteps
    .map(st => ({ step: st, label: PERSONA_LABELS[st] || st, rows: (data?.persona || []).filter(p => p.step === st).sort((a, b) => b.count - a.count) }))
    .filter(g => g.rows.length > 0);

  // Auto verdict
  const verdicts: { icon: any; color: string; text: string }[] = [];
  if (leak.dropPct >= 40 && leak.from >= 2) {
    verdicts.push({ icon: AlertTriangle, color: "text-red-400", text: `Maior gargalo do quiz: ${leak.lostLabel} — perde ${fmtPct(leak.dropPct)} das pessoas aí. Revise a copy/pergunta dessa etapa.` });
  }
  if (reached > 0 && viewRate < 50) {
    verdicts.push({ icon: Film, color: "text-amber-400", text: `Só ${fmtPct(viewRate)} de quem chega na oferta chega a VER o botão (8:20 da VSL). A VSL pode estar longa demais / com abandono — considere revelar o botão antes ou encurtar o vídeo.` });
  }
  if (saw > 0 && ctr < 30) {
    verdicts.push({ icon: MousePointerClick, color: "text-amber-400", text: `Dos que veem o botão, só ${fmtPct(ctr)} clicam. A oferta/copy do botão pode não estar convencendo — teste texto, preço ou prova social no momento do CTA.` });
  }
  if (clicked > 0 && closeRate < 20) {
    verdicts.push({ icon: ShoppingCart, color: "text-amber-400", text: `${fmtPct(closeRate)} de quem clica realmente compra. Verifique o checkout (Kirvano): preço, fricção, meios de pagamento.` });
  }
  if (bestHour && (bestHour.clicks > 0 || bestHour.sales > 0)) {
    verdicts.push({ icon: Clock, color: "text-sky-400", text: `Melhor horário até agora: ${String(bestHour.hour).padStart(2, "0")}h (mais cliques/vendas). Concentre budget de anúncio e postagens nesse pico.` });
  }
  if (verdicts.length === 0) {
    verdicts.push({ icon: Trophy, color: "text-emerald-400", text: "Sem gargalo crítico evidente no período. Continue monitorando e escale o que converte." });
  }

  const kpis = [
    { label: "Visitantes", value: visitors, icon: Users, color: "text-white", sub: null },
    { label: "Chegaram na Oferta", value: reached, icon: Target, color: "text-sky-400", sub: `${fmtPct(pct(reached, visitors))} dos visitantes` },
    { label: "Viram o Botão", value: saw, icon: Eye, color: "text-violet-400", sub: `${fmtPct(viewRate)} de quem chegou` },
    { label: "Clicaram no Botão", value: clicked, icon: MousePointerClick, color: "text-amber-400", sub: `CTR ${fmtPct(ctr)}` },
    { label: "Compraram", value: bought, icon: ShoppingCart, color: "text-emerald-400", sub: `${fmtPct(closeRate)} de quem clicou` },
  ];

  return (
    <div className="space-y-4">
      {/* Header + period */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-white">Diagnóstico de Decisão</h3>
          <span className="text-[11px] text-[#888]">— onde o funil perde e se clicam na oferta</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-0.5">
            {PERIODS.map(p => (
              <button key={p.days} onClick={() => setDays(p.days)}
                className={cn("px-2.5 py-1 rounded-md text-xs transition-colors",
                  days === p.days ? "bg-emerald-500/20 text-emerald-400 font-semibold" : "text-[#888] hover:text-white")}>
                {p.label}
              </button>
            ))}
          </div>
          <button onClick={() => fetchData(days)} className="p-1.5 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-[#888] hover:text-white">
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* KPIs / conversão da oferta */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {kpis.map((k, i) => (
          <div key={i} className="rounded-xl bg-[#111] border border-[#2a2a2a] p-3">
            <div className="flex items-center gap-1.5 mb-1"><k.icon className={cn("w-3.5 h-3.5", k.color)} /><span className="text-[10px] text-[#888] uppercase tracking-wide">{k.label}</span></div>
            <div className={cn("text-2xl font-black tabular-nums", k.color)}>{k.value.toLocaleString("pt-BR")}</div>
            {k.sub && <div className="text-[10px] text-[#666] mt-0.5">{k.sub}</div>}
          </div>
        ))}
      </div>

      {/* Diagnóstico do botão de oferta (mini-funil) */}
      <div className="rounded-xl bg-[#111] border border-[#2a2a2a] p-4">
        <div className="flex items-center gap-2 mb-3"><MousePointerClick className="w-4 h-4 text-amber-400" /><h4 className="text-xs font-bold text-white">Botão da Oferta (Step-17 / VSL)</h4></div>
        <div className="flex items-stretch gap-1">
          {[
            { label: "Chegou na oferta", v: reached, base: reached, color: "bg-sky-500/70" },
            { label: "Viu o botão (8:20)", v: saw, base: reached, color: "bg-violet-500/70", rate: viewRate, rateLabel: "viram" },
            { label: "Clicou", v: clicked, base: saw, color: "bg-amber-500/70", rate: ctr, rateLabel: "CTR" },
            { label: "Comprou", v: bought, base: clicked, color: "bg-emerald-500/70", rate: closeRate, rateLabel: "fecharam" },
          ].map((s, i) => (
            <div key={i} className="flex-1 min-w-0">
              <div className="h-16 rounded-lg bg-[#0a0a0a] border border-[#2a2a2a] flex flex-col items-center justify-center relative overflow-hidden">
                <div className={cn("absolute bottom-0 left-0 right-0", s.color)} style={{ height: `${Math.max(6, pct(s.v, Math.max(1, reached)))}%` }} />
                <span className="relative text-lg font-black text-white tabular-nums">{s.v}</span>
              </div>
              <div className="text-center mt-1">
                <div className="text-[9px] text-[#888] leading-tight">{s.label}</div>
                {s.rate !== undefined && <div className="text-[10px] font-bold text-amber-400">{fmtPct(s.rate)} {s.rateLabel}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Funil passo-a-passo */}
      <div className="rounded-xl bg-[#111] border border-[#2a2a2a] p-4">
        <div className="flex items-center gap-2 mb-3"><TrendingDown className="w-4 h-4 text-red-400" /><h4 className="text-xs font-bold text-white">Retenção por Etapa do Quiz</h4></div>
        <div className="space-y-1.5">
          {steps.map((s, i) => {
            const prev = i > 0 ? steps[i - 1] : null;
            const drop = prev ? pct(prev.views - s.views, prev.views) : 0;
            const isLeak = prev && s.step_num === leak.to && steps[i - 1].step_num === leak.from && leak.dropPct > 0;
            return (
              <div key={s.step} className="flex items-center gap-2">
                <div className="w-24 shrink-0 text-[10px] text-[#aaa] truncate">
                  <span className="text-[#666] tabular-nums">{s.step_num}.</span> {STEP_LABELS[s.step_num] || s.step}
                </div>
                <div className="flex-1 h-6 rounded bg-[#0a0a0a] border border-[#2a2a2a] relative overflow-hidden">
                  <div className={cn("h-full rounded", isLeak ? "bg-red-500/40" : "bg-emerald-500/30")} style={{ width: `${pct(s.views, maxViews)}%` }} />
                  <span className="absolute inset-y-0 left-2 flex items-center text-[10px] font-bold text-white tabular-nums">{s.views}</span>
                  <span className="absolute inset-y-0 right-2 flex items-center text-[9px] text-[#777]">{fmtTime(s.avg_time_ms)}</span>
                </div>
                <div className="w-16 shrink-0 text-right">
                  {prev && drop > 0 && (
                    <span className={cn("text-[10px] font-bold tabular-nums", isLeak ? "text-red-400" : drop > 25 ? "text-amber-400" : "text-[#666]")}>
                      {isLeak && <AlertTriangle className="w-3 h-3 inline mr-0.5 -mt-0.5" />}-{drop.toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="text-[9px] text-[#555] mt-2">Barras = sessões únicas que viram cada etapa. Direita = tempo médio na etapa. Etapas 10–12 podem faltar (puladas na versão V2 do quiz).</div>
      </div>

      {/* VSL — curva de abandono por minuto */}
      <div className="rounded-xl bg-[#111] border border-[#2a2a2a] p-4">
        <div className="flex items-center gap-2 mb-3"><Film className="w-4 h-4 text-violet-400" /><h4 className="text-xs font-bold text-white">Abandono da VSL — em que minuto as pessoas saem</h4></div>
        {vsl.length === 0 ? (
          <div className="text-[11px] text-[#777] py-3">Coletando dados… a curva aparece conforme entra tráfego novo no vídeo (marcos por minuto). O botão libera em <span className="text-violet-400 font-bold">8:20</span>.</div>
        ) : (
          <>
            <div className="flex items-end gap-1 h-28">
              {vsl.map((v) => {
                const retained = pct(v.sessions, vslStart);
                const isUnlock = v.minute === 8;
                return (
                  <div key={v.minute} className="flex-1 flex flex-col items-center justify-end h-full">
                    <span className="text-[9px] text-[#888] tabular-nums mb-0.5">{v.sessions}</span>
                    <div className={cn("w-full rounded-t", isUnlock ? "bg-amber-500/70" : "bg-violet-500/50")} style={{ height: `${Math.max(4, pct(v.sessions, vslMax))}%` }} title={`Min ${v.minute}: ${v.sessions} (${retained.toFixed(0)}%)`} />
                    <span className={cn("text-[9px] tabular-nums mt-0.5", isUnlock ? "text-amber-400 font-bold" : "text-[#666]")}>{v.minute}′</span>
                  </div>
                );
              })}
            </div>
            <div className="text-[9px] text-[#555] mt-2">Sessões que ainda estavam vendo em cada minuto. Barra amarela = 8′ (perto de liberar o botão às 8:20). Onde a curva despenca é onde você perde a venda — encurte/ajuste o vídeo ali.</div>
          </>
        )}
      </div>

      {/* Melhores horários */}
      <div className="rounded-xl bg-[#111] border border-[#2a2a2a] p-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-sky-400" /><h4 className="text-xs font-bold text-white">Melhores Horários (chegou na oferta · clicou · vendeu)</h4>
          {bestHour && (bestHour.sales > 0 || bestHour.clicks > 0) && (
            <span className="ml-auto text-[10px] text-emerald-400 font-bold">🏆 pico: {String(bestHour.hour).padStart(2, "0")}h</span>
          )}
        </div>
        {hours.length === 0 ? (
          <div className="text-[11px] text-[#777] py-3">Sem dados de horário no período.</div>
        ) : (
          <div className="flex items-end gap-1 h-24">
            {hours.map((h) => (
              <div key={h.hour} className="flex-1 flex flex-col items-center justify-end h-full min-w-0">
                <div className="w-full flex flex-col justify-end h-full gap-0.5">
                  {h.sales > 0 && <div className="w-full bg-emerald-500/80 rounded-sm" style={{ height: `${pct(h.sales, hourMax) || 8}%` }} title={`${h.sales} vendas`} />}
                  <div className="w-full bg-amber-500/60 rounded-sm" style={{ height: `${pct(h.clicks, hourMax)}%` }} title={`${h.clicks} cliques`} />
                  <div className="w-full bg-sky-500/40 rounded-sm" style={{ height: `${pct(h.reached, hourMax)}%` }} title={`${h.reached} chegaram`} />
                </div>
                <span className="text-[8px] text-[#666] tabular-nums mt-0.5">{h.hour}</span>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center gap-3 mt-2 text-[9px] text-[#777]">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-sky-500/40" />chegou</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-amber-500/60" />clicou</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-500/80" />vendeu</span>
        </div>
      </div>

      {/* Persona — respostas do quiz */}
      {personaByStep.length > 0 && (
        <div className="rounded-xl bg-[#111] border border-[#2a2a2a] p-4">
          <div className="flex items-center gap-2 mb-3"><Users className="w-4 h-4 text-emerald-400" /><h4 className="text-xs font-bold text-white">Persona — quem está entrando no funil</h4></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {personaByStep.map((g) => {
              const total = g.rows.reduce((a, r) => a + r.count, 0) || 1;
              return (
                <div key={g.step} className="rounded-lg bg-[#0a0a0a] border border-[#2a2a2a] p-3">
                  <div className="text-[11px] font-bold text-[#ccc] mb-2">{g.label}</div>
                  <div className="space-y-1.5">
                    {g.rows.slice(0, 6).map((r, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-28 shrink-0 text-[10px] text-[#aaa] truncate">{r.answer}</div>
                        <div className="flex-1 h-3.5 rounded bg-[#111] overflow-hidden"><div className="h-full bg-emerald-500/40 rounded" style={{ width: `${pct(r.count, total)}%` }} /></div>
                        <div className="w-10 shrink-0 text-right text-[10px] font-bold text-emerald-400 tabular-nums">{fmtPct(pct(r.count, total))}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="text-[9px] text-[#555] mt-2">Distribuição das respostas no período — use pra alinhar copy/oferta com a persona real (idade, dor, meta).</div>
        </div>
      )}

      {/* Veredito / recomendações */}
      <div className="rounded-xl bg-gradient-to-br from-emerald-500/5 to-transparent border border-emerald-500/20 p-4">
        <div className="flex items-center gap-2 mb-2"><Lightbulb className="w-4 h-4 text-emerald-400" /><h4 className="text-xs font-bold text-white">Veredito & Onde Agir</h4></div>
        <div className="space-y-2">
          {verdicts.map((v, i) => (
            <div key={i} className="flex items-start gap-2">
              <v.icon className={cn("w-4 h-4 shrink-0 mt-0.5", v.color)} />
              <p className="text-[11px] text-[#ccc] leading-snug">{v.text}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-[#2a2a2a] flex items-center justify-between text-[11px]">
          <span className="text-[#888]"><Flag className="w-3 h-3 inline mr-1 text-emerald-400" />RPV (receita por visitante)</span>
          <span className="font-black text-emerald-400">R$ {rpv.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
