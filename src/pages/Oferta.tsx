import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Shield, Zap, Crown, Clock, CheckCircle, Users, BookOpen, Headphones, Star, TrendingUp, Lock } from "lucide-react";
import { useLanguage, LanguageSelector } from "@/lib/i18n";
import { saveFunnelEventReliable } from "@/lib/metricsClient";
import { sendCAPIInitiateCheckout } from "@/lib/facebookCAPI";
import { trackTikTokInitiateCheckout } from "@/lib/tiktokPixel";

const PLANS = [
  {
    id: "essencial",
    kirvanoSlug: "chave-token-chatgpt",
    price: 47,
    originalPrice: 197,
    icon: Zap,
    popular: false,
  },
  {
    id: "profissional",
    kirvanoSlug: "chave-token-chatgpt-pro",
    price: 97,
    originalPrice: 397,
    icon: Crown,
    popular: true,
  },
  {
    id: "vip",
    kirvanoSlug: "chave-token-chatgpt-vip",
    price: 197,
    originalPrice: 697,
    icon: Star,
    popular: false,
  },
];

const texts = {
  pt: {
    header: "GANHOS COM TEMPO LIVRE",
    badge: "OFERTA ESPECIAL — ACESSO LIBERADO",
    title: "Escolha o Plano Ideal Para Você",
    subtitle: "Garanta seu acesso vitalício agora com condição exclusiva de lançamento.",
    plans: [
      {
        name: "Essencial",
        tagline: "Comece a Lucrar Hoje",
        features: [
          "Acesso vitalício à plataforma",
          "Módulo completo de treinamento",
          "Suporte por e-mail",
          "Atualizações gratuitas",
          "Comunidade de membros",
        ],
      },
      {
        name: "Profissional",
        tagline: "Mais Resultados, Mais Rápido",
        features: [
          "Tudo do plano Essencial",
          "Acompanhamento individual por 30 dias",
          "Acesso a 3 projetos simultâneos",
          "Mentoria em grupo semanal",
          "Templates prontos exclusivos",
          "Suporte prioritário via WhatsApp",
          "Bônus: Guia de Escala Rápida",
        ],
      },
      {
        name: "VIP",
        tagline: "Resultados Máximos Garantidos",
        features: [
          "Tudo do plano Profissional",
          "Mentoria 1-a-1 por 60 dias",
          "Projetos ilimitados",
          "Acesso antecipado a novidades",
          "Grupo VIP exclusivo",
          "Consultoria personalizada de estratégia",
          "Bônus: Kit Completo de Automação",
          "Garantia estendida de 60 dias",
        ],
      },
    ],
    lifetime: "Acesso Vitalício",
    from: "De",
    to: "por apenas",
    cta: "GARANTIR MEU ACESSO",
    mostPopular: "MAIS ESCOLHIDO",
    bestValue: "MELHOR CUSTO-BENEFÍCIO",
    urgencyTitle: "Oferta por tempo limitado",
    urgencyText: "Esse valor promocional pode ser encerrado a qualquer momento.",
    guarantee: "Garantia incondicional de 30 dias. Se não gostar, devolvemos 100% do seu dinheiro.",
    footer: "© 2026 — Plataforma de Ganhos com Tempo Livre • Todos os direitos reservados",
    secureCheckout: "Checkout 100% seguro",
    spots: "vagas restantes neste valor",
  },
  en: {
    header: "FREE TIME EARNINGS",
    badge: "SPECIAL OFFER — ACCESS UNLOCKED",
    title: "Choose the Perfect Plan For You",
    subtitle: "Lock in your lifetime access now with our exclusive launch pricing.",
    plans: [
      {
        name: "Essential",
        tagline: "Start Earning Today",
        features: [
          "Lifetime platform access",
          "Complete training module",
          "Email support",
          "Free updates",
          "Members community",
        ],
      },
      {
        name: "Professional",
        tagline: "More Results, Faster",
        features: [
          "Everything in Essential",
          "30-day individual follow-up",
          "Access to 3 simultaneous projects",
          "Weekly group mentoring",
          "Exclusive ready-made templates",
          "Priority WhatsApp support",
          "Bonus: Quick Scale Guide",
        ],
      },
      {
        name: "VIP",
        tagline: "Maximum Guaranteed Results",
        features: [
          "Everything in Professional",
          "60-day 1-on-1 mentoring",
          "Unlimited projects",
          "Early access to new features",
          "Exclusive VIP group",
          "Personalized strategy consulting",
          "Bonus: Complete Automation Kit",
          "Extended 60-day guarantee",
        ],
      },
    ],
    lifetime: "Lifetime Access",
    from: "From",
    to: "for only",
    cta: "LOCK IN MY ACCESS",
    mostPopular: "MOST POPULAR",
    bestValue: "BEST VALUE",
    urgencyTitle: "Limited time offer",
    urgencyText: "This promotional price may end at any moment.",
    guarantee: "Unconditional 30-day guarantee. If you don't like it, we refund 100% of your money.",
    footer: "© 2026 — Free Time Earnings Platform • All rights reserved",
    secureCheckout: "100% secure checkout",
    spots: "spots left at this price",
  },
  es: {
    header: "GANANCIAS CON TIEMPO LIBRE",
    badge: "OFERTA ESPECIAL — ACCESO LIBERADO",
    title: "Elegí el Plan Ideal Para Vos",
    subtitle: "Asegurá tu acceso vitalicio ahora con precio exclusivo de lanzamiento.",
    plans: [
      {
        name: "Esencial",
        tagline: "Empezá a Ganar Hoy",
        features: [
          "Acceso vitalicio a la plataforma",
          "Módulo completo de entrenamiento",
          "Soporte por email",
          "Actualizaciones gratuitas",
          "Comunidad de miembros",
        ],
      },
      {
        name: "Profesional",
        tagline: "Más Resultados, Más Rápido",
        features: [
          "Todo del plan Esencial",
          "Acompañamiento individual por 30 días",
          "Acceso a 3 proyectos simultáneos",
          "Mentoría grupal semanal",
          "Templates exclusivos listos para usar",
          "Soporte prioritario por WhatsApp",
          "Bono: Guía de Escala Rápida",
        ],
      },
      {
        name: "VIP",
        tagline: "Resultados Máximos Garantizados",
        features: [
          "Todo del plan Profesional",
          "Mentoría 1-a-1 por 60 días",
          "Proyectos ilimitados",
          "Acceso anticipado a novedades",
          "Grupo VIP exclusivo",
          "Consultoría personalizada de estrategia",
          "Bono: Kit Completo de Automatización",
          "Garantía extendida de 60 días",
        ],
      },
    ],
    lifetime: "Acceso Vitalicio",
    from: "De",
    to: "por solo",
    cta: "ASEGURAR MI ACCESO",
    mostPopular: "MÁS ELEGIDO",
    bestValue: "MEJOR COSTO-BENEFICIO",
    urgencyTitle: "Oferta por tiempo limitado",
    urgencyText: "Este valor promocional puede finalizar en cualquier momento.",
    guarantee: "Garantía incondicional de 30 días. Si no te gusta, te devolvemos el 100% de tu dinero.",
    footer: "© 2026 — Plataforma Ganancias con Tiempo Libre • Todos los derechos reservados",
    secureCheckout: "Checkout 100% seguro",
    spots: "lugares restantes a este precio",
  },
};

const Oferta = () => {
  const { lang } = useLanguage();
  const t = texts[lang];
  const icFiredRef = useRef(false);

  // Countdown timer
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
      setTimeLeft((prev) => {
        if (prev <= 0) return 0;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fake spots counter
  const [spots] = useState(() => Math.floor(Math.random() * 5) + 3);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  // Get UTMs from URL and session
  const buildCheckoutURL = (plan: typeof PLANS[0]) => {
    const sessionId = sessionStorage.getItem("session_id") || localStorage.getItem("session_id") || "";
    const params = new URLSearchParams(window.location.search);
    const utmSource = params.get("utm_source") || "";
    const utmMedium = params.get("utm_medium") || "";
    const utmCampaign = params.get("utm_campaign") || "";
    const utmContent = params.get("utm_content") || "";
    const utmTerm = params.get("utm_term") || "";

    const checkoutParams = new URLSearchParams();
    if (sessionId) checkoutParams.set("session_id", sessionId);
    if (utmSource) checkoutParams.set("utm_source", utmSource);
    if (utmMedium) checkoutParams.set("utm_medium", utmMedium);
    if (utmCampaign) checkoutParams.set("utm_campaign", utmCampaign);
    if (utmContent) checkoutParams.set("utm_content", utmContent);
    if (utmTerm) checkoutParams.set("utm_term", utmTerm);
    checkoutParams.set("plan", plan.id);

    const qs = checkoutParams.toString();
    return `https://pay.kirvano.com/${plan.kirvanoSlug}${qs ? `?${qs}` : ""}`;
  };

  const handlePlanClick = (plan: typeof PLANS[0]) => {
    if (!icFiredRef.current) {
      icFiredRef.current = true;
      saveFunnelEventReliable("checkout_click", {
        context: "oferta_page",
        plan: plan.id,
        amount: plan.price,
        product: plan.kirvanoSlug,
      });
      sendCAPIInitiateCheckout({ amount: plan.price });
      trackTikTokInitiateCheckout({ amount: plan.price });
    }
    window.open(buildCheckoutURL(plan), "_blank");
  };

  const planIcons = [Zap, Crown, Star];

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "'Source Sans 3', 'Inter', system-ui, sans-serif" }}>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 backdrop-blur-sm bg-background/95 border-b border-border">
        <span className="text-xs tracking-[3px] font-semibold text-foreground/90">
          <span className="text-primary font-bold">G</span>{t.header.slice(1)}
        </span>
        <LanguageSelector />
      </header>

      {/* Urgency bar */}
      <div className="fixed top-[49px] left-0 right-0 z-50 bg-accent/10 border-b border-accent/20 py-1.5 px-4">
        <div className="max-w-lg mx-auto flex items-center justify-center gap-3">
          <Clock className="w-4 h-4 text-accent shrink-0" />
          <span className="text-xs font-semibold text-accent">
            {t.urgencyTitle}: <span className="font-bold text-sm tabular-nums">{formatTime(timeLeft)}</span>
          </span>
          <span className="text-xs text-muted-foreground">|</span>
          <span className="text-xs text-accent/80 font-medium">
            {spots} {t.spots}
          </span>
        </div>
      </div>

      {/* Content */}
      <main className="pt-24 pb-16 px-4 mx-auto" style={{ maxWidth: 520 }}>
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center mb-4"
        >
          <span className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/30 rounded-full px-3 py-1 text-[10px] font-bold tracking-widest text-primary uppercase">
            <Lock className="w-3 h-3" />
            {t.badge}
          </span>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-xl sm:text-2xl font-bold text-foreground text-center leading-tight mb-2"
          style={{ fontFamily: "'Merriweather', serif" }}
        >
          {t.title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-sm text-muted-foreground text-center mb-6"
        >
          {t.subtitle}
        </motion.p>

        {/* Plans */}
        <div className="space-y-4">
          {PLANS.map((plan, i) => {
            const PlanIcon = planIcons[i];
            const planText = t.plans[i];
            const isPopular = plan.popular;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className={`relative rounded-2xl border overflow-hidden transition-all ${
                  isPopular
                    ? "border-accent shadow-[0_0_30px_-5px_hsl(var(--accent)/0.3)] bg-card"
                    : "border-border bg-card/80 hover:border-primary/40"
                }`}
              >
                {/* Popular badge */}
                {isPopular && (
                  <div className="bg-accent text-accent-foreground text-[10px] font-bold tracking-widest text-center py-1.5 uppercase">
                    {t.mostPopular}
                  </div>
                )}
                {i === 2 && (
                  <div className="bg-primary/20 text-primary text-[10px] font-bold tracking-widest text-center py-1.5 uppercase">
                    {t.bestValue}
                  </div>
                )}

                <div className="p-5">
                  {/* Plan header */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isPopular ? "bg-accent/20" : i === 2 ? "bg-primary/15" : "bg-secondary"
                    }`}>
                      <PlanIcon className={`w-5 h-5 ${
                        isPopular ? "text-accent" : i === 2 ? "text-primary" : "text-muted-foreground"
                      }`} />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground text-base">{planText.name}</h3>
                      <p className="text-xs text-muted-foreground">{planText.tagline}</p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs text-muted-foreground line-through">{t.from} R${plan.originalPrice}</span>
                    </div>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-xs text-muted-foreground">{t.to}</span>
                      <span className={`text-3xl font-bold ${isPopular ? "text-accent" : "text-foreground"}`}>
                        R${plan.price}
                      </span>
                    </div>
                    <span className="inline-block mt-1 text-[10px] font-semibold text-primary bg-primary/10 rounded-full px-2 py-0.5 uppercase tracking-wide">
                      {t.lifetime}
                    </span>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2 mb-5">
                    {planText.features.map((feat, fi) => (
                      <li key={fi} className="flex items-start gap-2 text-sm text-foreground/85">
                        <CheckCircle className={`w-4 h-4 mt-0.5 shrink-0 ${
                          isPopular ? "text-accent" : "text-primary"
                        }`} />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <button
                    onClick={() => handlePlanClick(plan)}
                    className={`w-full py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all active:scale-[0.98] ${
                      isPopular
                        ? "bg-accent text-accent-foreground shadow-lg shadow-accent/25 hover:brightness-110"
                        : i === 2
                        ? "bg-primary text-primary-foreground hover:brightness-110"
                        : "bg-secondary text-secondary-foreground border border-border hover:bg-secondary/80"
                    }`}
                  >
                    {t.cta}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Guarantee */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3"
        >
          <Shield className="w-8 h-8 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-foreground/80 leading-relaxed">{t.guarantee}</p>
        </motion.div>

        {/* Secure checkout */}
        <div className="flex items-center justify-center gap-2 mt-4 text-muted-foreground">
          <Lock className="w-3.5 h-3.5" />
          <span className="text-[11px] font-medium">{t.secureCheckout}</span>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-3 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">{t.footer}</p>
      </footer>
    </div>
  );
};

export default Oferta;
