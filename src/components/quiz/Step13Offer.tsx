import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Lock, Zap, ArrowRight, Star, Users, Clock, CheckCircle, Smartphone, Bot, TrendingUp, HelpCircle, CreditCard, ShieldCheck, AlertTriangle, CircleDollarSign, Sun, Heart, Eye, Unlock, Gift } from "lucide-react";
import { saveFunnelEvent } from "@/lib/metricsClient";
import { buildTrackingQueryString } from "@/lib/trackingDataLayer";
import { initBehaviorTracker, trackSectionView, trackSectionLeave, trackCtaView, trackCtaHesitation, trackCheckoutClick, trackFaqOpen, trackVideoStart } from "@/lib/behaviorTracker";
import { sendCAPIInitiateCheckout } from "@/lib/facebookCAPI";
import { trackTikTokInitiateCheckout } from "@/lib/tiktokPixel";
import { trackMetaInitiateCheckout } from "@/lib/metaPixel";

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
  "500-2000":  { price: 66.83,  installment: 5.57,  installments: 12, checkoutUrl: "https://pay.kirvano.com/69208bd0-7fc5-4000-958c-948dc73b1f6b" },
  "2000-10000":{ price: 66.83,  installment: 5.57,  installments: 12, checkoutUrl: "https://pay.kirvano.com/69208bd0-7fc5-4000-958c-948dc73b1f6b" },
  "10000+":    { price: 66.83,  installment: 5.57,  installments: 12, checkoutUrl: "https://pay.kirvano.com/69208bd0-7fc5-4000-958c-948dc73b1f6b" },
};

const getPricing = (accountBalance?: string) => {
  // Modelo consolidado: R$37 só para "menos100", R$47 para todos os demais
  return PRICING_TIERS[accountBalance || ""] || PRICING_TIERS["100-500"];
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
      {/* Context text if provided */}
      {context && (
        <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-primary" />
          {context}
        </p>
      )}

      {/* Price + token explanation */}
      <div className="text-center space-y-1.5">
        <div className="flex items-center justify-center gap-2">
          <img src={chatgptLogo} alt="IA" className="w-5 h-5 object-contain rounded" />
          <p className="text-xs text-muted-foreground">Taxa única de <span className="font-bold text-foreground">ativação da IA</span></p>
        </div>
        <p className="text-2xl font-display font-black text-foreground">
          {pricing.installments}x de R$<span className="text-gradient-green">{formatPrice(pricing.installment)}</span>
        </p>
        <p className="text-xs text-muted-foreground">
          ou <span className="font-semibold text-foreground">R${formatPrice(pricing.price)}</span> à vista no Pix
        </p>
      </div>

      {/* CTA */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full"
      >
        <button
          onClick={() => {
            trackCheckoutClick();
            sendCAPIInitiateCheckout({ amount: pricing.price });
            trackTikTokInitiateCheckout({ amount: pricing.price });
            trackMetaInitiateCheckout({ amount: pricing.price });
            saveFunnelEvent("checkout_click", { context: context || "default", product: "chave_token_chatgpt", amount: pricing.price });
            const utmQs = buildTrackingQueryString();
            const separator = pricing.checkoutUrl.includes("?") ? "&" : "?";
            const fullUrl = utmQs ? `${pricing.checkoutUrl}${separator}${utmQs.slice(1)}` : pricing.checkoutUrl;
            window.open(fullUrl, "_blank");
          }}
          className="w-full group relative overflow-hidden rounded-2xl py-5 sm:py-6 px-6 sm:px-8 font-extrabold text-lg sm:text-xl tracking-wide cursor-pointer transition-all duration-300 active:scale-[0.97] bg-gradient-to-r from-accent via-amber-400 to-accent text-accent-foreground animate-bounce-subtle"
          style={{
            boxShadow: "0 0 30px hsl(42 100% 55% / 0.35), 0 0 60px hsl(42 100% 55% / 0.15), 0 8px 25px rgba(0,0,0,0.3)",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700 ease-in-out" />
          <div className="relative flex items-center justify-center gap-3">
            <Unlock className="w-6 h-6 shrink-0" />
            <span>ATIVAR MINHA CHAVE TOKEN</span>
            <ArrowRight className="w-5 h-5 shrink-0 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
      </motion.div>

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

/* ─── Profile Analysis Card (Compact + Personalized) ─── */
const ProfileAnalysis = ({ answers, firstName }: { answers?: QuizAnswers; firstName: string }) => {
  const [compatPercent, setCompatPercent] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [analyzedCount] = useState(() => Math.floor(Math.random() * 8) + 20);
  const [approvedCount] = useState(() => Math.floor(Math.random() * 2) + 3);

  const getLabel = (key: string, val?: string) => {
    const maps: Record<string, Record<string, string>> = {
      age: { "18-25": "18–25", "26-35": "26–35", "36-45": "36–45", "46-55": "46–55", "56+": "56+", "18 a 25 anos": "18–25", "26 a 35 anos": "26–35", "36 a 45 anos": "36–45", "46 a 55 anos": "46–55", "56 anos ou mais": "56+" },
      incomeGoal: { "50-100": "R$50–100/dia", "100-300": "R$100–300/dia", "300-500": "R$300–500/dia", "500+": "+R$500/dia" },
      obstacle: { medo: "Superar o medo", tempo: "Otimizar tempo", inicio: "Primeiro passo", dinheiro: "Pouco capital" },
      availability: { sim: "10min/dia", nao: "Flexível" },
    };
    return maps[key]?.[val || ""] || val || "—";
  };

  const getLabelFull = (key: string, val?: string) => {
    const maps: Record<string, Record<string, string>> = {
      incomeGoal: { "50-100": "R$50 a R$100/dia", "100-300": "R$100 a R$300/dia", "300-500": "R$300 a R$500/dia", "500+": "mais de R$500/dia" },
      availability: { sim: "apenas 10 minutos", nao: "poucos minutos" },
    };
    return maps[key]?.[val || ""] || val || "—";
  };

  const items = [
    { icon: <Users className="w-3.5 h-3.5" />, value: getLabel("age", answers?.age) },
    { icon: <TrendingUp className="w-3.5 h-3.5" />, value: getLabel("incomeGoal", answers?.incomeGoal), highlight: true },
    { icon: <AlertTriangle className="w-3.5 h-3.5" />, value: getLabel("obstacle", answers?.obstacle) },
    { icon: <Clock className="w-3.5 h-3.5" />, value: getLabel("availability", answers?.availability) },
  ];

  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 400);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!revealed) return;
    const target = 97;
    const t = setInterval(() => {
      setCompatPercent((p) => { if (p >= target) { clearInterval(t); return target; } return p + 4; });
    }, 25);
    return () => clearInterval(t);
  }, [revealed]);

  return (
    <div className="w-full">
      <div
        className="rounded-2xl overflow-hidden border border-primary/20"
        style={{ background: "linear-gradient(180deg, hsl(var(--card)), hsl(var(--primary) / 0.03))" }}
      >
        {/* Title bar */}
        <div className="px-4 py-2.5 border-b border-primary/10 flex items-center gap-2.5" style={{ background: "hsl(var(--primary) / 0.06)" }}>
          <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center">
            <Bot className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground truncate">
              {firstName ? `Perfil de ${firstName}` : "Seu perfil"}
            </p>
          </div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: revealed ? 1 : 0 }}
            className="flex items-center gap-1 bg-primary/10 rounded-full px-2 py-0.5"
          >
            <CheckCircle className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-bold text-primary">Aprovado</span>
          </motion.div>
        </div>

        {/* Compact chips grid */}
        <div className="px-3 py-3">
          <div className="flex flex-wrap gap-1.5">
            {items.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={revealed ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: i * 0.08, duration: 0.25 }}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs ${
                  item.highlight
                    ? "bg-primary/10 border border-primary/20 text-primary font-bold"
                    : "bg-secondary/60 text-foreground"
                }`}
              >
                <span className={item.highlight ? "text-primary" : "text-muted-foreground"}>{item.icon}</span>
                <span className="font-medium">{item.value}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Compat bar + personalized verdict + exclusivity — compact */}
        {revealed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="px-4 py-3 border-t border-primary/10 space-y-2.5"
            style={{ background: "hsl(var(--primary) / 0.04)" }}
          >
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Compatibilidade</span>
                  <span className="text-lg font-display font-black text-primary">{compatPercent}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
                  <motion.div
                    className="h-full rounded-full progress-bar-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${compatPercent}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
              </div>
              <Zap className="w-5 h-5 text-accent shrink-0" />
            </div>

            {/* Personalized strategy sentence */}
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              <Zap className="w-3 h-3 text-accent inline mr-1" />
              {firstName ? <><span className="font-bold text-foreground">{firstName}</span>, a</> : "A"} IA traçou uma <span className="text-primary font-bold">estratégia sob medida</span> para você alcançar <span className="text-[13px] text-accent font-black">{getLabelFull("incomeGoal", answers?.incomeGoal)}</span> dedicando <span className="text-[13px] text-foreground font-bold">{getLabelFull("availability", answers?.availability)}</span> por dia — direto do seu celular.
            </p>

            {/* Rejection exclusivity — single line */}
            <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
              <Eye className="w-3 h-3 text-destructive shrink-0" />
              <span><span className="font-bold text-foreground">{analyzedCount} perfis analisados</span> nos últimos 30 min — apenas <span className="text-primary font-bold">{approvedCount} aprovados</span>. Você é um deles.</span>
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

/* ─── Bonus Card (Premium) ─── */
const BonusCard = ({ number, title, value, description, icon: Icon }: { number: number; title: string; value: string; description: string; icon?: any }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: number * 0.06 }}
    className="relative overflow-hidden rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/5 via-background to-accent/10 p-4 space-y-2.5"
  >
    {/* Number badge */}
    <div className="flex items-start justify-between gap-2">
      <div className="flex items-center gap-2.5">
        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-accent/15 text-accent font-bold text-sm shrink-0">
          {number}
        </span>
        <p className="font-bold text-foreground text-[15px] leading-snug">{title}</p>
      </div>
      <span className="text-xs text-red-400/80 line-through whitespace-nowrap mt-1 shrink-0">{value}</span>
    </div>
    <p className="text-sm text-muted-foreground leading-relaxed pl-[42px]">{description}</p>
    <div className="pl-[42px]">
      <span className="inline-flex items-center gap-1 text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
        <CheckCircle className="w-3 h-3" /> GRÁTIS HOJE
      </span>
    </div>
  </motion.div>
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

  const monthlyGoal = daily * 30;
  const nearGoal = Math.round(monthlyGoal * 1.05); // slightly above to not look exact

  // Show daily values with accumulated monthly at Dia 30
  const day3 = Math.round(daily * 0.15);
  const day7 = Math.round(daily * 0.4);
  const day14 = Math.round(daily * 0.65);
  const day21 = Math.round(daily * 0.85);
  const day30 = Math.round(daily * 1.05);

  const projections = [
    { period: "Dia 3", value: day3, bar: 10, label: "Primeira operação no ar", color: "hsl(var(--primary) / 0.35)" },
    { period: "Dia 7", value: day7, bar: 25, label: "Primeiros resultados reais", color: "hsl(var(--primary) / 0.5)" },
    { period: "Dia 14", value: day14, bar: 45, label: "Ganhando consistência", color: "hsl(var(--primary) / 0.65)" },
    { period: "Dia 21", value: day21, bar: 70, label: "Ritmo acelerando", color: "hsl(var(--primary) / 0.8)" },
    { period: "Dia 30", value: day30, bar: 100, label: `≈ R$${nearGoal.toLocaleString("pt-BR")}/mês acumulado`, color: "hsl(var(--primary))" },
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
          {firstName ? `${firstName}, ` : ""}Veja o que esperar nos próximos 30 dias
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
              <span className="text-sm font-bold text-foreground">Potencial em 30 dias</span>
            </div>
            <motion.span
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.9, type: "spring" }}
              className="text-xl font-display font-bold text-primary"
            >
              R${nearGoal.toLocaleString("pt-BR")}/mês
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
  { id: "6844c2bcefb07ec7d1f69f35", padding: "56.42633228840125%", sdk: "v1", thumb: "https://images.converteai.net/09ec79a4-c31f-44ce-ba7d-89003424c826/players/6844c2bcefb07ec7d1f69f35/thumbnail.jpg" },
  { id: "681528f68fced9179fa2e1c3", padding: "56.25%", sdk: "v1", thumb: "https://images.converteai.net/09ec79a4-c31f-44ce-ba7d-89003424c826/players/681528f68fced9179fa2e1c3/thumbnail.jpg" },
  { id: "68152914abe4fd17b1dc4ad1", padding: "56.25%", sdk: "v1", thumb: "https://images.converteai.net/09ec79a4-c31f-44ce-ba7d-89003424c826/players/68152914abe4fd17b1dc4ad1/thumbnail.jpg" },
  { id: "692bc7a9eb5ec5285cecf25c", padding: "56.25%", sdk: "v4", thumb: "https://images.converteai.net/09ec79a4-c31f-44ce-ba7d-89003424c826/players/692bc7a9eb5ec5285cecf25c/thumbnail.jpg" },
];

const loadVideoSrc = (v: typeof VIDEO_TESTIMONIALS[number]) => {
  const iframe = document.getElementById(`ifr_${v.id}`) as HTMLIFrameElement;
  if (!iframe || iframe.src !== "about:blank") return;
  const base = `https://scripts.converteai.net/09ec79a4-c31f-44ce-ba7d-89003424c826/players/${v.id}`;
  const suffix = (window.location.search || "?") + "&vl=" + encodeURIComponent(window.location.href);
  iframe.src = v.sdk === "v4" ? `${base}/v4/embed.html${suffix}` : `${base}/embed.html${suffix}`;
};

const VideoTestimonialItem = ({ v, autoplay }: { v: typeof VIDEO_TESTIMONIALS[number]; autoplay: boolean }) => {
  const [activated, setActivated] = useState(autoplay);

  useEffect(() => {
    if (autoplay) {
      loadVideoSrc(v);
    }
  }, [autoplay, v]);

  const handleActivate = () => {
    if (activated) return;
    setActivated(true);
    // Small delay to let iframe render before setting src
    requestAnimationFrame(() => loadVideoSrc(v));
  };

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-border relative">
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
      {/* Play overlay with thumbnail for non-autoplay videos */}
      {!activated && (
        <button
          onClick={handleActivate}
          className="absolute inset-0 z-10 flex items-center justify-center cursor-pointer transition-opacity group"
          aria-label="Reproduzir vídeo"
        >
          {/* Thumbnail background */}
          <img
            src={v.thumb}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          {/* Dim overlay */}
          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors" />
          {/* Play button */}
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/90 flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
            <svg className="w-7 h-7 sm:w-9 sm:h-9 text-primary-foreground ml-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
          </div>
          <span className="absolute bottom-4 text-xs text-white/80 font-medium z-10">Toque para assistir</span>
        </button>
      )}
    </div>
  );
};

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
    return () => { s1.remove(); s4.remove(); };
  }, []);

  const sectionVideos = VIDEO_TESTIMONIALS.slice(1);

  return (
    <div className="w-full space-y-4">
      {sectionVideos.map((v, i) => (
        <VideoTestimonialItem key={v.id} v={v} autoplay={i === 0} />
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
    const iframe2 = document.getElementById("ifr_687c29a523605749de8033d9") as HTMLIFrameElement;
    if (iframe2 && iframe2.src === "about:blank") {
      iframe2.src = "https://scripts.converteai.net/09ec79a4-c31f-44ce-ba7d-89003424c826/players/687c29a523605749de8033d9/v4/embed.html" +
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
    { title: "Modo Auto-Lucro Inteligente", value: "R$997", description: "Ative e o sistema escolhe o melhor ativo, horário e valor por operação baseado no seu saldo. Você só clica em 'ativar'." },
    { title: "Suporte VIP — Resposta em 2 Minutos", value: "R$397", description: "Dúvida? Travou? Só chamar. Canal direto com especialistas que respondem em tempo real. Você nunca fica sozinho." },
    { title: "Turbo de Lucro — Versão Estratégica", value: "R$297", description: "Rotina inteligente que multiplica saldos pequenos com entradas automáticas em sequência controlada." },
    { title: "Bot de Lucros em Dólar — Versão Silenciosa", value: "R$497", description: "Roda em segundo plano e envia alertas de ganhos e oportunidades no Telegram. Nem precisa abrir o sistema." },
    { title: "Bloqueador de Ganância e Pânico", value: "R$497", description: "Sistema interno que trava operações fora da lógica. Protege seu lucro e controla a ansiedade do operador." },
    { title: "Comunidade VIP no WhatsApp", value: "R$147", description: "Grupo exclusivo com +36.000 alunos que se ajudam todos os dias. Nunca mais fique sozinho." },
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
    <>
    {/* ═══ FIXED URGENCY BAR (top) ═══ */}
    {showCTA && (
      <motion.div
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
        className="fixed top-0 left-0 right-0 z-50"
        style={{ background: "hsl(var(--destructive) / 0.12)", borderBottom: "1px solid hsl(var(--destructive) / 0.3)", backdropFilter: "blur(12px)" }}
      >
        <div className="max-w-lg mx-auto flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
            <span className="text-xs font-bold text-destructive uppercase tracking-wider">Oferta expira em</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-destructive" />
            <span className="text-base font-display font-bold text-foreground tabular-nums">
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground">Depois: R$297</span>
        </div>
      </motion.div>
    )}
    <div className="animate-slide-up flex flex-col items-center w-full max-w-lg mx-auto px-4 sm:px-5 py-5 sm:py-6 pb-24 gap-5 sm:gap-6" style={{ paddingTop: showCTA ? "3.5rem" : undefined }}>

      {/* ═══ 1. URGENCY + HERO (compact) ═══ */}
      <SectionTracker id="urgency">
        <div className="w-full space-y-4">
          <UrgencyStrip minutes={minutes} seconds={seconds} show={true} priceLabel={formatPrice(pricing.price)} installmentLabel={formatPrice(pricing.installment)} />
          
          <div className="text-center space-y-1">
            <h2 className="font-display text-lg sm:text-2xl font-bold text-foreground leading-tight">
              {firstName ? `${firstName}, sua` : "Sua"} chave está <span className="text-gradient-green">pronta</span>.
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Falta <span className="text-primary font-bold">1 passo</span> pra gerar renda extra todo dia.
            </p>
          </div>

          <ProfileAnalysis answers={answers} firstName={firstName} />
        </div>
      </SectionTracker>

      {/* ═══ 2. VSL VIDEO (ConverteAI) ═══ */}
      <SectionTracker id="vsl_video">
        <div className="w-full space-y-3">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mx-auto">
              <Eye className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Assista antes de decidir</span>
            </div>
            <h3 className="font-display text-xl font-bold text-foreground leading-snug">
              Descubra como <span className="text-gradient-green">pessoas comuns</span> estão gerando renda extra{" "}
              <span className="text-primary font-black">todos os dias</span>
            </h3>
            <p className="text-sm text-muted-foreground">Veja em 4 minutos como a plataforma funciona na prática.</p>
          </div>
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
        </div>
      </SectionTracker>

      {/* ═══ 2a. ENTREVISTA VALDEMAR (ConverteAI) ═══ */}
      <ScrollReveal>
        <div className="w-full space-y-3">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-4 py-1.5 mx-auto">
              <Star className="w-3.5 h-3.5 text-accent" />
              <span className="text-[10px] font-bold text-accent uppercase tracking-wider">Na mídia</span>
            </div>
            <h3 className="font-display text-lg font-bold text-foreground leading-snug">
              Seu Valdemar, aos 62 anos, deu <span className="text-accent font-black">entrevista ao jornal</span> contando como a plataforma mudou sua vida
            </h3>
            <p className="text-sm text-muted-foreground">Uma história real que pode ser a sua também.</p>
          </div>
          <div className="w-full rounded-2xl overflow-hidden border border-accent/20">
            <div id="ifr_687c29a523605749de8033d9_wrapper" style={{ margin: "0 auto", width: "100%" }}>
              <div style={{ position: "relative", padding: "56.25% 0 0 0" }} id="ifr_687c29a523605749de8033d9_aspect">
                <iframe
                  frameBorder="0"
                  allowFullScreen
                  src="about:blank"
                  id="ifr_687c29a523605749de8033d9"
                  style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
                  referrerPolicy="origin"
                />
              </div>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* ═══ 2b. PROVA SOCIAL IMEDIATA (prints) ═══ */}
      <ScrollReveal>
        <PhotoProofGallery
          title={<>Alunos lucrando <span className="text-gradient-green">todos os dias</span></>}
          subtitle="Prints reais enviados pelos alunos no grupo. Sem edição."
          images={[depo1, depo2, depo3, depo4, depo5]}
        />
      </ScrollReveal>

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
              <p className="text-[10px] text-muted-foreground mt-0.5">Taxa de ativação da IA</p>
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

      {/* prints moved to top, after VSL */}

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

      {/* ═══ VIDEO DEPOIMENTO (primeiro vídeo, antes do CTA) ═══ */}
      <ScrollReveal>
        <div className="w-full space-y-3">
          <h3 className="font-display text-xl font-bold text-foreground text-center leading-snug">
            A forma mais <span className="text-gradient-green">justa</span> de trabalhar é{" "}
            <span className="text-primary font-black">primeiro fazendo você lucrar.</span>
          </h3>
          <p className="text-sm text-muted-foreground text-center leading-relaxed">
            Assista o depoimento de quem já vive isso na prática:
          </p>
          <VideoTestimonialItem v={VIDEO_TESTIMONIALS[0]} autoplay={true} />
        </div>
      </ScrollReveal>

      <Divider />

      {/* ═══ 6. CTA 1 ═══ */}
      <CTABlock showCTA={showCTA} pricing={pricing} />

      <Divider />

      {/* ═══ 7. SOCIAL PROOF (people like you) ═══ */}
      <SectionTracker id="social_proof">
        <PeopleLikeYou answers={answers} />
      </SectionTracker>

      {/* ═══ 8. EARNINGS PROJECTION ═══ */}
      <SectionTracker id="earnings_projection">
        <EarningsProjection answers={answers} firstName={firstName} />
      </SectionTracker>

      {/* ═══ 8b. MINI GUARANTEE + STRONG TESTIMONIAL (zona de decisão) ═══ */}
      <ScrollReveal>
        <div className="w-full space-y-3">
          {/* Mini-garantia visual */}
          <div className="flex items-center gap-3 rounded-xl p-3 border border-primary/20 bg-primary/5">
            <ShieldCheck className="w-8 h-8 text-primary shrink-0" />
            <div>
              <p className="text-sm font-bold text-foreground">Garantia de 30 dias</p>
              <p className="text-xs text-muted-foreground">Não gostou? Devolvemos 100%. Sem perguntas.</p>
            </div>
          </div>

          {/* Depoimento forte com resultado numérico */}
          <div className="funnel-card border-primary/20 space-y-2">
            <div className="flex items-center gap-3">
              <img src={avatarCarlos} alt="Carlos" className="w-11 h-11 rounded-full object-cover border-2 border-primary/30" />
              <div className="flex-1">
                <p className="font-bold text-sm text-foreground">Carlos Mendonça, 52 anos</p>
                <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">R$200/dia</span>
              </div>
            </div>
            <p className="text-sm text-foreground/85 italic leading-relaxed">
              "Já perdi dinheiro 2 vezes na internet. Aqui o suporte me acompanhou em cada passo. Hoje faço R$200 por dia só no celular. Minha esposa viu e também começou."
            </p>
          </div>

          {/* Copy segmentada para objeção "dinheiro" */}
          {answers?.obstacle === "dinheiro" && (
            <div className="rounded-xl p-3 border border-accent/20 bg-accent/5 text-center">
              <p className="text-sm text-foreground leading-relaxed">
                <CircleDollarSign className="w-4 h-4 text-accent inline mr-1" />
                Custa <span className="text-accent font-bold">menos que um almoço por semana</span>. 
                E muitos alunos recuperam o valor <span className="font-bold">no primeiro dia</span>.
              </p>
            </div>
          )}
        </div>
      </ScrollReveal>

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
        <div className="text-center space-y-2">
          <p className="text-xs uppercase tracking-wider text-accent font-bold">ACESSO COMPLETO</p>
          <h3 className="font-display text-xl font-bold text-foreground">
            Tudo que você recebe ao ativar a <span className="text-gradient-green">Plataforma de Ganhos com Tempo Livre</span>:
          </h3>
        </div>
        {[
          { text: "Acesso vitalício à Plataforma de Ganhos com Tempo Livre", value: "R$497" },
          { text: "Método passo a passo — do zero ao resultado", value: "R$297" },
          { text: "Vídeo-aulas em linguagem simples e direta", value: "R$197" },
          { text: "Suporte humano em tempo real via WhatsApp", value: "R$197" },
          { text: "Comunidade exclusiva com +36.000 alunos", value: "R$147" },
          { text: "Plano personalizado pro seu perfil", value: "R$297" },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-3 py-3 border-b border-border/50 last:border-0"
          >
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/15 shrink-0">
              <CheckCircle className="w-4 h-4 text-primary" />
            </div>
            <p className="text-sm text-foreground leading-snug flex-1">{item.text}</p>
            <span className="text-xs text-red-400/70 line-through shrink-0">{item.value}</span>
          </motion.div>
        ))}
        <div className="text-center pt-2 space-y-0.5">
          <p className="text-sm text-muted-foreground">Valor total da plataforma:</p>
          <p className="text-lg text-muted-foreground line-through">R$1.632,00</p>
        </div>
      </div>
      </ScrollReveal>

      <Divider />

      {/* ═══ VIDEO TESTIMONIALS (após acesso completo) ═══ */}
      <ScrollReveal>
      <div className="w-full space-y-4 -mx-2 px-2 sm:mx-0 sm:px-0">
        <h3 className="font-display text-xl sm:text-2xl font-bold text-foreground text-center">
          Depoimentos em <span className="text-gradient-green">vídeo</span>
        </h3>
        <p className="text-sm sm:text-base text-muted-foreground text-center">
          Assista quem já mudou de vida:
        </p>
        <div className="w-[calc(100%+2rem)] -ml-4 sm:w-full sm:ml-0">
          <VideoTestimonialsSection />
        </div>
      </div>
      </ScrollReveal>

      <Divider />
      <ScrollReveal>
      <div className="w-full space-y-5">
        {/* Premium header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-4 py-1.5 mx-auto">
            <Gift className="w-4 h-4 text-accent" />
            <span className="text-xs uppercase tracking-wider text-accent font-bold">BÔNUS EXCLUSIVOS</span>
          </div>
          <h3 className="font-display text-xl font-bold text-foreground leading-snug">
            Receba <span className="text-accent">6 ferramentas extras</span> ao ativar sua 
            <span className="text-gradient-green"> Plataforma de Ganhos com Tempo Livre</span> hoje
          </h3>
          <p className="text-sm text-muted-foreground">Tudo incluso. Sem pagar nada a mais.</p>
        </div>

        {/* Bonus cards */}
        <div className="space-y-3">
          {bonuses.map((b, i) => (
            <BonusCard key={i} number={i + 1} {...b} />
          ))}
        </div>

        {/* Value anchoring */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="rounded-2xl border-2 border-accent/30 bg-gradient-to-br from-accent/10 via-accent/5 to-background text-center p-5 space-y-2"
        >
          <p className="text-sm text-muted-foreground">Valor total dos 6 bônus:</p>
          <p className="text-2xl text-muted-foreground line-through font-semibold">R$2.832,00</p>
          <div className="flex items-center justify-center gap-2">
            <Gift className="w-5 h-5 text-accent" />
            <p className="text-lg font-bold text-accent">Hoje: GRÁTIS com seu acesso</p>
          </div>
        </motion.div>

        {/* Why free — alignment of interests */}
        <div className="rounded-2xl p-5 border border-primary/15 bg-primary/5 space-y-3">
          <div className="flex items-center justify-center gap-2">
            <Heart className="w-5 h-5 text-primary" />
            <p className="text-base font-bold text-foreground">Por que estou dando tudo isso de graça?</p>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed text-center">
            Simples: eu <span className="font-bold text-foreground">quero que você ganhe</span>. Quanto mais você lucra nos primeiros 30 dias, 
            maior é a minha parte de <span className="text-primary font-bold">2%</span> depois. 
            Eu só ganho quando <span className="text-primary font-bold">você ganha</span>. Por isso faço questão de te dar todas as ferramentas possíveis.
          </p>
        </div>
      </div>
      </ScrollReveal>

      {/* ═══ OBJECTION BREAKING (moved before pricing) ═══ */}
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

      {/* ═══ TESTIMONIALS CAROUSEL ═══ */}
      <ScrollReveal>
        <TestimonialsCarousel testimonials={testimonials} />
      </ScrollReveal>

      <Divider />

      {/* ═══ WHATSAPP FEEDBACK ═══ */}
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

      <Divider />

      {/* ═══ PRICE ANCHOR (single pricing section) ═══ */}
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
            <span className="text-sm text-muted-foreground line-through">R$2.832</span>
          </div>
          <div className="flex justify-between items-center py-1.5 border-b border-border/50">
            <span className="text-sm text-muted-foreground">Suporte VIP em tempo real</span>
            <span className="text-sm text-muted-foreground line-through">R$397</span>
          </div>
          <div className="flex justify-between items-center py-1.5">
            <span className="text-sm font-bold text-foreground">Valor total real</span>
            <span className="text-sm font-bold text-muted-foreground line-through">R$4.861</span>
          </div>
        </div>

        {/* AI cost explanation */}
        <div className="funnel-card border-primary/25 bg-card text-center space-y-4">
          <img src={chatgptLogo} alt="ChatGPT" className="w-10 h-10 object-contain mx-auto rounded-xl" />
          <p className="text-sm text-muted-foreground leading-relaxed text-left">
            A plataforma usa <span className="font-bold text-foreground">inteligência artificial avançada</span> pra trabalhar por você.
            Cada operação consome <span className="font-bold text-foreground">processamento de IA</span> — e esse processamento tem custo real.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed text-left">
            O valor abaixo é <span className="font-bold text-foreground">apenas a taxa de ativação</span>.
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

      {/* ═══ CTA (after pricing) ═══ */}
      <CTABlock showCTA={showCTA} context="Garantia incondicional de 30 dias" pricing={pricing} />

      <Divider />

      {/* ═══ GUARANTEE (risk reversal) ═══ */}
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

      {/* ═══ EMOTIONAL FUTURE PACING ═══ */}
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

      {/* ═══ STICKY CTA (floating bottom bar) ═══ */}
      {showCTA && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
          className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-3"
          style={{ background: "linear-gradient(to top, hsl(var(--background)), hsl(var(--background) / 0.95) 70%, transparent)" }}
        >
          <div className="max-w-lg mx-auto">
            <CTAButton onClick={() => {
              trackCheckoutClick();
              sendCAPIInitiateCheckout({ amount: pricing.price });
              saveFunnelEvent("checkout_click", { context: "sticky_footer", product: "chave_token_chatgpt", amount: pricing.price });
              const utmQs = buildTrackingQueryString();
              const separator = pricing.checkoutUrl.includes("?") ? "&" : "?";
              const fullUrl = utmQs ? `${pricing.checkoutUrl}${separator}${utmQs.slice(1)}` : pricing.checkoutUrl;
              window.open(fullUrl, "_blank");
            }} variant="accent" className="text-base sm:text-lg tracking-wider w-full funnel-glow-button">
              ATIVAR MINHA CHAVE AGORA — {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </CTAButton>
            <div className="flex items-center justify-center gap-3 mt-1.5">
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Lock className="w-3 h-3" /> Compra segura
              </p>
              <span className="text-[10px] text-muted-foreground">•</span>
              <p className="text-[10px] text-muted-foreground">
                Garantia de 30 dias
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
    </>
  );
};

export default Step13Offer;
