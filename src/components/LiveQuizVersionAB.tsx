import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  FlaskConical, TrendingUp, TrendingDown, Users, ShoppingCart,
  DollarSign, Target, ArrowRight, Clock, BarChart3, Minus,
  CheckCircle2, AlertTriangle, Loader2, Eye, Zap
} from "lucide-react";

interface VersionData {
  version: string;
  visitors: number;
  cta_clicks: number;
  quiz_complete: number;
  checkouts: number;
  front_sales: number;
  front_revenue: number;
  upsell_sales: number;
  upsell_revenue: number;
  total_sales: number;
  total_revenue: number;
}

interface StepFunnel {
  version: string;
  step: string;
  views: number;
  completions: number;
  avg_time_ms: number;
}

interface AnswerDist {
  version: string;
  step: string;
  answer: string;
  count: number;
}

const STEP_LABELS: Record<string, string> = {
  "step-1": "Intro", "step-2": "Idade", "step-3": "Nome",
  "step-4": "Prova Social", "step-5": "Tentou Online", "step-6": "Meta Renda",
  "step-7": "Obstáculo", "step-8": "Vídeo Mentor", "step-9": "Saldo Conta",
  "step-10": "Disponibilidade", "step-11": "Demo Plataforma", "step-12": "WhatsApp Proof",
  "step-13": "Método Contato", "step-14": "Input Contato", "step-15": "Loading",
  "step-16": "Projeção Perfil", "step-17": "Oferta Final",
};

const V2_REMOVED = ["step-10", "step-11", "step-12"];

const pct = (num: number, den: number) => den > 0 ? ((num / den) * 100).toFixed(1) : "0.0";
const rpv = (rev: number, visitors: number) => visitors > 0 ? (rev / visitors).toFixed(2) : "0.00";
const fmtBRL = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const StatCard = ({ label, v1, v2, format = "number", higherIsBetter = true }: {
  label: string; v1: number; v2: number; format?: "number" | "pct" | "brl" | "rpv"; higherIsBetter?: boolean;
}) => {
  const diff = v2 - v1;
  const diffPct = v1 > 0 ? ((diff / v1) * 100).toFixed(1) : v2 > 0 ? "+∞" : "0.0";
  const isPositive = higherIsBetter ? diff > 0 : diff < 0;
  const isNeutral = diff === 0;

  const fmt = (v: number) => {
    if (format === "pct") return `${v.toFixed(1)}%`;
    if (format === "brl") return fmtBRL(v);
    if (format === "rpv") return fmtBRL(v);
    return v.toLocaleString("pt-BR");
  };

  return (
    <div className="rounded-xl p-3 bg-[#141414] border border-[#2a2a2a]">
      <p className="text-[10px] text-[#666] font-medium mb-2 uppercase tracking-wider">{label}</p>
      <div className="flex items-end justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge className="text-[9px] bg-[#2a2a2a] text-[#888] border-0 px-1.5">V1</Badge>
            <span className="text-sm text-white/70 tabular-nums">{fmt(v1)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="text-[9px] bg-emerald-500/20 text-emerald-400 border-0 px-1.5">V2</Badge>
            <span className="text-sm text-white font-semibold tabular-nums">{fmt(v2)}</span>
          </div>
        </div>
        {!isNeutral && (
          <div className={cn("flex items-center gap-0.5 text-[11px] font-medium tabular-nums",
            isPositive ? "text-emerald-400" : "text-red-400"
          )}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {typeof diffPct === "string" ? diffPct : `${diffPct}%`}
          </div>
        )}
        {isNeutral && <Minus className="w-3 h-3 text-[#444]" />}
      </div>
    </div>
  );
};

export default function LiveQuizVersionAB() {
  const [data, setData] = useState<{
    versions: VersionData[];
    step_funnel: StepFunnel[];
    answer_distribution: AnswerDist[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: result } = await supabase.rpc("get_quiz_version_ab_today" as any);
      if (result) setData(result as any);
    } catch (e) {
      console.error("Quiz Version AB fetch error:", e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    const interval = setInterval(fetchData, 60_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
      </div>
    );
  }

  const v1 = data?.versions?.find(v => v.version === "V1") || {
    version: "V1", visitors: 0, cta_clicks: 0, quiz_complete: 0, checkouts: 0,
    front_sales: 0, front_revenue: 0, upsell_sales: 0, upsell_revenue: 0, total_sales: 0, total_revenue: 0,
  };
  const v2 = data?.versions?.find(v => v.version === "V2") || {
    version: "V2", visitors: 0, cta_clicks: 0, quiz_complete: 0, checkouts: 0,
    front_sales: 0, front_revenue: 0, upsell_sales: 0, upsell_revenue: 0, total_sales: 0, total_revenue: 0,
  };

  const v1RPV = v1.visitors > 0 ? v1.total_revenue / v1.visitors : 0;
  const v2RPV = v2.visitors > 0 ? v2.total_revenue / v2.visitors : 0;
  const v1ConvRate = v1.visitors > 0 ? (v1.front_sales / v1.visitors) * 100 : 0;
  const v2ConvRate = v2.visitors > 0 ? (v2.front_sales / v2.visitors) * 100 : 0;
  const v1ICRate = v1.visitors > 0 ? (v1.checkouts / v1.visitors) * 100 : 0;
  const v2ICRate = v2.visitors > 0 ? (v2.checkouts / v2.visitors) * 100 : 0;
  const v1QuizRate = v1.visitors > 0 ? (v1.quiz_complete / v1.visitors) * 100 : 0;
  const v2QuizRate = v2.visitors > 0 ? (v2.quiz_complete / v2.visitors) * 100 : 0;
  const v1CTARate = v1.visitors > 0 ? (v1.cta_clicks / v1.visitors) * 100 : 0;
  const v2CTARate = v2.visitors > 0 ? (v2.cta_clicks / v2.visitors) * 100 : 0;
  const v1UpsellRate = v1.front_sales > 0 ? (v1.upsell_sales / v1.front_sales) * 100 : 0;
  const v2UpsellRate = v2.front_sales > 0 ? (v2.upsell_sales / v2.front_sales) * 100 : 0;
  const v1TicketAvg = v1.total_sales > 0 ? v1.total_revenue / v1.total_sales : 0;
  const v2TicketAvg = v2.total_sales > 0 ? v2.total_revenue / v2.total_sales : 0;

  // Minimum sample for confidence
  const minSample = 100;
  const totalVisitors = v1.visitors + v2.visitors;
  const hasEnoughData = v1.visitors >= minSample && v2.visitors >= minSample;

  // Simple winner detection
  const rpvWinner = v1RPV > v2RPV ? "V1" : v2RPV > v1RPV ? "V2" : null;
  const convWinner = v1ConvRate > v2ConvRate ? "V1" : v2ConvRate > v1ConvRate ? "V2" : null;

  // Step funnel data
  const v1Steps = (data?.step_funnel || []).filter(s => s.version === "V1");
  const v2Steps = (data?.step_funnel || []).filter(s => s.version === "V2");
  const allStepSlugs = Array.from(new Set([...v1Steps.map(s => s.step), ...v2Steps.map(s => s.step)]))
    .sort((a, b) => {
      const numA = parseInt(a.replace("step-", ""));
      const numB = parseInt(b.replace("step-", ""));
      return numA - numB;
    });

  // Answer distribution
  const v1Answers = (data?.answer_distribution || []).filter(a => a.version === "V1");
  const v2Answers = (data?.answer_distribution || []).filter(a => a.version === "V2");

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-xl bg-gradient-to-r from-violet-500/10 to-emerald-500/10 border border-violet-500/20 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-violet-500/20 border border-violet-500/30">
            <FlaskConical className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Teste Quiz V1 vs V2</h2>
            <p className="text-[11px] text-[#888]">
              V1: Original (17 etapas) • V2: Otimizado (14 etapas, -3 steps, respostas melhoradas)
            </p>
          </div>
        </div>

        {/* Confidence banner */}
        <div className={cn("flex items-center gap-2 px-3 py-2 rounded-lg text-[11px]",
          hasEnoughData
            ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
            : "bg-amber-500/10 border border-amber-500/20 text-amber-400"
        )}>
          {hasEnoughData ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
          {hasEnoughData
            ? `Dados suficientes para decisão (${totalVisitors} sessões, ${v1.visitors} V1 + ${v2.visitors} V2)`
            : `Coletando dados... ${totalVisitors} de ${minSample * 2} sessões necessárias (${v1.visitors} V1 + ${v2.visitors} V2)`
          }
        </div>
      </div>

      {/* Main KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="RPV (Receita/Visitante)" v1={v1RPV} v2={v2RPV} format="rpv" />
        <StatCard label="Conversão Front" v1={v1ConvRate} v2={v2ConvRate} format="pct" />
        <StatCard label="Taxa IC" v1={v1ICRate} v2={v2ICRate} format="pct" />
        <StatCard label="Receita Total" v1={v1.total_revenue} v2={v2.total_revenue} format="brl" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Visitantes" v1={v1.visitors} v2={v2.visitors} />
        <StatCard label="CTA Rate" v1={v1CTARate} v2={v2CTARate} format="pct" />
        <StatCard label="Quiz Completo %" v1={v1QuizRate} v2={v2QuizRate} format="pct" />
        <StatCard label="Ticket Médio" v1={v1TicketAvg} v2={v2TicketAvg} format="brl" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Vendas Front" v1={v1.front_sales} v2={v2.front_sales} />
        <StatCard label="Receita Front" v1={v1.front_revenue} v2={v2.front_revenue} format="brl" />
        <StatCard label="Upsell Take Rate" v1={v1UpsellRate} v2={v2UpsellRate} format="pct" />
        <StatCard label="Receita Upsell" v1={v1.upsell_revenue} v2={v2.upsell_revenue} format="brl" />
      </div>

      {/* Verdict */}
      {hasEnoughData && (rpvWinner || convWinner) && (
        <div className="rounded-xl p-4 bg-gradient-to-r from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-emerald-400">Diagnóstico</h3>
          </div>
          <div className="space-y-1 text-[12px] text-white/80">
            {rpvWinner && (
              <p>• RPV: <span className="font-bold text-emerald-400">{rpvWinner}</span> está gerando{" "}
                {fmtBRL(Math.abs(v2RPV - v1RPV))} {rpvWinner === "V2" ? "a mais" : "a menos"} por visitante
              </p>
            )}
            {convWinner && (
              <p>• Conversão: <span className="font-bold text-emerald-400">{convWinner}</span> converte{" "}
                {Math.abs(v2ConvRate - v1ConvRate).toFixed(1)}pp {convWinner === "V2" ? "a mais" : "a menos"}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Step-by-step funnel comparison */}
      <div className="rounded-xl bg-[#141414] border border-[#2a2a2a] p-4">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-4 h-4 text-violet-400" />
          <h3 className="text-sm font-bold text-white">Funil por Etapa (V1 vs V2)</h3>
        </div>
        <div className="space-y-1">
          {/* Header */}
          <div className="grid grid-cols-[1fr_80px_80px_80px_80px_80px_80px] gap-1 text-[9px] text-[#555] font-medium px-2 py-1">
            <span>Etapa</span>
            <span className="text-center">Views V1</span>
            <span className="text-center">Views V2</span>
            <span className="text-center">Drop V1</span>
            <span className="text-center">Drop V2</span>
            <span className="text-center">Tempo V1</span>
            <span className="text-center">Tempo V2</span>
          </div>
          {allStepSlugs.map((slug) => {
            const s1 = v1Steps.find(s => s.step === slug);
            const s2 = v2Steps.find(s => s.step === slug);
            const isRemoved = V2_REMOVED.includes(slug);
            const dropV1 = s1 && s1.views > 0 ? ((1 - s1.completions / s1.views) * 100).toFixed(1) : "-";
            const dropV2 = s2 && s2.views > 0 ? ((1 - s2.completions / s2.views) * 100).toFixed(1) : "-";
            const timeV1 = s1 ? `${(s1.avg_time_ms / 1000).toFixed(1)}s` : "-";
            const timeV2 = s2 ? `${(s2.avg_time_ms / 1000).toFixed(1)}s` : "-";

            return (
              <div key={slug} className={cn(
                "grid grid-cols-[1fr_80px_80px_80px_80px_80px_80px] gap-1 px-2 py-1.5 rounded-lg text-[11px]",
                isRemoved ? "bg-red-500/5 border border-red-500/10" : "hover:bg-[#1a1a1a]"
              )}>
                <div className="flex items-center gap-2 min-w-0">
                  <span className={cn("truncate", isRemoved ? "text-red-400/60 line-through" : "text-white/80")}>
                    {STEP_LABELS[slug] || slug}
                  </span>
                  {isRemoved && <Badge className="text-[8px] bg-red-500/20 text-red-400 border-0 px-1 flex-shrink-0">Removido V2</Badge>}
                </div>
                <span className="text-center text-white/60 tabular-nums">{s1?.views ?? 0}</span>
                <span className="text-center text-white/60 tabular-nums">{isRemoved ? "-" : (s2?.views ?? 0)}</span>
                <span className={cn("text-center tabular-nums",
                  dropV1 !== "-" && parseFloat(dropV1) > 30 ? "text-red-400" : "text-white/60"
                )}>{dropV1}{dropV1 !== "-" ? "%" : ""}</span>
                <span className={cn("text-center tabular-nums",
                  dropV2 !== "-" && parseFloat(dropV2) > 30 ? "text-red-400" : "text-white/60"
                )}>{isRemoved ? "-" : `${dropV2}${dropV2 !== "-" ? "%" : ""}`}</span>
                <span className="text-center text-[#666] tabular-nums">{timeV1}</span>
                <span className="text-center text-[#666] tabular-nums">{isRemoved ? "-" : timeV2}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Answer distribution for changed steps */}
      {(v1Answers.length > 0 || v2Answers.length > 0) && (
        <div className="rounded-xl bg-[#141414] border border-[#2a2a2a] p-4">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Distribuição de Respostas (Steps Modificados)</h3>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {["step-5", "step-7"].map((stepSlug) => {
              const s5v1 = v1Answers.filter(a => a.step === stepSlug);
              const s5v2 = v2Answers.filter(a => a.step === stepSlug);
              if (s5v1.length === 0 && s5v2.length === 0) return null;
              const totalV1 = s5v1.reduce((s, a) => s + a.count, 0);
              const totalV2 = s5v2.reduce((s, a) => s + a.count, 0);

              return (
                <div key={stepSlug} className="rounded-lg bg-[#0d0d0d] border border-[#222] p-3">
                  <p className="text-xs font-medium text-white/80 mb-2">{STEP_LABELS[stepSlug] || stepSlug}</p>
                  <div className="space-y-2">
                    <div>
                      <p className="text-[9px] text-[#555] mb-1">V1 (Original)</p>
                      {s5v1.map(a => (
                        <div key={a.answer} className="flex items-center gap-2 mb-1">
                          <div className="flex-1 h-4 bg-[#1a1a1a] rounded-full overflow-hidden">
                            <div className="h-full bg-[#333] rounded-full" style={{ width: `${totalV1 > 0 ? (a.count / totalV1) * 100 : 0}%` }} />
                          </div>
                          <span className="text-[10px] text-[#888] tabular-nums w-16 text-right">{a.answer} ({a.count})</span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <p className="text-[9px] text-emerald-400/60 mb-1">V2 (Otimizado)</p>
                      {s5v2.map(a => (
                        <div key={a.answer} className="flex items-center gap-2 mb-1">
                          <div className="flex-1 h-4 bg-[#1a1a1a] rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500/30 rounded-full" style={{ width: `${totalV2 > 0 ? (a.count / totalV2) * 100 : 0}%` }} />
                          </div>
                          <span className="text-[10px] text-emerald-400/80 tabular-nums w-16 text-right">{a.answer} ({a.count})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Changes summary */}
      <div className="rounded-xl bg-[#141414] border border-[#2a2a2a] p-4">
        <div className="flex items-center gap-2 mb-3">
          <Eye className="w-4 h-4 text-sky-400" />
          <h3 className="text-sm font-bold text-white">Mudanças no V2</h3>
        </div>
        <div className="space-y-2 text-[12px] text-white/70">
          <div className="flex items-start gap-2">
            <Badge className="text-[9px] bg-red-500/20 text-red-400 border-0 mt-0.5">Removido</Badge>
            <span>Step 10 (Disponibilidade "Sim/Não") — dado inútil, não acionava nenhuma lógica</span>
          </div>
          <div className="flex items-start gap-2">
            <Badge className="text-[9px] bg-red-500/20 text-red-400 border-0 mt-0.5">Removido</Badge>
            <span>Step 11 (Demo Plataforma) — componente pesado de 595 linhas, movido para VSL</span>
          </div>
          <div className="flex items-start gap-2">
            <Badge className="text-[9px] bg-red-500/20 text-red-400 border-0 mt-0.5">Removido</Badge>
            <span>Step 12 (WhatsApp Proof) — redundante com Step 4 (prova social vídeo)</span>
          </div>
          <div className="flex items-start gap-2">
            <Badge className="text-[9px] bg-amber-500/20 text-amber-400 border-0 mt-0.5">Alterado</Badge>
            <span>Step 5: "Sim, tenho experiência" → "Sim, mas caí em golpe" | "Nunca tentei" → "Tenho medo de tecnologia"</span>
          </div>
          <div className="flex items-start gap-2">
            <Badge className="text-[9px] bg-amber-500/20 text-amber-400 border-0 mt-0.5">Alterado</Badge>
            <span>Step 7: "Falta de tempo" → "Já fui enganado antes"</span>
          </div>
        </div>
      </div>
    </div>
  );
}
