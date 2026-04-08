import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Clock, Users, Shield, Lock, Sparkles, Info } from "lucide-react";
import { useLanguage, LanguageSelector } from "@/lib/i18n";
import { saveFunnelEventReliable } from "@/lib/metricsClient";
import { sendCAPIInitiateCheckout } from "@/lib/facebookCAPI";
import { trackTikTokInitiateCheckout } from "@/lib/tiktokPixel";
import { trackMetaInitiateCheckout } from "@/lib/metaPixel";
import { buildTrackingQueryString, ensureUrlHasTrackingParams } from "@/lib/trackingDataLayer";
import chatgptIcon from "@/assets/chatgpt-icon.png";

const PLANS = [
  {
    id: "starter",
    checkoutUrl: "https://pay.kirvano.com/4630333d-d5d1-4591-b767-2151f77c6b13",
    price: 37,
    originalPrice: 97,
    popular: false,
    isLimited: true,
  },
  {
    id: "essencial",
    checkoutUrl: "https://pay.kirvano.com/a404a378-2a59-4efd-86a8-dc57363c054c",
    price: 47,
    originalPrice: 197,
    popular: true,
    isLimited: false,
  },
  {
    id: "profissional",
    checkoutUrl: "https://pay.kirvano.com/b9bbad45-8e94-40c0-b910-73e814b03c8c",
    price: 97,
    originalPrice: 397,
    popular: false,
    isLimited: false,
  },
  {
    id: "vip",
    checkoutUrl: "https://pay.kirvano.com/4feda4e1-966a-400c-9b34-a68e9ca0fbb1",
    price: 197,
    originalPrice: 697,
    popular: false,
    isLimited: false,
  },
];

const texts = {
  pt: {
    brand: "ChatGPT",
    title: "Preços",
    subtitle: "Ative sua chave de acesso à IA que faz a Plataforma de Tempo Livre funcionar.",
    plans: [
      {
        name: "Starter",
        tagline: "Teste a IA por 3 meses",
        prefix: "",
        features: [
          { text: "Token de acesso ao ChatGPT por 3 meses", info: "Você recebe uma chave válida por 90 dias para usar todas as funções da IA.", highlight: false },
          { text: "Treinamento básico de uso da IA", info: "Aulas em vídeo simples e diretas, feitas para iniciantes.", highlight: false },
          { text: "Suporte por e-mail", info: "Tire dúvidas enviando um e-mail para nossa equipe.", highlight: false },
          { text: "Comunidade de membros", info: "Grupo exclusivo para trocar experiências com outros alunos.", highlight: false },
        ],
      },
      {
        name: "Essencial",
        tagline: "Sua chave vitalícia da IA",
        prefix: "",
        features: [
          { text: "Token de acesso VITALÍCIO ao ChatGPT", info: "Sua chave nunca expira. Pague uma vez e use para sempre, sem mensalidades.", highlight: true },
          { text: "Treinamento completo da plataforma", info: "Todas as aulas do básico ao avançado, com passo a passo detalhado.", highlight: false },
          { text: "Suporte por e-mail", info: "Tire dúvidas enviando um e-mail para nossa equipe.", highlight: false },
          { text: "Atualizações gratuitas do sistema", info: "Sempre que a plataforma melhorar, você recebe a atualização sem pagar nada.", highlight: false },
          { text: "Comunidade de membros", info: "Grupo exclusivo para trocar experiências com outros alunos.", highlight: false },
        ],
      },
      {
        name: "Profissional",
        tagline: "IA turbinada + acompanhamento",
        prefix: "Tudo do Essencial, mais:",
        features: [
          { text: "Chave com acesso a 3 projetos simultâneos", info: "Use a IA em até 3 projetos ao mesmo tempo para ganhar mais.", highlight: false },
          { text: "Acompanhamento individual por 30 dias", info: "Um especialista acompanha seu progresso pessoalmente durante 1 mês.", highlight: true },
          { text: "Mentoria em grupo semanal", info: "Toda semana, uma aula ao vivo para tirar dúvidas e ver estratégias.", highlight: false },
          { text: "Templates prontos de comandos para a IA", info: "Modelos prontos para copiar e colar na IA e já começar a ganhar.", highlight: false },
          { text: "Suporte prioritário via WhatsApp", info: "Respostas rápidas direto no seu WhatsApp, sem espera.", highlight: false },
          { text: "Bônus: Guia de Escala Rápida com IA", info: "E-book exclusivo com estratégias para aumentar seus ganhos rapidamente.", highlight: false },
        ],
      },
      {
        name: "VIP",
        tagline: "Acesso máximo + mentoria exclusiva",
        prefix: "Tudo do Profissional, mais:",
        features: [
          { text: "Chave com projetos ILIMITADOS na IA", info: "Sem limite de projetos. Use a IA em quantos quiser, para sempre.", highlight: true },
          { text: "Mentoria 1-a-1 por 60 dias", info: "Acompanhamento individual e exclusivo com um mentor por 2 meses.", highlight: true },
          { text: "Acesso antecipado a novas funcionalidades", info: "Seja o primeiro a testar novos recursos antes de todo mundo.", highlight: false },
          { text: "Grupo VIP exclusivo", info: "Comunidade restrita com os alunos mais avançados e resultados.", highlight: false },
          { text: "Consultoria personalizada de estratégia com IA", info: "Plano de ação feito sob medida para o seu perfil e objetivos.", highlight: false },
          { text: "Bônus: Kit Completo de Automação com ChatGPT", info: "Pacote completo com templates, scripts e automações prontas.", highlight: false },
          { text: "Garantia estendida de 60 dias", info: "O dobro do prazo padrão para testar sem risco nenhum.", highlight: false },
        ],
      },
    ],
    cta: ["Ativar Starter", "Ativar Essencial", "Ativar Profissional", "Ativar VIP"],
    mostPopular: "Mais escolhido",
    urgencyTitle: "Oferta por tempo limitado",
    spots: "chaves restantes neste valor",
    guarantee: "Garantia incondicional de 30 dias. Se não funcionar para você, devolvemos 100% do seu dinheiro.",
    footer: "© 2026 — Plataforma de Ganhos com Tempo Livre • Todos os direitos reservados",
    secureCheckout: "Checkout 100% seguro",
    perAccess: "acesso único",
  },
  en: {
    brand: "ChatGPT",
    title: "Pricing",
    subtitle: "Activate your AI access key that powers the Free Time Platform.",
    plans: [
      {
        name: "Starter",
        tagline: "Try the AI for 3 months",
        prefix: "",
        features: [
          { text: "3-month ChatGPT access token", info: "A key valid for 90 days to use all AI features.", highlight: false },
          { text: "Basic AI usage training", info: "Simple video lessons designed for beginners.", highlight: false },
          { text: "Email support", info: "Get help by emailing our team.", highlight: false },
          { text: "Members community", info: "Exclusive group to share experiences.", highlight: false },
        ],
      },
      {
        name: "Essential",
        tagline: "Your lifetime AI key",
        prefix: "",
        features: [
          { text: "LIFETIME ChatGPT access token", info: "Your key never expires. Pay once and use forever, no subscriptions.", highlight: true },
          { text: "Complete platform training", info: "All lessons from basic to advanced, step by step.", highlight: false },
          { text: "Email support", info: "Get help by emailing our team.", highlight: false },
          { text: "Free system updates", info: "Every platform improvement is included at no extra cost.", highlight: false },
          { text: "Members community", info: "Exclusive group to share experiences.", highlight: false },
        ],
      },
      {
        name: "Professional",
        tagline: "Turbocharged AI + guidance",
        prefix: "Everything in Essential, plus:",
        features: [
          { text: "Key with access to 3 simultaneous projects", info: "Use the AI on up to 3 projects at the same time.", highlight: false },
          { text: "30-day individual follow-up", info: "A specialist follows your progress personally for 1 month.", highlight: true },
          { text: "Weekly group mentoring", info: "Live weekly sessions for questions and strategies.", highlight: false },
          { text: "Ready-made AI command templates", info: "Copy-paste templates to start earning with AI right away.", highlight: false },
          { text: "Priority WhatsApp support", info: "Fast responses directly on your WhatsApp.", highlight: false },
          { text: "Bonus: Quick Scale Guide with AI", info: "Exclusive e-book with strategies to scale your earnings.", highlight: false },
        ],
      },
      {
        name: "VIP",
        tagline: "Maximum access + exclusive mentoring",
        prefix: "Everything in Professional, plus:",
        features: [
          { text: "Key with UNLIMITED AI projects", info: "No project limits. Use the AI on as many as you want, forever.", highlight: true },
          { text: "60-day 1-on-1 mentoring", info: "Exclusive individual mentoring with a specialist for 2 months.", highlight: true },
          { text: "Early access to new features", info: "Be the first to test new features before everyone.", highlight: false },
          { text: "Exclusive VIP group", info: "Restricted community with the most advanced students.", highlight: false },
          { text: "Personalized AI strategy consulting", info: "Custom action plan tailored to your profile and goals.", highlight: false },
          { text: "Bonus: Complete ChatGPT Automation Kit", info: "Full package with templates, scripts and ready automations.", highlight: false },
          { text: "Extended 60-day guarantee", info: "Double the standard period to test risk-free.", highlight: false },
        ],
      },
    ],
    cta: ["Get Starter", "Get Essential", "Get Professional", "Get VIP"],
    mostPopular: "Most popular",
    urgencyTitle: "Limited time offer",
    spots: "keys left at this price",
    guarantee: "Unconditional 30-day guarantee. If it doesn't work for you, we refund 100% of your money.",
    footer: "© 2026 — Free Time Earnings Platform • All rights reserved",
    secureCheckout: "100% secure checkout",
    perAccess: "one-time access",
  },
  es: {
    brand: "ChatGPT",
    title: "Precios",
    subtitle: "Activá tu clave de acceso a la IA que hace funcionar la Plataforma de Tiempo Libre.",
    plans: [
      {
        name: "Starter",
        tagline: "Probá la IA por 3 meses",
        prefix: "",
        features: [
          { text: "Token de acceso al ChatGPT por 3 meses", info: "Recibís una clave válida por 90 días para usar todas las funciones.", highlight: false },
          { text: "Entrenamiento básico de uso de la IA", info: "Clases en video simples y directas para principiantes.", highlight: false },
          { text: "Soporte por email", info: "Sacá tus dudas enviando un email a nuestro equipo.", highlight: false },
          { text: "Comunidad de miembros", info: "Grupo exclusivo para compartir experiencias.", highlight: false },
        ],
      },
      {
        name: "Esencial",
        tagline: "Tu clave vitalicia de IA",
        prefix: "",
        features: [
          { text: "Token de acceso VITALICIO al ChatGPT", info: "Tu clave nunca expira. Pagás una vez y usás para siempre.", highlight: true },
          { text: "Entrenamiento completo de la plataforma", info: "Todas las clases del básico al avanzado, paso a paso.", highlight: false },
          { text: "Soporte por email", info: "Sacá tus dudas enviando un email a nuestro equipo.", highlight: false },
          { text: "Actualizaciones gratuitas del sistema", info: "Cada mejora de la plataforma la recibís sin pagar nada más.", highlight: false },
          { text: "Comunidad de miembros", info: "Grupo exclusivo para compartir experiencias.", highlight: false },
        ],
      },
      {
        name: "Profesional",
        tagline: "IA turbo + acompañamiento",
        prefix: "Todo del Esencial, más:",
        features: [
          { text: "Clave con acceso a 3 proyectos simultáneos", info: "Usá la IA en hasta 3 proyectos al mismo tiempo.", highlight: false },
          { text: "Acompañamiento individual por 30 días", info: "Un especialista sigue tu progreso personalmente durante 1 mes.", highlight: true },
          { text: "Mentoría grupal semanal", info: "Cada semana, una clase en vivo para preguntas y estrategias.", highlight: false },
          { text: "Templates de comandos listos para la IA", info: "Modelos listos para copiar y pegar en la IA y empezar a ganar.", highlight: false },
          { text: "Soporte prioritario por WhatsApp", info: "Respuestas rápidas directo en tu WhatsApp.", highlight: false },
          { text: "Bono: Guía de Escala Rápida con IA", info: "E-book exclusivo con estrategias para escalar tus ganancias.", highlight: false },
        ],
      },
      {
        name: "VIP",
        tagline: "Acceso máximo + mentoría exclusiva",
        prefix: "Todo del Profesional, más:",
        features: [
          { text: "Clave con proyectos ILIMITADOS en la IA", info: "Sin límite de proyectos. Usá la IA en cuantos quieras, para siempre.", highlight: true },
          { text: "Mentoría 1-a-1 por 60 días", info: "Acompañamiento individual y exclusivo con un mentor por 2 meses.", highlight: true },
          { text: "Acceso anticipado a nuevas funcionalidades", info: "Sé el primero en probar nuevos recursos.", highlight: false },
          { text: "Grupo VIP exclusivo", info: "Comunidad restringida con los alumnos más avanzados.", highlight: false },
          { text: "Consultoría personalizada de estrategia con IA", info: "Plan de acción hecho a medida para tu perfil y objetivos.", highlight: false },
          { text: "Bono: Kit Completo de Automatización con ChatGPT", info: "Paquete completo con templates, scripts y automatizaciones.", highlight: false },
          { text: "Garantía extendida de 60 días", info: "El doble del plazo estándar para probar sin riesgo.", highlight: false },
        ],
      },
    ],
    cta: ["Activar Starter", "Activar Esencial", "Activar Profesional", "Activar VIP"],
    mostPopular: "Más elegido",
    urgencyTitle: "Oferta por tiempo limitado",
    spots: "claves restantes a este precio",
    guarantee: "Garantía incondicional de 30 días. Si no funciona para vos, te devolvemos el 100% de tu dinero.",
    footer: "© 2026 — Plataforma Ganancias con Tiempo Libre • Todos los derechos reservados",
    secureCheckout: "Checkout 100% seguro",
    perAccess: "acceso único",
  },
};

type Feature = { text: string; info: string; highlight: boolean };

const InfoTooltip = ({ info }: { info: string }) => {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    // Calculate position based on button
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + 8,
        left: Math.max(16, Math.min(rect.left - 100, window.innerWidth - 280)),
      });
    }
    const handler = (e: MouseEvent | TouchEvent) => {
      if (btnRef.current && !btnRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [open]);

  return (
    <span className="inline-flex align-middle">
      <button
        ref={btnRef}
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="ml-1 text-black/25 hover:text-black/50 transition-colors p-1 -m-1"
        aria-label="Mais informações"
      >
        <Info className="w-4 h-4" />
      </button>
      <AnimatePresence>
        {open && pos && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed z-[100] w-64 bg-black text-white text-sm leading-relaxed rounded-xl px-4 py-3 shadow-2xl"
            style={{ top: pos.top, left: pos.left, maxWidth: "calc(100vw - 2rem)" }}
          >
            {info}
            <button
              onClick={() => setOpen(false)}
              className="absolute top-2 right-3 text-white/50 text-lg leading-none"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
};

const Oferta = () => {
  const { lang } = useLanguage();
  const t = texts[lang];
  const icFiredRef = useRef(false);

  const [timeLeft, setTimeLeft] = useState(() => {
    const stored = sessionStorage.getItem("oferta_timer_end");
    if (stored) {
      const remaining = Math.max(0, Math.floor((parseInt(stored) - Date.now()) / 1000));
      return remaining > 0 ? remaining : 15 * 60;
    }
    const end = Date.now() + 15 * 60 * 1000;
    sessionStorage.setItem("oferta_timer_end", String(end));
    return 15 * 60;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev <= 0 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const [spots] = useState(() => Math.floor(Math.random() * 5) + 3);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const buildCheckoutURL = (plan: typeof PLANS[0]) => {
    const trackingQs = buildTrackingQueryString();
    const checkoutParams = new URLSearchParams(trackingQs.startsWith("?") ? trackingQs.slice(1) : trackingQs);
    checkoutParams.set("plan", plan.id);
    const qs = checkoutParams.toString();
    return `${plan.checkoutUrl}${qs ? `?${qs}` : ""}`;
  };

  const handlePlanClick = (plan: typeof PLANS[0]) => {
    if (!icFiredRef.current) {
      icFiredRef.current = true;
      saveFunnelEventReliable("checkout_click", {
        context: "oferta_page",
        plan: plan.id,
        amount: plan.price,
        product: plan.id,
      });
      sendCAPIInitiateCheckout({ amount: plan.price, plan: plan.id });
      trackTikTokInitiateCheckout({ amount: plan.price, contentId: plan.id });
      trackMetaInitiateCheckout({ amount: plan.price, contentId: plan.id });
    }
    window.open(buildCheckoutURL(plan), "_blank");
  };

  return (
    <div className="min-h-screen bg-white text-black" style={{ fontFamily: "'Source Sans 3', system-ui, sans-serif" }}>
      {/* Urgency bar — only subtle addition */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black text-white">
        <div className="max-w-6xl mx-auto flex items-center justify-center gap-4 px-4 py-2">
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 opacity-60" />
            <span className="text-xs opacity-70">{t.urgencyTitle}</span>
            <span className="text-sm font-bold tabular-nums">{formatTime(timeLeft)}</span>
          </div>
          <span className="hidden sm:inline opacity-20">|</span>
          <div className="hidden sm:flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 opacity-50" />
            <span className="text-xs opacity-60">{spots} {t.spots}</span>
          </div>
          <div className="ml-auto">
            <LanguageSelector className="shrink-0" />
          </div>
        </div>
      </div>

      {/* Header — ChatGPT style */}
      <header className="pt-24 pb-10 sm:pt-28 sm:pb-14 text-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center gap-3"
        >
          <div className="flex items-center gap-2">
            <img src={chatgptIcon} alt="ChatGPT" className="w-6 h-6 object-contain" />
            <span className="text-sm text-black/50 font-medium">{t.brand}</span>
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-black tracking-tight" style={{ fontFamily: "'Source Sans 3', system-ui, sans-serif" }}>
            {t.title}
          </h1>
          <p className="text-base sm:text-lg text-black/50 max-w-lg leading-relaxed mt-1">
            {t.subtitle.split("Plataforma de Tempo Livre").length > 1
              ? <>
                  {t.subtitle.split("Plataforma de Tempo Livre")[0]}
                  <span className="font-semibold text-black">Plataforma de Tempo Livre</span>
                  {t.subtitle.split("Plataforma de Tempo Livre")[1]}
                </>
              : t.subtitle.split("Free Time Platform").length > 1
              ? <>
                  {t.subtitle.split("Free Time Platform")[0]}
                  <span className="font-semibold text-black">Free Time Platform</span>
                  {t.subtitle.split("Free Time Platform")[1]}
                </>
              : t.subtitle.split("Plataforma de Tiempo Libre").length > 1
              ? <>
                  {t.subtitle.split("Plataforma de Tiempo Libre")[0]}
                  <span className="font-semibold text-black">Plataforma de Tiempo Libre</span>
                  {t.subtitle.split("Plataforma de Tiempo Libre")[1]}
                </>
              : t.subtitle
            }
          </p>
        </motion.div>
      </header>

      {/* Main plan — Essencial R$47 HIGHLIGHTED */}
      <main className="max-w-lg mx-auto px-4 pb-10">
        {(() => {
          const essentialPlan = PLANS[1];
          const essentialText = t.plans[1];
          return (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="relative flex flex-col rounded-2xl border-2 border-black bg-white shadow-xl p-6 sm:p-8"
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black text-white text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">
                {t.mostPopular}
              </div>
              <h3 className="text-3xl font-bold text-black mt-2">{essentialText.name}</h3>
              <p className="text-sm text-black/50 mt-1">{essentialText.tagline}</p>

              <div className="mt-6 mb-6">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-5xl font-bold text-black tracking-tight">R${essentialPlan.price}</span>
                  <span className="text-sm text-black/40">/{t.perAccess}</span>
                </div>
                <span className="text-sm text-black/30 line-through mt-1 inline-block">R${essentialPlan.originalPrice}</span>
              </div>

              <button
                onClick={() => handlePlanClick(essentialPlan)}
                className="w-full py-4 rounded-full font-semibold text-base bg-black text-white hover:bg-black/85 transition-all active:scale-[0.97] mb-8"
              >
                {t.cta[1]} <span className="inline-block ml-0.5">↗</span>
              </button>

              <div className="space-y-3.5">
                {essentialText.features.map((feat: Feature, fi: number) => (
                  <div key={fi} className="flex items-start gap-2.5">
                    <Check className={`w-4 h-4 mt-0.5 shrink-0 ${feat.highlight ? "text-black" : "text-black/40"}`} />
                    <span className={`text-sm leading-snug ${feat.highlight ? "text-black font-semibold" : "text-black/70"}`}>
                      {feat.text}
                      <InfoTooltip info={feat.info} />
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })()}

        {/* Other plans — collapsed */}
        <details className="mt-8 group">
          <summary className="cursor-pointer text-center text-sm text-black/40 hover:text-black/60 transition-colors py-3 list-none flex items-center justify-center gap-2">
            <span>{lang === "en" ? "See other plans" : lang === "es" ? "Ver otros planes" : "Ver outros planos"}</span>
            <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          <div className="grid grid-cols-1 gap-4 mt-4">
            {PLANS.filter((_, i) => i !== 1).map((plan, idx) => {
              const originalIdx = plan.id === "starter" ? 0 : plan.id === "profissional" ? 2 : 3;
              const planText = t.plans[originalIdx];
              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex flex-col rounded-2xl border border-black/10 bg-white p-5"
                >
                  <div className="flex items-baseline justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-black">{planText.name}</h3>
                      <p className="text-xs text-black/40">{planText.tagline}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-black">R${plan.price}</span>
                      <span className="text-xs text-black/30 line-through ml-1">R${plan.originalPrice}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handlePlanClick(plan)}
                    className="w-full mt-4 py-2.5 rounded-full font-medium text-sm bg-white text-black border border-black/20 hover:bg-black/5 transition-all active:scale-[0.97]"
                  >
                    {t.cta[originalIdx]} <span className="inline-block ml-0.5">↗</span>
                  </button>
                </motion.div>
              );
            })}
          </div>
        </details>

        {/* Guarantee */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-14 flex flex-col items-center gap-3"
        >
          <div className="flex items-center gap-3 max-w-md text-center">
            <Shield className="w-5 h-5 text-black/25 shrink-0" />
            <p className="text-sm text-black/40 leading-relaxed">{t.guarantee}</p>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <Lock className="w-3 h-3 text-black/20" />
            <span className="text-xs text-black/25">{t.secureCheckout}</span>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-black/5 py-6">
        <p className="text-xs text-black/25 text-center">{t.footer}</p>
      </footer>
    </div>
  );
};

export default Oferta;
