import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  FlaskConical, TrendingUp, TrendingDown, Users, ShoppingCart,
  DollarSign, Target, ArrowRight, Clock, BarChart3, Minus,
  CheckCircle2, AlertTriangle, Loader2, Eye, Zap, Power,
  Trophy, Settings2, ToggleLeft, ToggleRight, ArrowUpRight,
  ArrowDownRight, X, Sparkles, GitCompare
} from "lucide-react";
import {
  getV2Split, setV2Split, isTestActive, setTestActive,
  getDeclaredWinner, declareVersionWinner, clearVersionWinner
} from "@/lib/quizVersionAB";

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

const fmtBRL = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtPct = (v: number) => `${v.toFixed(1)}%`;
const fmtNum = (v: number) => v.toLocaleString("pt-BR");

// ── Big KPI Card ──
const BigKPI = ({ label, v1, v2, format, icon: Icon, highlight }: {
  label: string; v1: number; v2: number;
  format: "brl" | "pct" | "number";
  icon: React.ElementType;
  highlight?: boolean;
}) => {
  const fmt = (v: number) => format === "brl" ? fmtBRL(v) : format === "pct" ? fmtPct(v) : fmtNum(v);
  const diff = v2 - v1;
  const diffPct = v1 > 0 ? (diff / v1) * 100 : v2 > 0 ? 100 : 0;
  const isPositive = diff > 0;
  const isNeutral = diff === 0;

  return (
    <div className={cn(
      "rounded-xl p-3 sm:p-4 border transition-all",
      highlight
        ? "bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20"
        : "bg-card/50 border-border/50"
    )}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-[10px] sm:text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{label}</span>
      </div>
      
      {/* V1 vs V2 side by side */}
      <div className="flex items-end justify-between gap-2">
        <div className="space-y-1.5 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-medium text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">V1</span>
            <span className="text-sm text-foreground/70 tabular-nums truncate">{fmt(v1)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-medium text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">V2</span>
            <span className="text-base sm:text-lg font-bold text-foreground tabular-nums truncate">{fmt(v2)}</span>
          </div>
        </div>
        
        {/* Delta badge */}
        <div className={cn(
          "flex flex-col items-center justify-center rounded-lg px-2 py-1.5 min-w-[48px]",
          isNeutral ? "bg-muted/30" : isPositive ? "bg-emerald-500/10" : "bg-red-500/10"
        )}>
          {isNeutral ? (
            <Minus className="w-3.5 h-3.5 text-muted-foreground" />
          ) : (
            <>
              {isPositive
                ? <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                : <ArrowDownRight className="w-3.5 h-3.5 text-red-400" />
              }
              <span className={cn(
                "text-[11px] font-bold tabular-nums",
                isPositive ? "text-emerald-400" : "text-red-400"
              )}>
                {isPositive ? "+" : ""}{diffPct.toFixed(0)}%
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Step row for mobile-friendly funnel ──
const StepRow = ({ slug, s1, s2, isRemoved, prevV1Views, prevV2Views }: {
  slug: string;
  s1?: StepFunnel;
  s2?: StepFunnel;
  isRemoved: boolean;
  prevV1Views: number;
  prevV2Views: number;
}) => {
  const dropV1 = s1 && s1.views > 0 ? (1 - s1.completions / s1.views) * 100 : 0;
  const dropV2 = s2 && s2.views > 0 ? (1 - s2.completions / s2.views) * 100 : 0;
  const retV1 = prevV1Views > 0 && s1 ? (s1.views / prevV1Views) * 100 : (s1?.views ?? 0) > 0 ? 100 : 0;
  const retV2 = prevV2Views > 0 && s2 ? (s2.views / prevV2Views) * 100 : (s2?.views ?? 0) > 0 ? 100 : 0;
  const timeV1 = s1 ? (s1.avg_time_ms / 1000).toFixed(1) : "-";
  const timeV2 = s2 ? (s2.avg_time_ms / 1000).toFixed(1) : "-";
  const stepNum = slug.replace("step-", "");

  if (isRemoved) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/5 border border-red-500/10">
        <span className="text-[10px] text-red-400/60 font-mono w-5">{stepNum}</span>
        <span className="text-[11px] text-red-400/60 line-through flex-1 truncate">
          {STEP_LABELS[slug]}
        </span>
        <Badge className="text-[8px] bg-red-500/15 text-red-400 border-0 px-1.5 shrink-0">
          <X className="w-2.5 h-2.5 mr-0.5" />REMOVIDO
        </Badge>
      </div>
    );
  }

  const v1Better = dropV1 < dropV2;
  const v2Better = dropV2 < dropV1;

  return (
    <div className="px-3 py-2 rounded-lg hover:bg-muted/30 transition-colors">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-[10px] text-muted-foreground font-mono w-5">{stepNum}</span>
        <span className="text-[11px] sm:text-xs text-foreground/90 font-medium flex-1 truncate">
          {STEP_LABELS[slug]}
        </span>
        <span className="text-[9px] text-muted-foreground tabular-nums">
          {s1?.views ?? 0}/{isRemoved ? "-" : (s2?.views ?? 0)} views
        </span>
      </div>
      {/* Visual bar comparison */}
      <div className="flex gap-1.5 items-center">
        <span className="text-[8px] text-muted-foreground w-6 text-right shrink-0">V1</span>
        <div className="flex-1 h-3.5 bg-muted/30 rounded-full overflow-hidden relative">
          <div
            className={cn("h-full rounded-full transition-all", dropV1 > 40 ? "bg-red-500/50" : dropV1 > 20 ? "bg-amber-500/40" : "bg-foreground/20")}
            style={{ width: `${Math.max(2, 100 - dropV1)}%` }}
          />
          <span className="absolute inset-0 flex items-center justify-center text-[8px] font-medium text-foreground/60 tabular-nums">
            {s1 ? `${(100 - dropV1).toFixed(0)}% ret · ${timeV1}s` : "—"}
          </span>
        </div>
      </div>
      <div className="flex gap-1.5 items-center mt-0.5">
        <span className="text-[8px] text-emerald-400 w-6 text-right shrink-0">V2</span>
        <div className="flex-1 h-3.5 bg-emerald-500/5 rounded-full overflow-hidden relative">
          <div
            className={cn("h-full rounded-full transition-all", dropV2 > 40 ? "bg-red-500/50" : dropV2 > 20 ? "bg-amber-500/40" : "bg-emerald-500/25")}
            style={{ width: `${Math.max(2, 100 - dropV2)}%` }}
          />
          <span className="absolute inset-0 flex items-center justify-center text-[8px] font-medium text-emerald-400/60 tabular-nums">
            {s2 ? `${(100 - dropV2).toFixed(0)}% ret · ${timeV2}s` : "—"}
          </span>
        </div>
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
  const [active, setActiveState] = useState(isTestActive());
  const [split, setSplit] = useState(getV2Split());
  const [winner, setWinner] = useState(getDeclaredWinner());
  const [showControls, setShowControls] = useState(false);

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

  const handleToggleActive = () => {
    const newActive = !active;
    setTestActive(newActive);
    setActiveState(newActive);
    toast.success(newActive ? "Teste V1/V2 ativado!" : "Teste V1/V2 desativado — todo tráfego vai para V1.");
  };

  const handleSplitChange = (val: number[]) => {
    setSplit(val[0]);
    setV2Split(val[0]);
  };

  const handleDeclareWinner = (version: "V1" | "V2") => {
    declareVersionWinner(version);
    setWinner(version);
    setActiveState(false);
    toast.success(`${version} declarado vencedor! 100% do tráfego vai para ${version}.`);
  };

  const handleClearWinner = () => {
    clearVersionWinner();
    setWinner(null);
    setTestActive(true);
    setActiveState(true);
    toast.success("Vencedor removido. Teste reativado.");
  };

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

  const calc = (num: number, den: number) => den > 0 ? (num / den) * 100 : 0;
  const v1RPV = v1.visitors > 0 ? v1.total_revenue / v1.visitors : 0;
  const v2RPV = v2.visitors > 0 ? v2.total_revenue / v2.visitors : 0;
  const v1Conv = calc(v1.front_sales, v1.visitors);
  const v2Conv = calc(v2.front_sales, v2.visitors);
  const v1IC = calc(v1.checkouts, v1.visitors);
  const v2IC = calc(v2.checkouts, v2.visitors);
  const v1Quiz = calc(v1.quiz_complete, v1.visitors);
  const v2Quiz = calc(v2.quiz_complete, v2.visitors);
  const v1CTA = calc(v1.cta_clicks, v1.visitors);
  const v2CTA = calc(v2.cta_clicks, v2.visitors);
  const v1Upsell = calc(v1.upsell_sales, v1.front_sales);
  const v2Upsell = calc(v2.upsell_sales, v2.front_sales);
  const v1Ticket = v1.total_sales > 0 ? v1.total_revenue / v1.total_sales : 0;
  const v2Ticket = v2.total_sales > 0 ? v2.total_revenue / v2.total_sales : 0;

  const minSample = 100;
  const totalVisitors = v1.visitors + v2.visitors;
  const hasEnoughData = v1.visitors >= minSample && v2.visitors >= minSample;

  const v1Steps = (data?.step_funnel || []).filter(s => s.version === "V1");
  const v2Steps = (data?.step_funnel || []).filter(s => s.version === "V2");
  const QUIZ_STEPS = Array.from({ length: 17 }, (_, i) => `step-${i + 1}`);
  const allStepSlugs = QUIZ_STEPS.filter(slug =>
    v1Steps.some(s => s.step === slug) || v2Steps.some(s => s.step === slug) || V2_REMOVED.includes(slug)
  );

  const v1Answers = (data?.answer_distribution || []).filter(a => a.version === "V1");
  const v2Answers = (data?.answer_distribution || []).filter(a => a.version === "V2");

  // Build verdict
  const verdictItems: string[] = [];
  if (v2RPV > v1RPV && v1RPV > 0) verdictItems.push(`RPV +${((v2RPV - v1RPV) / v1RPV * 100).toFixed(0)}% (V2 gera ${fmtBRL(v2RPV - v1RPV)} a mais por visitante)`);
  else if (v1RPV > v2RPV && v2RPV > 0) verdictItems.push(`RPV -${((v1RPV - v2RPV) / v1RPV * 100).toFixed(0)}% (V1 gera ${fmtBRL(v1RPV - v2RPV)} a mais por visitante)`);
  if (v2Conv > v1Conv) verdictItems.push(`Conversão V2 ${(v2Conv - v1Conv).toFixed(1)}pp maior`);
  else if (v1Conv > v2Conv) verdictItems.push(`Conversão V1 ${(v1Conv - v2Conv).toFixed(1)}pp maior`);
  if (v2Quiz > v1Quiz) verdictItems.push(`Conclusão do quiz V2 ${(v2Quiz - v1Quiz).toFixed(1)}pp maior (menos etapas = menos abandono)`);

  return (
    <div className="space-y-4">
      {/* ═══ HEADER + STATUS ═══ */}
      <div className="rounded-xl bg-gradient-to-br from-violet-500/8 to-emerald-500/8 border border-violet-500/15 p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-lg bg-violet-500/15 border border-violet-500/20 shrink-0">
              <FlaskConical className="w-4 h-4 sm:w-5 sm:h-5 text-violet-400" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-foreground">Teste V1 vs V2</h2>
              <p className="text-[10px] text-muted-foreground truncate">
                V1: 17 etapas • V2: 14 etapas (otimizado)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {winner && (
              <Badge className="text-[9px] bg-amber-500/15 text-amber-400 border-0 px-1.5">
                <Trophy className="w-3 h-3 mr-0.5" />{winner}
              </Badge>
            )}
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[10px] border-border/50 bg-card/50 hover:bg-card text-foreground px-2"
              onClick={() => setShowControls(!showControls)}
            >
              <Settings2 className="w-3 h-3 mr-1" />
              {showControls ? "Fechar" : "Controles"}
            </Button>
          </div>
        </div>

        {/* Controls panel */}
        {showControls && (
          <div className="mt-2 p-3 rounded-lg bg-background/80 border border-border/50 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground">Status</p>
                <p className="text-[10px] text-muted-foreground">
                  {winner ? `Vencedor: ${winner} — 100% tráfego` : active ? "Ativo — dividindo tráfego" : "Inativo — 100% V1"}
                </p>
              </div>
              {!winner ? (
                <Button
                  size="sm"
                  variant="outline"
                  className={cn("h-7 text-[10px] gap-1 shrink-0",
                    active
                      ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20"
                      : "bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20"
                  )}
                  onClick={handleToggleActive}
                >
                  {active ? <><ToggleRight className="w-3.5 h-3.5" />Ativo</> : <><ToggleLeft className="w-3.5 h-3.5" />Off</>}
                </Button>
              ) : (
                <Button size="sm" variant="outline" className="h-7 text-[10px] border-amber-500/20 text-amber-400" onClick={handleClearWinner}>
                  Reativar
                </Button>
              )}
            </div>

            {!winner && active && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-foreground font-medium">Tráfego V2</span>
                  <div className="flex gap-1.5">
                    <Badge className="bg-muted/50 text-muted-foreground border-0 text-[9px]">V1: {100 - split}%</Badge>
                    <Badge className="bg-emerald-500/15 text-emerald-400 border-0 text-[9px]">V2: {split}%</Badge>
                  </div>
                </div>
                <Slider value={[split]} onValueChange={handleSplitChange} max={100} min={0} step={5} className="w-full" />
                <p className="text-[9px] text-muted-foreground">Afeta apenas novos visitantes.</p>
              </div>
            )}

            {!winner && hasEnoughData && (
              <div className="pt-2 border-t border-border/30">
                <p className="text-[10px] text-muted-foreground mb-2">Declarar vencedor (encerra teste permanentemente)</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="h-7 text-[10px] flex-1 border-border/50 text-foreground" onClick={() => handleDeclareWinner("V1")}>
                    <Trophy className="w-3 h-3 mr-1 text-amber-400" />V1 Vence
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-[10px] flex-1 border-emerald-500/30 text-emerald-400" onClick={() => handleDeclareWinner("V2")}>
                    <Trophy className="w-3 h-3 mr-1" />V2 Vence
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sample size bar */}
        <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] mt-2",
          hasEnoughData
            ? "bg-emerald-500/8 border border-emerald-500/15 text-emerald-400"
            : "bg-amber-500/8 border border-amber-500/15 text-amber-400"
        )}>
          {hasEnoughData ? <CheckCircle2 className="w-3 h-3 shrink-0" /> : <AlertTriangle className="w-3 h-3 shrink-0" />}
          <span className="truncate">
            {hasEnoughData
              ? `${totalVisitors} sessões (${v1.visitors} V1 + ${v2.visitors} V2) — dados confiáveis`
              : `${totalVisitors}/${minSample * 2} sessões (${v1.visitors} V1 + ${v2.visitors} V2)`
            }
          </span>
        </div>
      </div>

      {/* ═══ MAIN KPIs ═══ */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <BigKPI label="RPV" v1={v1RPV} v2={v2RPV} format="brl" icon={DollarSign} highlight />
        <BigKPI label="Conversão Front" v1={v1Conv} v2={v2Conv} format="pct" icon={Target} highlight />
        <BigKPI label="Taxa IC" v1={v1IC} v2={v2IC} format="pct" icon={ShoppingCart} />
        <BigKPI label="Receita Total" v1={v1.total_revenue} v2={v2.total_revenue} format="brl" icon={DollarSign} />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <BigKPI label="Visitantes" v1={v1.visitors} v2={v2.visitors} format="number" icon={Users} />
        <BigKPI label="Quiz Completo %" v1={v1Quiz} v2={v2Quiz} format="pct" icon={CheckCircle2} />
        <BigKPI label="CTA Rate" v1={v1CTA} v2={v2CTA} format="pct" icon={Zap} />
        <BigKPI label="Ticket Médio" v1={v1Ticket} v2={v2Ticket} format="brl" icon={DollarSign} />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <BigKPI label="Vendas Front" v1={v1.front_sales} v2={v2.front_sales} format="number" icon={ShoppingCart} />
        <BigKPI label="Receita Front" v1={v1.front_revenue} v2={v2.front_revenue} format="brl" icon={DollarSign} />
        <BigKPI label="Upsell Take Rate" v1={v1Upsell} v2={v2Upsell} format="pct" icon={ArrowUpRight} />
        <BigKPI label="Receita Upsell" v1={v1.upsell_revenue} v2={v2.upsell_revenue} format="brl" icon={DollarSign} />
      </div>

      {/* ═══ VERDICT ═══ */}
      {hasEnoughData && verdictItems.length > 0 && (
        <div className="rounded-xl p-3 sm:p-4 bg-gradient-to-br from-emerald-500/8 to-emerald-600/5 border border-emerald-500/15">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs sm:text-sm font-bold text-emerald-400">Diagnóstico Automático</h3>
          </div>
          <div className="space-y-1.5">
            {verdictItems.map((item, i) => (
              <p key={i} className="text-[11px] sm:text-xs text-foreground/80 flex items-start gap-1.5">
                <ArrowRight className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                <span>{item}</span>
              </p>
            ))}
          </div>
        </div>
      )}

      {/* ═══ FUNNEL PER STEP (mobile-friendly) ═══ */}
      <div className="rounded-xl bg-card/50 border border-border/50 p-3 sm:p-4">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-4 h-4 text-violet-400" />
          <h3 className="text-xs sm:text-sm font-bold text-foreground">Retenção por Etapa</h3>
        </div>
        <div className="space-y-1">
          {allStepSlugs.map((slug, i) => {
            const s1 = v1Steps.find(s => s.step === slug);
            const s2 = v2Steps.find(s => s.step === slug);
            const isRemoved = V2_REMOVED.includes(slug);
            const prevSlug = i > 0 ? allStepSlugs[i - 1] : null;
            const prevV1 = prevSlug ? v1Steps.find(s => s.step === prevSlug) : null;
            const prevV2 = prevSlug ? v2Steps.find(s => s.step === prevSlug) : null;

            return (
              <StepRow
                key={slug}
                slug={slug}
                s1={s1}
                s2={s2}
                isRemoved={isRemoved}
                prevV1Views={prevV1?.views ?? 0}
                prevV2Views={prevV2?.views ?? 0}
              />
            );
          })}
        </div>
      </div>

      {/* ═══ ANSWER DISTRIBUTION ═══ */}
      {(v1Answers.length > 0 || v2Answers.length > 0) && (
        <div className="rounded-xl bg-card/50 border border-border/50 p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs sm:text-sm font-bold text-foreground">Respostas Modificadas</h3>
          </div>
          <div className="space-y-4">
            {["step-5", "step-7"].map((stepSlug) => {
              const sv1 = v1Answers.filter(a => a.step === stepSlug);
              const sv2 = v2Answers.filter(a => a.step === stepSlug);
              if (sv1.length === 0 && sv2.length === 0) return null;
              const totalV1 = sv1.reduce((s, a) => s + a.count, 0);
              const totalV2 = sv2.reduce((s, a) => s + a.count, 0);

              return (
                <div key={stepSlug} className="rounded-lg bg-background/50 border border-border/30 p-3">
                  <p className="text-[11px] font-medium text-foreground/80 mb-2">{STEP_LABELS[stepSlug]}</p>
                  <div className="space-y-2">
                    <div>
                      <p className="text-[9px] text-muted-foreground mb-1">V1 (Original)</p>
                      {sv1.map(a => (
                        <div key={a.answer} className="flex items-center gap-2 mb-1">
                          <div className="flex-1 h-4 bg-muted/20 rounded-full overflow-hidden">
                            <div className="h-full bg-foreground/15 rounded-full" style={{ width: `${totalV1 > 0 ? (a.count / totalV1) * 100 : 0}%` }} />
                          </div>
                          <span className="text-[9px] text-muted-foreground tabular-nums shrink-0">{a.answer} ({a.count})</span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <p className="text-[9px] text-emerald-400/70 mb-1">V2 (Otimizado)</p>
                      {sv2.map(a => (
                        <div key={a.answer} className="flex items-center gap-2 mb-1">
                          <div className="flex-1 h-4 bg-emerald-500/5 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500/25 rounded-full" style={{ width: `${totalV2 > 0 ? (a.count / totalV2) * 100 : 0}%` }} />
                          </div>
                          <span className="text-[9px] text-emerald-400/70 tabular-nums shrink-0">{a.answer} ({a.count})</span>
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

      {/* ═══ CHANGES SUMMARY ═══ */}
      <div className="rounded-xl bg-card/50 border border-border/50 p-3 sm:p-4">
        <div className="flex items-center gap-2 mb-3">
          <GitCompare className="w-4 h-4 text-sky-400" />
          <h3 className="text-xs sm:text-sm font-bold text-foreground">O que mudou no V2</h3>
        </div>
        <div className="space-y-2">
          {[
            { type: "removed", text: "Step 10 (Disponibilidade) — pergunta binária sem impacto na personalização" },
            { type: "removed", text: "Step 11 (Demo Plataforma) — componente pesado, conteúdo movido para VSL" },
            { type: "removed", text: "Step 12 (WhatsApp Proof) — redundante com Step 4 (prova social)" },
            { type: "changed", text: "Step 5: respostas genéricas → gatilhos emocionais (\"Caí em golpe\", \"Medo de tecnologia\")" },
            { type: "changed", text: "Step 7: obstáculos genéricos → âncoras de confiança (\"Já fui enganado antes\")" },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <Badge className={cn("text-[8px] border-0 mt-0.5 shrink-0 px-1.5",
                item.type === "removed" ? "bg-red-500/10 text-red-400" : "bg-amber-500/10 text-amber-400"
              )}>
                {item.type === "removed" ? "Removido" : "Alterado"}
              </Badge>
              <span className="text-[11px] text-foreground/70 leading-relaxed">{item.text}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-2 border-t border-border/20">
          <p className="text-[10px] text-muted-foreground">
            Hipótese: menos etapas = menos abandono + gatilhos emocionais = maior engajamento e conversão.
          </p>
        </div>
      </div>
    </div>
  );
}
