import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Shield, Zap, Crown, Clock, CheckCircle, Users, BookOpen, Headphones, Star, TrendingUp, Lock } from "lucide-react";
import { useLanguage, LanguageSelector } from "@/lib/i18n";
import { saveFunnelEventReliable } from "@/lib/metricsClient";
import { sendCAPIInitiateCheckout } from "@/lib/facebookCAPI";
import { trackTikTokInitiateCheckout } from "@/lib/tiktokPixel";

const PLANS = [
  {
    id: "starter",
    kirvanoSlug: "chave-token-chatgpt-starter",
    price: 37,
    originalPrice: 97,
    icon: BookOpen,
    popular: false,
    isLimited: true,
  },
  {
    id: "essencial",
    kirvanoSlug: "chave-token-chatgpt",
    price: 47,
    originalPrice: 197,
    icon: Zap,
    popular: false,
    isLimited: false,
  },
  {
    id: "profissional",
    kirvanoSlug: "chave-token-chatgpt-pro",
    price: 97,
    originalPrice: 397,
    icon: Crown,
    popular: true,
    isLimited: false,
  },
  {
    id: "vip",
    kirvanoSlug: "chave-token-chatgpt-vip",
    price: 197,
    originalPrice: 697,
    icon: Star,
    popular: false,
    isLimited: false,
  },
];

const texts = {
  pt: {
    header: "GANHOS COM TEMPO LIVRE",
    badge: "OFERTA ESPECIAL — CHAVE DE ACESSO LIBERADA",
    title: "Ative Sua Chave de Acesso ao ChatGPT",
    subtitle: "Garanta seu token de acesso à inteligência artificial que faz a plataforma de tempo livre funcionar.",
    plans: [
      {
        name: "Starter",
        tagline: "Teste a IA Por 3 Meses",
        features: [
          "Token de acesso ao ChatGPT por 3 meses",
          "Treinamento básico de uso da IA",
          "Suporte por e-mail",
          "Comunidade de membros",
        ],
      },
      {
        name: "Essencial",
        tagline: "Sua Chave Vitalícia da IA",
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
        tagline: "IA Turbinada + Acompanhamento",
        features: [
          "Tudo do plano Essencial",
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
        tagline: "Acesso Máximo + Mentoria Exclusiva",
        features: [
          "Tudo do plano Profissional",
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
    lifetime: "Token Vitalício",
    limited3mo: "Token por 3 Meses",
    from: "De",
    to: "por apenas",
    cta: "ATIVAR MINHA CHAVE DE ACESSO",
    mostPopular: "MAIS ESCOLHIDO",
    bestValue: "MELHOR CUSTO-BENEFÍCIO",
    lowestPrice: "MENOR PREÇO",
    urgencyTitle: "Oferta por tempo limitado",
    urgencyText: "Esse valor promocional pode ser encerrado a qualquer momento.",
    guarantee: "Garantia incondicional de 30 dias. Se a chave de acesso não funcionar para você, devolvemos 100% do seu dinheiro.",
    footer: "© 2026 — Plataforma de Ganhos com Tempo Livre • Todos os direitos reservados",
    secureCheckout: "Checkout 100% seguro",
    spots: "chaves restantes neste valor",
  },
  en: {
    header: "FREE TIME EARNINGS",
    badge: "SPECIAL OFFER — ACCESS KEY UNLOCKED",
    title: "Activate Your ChatGPT Access Key",
    subtitle: "Lock in your AI access token that powers the free time earnings platform.",
    plans: [
      {
        name: "Starter",
        tagline: "Try the AI For 3 Months",
        features: [
          "3-month ChatGPT access token",
          "Basic AI usage training",
          "Email support",
          "Members community",
        ],
      },
      {
        name: "Essential",
        tagline: "Your Lifetime AI Key",
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
        tagline: "Turbocharged AI + Guidance",
        features: [
          "Everything in Essential",
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
        tagline: "Maximum Access + Exclusive Mentoring",
        features: [
          "Everything in Professional",
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
    lifetime: "Lifetime Token",
    limited3mo: "3-Month Token",
    from: "From",
    to: "for only",
    cta: "ACTIVATE MY ACCESS KEY",
    mostPopular: "MOST POPULAR",
    bestValue: "BEST VALUE",
    lowestPrice: "LOWEST PRICE",
    urgencyTitle: "Limited time offer",
    urgencyText: "This promotional price may end at any moment.",
    guarantee: "Unconditional 30-day guarantee. If the access key doesn't work for you, we refund 100% of your money.",
    footer: "© 2026 — Free Time Earnings Platform • All rights reserved",
    secureCheckout: "100% secure checkout",
    spots: "keys left at this price",
  },
  es: {
    header: "GANANCIAS CON TIEMPO LIBRE",
    badge: "OFERTA ESPECIAL — CLAVE DE ACCESO LIBERADA",
    title: "Activá Tu Clave de Acceso al ChatGPT",
    subtitle: "Asegurá tu token de acceso a la inteligencia artificial que hace funcionar la plataforma de tiempo libre.",
    plans: [
      {
        name: "Starter",
        tagline: "Probá la IA Por 3 Meses",
        features: [
          "Token de acceso al ChatGPT por 3 meses",
          "Entrenamiento básico de uso de la IA",
          "Soporte por email",
          "Comunidad de miembros",
        ],
      },
      {
        name: "Esencial",
        tagline: "Tu Clave Vitalicia de IA",
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
        tagline: "IA Turbo + Acompañamiento",
        features: [
          "Todo del plan Esencial",
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
        tagline: "Acceso Máximo + Mentoría Exclusiva",
        features: [
          "Todo del plan Profesional",
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
    lifetime: "Token Vitalicio",
    limited3mo: "Token por 3 Meses",
    from: "De",
    to: "por solo",
    cta: "ACTIVAR MI CLAVE DE ACCESO",
    mostPopular: "MÁS ELEGIDO",
    bestValue: "MEJOR COSTO-BENEFICIO",
    lowestPrice: "MENOR PRECIO",
    urgencyTitle: "Oferta por tiempo limitado",
    urgencyText: "Este valor promocional puede finalizar en cualquier momento.",
    guarantee: "Garantía incondicional de 30 días. Si la clave de acceso no funciona para vos, te devolvemos el 100% de tu dinero.",
    footer: "© 2026 — Plataforma Ganancias con Tiempo Libre • Todos los derechos reservados",
    secureCheckout: "Checkout 100% seguro",
    spots: "claves restantes a este precio",
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

  const planIcons = [BookOpen, Zap, Crown, Star];

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "'Source Sans 3', 'Inter', system-ui, sans-serif" }}>
      {/* Fixed top bar */}
      <div className="fixed top-0 left-0 right-0 z-50">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-2.5 backdrop-blur-md bg-background/95 border-b border-border">
          <span className="text-[11px] tracking-[3px] font-semibold text-foreground/90 whitespace-nowrap">
            <span className="text-primary font-bold">G</span>{t.header.slice(1)}
          </span>
          <LanguageSelector />
        </header>

        {/* Urgency bar */}
        <div className="bg-accent/10 border-b border-accent/20 py-1.5 px-4 backdrop-blur-md">
          <div className="max-w-lg mx-auto flex items-center justify-center gap-2">
            <Clock className="w-3.5 h-3.5 text-accent shrink-0" />
            <span className="text-[11px] font-semibold text-accent whitespace-nowrap">
              {t.urgencyTitle}: <span className="font-bold text-sm tabular-nums">{formatTime(timeLeft)}</span>
            </span>
            <span className="text-[10px] text-muted-foreground">|</span>
            <span className="text-[11px] text-accent/80 font-medium whitespace-nowrap">
              {spots} {t.spots}
            </span>
          </div>
        </div>
      </div>

      {/* Content — offset for fixed header (~82px) */}
      <main className="pt-[90px] pb-16 px-4 mx-auto" style={{ maxWidth: 520 }}>
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
                {/* Badges */}
                {i === 0 && (
                  <div className="bg-muted text-muted-foreground text-[10px] font-bold tracking-widest text-center py-1.5 uppercase">
                    {t.lowestPrice}
                  </div>
                )}
                {isPopular && (
                  <div className="bg-accent text-accent-foreground text-[10px] font-bold tracking-widest text-center py-1.5 uppercase">
                    {t.mostPopular}
                  </div>
                )}
                {i === 3 && (
                  <div className="bg-primary/20 text-primary text-[10px] font-bold tracking-widest text-center py-1.5 uppercase">
                    {t.bestValue}
                  </div>
                )}

                <div className="p-5">
                  {/* Plan header */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isPopular ? "bg-accent/20" : i === 3 ? "bg-primary/15" : i === 0 ? "bg-muted" : "bg-secondary"
                    }`}>
                      <PlanIcon className={`w-5 h-5 ${
                        isPopular ? "text-accent" : i === 3 ? "text-primary" : "text-muted-foreground"
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
                    <span className={`inline-block mt-1 text-[10px] font-semibold rounded-full px-2 py-0.5 uppercase tracking-wide ${
                      plan.isLimited
                        ? "text-muted-foreground bg-muted border border-border"
                        : "text-primary bg-primary/10"
                    }`}>
                      {plan.isLimited ? t.limited3mo : t.lifetime}
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
                        : i === 3
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
