import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Crown, Diamond, Check, ArrowRight, Target, Clock, TrendingUp, Zap, Loader2, ChevronRight, Sparkles } from "lucide-react";
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
    name: "Plano Prata",
    subtitle: "Ganhe até R$ 250 por dia",
    subtitleColor: "#94A3B8",
    description:
      "O sistema passa a buscar ganhos maiores pra você, mas ainda com bastante cuidado. É como trocar a marcha do carro — você anda mais rápido, mas com segurança.",
    price: 47,
    installments: "5x de R$ 9,90",
    border: "1px solid rgba(255,255,255,0.08)",
    btnBg: "transparent",
    btnColor: "#94A3B8",
    btnBorder: "1.5px solid #94A3B8",
    btnText: "ATIVAR PLANO PRATA",
    badge: null,
    goalMatch: "100-250",
    checkoutUrl: "https://pay.kirvano.com/b61b6335-9325-4ecb-9b87-8214d948e90e",
  },
  {
    id: "ouro",
    icon: Crown,
    name: "Plano Ouro",
    subtitle: "Ganhe até R$ 500 por dia",
    subtitleColor: "#FACC15",
    description:
      "Além de buscar ganhos maiores, o sistema ganha um 'vigia' automático que fica de olho nas operações o dia todo. Você não precisa fazer nada — ele cuida de tudo pra você.",
    price: 67,
    installments: "7x de R$ 9,90",
    border: "2px solid #FACC15",
    btnBg: "linear-gradient(135deg, #FACC15, #EAB308)",
    btnColor: "#020617",
    btnBorder: "none",
    btnText: "ATIVAR PLANO OURO",
    badge: "⭐ MAIS ESCOLHIDO",
    goalMatch: "250-500",
    checkoutUrl: "https://pay.kirvano.com/2f8e1d23-b71c-4c4b-9da1-672a6ca75c9b",
  },
  {
    id: "diamante",
    icon: Diamond,
    name: "Plano Diamante",
    subtitle: "Ganhos sem limite",
    subtitleColor: "#60A5FA",
    description:
      "O sistema trabalha no máximo, 24 horas por dia, sem limite de ganho. Você ainda recebe um resumo toda semana no seu WhatsApp mostrando quanto ganhou.",
    price: 97,
    installments: "10x de R$ 9,90",
    border: "1px solid rgba(96,165,250,0.25)",
    btnBg: "linear-gradient(135deg, #3B82F6, #2563EB)",
    btnColor: "#fff",
    btnBorder: "none",
    btnText: "ATIVAR PLANO DIAMANTE",
    badge: null,
    goalMatch: "sem-limite",
    checkoutUrl: "https://pay.kirvano.com/e7d1995f-9b55-47d0-a1c4-762b07721162",
  },
];

// Quiz step data
const goalOptions = [
  { id: "100-250", label: "Até R$ 250 por dia", icon: "🎯", desc: "Crescimento seguro e constante" },
  { id: "250-500", label: "Até R$ 500 por dia", icon: "🚀", desc: "Ganhos maiores com monitoramento" },
  { id: "sem-limite", label: "Sem limite de ganho", icon: "💎", desc: "Máximo potencial, 24h por dia" },
];

const experienceOptions = [
  { id: "iniciante", label: "Estou começando agora", icon: "🌱", desc: "Quero ir no meu ritmo" },
  { id: "intermediario", label: "Já tenho alguma experiência", icon: "📊", desc: "Sei o básico de investimentos" },
  { id: "avancado", label: "Já conheço o mercado", icon: "⚡", desc: "Quero escalar rápido" },
];

const monitorOptions = [
  { id: "nenhum", label: "Prefiro não acompanhar", icon: "😌", desc: "O sistema cuida de tudo" },
  { id: "semanal", label: "Uma vez por semana", icon: "📅", desc: "Resumo semanal no WhatsApp" },
  { id: "diario", label: "Todo dia", icon: "📱", desc: "Quero ver tudo de perto" },
];

const TOTAL_STEPS = 6;

const UpsellMultiplicador = ({ name, onNext, onDecline }: Props) => {
  const firstName = name !== "Visitante" ? name : "";
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState({ goal: "", experience: "", monitor: "" });
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [recommendedPlan, setRecommendedPlan] = useState<string>("ouro");

  // Step 5: Loading animation
  useEffect(() => {
    if (step !== 5) return;
    setLoadingProgress(0);
    const interval = setInterval(() => {
      setLoadingProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          // Determine recommended plan based on answers
          let rec = "ouro";
          if (answers.goal === "100-250") rec = "prata";
          else if (answers.goal === "sem-limite") rec = "diamante";
          else if (answers.experience === "avancado") rec = "diamante";
          setRecommendedPlan(rec);
          setTimeout(() => setStep(6), 400);
          return 100;
        }
        return p + 2;
      });
    }, 60);
    return () => clearInterval(interval);
  }, [step, answers]);

  const goNext = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    setStep(s => s + 1);
  }, []);

  const selectOption = useCallback((key: string, value: string) => {
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

  // Progress dots
  const dots = Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1);

  const loadingMessages = [
    "Analisando seu perfil de investidor...",
    "Calculando o melhor plano pra você...",
    "Configurando o sistema...",
    "Quase pronto...",
  ];

  return (
    <div className="flex flex-col gap-4 pt-2">
      {/* Progress dots */}
      <div className="flex justify-center gap-1.5 mb-2">
        {dots.map(d => (
          <div
            key={d}
            className="h-1.5 rounded-full transition-all duration-300"
            style={{
              width: d === step ? 16 : 6,
              background: d <= step ? "linear-gradient(90deg, #16A34A, #22C55E)" : "rgba(255,255,255,0.08)",
            }}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
        >
          {/* STEP 1: Welcome / Confirmation */}
          {step === 1 && (
            <div className="text-center space-y-5">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-lg"
                style={{ background: "linear-gradient(135deg, #16A34A, #22C55E)" }}>
                <Check className="w-8 h-8 text-white" strokeWidth={3} />
              </div>
              <div>
                <h1 className="text-[22px] font-extrabold leading-tight" style={{ color: "#F8FAFC" }}>
                  {firstName ? `${firstName}, seu` : "Seu"} Acelerador está ativo!
                </h1>
                <p className="text-[14px] mt-3 leading-relaxed" style={{ color: "#94A3B8" }}>
                  Agora vamos configurar o <strong style={{ color: "#FACC15" }}>limite de ganho diário</strong> do seu sistema. 
                  Hoje ele está em <strong style={{ color: "#F8FAFC" }}>R$ 25/dia</strong> — que é o modo de proteção para iniciantes.
                </p>
                <p className="text-[13px] mt-3 leading-relaxed" style={{ color: "#64748B" }}>
                  Responda 3 perguntas rápidas para descobrir qual configuração é ideal pra você.
                </p>
              </div>
              <button
                onClick={goNext}
                className="w-full py-4 rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg, #16A34A, #22C55E)", color: "#fff" }}
              >
                CONFIGURAR MEU SISTEMA
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* STEP 2: Daily goal */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="text-center">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: "rgba(250,204,21,0.1)", border: "1px solid rgba(250,204,21,0.2)" }}>
                  <Target className="w-6 h-6" style={{ color: "#FACC15" }} />
                </div>
                <h2 className="text-[20px] font-extrabold" style={{ color: "#F8FAFC" }}>
                  Quanto você gostaria de ganhar por dia?
                </h2>
                <p className="text-[13px] mt-2" style={{ color: "#64748B" }}>
                  Isso define o limite do multiplicador do seu sistema.
                </p>
              </div>
              <div className="space-y-3">
                {goalOptions.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => selectOption("goal", opt.id)}
                    className="w-full text-left p-4 rounded-xl transition-all hover:brightness-110 active:scale-[0.98] flex items-center gap-4"
                    style={{
                      background: answers.goal === opt.id ? "rgba(22,163,74,0.15)" : "#0F172A",
                      border: answers.goal === opt.id ? "1.5px solid rgba(22,163,74,0.5)" : "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <span className="text-2xl">{opt.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-bold" style={{ color: "#F8FAFC" }}>{opt.label}</p>
                      <p className="text-[12px]" style={{ color: "#64748B" }}>{opt.desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 shrink-0" style={{ color: "#475569" }} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Experience level */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="text-center">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.2)" }}>
                  <TrendingUp className="w-6 h-6" style={{ color: "#60A5FA" }} />
                </div>
                <h2 className="text-[20px] font-extrabold" style={{ color: "#F8FAFC" }}>
                  Qual sua experiência com investimentos?
                </h2>
                <p className="text-[13px] mt-2" style={{ color: "#64748B" }}>
                  O sistema se adapta ao seu nível para você se sentir confortável.
                </p>
              </div>
              <div className="space-y-3">
                {experienceOptions.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => selectOption("experience", opt.id)}
                    className="w-full text-left p-4 rounded-xl transition-all hover:brightness-110 active:scale-[0.98] flex items-center gap-4"
                    style={{
                      background: answers.experience === opt.id ? "rgba(96,165,250,0.15)" : "#0F172A",
                      border: answers.experience === opt.id ? "1.5px solid rgba(96,165,250,0.5)" : "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <span className="text-2xl">{opt.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-bold" style={{ color: "#F8FAFC" }}>{opt.label}</p>
                      <p className="text-[12px]" style={{ color: "#64748B" }}>{opt.desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 shrink-0" style={{ color: "#475569" }} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: Monitoring preference */}
          {step === 4 && (
            <div className="space-y-5">
              <div className="text-center">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: "rgba(22,163,74,0.1)", border: "1px solid rgba(22,163,74,0.2)" }}>
                  <Clock className="w-6 h-6" style={{ color: "#22C55E" }} />
                </div>
                <h2 className="text-[20px] font-extrabold" style={{ color: "#F8FAFC" }}>
                  Como quer acompanhar seus ganhos?
                </h2>
                <p className="text-[13px] mt-2" style={{ color: "#64748B" }}>
                  Escolha como prefere receber atualizações do sistema.
                </p>
              </div>
              <div className="space-y-3">
                {monitorOptions.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => selectOption("monitor", opt.id)}
                    className="w-full text-left p-4 rounded-xl transition-all hover:brightness-110 active:scale-[0.98] flex items-center gap-4"
                    style={{
                      background: answers.monitor === opt.id ? "rgba(22,163,74,0.15)" : "#0F172A",
                      border: answers.monitor === opt.id ? "1.5px solid rgba(22,163,74,0.5)" : "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <span className="text-2xl">{opt.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-bold" style={{ color: "#F8FAFC" }}>{opt.label}</p>
                      <p className="text-[12px]" style={{ color: "#64748B" }}>{opt.desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 shrink-0" style={{ color: "#475569" }} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5: Loading / Analysis */}
          {step === 5 && (
            <div className="text-center space-y-6 py-8">
              <div className="relative w-20 h-20 mx-auto">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="35" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
                  <circle
                    cx="40" cy="40" r="35" fill="none" stroke="#16A34A" strokeWidth="4"
                    strokeDasharray={`${2 * Math.PI * 35}`}
                    strokeDashoffset={`${2 * Math.PI * 35 * (1 - loadingProgress / 100)}`}
                    strokeLinecap="round"
                    className="transition-all duration-100"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[18px] font-bold" style={{ color: "#F8FAFC" }}>
                    {loadingProgress}%
                  </span>
                </div>
              </div>

              <div>
                <h2 className="text-[18px] font-bold" style={{ color: "#F8FAFC" }}>
                  {loadingProgress < 30
                    ? loadingMessages[0]
                    : loadingProgress < 60
                    ? loadingMessages[1]
                    : loadingProgress < 90
                    ? loadingMessages[2]
                    : loadingMessages[3]}
                </h2>
              </div>

              {/* Summary of answers */}
              <div className="space-y-2 mt-4">
                {answers.goal && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: loadingProgress > 10 ? 1 : 0, x: 0 }}
                    className="flex items-center gap-2 justify-center"
                  >
                    <Check className="w-4 h-4" style={{ color: "#22C55E" }} />
                    <span className="text-[13px]" style={{ color: "#94A3B8" }}>Meta diária definida</span>
                  </motion.div>
                )}
                {answers.experience && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: loadingProgress > 35 ? 1 : 0, x: 0 }}
                    className="flex items-center gap-2 justify-center"
                  >
                    <Check className="w-4 h-4" style={{ color: "#22C55E" }} />
                    <span className="text-[13px]" style={{ color: "#94A3B8" }}>Perfil de investidor analisado</span>
                  </motion.div>
                )}
                {answers.monitor && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: loadingProgress > 60 ? 1 : 0, x: 0 }}
                    className="flex items-center gap-2 justify-center"
                  >
                    <Check className="w-4 h-4" style={{ color: "#22C55E" }} />
                    <span className="text-[13px]" style={{ color: "#94A3B8" }}>Preferência de acompanhamento salva</span>
                  </motion.div>
                )}
              </div>
            </div>
          )}

          {/* STEP 6: Plans reveal */}
          {step === 6 && (
            <div className="space-y-5">
              {/* Result header */}
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.1 }}
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: "linear-gradient(135deg, #FACC15, #EAB308)" }}
                >
                  <Sparkles className="w-7 h-7" style={{ color: "#020617" }} />
                </motion.div>
                <h2 className="text-[20px] font-extrabold" style={{ color: "#F8FAFC" }}>
                  {firstName ? `${firstName}, ` : ""}seu plano ideal está pronto!
                </h2>
                <p className="text-[13px] mt-2 leading-relaxed" style={{ color: "#94A3B8" }}>
                  Com base nas suas respostas, o sistema identificou a melhor configuração pra você.
                  Escolha o plano e ative agora — <strong style={{ color: "#FACC15" }}>leva menos de 1 minuto</strong>.
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
                          ✨ RECOMENDADO PRA VOCÊ
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

                      <div className="flex items-center gap-2.5 mb-1">
                        <plan.icon className="w-5 h-5" style={{ color: plan.subtitleColor }} />
                        <h3 className="text-[17px] font-bold" style={{ color: "#F8FAFC" }}>
                          {plan.name}
                        </h3>
                      </div>
                      <p className="text-[13px] font-medium" style={{ color: plan.subtitleColor }}>
                        {plan.subtitle}
                      </p>
                      <p className="text-[13px] mt-3 leading-relaxed" style={{ color: "#94A3B8" }}>
                        {plan.description}
                      </p>

                      <div className="mt-4 flex items-baseline gap-2">
                        <span className="text-[28px] font-extrabold" style={{ color: "#F8FAFC" }}>
                          R$ {plan.price}
                        </span>
                        <span className="text-[12px]" style={{ color: "#64748B" }}>
                          ou {plan.installments}
                        </span>
                      </div>

                      <button
                        id={`btn-${plan.id}`}
                        onClick={() => handleSelectPlan(plan)}
                        className="w-full mt-4 py-[14px] rounded-xl font-bold text-[15px] transition-all hover:brightness-110 active:scale-[0.98]"
                        style={{
                          background: isRecommended
                            ? "linear-gradient(135deg, #16A34A, #22C55E)"
                            : plan.btnBg,
                          color: isRecommended ? "#fff" : plan.btnColor,
                          border: isRecommended ? "none" : plan.btnBorder,
                        }}
                      >
                        {plan.btnText}
                      </button>
                    </motion.div>
                  );
                })}

              <button
                onClick={() => {
                  saveFunnelEvent("upsell_oneclick_decline", { page: "/upsell2" });
                  logAuditEvent({ eventType: "upsell_oneclick_decline", pageId: "/upsell2" });
                  onDecline();
                }}
                className="text-[12px] underline cursor-pointer bg-transparent border-none mx-auto block py-2"
                style={{ color: "#475569" }}
              >
                Não, obrigado. Prefiro manter o limite de R$25/dia por enquanto.
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default UpsellMultiplicador;
