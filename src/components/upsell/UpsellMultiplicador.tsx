import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Crown, Diamond, Check, ArrowRight, Lock, TrendingUp, Zap, ChevronRight, Sparkles, AlertTriangle, Users, Home, Wallet, Trophy, Clock, Calendar, Timer, Target, Landmark, ShieldCheck } from "lucide-react";
import { saveUpsellExtras } from "@/lib/upsellData";
import { saveFunnelEvent } from "@/lib/metricsClient";
import { logAuditEvent } from "@/hooks/useAuditLog";
import { buildTrackingQueryString } from "@/lib/trackingDataLayer";

interface Props {
  name: string;
  onNext: () => void;
  onDecline: () => void;
}

const plans = [
  {
    id: "prata",
    icon: Shield,
    name: "Multiplicação Moderada",
    multLabel: "3x",
    dailyLimit: "R$ 75/dia",
    dailyLimitValue: 75,
    subtitleColor: "#94A3B8",
    multFactor: 3,
    dailyBonus: 75,
    description: "Seus juros compostos passam a operar 3x mais rápido, desbloqueando um novo limite diário de R$ 75. É como trocar da 1ª marcha pra 3ª — mais velocidade com segurança.",
    price: 47,
    installments: "5x de R$ 9,90",
    border: "1px solid rgba(255,255,255,0.08)",
    btnBg: "transparent",
    btnColor: "#94A3B8",
    btnBorder: "1.5px solid #94A3B8",
    btnText: "ATIVAR MULTIPLICAÇÃO 3X",
    badge: null,
    checkoutUrl: "https://pay.kirvano.com/b61b6335-9325-4ecb-9b87-8214d948e90e",
  },
  {
    id: "ouro",
    icon: Crown,
    name: "Multiplicação Avançada",
    multLabel: "10x",
    dailyLimit: "R$ 250/dia",
    dailyLimitValue: 250,
    subtitleColor: "#FACC15",
    multFactor: 10,
    dailyBonus: 250,
    description: "Juros compostos turbinados a 10x: a IA reinveste e multiplica seus ganhos 24h, desbloqueando até R$ 250/dia. Seus lucros crescem enquanto você dorme.",
    price: 67,
    installments: "7x de R$ 9,90",
    border: "2px solid #FACC15",
    btnBg: "linear-gradient(135deg, #FACC15, #EAB308)",
    btnColor: "#020617",
    btnBorder: "none",
    btnText: "ATIVAR MULTIPLICAÇÃO 10X",
    badge: "⭐ MAIS ESCOLHIDO",
    checkoutUrl: "https://pay.kirvano.com/2f8e1d23-b71c-4c4b-9da1-672a6ca75c9b",
  },
  {
    id: "diamante",
    icon: Diamond,
    name: "Multiplicação Máxima",
    multLabel: "20x",
    dailyLimit: "Sem limite",
    dailyLimitValue: 500,
    subtitleColor: "#60A5FA",
    multFactor: 20,
    dailyBonus: 500,
    description: "Nível máximo de juros compostos: multiplicação 20x, operando 24h sem teto de ganhos. O sistema reinveste no potencial total + relatório semanal no WhatsApp.",
    price: 97,
    installments: "10x de R$ 9,90",
    border: "1px solid rgba(96,165,250,0.25)",
    btnBg: "linear-gradient(135deg, #3B82F6, #2563EB)",
    btnColor: "#fff",
    btnBorder: "none",
    btnText: "ATIVAR MULTIPLICAÇÃO 20X",
    badge: null,
    checkoutUrl: "https://pay.kirvano.com/e7d1995f-9b55-47d0-a1c4-762b07721162",
  },
];

/* ── Quiz Questions ── */

interface QuizOption {
  id: string;
  label: string;
  desc: string;
  Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}

const q1Options: QuizOption[] = [
  { id: "conservador", label: "CONSERVADOR", desc: "Prefiro crescer de forma segura, mesmo que seja mais devagar", Icon: Shield },
  { id: "equilibrado", label: "EQUILIBRADO", desc: "Quero equilíbrio entre segurança e crescimento rápido", Icon: Zap },
  { id: "agressivo", label: "AGRESSIVO", desc: "Quero retornos máximos no menor tempo possível", Icon: TrendingUp },
];

const q2Options: QuizOption[] = [
  { id: "endividado", label: "ENDIVIDADO", desc: "Tenho dívidas que preciso pagar urgentemente", Icon: Wallet },
  { id: "estavel", label: "ESTÁVEL MAS LIMITADO", desc: "Pago as contas mas sobra pouco ou nada", Icon: Landmark },
  { id: "confortavel", label: "CONFORTÁVEL", desc: "Tenho reservas e quero multiplicar meu dinheiro", Icon: TrendingUp },
];

const q3Options: QuizOption[] = [
  { id: "contas", label: "PAGAR DÍVIDAS", desc: "Quero me livrar das dívidas e respirar tranquilo", Icon: Home },
  { id: "renda", label: "RENDA EXTRA", desc: "Quero ganhar mais por mês para viver melhor", Icon: Landmark },
  { id: "liberdade", label: "LIBERDADE FINANCEIRA", desc: "Quero parar de trabalhar e viver dos meus ganhos", Icon: Trophy },
  { id: "familia", label: "DEIXAR UM LEGADO", desc: "Quero dar segurança financeira pra minha família", Icon: Users },
];

const q4Options: QuizOption[] = [
  { id: "30dias", label: "EM 30 DIAS", desc: "O mais rápido possível", Icon: Zap },
  { id: "urgente", label: "MENOS DE 6 MESES", desc: "Urgente", Icon: Timer },
  { id: "medio", label: "6 A 12 MESES", desc: "Médio prazo", Icon: Calendar },
  { id: "longo", label: "1 A 2 ANOS", desc: "Longo prazo", Icon: Clock },
];

/* ── Confirmation data per question ── */
const confirmationData: Record<string, { title: string; getText: (answer: string) => string; encouragement: string }> = {
  profile: {
    title: "✓ Perfil identificado!",
    getText: (a) => {
      const map: Record<string, string> = {
        conservador: "Os investidores CONSERVADORES são pessoas que preferem crescer com segurança e constância.",
        equilibrado: "Os investidores EQUILIBRADOS buscam o ponto ideal entre segurança e crescimento acelerado.",
        agressivo: "Os investidores AGRESSIVOS buscam retornos máximos e estão prontos para acelerar.",
      };
      return map[a] || "";
    },
    encouragement: "Perfeito!",
  },
  situation: {
    title: "✓ Situação mapeada!",
    getText: (a) => {
      const map: Record<string, string> = {
        endividado: "Você está ENDIVIDADO, o que significa que precisa de resultados rápidos. Multiplicar seus ganhos pode mudar essa situação por completo.",
        estavel: "Você está ESTÁVEL MAS LIMITADO, o que significa que paga as contas mas sobra pouco. Multiplicar seus ganhos muda essa equação por completo.",
        confortavel: "Você está CONFORTÁVEL e quer multiplicar o que já tem. Esse é o cenário ideal para acelerar.",
      };
      return map[a] || "";
    },
    encouragement: "Vamos acelerar isso.",
  },
  goal: {
    title: "✓ Meta definida!",
    getText: (a) => {
      const map: Record<string, string> = {
        contas: "Pagar dívidas é alcançável quando você para de apenas GANHAR e começa a MULTIPLICAR.",
        renda: "Renda extra é alcançável quando você para de apenas GANHAR e começa a MULTIPLICAR.",
        liberdade: "Liberdade financeira é alcançável quando você para de apenas GANHAR e começa a MULTIPLICAR.",
        familia: "Deixar um legado é alcançável quando você para de apenas GANHAR e começa a MULTIPLICAR.",
      };
      return map[a] || "";
    },
    encouragement: "",
  },
};

/* ── Step flow:
  1: Welcome/Register
  2: Name
  3-9: Quiz questions + confirmations
  10: Analysis
  11: Plan projection
  12: Problem reveal
  13: Multiplicador reveal (what it is)
  14: Comparison table (sem vs com)
  15: Compound interest explanation
  16: Why it costs money
  17: Final offer (plans) — decline → step 18 (guarantee)
  18: Guarantee page — "Ativar" → step 17, "Ainda tenho dúvidas" → step 19
  19: Urgency page — "Ativar" → step 17, decline → onDecline (upsell3)
── */

const TOTAL_DOTS = 24;
const TOTAL_QUESTIONS = 4;

const UpsellMultiplicador = ({ name: propName, onNext, onDecline }: Props) => {
  const existingName = propName !== "Visitante" ? propName : "";
  const [step, setStep] = useState(1);
  const [userName, setUserName] = useState(existingName);
  const [nameInput, setNameInput] = useState(existingName);
  const [answers, setAnswers] = useState({ profile: "", situation: "", goal: "", timeline: "", goalAmount: 0 });
  const [goalAmountInput, setGoalAmountInput] = useState("");
  const [analysisPhase, setAnalysisPhase] = useState(0);
  const [recommendedPlan, setRecommendedPlan] = useState<string>("ouro");

  const firstName = userName || "";

  // Analysis animation (step 10)
  useEffect(() => {
    if (step !== 10) return;
    setAnalysisPhase(0);
    const t1 = setTimeout(() => setAnalysisPhase(1), 600);
    const t2 = setTimeout(() => setAnalysisPhase(2), 1400);
    const t3 = setTimeout(() => setAnalysisPhase(3), 2200);
    const t4 = setTimeout(() => setAnalysisPhase(4), 3000);
    const t5 = setTimeout(() => {
      // Smart recommendation: balance urgency with affordability
      let rec = "ouro"; // default — best cost-benefit
      
      if (answers.profile === "conservador" && (answers.timeline === "longo" || answers.timeline === "medio")) {
        rec = "prata"; // conservador + prazo longo = opção mais suave
      } else if (answers.profile === "agressivo" && answers.situation === "confortavel") {
        rec = "diamante"; // só recomenda diamante se tem condição financeira
      } else if (answers.situation === "endividado") {
        // Endividado: NUNCA empurrar o mais caro — ouro é o melhor custo-benefício
        rec = answers.profile === "conservador" ? "prata" : "ouro";
      } else if (answers.timeline === "30dias" || answers.timeline === "urgente") {
        // Prazo curto mas não endividado: ouro (equilíbrio)
        rec = answers.situation === "confortavel" ? "diamante" : "ouro";
      }
      
      setRecommendedPlan(rec);
      setStep(11);
    }, 4500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5); };
  }, [step, answers]);

  const goTo = useCallback((s: number) => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    setStep(s);
  }, []);

  const goNext = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    setStep(s => s + 1);
  }, []);

  const selectQuizOption = useCallback((key: string, value: string) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
      setStep(s => s + 1);
    }, 300);
  }, []);

  const handleSelectPlan = (plan: (typeof plans)[0]) => {
    saveUpsellExtras("multiplicador", { plan: plan.id, price: plan.price });
    saveFunnelEvent("upsell_oneclick_buy", { page: "/upsell2", plan: plan.id, price: plan.price });
    logAuditEvent({ eventType: "upsell_oneclick_buy", pageId: "/upsell2", metadata: { plan: plan.id, price: plan.price } });
    const utmQs = buildTrackingQueryString();
    const separator = plan.checkoutUrl.includes("?") ? "&" : "?";
    const fullUrl = utmQs ? `${plan.checkoutUrl}${separator}${utmQs.slice(1)}` : plan.checkoutUrl;
    window.open(fullUrl, "_blank");
  };

  /* ── Helper: get which question number ── */
  const getQuestionNumber = (): number | null => {
    if (step === 3) return 1;
    if (step === 5) return 2;
    if (step === 7) return 3;
    if (step === 9) return 4;
    return null;
  };

  const questionNum = getQuestionNumber();
  const progressPercent = questionNum ? (questionNum / TOTAL_QUESTIONS) * 100 : 0;

  /* ── Helper: Question step renderer ── */
  const renderQuestionStep = (
    title: string,
    options: QuizOption[],
    answerKey: string,
  ) => (
    <div className="space-y-5">
      <div>
        <div className="flex justify-between text-[13px] mb-1.5">
          <span style={{ color: "#94A3B8" }}>Pergunta {questionNum} de {TOTAL_QUESTIONS}</span>
          <span style={{ color: "#94A3B8" }}>{Math.round(progressPercent)}%</span>
        </div>
        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, #16A34A, #22D3EE)" }}
            initial={{ width: "0%" }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      <h2 className="text-[22px] font-extrabold leading-tight" style={{ color: "#F8FAFC" }}>
        {title}
      </h2>

      <div className="space-y-3">
        {options.map(opt => (
          <button
            key={opt.id}
            onClick={() => selectQuizOption(answerKey, opt.id)}
            className="w-full text-left p-4 rounded-xl transition-all hover:brightness-110 active:scale-[0.98] flex items-center gap-4"
            style={{
              background: "#0F172A",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(255,255,255,0.05)" }}>
              <opt.Icon className="w-5 h-5" style={{ color: "#94A3B8" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-extrabold tracking-wide" style={{ color: "#F8FAFC" }}>{opt.label}</p>
              <p className="text-[13px] mt-0.5" style={{ color: "#64748B" }}>{opt.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  /* ── Helper: Confirmation step renderer ── */
  const renderConfirmationStep = (
    dataKey: keyof typeof confirmationData,
    answerValue: string,
  ) => {
    const data = confirmationData[dataKey];
    return (
      <div className="flex flex-col items-center text-center space-y-5 py-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 14 }}
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #16A34A, #22C55E)" }}
        >
          <Check className="w-9 h-9 text-white" strokeWidth={2.5} />
        </motion.div>

        <h2 className="text-[22px] font-extrabold" style={{ color: "#22C55E" }}>
          {data.title}
        </h2>

        <p className="text-[15px] leading-relaxed px-2" style={{ color: "#CBD5E1" }}>
          {data.getText(answerValue)}
        </p>

        {data.encouragement && (
          <p className="text-[17px] font-bold" style={{ color: "#22C55E" }}>
            {data.encouragement}
          </p>
        )}

        <button
          onClick={goNext}
          className="w-full py-4 rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-[0.98]"
          style={{ background: "linear-gradient(90deg, #0EA5E9, #22D3EE)", color: "#fff" }}
        >
          PRÓXIMA PERGUNTA
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    );
  };

  /* ── Dots ── */
  const dots = Array.from({ length: TOTAL_DOTS }, (_, i) => i + 1);
  const activeDot = Math.min(step, TOTAL_DOTS);

  /* ── Goal label helpers ── */
  const goalLabel = (id: string) => {
    const m: Record<string, string> = { contas: "Pagar dívidas", renda: "Renda extra", liberdade: "Liberdade financeira", familia: "Deixar um legado" };
    return m[id] || id;
  };
  const timelineLabel = (id: string) => {
    const m: Record<string, string> = { "30dias": "30 dias", urgente: "menos de 6 meses", medio: "6 a 12 meses", longo: "1 a 2 anos" };
    return m[id] || id;
  };
  const profileLabel = (id: string) => {
    const m: Record<string, string> = { conservador: "CONSERVADOR", equilibrado: "EQUILIBRADO", agressivo: "AGRESSIVO" };
    return m[id] || id;
  };
  const situationLabel = (id: string) => {
    const m: Record<string, string> = { endividado: "ENDIVIDADO", estavel: "ESTÁVEL MAS LIMITADO", confortavel: "CONFORTÁVEL" };
    return m[id] || id;
  };

  /* ── Fully personalized projections based on ALL answers ── */

  // Monthly goal amount — uses the user's own input
  const getGoalAmount = (): number => {
    if (answers.goalAmount > 0) return answers.goalAmount;
    return 2000; // fallback
  };

  const getGoalAmountLabel = (): string => {
    const amount = getGoalAmount();
    const isMonthly = answers.goal === "renda" || answers.goal === "liberdade";
    const formatted = amount.toLocaleString("pt-BR");
    return isMonthly ? `R$ ${formatted}/mês` : `R$ ${formatted}`;
  };

  // Total amount needed (for time calculations)
  const getTotalGoalValue = (): number => {
    const monthly = getGoalAmount();
    if (answers.goal === "renda" || answers.goal === "liberdade") {
      // For monthly income goals, calculate how much total to build up
      // (roughly 3-6 months of the monthly goal as "runway")
      const months = answers.timeline === "30dias" ? 1 : answers.timeline === "urgente" ? 3 : answers.timeline === "medio" ? 4 : 6;
      return monthly * months;
    }
    // For lump sum goals (contas, familia), use directly
    return monthly;
  };

  // Multiplier factor based on profile
  const getMultiplierFactor = (): number => {
    if (answers.profile === "agressivo") return 3.5;
    if (answers.profile === "equilibrado") return 2.5;
    return 1.8; // conservador
  };

  /* ── Time to goal per plan ── */
  const getTimeToGoalForPlan = (dailyLimit: number): string => {
    const totalNeeded = getTotalGoalValue();
    // Efficiency based on profile
    const efficiency = answers.profile === "agressivo" ? 0.7 : answers.profile === "equilibrado" ? 0.6 : 0.5;
    const effectiveDaily = dailyLimit * efficiency;
    const daysNeeded = Math.ceil(totalNeeded / effectiveDaily);
    if (daysNeeded <= 7) return "~1 semana";
    if (daysNeeded <= 14) return "~2 semanas";
    if (daysNeeded <= 21) return "~3 semanas";
    if (daysNeeded <= 30) return "~1 mês";
    if (daysNeeded <= 45) return "~1,5 mês";
    if (daysNeeded <= 60) return "~2 meses";
    if (daysNeeded <= 90) return "~3 meses";
    if (daysNeeded <= 120) return "~4 meses";
    if (daysNeeded <= 150) return "~5 meses";
    if (daysNeeded <= 180) return "~6 meses";
    if (daysNeeded <= 270) return "~9 meses";
    return "~12+ meses";
  };

  const getTimeToGoalBasic = (): string => {
    const totalNeeded = getTotalGoalValue();
    const effectiveDaily = 25 * 0.5; // R$25/day at conservative 50% efficiency
    const daysNeeded = Math.ceil(totalNeeded / effectiveDaily);
    if (daysNeeded <= 30) return "~1 mês";
    if (daysNeeded <= 60) return "~2 meses";
    if (daysNeeded <= 90) return "~3 meses";
    if (daysNeeded <= 120) return "~4 meses";
    if (daysNeeded <= 180) return "~6 meses";
    if (daysNeeded <= 270) return "~9 meses";
    if (daysNeeded <= 365) return "~12 meses";
    if (daysNeeded <= 540) return "~18 meses";
    return "mais de 2 anos";
  };

  /* ── Dynamic comparison values for step 14 ── */
  const getComparisonData = () => {
    const base = 25;
    const mult = getMultiplierFactor();
    const goalVal = getTotalGoalValue();

    const sem = [
      { mes: 1, val: Math.round(base * 30 * 0.5) },
      { mes: 3, val: Math.round(base * 90 * 0.5) },
      { mes: 6, val: Math.round(base * 180 * 0.5) },
      { mes: 12, val: Math.round(base * 360 * 0.5) },
    ];
    const com = sem.map(s => ({ mes: s.mes, val: s.val * 20 }));

    let goalMonth: number | null = null;
    for (const c of com) {
      if (c.val >= goalVal && !goalMonth) goalMonth = c.mes;
    }

    return { sem, com, goalMonth };
  };

  /* ── Dynamic compound interest table for step 15 ── */
  const getCompoundRows = () => {
    const base = 25;
    // Daily compound rate varies by profile
    const dailyRate = answers.profile === "agressivo" ? 0.025 : answers.profile === "equilibrado" ? 0.02 : 0.015;
    const days = [1, 2, 3, 10, 30, 60, 90];
    return days.map(d => {
      const valor = base * Math.pow(1 + dailyRate, d - 1);
      const pct = d === 1 ? null : `+${Math.round((valor / base - 1) * 100)}%`;
      return { dia: d, valor: Math.round(valor * 100) / 100, pct };
    });
  };

  return (
    <div className="flex flex-col gap-4 pt-2">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
        >
          {/* ═══ STEP 1: Welcome / Acelerador Ativo ═══ */}
          {step === 1 && (
            <div className="text-center space-y-5">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 14 }}
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-lg"
                style={{ background: "linear-gradient(135deg, #16A34A, #22C55E)" }}
              >
                <Check className="w-8 h-8 text-white" strokeWidth={3} />
              </motion.div>

              <div>
                <h1 className="text-[22px] font-extrabold leading-tight" style={{ color: "#F8FAFC" }}>
                  {existingName ? `${existingName}, seu ` : "Seu "}Acelerador está ativo! ✅
                </h1>
                <p className="text-[14px] mt-3 leading-relaxed" style={{ color: "#94A3B8" }}>
                  Agora precisamos <strong style={{ color: "#F8FAFC" }}>completar a ativação</strong> da sua conta na 
                  Plataforma de Ganhos com Tempo Livre e configurar o seu <strong style={{ color: "#FACC15" }}>limite diário de ganhos</strong>.
                </p>
                <div className="mt-4 p-3 rounded-xl" style={{ background: "rgba(250,204,21,0.08)", border: "1px solid rgba(250,204,21,0.15)" }}>
                  <p className="text-[13px] leading-relaxed" style={{ color: "#FACC15" }}>
                    ⚡ Leva menos de 1 minuto — são apenas algumas perguntas rápidas.
                  </p>
                </div>
              </div>

              <button
                onClick={goNext}
                className="w-full py-4 rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg, #16A34A, #22C55E)", color: "#fff" }}
              >
                COMPLETAR MEU REGISTRO
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* ═══ STEP 2: Nome ═══ */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="text-center">
                <h2 className="text-[22px] font-extrabold" style={{ color: "#F8FAFC" }}>
                  COMPLETE SEU REGISTRO
                </h2>
                <p className="text-[14px] mt-2" style={{ color: "#94A3B8" }}>
                  Para ativar sua conta na plataforma, precisamos de alguns dados:
                </p>
              </div>

              <div>
                <label className="text-[13px] font-medium block mb-1.5" style={{ color: "#94A3B8" }}>
                  Seu primeiro nome
                </label>
                <input
                  type="text"
                  placeholder="Ex: Carlos"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  maxLength={50}
                  autoFocus
                  className="w-full px-5 py-4 rounded-2xl text-lg focus:outline-none transition-all"
                  style={{
                    background: "#0F172A",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "#F8FAFC",
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && nameInput.trim().length > 1) {
                      setUserName(nameInput.trim());
                      goNext();
                    }
                  }}
                />
              </div>

              <button
                onClick={() => {
                  if (nameInput.trim().length > 1) {
                    setUserName(nameInput.trim());
                    goNext();
                  }
                }}
                disabled={nameInput.trim().length < 2}
                className="w-full py-4 rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40"
                style={{ background: "linear-gradient(90deg, #0EA5E9, #22D3EE)", color: "#fff" }}
              >
                CONTINUAR
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* ═══ STEP 3: Q1 — Tipo de investidor ═══ */}
          {step === 3 && renderQuestionStep(
            "Que tipo de investidor você é?",
            q1Options,
            "profile",
          )}

          {/* ═══ STEP 4: Q1 Confirmation ═══ */}
          {step === 4 && renderConfirmationStep("profile", answers.profile)}

          {/* ═══ STEP 5: Q2 — Situação financeira ═══ */}
          {step === 5 && renderQuestionStep(
            "Qual é a sua situação financeira hoje?",
            q2Options,
            "situation",
          )}

          {/* ═══ STEP 6: Q2 Confirmation ═══ */}
          {step === 6 && renderConfirmationStep("situation", answers.situation)}

          {/* ═══ STEP 7: Q3 — Meta financeira ═══ */}
          {step === 7 && renderQuestionStep(
            "Qual é a sua META financeira MAIS GRANDE?",
            q3Options,
            "goal",
          )}

          {/* ═══ STEP 8: Q3 Confirmation + Goal Amount Input ═══ */}
          {step === 8 && (() => {
            const data = confirmationData["goal"];
            const goalText = goalLabel(answers.goal);
            const placeholder = answers.goal === "contas" ? "Ex: 5000" : answers.goal === "familia" ? "Ex: 10000" : "Ex: 2000";
            const label = answers.goal === "renda" || answers.goal === "liberdade"
              ? "Quanto você quer ganhar por mês?"
              : answers.goal === "contas"
              ? "Quanto você precisa para quitar suas dívidas?"
              : "Quanto você quer acumular para sua família?";

            const handleGoalAmountSubmit = () => {
              const val = parseInt(goalAmountInput.replace(/\D/g, ""), 10);
              if (val && val >= 100) {
                setAnswers(prev => ({ ...prev, goalAmount: val }));
                goNext();
              }
            };

            return (
              <div className="space-y-5 py-4">
                <div className="flex flex-col items-center text-center space-y-3">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 14 }}
                    className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, #16A34A, #22C55E)" }}
                  >
                    <Check className="w-8 h-8 text-white" strokeWidth={2.5} />
                  </motion.div>

                  <h2 className="text-[20px] font-extrabold" style={{ color: "#22C55E" }}>
                    {data.title}
                  </h2>

                  <p className="text-[14px] leading-relaxed px-2" style={{ color: "#CBD5E1" }}>
                    {data.getText(answers.goal)}
                  </p>
                </div>

                <div className="p-5 rounded-xl space-y-4" style={{ background: "#0F172A", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <p className="text-[16px] font-bold text-center" style={{ color: "#F8FAFC" }}>
                    {label}
                  </p>

                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[18px] font-bold" style={{ color: "#94A3B8" }}>R$</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder={placeholder}
                      value={goalAmountInput}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, "");
                        if (raw.length <= 7) {
                          setGoalAmountInput(raw ? parseInt(raw, 10).toLocaleString("pt-BR") : "");
                        }
                      }}
                      autoFocus
                      className="w-full pl-14 pr-5 py-4 rounded-2xl text-[22px] font-bold focus:outline-none transition-all text-center"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1.5px solid rgba(34,197,94,0.3)",
                        color: "#F8FAFC",
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleGoalAmountSubmit();
                      }}
                    />
                  </div>

                  {(answers.goal === "renda" || answers.goal === "liberdade") && (
                    <p className="text-[12px] text-center" style={{ color: "#64748B" }}>
                      Valor mensal que você deseja alcançar
                    </p>
                  )}
                  {(answers.goal === "contas" || answers.goal === "familia") && (
                    <p className="text-[12px] text-center" style={{ color: "#64748B" }}>
                      Valor total que você precisa alcançar
                    </p>
                  )}
                </div>

                <button
                  onClick={handleGoalAmountSubmit}
                  disabled={!goalAmountInput || parseInt(goalAmountInput.replace(/\D/g, ""), 10) < 100}
                  className="w-full py-4 rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40"
                  style={{ background: "linear-gradient(90deg, #0EA5E9, #22D3EE)", color: "#fff" }}
                >
                  CONTINUAR
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            );
          })()}

          {/* ═══ STEP 9: Q4 — Prazo ═══ */}
          {step === 9 && renderQuestionStep(
            "Em quanto tempo você quer alcançar sua meta?",
            q4Options,
            "timeline",
          )}

          {/* ═══ STEP 10: Q4 Confirmation + Analysis ═══ */}
          {step === 10 && (
            <div className="flex flex-col items-center text-center space-y-5 py-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 14 }}
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #16A34A, #22C55E)" }}
              >
                <Check className="w-9 h-9 text-white" strokeWidth={2.5} />
              </motion.div>

              <h2 className="text-[22px] font-extrabold" style={{ color: "#22C55E" }}>
                ✓ Prazo estabelecido!
              </h2>

              <div className="w-full p-5 rounded-xl text-left space-y-3" style={{ background: "#0F172A", border: "1px solid rgba(255,255,255,0.08)" }}>
                <p className="text-[14px] text-center" style={{ color: "#94A3B8" }}>Analisando seu perfil...</p>

                <motion.div initial={{ opacity: 0 }} animate={{ opacity: analysisPhase >= 1 ? 1 : 0 }}
                  className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "#16A34A" }}>
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-[14px] font-bold" style={{ color: "#F8FAFC" }}>Perfil {profileLabel(answers.profile)}</span>
                </motion.div>

                <motion.div initial={{ opacity: 0 }} animate={{ opacity: analysisPhase >= 2 ? 1 : 0 }}
                  className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "#16A34A" }}>
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-[14px] font-bold" style={{ color: "#F8FAFC" }}>Situação {situationLabel(answers.situation)}</span>
                </motion.div>

                <motion.div initial={{ opacity: 0 }} animate={{ opacity: analysisPhase >= 3 ? 1 : 0 }}
                  className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "#16A34A" }}>
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-[14px] font-bold" style={{ color: "#F8FAFC" }}>Meta: {goalLabel(answers.goal)}</span>
                </motion.div>

                <motion.div initial={{ opacity: 0 }} animate={{ opacity: analysisPhase >= 4 ? 1 : 0 }}
                  className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ border: "1.5px solid #475569", background: "transparent" }}>
                  </div>
                  <span className="text-[14px]" style={{ color: "#64748B" }}>Prazo: {timelineLabel(answers.timeline)}</span>
                </motion.div>
              </div>
            </div>
          )}

          {/* ═══ STEP 11: Seu plano / Projeção ═══ */}
          {step === 11 && (
            <div className="space-y-5">
              <h1 className="text-[24px] font-extrabold text-center leading-tight" style={{ color: "#F8FAFC" }}>
                <span style={{ color: "#FACC15" }}>{userName}</span>, aqui está seu plano:
              </h1>

              <div className="p-5 rounded-xl space-y-3" style={{ background: "#0F172A", border: "1px solid rgba(255,255,255,0.08)" }}>
                <p className="text-[15px]" style={{ color: "#CBD5E1" }}>
                  Para alcançar <strong style={{ color: "#F8FAFC" }}>{goalLabel(answers.goal)}</strong> em <strong style={{ color: "#F8FAFC" }}>{timelineLabel(answers.timeline)}</strong>...
                </p>
                <p className="text-[14px]" style={{ color: "#94A3B8" }}>
                  Você precisa gerar aproximadamente:
                </p>
                <p className="text-[36px] font-extrabold text-center" style={{ color: "#22C55E" }}>
                  {getGoalAmountLabel()}
                </p>
              </div>

              <div className="p-5 rounded-xl space-y-2" style={{ background: "#0F172A", border: "1px solid rgba(255,255,255,0.08)" }}>
                <p className="text-[14px]" style={{ color: "#CBD5E1" }}>
                  Com sua IA atual (ganhos diários):
                </p>
                <p className="text-[14px]" style={{ color: "#F8FAFC" }}>
                  → Gerando em média <strong style={{ color: "#22C55E" }}>R$ 25/dia</strong>
                </p>
                <p className="text-[14px]" style={{ color: "#F8FAFC" }}>
                  → Alcança sua meta em <strong style={{ color: "#EF4444" }}>{getTimeToGoalBasic()}</strong>
                </p>
              </div>

              <div className="p-5 rounded-xl" style={{ background: "#0F172A", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="flex items-end justify-between gap-2 h-24 mb-3">
                  {[20, 35, 50, 65, 80, 100].map((h, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      transition={{ delay: 0.1 * i, duration: 0.5 }}
                      className="flex-1 rounded-t-md"
                      style={{ background: `linear-gradient(180deg, #1E40AF, #3B82F6)` }}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-[11px]" style={{ color: "#64748B" }}>
                  {["M1", "M2", "M3", "M4", "M5", "M6"].map(m => (
                    <span key={m}>{m}</span>
                  ))}
                </div>
              </div>

              <p className="text-[14px] text-center" style={{ color: "#94A3B8" }}>
                Está vendo esse crescimento <strong style={{ color: "#F8FAFC" }}>LINEAR</strong>?
              </p>

              <button
                onClick={goNext}
                className="w-full py-4 rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-[0.98]"
                style={{ background: "linear-gradient(90deg, #0EA5E9, #22D3EE)", color: "#fff" }}
              >
                CONTINUAR
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* ═══ STEP 12: Problema — Modo básico ═══ */}
          {step === 12 && (
            <div className="space-y-6 py-4">
              <h1 className="text-[26px] font-extrabold text-center leading-tight" style={{ color: "#F8FAFC" }}>
                {userName}, você está <span style={{ color: "#22C55E" }}>MUITO PERTO</span> da sua meta.
              </h1>

              <div className="p-5 rounded-xl text-center space-y-3" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}>
                <p className="text-[17px] font-extrabold" style={{ color: "#F8FAFC" }}>
                  Mas tem um problema:
                </p>
                <p className="text-[15px]" style={{ color: "#CBD5E1" }}>
                  Sua IA está em <strong style={{ color: "#EF4444" }}>MODO BÁSICO</strong>.
                </p>
                <p className="text-[14px]" style={{ color: "#94A3B8" }}>
                  Ela gera ganhos... mas não os <strong style={{ color: "#F8FAFC" }}>MULTIPLICA</strong>.
                </p>
              </div>

              <p className="text-[15px] text-center leading-relaxed" style={{ color: "#CBD5E1" }}>
                É como ter um carro potente mas só andar em <strong style={{ color: "#FACC15" }}>1ª marcha</strong>.
              </p>

              <p className="text-[14px] text-center leading-relaxed" style={{ color: "#94A3B8" }}>
                O limite de <strong style={{ color: "#FACC15" }}>R$ 25/dia</strong> é uma trava de segurança pra iniciantes. Pra desbloquear o potencial real, 
                você precisa aumentar esse limite — e é isso que vou te mostrar agora.
              </p>

              <button
                onClick={goNext}
                className="w-full py-4 rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-[0.98]"
                style={{ background: "linear-gradient(90deg, #0EA5E9, #22D3EE)", color: "#fff" }}
              >
                <Sparkles className="w-5 h-5" />
                VER A SOLUÇÃO
              </button>
            </div>
          )}

          {/* ═══ STEP 13: Multiplicador Reveal ═══ */}
          {step === 13 && (
            <div className="space-y-6 py-4">
              <div className="text-center space-y-3">
                <p className="text-[15px]" style={{ color: "#94A3B8" }}>
                  Existe uma segunda IA na Plataforma de Ganhos.
                </p>
                <p className="text-[15px]" style={{ color: "#CBD5E1" }}>
                  Poucos membros sabem que ela existe.
                </p>
                <p className="text-[17px] font-bold mt-2" style={{ color: "#F8FAFC" }}>
                  Ela se chama:
                </p>
                <h1 className="text-[28px] font-extrabold" style={{ color: "#22C55E" }}>
                  MULTIPLICADOR DE IA
                </h1>
                <p className="text-[14px]" style={{ color: "#94A3B8" }}>E funciona assim:</p>
              </div>

              {/* IA Básica card */}
              <div className="p-5 rounded-xl space-y-2" style={{ background: "#0F172A", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="flex items-center gap-2.5 mb-2">
                  <Landmark className="w-5 h-5" style={{ color: "#94A3B8" }} />
                  <h3 className="text-[16px] font-extrabold" style={{ color: "#F8FAFC" }}>IA BÁSICA:</h3>
                </div>
                <p className="text-[14px]" style={{ color: "#94A3B8" }}>→ Analisa o mercado</p>
                <p className="text-[14px]" style={{ color: "#94A3B8" }}>→ Gera ganhos diários</p>
                <p className="text-[14px]" style={{ color: "#94A3B8" }}>→ <strong style={{ color: "#F8FAFC" }}>R$ 25/dia</strong> constante</p>
              </div>

              {/* Multiplicador card */}
              <div className="p-5 rounded-xl space-y-2" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)" }}>
                <div className="flex items-center gap-2.5 mb-2">
                  <Sparkles className="w-5 h-5" style={{ color: "#22C55E" }} />
                  <h3 className="text-[16px] font-extrabold" style={{ color: "#22C55E" }}>MULTIPLICADOR DE IA:</h3>
                </div>
                <p className="text-[14px]" style={{ color: "#CBD5E1" }}>→ Pega esses ganhos</p>
                <p className="text-[14px]" style={{ color: "#CBD5E1" }}>→ Multiplica exponencialmente</p>
                <p className="text-[14px]" style={{ color: "#CBD5E1" }}>→ <strong style={{ color: "#22C55E" }}>Crescimento acelerado</strong></p>
              </div>

              <button
                onClick={goNext}
                className="w-full py-4 rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg, #16A34A, #22D3EE)", color: "#fff" }}
              >
                VER A DIFERENÇA
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* ═══ STEP 14: Comparação Sem vs Com ═══ */}
          {step === 14 && (() => {
            const { sem, com, goalMonth } = getComparisonData();

            return (
              <div className="space-y-5 py-4">
                <h1 className="text-[24px] font-extrabold text-center" style={{ color: "#F8FAFC" }}>
                  {userName}, VEJA A DIFERENÇA:
                </h1>

                {/* Side by side tables */}
                <div className="grid grid-cols-2 gap-3">
                  {/* SEM */}
                  <div className="p-4 rounded-xl space-y-2" style={{ background: "#0F172A", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <h3 className="text-[13px] font-bold text-center" style={{ color: "#94A3B8" }}>SEM Multiplicador</h3>
                    {sem.map(s => (
                      <div key={s.mes} className="flex justify-between text-[13px]">
                        <span style={{ color: "#64748B" }}>Mês {s.mes}:</span>
                        <span className="font-bold" style={{ color: "#F8FAFC" }}>R$ {s.val.toLocaleString("pt-BR")}</span>
                      </div>
                    ))}
                  </div>
                  {/* COM */}
                  <div className="p-4 rounded-xl space-y-2" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)" }}>
                    <h3 className="text-[13px] font-bold text-center" style={{ color: "#22C55E" }}>COM Multiplicador</h3>
                    {com.map(c => {
                      const isGoalMonth = goalMonth === c.mes;
                      return (
                        <div key={c.mes} className="flex justify-between text-[13px]">
                          <span style={{ color: "#64748B" }}>Mês {c.mes}:</span>
                          <span className="font-bold" style={{ color: isGoalMonth ? "#FACC15" : "#22C55E" }}>
                            R$ {c.val.toLocaleString("pt-BR")} {isGoalMonth ? "✓" : c.mes === 12 ? "🚀" : ""}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {goalMonth && (
                  <p className="text-center text-[14px] font-bold" style={{ color: "#22C55E" }}>
                    ← {userName}, META ALCANÇADA NO MÊS {goalMonth}!
                  </p>
                )}

                {/* Side by side charts */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl" style={{ background: "#0F172A", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <p className="text-[11px] text-center mb-2" style={{ color: "#64748B" }}>Sem Multiplicador</p>
                    <div className="flex items-end justify-between gap-1 h-20">
                      {[15, 20, 25, 30, 35, 40].map((h, i) => (
                        <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${h}%` }}
                          transition={{ delay: 0.1 * i, duration: 0.4 }}
                          className="flex-1 rounded-t-sm" style={{ background: "#334155" }} />
                      ))}
                    </div>
                    <div className="flex justify-between text-[9px] mt-1" style={{ color: "#475569" }}>
                      {["M1","M2","M3","M4","M5","M6"].map(m => <span key={m}>{m}</span>)}
                    </div>
                  </div>
                  <div className="p-4 rounded-xl" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)" }}>
                    <p className="text-[11px] text-center mb-2" style={{ color: "#22C55E" }}>Com Multiplicador</p>
                    <div className="flex items-end justify-between gap-1 h-20">
                      {[15, 25, 40, 55, 75, 100].map((h, i) => (
                        <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${h}%` }}
                          transition={{ delay: 0.1 * i, duration: 0.4 }}
                          className="flex-1 rounded-t-sm" style={{ background: "linear-gradient(180deg, #16A34A, #22C55E)" }} />
                      ))}
                    </div>
                    <div className="flex justify-between text-[9px] mt-1" style={{ color: "#475569" }}>
                      {["M1","M2","M3","M4","M5","M6"].map(m => <span key={m}>{m}</span>)}
                    </div>
                  </div>
                </div>

                <button
                  onClick={goNext}
                  className="w-full py-4 rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-[0.98]"
                  style={{ background: "linear-gradient(135deg, #16A34A, #22D3EE)", color: "#fff" }}
                >
                  COMO ISSO É POSSÍVEL?
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            );
          })()}

          {/* ═══ STEP 15: Juros Compostos ═══ */}
          {step === 15 && (() => {
            const rows = getCompoundRows();
            return (
              <div className="space-y-5 py-4">
                <h1 className="text-[24px] font-extrabold text-center leading-tight" style={{ color: "#F8FAFC" }}>
                  O Multiplicador usa{" "}
                  <span style={{ color: "#22C55E" }}>JUROS COMPOSTOS</span>.
                </h1>

                <div className="text-center space-y-1">
                  <p className="text-[14px]" style={{ color: "#94A3B8" }}>O que significa isso?</p>
                  <p className="text-[16px] font-bold" style={{ color: "#F8FAFC" }}>Simples:</p>
                </div>

                <div className="space-y-2">
                  {rows.map((r, i) => (
                    <motion.div
                      key={r.dia}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.08 * i }}
                      className="flex justify-between items-center p-3.5 rounded-xl"
                      style={{ background: "#0F172A", border: "1px solid rgba(255,255,255,0.06)" }}
                    >
                      <span className="text-[14px]" style={{ color: "#94A3B8" }}>Dia {r.dia}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[16px] font-bold" style={{ color: "#22C55E" }}>
                          R$ {r.valor.toFixed(2).replace(".", ",")}
                        </span>
                        {r.pct && (
                          <span className="text-[12px]" style={{ color: "#94A3B8" }}>{r.pct}</span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="p-4 rounded-xl text-center" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
                  <p className="text-[16px] font-bold" style={{ color: "#F8FAFC" }}>
                    Seus ganhos <strong style={{ color: "#22C55E" }}>CRESCEM automaticamente</strong>.
                  </p>
                </div>

                <button
                  onClick={goNext}
                  className="w-full py-4 rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-[0.98]"
                  style={{ background: "linear-gradient(135deg, #16A34A, #22D3EE)", color: "#fff" }}
                >
                  ENTENDI, E AGORA?
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            );
          })()}

          {/* ═══ STEP 16: Por que custa? ═══ */}
          {step === 16 && (
            <div className="space-y-6 py-4">
              <h1 className="text-[22px] font-extrabold leading-tight" style={{ color: "#F8FAFC" }}>
                "Por que o Multiplicador não vem ativado?"
              </h1>

              <div className="p-5 rounded-xl space-y-3" style={{ background: "#0F172A", border: "1px solid rgba(255,255,255,0.08)" }}>
                <p className="text-[14px] leading-relaxed" style={{ color: "#CBD5E1" }}>
                  Porque o Multiplicador consome <strong style={{ color: "#FACC15" }}>5x mais recursos</strong>:
                </p>
                <div className="space-y-2 pl-1">
                  <div className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 shrink-0" style={{ color: "#64748B" }} />
                    <span className="text-[14px]" style={{ color: "#94A3B8" }}>Processa operações extras</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 shrink-0" style={{ color: "#64748B" }} />
                    <span className="text-[14px]" style={{ color: "#94A3B8" }}>Calcula multiplicações em tempo real</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 shrink-0" style={{ color: "#64748B" }} />
                    <span className="text-[14px]" style={{ color: "#94A3B8" }}>Monitora o saldo 24/7</span>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-xl" style={{ background: "rgba(250,204,21,0.06)", border: "1px solid rgba(250,204,21,0.12)" }}>
                <p className="text-[14px] leading-relaxed" style={{ color: "#CBD5E1" }}>
                  Se ativássemos pra todos...
                </p>
                <p className="text-[15px] font-bold mt-1" style={{ color: "#FACC15" }}>
                  Nossos custos explodiriam.
                </p>
              </div>

              <p className="text-[14px] text-center leading-relaxed" style={{ color: "#94A3B8" }}>
                Por isso mantemos como uma melhoria <strong style={{ color: "#F8FAFC" }}>OPCIONAL</strong>.
              </p>

              <button
                onClick={goNext}
                className="w-full py-4 rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg, #16A34A, #22D3EE)", color: "#fff" }}
              >
                QUANTO CUSTA?
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* ═══ STEP 17: Oferta final — Planos ═══ */}
          {step === 17 && (
            <div className="space-y-5">
              <div className="text-center">
                <h2 className="text-[22px] font-extrabold leading-tight" style={{ color: "#F8FAFC" }}>
                  {userName}, escolha seu nível de multiplicação:
                </h2>
                <p className="text-[13px] mt-2 leading-relaxed" style={{ color: "#94A3B8" }}>
                  Quanto maior a velocidade dos juros compostos, maior o seu limite diário de ganhos.
                  <strong style={{ color: "#FACC15" }}> Pagamento único, sem mensalidade.</strong>
                </p>
              </div>

              {/* Current limit warning */}
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}>
                <AlertTriangle className="w-5 h-5 shrink-0" style={{ color: "#EF4444" }} />
                <p className="text-[12px] leading-snug" style={{ color: "#FCA5A5" }}>
                  Agora: juros compostos em <strong>1x</strong> → limite de apenas <strong>R$ 25/dia</strong>. Seus ganhos estão travados no mínimo.
                </p>
              </div>

              {/* Plan cards — recommended first */}
              {[...plans]
                .sort((a, b) => {
                  if (a.id === recommendedPlan) return -1;
                  if (b.id === recommendedPlan) return 1;
                  return 0;
                })
                .map((plan, i) => {
                  const isRecommended = plan.id === recommendedPlan;
                  const timeToGoal = getTimeToGoalForPlan(plan.dailyLimitValue);
                  return (
                    <motion.div
                      key={plan.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 + i * 0.12 }}
                      className="relative rounded-2xl p-5"
                      style={{
                        background: "#0F172A",
                        border: isRecommended ? "2px solid #22C55E" : plan.border,
                        boxShadow: isRecommended ? "0 0 20px rgba(34,197,94,0.15)" : "none",
                      }}
                    >
                      {isRecommended && (
                        <span
                          className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-bold px-4 py-1 rounded-full whitespace-nowrap"
                          style={{
                            background: "linear-gradient(135deg, #16A34A, #22C55E)",
                            color: "#fff",
                            boxShadow: "0 2px 8px rgba(22,163,74,0.4)",
                          }}
                        >
                          ✨ IDEAL PRO SEU PERFIL
                        </span>
                      )}

                      {!isRecommended && plan.badge && (
                        <span
                          className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-bold px-4 py-1 rounded-full whitespace-nowrap"
                          style={{
                            background: "linear-gradient(135deg, #FACC15, #EAB308)",
                            color: "#020617",
                            boxShadow: "0 2px 8px rgba(250,204,21,0.3)",
                          }}
                        >
                          {plan.badge}
                        </span>
                      )}

                      <div className="flex items-center gap-2.5 mb-1 mt-1">
                        <plan.icon className="w-5 h-5" style={{ color: plan.subtitleColor }} />
                        <h3 className="text-[17px] font-bold" style={{ color: "#F8FAFC" }}>
                          {plan.name}
                        </h3>
                      </div>

                      {/* Main focus: multiplication + daily limit */}
                      <div className="mt-2 p-3 rounded-xl" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.12)" }}>
                        <div className="flex items-center justify-between">
                          <div className="text-center flex-1">
                            <p className="text-[28px] font-extrabold" style={{ color: plan.subtitleColor }}>
                              {plan.multLabel}
                            </p>
                            <p className="text-[10px] font-semibold" style={{ color: "#94A3B8" }}>
                              juros compostos
                            </p>
                          </div>
                          <div className="w-px h-10" style={{ background: "rgba(255,255,255,0.1)" }} />
                          <div className="text-center flex-1">
                            <p className="text-[18px] font-extrabold" style={{ color: "#F8FAFC" }}>
                              {plan.dailyLimit}
                            </p>
                            <p className="text-[10px] font-semibold" style={{ color: "#94A3B8" }}>
                              novo limite diário
                            </p>
                          </div>
                        </div>
                      </div>

                      <p className="text-[13px] mt-3 leading-relaxed" style={{ color: "#94A3B8" }}>
                        {plan.description}
                      </p>

                      {/* Time to goal */}
                      <div className="mt-2 flex items-center gap-2 p-2.5 rounded-lg" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.15)" }}>
                        <Target className="w-4 h-4 shrink-0" style={{ color: "#22C55E" }} />
                        <p className="text-[12px] leading-snug" style={{ color: "#86EFAC" }}>
                          Alcança sua meta de <strong style={{ color: "#F8FAFC" }}>{getGoalAmountLabel()}</strong> em <strong style={{ color: "#22C55E" }}>{timeToGoal}</strong>
                        </p>
                      </div>

                      <div className="mt-4 flex items-baseline gap-2">
                        <span className="text-[13px] line-through" style={{ color: "#475569" }}>
                          R$ {plan.price * 3}
                        </span>
                        <span className="text-[28px] font-extrabold" style={{ color: "#F8FAFC" }}>
                          R$ {plan.price}
                        </span>
                        <span className="text-[12px]" style={{ color: "#64748B" }}>
                          ou {plan.installments}
                        </span>
                      </div>
                      <p className="text-[11px] mt-1" style={{ color: "#22C55E" }}>
                        💳 Pagamento único • Acesso vitalício
                      </p>

                      <button
                        id={`btn-${plan.id}`}
                        onClick={() => handleSelectPlan(plan)}
                        className="w-full mt-4 py-[14px] rounded-xl font-bold text-[15px] transition-all hover:brightness-110 active:scale-[0.98]"
                        style={{
                          background: isRecommended ? "linear-gradient(135deg, #16A34A, #22C55E)" : plan.btnBg,
                          color: isRecommended ? "#fff" : plan.btnColor,
                          border: isRecommended ? "none" : plan.btnBorder,
                        }}
                      >
                        {plan.btnText}
                      </button>
                    </motion.div>
                  );
                })}

              {/* Social proof */}
              <div className="flex items-center justify-center gap-2 mt-2">
                <div className="flex -space-x-2">
                  {["C", "M", "J", "R"].map((l, i) => (
                    <div key={i} className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold"
                      style={{ background: ["#16A34A", "#FACC15", "#3B82F6", "#8B5CF6"][i], color: "#fff", border: "2px solid #0F172A" }}>
                      {l}
                    </div>
                  ))}
                </div>
                <p className="text-[12px]" style={{ color: "#64748B" }}>
                  <strong style={{ color: "#94A3B8" }}>2.847 pessoas</strong> já aumentaram o limite
                </p>
              </div>

              {/* Decline → Guarantee page */}
              <button
                onClick={() => {
                  saveFunnelEvent("upsell_guarantee_click", { page: "/upsell2" });
                  goTo(18);
                }}
                className="text-[13px] underline cursor-pointer bg-transparent border-none mx-auto block py-2"
                style={{ color: "#64748B" }}
              >
                Quero saber sobre a garantia primeiro
              </button>
            </div>
          )}

          {/* ═══ STEP 18: Garantia ═══ */}
          {step === 18 && (
            <div className="flex flex-col items-center text-center space-y-6 py-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 14 }}
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #16A34A, #22C55E)" }}
              >
                <ShieldCheck className="w-10 h-10 text-white" />
              </motion.div>

              <h2 className="text-[24px] font-extrabold" style={{ color: "#F8FAFC" }}>
                + Garantia de 7 Dias
              </h2>

              <div className="w-full p-5 rounded-xl text-left space-y-3" style={{ background: "#0F172A", border: "1px solid rgba(34,197,94,0.2)" }}>
                <p className="text-[15px]" style={{ color: "#CBD5E1" }}>
                  Ative agora.
                </p>
                <p className="text-[15px]" style={{ color: "#CBD5E1" }}>
                  Teste por <strong style={{ color: "#F8FAFC" }}>7 dias</strong>.
                </p>
                <p className="text-[15px]" style={{ color: "#CBD5E1" }}>
                  Não gostou? <strong style={{ color: "#22C55E" }}>Devolvemos 100% do valor</strong>.
                </p>
                <p className="text-[17px] font-bold mt-2" style={{ color: "#F8FAFC" }}>
                  Sem perguntas. Sem complicações.
                </p>
              </div>

              <button
                onClick={() => goTo(17)}
                className="w-full py-4 rounded-2xl font-bold text-[16px] flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg, #16A34A, #22D3EE)", color: "#fff" }}
              >
                ATIVAR MULTIPLICADOR DE IA
              </button>

              <button
                onClick={() => {
                  saveFunnelEvent("upsell_still_doubts_click", { page: "/upsell2" });
                  goTo(19);
                }}
                className="text-[13px] underline cursor-pointer bg-transparent border-none py-2"
                style={{ color: "#64748B" }}
              >
                Ainda tenho dúvidas
              </button>
            </div>
          )}

          {/* ═══ STEP 19: Urgência / Última Oportunidade ═══ */}
          {step === 19 && (
            <div className="flex flex-col items-center text-center space-y-6 py-8">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 12 }}
                className="w-full p-6 rounded-2xl"
                style={{
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  boxShadow: "0 0 30px rgba(239,68,68,0.1)",
                }}
              >
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: "rgba(239,68,68,0.15)" }}>
                  <AlertTriangle className="w-7 h-7" style={{ color: "#EF4444" }} />
                </div>

                <h2 className="text-[22px] font-extrabold italic" style={{ color: "#F87171" }}>
                  ÚLTIMA OPORTUNIDADE
                </h2>

                <p className="text-[15px] mt-3" style={{ color: "#CBD5E1" }}>
                  Esta oferta está <strong style={{ color: "#F8FAFC" }}>disponível apenas AGORA</strong>.
                </p>
                <p className="text-[14px] mt-2" style={{ color: "#94A3B8" }}>
                  Sair desta página = perder o acesso permanentemente.
                </p>
              </motion.div>

              <button
                onClick={() => goTo(17)}
                className="w-full py-4 rounded-2xl font-bold text-[16px] flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg, #16A34A, #22D3EE)", color: "#fff" }}
              >
                ATIVAR MULTIPLICADOR DE IA
              </button>

              <div className="flex items-center justify-center gap-2">
                <Lock className="w-3.5 h-3.5" style={{ color: "#64748B" }} />
                <span className="text-[12px]" style={{ color: "#64748B" }}>Pagamento seguro • Criptografia SSL</span>
              </div>

              <button
                onClick={() => {
                  saveFunnelEvent("upsell_oneclick_decline", { page: "/upsell2" });
                  logAuditEvent({ eventType: "upsell_oneclick_decline", pageId: "/upsell2" });
                  onDecline();
                }}
                className="text-[12px] underline cursor-pointer bg-transparent border-none py-2"
                style={{ color: "#475569" }}
              >
                Não, quero continuar sem multiplicar
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* ── Bottom dots ── */}
      <div className="flex justify-center gap-1 mt-2 pb-2 flex-wrap">
        {dots.map(d => (
          <div
            key={d}
            className="h-2 rounded-full transition-all duration-300"
            style={{
              width: d === activeDot ? 14 : 6,
              background: d < activeDot
                ? "#16A34A"
                : d === activeDot
                ? "#3B82F6"
                : "rgba(255,255,255,0.1)",
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default UpsellMultiplicador;
