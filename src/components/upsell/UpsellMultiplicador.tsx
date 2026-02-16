import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Crown, Diamond, Check, ArrowRight, Lock, TrendingUp, Zap, ChevronRight, Sparkles, AlertTriangle, Users } from "lucide-react";
import { saveUpsellExtras, getLeadName } from "@/lib/upsellData";
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
    goalMatch: "moderado",
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
    goalMatch: "avancado",
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
    goalMatch: "maximo",
    checkoutUrl: "https://pay.kirvano.com/e7d1995f-9b55-47d0-a1c4-762b07721162",
  },
];

// Step definitions
const situationOptions = [
  { id: "contas", label: "Pagar contas atrasadas", icon: "🏠", desc: "Resolver pendências financeiras" },
  { id: "renda-extra", label: "Ter uma renda extra mensal", icon: "💰", desc: "Complementar o salário" },
  { id: "liberdade", label: "Conquistar liberdade financeira", icon: "🌴", desc: "Não depender de ninguém" },
  { id: "familia", label: "Dar uma vida melhor pra família", icon: "❤️", desc: "Segurança pros meus" },
];

const timeOptions = [
  { id: "1h", label: "Até 1 hora por dia", icon: "⏰", desc: "Só nos intervalos" },
  { id: "2-3h", label: "De 2 a 3 horas por dia", icon: "📱", desc: "Tenho um tempo razoável" },
  { id: "livre", label: "Tempo livre o dia todo", icon: "☀️", desc: "Posso acompanhar quando quiser" },
];

const experienceOptions = [
  { id: "nunca", label: "Nunca investi na vida", icon: "🌱", desc: "Total iniciante" },
  { id: "pouco", label: "Já tentei, mas não deu certo", icon: "🔄", desc: "Tive experiências frustrantes" },
  { id: "alguma", label: "Tenho alguma experiência", icon: "📊", desc: "Sei o básico" },
];

const TOTAL_STEPS = 8;

const UpsellMultiplicador = ({ name: propName, onNext, onDecline }: Props) => {
  const existingName = propName !== "Visitante" ? propName : "";
  const [step, setStep] = useState(1);
  const [userName, setUserName] = useState(existingName);
  const [nameInput, setNameInput] = useState(existingName);
  const [answers, setAnswers] = useState({ situation: "", time: "", experience: "" });
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [recommendedPlan, setRecommendedPlan] = useState<string>("ouro");
  const [revealPhase, setRevealPhase] = useState(0);

  const firstName = userName || "Visitante";

  // Step 6: Loading animation
  useEffect(() => {
    if (step !== 6) return;
    setLoadingProgress(0);
    setRevealPhase(0);
    const interval = setInterval(() => {
      setLoadingProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          // Determine recommended plan
          let rec = "ouro";
          if (answers.experience === "nunca" && answers.time === "1h") rec = "prata";
          else if (answers.time === "livre" || answers.situation === "liberdade") rec = "diamante";
          setRecommendedPlan(rec);
          setTimeout(() => setStep(7), 500);
          return 100;
        }
        return p + 1.5;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [step, answers]);

  // Step 6: reveal phases
  useEffect(() => {
    if (step !== 6) return;
    const t1 = setTimeout(() => setRevealPhase(1), 800);
    const t2 = setTimeout(() => setRevealPhase(2), 2000);
    const t3 = setTimeout(() => setRevealPhase(3), 3200);
    const t4 = setTimeout(() => setRevealPhase(4), 4200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [step]);

  const goNext = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    setStep(s => s + 1);
  }, []);

  const selectOption = useCallback((key: string, value: string) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
      setStep(s => s + 1);
    }, 350);
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

  const dots = Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1);

  const loadingMessages = [
    "Cruzando dados do seu perfil...",
    "Analisando capacidade do sistema...",
    "Calculando limite ideal...",
    "Configurando plataforma...",
    "Finalizando...",
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
          {/* ─── STEP 1: Acelerador ativo + completar registro ─── */}
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

          {/* ─── STEP 2: Capturar nome ─── */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="text-center">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: "rgba(22,163,74,0.1)", border: "1px solid rgba(22,163,74,0.2)" }}>
                  <Users className="w-6 h-6" style={{ color: "#22C55E" }} />
                </div>
                <h2 className="text-[20px] font-extrabold" style={{ color: "#F8FAFC" }}>
                  Como podemos te chamar?
                </h2>
                <p className="text-[13px] mt-2" style={{ color: "#64748B" }}>
                  Precisamos do seu nome para registrar sua conta na plataforma.
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
                style={{ background: "linear-gradient(135deg, #16A34A, #22C55E)", color: "#fff" }}
              >
                CONTINUAR
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* ─── STEP 3: Situação / Objetivo ─── */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="text-center">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: "rgba(250,204,21,0.1)", border: "1px solid rgba(250,204,21,0.2)" }}>
                  <span className="text-2xl">🎯</span>
                </div>
                <h2 className="text-[20px] font-extrabold" style={{ color: "#F8FAFC" }}>
                  {userName}, o que te motivou a começar?
                </h2>
                <p className="text-[13px] mt-2" style={{ color: "#64748B" }}>
                  Isso ajuda o sistema a priorizar as operações certas pra você.
                </p>
              </div>
              <div className="space-y-3">
                {situationOptions.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => selectOption("situation", opt.id)}
                    className="w-full text-left p-4 rounded-xl transition-all hover:brightness-110 active:scale-[0.98] flex items-center gap-4"
                    style={{
                      background: "#0F172A",
                      border: "1px solid rgba(255,255,255,0.06)",
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

          {/* ─── STEP 4: Tempo disponível ─── */}
          {step === 4 && (
            <div className="space-y-5">
              <div className="text-center">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.2)" }}>
                  <span className="text-2xl">⏰</span>
                </div>
                <h2 className="text-[20px] font-extrabold" style={{ color: "#F8FAFC" }}>
                  Quanto tempo livre você tem por dia?
                </h2>
                <p className="text-[13px] mt-2" style={{ color: "#64748B" }}>
                  {userName}, o sistema se adapta à sua rotina. Não precisa parar o que faz.
                </p>
              </div>
              <div className="space-y-3">
                {timeOptions.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => selectOption("time", opt.id)}
                    className="w-full text-left p-4 rounded-xl transition-all hover:brightness-110 active:scale-[0.98] flex items-center gap-4"
                    style={{
                      background: "#0F172A",
                      border: "1px solid rgba(255,255,255,0.06)",
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

          {/* ─── STEP 5: Experiência ─── */}
          {step === 5 && (
            <div className="space-y-5">
              <div className="text-center">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: "rgba(22,163,74,0.1)", border: "1px solid rgba(22,163,74,0.2)" }}>
                  <TrendingUp className="w-6 h-6" style={{ color: "#22C55E" }} />
                </div>
                <h2 className="text-[20px] font-extrabold" style={{ color: "#F8FAFC" }}>
                  Você já investiu alguma vez, {userName}?
                </h2>
                <p className="text-[13px] mt-2" style={{ color: "#64748B" }}>
                  Pode ser sincero — o sistema funciona pra qualquer nível.
                </p>
              </div>
              <div className="space-y-3">
                {experienceOptions.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => selectOption("experience", opt.id)}
                    className="w-full text-left p-4 rounded-xl transition-all hover:brightness-110 active:scale-[0.98] flex items-center gap-4"
                    style={{
                      background: "#0F172A",
                      border: "1px solid rgba(255,255,255,0.06)",
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

          {/* ─── STEP 6: Análise animada ─── */}
          {step === 6 && (
            <div className="text-center space-y-6 py-6">
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
                    {Math.round(loadingProgress)}%
                  </span>
                </div>
              </div>

              <h2 className="text-[17px] font-bold" style={{ color: "#F8FAFC" }}>
                {loadingProgress < 20 ? loadingMessages[0]
                  : loadingProgress < 45 ? loadingMessages[1]
                  : loadingProgress < 70 ? loadingMessages[2]
                  : loadingProgress < 90 ? loadingMessages[3]
                  : loadingMessages[4]}
              </h2>

              <div className="space-y-2.5 mt-3">
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: revealPhase >= 1 ? 1 : 0, x: 0 }}
                  className="flex items-center gap-2 justify-center">
                  <Check className="w-4 h-4" style={{ color: "#22C55E" }} />
                  <span className="text-[13px]" style={{ color: "#94A3B8" }}>Conta de {userName} localizada</span>
                </motion.div>
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: revealPhase >= 2 ? 1 : 0, x: 0 }}
                  className="flex items-center gap-2 justify-center">
                  <Check className="w-4 h-4" style={{ color: "#22C55E" }} />
                  <span className="text-[13px]" style={{ color: "#94A3B8" }}>Perfil de investidor registrado</span>
                </motion.div>
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: revealPhase >= 3 ? 1 : 0, x: 0 }}
                  className="flex items-center gap-2 justify-center">
                  <Check className="w-4 h-4" style={{ color: "#22C55E" }} />
                  <span className="text-[13px]" style={{ color: "#94A3B8" }}>Acelerador verificado ✅</span>
                </motion.div>
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: revealPhase >= 4 ? 1 : 0, x: 0 }}
                  className="flex items-center gap-2 justify-center">
                  <AlertTriangle className="w-4 h-4" style={{ color: "#FACC15" }} />
                  <span className="text-[13px] font-medium" style={{ color: "#FACC15" }}>Limite diário: R$ 25 (modo proteção)</span>
                </motion.div>
              </div>
            </div>
          )}

          {/* ─── STEP 7: Explicação do limite + transição ─── */}
          {step === 7 && (
            <div className="space-y-5">
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.1 }}
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: "rgba(250,204,21,0.12)", border: "1.5px solid rgba(250,204,21,0.25)" }}
                >
                  <Lock className="w-7 h-7" style={{ color: "#FACC15" }} />
                </motion.div>

                <h2 className="text-[20px] font-extrabold leading-tight" style={{ color: "#F8FAFC" }}>
                  {userName}, seu sistema está limitado a R$ 25/dia
                </h2>

                <div className="mt-4 text-left space-y-3">
                  <p className="text-[14px] leading-relaxed" style={{ color: "#94A3B8" }}>
                    Quando você ativou o Acelerador, o sistema entrou no <strong style={{ color: "#F8FAFC" }}>modo de proteção</strong> — 
                    um limite de segurança de <strong style={{ color: "#FACC15" }}>R$ 25 por dia</strong>.
                  </p>
                  <p className="text-[14px] leading-relaxed" style={{ color: "#94A3B8" }}>
                    Esse limite existe por um motivo: <strong style={{ color: "#F8FAFC" }}>proteger iniciantes</strong> de 
                    se expor a operações maiores sem estarem preparados. É como uma trava de segurança num carro novo.
                  </p>

                  <div className="p-3.5 rounded-xl" style={{ background: "rgba(250,204,21,0.06)", border: "1px solid rgba(250,204,21,0.12)" }}>
                    <p className="text-[13px] leading-relaxed" style={{ color: "#FACC15" }}>
                      💡 <strong>Por que existe uma taxa para aumentar?</strong>
                    </p>
                    <p className="text-[13px] mt-1.5 leading-relaxed" style={{ color: "#94A3B8" }}>
                      Operações com limites maiores exigem mais poder de processamento dos nossos servidores. 
                      Essa taxa cobre o custo de infraestrutura pra manter o sistema funcionando em alta performance pra você — 
                      e é cobrada <strong style={{ color: "#F8FAFC" }}>apenas uma vez</strong>.
                    </p>
                  </div>

                  <p className="text-[14px] leading-relaxed" style={{ color: "#94A3B8" }}>
                    Com base no seu perfil, preparamos <strong style={{ color: "#22C55E" }}>3 opções de limite</strong> ideais pra você. 
                    Veja qual faz mais sentido:
                  </p>
                </div>
              </div>

              <button
                onClick={goNext}
                className="w-full py-4 rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg, #16A34A, #22C55E)", color: "#fff" }}
              >
                VER MEUS LIMITES DISPONÍVEIS
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* ─── STEP 8: Oferta dos planos ─── */}
          {step === 8 && (
            <div className="space-y-5">
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
                  {userName}, escolha seu novo limite:
                </h2>
                <p className="text-[13px] mt-2 leading-relaxed" style={{ color: "#94A3B8" }}>
                  Baseado no seu perfil, o sistema recomendou a melhor opção pra você.
                  Ative agora — <strong style={{ color: "#FACC15" }}>pagamento único, sem mensalidade</strong>.
                </p>
              </div>

              {/* Current limit warning */}
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}>
                <AlertTriangle className="w-5 h-5 shrink-0" style={{ color: "#EF4444" }} />
                <p className="text-[12px] leading-snug" style={{ color: "#FCA5A5" }}>
                  Limite atual: <strong>R$ 25/dia</strong> (modo proteção). Sem upgrade, seus ganhos ficam travados nesse teto.
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
    </div>
  );
};

export default UpsellMultiplicador;
