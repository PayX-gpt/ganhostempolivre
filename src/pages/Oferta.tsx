import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Check, Clock, Users, Shield, Lock, Sparkles, Star, Zap, Crown } from "lucide-react";
import { useLanguage, LanguageSelector } from "@/lib/i18n";
import { saveFunnelEventReliable } from "@/lib/metricsClient";
import { sendCAPIInitiateCheckout } from "@/lib/facebookCAPI";
import { trackTikTokInitiateCheckout } from "@/lib/tiktokPixel";
import chatgptIcon from "@/assets/chatgpt-icon.png";

const PLANS = [
  {
    id: "starter",
    checkoutUrl: "https://pay.kirvano.com/4630333d-d5d1-4591-b767-2151f77c6b13",
    price: 37,
    originalPrice: 97,
    popular: false,
    isLimited: true,
    accent: "from-white/5 to-white/[0.02]",
    border: "border-white/10",
    iconBg: "bg-white/10",
    checkColor: "text-white/40",
    btnClass: "bg-white/10 text-white border border-white/15 hover:bg-white/20",
  },
  {
    id: "essencial",
    checkoutUrl: "https://pay.kirvano.com/a404a378-2a59-4efd-86a8-dc57363c054c",
    price: 47,
    originalPrice: 197,
    popular: false,
    isLimited: false,
    accent: "from-blue-500/10 to-blue-600/5",
    border: "border-blue-500/20",
    iconBg: "bg-blue-500/15",
    checkColor: "text-blue-400",
    btnClass: "bg-blue-600 text-white hover:bg-blue-500",
  },
  {
    id: "profissional",
    checkoutUrl: "https://pay.kirvano.com/b9bbad45-8e94-40c0-b910-73e814b03c8c",
    price: 97,
    originalPrice: 397,
    popular: true,
    isLimited: false,
    accent: "from-emerald-500/15 to-emerald-600/5",
    border: "border-emerald-500/30",
    iconBg: "bg-emerald-500/15",
    checkColor: "text-emerald-400",
    btnClass: "bg-emerald-500 text-white hover:bg-emerald-400 shadow-lg shadow-emerald-500/25",
  },
  {
    id: "vip",
    checkoutUrl: "https://pay.kirvano.com/4feda4e1-966a-400c-9b34-a68e9ca0fbb1",
    price: 197,
    originalPrice: 697,
    popular: false,
    isLimited: false,
    accent: "from-amber-500/15 to-amber-600/5",
    border: "border-amber-500/25",
    iconBg: "bg-amber-500/15",
    checkColor: "text-amber-400",
    btnClass: "bg-gradient-to-r from-amber-500 to-amber-400 text-black font-semibold hover:from-amber-400 hover:to-amber-300 shadow-lg shadow-amber-500/20",
  },
];

const PLAN_ICONS = [Star, Zap, Sparkles, Crown];

const texts = {
  pt: {
    brand: "ChatGPT",
    title: "Escolha seu plano de acesso",
    subtitle: "Ative sua chave de inteligência artificial e comece a usar a plataforma hoje mesmo.",
    plans: [
      {
        name: "Starter",
        tagline: "Teste a IA por 3 meses",
        prefix: "",
        features: [
          "Token de acesso ao ChatGPT por 3 meses",
          "Treinamento básico de uso da IA",
          "Suporte por e-mail",
          "Comunidade de membros",
        ],
      },
      {
        name: "Essencial",
        tagline: "Sua chave vitalícia da IA",
        prefix: "",
        features: [
          "Token de acesso vitalício ao ChatGPT",
          "Treinamento completo da plataforma",
          "Suporte por e-mail",
          "Atualizações gratuitas do sistema",
          "Comunidade de membros",
        ],
      },
      {
        name: "Profissional",
        tagline: "IA turbinada + acompanhamento",
        prefix: "Tudo do Essencial, mais:",
        features: [
          "Chave com acesso a 3 projetos simultâneos",
          "Acompanhamento individual por 30 dias",
          "Mentoria em grupo semanal",
          "Templates prontos de comandos para a IA",
          "Suporte prioritário via WhatsApp",
          "Bônus: Guia de Escala Rápida com IA",
        ],
      },
      {
        name: "VIP",
        tagline: "Acesso máximo + mentoria exclusiva",
        prefix: "Tudo do Profissional, mais:",
        features: [
          "Chave com projetos ilimitados na IA",
          "Mentoria 1-a-1 por 60 dias",
          "Acesso antecipado a novas funcionalidades",
          "Grupo VIP exclusivo",
          "Consultoria personalizada de estratégia com IA",
          "Bônus: Kit Completo de Automação com ChatGPT",
          "Garantia estendida de 60 dias",
        ],
      },
    ],
    cta: "Ativar Chave de Acesso",
    mostPopular: "Mais escolhido",
    urgencyTitle: "Oferta por tempo limitado",
    spots: "chaves restantes neste valor",
    guarantee: "Garantia incondicional de 30 dias. Se não funcionar para você, devolvemos 100% do seu dinheiro.",
    footer: "© 2026 — Plataforma de Ganhos com Tempo Livre • Todos os direitos reservados",
    secureCheckout: "Checkout 100% seguro",
    perAccess: "acesso único",
    discount: "desconto",
  },
  en: {
    brand: "ChatGPT",
    title: "Choose your access plan",
    subtitle: "Activate your AI key and start using the platform today.",
    plans: [
      {
        name: "Starter",
        tagline: "Try the AI for 3 months",
        prefix: "",
        features: [
          "3-month ChatGPT access token",
          "Basic AI usage training",
          "Email support",
          "Members community",
        ],
      },
      {
        name: "Essential",
        tagline: "Your lifetime AI key",
        prefix: "",
        features: [
          "Lifetime ChatGPT access token",
          "Complete platform training",
          "Email support",
          "Free system updates",
          "Members community",
        ],
      },
      {
        name: "Professional",
        tagline: "Turbocharged AI + guidance",
        prefix: "Everything in Essential, plus:",
        features: [
          "Key with access to 3 simultaneous projects",
          "30-day individual follow-up",
          "Weekly group mentoring",
          "Ready-made AI command templates",
          "Priority WhatsApp support",
          "Bonus: Quick Scale Guide with AI",
        ],
      },
      {
        name: "VIP",
        tagline: "Maximum access + exclusive mentoring",
        prefix: "Everything in Professional, plus:",
        features: [
          "Key with unlimited AI projects",
          "60-day 1-on-1 mentoring",
          "Early access to new features",
          "Exclusive VIP group",
          "Personalized AI strategy consulting",
          "Bonus: Complete ChatGPT Automation Kit",
          "Extended 60-day guarantee",
        ],
      },
    ],
    cta: "Activate Access Key",
    mostPopular: "Most popular",
    urgencyTitle: "Limited time offer",
    spots: "keys left at this price",
    guarantee: "Unconditional 30-day guarantee. If it doesn't work for you, we refund 100% of your money.",
    footer: "© 2026 — Free Time Earnings Platform • All rights reserved",
    secureCheckout: "100% secure checkout",
    perAccess: "one-time access",
    discount: "off",
  },
  es: {
    brand: "ChatGPT",
    title: "Elegí tu plan de acceso",
    subtitle: "Activá tu clave de inteligencia artificial y empezá a usar la plataforma hoy.",
    plans: [
      {
        name: "Starter",
        tagline: "Probá la IA por 3 meses",
        prefix: "",
        features: [
          "Token de acceso al ChatGPT por 3 meses",
          "Entrenamiento básico de uso de la IA",
          "Soporte por email",
          "Comunidad de miembros",
        ],
      },
      {
        name: "Esencial",
        tagline: "Tu clave vitalicia de IA",
        prefix: "",
        features: [
          "Token de acceso vitalicio al ChatGPT",
          "Entrenamiento completo de la plataforma",
          "Soporte por email",
          "Actualizaciones gratuitas del sistema",
          "Comunidad de miembros",
        ],
      },
      {
        name: "Profesional",
        tagline: "IA turbo + acompañamiento",
        prefix: "Todo del Esencial, más:",
        features: [
          "Clave con acceso a 3 proyectos simultáneos",
          "Acompañamiento individual por 30 días",
          "Mentoría grupal semanal",
          "Templates de comandos listos para la IA",
          "Soporte prioritario por WhatsApp",
          "Bono: Guía de Escala Rápida con IA",
        ],
      },
      {
        name: "VIP",
        tagline: "Acceso máximo + mentoría exclusiva",
        prefix: "Todo del Profesional, más:",
        features: [
          "Clave con proyectos ilimitados en la IA",
          "Mentoría 1-a-1 por 60 días",
          "Acceso anticipado a nuevas funcionalidades",
          "Grupo VIP exclusivo",
          "Consultoría personalizada de estrategia con IA",
          "Bono: Kit Completo de Automatización con ChatGPT",
          "Garantía extendida de 60 días",
        ],
      },
    ],
    cta: "Activar Clave de Acceso",
    mostPopular: "Más elegido",
    urgencyTitle: "Oferta por tiempo limitado",
    spots: "claves restantes a este precio",
    guarantee: "Garantía incondicional de 30 días. Si no funciona para vos, te devolvemos el 100% de tu dinero.",
    footer: "© 2026 — Plataforma Ganancias con Tiempo Libre • Todos los derechos reservados",
    secureCheckout: "Checkout 100% seguro",
    perAccess: "acceso único",
    discount: "descuento",
  },
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
    const sessionId = sessionStorage.getItem("session_id") || localStorage.getItem("session_id") || "";
    const params = new URLSearchParams(window.location.search);
    const checkoutParams = new URLSearchParams();
    if (sessionId) checkoutParams.set("session_id", sessionId);
    ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].forEach((k) => {
      const v = params.get(k);
      if (v) checkoutParams.set(k, v);
    });
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
      sendCAPIInitiateCheckout({ amount: plan.price });
      trackTikTokInitiateCheckout({ amount: plan.price });
    }
    window.open(buildCheckoutURL(plan), "_blank");
  };

  const getDiscount = (original: number, price: number) => Math.round(((original - price) / original) * 100);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-primary/30">
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-3">
            <img src={chatgptIcon} alt="ChatGPT" className="w-6 h-6 object-contain" />
            <span className="text-sm font-semibold text-white/80 hidden sm:inline">{t.brand}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white/[0.06] rounded-full px-3 py-1">
              <Clock className="h-3.5 w-3.5 text-red-400" />
              <span className="text-xs font-bold tabular-nums text-red-400">{formatTime(timeLeft)}</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-white/40" />
              <span className="text-xs text-white/40">{spots} {t.spots}</span>
            </div>
            <LanguageSelector className="shrink-0" />
          </div>
        </div>
      </div>

      {/* Hero */}
      <header className="pt-24 pb-12 sm:pt-28 sm:pb-16 text-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center gap-5"
        >
          <div className="flex items-center gap-3">
            <img src={chatgptIcon} alt="ChatGPT" className="w-10 h-10 object-contain" />
            <span className="text-lg font-bold text-white/70">{t.brand}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold text-white tracking-tight max-w-2xl leading-tight">
            {t.title}
          </h1>
          <p className="text-base sm:text-lg text-white/45 max-w-md leading-relaxed">
            {t.subtitle}
          </p>
        </motion.div>
      </header>

      {/* Plans */}
      <main className="max-w-6xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {PLANS.map((plan, i) => {
            const planText = t.plans[i];
            const isPopular = plan.popular;
            const Icon = PLAN_ICONS[i];
            const discount = getDiscount(plan.originalPrice, plan.price);

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.1, duration: 0.45 }}
                className={`relative flex flex-col rounded-2xl border ${plan.border} bg-gradient-to-b ${plan.accent} backdrop-blur-sm overflow-hidden ${
                  isPopular ? "ring-2 ring-emerald-500/40 scale-[1.02] xl:scale-105" : ""
                }`}
              >
                {/* Popular badge */}
                {isPopular && (
                  <div className="bg-emerald-500 text-white text-xs font-bold text-center py-1.5 tracking-wide uppercase">
                    {t.mostPopular}
                  </div>
                )}

                <div className="p-6 flex flex-col flex-1">
                  {/* Icon + Name */}
                  <div className="flex items-center gap-3 mb-1">
                    <div className={`w-9 h-9 rounded-xl ${plan.iconBg} flex items-center justify-center`}>
                      <Icon className={`w-4.5 h-4.5 ${plan.checkColor}`} />
                    </div>
                    <h3 className="text-xl font-bold text-white">{planText.name}</h3>
                  </div>
                  <p className="text-sm text-white/40 mt-1 mb-5 min-h-[2rem]">{planText.tagline}</p>

                  {/* Price block */}
                  <div className="mb-6">
                    <div className="flex items-end gap-2">
                      <span className="text-4xl font-extrabold text-white tracking-tight">
                        R${plan.price}
                      </span>
                      <span className="text-sm text-white/30 mb-1">/ {t.perAccess}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm text-white/25 line-through">R${plan.originalPrice}</span>
                      <span className="text-xs font-semibold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                        -{discount}% {t.discount}
                      </span>
                    </div>
                  </div>

                  {/* CTA */}
                  <button
                    onClick={() => handlePlanClick(plan)}
                    className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-[0.97] mb-6 ${plan.btnClass}`}
                  >
                    {t.cta}
                  </button>

                  {/* Divider */}
                  <div className="border-t border-white/[0.06] mb-5" />

                  {/* Features */}
                  <div className="space-y-3 flex-1">
                    {planText.prefix && (
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className={`w-3.5 h-3.5 ${plan.checkColor}`} />
                        <span className="text-xs font-semibold text-white/50 uppercase tracking-wide">{planText.prefix}</span>
                      </div>
                    )}
                    {planText.features.map((feat, fi) => (
                      <div key={fi} className="flex items-start gap-2.5">
                        <Check className={`w-4 h-4 mt-0.5 shrink-0 ${plan.checkColor}`} />
                        <span className="text-sm text-white/65 leading-snug">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Guarantee + Secure */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-14 flex flex-col items-center gap-3"
        >
          <div className="flex items-center gap-3 bg-white/[0.04] border border-white/[0.08] rounded-2xl px-6 py-4 max-w-lg text-center">
            <Shield className="w-8 h-8 text-emerald-500/60 shrink-0" />
            <p className="text-sm text-white/50 leading-relaxed">{t.guarantee}</p>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Lock className="w-3.5 h-3.5 text-white/20" />
            <span className="text-xs text-white/25 font-medium">{t.secureCheckout}</span>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] py-6">
        <p className="text-xs text-white/20 text-center">{t.footer}</p>
      </footer>
    </div>
  );
};

export default Oferta;
