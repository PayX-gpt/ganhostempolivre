import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Lock, Zap, ArrowRight, Star, Users, Clock, CheckCircle, Smartphone, Bot, TrendingUp, HelpCircle, CreditCard, ShieldCheck, AlertTriangle, CircleDollarSign, Sun, Heart, Eye, Unlock, Gift } from "lucide-react";
import { saveFunnelEvent } from "@/lib/metricsClient";
import { buildTrackingQueryString } from "@/lib/trackingDataLayer";
import { initBehaviorTracker, trackSectionView, trackSectionLeave, trackCtaView, trackCtaHesitation, trackCheckoutClick, trackFaqOpen, trackVideoStart } from "@/lib/behaviorTracker";

import { Separator } from "@/components/ui/separator";
import { CTAButton, TrustBadge, VideoPlaceholder } from "./QuizUI";
import type { QuizAnswers } from "./QuizUI";
import mentorPhoto from "@/assets/mentor-new.webp";
import bonusStack from "@/assets/bonus-stack.jpg";
import guaranteeSeal from "@/assets/guarantee-seal.jpg";
import giftBox from "@/assets/gift-box.jpg";
import chatgptLogo from "@/assets/chatgpt-logo.png";
import feedback1 from "@/assets/feedback-1.png";
import feedback2 from "@/assets/feedback-2.jpg";
import feedback3 from "@/assets/feedback-3.jpg";
import feedback4 from "@/assets/feedback-4.jpg";
import avatarAntonio from "@/assets/avatar-antonio.jpg";
import avatarClaudia from "@/assets/avatar-claudia.jpg";
import avatarCarlos from "@/assets/avatar-carlos.jpg";
import avatarJose from "@/assets/avatar-jose.jpg";
import avatarLucia from "@/assets/avatar-lucia.jpg";
import avatarRegina from "@/assets/avatar-regina.jpg";
import depo1 from "@/assets/depo-1.png";
import depo2 from "@/assets/depo-2.png";
import depo3 from "@/assets/depo-3.png";
import depo4 from "@/assets/depo-4.jpg";
import depo5 from "@/assets/depo-5.jpg";
import depo6 from "@/assets/depo-6.jpg";
import depo7 from "@/assets/depo-7.jpg";
import depo8 from "@/assets/depo-8.jpg";
import depo9 from "@/assets/depo-9.jpg";

interface Step13Props {
  userName?: string;
  answers?: QuizAnswers;
}

/* ─── Dynamic Pricing Engine ─── */
const PRICING_TIERS: Record<string, { price: number; installment: number; installments: number; checkoutUrl: string }> = {
  "menos100":  { price: 37.00,  installment: 3.88,  installments: 12, checkoutUrl: "https://pay.kirvano.com/4630333d-d5d1-4591-b767-2151f77c6b13" },
  "100-500":   { price: 47.00,  installment: 4.67,  installments: 12, checkoutUrl: "https://pay.kirvano.com/a404a378-2a59-4efd-86a8-dc57363c054c" },
  "500-2000":  { price: 66.83,  installment: 6.64,  installments: 12, checkoutUrl: "https://pay.kirvano.com/5e882c8e-e569-4d9b-b895-69cb1d1285f4" },
  "2000-10000":{ price: 97.00,  installment: 9.64,  installments: 12, checkoutUrl: "https://pay.kirvano.com/b9bbad45-8e94-40c0-b910-73e814b03c8c" },
  "10000+":    { price: 147.00, installment: 14.61, installments: 12, checkoutUrl: "https://pay.kirvano.com/a007f8f3-4831-4d20-9736-22f196ea6a96" },
};

const getPricing = (accountBalance?: string) => {
  return PRICING_TIERS[accountBalance || ""] || PRICING_TIERS["500-2000"];
};

const formatPrice = (price: number) => price.toFixed(2).replace(".", ",");

/* ─── Reusable CTA Block ─── */
const CTABlock = ({ showCTA, context, pricing }: { showCTA: boolean; context?: string; pricing: { price: number; installment: number; installments: number; checkoutUrl: string } }) => {
  const ref = useRef<HTMLDivElement>(null);
  const hasTrackedView = useRef(false);

  useEffect(() => {
    if (!showCTA || !ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasTrackedView.current) {
          hasTrackedView.current = true;
          trackCtaView();
        }
        if (!entry.isIntersecting && hasTrackedView.current) {
          trackCtaHesitation();
          hasTrackedView.current = false;
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [showCTA]);

  return showCTA ? (
    <div ref={ref} className="w-full space-y-5">
      {/* Price card */}
      <div
        className="w-full rounded-2xl overflow-hidden border border-primary/25"
        style={{ background: "linear-gradient(180deg, hsl(var(--card)), hsl(var(--primary) / 0.04))" }}
      >
        {/* Top label */}
        <div className="px-4 py-2.5 text-center border-b border-primary/10" style={{ background: "hsl(var(--primary) / 0.06)" }}>
          <p className="text-[10px] uppercase tracking-[0.2em] text-primary font-bold">Chave Token ChatGPT</p>
        </div>

        {/* Price area */}
        <div className="px-5 py-6 sm:py-8 text-center space-y-4">
          {/* Installment — hero */}
          <div className="space-y-1">
            <p className="text-sm sm:text-base text-muted-foreground font-medium">{pricing.installments}x de</p>
            <p className="text-[3.2rem] sm:text-[4rem] font-display font-black text-foreground leading-none tracking-tight">
              R$<span className="text-gradient-green">{formatPrice(pricing.installment)}</span>
            </p>
          </div>

          {/* Divider line */}
          <div className="flex items-center gap-3 px-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">ou</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Lump sum */}
          <p className="text-base sm:text-lg text-foreground font-semibold">
            R${formatPrice(pricing.price)} <span className="text-muted-foreground font-normal text-sm">à vista no Pix</span>
          </p>
        </div>

        {/* Emotional anchor */}
        <div className="px-5 pb-5">
          <div className="rounded-xl p-3 border border-accent/15 bg-accent/5 text-center">
            <p className="text-sm text-foreground leading-relaxed">
              Isso é <span className="text-primary font-bold">menos que um lanche no fim de semana</span> — por algo que pode trazer tranquilidade financeira pra você e sua família.
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <CTAButton onClick={() => {
        trackCheckoutClick();
        saveFunnelEvent("checkout_click", { context: context || "default", product: "chave_token_chatgpt", amount: pricing.price });
        const utmQs = buildTrackingQueryString();
        const separator = pricing.checkoutUrl.includes("?") ? "&" : "?";
        const fullUrl = utmQs ? `${pricing.checkoutUrl}${separator}${utmQs.slice(1)}` : pricing.checkoutUrl;
        window.open(fullUrl, "_blank");
      }} variant="accent" className="animate-bounce-subtle text-lg sm:text-xl tracking-wider">
        🔑 ATIVAR MINHA CHAVE TOKEN AGORA
      </CTAButton>

      {/* Trust badges */}
      <div className="flex items-center justify-center gap-4 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs text-muted-foreground font-medium">Compra segura</span>
        </div>
        <div className="w-px h-4 bg-border" />
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs text-muted-foreground font-medium">{context || "Acesso imediato"}</span>
        </div>
      </div>
    </div>
  ) : (
    <div className="text-center space-y-2 py-4">
      <div className="w-10 h-10 rounded-full border-[3px] border-primary/30 border-t-primary animate-spin mx-auto" />
      <p className="text-base text-muted-foreground animate-pulse">
        Assista o vídeo para liberar seu acesso...
      </p>
    </div>
  );
};

/* ─── Urgency Strip (sticky) ─── */
const UrgencyStrip = ({ minutes, seconds, show, priceLabel, installmentLabel }: { minutes: number; seconds: number; show: boolean; priceLabel: string; installmentLabel?: string }) => {
  if (!show) return null;
  return (
    <div className="w-full rounded-2xl overflow-hidden border border-destructive/40">
      <div className="bg-destructive/15 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-destructive animate-pulse" />
          <span className="text-xs sm:text-sm font-bold text-destructive uppercase tracking-wider">Vaga reservada</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-destructive" />
          <span className="text-lg sm:text-xl font-display font-bold text-foreground tabular-nums">
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </span>
        </div>
      </div>
      <div className="bg-destructive/5 px-4 py-2">
        <p className="text-xs text-muted-foreground text-center">
          Sua condição especial de <span className="font-bold text-foreground">12x de R${installmentLabel || priceLabel}</span> expira quando o timer zerar. Depois disso, volta para R$297.
        </p>
      </div>
    </div>
  );
};

/* ─── Profile Analysis Card ─── */
const ProfileAnalysis = ({ answers, firstName }: { answers?: QuizAnswers; firstName: string }) => {
  const getObstacleLabel = (o?: string) => {
    const map: Record<string, string> = {
      medo: "Medo de errar", tempo: "Falta de tempo",
      inicio: "Não sabe por onde começar", dinheiro: "Pouco capital inicial",
    };
    return map[o || ""] || "—";
  };

  const getGoalLabel = (g?: string) => {
    const map: Record<string, string> = {
      "50-100": "R$50–R$100/dia", "100-300": "R$100–R$300/dia",
      "300-500": "R$300–R$500/dia", "500+": "+R$500/dia",
    };
    return map[g || ""] || "Renda extra diária";
  };

  const getDeviceLabel = (d?: string) => {
    const map: Record<string, string> = { celular: "Celular", computador: "Computador", ambos: "Ambos" };
    return map[d || ""] || "Celular";
  };

  const getAvailabilityLabel = (a?: string) => {
    const map: Record<string, string> = {
      menos30: "< 30 min/dia", "30-60": "30–60 min/dia",
      "1-2h": "1–2h/dia", "2h+": "+2h/dia",
    };
    return map[a || ""] || "Flexível";
  };

  const getAgeLabel = (a?: string) => {
    const map: Record<string, string> = {
      "18 a 25 anos": "18–25 anos", "26 a 35 anos": "26–35 anos",
      "36 a 45 anos": "36–45 anos", "46 a 55 anos": "46–55 anos",
      "56 anos ou mais": "56+ anos",
      "18-25": "18–25 anos", "26-35": "26–35 anos",
      "36-45": "36–45 anos", "46-55": "46–55 anos", "56+": "56+ anos",
    };
    return map[a || ""] || a || "—";
  };

  const getDreamLabel = (d?: string) => {
    const map: Record<string, string> = {
      contas: "Pagar contas em dia", dividas: "Quitar dívidas",
      viagem: "Viajar com a família", independencia: "Independência financeira",
      aposentadoria: "Complementar aposentadoria", negocio: "Ter próprio negócio",
      valorizado: "Ser valorizado", familia: "Cuidar da família",
      liberdade: "Tempo e liberdade",
    };
    return map[d || ""] || d || "—";
  };

  const getTriedLabel = (t?: string) => {
    const map: Record<string, string> = {
      sim_falhou: "Sim, sem resultado",
      sim_experiencia: "Sim, com resultado",
      nunca: "Primeira vez",
    };
    return map[t || ""] || "—";
  };

  const getBalanceLabel = (b?: string) => {
    const map: Record<string, string> = {
      "menos100": "Até R$100", "100-500": "R$100–R$500",
      "500-2000": "R$500–R$2.000", "2000-10000": "R$2.000–R$10.000", "10000+": "+R$10.000",
    };
    return map[b || ""] || "—";
  };

  const items = [
    { label: "Faixa etária", value: getAgeLabel(answers?.age), highlight: false },
    { label: "Meta de renda", value: getGoalLabel(answers?.incomeGoal), highlight: true },
    { label: "Maior desafio", value: getObstacleLabel(answers?.obstacle), highlight: false },
    { label: "Sonho financeiro", value: getDreamLabel(answers?.financialDream), highlight: false },
    { label: "Dispositivo", value: getDeviceLabel(answers?.device), highlight: false },
    { label: "Tempo disponível", value: getAvailabilityLabel(answers?.availability), highlight: false },
    { label: "Experiência online", value: getTriedLabel(answers?.triedOnline), highlight: false },
    { label: "Capital atual", value: getBalanceLabel(answers?.accountBalance), highlight: false },
  ];

  return (
    <div className="w-full space-y-3">
      {/* Approved badge */}
      <div className="flex items-center justify-center gap-2 py-2">
        <div className="flex items-center gap-2 bg-primary/15 border border-primary/30 rounded-full px-4 py-2">
          <CheckCircle className="w-5 h-5 text-primary" />
          <span className="text-sm font-bold text-primary">PERFIL APROVADO</span>
        </div>
      </div>

      <div className="funnel-card border-primary/30 bg-primary/5 space-y-3">
        <p className="text-sm text-muted-foreground text-center">
          {firstName ? `${firstName}, com` : "Com"} base nas suas respostas, seu perfil foi aprovado para acessar a plataforma:
        </p>
        <div className="grid grid-cols-2 gap-2">
          {items.map((item, i) => (
            <div key={i} className={`rounded-xl p-3 text-center ${item.highlight ? "bg-primary/10 border border-primary/20" : "bg-secondary/50"}`}>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{item.label}</p>
              <p className={`text-xs sm:text-sm font-bold ${item.highlight ? "text-primary" : "text-foreground"}`}>{item.value}</p>
            </div>
          ))}
        </div>
        <div className="bg-card rounded-xl p-3 border border-border">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-accent" />
            <span className="text-xs font-bold text-accent">COMPATIBILIDADE: 97%</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Seu perfil é altamente compatível com o método. Alunos semelhantes geram em média {getGoalLabel(answers?.incomeGoal)} nos primeiros 30 dias.
          </p>
        </div>
      </div>
    </div>
  );
};

/* ─── Bonus Card ─── */
const BonusCard = ({ number, title, value, description }: { number: number; title: string; value: string; description: string }) => (
  <div className="funnel-card border-accent/20 bg-accent/5 space-y-2">
    <div className="flex items-center justify-between">
      <span className="text-xs font-bold text-accent bg-accent/15 px-2.5 py-1 rounded-full flex items-center gap-1.5">
        <Gift className="w-3.5 h-3.5" /> BÔNUS #{number}
      </span>
      <span className="text-xs text-muted-foreground line-through">{value}</span>
    </div>
    <p className="font-bold text-foreground text-base">{title}</p>
    <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
  </div>
);

/* ─── Testimonial Card ─── */
const TestimonialCard = ({ name, age, city, avatar, text, result }: { name: string; age: string; city: string; avatar: string; text: string; result?: string }) => (
  <div className="funnel-card border-primary/15 space-y-3">
    <div className="flex items-center gap-3">
      <img src={avatar} alt={name} className="w-12 h-12 rounded-full object-cover border-2 border-primary/30" />
      <div className="flex-1">
        <p className="font-bold text-base text-foreground">{name}, {age}</p>
        <p className="text-xs text-muted-foreground">{city}</p>
      </div>
      {result && (
        <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-full shrink-0">{result}</span>
      )}
    </div>
    <p className="text-sm text-foreground/85 italic leading-relaxed">"{text}"</p>
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-accent text-accent" />)}
    </div>
  </div>
);

/* ─── Testimonials Carousel ─── */
const TestimonialsCarousel = ({ testimonials }: { testimonials: { name: string; age: string; city: string; avatar: string; text: string; result?: string }[] }) => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  return (
    <div className="w-full space-y-4">
      <div className="text-center">
        <div className="flex items-center justify-center gap-1 mb-2">
          {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-accent text-accent" />)}
        </div>
        <h3 className="font-display text-xl font-bold text-foreground">
          +36.000 alunos. Resultados reais.
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Não acredite em mim. Acredite neles:
        </p>
      </div>

      <div className="relative overflow-hidden rounded-2xl" style={{ minHeight: 200 }}>
        {testimonials.map((t, i) => (
          <motion.div
            key={i}
            initial={false}
            animate={{
              opacity: i === current ? 1 : 0,
              x: i === current ? 0 : i < current ? -40 : 40,
              position: i === current ? "relative" : "absolute",
            }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="w-full top-0 left-0"
            style={{ pointerEvents: i === current ? "auto" : "none" }}
          >
            <TestimonialCard {...t} />
          </motion.div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-2">
        {testimonials.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className="relative w-2.5 h-2.5 rounded-full transition-all duration-300 cursor-pointer border-none p-0"
            style={{
              background: i === current ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.3)",
              transform: i === current ? "scale(1.3)" : "scale(1)",
            }}
          />
        ))}
      </div>
    </div>
  );
};

/* ─── WhatsApp Prints Carousel ─── */
const whatsappPrints = [
  { img: null as unknown as string, caption: "Primeiro saque em 3 dias 🔥" },
  { img: null as unknown as string, caption: "Resultado da primeira semana 💰" },
  { img: null as unknown as string, caption: "Sem acreditar no que vi 😱" },
  { img: null as unknown as string, caption: "Mostrei pro meu marido 🥹" },
];

const WhatsAppPrintsCarousel = () => {
  const [current, setCurrent] = useState(0);
  const imgs = [feedback1, feedback2, feedback3, feedback4];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % imgs.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="relative rounded-2xl overflow-hidden border border-primary/20 shadow-lg" style={{ background: "hsl(var(--card))" }}>
        <div className="relative" style={{ minHeight: 300 }}>
          {imgs.map((img, i) => (
            <motion.div
              key={i}
              initial={false}
              animate={{
                opacity: i === current ? 1 : 0,
                scale: i === current ? 1 : 0.95,
                position: i === current ? "relative" : "absolute",
              }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="w-full top-0 left-0"
              style={{ pointerEvents: i === current ? "auto" : "none" }}
            >
              <img src={img} alt={`Print WhatsApp ${i + 1}`} className="w-full h-auto object-cover" />
            </motion.div>
          ))}
        </div>

        {/* Caption overlay */}
        <motion.div
          key={current}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-0 left-0 right-0 px-4 py-3"
          style={{ background: "linear-gradient(to top, hsl(var(--card)), transparent)" }}
        >
          <p className="text-sm font-bold text-foreground text-center">
            {whatsappPrints[current].caption}
          </p>
        </motion.div>
      </div>

      {/* Thumbnails */}
      <div className="flex gap-2 justify-center">
        {imgs.map((img, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className="relative rounded-lg overflow-hidden border-2 transition-all duration-300 cursor-pointer p-0"
            style={{
              width: 56,
              height: 56,
              borderColor: i === current ? "hsl(var(--primary))" : "hsl(var(--border))",
              opacity: i === current ? 1 : 0.5,
              transform: i === current ? "scale(1.1)" : "scale(1)",
            }}
          >
            <img src={img} alt="" className="w-full h-full object-cover" />
            {i === current && (
              <motion.div
                layoutId="print-indicator"
                className="absolute inset-0 border-2 border-primary rounded-lg"
              />
            )}
          </button>
        ))}
      </div>

      {/* Counter */}
      <p className="text-center text-xs text-muted-foreground">
        <span className="text-primary font-bold">{current + 1}</span> de {imgs.length} prints verificados
      </p>
    </div>
  );
};

/* ─── Step Card with scroll animation ─── */
const StepCard = ({ item, index, isLast }: { item: { step: string; icon: React.ElementType; title: string; desc: string; detail: string }; index: number; isLast: boolean }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold: 0.3 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const IconComp = item.icon;

  return (
    <div ref={ref} className="relative">
      {/* Animated connector line */}
      {!isLast && (
        <motion.div
          className="absolute left-[22px] top-[56px] w-[2px] origin-top"
          style={{ background: "linear-gradient(to bottom, hsl(var(--primary) / 0.4), hsl(var(--primary) / 0.05))" }}
          initial={{ height: 0 }}
          animate={inView ? { height: "calc(100% - 16px)" } : { height: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
        />
      )}

      <div className="flex gap-4 items-start">
        {/* Animated circle */}
        <motion.div
          initial={{ scale: 0, rotate: -90 }}
          animate={inView ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -90 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 180, damping: 14 }}
          className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 border-2 border-primary/30 bg-primary/10 relative"
        >
          <IconComp className="w-5 h-5 text-primary" />
          {/* Pulse ring on appear */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-primary/40"
            initial={{ scale: 1, opacity: 0.6 }}
            animate={inView ? { scale: 1.6, opacity: 0 } : { scale: 1, opacity: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          />
        </motion.div>

        {/* Content */}
        <motion.div
          className="flex-1 space-y-1.5 pb-4"
          initial={{ opacity: 0, x: -24, y: 8 }}
          animate={inView ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, x: -24, y: 8 }}
          transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
        >
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              Passo {item.step}
            </span>
          </motion.div>
          <h4 className="font-bold text-foreground text-base">{item.title}</h4>
          <motion.p
            className="text-sm text-muted-foreground leading-relaxed"
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            {item.desc}
          </motion.p>
          <motion.p
            className="text-xs text-primary/80 font-medium mt-1"
            initial={{ opacity: 0, x: -12 }}
            animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -12 }}
            transition={{ delay: 0.45, duration: 0.4 }}
          >
            <ArrowRight className="w-3 h-3 inline mr-1" />{item.detail}
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
};

/* ─── FAQ Item ─── */
const FAQItem = ({ question, answer, icon: Icon }: { question: string; answer: string; icon: React.ElementType }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-xl overflow-hidden transition-all duration-200" style={{ background: open ? "rgba(250,204,21,0.03)" : "transparent" }}>
      <button
        onClick={() => {
          const next = !open;
          setOpen(next);
          if (next) trackFaqOpen(question);
        }}
        className="w-full flex items-center justify-between px-4 py-4 text-left cursor-pointer hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-2.5 pr-3">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <span className="font-bold text-foreground text-[15px] leading-snug">{question}</span>
        </div>
        <span 
          className="text-muted-foreground text-xl shrink-0 transition-transform duration-300 font-light" 
          style={{ transform: open ? "rotate(45deg)" : "rotate(0)" }}
        >+</span>
      </button>
      {open && (
        <div className="px-4 pb-4 animate-fade-in ml-[42px]">
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{answer}</p>
        </div>
      )}
    </div>
  );
};

/* ─── Fixed age sets per age group (no randomness) ─── */
const AGE_SETS: Record<string, [string, string, string]> = {
  "18 a 25 anos": ["22", "24", "21"],
  "26 a 35 anos": ["29", "33", "31"],
  "36 a 45 anos": ["38", "42", "40"],
  "46 a 55 anos": ["48", "52", "50"],
  "56 anos ou mais": ["57", "60", "55"],
  "18-25": ["22", "24", "21"],
  "26-35": ["29", "33", "31"],
  "36-45": ["38", "42", "40"],
  "46-55": ["48", "52", "50"],
  "56+":   ["57", "60", "55"],
};

const getFixedAges = (age?: string): [string, string, string] => {
  return AGE_SETS[age || ""] || AGE_SETS["46 a 55 anos"];
};

/* ─── People Like You (dynamic social proof) ─── */
const PeopleLikeYou = ({ answers }: { answers?: QuizAnswers }) => {
  const ages = getFixedAges(answers?.age);

  const getObstacleContext = (obstacle?: string) => {
    const map: Record<string, { hook: string; stories: { name: string; age: string; avatar: string; text: string; result: string }[] }> = {
      medo: {
        hook: "também tinham medo de cair em golpe — até que arriscaram uma última vez:",
        stories: [
          { name: "José Almeida", age: ages[0], avatar: avatarAntonio, result: "R$147/dia", text: "Já tinha perdido dinheiro duas vezes. Quase não entrei. Mas quando caiu o primeiro Pix, eu chorei. Não de alegria — de alívio." },
          { name: "Cláudia Reis", age: ages[1], avatar: avatarClaudia, result: "R$89/dia", text: "Minha filha insistiu. Eu dizia que era golpe. Entrei desconfiada. Quando vi o resultado na primeira semana, pedi desculpas pra ela." },
          { name: "Marcos Oliveira", age: ages[2], avatar: avatarCarlos, result: "R$210/dia", text: "Perdi meu emprego e ninguém contrata. Quando vi que dava pra fazer do celular, sem aparecer... mudou tudo." },
        ],
      },
      tempo: {
        hook: "também achavam que não tinham tempo — até descobrirem que 10 minutos bastam:",
        stories: [
          { name: "Roberto Lima", age: ages[0], avatar: avatarCarlos, result: "R$180/dia", text: "Trabalho o dia inteiro. Faço tudo em 10 minutos antes de dormir. Minha esposa nem acredita que gera renda." },
          { name: "Sandra Costa", age: ages[1], avatar: avatarClaudia, result: "R$95/dia", text: "Meu tempo livre é zero. Opero no intervalo do almoço e já não dependo de ninguém." },
          { name: "Paulo Mendes", age: ages[2], avatar: avatarAntonio, result: "R$230/dia", text: "Achava que ia ser mais uma coisa estressante. Levo menos tempo que assistir uma novela." },
        ],
      },
      inicio: {
        hook: "também se sentiam completamente perdidos — até receberem o suporte certo:",
        stories: [
          { name: "José Almeida", age: ages[0], avatar: avatarAntonio, result: "R$147/dia", text: "Nunca mexi com nada online. O suporte me pegou pela mão. Hoje opero sozinho." },
          { name: "Cláudia Reis", age: ages[1], avatar: avatarClaudia, result: "R$89/dia", text: "Tinha medo de apertar o botão errado. O suporte respondeu cada dúvida. Em 3 dias já tava fazendo sozinha." },
          { name: "Marcos Oliveira", age: ages[2], avatar: avatarCarlos, result: "R$210/dia", text: "Me sentia burro. Mas aqui ninguém te julga. Te ensinam quantas vezes precisar. Hoje eu ajudo os novatos." },
        ],
      },
      dinheiro: {
        hook: "também achavam que precisavam de muito dinheiro — e se surpreenderam:",
        stories: [
          { name: "Roberto Lima", age: ages[0], avatar: avatarCarlos, result: "R$180/dia", text: "Achei que precisava de milhares. Quando vi que dava pra começar com pouco, entendi que era pra gente como eu." },
          { name: "Sandra Costa", age: ages[1], avatar: avatarClaudia, result: "R$95/dia", text: "Tava devendo o cartão. Juntei o pouco que tinha e arrisquei. No terceiro dia já tinha recuperado tudo." },
          { name: "Paulo Mendes", age: ages[2], avatar: avatarAntonio, result: "R$230/dia", text: "Em uma semana já tava no positivo. Hoje vivo tranquilo." },
        ],
      },
    };
    return map[obstacle || ""] || map["medo"];
  };

  const ctx = getObstacleContext(answers?.obstacle);

  return (
    <div className="w-full space-y-4">
      <h3 className="font-display text-lg font-bold text-foreground text-center leading-snug">
        Pessoas com o <span className="text-gradient-green">mesmo perfil que o seu</span>
      </h3>
      <p className="text-sm text-muted-foreground text-center">
        Eles {ctx.hook}
      </p>
      <div className="space-y-3">
        {ctx.stories.map((p, i) => (
          <TestimonialCard key={i} name={p.name} age={`${p.age} anos`} city="" avatar={p.avatar} text={p.text} result={p.result} />
        ))}
      </div>
    </div>
  );
};

/* ─── Earnings Projection ─── */
const EarningsProjection = ({ answers, firstName }: { answers?: QuizAnswers; firstName: string }) => {
  const getGoalValues = (goal?: string) => {
    const map: Record<string, { daily: number }> = {
      "50-100": { daily: 75 }, "100-300": { daily: 200 },
      "300-500": { daily: 400 }, "500+": { daily: 600 },
    };
    return map[goal || ""] || { daily: 200 };
  };

  const getAgeGroup = (age?: string) => {
    const map: Record<string, string> = {
      "18-25": "18 a 25 anos", "26-35": "26 a 35 anos", "36-45": "36 a 45 anos",
      "46-55": "46 a 55 anos", "56+": "acima de 55 anos",
      "18 a 25 anos": "18 a 25 anos", "26 a 35 anos": "26 a 35 anos",
      "36 a 45 anos": "36 a 45 anos", "46 a 55 anos": "46 a 55 anos",
      "56 anos ou mais": "acima de 55 anos",
    };
    return map[age || ""] || "perfil semelhante ao seu";
  };

  const getAlumniCount = (age?: string) => {
    const map: Record<string, string> = {
      "18-25": "4.200", "26-35": "6.800", "36-45": "8.100",
      "46-55": "9.400", "56+": "7.500",
      "18 a 25 anos": "4.200", "26 a 35 anos": "6.800",
      "36 a 45 anos": "8.100", "46 a 55 anos": "9.400",
      "56 anos ou mais": "7.500",
    };
    return map[age || ""] || "8.000";
  };

  const { daily } = getGoalValues(answers?.incomeGoal);
  const ageGroup = getAgeGroup(answers?.age);
  const alumniCount = getAlumniCount(answers?.age);

  const projections = [
    { period: "Semana 1", value: Math.round(daily * 0.3), bar: 15, label: "Primeiros resultados", color: "hsl(var(--primary) / 0.4)" },
    { period: "Semana 2", value: Math.round(daily * 0.5), bar: 30, label: "Ganhando consistência", color: "hsl(var(--primary) / 0.55)" },
    { period: "Mês 1", value: Math.round(daily * 0.7 * 30), bar: 55, label: "Renda mensal sólida", color: "hsl(var(--primary) / 0.7)" },
    { period: "Mês 2", value: Math.round(daily * 0.85 * 30), bar: 75, label: "Crescimento acelerado", color: "hsl(var(--primary) / 0.85)" },
    { period: "Mês 3", value: Math.round(daily * 1 * 30), bar: 100, label: "Meta atingida", color: "hsl(var(--primary))" },
  ];

  return (
    <div className="w-full space-y-4">
      {/* Header with social proof */}
      <div className="text-center space-y-2">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-3 py-1"
        >
          <Users className="w-3.5 h-3.5 text-primary" />
          <span className="text-[11px] font-bold text-primary uppercase tracking-wider">Projeção personalizada</span>
        </motion.div>
        <h3 className="font-display text-lg font-bold text-foreground leading-snug">
          {firstName ? `${firstName}, ` : ""}Veja o que esperar nos próximos 90 dias
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Baseado nas suas respostas e nos resultados de{" "}
          <span className="text-primary font-bold">+{alumniCount} alunos</span> com{" "}
          <span className="font-semibold text-foreground">{ageGroup}</span> que já passaram por aqui.
        </p>
      </div>

      {/* Projection card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5 }}
        className="rounded-2xl overflow-hidden border border-primary/15"
        style={{ background: "linear-gradient(180deg, hsl(var(--card)), hsl(var(--primary) / 0.03))" }}
      >
        <div className="p-4 space-y-3.5">
          {projections.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.1, duration: 0.4 }}
              className="space-y-1.5"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: p.color }}
                  />
                  <span className="text-sm font-semibold text-foreground">{p.period}</span>
                  <span className="text-xs text-muted-foreground hidden sm:inline">— {p.label}</span>
                </div>
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="text-sm font-bold text-foreground tabular-nums"
                >
                  R${p.value.toLocaleString("pt-BR")}
                </motion.span>
              </div>
              <div className="w-full h-3 bg-secondary/60 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${p.bar}%` }}
                  transition={{ delay: 0.3 + i * 0.12, duration: 0.8, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, hsl(var(--primary) / 0.3), ${p.color})` }}
                />
              </div>
              <p className="text-[11px] text-muted-foreground sm:hidden">{p.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Bottom highlight */}
        <div className="px-4 py-3 border-t border-primary/10" style={{ background: "hsl(var(--primary) / 0.06)" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <span className="text-sm font-bold text-foreground">Potencial em 90 dias</span>
            </div>
            <motion.span
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.9, type: "spring" }}
              className="text-xl font-display font-bold text-primary"
            >
              R${(daily * 30).toLocaleString("pt-BR")}/mês
            </motion.span>
          </div>
        </div>
      </motion.div>

      {/* Social proof footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1 }}
        className="flex items-center gap-3 rounded-xl p-3 border border-border bg-secondary/30"
      >
        <div className="flex -space-x-2 shrink-0">
          {[avatarAntonio, avatarClaudia, avatarJose].map((av, i) => (
            <img key={i} src={av} alt="" className="w-7 h-7 rounded-full border-2 border-card object-cover" />
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground leading-snug">
          <span className="font-semibold text-foreground">+{alumniCount} alunos</span> com {ageGroup} já alcançaram resultados semelhantes usando o mesmo método.
        </p>
      </motion.div>

      <p className="text-[10px] text-muted-foreground/40 text-center">
        *Projeção baseada na média de resultados de alunos com perfil semelhante. Resultados individuais podem variar.
      </p>
    </div>
  );
};

/* ─── WhatsApp Welcome Preview ─── */
const WhatsAppWelcome = ({ firstName }: { firstName: string }) => {
  const name = firstName || "Aluno(a)";
  return (
    <div className="w-full space-y-3">
      <h3 className="font-display text-lg font-bold text-foreground text-center leading-snug">
        Isso é o que vai acontecer <span className="text-gradient-green">nos próximos 5 minutos</span>
      </h3>
      <p className="text-sm text-muted-foreground text-center">
        Assim que confirmar, você recebe essa mensagem no seu celular:
      </p>
      <div className="rounded-xl overflow-hidden border border-border shadow-xl" style={{ backgroundColor: "#111b21" }}>
        <div className="bg-[#1f2c34] px-3 py-2 flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#aebac1"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" transform="rotate(180 12 12)"/></svg>
          <img src={mentorPhoto} alt="Suporte" className="w-8 h-8 rounded-full object-cover" />
          <div>
            <p className="text-[#e9edef] text-sm font-normal">Suporte Ganhos Tempo Livre</p>
            <p className="text-[#8696a0] text-[11px]">online</p>
          </div>
        </div>
        <div className="px-3 py-3 space-y-1" style={{ backgroundColor: "#0b141a" }}>
          <div className="flex justify-center mb-2">
            <span className="bg-[#182229] text-[#8696a0] text-[11px] px-3 py-1 rounded-lg">HOJE</span>
          </div>
          {[
            `Olá ${name}! Seja muito bem-vindo(a) à família Ganhos Tempo Livre! 🎉`,
            `Meu nome é Ana e vou ser sua mentora pessoal.`,
            `Já liberei seu acesso completo. Vou te mandar o link agora 👇`,
            `Qualquer dúvida, me chama aqui. Estou aqui pra te ajudar em cada passo.`,
            `Amanhã já quero ver seu primeiro resultado! 💰`,
          ].map((text, i) => (
            <div key={i} className="flex justify-start mb-[3px]">
              <div className="max-w-[85%] bg-[#202c33] text-[#e9edef] px-[9px] py-[6px] rounded-[7.5px] rounded-tl-none text-[14px] leading-[19px]">
                <span>{text}</span>
                <span className="text-[11px] text-[#ffffff99] ml-2 float-right mt-[3px]">09:01</span>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-[#1f2c34] px-2 py-2 flex items-center gap-2">
          <div className="flex-1 bg-[#2a3942] rounded-full px-4 py-2">
            <span className="text-[#8696a0] text-sm">Mensagem</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-[#00a884] flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/></svg>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Video Testimonials Section ─── */
const VIDEO_TESTIMONIALS = [
  { id: "6844c2bcefb07ec7d1f69f35", padding: "56.42633228840125%", sdk: "v1" },
  { id: "681528f68fced9179fa2e1c3", padding: "56.25%", sdk: "v1" },
  { id: "68152914abe4fd17b1dc4ad1", padding: "56.25%", sdk: "v1" },
  { id: "692bc7a9eb5ec5285cecf25c", padding: "56.25%", sdk: "v4" },
];

const VideoTestimonialsSection = () => {
  useEffect(() => {
    const s1 = document.createElement("script");
    s1.src = "https://scripts.converteai.net/lib/js/smartplayer/v1/sdk.min.js";
    s1.async = true;
    document.head.appendChild(s1);
    const s4 = document.createElement("script");
    s4.src = "https://scripts.converteai.net/lib/js/smartplayer-wc/v4/sdk.js";
    s4.async = true;
    document.head.appendChild(s4);

    VIDEO_TESTIMONIALS.filter(v => v.sdk === "v1").forEach(v => {
      const iframe = document.getElementById(`ifr_${v.id}`) as HTMLIFrameElement;
      if (iframe) {
        iframe.src = `https://scripts.converteai.net/09ec79a4-c31f-44ce-ba7d-89003424c826/players/${v.id}/embed.html` +
          (window.location.search || "?") + "&vl=" + encodeURIComponent(window.location.href);
      }
    });
    const v4 = VIDEO_TESTIMONIALS.find(v => v.sdk === "v4");
    if (v4) {
      const iframe = document.getElementById(`ifr_${v4.id}`) as HTMLIFrameElement;
      if (iframe && iframe.src === "about:blank") {
        iframe.src = `https://scripts.converteai.net/09ec79a4-c31f-44ce-ba7d-89003424c826/players/${v4.id}/v4/embed.html` +
          (window.location.search || "?") + "&vl=" + encodeURIComponent(window.location.href);
      }
    }
    return () => { s1.remove(); s4.remove(); };
  }, []);

  return (
    <div className="w-full space-y-4">
      {VIDEO_TESTIMONIALS.map((v) => (
        <div key={v.id} className="w-full rounded-2xl overflow-hidden border border-border">
          <div id={`ifr_${v.id}_wrapper`} style={{ margin: "0 auto", width: "100%" }}>
            <div style={{ padding: `${v.padding} 0 0 0`, position: "relative" }} id={`ifr_${v.id}_aspect`}>
              <iframe
                frameBorder="0"
                allowFullScreen
                src="about:blank"
                id={`ifr_${v.id}`}
                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
                referrerPolicy="origin"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

/* ─── Photo Proof Gallery (autoplay carousel) ─── */
const PhotoProofGallery = ({ title, subtitle, images }: { title: React.ReactNode; subtitle: string; images: string[] }) => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <div className="w-full space-y-4">
      <div className="text-center space-y-1.5">
        <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-3 py-1 mx-auto">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Resultados reais</span>
        </div>
        <h3 className="font-display text-xl font-bold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{subtitle}</p>
      </div>

      {/* Main large image */}
      <div className="relative rounded-2xl overflow-hidden border border-primary/20 shadow-lg" style={{ background: "hsl(var(--card))" }}>
        <div className="relative" style={{ minHeight: 350 }}>
          {images.map((img, i) => (
            <motion.div
              key={i}
              initial={false}
              animate={{
                opacity: i === current ? 1 : 0,
                scale: i === current ? 1 : 0.95,
                position: i === current ? "relative" : "absolute",
              }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="w-full top-0 left-0"
              style={{ pointerEvents: i === current ? "auto" : "none" }}
            >
              <img src={img} alt={`Depoimento ${i + 1}`} className="w-full h-auto object-cover" />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Thumbnails row */}
      <div className="flex gap-2 justify-center">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className="relative rounded-lg overflow-hidden border-2 transition-all duration-300 cursor-pointer p-0"
            style={{
              width: 52,
              height: 52,
              borderColor: i === current ? "hsl(var(--primary))" : "hsl(var(--border))",
              opacity: i === current ? 1 : 0.5,
              transform: i === current ? "scale(1.1)" : "scale(1)",
            }}
          >
            <img src={img} alt="" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        <span className="text-primary font-bold">{current + 1}</span> de {images.length} prints verificados
      </p>
    </div>
  );
};

/* ─── Section Divider ─── */
const Divider = () => (
  <div className="w-full flex items-center gap-4 py-1">
    <div className="flex-1 h-px bg-border" />
    <span className="text-muted-foreground/30 text-lg">•</span>
    <div className="flex-1 h-px bg-border" />
  </div>
);

/* ─── Scroll Reveal wrapper ─── */
const ScrollReveal = ({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold: 0.15 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
};

/* ─── Section Tracker (IntersectionObserver) with scroll reveal ─── */
const SectionTracker = ({ id, children }: { id: string; children: React.ReactNode }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { trackSectionView(id); setRevealed(true); }
        else trackSectionLeave(id);
      },
      { threshold: 0.15 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [id]);
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════════════
   MAIN OFFER PAGE
   Structured following elite direct response frameworks:
   Hook → Story → Offer → Close
   ═══════════════════════════════════════════════════════════ */
const Step13Offer = ({ userName, answers }: Step13Props) => {
  const navigate = useNavigate();
  const [showCTA, setShowCTA] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900);
  const [spotsLeft] = useState(() => Math.floor(Math.random() * 4) + 3);


  // ─── Behavior Tracker Init ───
  useEffect(() => {
    const cleanup = initBehaviorTracker(
      answers ? { age: answers.age, incomeGoal: answers.incomeGoal, obstacle: answers.obstacle, device: answers.device, financialDream: answers.financialDream, contactMethod: answers.contactMethod, accountBalance: answers.accountBalance, triedOnline: answers.triedOnline, availability: answers.availability } : {},
      getPricing(answers?.accountBalance),
      answers?.accountBalance
    );
    return cleanup;
  }, []);

  useEffect(() => {
    saveFunnelEvent("offer_page_viewed", {
      user_name: userName || "anonymous",
      has_answers: !!answers,
      answers_summary: answers ? {
        age: answers.age, incomeGoal: answers.incomeGoal,
        obstacle: answers.obstacle, device: answers.device,
        financialDream: answers.financialDream, contactMethod: answers.contactMethod,
        accountBalance: answers.accountBalance,
      } : {},
      dynamic_price: getPricing(answers?.accountBalance).price,
    });
    const timer = setTimeout(() => {
      setShowCTA(true);
      saveFunnelEvent("offer_cta_revealed", { delay_ms: 4000 });
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const s = document.createElement("script");
    s.src = "https://scripts.converteai.net/lib/js/smartplayer-wc/v4/sdk.js";
    s.async = true;
    document.head.appendChild(s);
    const iframe = document.getElementById("ifr_687c23666137406f142acebc") as HTMLIFrameElement;
    if (iframe && iframe.src === "about:blank") {
      iframe.src = "https://scripts.converteai.net/09ec79a4-c31f-44ce-ba7d-89003424c826/players/687c23666137406f142acebc/v4/embed.html" +
        (window.location.search || "?") + "&vl=" + encodeURIComponent(window.location.href);
    }
    return () => { s.remove(); };
  }, []);

  useEffect(() => {
    const countdown = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(countdown);
  }, []);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const firstName = userName?.split(" ")[0] || "";
  const pricing = getPricing(answers?.accountBalance);

  const bonuses = [
    { title: "Guia: Primeiro Resultado em 24h", value: "R$97", description: "Passo a passo simplificado pra você ver dinheiro na conta ainda hoje. Sem enrolação." },
    { title: "Comunidade VIP no WhatsApp", value: "R$147", description: "Grupo exclusivo com +36.000 alunos que se ajudam todos os dias. Nunca mais fique sozinho." },
    { title: "Planilha de Controle Financeiro", value: "R$47", description: "Acompanhe seus ganhos diários de forma simples. Feita pra quem nunca mexeu com planilha." },
    { title: "Aulas: Segurança Digital", value: "R$97", description: "Aprenda a se proteger de golpes online e usar o celular com confiança total." },
    { title: "Suporte Humano por 90 Dias", value: "R$197", description: "Gente de verdade te ajudando. Sem robô, sem espera. Resposta em minutos." },
    { title: "Plano Personalizado pro Seu Perfil", value: "R$297", description: "Com base nas suas respostas, criamos um plano sob medida pra sua rotina e meta." },
  ];

  const faqs = [
    { 
      icon: HelpCircle, 
      question: "Eu não entendo nada de tecnologia. Vou conseguir?", 
      answer: `Essa é a dúvida mais comum — e a resposta é sim.\n\nO método foi feito pra quem nunca abriu nada além do WhatsApp. São instruções passo a passo, com vídeos curtos e suporte humano real. Dos nossos 36.000 alunos, a maioria tem entre 45 e 65 anos e começou do zero absoluto.\n\nSe você está lendo isso agora, você já tem a habilidade necessária.`
    },
    { 
      icon: Smartphone, 
      question: "Funciona só pelo celular? Preciso de computador?", 
      answer: `Funciona 100% pelo celular. Na verdade, a maioria dos nossos alunos que mais ganham usa apenas o celular — deitados no sofá, no intervalo do almoço, ou esperando o ônibus.\n\nNão precisa de internet rápida, não precisa de computador, não precisa de nada especial. Só o celular que já está na sua mão.`
    },
    { 
      icon: Clock, 
      question: "Quanto tempo por dia eu preciso dedicar?", 
      answer: `15 a 30 minutos. Sério.\n\nIsso não é um segundo emprego. É uma ferramenta que trabalha pra você. Você configura uma vez, acompanha quando quiser, e os ganhos aparecem.\n\nTem aluno que olha de manhã e de noite. Tem aluno que olha uma vez por dia. Cada um no seu ritmo.`
    },
    { 
      icon: TrendingUp, 
      question: "Mas em quanto tempo eu começo a ganhar?", 
      answer: `Muitos alunos veem o primeiro resultado no mesmo dia que configuram. Outros levam 2-3 dias pra se acostumar com o painel.\n\nO ponto é: não é um curso de 6 meses onde você só vê resultado depois. Aqui, você aplica hoje e vê o resultado hoje. É renda prática, não teoria.`
    },
    { 
      icon: ShieldCheck, 
      question: "E se eu não gostar? Perco meu dinheiro?", 
      answer: `Impossível perder.\n\nVocê tem 30 dias de garantia incondicional. Se não gostar — por qualquer motivo, mesmo que seja "mudei de ideia" — você manda uma mensagem e devolvemos 100% do valor. Sem perguntas, sem formulário, sem espera.\n\nO risco é zero. Literalmente zero. Se não funcionar pra você, quem perde somos nós — não você.`
    },
    { 
      icon: AlertTriangle, 
      question: "Já fui enganado antes. Como sei que não é golpe?", 
      answer: `Sua desconfiança é 100% válida. A internet está cheia de promessas vazias.\n\nMas repare: nós oferecemos 30 dias de garantia total, temos suporte humano que responde em minutos, e mais de 36.000 pessoas já passaram por aqui. Você pode testar o método inteiro e, se achar que não vale, recebe tudo de volta.\n\nGolpe não oferece garantia. Golpe não tem suporte. Golpe não deixa você testar antes. Nós fazemos tudo isso porque sabemos que funciona.`
    },
    { 
      icon: CreditCard, 
      question: `R$${formatPrice(pricing.price)} é tudo? Tem alguma taxa depois?`, 
      answer: `R$${formatPrice(pricing.price)} é o valor total. Ponto final.\n\nNão tem mensalidade, não tem taxa escondida, não tem "desbloqueio premium" por mais dinheiro. Você paga uma única vez e recebe acesso completo — ao método, à plataforma, ao suporte humano e a todos os bônus.\n\nÉ menos que uma pizza. E o retorno pode aparecer no mesmo dia.`
    },
    { 
      icon: Lock, 
      question: "Preciso colocar mais dinheiro depois pra funcionar?", 
      answer: `Não. Zero.\n\nO método ensina a gerar ganhos sem investimento adicional. O único valor envolvido é o R$${formatPrice(pricing.price)} de acesso. Tudo que vier depois é lucro líquido pra você.\n\nNão pedimos PIX, não pedimos depósito, não pedimos nada além do acesso. Quem diz o contrário está mentindo.`
    },
  ];

  const fixedAges = getFixedAges(answers?.age);
  const testimonials = [
    { name: "Sebastião Moreira", age: `${fixedAges[0]} anos`, city: "Manaus, AM", avatar: avatarJose, text: "Minha renda não cobria o aluguel. Vivia contando moeda. Hoje tenho uma renda extra que me devolveu a dignidade de não precisar pedir nada a ninguém.", result: "R$147/dia" },
    { name: "Regina Aparecida", age: `${fixedAges[1]} anos`, city: "Campinas, SP", avatar: avatarRegina, text: "Fui demitida depois de anos. Com dois filhos, o desespero bateu. Em duas semanas já tinha pagado a conta de luz que tava cortada.", result: "R$210/dia" },
    { name: "Luciana Borges", age: `${fixedAges[2]} anos`, city: "Fortaleza, CE", avatar: avatarLucia, text: "Meu marido ria de mim quando disse que ia ganhar dinheiro pelo celular. Hoje ele me pede pra ensinar. Marcamos a viagem que sonhávamos há anos.", result: "R$180/dia" },
  ];

  return (
    <div className="animate-slide-up flex flex-col items-center w-full max-w-lg mx-auto px-4 sm:px-5 py-5 sm:py-6 gap-5 sm:gap-6">

      {/* ═══ 1. URGENCY TIMER ═══ */}
      <SectionTracker id="urgency">
        <UrgencyStrip minutes={minutes} seconds={seconds} show={true} priceLabel={formatPrice(pricing.price)} installmentLabel={formatPrice(pricing.installment)} />
      </SectionTracker>

      {/* ═══ 2. PROFILE ANALYSIS (approved status) ═══ */}
      <SectionTracker id="profile_analysis">
        <ProfileAnalysis answers={answers} firstName={firstName} />
      </SectionTracker>

      <SectionTracker id="hero">
        <div className="text-center space-y-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/25 rounded-full px-4 py-1.5 mb-3">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-bold text-primary uppercase tracking-wider">Acesso liberado</span>
            </div>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="font-display text-[22px] sm:text-2xl font-bold text-foreground leading-snug"
          >
            {firstName ? `${firstName}, sua` : "Sua"} chave de acesso está{" "}
            <span className="text-gradient-green">pronta</span>.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-base sm:text-lg text-foreground/90 leading-relaxed"
          >
            Falta <span className="text-primary font-bold">um único passo</span> pra você começar a gerar renda extra todos os dias — direto do seu celular.
          </motion.p>
        </div>
      </SectionTracker>

      {/* ═══ 3b. VSL VIDEO (ConverteAI) ═══ */}
      <SectionTracker id="vsl_video">
        <div className="w-full rounded-2xl overflow-hidden border border-border">
          <div id="ifr_687c23666137406f142acebc_wrapper" style={{ margin: "0 auto", width: "100%" }}>
            <div style={{ position: "relative", padding: "56.25% 0 0 0" }} id="ifr_687c23666137406f142acebc_aspect">
              <iframe
                frameBorder="0"
                allowFullScreen
                src="about:blank"
                id="ifr_687c23666137406f142acebc"
                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
                referrerPolicy="origin"
              />
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2 flex items-center justify-center gap-1.5">
          <ArrowRight className="w-3 h-3" /> Assista e entenda como funciona em 4 minutos
        </p>
      </SectionTracker>

      {/* ═══ 3c. EXPLICAÇÃO DA TAXA — visual card ═══ */}
      <ScrollReveal>
        <div
          className="w-full rounded-2xl overflow-hidden border border-primary/20"
          style={{ background: "linear-gradient(135deg, hsl(var(--primary) / 0.08), hsl(var(--card)))" }}
        >
        {/* Header strip */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-primary/10" style={{ background: "hsl(var(--primary) / 0.06)" }}>
          <img src={chatgptLogo} alt="ChatGPT" className="w-8 h-8 object-contain rounded-lg" />
          <div>
            <p className="text-sm font-bold text-foreground">Powered by ChatGPT</p>
            <p className="text-[11px] text-muted-foreground">Inteligência Artificial OpenAI</p>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Price breakdown visual */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl p-3 text-center border border-primary/15 bg-primary/5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Você paga</p>
              <p className="text-xl font-display font-bold text-foreground">
                R$<span className="text-primary">{formatPrice(pricing.price)}</span>
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Taxa dos tokens de IA</p>
            </div>
            <div className="rounded-xl p-3 text-center border border-accent/15 bg-accent/5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Nós ficamos com</p>
              <p className="text-xl font-display font-bold text-foreground">R$0</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Zero. Nada. Nenhum centavo.</p>
            </div>
          </div>

          {/* Profit share explanation */}
          <div className="rounded-xl p-3 border border-border bg-card space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                <Zap className="w-3.5 h-3.5 text-primary" />
              </div>
              <p className="text-sm font-bold text-foreground">Como ganhamos então?</p>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Só depois de <span className="font-bold text-foreground">30 dias</span>, quando você já estiver lucrando, cobramos apenas{" "}
              <span className="text-primary font-bold">2% dos seus lucros</span>.
            </p>
            <div className="flex items-center gap-2 bg-primary/8 rounded-lg px-3 py-2 border border-primary/15">
              <CheckCircle className="w-4 h-4 text-primary shrink-0" />
              <p className="text-xs font-medium text-foreground">
                Só ganhamos quando <span className="text-primary font-bold">você ganha</span>. Simples assim.
              </p>
            </div>
          </div>
        </div>
        </div>
      </ScrollReveal>

      {/* ═══ 5. MENTOR CREDIBILITY ═══ */}
      <SectionTracker id="mentor">
        <div className="flex gap-4 w-full funnel-card border-primary/20 bg-primary/5">
          <img src={mentorPhoto} alt="Ricardo" className="w-14 h-14 rounded-full object-cover border-2 border-primary/40 shrink-0" />
          <div>
            <p className="text-sm text-foreground/90 italic leading-relaxed">
              "{firstName ? `${firstName}, ` : ""}Eu sei que você já foi enganado antes. Por isso eu coloco minha cara. Se você não tiver resultado em 30 dias, eu devolvo seu dinheiro pessoalmente. Sem joguinho."
            </p>
            <p className="text-muted-foreground text-xs mt-2 not-italic font-semibold">— Ricardo Almeida • Criador do método • +36.000 alunos</p>
          </div>
        </div>
      </SectionTracker>

      {/* ═══ PRINTS REAIS — antes de Como Funciona ═══ */}
      <ScrollReveal>
        <PhotoProofGallery
          title={<>Alunos lucrando <span className="text-gradient-green">todos os dias</span></>}
          subtitle="Prints reais enviados pelos alunos no grupo. Sem edição."
          images={[depo1, depo2, depo3, depo4, depo5]}
        />
      </ScrollReveal>

      <Divider />

      {/* ═══ COMO FUNCIONA — 3 passos ═══ */}
      <SectionTracker id="how_it_works">
        <div className="w-full space-y-5">
          <div className="text-center">
            <p className="text-[11px] uppercase tracking-widest font-semibold text-primary mb-1.5">
              Simples assim
            </p>
            <h3 className="font-display text-xl font-bold text-foreground">
              Como funciona na prática?
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              3 passos. Sem complicação. Sem conhecimento técnico.
            </p>
          </div>

          {(() => {
            const steps = [
              {
                step: "1",
                icon: Smartphone,
                title: "Acesse pelo celular",
                desc: "Você recebe o acesso por e-mail e WhatsApp. Abre no celular — como abrir qualquer site. Não precisa instalar nada.",
                detail: "Funciona em qualquer celular, mesmo os mais simples.",
              },
              {
                step: "2",
                icon: Bot,
                title: "Ative a IA com 1 clique",
                desc: "A inteligência artificial do ChatGPT começa a trabalhar por você automaticamente. É como apertar um botão e deixar a máquina fazer o trabalho.",
                detail: "Você não precisa entender como funciona por dentro. Só ativar.",
              },
              {
                step: "3",
                icon: TrendingUp,
                title: "Acompanhe seus ganhos",
                desc: "Os resultados aparecem no seu painel. Você acompanha pelo celular, na hora que quiser. Pode sacar quando quiser.",
                detail: "A maioria dos alunos vê o primeiro resultado no mesmo dia.",
              },
            ];
            return steps.map((item, i) => (
              <StepCard key={i} item={item} index={i} isLast={i === steps.length - 1} />
            ));
          })()}

          <div className="funnel-card border-primary/20 bg-primary/5 text-center space-y-2">
            <p className="text-sm text-foreground font-medium leading-relaxed">
              <span className="font-bold">Resumo:</span> você acessa, ativa e acompanha.{" "}
              <span className="text-primary font-bold">A IA faz o resto.</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Tempo médio pra configurar: <span className="font-bold text-foreground">menos de 10 minutos</span>
            </p>
          </div>
        </div>
      </SectionTracker>

      <Divider />

      {/* ═══ 6. CTA 1 ═══ */}
      <CTABlock showCTA={showCTA} context="Restam apenas poucas vagas hoje" pricing={pricing} />

      <Divider />

      {/* ═══ 7. SOCIAL PROOF (people like you) ═══ */}
      <SectionTracker id="social_proof">
        <PeopleLikeYou answers={answers} />
      </SectionTracker>

      {/* ═══ 8. EARNINGS PROJECTION ═══ */}
      <SectionTracker id="earnings_projection">
        <EarningsProjection answers={answers} firstName={firstName} />
      </SectionTracker>

      {/* ═══ 9. CTA 2 ═══ */}
      <CTABlock showCTA={showCTA} pricing={pricing} />

      <Divider />

      {/* ═══ PRINTS REAIS 2 — antes de Acesso Completo ═══ */}
      <ScrollReveal>
        <PhotoProofGallery
          title={<>Veja o que falam da <span className="text-gradient-green">plataforma</span></>}
          subtitle="Mensagens espontâneas de quem já usa o método no dia a dia."
          images={[depo5, depo6, depo7, depo8, depo9]}
        />
      </ScrollReveal>

      <Divider />

      {/* ═══ 10. VALUE STACK — What you get ═══ */}
      <ScrollReveal>
      <div className="w-full space-y-4">
        <div className="text-center">
          <p className="text-xs uppercase tracking-wider text-accent font-bold mb-1">ACESSO COMPLETO</p>
          <h3 className="font-display text-xl font-bold text-foreground">Tudo que você recebe hoje:</h3>
        </div>
        {[
          { text: "Acesso vitalício à plataforma Alfa Híbrida", value: "R$497" },
          { text: "Método passo a passo — do zero ao resultado", value: "R$297" },
          { text: "Vídeo-aulas em linguagem simples e direta", value: "R$197" },
          { text: "Suporte humano em tempo real via WhatsApp", value: "R$197" },
          { text: "Comunidade exclusiva com +36.000 alunos", value: "R$147" },
          { text: "Plano personalizado pro seu perfil", value: "R$297" },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0">
            <CheckCircle className="w-5 h-5 text-primary shrink-0" />
            <p className="text-sm text-foreground leading-snug flex-1">{item.text}</p>
            <span className="text-xs text-muted-foreground line-through shrink-0">{item.value}</span>
          </div>
        ))}
        <div className="text-center pt-2">
          <p className="text-sm text-muted-foreground">Valor total da plataforma:</p>
          <p className="text-lg text-muted-foreground line-through">R$1.632,00</p>
        </div>
      </div>
      </ScrollReveal>

      <Divider />

      {/* ═══ VIDEO TESTIMONIALS (após acesso completo) ═══ */}
      <ScrollReveal>
      <div className="w-full space-y-3">
        <h3 className="font-display text-lg font-bold text-foreground text-center">
          Depoimentos em <span className="text-gradient-green">vídeo</span>
        </h3>
        <p className="text-sm text-muted-foreground text-center">
          Assista quem já mudou de vida:
        </p>
        <VideoTestimonialsSection />
      </div>
      </ScrollReveal>

      <Divider />
      <ScrollReveal>
      <div className="w-full space-y-4">
        <div className="text-center">
          <img src={giftBox} alt="Presente" className="w-20 h-20 object-contain mx-auto mb-2" />
          <p className="text-xs uppercase tracking-wider text-accent font-bold mb-1">BÔNUS EXCLUSIVOS</p>
          <h3 className="font-display text-xl font-bold text-foreground">
            E mais: <span className="text-accent">6 bônus</span> pra você sair na frente
          </h3>
          <p className="text-sm text-muted-foreground mt-1">Inclusos no seu acesso. Sem pagar nada a mais.</p>
        </div>

        

        {bonuses.map((b, i) => (
          <BonusCard key={i} number={i + 1} {...b} />
        ))}

        <div className="funnel-card border-accent/30 bg-accent/5 text-center space-y-1">
          <p className="text-sm text-muted-foreground">Valor total dos bônus:</p>
          <p className="text-xl text-muted-foreground line-through font-semibold">R$882,00</p>
          <p className="text-lg font-bold text-accent flex items-center justify-center gap-2"><Gift className="w-5 h-5" /> Hoje: GRÁTIS com seu acesso</p>
        </div>
      </div>
      </ScrollReveal>

      {/* ═══ 12. CTA 3 ═══ */}
      <CTABlock showCTA={showCTA} pricing={pricing} />

      <Divider />

      {/* ═══ 13. PRICE ANCHOR (why R$66) ═══ */}
      <ScrollReveal>
      <div className="w-full space-y-5">
        <div className="text-center space-y-2">
          <h3 className="font-display text-xl font-bold text-foreground">
            Tudo isso por <span className="text-gradient-green">quanto?</span>
          </h3>
          <p className="text-sm text-muted-foreground">
            Vamos fazer as contas juntos:
          </p>
        </div>

        {/* Price comparison */}
        <div className="funnel-card border-border space-y-3">
          <div className="flex justify-between items-center py-1.5 border-b border-border/50">
            <span className="text-sm text-muted-foreground">Plataforma completa</span>
            <span className="text-sm text-muted-foreground line-through">R$1.632</span>
          </div>
          <div className="flex justify-between items-center py-1.5 border-b border-border/50">
            <span className="text-sm text-muted-foreground">6 bônus exclusivos</span>
            <span className="text-sm text-muted-foreground line-through">R$882</span>
          </div>
          <div className="flex justify-between items-center py-1.5 border-b border-border/50">
            <span className="text-sm text-muted-foreground">Suporte humano 90 dias</span>
            <span className="text-sm text-muted-foreground line-through">R$197</span>
          </div>
          <div className="flex justify-between items-center py-1.5">
            <span className="text-sm font-bold text-foreground">Valor total real</span>
            <span className="text-sm font-bold text-muted-foreground line-through">R$2.711</span>
          </div>
        </div>

        {/* AI cost explanation */}
        <div className="funnel-card border-primary/25 bg-card text-center space-y-4">
          <img src={chatgptLogo} alt="ChatGPT" className="w-10 h-10 object-contain mx-auto rounded-xl" />
          <p className="text-sm text-muted-foreground leading-relaxed text-left">
            A plataforma usa a <span className="font-bold text-foreground">inteligência artificial do ChatGPT</span> pra trabalhar por você.
            Cada operação consome <span className="font-bold text-foreground">tokens de IA</span> — e esses tokens têm custo real.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed text-left">
            O valor abaixo é <span className="font-bold text-foreground">apenas a taxa do token</span>.
            Nós <span className="text-primary font-bold">não ficamos com nenhum centavo</span> desse pagamento.
          </p>
          <div className="bg-primary/10 rounded-xl p-3 border border-primary/20 text-left">
            <p className="text-sm text-foreground leading-relaxed">
              <span className="font-bold">Como ganhamos?</span> Só depois de 30 dias, quando você já estiver lucrando,
              cobramos apenas <span className="text-primary font-bold">2% dos seus lucros</span>.
              Ou seja: <span className="font-bold">só ganhamos quando você ganha.</span>
            </p>
          </div>

          <Separator />

          {/* Price hero inside card */}
          <div className="pt-2 pb-1 space-y-5">
            <p className="text-[10px] uppercase tracking-[0.2em] text-primary font-bold">Você paga apenas</p>

            <div className="space-y-1">
              <p className="text-sm sm:text-base text-muted-foreground font-medium">{pricing.installments}x de</p>
              <p className="text-[3.2rem] sm:text-[4rem] font-display font-black text-foreground leading-none tracking-tight">
                R$<span className="text-gradient-green">{formatPrice(pricing.installment)}</span>
              </p>
            </div>

            <div className="flex items-center gap-3 justify-center">
              <div className="flex-1 max-w-[60px] h-px bg-border" />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">ou</span>
              <div className="flex-1 max-w-[60px] h-px bg-border" />
            </div>

            <p className="text-base sm:text-lg text-foreground font-semibold">
              R${formatPrice(pricing.price)} <span className="text-muted-foreground font-normal text-sm">à vista no Pix</span>
            </p>

            <div className="rounded-xl p-3 border border-accent/15 bg-accent/5">
              <p className="text-sm text-foreground leading-relaxed text-center">
                Isso é <span className="text-primary font-bold">menos que um lanche no fim de semana</span> — por algo que pode trazer tranquilidade financeira pra você e sua família.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-2 pt-1">
            {["Pix (desconto)", "Cartão de Crédito", "Boleto"].map((m) => (
              <span key={m} className="text-xs bg-secondary px-3 py-1.5 rounded-full text-muted-foreground font-medium">{m}</span>
            ))}
          </div>
        </div>
      </div>
      </ScrollReveal>

      {/* ═══ 14. CTA 4 ═══ */}
      <CTABlock showCTA={showCTA} context="Garantia incondicional de 30 dias" pricing={pricing} />

      <Divider />

      {/* ═══ 15. GUARANTEE (risk reversal) ═══ */}
      <ScrollReveal>
      <div className="w-full funnel-card border-accent/30 bg-accent/5 space-y-4">
        <div className="flex items-start gap-4">
          <img src={guaranteeSeal} alt="Garantia" className="w-20 h-20 shrink-0 object-contain" />
          <div>
            <h3 className="font-display text-lg font-bold text-foreground">Garantia Blindada de 30 Dias</h3>
            <p className="text-xs text-accent font-bold uppercase tracking-wider mt-1">RISCO ZERO PRA VOCÊ</p>
          </div>
        </div>
        <p className="text-sm text-foreground/85 leading-relaxed">
          {firstName ? `${firstName}, funciona` : "Funciona"} assim: você entra, testa a plataforma por 30 dias inteiros.
          Se por <strong>qualquer motivo</strong> — mesmo que seja "não gostei da cor do botão" — achar que não é pra você,
          basta mandar <strong>uma única mensagem</strong> e devolvemos <strong>100% do seu dinheiro</strong>.
          Sem perguntas. Sem burocracia. Sem letra miúda.
        </p>
        <div className="bg-card rounded-xl p-3 border border-border">
          <p className="text-sm text-primary font-bold text-center flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4" /> Ou você lucra, ou recebe seu dinheiro de volta. Simples assim.
          </p>
        </div>
      </div>
      </ScrollReveal>

      <Divider />

      {/* ═══ 16. OBJECTION BREAKING ═══ */}
      <ScrollReveal>
      <div className="w-full space-y-4">
        <h3 className="font-display text-xl font-bold text-foreground text-center">
          Talvez você ainda esteja pensando...
        </h3>

        {(() => {
          const ageLabel = answers?.age === "18-25" ? "jovem" : answers?.age === "26-35" ? "na casa dos 30" : answers?.age === "36-45" ? "na casa dos 30 e 40" : answers?.age === "56+" ? "com mais de 50 anos" : "com mais de 40 anos";
          const ageObjText = answers?.age === "18-25" ? '"Sou muito novo pra isso..."' : answers?.age === "26-35" ? '"Será que funciona pra quem tem menos de 35?"' : answers?.age === "56+" ? '"Já tenho mais de 55 anos... será que funciona pra mim?"' : '"Já tenho mais de 40, 50 anos... será que funciona pra mim?"';
          const ageObjResp = answers?.age === "18-25"
            ? "Muitos dos nossos alunos mais jovens estão construindo sua independência financeira desde cedo. A vantagem é ter mais tempo e energia. Se você usa o celular, já tem tudo que precisa."
            : answers?.age === "26-35"
            ? "Temos milhares de alunos na faixa dos 26 a 35 anos. O método é simples e direto — ideal pra quem quer uma renda extra sem complicação."
            : `A maioria dos nossos alunos tem perfil ${ageLabel}. O método foi desenhado pra quem não tem experiência com tecnologia. Se você usa WhatsApp, você já tem tudo que precisa.`;
          return [
            { objection: ageObjText, response: ageObjResp },
            { objection: '"Já perdi dinheiro na internet antes..."', response: "Exatamente por isso existe a garantia de 30 dias. Você testa sem risco. Se não gostar, devolvo cada centavo. Diferente de golpe, aqui você tem proteção total." },
            { objection: '"Não tenho dinheiro sobrando..."', response: `São R$${formatPrice(pricing.price)} uma única vez. Muitos alunos recuperam esse valor no primeiro dia. E se não recuperar em 30 dias, você recebe tudo de volta. Risco zero.` },
            { objection: '"Tenho medo de tecnologia..."', response: "Nosso suporte te acompanha em cada clique. Literalmente. Manda mensagem no WhatsApp e alguém responde em minutos. Você nunca vai ficar perdido." },
          ];
        })().map((item, i) => (
          <div key={i} className="funnel-card border-border space-y-2">
            <p className="text-sm text-foreground/60 italic">{item.objection}</p>
            <div className="flex gap-2">
              <ArrowRight className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="text-sm text-foreground font-medium leading-relaxed">{item.response}</p>
            </div>
          </div>
        ))}
      </div>
      </ScrollReveal>

      <Divider />

      {/* ═══ 17. TESTIMONIALS ═══ */}
      <ScrollReveal>
        <TestimonialsCarousel testimonials={testimonials} />
      </ScrollReveal>

      <Divider />

      {/* ═══ 19. WHATSAPP FEEDBACK SCREENSHOTS ═══ */}
      <ScrollReveal>
      <div className="w-full space-y-4">
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-3 py-1 mx-auto">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Conversas reais</span>
          </div>
          <h3 className="font-display text-xl font-bold text-foreground">
            Olha o que estão mandando <span className="text-gradient-green">agora mesmo</span>
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Prints diretos do grupo de alunos. Sem edição, sem filtro.
          </p>
        </div>

        <WhatsAppPrintsCarousel />
      </div>
      </ScrollReveal>

      {/* ═══ 20. CTA 5 ═══ */}
      <CTABlock showCTA={showCTA} pricing={pricing} />

      <Divider />

      {/* ═══ 21. EMOTIONAL FUTURE PACING ═══ */}
      <ScrollReveal>
      <div className="w-full funnel-card border-primary/20 bg-primary/5 space-y-4">
        <h3 className="font-display text-xl font-bold text-foreground text-center leading-snug">
          {firstName ? `${firstName}, fecha` : "Fecha"} os olhos e imagina...
        </h3>
        <div className="space-y-3">
          {([
            { icon: Sun, text: "Acordar e ver que já ganhou dinheiro — antes mesmo de tomar café" },
            { icon: CreditCard, text: "Pagar todas as contas em dia, sem aquele aperto no peito" },
            { icon: Heart, text: "Dar algo bom pra sua família sem precisar pensar duas vezes" },
            { icon: Eye, text: "Olhar pro extrato do banco e sentir orgulho do que construiu" },
            { icon: Unlock, text: "Não depender de ninguém. Ninguém. Nunca mais." },
          ] as const).map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * i, duration: 0.35 }}
              className="flex items-start gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                <item.icon className="w-4 h-4 text-primary" />
              </div>
              <p className="text-sm text-foreground leading-relaxed">{item.text}</p>
            </motion.div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground text-center italic pt-2">
          Tudo isso pode começar <span className="text-primary font-bold not-italic">hoje</span>. Por menos de R${formatPrice(pricing.price / 30)} por dia.
        </p>
      </div>
      </ScrollReveal>

      <Divider />

      {/* ═══ 22. WHATSAPP WELCOME ═══ */}
      <ScrollReveal>
        <WhatsAppWelcome firstName={firstName} />
      </ScrollReveal>

      <Divider />

      {/* ═══ 23. FAQ ═══ */}
      <ScrollReveal>
      <div className="w-full space-y-2.5">
        <div className="text-center mb-4">
          <p className="text-[11px] uppercase tracking-widest font-semibold text-primary mb-1.5">
            Tire suas dúvidas
          </p>
          <h3 className="font-display text-xl font-bold text-foreground">
            Tudo o que você precisa saber
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Se a sua dúvida não estiver aqui, nosso suporte responde em minutos.
          </p>
        </div>
        {faqs.map((faq, i) => (
          <FAQItem key={i} {...faq} />
        ))}
        <div className="text-center pt-2">
          <p className="text-xs text-muted-foreground">
            Ainda com dúvida? <span className="text-primary font-semibold">O suporte está online agora.</span>
          </p>
        </div>
      </div>
      </ScrollReveal>

      <Divider />

      {/* ═══ 24. FINAL URGENCY + CLOSE ═══ */}
      <ScrollReveal>
      <div className="w-full space-y-5 text-center">
        <div className="funnel-card border-destructive/30 bg-destructive/5 space-y-3">
          <div className="flex items-center justify-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-destructive animate-pulse" />
            <p className="text-sm font-bold text-destructive uppercase tracking-wider">Última chance</p>
          </div>
          <p className="text-base font-bold text-foreground leading-snug">
            {firstName ? `${firstName}, essa` : "Essa"} condição de 12x de R${formatPrice(pricing.installment)} é exclusiva pra quem completou a análise agora.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Ao sair desta página, o valor volta para R$297 e os bônus são removidos.
          </p>
          <p className="text-3xl font-display font-bold text-foreground">
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </p>
        </div>

        <CTABlock showCTA={showCTA} context="Garantia de 30 dias · Acesso imediato · Suporte humano" pricing={pricing} />

        <div className="w-full space-y-4 pt-2">
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs text-muted-foreground font-medium">Compra segura</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs text-muted-foreground font-medium">Garantia 30 dias</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs text-muted-foreground font-medium">Suporte real</span>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            {["Visa", "Mastercard", "Pix", "Boleto", "Elo", "Amex"].map((b) => (
              <span key={b} className="text-[11px] text-muted-foreground bg-secondary/60 border border-border/50 px-3 py-1.5 rounded-lg font-medium">{b}</span>
            ))}
          </div>

          <div className="flex items-start gap-3 rounded-xl p-3 border border-primary/15 bg-primary/5 text-left">
            <img src={mentorPhoto} alt="Ricardo" className="w-10 h-10 rounded-full object-cover border-2 border-primary/30 shrink-0" />
            <div>
              <p className="text-xs text-foreground leading-relaxed">
                "Se em 30 dias você não tiver nenhum resultado, eu pessoalmente devolvo seu dinheiro. Sem pergunta, sem formulário. Minha palavra."
              </p>
              <p className="text-[10px] text-muted-foreground mt-1 font-semibold">— Ricardo Almeida, criador do método</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="text-center rounded-lg bg-secondary/30 py-2.5 px-2">
              <p className="text-base font-bold text-foreground">36.847</p>
              <p className="text-[10px] text-muted-foreground">alunos ativos</p>
            </div>
            <div className="text-center rounded-lg bg-secondary/30 py-2.5 px-2">
              <p className="text-base font-bold text-foreground">4.8<span className="text-xs text-muted-foreground">/5</span></p>
              <p className="text-[10px] text-muted-foreground">satisfação</p>
            </div>
            <div className="text-center rounded-lg bg-secondary/30 py-2.5 px-2">
              <p className="text-base font-bold text-foreground">2 min</p>
              <p className="text-[10px] text-muted-foreground">resposta suporte</p>
            </div>
          </div>
        </div>

      </div>
      </ScrollReveal>
    </div>
  );
};

export default Step13Offer;
