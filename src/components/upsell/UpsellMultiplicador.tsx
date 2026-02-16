import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Crown, Diamond, Check, ArrowRight, Lock, TrendingUp, Zap, ChevronRight, Sparkles, AlertTriangle, Users, Home, Wallet, Trophy, Clock, Calendar, Timer, Target, Landmark } from "lucide-react";
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
    name: "Modo Moderado",
    subtitle: "Limite de até R$ 250/dia",
    subtitleColor: "#94A3B8",
    description: "O sistema passa a buscar operações maiores com mais frequência. É como aumentar o ritmo do motor — com segurança e constância.",
    price: 47,
    installments: "5x de R$ 9,90",
    border: "1px solid rgba(255,255,255,0.08)",
    btnBg: "transparent",
    btnColor: "#94A3B8",
    btnBorder: "1.5px solid #94A3B8",
    btnText: "LIBERAR ESTE LIMITE",
    badge: null,
    checkoutUrl: "https://pay.kirvano.com/b61b6335-9325-4ecb-9b87-8214d948e90e",
  },
  {
    id: "ouro",
    icon: Crown,
    name: "Modo Avançado",
    subtitle: "Limite de até R$ 500/dia",
    subtitleColor: "#FACC15",
    description: "Além de operar com mais força, o sistema ganha um 'vigia' automático que monitora tudo 24h. Você não precisa fazer nada — ele cuida de tudo.",
    price: 67,
    installments: "7x de R$ 9,90",
    border: "2px solid #FACC15",
    btnBg: "linear-gradient(135deg, #FACC15, #EAB308)",
    btnColor: "#020617",
    btnBorder: "none",
    btnText: "LIBERAR ESTE LIMITE",
    badge: "⭐ MAIS ESCOLHIDO",
    checkoutUrl: "https://pay.kirvano.com/2f8e1d23-b71c-4c4b-9da1-672a6ca75c9b",
  },
  {
    id: "diamante",
    icon: Diamond,
    name: "Modo Máximo",
    subtitle: "Sem limite de ganho diário",
    subtitleColor: "#60A5FA",
    description: "O sistema opera no máximo, 24 horas por dia, sem teto. Você ainda recebe um relatório semanal no WhatsApp com tudo que o sistema fez por você.",
    price: 97,
    installments: "10x de R$ 9,90",
    border: "1px solid rgba(96,165,250,0.25)",
    btnBg: "linear-gradient(135deg, #3B82F6, #2563EB)",
    btnColor: "#fff",
    btnBorder: "none",
    btnText: "LIBERAR ESTE LIMITE",
    badge: null,
    checkoutUrl: "https://pay.kirvano.com/e7d1995f-9b55-47d0-a1c4-762b07721162",
  },
];

/* ── Quiz Questions (matching reference pattern) ── */

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
  3: Q1 (profile type)
  4: Q1 Confirmation
  5: Q2 (financial situation)
  6: Q2 Confirmation
  7: Q3 (biggest goal)
  8: Q3 Confirmation
  9: Q4 (timeline)
  10: Q4 Confirmation + Analysis
  11: Plan projection ("Seu plano")
  12: Problem reveal ("Mas tem um problema")
  13: Final offer (plans)
── */

const TOTAL_DOTS = 18;
const TOTAL_QUESTIONS = 4;

const UpsellMultiplicador = ({ name: propName, onNext, onDecline }: Props) => {
  const existingName = propName !== "Visitante" ? propName : "";
  const [step, setStep] = useState(1);
  const [userName, setUserName] = useState(existingName);
  const [nameInput, setNameInput] = useState(existingName);
  const [answers, setAnswers] = useState({ profile: "", situation: "", goal: "", timeline: "" });
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
      // Determine recommendation
      let rec = "ouro";
      if (answers.profile === "conservador" && answers.timeline === "longo") rec = "prata";
      else if (answers.profile === "agressivo" || answers.timeline === "urgente") rec = "diamante";
      setRecommendedPlan(rec);
      setStep(11);
    }, 4500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5); };
  }, [step, answers]);

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

  /* ── Helper: get which question number (for progress bar) ── */
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
      {/* Progress bar */}
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
  const activeDot = step;

  /* ── Goal label helpers ── */
  const goalLabel = (id: string) => {
    const m: Record<string, string> = { contas: "Pagar dívidas", renda: "Renda extra", liberdade: "Liberdade financeira", familia: "Deixar um legado" };
    return m[id] || id;
  };
  const timelineLabel = (id: string) => {
    const m: Record<string, string> = { urgente: "menos de 6 meses", medio: "6 a 12 meses", longo: "1 a 2 anos" };
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

  /* ── Projections based on answers ── */
  const getDailyProjection = () => {
    if (answers.profile === "agressivo") return "R$ 180";
    if (answers.profile === "equilibrado") return "R$ 120";
    return "R$ 75";
  };
  const getGoalAmount = () => {
    const m: Record<string, string> = { contas: "R$ 5.000", renda: "R$ 3.000/mês", liberdade: "R$ 10.000/mês", familia: "R$ 50.000" };
    return m[answers.goal] || "R$ 5.000";
  };
  const getTimeToGoal = () => {
    if (answers.profile === "agressivo") return "3 meses";
    if (answers.profile === "equilibrado") return "5 meses";
    return "8 meses";
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

          {/* ═══ STEP 8: Q3 Confirmation ═══ */}
          {step === 8 && renderConfirmationStep("goal", answers.goal)}

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

              {/* Analysis card */}
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

              {/* Goal card */}
              <div className="p-5 rounded-xl space-y-3" style={{ background: "#0F172A", border: "1px solid rgba(255,255,255,0.08)" }}>
                <p className="text-[15px]" style={{ color: "#CBD5E1" }}>
                  Para alcançar <strong style={{ color: "#F8FAFC" }}>{goalLabel(answers.goal)}</strong> em <strong style={{ color: "#F8FAFC" }}>{timelineLabel(answers.timeline)}</strong>...
                </p>
                <p className="text-[14px]" style={{ color: "#94A3B8" }}>
                  Você precisa gerar aproximadamente:
                </p>
                <p className="text-[36px] font-extrabold text-center" style={{ color: "#22C55E" }}>
                  {getGoalAmount()}
                </p>
              </div>

              {/* Current AI projection */}
              <div className="p-5 rounded-xl space-y-2" style={{ background: "#0F172A", border: "1px solid rgba(255,255,255,0.08)" }}>
                <p className="text-[14px]" style={{ color: "#CBD5E1" }}>
                  Com sua IA atual (ganhos diários):
                </p>
                <p className="text-[14px]" style={{ color: "#F8FAFC" }}>
                  → Gerando em média <strong style={{ color: "#22C55E" }}>R$ 25/dia</strong>
                </p>
                <p className="text-[14px]" style={{ color: "#F8FAFC" }}>
                  → Alcança sua meta em <strong style={{ color: "#EF4444" }}>mais de 12 meses</strong>
                </p>
              </div>

              {/* Bar chart simulation */}
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
                Você está <span style={{ color: "#22C55E" }}>MUITO PERTO</span> da sua meta.
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

          {/* ═══ STEP 13: Oferta final — Planos ═══ */}
          {step === 13 && (
            <div className="space-y-5">
              <div className="text-center">
                <h2 className="text-[22px] font-extrabold leading-tight" style={{ color: "#F8FAFC" }}>
                  {userName}, escolha seu novo limite:
                </h2>
                <p className="text-[13px] mt-2 leading-relaxed" style={{ color: "#94A3B8" }}>
                  Baseado no seu perfil, o sistema recomendou a melhor opção pra você.
                  <strong style={{ color: "#FACC15" }}> Pagamento único, sem mensalidade.</strong>
                </p>
              </div>

              {/* Current limit warning */}
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}>
                <AlertTriangle className="w-5 h-5 shrink-0" style={{ color: "#EF4444" }} />
                <p className="text-[12px] leading-snug" style={{ color: "#FCA5A5" }}>
                  Limite atual: <strong>R$ 25/dia</strong> (modo proteção). Sem upgrade, seus ganhos ficam travados nesse teto.
                </p>
              </div>

              {/* Explanation */}
              <div className="p-3.5 rounded-xl" style={{ background: "rgba(250,204,21,0.06)", border: "1px solid rgba(250,204,21,0.12)" }}>
                <p className="text-[13px] leading-relaxed" style={{ color: "#FACC15" }}>
                  💡 <strong>Por que existe uma taxa?</strong>
                </p>
                <p className="text-[12px] mt-1 leading-relaxed" style={{ color: "#94A3B8" }}>
                  Operações com limites maiores exigem mais poder de processamento dos nossos servidores. 
                  Essa taxa cobre o custo de infraestrutura — e é cobrada <strong style={{ color: "#F8FAFC" }}>apenas uma vez</strong>.
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
                      <p className="text-[13px] font-semibold" style={{ color: plan.subtitleColor }}>
                        {plan.subtitle}
                      </p>
                      <p className="text-[13px] mt-3 leading-relaxed" style={{ color: "#94A3B8" }}>
                        {plan.description}
                      </p>

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

              <button
                onClick={() => {
                  saveFunnelEvent("upsell_oneclick_decline", { page: "/upsell2" });
                  logAuditEvent({ eventType: "upsell_oneclick_decline", pageId: "/upsell2" });
                  onDecline();
                }}
                className="text-[12px] underline cursor-pointer bg-transparent border-none mx-auto block py-2"
                style={{ color: "#475569" }}
              >
                Não, obrigado. Prefiro manter o limite de R$ 25/dia por enquanto.
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
