import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Check, Clock, Users, Shield, Lock, Sparkles } from "lucide-react";
import { useLanguage, LanguageSelector } from "@/lib/i18n";
import { saveFunnelEventReliable } from "@/lib/metricsClient";
import { sendCAPIInitiateCheckout } from "@/lib/facebookCAPI";
import { trackTikTokInitiateCheckout } from "@/lib/tiktokPixel";
import chatgptLogo from "@/assets/chatgpt-logo.webp";

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
    popular: false,
    isLimited: false,
  },
  {
    id: "profissional",
    checkoutUrl: "https://pay.kirvano.com/b9bbad45-8e94-40c0-b910-73e814b03c8c",
    price: 97,
    originalPrice: 397,
    popular: true,
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
    subtitle: "Confira os planos de acesso à inteligência artificial que faz a plataforma funcionar.",
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
  },
  en: {
    brand: "ChatGPT",
    title: "Pricing",
    subtitle: "Check the AI access plans that power the free time earnings platform.",
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
  },
  es: {
    brand: "ChatGPT",
    title: "Precios",
    subtitle: "Consultá los planes de acceso a la inteligencia artificial que hace funcionar la plataforma.",
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

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white selection:bg-primary/30">
      {/* Subtle urgency strip */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#1a1a1a]/95 backdrop-blur-sm border-b border-white/5">
        <div className="max-w-5xl mx-auto flex items-center justify-center gap-4 px-4 py-2.5">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-white/50" />
            <span className="text-xs text-white/60 font-medium">
              {t.urgencyTitle}
            </span>
            <span className="text-sm font-bold tabular-nums text-white/90 ml-1">{formatTime(timeLeft)}</span>
          </div>
          <span className="hidden sm:inline text-white/20">|</span>
          <div className="hidden sm:flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-white/40" />
            <span className="text-xs text-white/50">{spots} {t.spots}</span>
          </div>
          <div className="ml-auto">
            <LanguageSelector className="shrink-0" />
          </div>
        </div>
      </div>

      {/* Hero header */}
      <header className="pt-20 pb-10 sm:pt-24 sm:pb-14 text-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center gap-4"
        >
          <img
            src={chatgptLogo}
            alt="ChatGPT"
            className="w-10 h-10 object-contain"
          />
          <span className="text-sm text-white/40 font-medium tracking-wide">{t.brand}</span>
          <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
            {t.title}
          </h1>
          <p className="text-base sm:text-lg text-white/50 max-w-lg leading-relaxed">
            {t.subtitle}
          </p>
        </motion.div>
      </header>

      {/* Plans grid */}
      <main className="max-w-5xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 sm:gap-0 border border-white/10 rounded-2xl overflow-hidden">
          {PLANS.map((plan, i) => {
            const planText = t.plans[i];
            const isPopular = plan.popular;
            const isLast = i === PLANS.length - 1;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.08, duration: 0.4 }}
                className={`relative flex flex-col p-6 sm:p-5 lg:p-6 ${
                  i < PLANS.length - 1 ? "border-b sm:border-b-0 sm:border-r border-white/10" : ""
                } ${isPopular ? "bg-white/[0.04]" : ""}`}
              >
                {/* Popular badge */}
                {isPopular && (
                  <div className="absolute -top-0 left-0 right-0">
                    <div className="flex justify-center">
                      <span className="bg-primary text-primary-foreground text-[10px] font-semibold tracking-wider uppercase px-3 py-1 rounded-b-lg">
                        {t.mostPopular}
                      </span>
                    </div>
                  </div>
                )}

                {/* Plan name + tagline */}
                <div className={`${isPopular ? "mt-5" : ""}`}>
                  <h3 className="text-lg font-semibold text-white">{planText.name}</h3>
                  <p className="text-sm text-white/40 mt-1 min-h-[2.5rem]">{planText.tagline}</p>
                </div>

                {/* Price */}
                <div className="mt-5 mb-5">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                      R${plan.price}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs text-white/30 line-through">R${plan.originalPrice}</span>
                    <span className="text-[10px] text-white/40">/ {t.perAccess}</span>
                  </div>
                </div>

                {/* CTA */}
                <button
                  onClick={() => handlePlanClick(plan)}
                  className={`w-full py-3 rounded-xl font-medium text-sm transition-all active:scale-[0.97] mb-6 ${
                    isPopular
                      ? "bg-white text-black hover:bg-white/90"
                      : isLast
                      ? "bg-primary text-primary-foreground hover:brightness-110"
                      : "bg-white/10 text-white border border-white/10 hover:bg-white/15"
                  }`}
                >
                  {t.cta} <span className="inline-block ml-1">↗</span>
                </button>

                {/* Features */}
                <div className="space-y-3 flex-1">
                  {planText.prefix && (
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-3.5 h-3.5 text-primary/70" />
                      <span className="text-xs font-medium text-white/60">{planText.prefix}</span>
                    </div>
                  )}
                  {planText.features.map((feat, fi) => (
                    <div key={fi} className="flex items-start gap-2.5">
                      <Check className={`w-4 h-4 mt-0.5 shrink-0 ${
                        isPopular ? "text-primary" : isLast ? "text-primary" : "text-white/30"
                      }`} />
                      <span className="text-sm text-white/70 leading-snug">{feat}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Guarantee */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-10 flex items-start gap-3 max-w-xl mx-auto text-center"
        >
          <div className="flex flex-col items-center gap-2 w-full">
            <Shield className="w-5 h-5 text-white/30" />
            <p className="text-xs text-white/40 leading-relaxed">{t.guarantee}</p>
          </div>
        </motion.div>

        {/* Secure checkout */}
        <div className="flex items-center justify-center gap-2 mt-4">
          <Lock className="w-3 h-3 text-white/20" />
          <span className="text-[11px] text-white/25 font-medium">{t.secureCheckout}</span>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-6">
        <p className="text-xs text-white/25 text-center">{t.footer}</p>
      </footer>
    </div>
  );
};

export default Oferta;
