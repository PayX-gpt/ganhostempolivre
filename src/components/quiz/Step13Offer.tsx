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
import { useLanguage, type Language } from "@/lib/i18n";
import { S13_CUR, s13money } from "./step13offer.i18n";

// Preço exibido por idioma (checkout continua em BRL — só o texto muda).
const S13_PRICE = {
  pt: { cash: "47,00", inst: "4,67", old: "297", perDay: "1,57" },
  en: { cash: "9", inst: "0.75", old: "59", perDay: "0.30" },
  es: { cash: "9", inst: "0,75", old: "59", perDay: "0,30" },
} as const;
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

/* ─── Single Pricing Engine ─── */
const SINGLE_PRICING = {
  price: 47.00,
  installment: 4.67,
  installments: 12,
  checkoutUrl: "https://pay.kirvano.com/a404a378-2a59-4efd-86a8-dc57363c054c"
};

const getPricing = () => SINGLE_PRICING;

const formatPrice = (price: number) => price.toFixed(2).replace(".", ",");

/* ─── Reusable CTA Block ─── */
const CTABlock = ({ showCTA, context, pricing }: { showCTA: boolean; context?: string; pricing: { price: number; installment: number; installments: number; checkoutUrl: string } }) => {
  const { lang } = useLanguage();
  const p = S13_PRICE[lang];
  const tt = {
    pt: { taxaA: "Taxa única de ", taxaBold: "ativação da IA", orCashA: "ou ", pix: " à vista no Pix", cta: "ATIVAR MINHA CHAVE TOKEN", safe: "Compra segura", immediate: "Acesso imediato", watch: "Assista o vídeo para liberar seu acesso..." },
    en: { taxaA: "One-time ", taxaBold: "AI activation fee", orCashA: "or ", pix: " one-time via PIX", cta: "ACTIVATE MY TOKEN KEY", safe: "Secure checkout", immediate: "Instant access", watch: "Watch the video to unlock your access..." },
    es: { taxaA: "Tarifa única de ", taxaBold: "activación de la IA", orCashA: "o ", pix: " en un pago vía PIX", cta: "ACTIVAR MI LLAVE TOKEN", safe: "Compra segura", immediate: "Acceso inmediato", watch: "Mira el video para liberar tu acceso..." },
  }[lang];
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
          <p className="text-xs text-muted-foreground">{tt.taxaA}<span className="font-bold text-foreground">{tt.taxaBold}</span></p>
        </div>
        <p className="text-2xl font-display font-black text-foreground">
          {pricing.installments}x {S13_CUR[lang].sym}<span className="text-gradient-green">{p.inst}</span>
        </p>
        <p className="text-xs text-muted-foreground">
          {tt.orCashA}<span className="font-semibold text-foreground">{S13_CUR[lang].sym}{p.cash}</span>{tt.pix}
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
            <span>{tt.cta}</span>
            <ArrowRight className="w-5 h-5 shrink-0 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
      </motion.div>

      {/* Trust badges */}
      <div className="flex items-center justify-center gap-4 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs text-muted-foreground font-medium">{tt.safe}</span>
        </div>
        <div className="w-px h-4 bg-border" />
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs text-muted-foreground font-medium">{context || tt.immediate}</span>
        </div>
      </div>
    </div>
  ) : (
    <div className="text-center space-y-2 py-4">
      <div className="w-10 h-10 rounded-full border-[3px] border-primary/30 border-t-primary animate-spin mx-auto" />
      <p className="text-base text-muted-foreground animate-pulse">
        {tt.watch}
      </p>
    </div>
  );
};

/* ─── Urgency Strip (sticky) ─── */
const UrgencyStrip = ({ minutes, seconds, show, priceLabel, installmentLabel }: { minutes: number; seconds: number; show: boolean; priceLabel: string; installmentLabel?: string }) => {
  const { lang } = useLanguage();
  const p = S13_PRICE[lang];
  const sym = S13_CUR[lang].sym;
  const tt = {
    pt: { reserved: "Vaga reservada", a: "Sua condição especial de ", c: " expira quando o timer zerar. Depois disso, volta para " },
    en: { reserved: "Spot reserved", a: "Your special offer of ", c: " expires when the timer hits zero. After that, it goes back to " },
    es: { reserved: "Cupo reservado", a: "Tu condición especial de ", c: " expira cuando el temporizador llegue a cero. Después vuelve a " },
  }[lang];
  if (!show) return null;
  return (
    <div className="w-full rounded-2xl overflow-hidden border border-destructive/40">
      <div className="bg-destructive/15 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-destructive animate-pulse" />
          <span className="text-xs sm:text-sm font-bold text-destructive uppercase tracking-wider">{tt.reserved}</span>
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
          {tt.a}<span className="font-bold text-foreground">12x {sym}{p.inst}</span>{tt.c}{sym}{p.old}.
        </p>
      </div>
    </div>
  );
};

/* ─── Profile Analysis Card (Compact + Personalized) ─── */
const ProfileAnalysis = ({ answers, firstName }: { answers?: QuizAnswers; firstName: string }) => {
  const { lang } = useLanguage();
  const tt = {
    pt: {
      lblIncome: { "50-100": "R$50–100/dia", "100-300": "R$100–300/dia", "300-500": "R$300–500/dia", "500+": "+R$500/dia" },
      lblObstacle: { medo: "Superar o medo", tempo: "Otimizar tempo", inicio: "Primeiro passo", dinheiro: "Pouco capital" },
      lblAvail: { sim: "10min/dia", nao: "Flexível" },
      fullIncome: { "50-100": "R$50 a R$100/dia", "100-300": "R$100 a R$300/dia", "300-500": "R$300 a R$500/dia", "500+": "mais de R$500/dia" },
      fullAvail: { sim: "apenas 10 minutos", nao: "poucos minutos" },
      profileOf: (n: string) => (n ? `Perfil de ${n}` : "Seu perfil"), approved: "Aprovado", compat: "Compatibilidade",
      sA: (n: string) => (n ? `${n}, a` : "A"), sBold: " IA traçou uma ", sStrat: "estratégia sob medida", sMid: " para você alcançar ", sMid2: " dedicando ", sC: " por dia — direto do seu celular.",
      rejA: (c: number) => `${c} perfis analisados`, rejMid: " nos últimos 30 min — apenas ", rejApproved: (a: number) => `${a} aprovados`, rejC: ". Você é um deles.",
    },
    en: {
      lblIncome: { "50-100": "$10–20/day", "100-300": "$20–60/day", "300-500": "$60–100/day", "500+": "+$100/day" },
      lblObstacle: { medo: "Overcome fear", tempo: "Optimize time", inicio: "First step", dinheiro: "Low capital" },
      lblAvail: { sim: "10min/day", nao: "Flexible" },
      fullIncome: { "50-100": "$10 to $20/day", "100-300": "$20 to $60/day", "300-500": "$60 to $100/day", "500+": "more than $100/day" },
      fullAvail: { sim: "just 10 minutes", nao: "a few minutes" },
      profileOf: (n: string) => (n ? `${n}'s profile` : "Your profile"), approved: "Approved", compat: "Compatibility",
      sA: (n: string) => (n ? `${n}, the` : "The"), sBold: " AI mapped out a ", sStrat: "tailored strategy", sMid: " for you to reach ", sMid2: " spending ", sC: " a day — straight from your phone.",
      rejA: (c: number) => `${c} profiles analyzed`, rejMid: " in the last 30 min — only ", rejApproved: (a: number) => `${a} approved`, rejC: ". You're one of them.",
    },
    es: {
      lblIncome: { "50-100": "$10–20/día", "100-300": "$20–60/día", "300-500": "$60–100/día", "500+": "+$100/día" },
      lblObstacle: { medo: "Superar el miedo", tempo: "Optimizar tiempo", inicio: "Primer paso", dinheiro: "Poco capital" },
      lblAvail: { sim: "10min/día", nao: "Flexible" },
      fullIncome: { "50-100": "$10 a $20/día", "100-300": "$20 a $60/día", "300-500": "$60 a $100/día", "500+": "más de $100/día" },
      fullAvail: { sim: "solo 10 minutos", nao: "pocos minutos" },
      profileOf: (n: string) => (n ? `Perfil de ${n}` : "Tu perfil"), approved: "Aprobado", compat: "Compatibilidad",
      sA: (n: string) => (n ? `${n}, la` : "La"), sBold: " IA trazó una ", sStrat: "estrategia a tu medida", sMid: " para que alcances ", sMid2: " dedicando ", sC: " por día — directo desde tu celular.",
      rejA: (c: number) => `${c} perfiles analizados`, rejMid: " en los últimos 30 min — solo ", rejApproved: (a: number) => `${a} aprobados`, rejC: ". Tú eres uno de ellos.",
    },
  }[lang];
  const ageMap: Record<string, string> = { "18-25": "18–25", "26-35": "26–35", "36-45": "36–45", "46-55": "46–55", "56+": "56+", "18 a 25 anos": "18–25", "26 a 35 anos": "26–35", "36 a 45 anos": "36–45", "46 a 55 anos": "46–55", "56 anos ou mais": "56+" };
  const [compatPercent, setCompatPercent] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [analyzedCount] = useState(() => Math.floor(Math.random() * 8) + 20);
  const [approvedCount] = useState(() => Math.floor(Math.random() * 2) + 3);

  const getLabel = (key: string, val?: string) => {
    if (key === "age") return ageMap[val || ""] || val || "—";
    const m: Record<string, Record<string, string>> = { incomeGoal: tt.lblIncome, obstacle: tt.lblObstacle, availability: tt.lblAvail };
    return m[key]?.[val || ""] || val || "—";
  };
  const getLabelFull = (key: string, val?: string) => {
    const m: Record<string, Record<string, string>> = { incomeGoal: tt.fullIncome, availability: tt.fullAvail };
    return m[key]?.[val || ""] || val || "—";
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
              {tt.profileOf(firstName)}
            </p>
          </div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: revealed ? 1 : 0 }}
            className="flex items-center gap-1 bg-primary/10 rounded-full px-2 py-0.5"
          >
            <CheckCircle className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-bold text-primary">{tt.approved}</span>
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
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{tt.compat}</span>
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
              {lang === "pt" && <>{firstName ? <><span className="font-bold text-foreground">{firstName}</span>, a</> : "A"} IA traçou uma <span className="text-primary font-bold">estratégia sob medida</span> para você alcançar <span className="text-[13px] text-accent font-black">{getLabelFull("incomeGoal", answers?.incomeGoal)}</span> dedicando <span className="text-[13px] text-foreground font-bold">{getLabelFull("availability", answers?.availability)}</span> por dia — direto do seu celular.</>}
              {lang === "en" && <>{firstName ? <><span className="font-bold text-foreground">{firstName}</span>, the</> : "The"} AI mapped out a <span className="text-primary font-bold">tailored strategy</span> for you to reach <span className="text-[13px] text-accent font-black">{getLabelFull("incomeGoal", answers?.incomeGoal)}</span> spending <span className="text-[13px] text-foreground font-bold">{getLabelFull("availability", answers?.availability)}</span> a day — straight from your phone.</>}
              {lang === "es" && <>{firstName ? <><span className="font-bold text-foreground">{firstName}</span>, la</> : "La"} IA trazó una <span className="text-primary font-bold">estrategia a tu medida</span> para que alcances <span className="text-[13px] text-accent font-black">{getLabelFull("incomeGoal", answers?.incomeGoal)}</span> dedicando <span className="text-[13px] text-foreground font-bold">{getLabelFull("availability", answers?.availability)}</span> por día — directo desde tu celular.</>}
            </p>

            {/* Rejection exclusivity — single line */}
            <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
              <Eye className="w-3 h-3 text-destructive shrink-0" />
              <span><span className="font-bold text-foreground">{tt.rejA(analyzedCount)}</span>{tt.rejMid}<span className="text-primary font-bold">{tt.rejApproved(approvedCount)}</span>{tt.rejC}</span>
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

/* ─── Bonus Card (Premium) ─── */
const BonusCard = ({ number, title, value, description, icon: Icon }: { number: number; title: string; value: string; description: string; icon?: any }) => {
  const { lang } = useLanguage();
  const freeToday = { pt: "GRÁTIS HOJE", en: "FREE TODAY", es: "GRATIS HOY" }[lang];
  return (
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
        <CheckCircle className="w-3 h-3" /> {freeToday}
      </span>
    </div>
  </motion.div>
  );
};

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
  const { lang } = useLanguage();
  const tt = {
    pt: { title: "+36.000 alunos. Resultados reais.", sub: "Não acredite em mim. Acredite neles:" },
    en: { title: "36,000+ members. Real results.", sub: "Don't take my word for it. Take theirs:" },
    es: { title: "+36.000 miembros. Resultados reales.", sub: "No me creas a mí. Créeles a ellos:" },
  }[lang];
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
          {tt.title}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {tt.sub}
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
  const { lang } = useLanguage();
  const tt = {
    pt: { captions: ["Primeiro saque em 3 dias 🔥", "Resultado da primeira semana 💰", "Sem acreditar no que vi 😱", "Mostrei pro meu marido 🥹"], of: "de", verified: "prints verificados" },
    en: { captions: ["First withdrawal in 3 days 🔥", "First week's result 💰", "Can't believe what I saw 😱", "Showed my husband 🥹"], of: "of", verified: "verified screenshots" },
    es: { captions: ["Primer retiro en 3 días 🔥", "Resultado de la primera semana 💰", "Sin creer lo que vi 😱", "Se lo mostré a mi esposo 🥹"], of: "de", verified: "capturas verificadas" },
  }[lang];
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
            {tt.captions[current]}
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
        <span className="text-primary font-bold">{current + 1}</span> {tt.of} {imgs.length} {tt.verified}
      </p>
    </div>
  );
};

/* ─── Step Card with scroll animation ─── */
const StepCard = ({ item, index, isLast }: { item: { step: string; icon: React.ElementType; title: string; desc: string; detail: string }; index: number; isLast: boolean }) => {
  const { lang } = useLanguage();
  const stepWord = { pt: "Passo", en: "Step", es: "Paso" }[lang];
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
              {stepWord} {item.step}
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
const PLY = {
  pt: {
    titleA: "Pessoas com o ", titleBold: "mesmo perfil que o seu", they: "Eles ", years: "anos",
    byObstacle: {
      medo: { hook: "também tinham medo de cair em golpe — até que arriscaram uma última vez:", stories: [
        { r: "R$147/dia", text: "Já tinha perdido dinheiro duas vezes. Quase não entrei. Mas quando caiu o primeiro Pix, eu chorei. Não de alegria — de alívio." },
        { r: "R$89/dia", text: "Minha filha insistiu. Eu dizia que era golpe. Entrei desconfiada. Quando vi o resultado na primeira semana, pedi desculpas pra ela." },
        { r: "R$210/dia", text: "Perdi meu emprego e ninguém contrata. Quando vi que dava pra fazer do celular, sem aparecer... mudou tudo." }] },
      tempo: { hook: "também achavam que não tinham tempo — até descobrirem que 10 minutos bastam:", stories: [
        { r: "R$180/dia", text: "Trabalho o dia inteiro. Faço tudo em 10 minutos antes de dormir. Minha esposa nem acredita que gera renda." },
        { r: "R$95/dia", text: "Meu tempo livre é zero. Opero no intervalo do almoço e já não dependo de ninguém." },
        { r: "R$230/dia", text: "Achava que ia ser mais uma coisa estressante. Levo menos tempo que assistir uma novela." }] },
      inicio: { hook: "também se sentiam completamente perdidos — até receberem o suporte certo:", stories: [
        { r: "R$147/dia", text: "Nunca mexi com nada online. O suporte me pegou pela mão. Hoje opero sozinho." },
        { r: "R$89/dia", text: "Tinha medo de apertar o botão errado. O suporte respondeu cada dúvida. Em 3 dias já tava fazendo sozinha." },
        { r: "R$210/dia", text: "Me sentia burro. Mas aqui ninguém te julga. Te ensinam quantas vezes precisar. Hoje eu ajudo os novatos." }] },
      dinheiro: { hook: "também achavam que precisavam de muito dinheiro — e se surpreenderam:", stories: [
        { r: "R$180/dia", text: "Achei que precisava de milhares. Quando vi que dava pra começar com pouco, entendi que era pra gente como eu." },
        { r: "R$95/dia", text: "Tava devendo o cartão. Juntei o pouco que tinha e arrisquei. No terceiro dia já tinha recuperado tudo." },
        { r: "R$230/dia", text: "Em uma semana já tava no positivo. Hoje vivo tranquilo." }] },
    },
  },
  en: {
    titleA: "People with the ", titleBold: "same profile as yours", they: "They ", years: "yrs",
    byObstacle: {
      medo: { hook: "were also afraid of getting scammed — until they took one last chance:", stories: [
        { r: "$29/day", text: "I'd lost money twice. I almost didn't join. But when the first payout hit, I cried. Not from joy — from relief." },
        { r: "$17/day", text: "My daughter insisted. I kept saying it was a scam. I joined skeptical. When I saw the first week's result, I apologized to her." },
        { r: "$40/day", text: "I lost my job and no one hires. When I saw I could do it from my phone, without showing my face... everything changed." }] },
      tempo: { hook: "also thought they had no time — until they found out 10 minutes is enough:", stories: [
        { r: "$35/day", text: "I work all day. I do everything in 10 minutes before bed. My wife can't believe it makes money." },
        { r: "$18/day", text: "My free time is zero. I trade on my lunch break and I don't depend on anyone anymore." },
        { r: "$45/day", text: "I thought it'd be one more stressful thing. It takes less time than watching a TV show." }] },
      inicio: { hook: "also felt completely lost — until they got the right support:", stories: [
        { r: "$29/day", text: "I'd never touched anything online. Support held my hand. Today I trade on my own." },
        { r: "$17/day", text: "I was scared of pressing the wrong button. Support answered every question. In 3 days I was doing it myself." },
        { r: "$40/day", text: "I felt dumb. But nobody judges you here. They teach you as many times as you need. Today I help the newbies." }] },
      dinheiro: { hook: "also thought they needed a lot of money — and were surprised:", stories: [
        { r: "$35/day", text: "I thought I needed thousands. When I saw I could start with little, I got that it was for people like me." },
        { r: "$18/day", text: "I owed on my card. I gathered the little I had and took the risk. By day three I'd recovered it all." },
        { r: "$45/day", text: "In one week I was in the green. Today I live easy." }] },
    },
  },
  es: {
    titleA: "Personas con el ", titleBold: "mismo perfil que tú", they: "Ellos ", years: "años",
    byObstacle: {
      medo: { hook: "también tenían miedo de caer en una estafa — hasta que arriesgaron una última vez:", stories: [
        { r: "$29/día", text: "Ya había perdido dinero dos veces. Casi no entré. Pero cuando cayó el primer retiro, lloré. No de alegría — de alivio." },
        { r: "$17/día", text: "Mi hija insistió. Yo decía que era estafa. Entré desconfiada. Cuando vi el resultado de la primera semana, le pedí disculpas." },
        { r: "$40/día", text: "Perdí mi empleo y nadie contrata. Cuando vi que se podía desde el celular, sin aparecer... cambió todo." }] },
      tempo: { hook: "también creían que no tenían tiempo — hasta descubrir que 10 minutos bastan:", stories: [
        { r: "$35/día", text: "Trabajo todo el día. Hago todo en 10 minutos antes de dormir. Mi esposa no cree que genere ingresos." },
        { r: "$18/día", text: "Mi tiempo libre es cero. Opero en el almuerzo y ya no dependo de nadie." },
        { r: "$45/día", text: "Creía que iba a ser otra cosa estresante. Me lleva menos que ver una serie." }] },
      inicio: { hook: "también se sentían completamente perdidos — hasta recibir el soporte correcto:", stories: [
        { r: "$29/día", text: "Nunca toqué nada online. El soporte me tomó de la mano. Hoy opero solo." },
        { r: "$17/día", text: "Tenía miedo de apretar el botón equivocado. El soporte respondió cada duda. En 3 días ya lo hacía sola." },
        { r: "$40/día", text: "Me sentía tonto. Pero aquí nadie te juzga. Te enseñan cuantas veces haga falta. Hoy ayudo a los nuevos." }] },
      dinheiro: { hook: "también creían que necesitaban mucho dinero — y se sorprendieron:", stories: [
        { r: "$35/día", text: "Creí que necesitaba miles. Cuando vi que se podía empezar con poco, entendí que era para gente como yo." },
        { r: "$18/día", text: "Debía la tarjeta. Junté lo poco que tenía y arriesgué. Al tercer día ya lo había recuperado." },
        { r: "$45/día", text: "En una semana ya estaba en positivo. Hoy vivo tranquilo." }] },
    },
  },
};
const PLY_NAMES = [
  { name: "José Almeida", avatar: avatarAntonio }, { name: "Cláudia Reis", avatar: avatarClaudia }, { name: "Marcos Oliveira", avatar: avatarCarlos },
];
const PLY_NAMES_T = [
  { name: "Roberto Lima", avatar: avatarCarlos }, { name: "Sandra Costa", avatar: avatarClaudia }, { name: "Paulo Mendes", avatar: avatarAntonio },
];

const PeopleLikeYou = ({ answers }: { answers?: QuizAnswers }) => {
  const { lang } = useLanguage();
  const tt = PLY[lang];
  const ages = getFixedAges(answers?.age);
  const obstacle = (answers?.obstacle || "medo") as keyof typeof tt.byObstacle;
  const ctx = tt.byObstacle[obstacle] || tt.byObstacle.medo;
  const names = obstacle === "tempo" || obstacle === "dinheiro" ? PLY_NAMES_T : PLY_NAMES;

  return (
    <div className="w-full space-y-4">
      <h3 className="font-display text-lg font-bold text-foreground text-center leading-snug">
        {tt.titleA}<span className="text-gradient-green">{tt.titleBold}</span>
      </h3>
      <p className="text-sm text-muted-foreground text-center">
        {tt.they}{ctx.hook}
      </p>
      <div className="space-y-3">
        {ctx.stories.map((s, i) => (
          <TestimonialCard key={i} name={names[i].name} age={`${ages[i]} ${tt.years}`} city="" avatar={names[i].avatar} text={s.text} result={s.r} />
        ))}
      </div>
    </div>
  );
};

/* ─── Earnings Projection ─── */
const EP_AGEGROUP: Record<Language, Record<string, string>> = {
  pt: { "18-25": "18 a 25 anos", "26-35": "26 a 35 anos", "36-45": "36 a 45 anos", "46-55": "46 a 55 anos", "56+": "acima de 55 anos", def: "perfil semelhante ao seu" },
  en: { "18-25": "18 to 25", "26-35": "26 to 35", "36-45": "36 to 45", "46-55": "46 to 55", "56+": "over 55", def: "a profile like yours" },
  es: { "18-25": "18 a 25 años", "26-35": "26 a 35 años", "36-45": "36 a 45 años", "46-55": "46 a 55 años", "56+": "más de 55 años", def: "un perfil como el tuyo" },
};
const EP_T = {
  pt: { badge: "Projeção personalizada", titleA: (n: string) => `${n ? `${n}, ` : ""}Veja o que esperar nos próximos 30 dias`, subA: "Baseado nas suas respostas e nos resultados de ", subAlumni: (c: string) => `+${c} alunos`, subWith: " com ", subC: " que já passaram por aqui.", d3: "Dia 3", d7: "Dia 7", d14: "Dia 14", d21: "Dia 21", d30: "Dia 30", p3: "Primeira operação no ar", p7: "Primeiros resultados reais", p14: "Ganhando consistência", p21: "Ritmo acelerando", p30acc: (v: string) => `≈ ${v}/mês acumulado`, potential: "Potencial em 30 dias", perMonth: "/mês", footerAlumni: (c: string) => `+${c} alunos`, footerWith: " com ", footerC: " já alcançaram resultados semelhantes usando o mesmo método.", disclaimer: "*Projeção baseada na média de resultados de alunos com perfil semelhante. Resultados individuais podem variar." },
  en: { badge: "Personalized projection", titleA: (n: string) => `${n ? `${n}, ` : ""}See what to expect over the next 30 days`, subA: "Based on your answers and the results of ", subAlumni: (c: string) => `${c}+ members`, subWith: " aged ", subC: " who came through here.", d3: "Day 3", d7: "Day 7", d14: "Day 14", d21: "Day 21", d30: "Day 30", p3: "First trade live", p7: "First real results", p14: "Gaining consistency", p21: "Pace picking up", p30acc: (v: string) => `≈ ${v}/mo accumulated`, potential: "Potential in 30 days", perMonth: "/mo", footerAlumni: (c: string) => `${c}+ members`, footerWith: " aged ", footerC: " have already reached similar results using the same method.", disclaimer: "*Projection based on the average results of members with a similar profile. Individual results may vary." },
  es: { badge: "Proyección personalizada", titleA: (n: string) => `${n ? `${n}, ` : ""}Mira qué esperar en los próximos 30 días`, subA: "Según tus respuestas y los resultados de ", subAlumni: (c: string) => `+${c} miembros`, subWith: " de ", subC: " que ya pasaron por aquí.", d3: "Día 3", d7: "Día 7", d14: "Día 14", d21: "Día 21", d30: "Día 30", p3: "Primera operación al aire", p7: "Primeros resultados reales", p14: "Ganando consistencia", p21: "El ritmo acelera", p30acc: (v: string) => `≈ ${v}/mes acumulado`, potential: "Potencial en 30 días", perMonth: "/mes", footerAlumni: (c: string) => `+${c} miembros`, footerWith: " de ", footerC: " ya alcanzaron resultados similares usando el mismo método.", disclaimer: "*Proyección basada en el promedio de resultados de miembros con perfil similar. Los resultados individuales pueden variar." },
};
const EP_ALUMNI: Record<string, string> = { "18-25": "4.200", "26-35": "6.800", "36-45": "8.100", "46-55": "9.400", "56+": "7.500", "18 a 25 anos": "4.200", "26 a 35 anos": "6.800", "36 a 45 anos": "8.100", "46 a 55 anos": "9.400", "56 anos ou mais": "7.500" };
const EP_AGEKEY: Record<string, string> = { "18 a 25 anos": "18-25", "26 a 35 anos": "26-35", "36 a 45 anos": "36-45", "46 a 55 anos": "46-55", "56 anos ou mais": "56+" };

const EarningsProjection = ({ answers, firstName }: { answers?: QuizAnswers; firstName: string }) => {
  const { lang, locale } = useLanguage();
  const t = EP_T[lang];
  const money = (n: number) => s13money(n, lang, locale);
  const ageKey = EP_AGEKEY[answers?.age || ""] || answers?.age || "";
  const daily = S13_CUR[lang].daily[answers?.incomeGoal || ""] || (lang === "pt" ? 200 : 40);
  const ageGroup = EP_AGEGROUP[lang][ageKey] || EP_AGEGROUP[lang].def;
  const alumniCount = EP_ALUMNI[answers?.age || ""] || "8.000";

  const monthlyGoal = daily * 30;
  const nearGoal = Math.round(monthlyGoal * 1.05);
  const day3 = Math.round(daily * 0.15);
  const day7 = Math.round(daily * 0.4);
  const day14 = Math.round(daily * 0.65);
  const day21 = Math.round(daily * 0.85);
  const day30 = Math.round(daily * 1.05);

  const projections = [
    { period: t.d3, value: day3, bar: 10, label: t.p3, color: "hsl(var(--primary) / 0.35)" },
    { period: t.d7, value: day7, bar: 25, label: t.p7, color: "hsl(var(--primary) / 0.5)" },
    { period: t.d14, value: day14, bar: 45, label: t.p14, color: "hsl(var(--primary) / 0.65)" },
    { period: t.d21, value: day21, bar: 70, label: t.p21, color: "hsl(var(--primary) / 0.8)" },
    { period: t.d30, value: day30, bar: 100, label: t.p30acc(money(nearGoal)), color: "hsl(var(--primary))" },
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
          <span className="text-[11px] font-bold text-primary uppercase tracking-wider">{t.badge}</span>
        </motion.div>
        <h3 className="font-display text-lg font-bold text-foreground leading-snug">
          {t.titleA(firstName)}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {t.subA}
          <span className="text-primary font-bold">{t.subAlumni(alumniCount)}</span>{t.subWith}
          <span className="font-semibold text-foreground">{ageGroup}</span>{t.subC}
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
                  {money(p.value)}
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
              <span className="text-sm font-bold text-foreground">{t.potential}</span>
            </div>
            <motion.span
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.9, type: "spring" }}
              className="text-xl font-display font-bold text-primary"
            >
              {money(nearGoal)}{t.perMonth}
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
          <span className="font-semibold text-foreground">{t.footerAlumni(alumniCount)}</span>{t.footerWith}{ageGroup}{t.footerC}
        </p>
      </motion.div>

      <p className="text-[10px] text-muted-foreground/40 text-center">
        {t.disclaimer}
      </p>
    </div>
  );
};

/* ─── WhatsApp Welcome Preview ─── */
const WhatsAppWelcome = ({ firstName }: { firstName: string }) => {
  const { lang } = useLanguage();
  const tt = {
    pt: { fallback: "Aluno(a)", titleA: "Isso é o que vai acontecer ", titleBold: "nos próximos 5 minutos", sub: "Assim que confirmar, você recebe essa mensagem no seu celular:", support: "Suporte Ganhos Tempo Livre", online: "online", today: "HOJE", input: "Mensagem",
      msgs: (n: string) => [`Olá ${n}! Seja muito bem-vindo(a) à família Ganhos Tempo Livre! 🎉`, `Meu nome é Ana e vou ser sua mentora pessoal.`, `Já liberei seu acesso completo. Vou te mandar o link agora 👇`, `Qualquer dúvida, me chama aqui. Estou aqui pra te ajudar em cada passo.`, `Amanhã já quero ver seu primeiro resultado! 💰`] },
    en: { fallback: "Member", titleA: "This is what happens ", titleBold: "in the next 5 minutes", sub: "As soon as you confirm, you get this message on your phone:", support: "Free Time Earnings Support", online: "online", today: "TODAY", input: "Message",
      msgs: (n: string) => [`Hi ${n}! Welcome to the Free Time Earnings family! 🎉`, `My name is Ana and I'll be your personal mentor.`, `I've already unlocked your full access. Sending the link now 👇`, `Any questions, message me here. I'm with you every step.`, `Tomorrow I already want to see your first result! 💰`] },
    es: { fallback: "Miembro", titleA: "Esto es lo que pasa ", titleBold: "en los próximos 5 minutos", sub: "Apenas confirmes, recibes este mensaje en tu celular:", support: "Soporte Ganancias Tiempo Libre", online: "en línea", today: "HOY", input: "Mensaje",
      msgs: (n: string) => [`¡Hola ${n}! ¡Bienvenido(a) a la familia Ganancias Tiempo Libre! 🎉`, `Mi nombre es Ana y voy a ser tu mentora personal.`, `Ya liberé tu acceso completo. Te mando el enlace ahora 👇`, `Cualquier duda, escríbeme aquí. Estoy contigo en cada paso.`, `¡Mañana ya quiero ver tu primer resultado! 💰`] },
  }[lang];
  const name = firstName || tt.fallback;
  return (
    <div className="w-full space-y-3">
      <h3 className="font-display text-lg font-bold text-foreground text-center leading-snug">
        {tt.titleA}<span className="text-gradient-green">{tt.titleBold}</span>
      </h3>
      <p className="text-sm text-muted-foreground text-center">
        {tt.sub}
      </p>
      <div className="rounded-xl overflow-hidden border border-border shadow-xl" style={{ backgroundColor: "#111b21" }}>
        <div className="bg-[#1f2c34] px-3 py-2 flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#aebac1"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" transform="rotate(180 12 12)"/></svg>
          <img src={mentorPhoto} alt="Suporte" className="w-8 h-8 rounded-full object-cover" />
          <div>
            <p className="text-[#e9edef] text-sm font-normal">{tt.support}</p>
            <p className="text-[#8696a0] text-[11px]">{tt.online}</p>
          </div>
        </div>
        <div className="px-3 py-3 space-y-1" style={{ backgroundColor: "#0b141a" }}>
          <div className="flex justify-center mb-2">
            <span className="bg-[#182229] text-[#8696a0] text-[11px] px-3 py-1 rounded-lg">{tt.today}</span>
          </div>
          {tt.msgs(name).map((text, i) => (
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
            <span className="text-[#8696a0] text-sm">{tt.input}</span>
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
  const { lang } = useLanguage();
  const tapWatch = { pt: "Toque para assistir", en: "Tap to watch", es: "Toca para ver" }[lang];
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
          <span className="absolute bottom-4 text-xs text-white/80 font-medium z-10">{tapWatch}</span>
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
  const { lang } = useLanguage();
  const tt = { pt: { real: "Resultados reais", of: "de", verified: "prints verificados" }, en: { real: "Real results", of: "of", verified: "verified screenshots" }, es: { real: "Resultados reales", of: "de", verified: "capturas verificadas" } }[lang];
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
          <span className="text-[10px] font-bold text-primary uppercase tracking-wider">{tt.real}</span>
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
        <span className="text-primary font-bold">{current + 1}</span> {tt.of} {images.length} {tt.verified}
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
      getPricing(),
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
      dynamic_price: getPricing().price,
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

  const { lang, locale } = useLanguage();
  const money = (n: number) => s13money(n, lang, locale);
  const p13 = S13_PRICE[lang];
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const firstName = userName?.split(" ")[0] || "";
  const pricing = getPricing();

  const bonuses = {
    pt: [
      { title: "Modo Auto-Lucro Inteligente", value: "R$997", description: "Ative e o sistema escolhe o melhor ativo, horário e valor por operação baseado no seu saldo. Você só clica em 'ativar'." },
      { title: "Suporte VIP — Resposta em 2 Minutos", value: "R$397", description: "Dúvida? Travou? Só chamar. Canal direto com especialistas que respondem em tempo real. Você nunca fica sozinho." },
      { title: "Turbo de Lucro — Versão Estratégica", value: "R$297", description: "Rotina inteligente que multiplica saldos pequenos com entradas automáticas em sequência controlada." },
      { title: "Bot de Lucros em Dólar — Versão Silenciosa", value: "R$497", description: "Roda em segundo plano e envia alertas de ganhos e oportunidades no Telegram. Nem precisa abrir o sistema." },
      { title: "Bloqueador de Ganância e Pânico", value: "R$497", description: "Sistema interno que trava operações fora da lógica. Protege seu lucro e controla a ansiedade do operador." },
      { title: "Comunidade VIP no WhatsApp", value: "R$147", description: "Grupo exclusivo com +36.000 alunos que se ajudam todos os dias. Nunca mais fique sozinho." },
    ],
    en: [
      { title: "Smart Auto-Profit Mode", value: "$199", description: "Turn it on and the system picks the best asset, time and amount per trade based on your balance. You just click 'activate'." },
      { title: "VIP Support — 2-Minute Reply", value: "$79", description: "Question? Stuck? Just message. A direct line to specialists who answer in real time. You're never alone." },
      { title: "Profit Turbo — Strategic Edition", value: "$59", description: "A smart routine that multiplies small balances with automatic entries in a controlled sequence." },
      { title: "Dollar Profit Bot — Silent Edition", value: "$99", description: "Runs in the background and sends earnings and opportunity alerts on Telegram. You don't even open the system." },
      { title: "Greed & Panic Blocker", value: "$99", description: "An internal system that blocks trades outside the logic. Protects your profit and controls trader anxiety." },
      { title: "VIP WhatsApp Community", value: "$29", description: "An exclusive group with 36,000+ members helping each other every day. Never be alone again." },
    ],
    es: [
      { title: "Modo Auto-Ganancia Inteligente", value: "$199", description: "Actívalo y el sistema elige el mejor activo, horario y monto por operación según tu saldo. Solo haces clic en 'activar'." },
      { title: "Soporte VIP — Respuesta en 2 Minutos", value: "$79", description: "¿Duda? ¿Trabado? Solo escribe. Canal directo con especialistas que responden en tiempo real. Nunca estás solo." },
      { title: "Turbo de Ganancia — Versión Estratégica", value: "$59", description: "Rutina inteligente que multiplica saldos pequeños con entradas automáticas en secuencia controlada." },
      { title: "Bot de Ganancias en Dólar — Versión Silenciosa", value: "$99", description: "Corre en segundo plano y envía alertas de ganancias y oportunidades en Telegram. Ni abres el sistema." },
      { title: "Bloqueador de Codicia y Pánico", value: "$99", description: "Sistema interno que traba operaciones fuera de la lógica. Protege tu ganancia y controla la ansiedad del operador." },
      { title: "Comunidad VIP en WhatsApp", value: "$29", description: "Grupo exclusivo con +36.000 miembros que se ayudan todos los días. Nunca más estés solo." },
    ],
  }[lang];

  const cashDisp = `${S13_CUR[lang].sym}${p13.cash}`;
  const faqs = {
    pt: [
      { icon: HelpCircle, question: "Eu não entendo nada de tecnologia. Vou conseguir?", answer: `Essa é a dúvida mais comum — e a resposta é sim.\n\nO método foi feito pra quem nunca abriu nada além do WhatsApp. São instruções passo a passo, com vídeos curtos e suporte humano real. Dos nossos 36.000 alunos, a maioria tem entre 45 e 65 anos e começou do zero absoluto.\n\nSe você está lendo isso agora, você já tem a habilidade necessária.` },
      { icon: Smartphone, question: "Funciona só pelo celular? Preciso de computador?", answer: `Funciona 100% pelo celular. Na verdade, a maioria dos nossos alunos que mais ganham usa apenas o celular — deitados no sofá, no intervalo do almoço, ou esperando o ônibus.\n\nNão precisa de internet rápida, não precisa de computador, não precisa de nada especial. Só o celular que já está na sua mão.` },
      { icon: Clock, question: "Quanto tempo por dia eu preciso dedicar?", answer: `15 a 30 minutos. Sério.\n\nIsso não é um segundo emprego. É uma ferramenta que trabalha pra você. Você configura uma vez, acompanha quando quiser, e os ganhos aparecem.\n\nTem aluno que olha de manhã e de noite. Tem aluno que olha uma vez por dia. Cada um no seu ritmo.` },
      { icon: TrendingUp, question: "Mas em quanto tempo eu começo a ganhar?", answer: `Muitos alunos veem o primeiro resultado no mesmo dia que configuram. Outros levam 2-3 dias pra se acostumar com o painel.\n\nO ponto é: não é um curso de 6 meses onde você só vê resultado depois. Aqui, você aplica hoje e vê o resultado hoje. É renda prática, não teoria.` },
      { icon: ShieldCheck, question: "E se eu não gostar? Perco meu dinheiro?", answer: `Impossível perder.\n\nVocê tem 30 dias de garantia incondicional. Se não gostar — por qualquer motivo, mesmo que seja "mudei de ideia" — você manda uma mensagem e devolvemos 100% do valor. Sem perguntas, sem formulário, sem espera.\n\nO risco é zero. Literalmente zero. Se não funcionar pra você, quem perde somos nós — não você.` },
      { icon: AlertTriangle, question: "Já fui enganado antes. Como sei que não é golpe?", answer: `Sua desconfiança é 100% válida. A internet está cheia de promessas vazias.\n\nMas repare: nós oferecemos 30 dias de garantia total, temos suporte humano que responde em minutos, e mais de 36.000 pessoas já passaram por aqui. Você pode testar o método inteiro e, se achar que não vale, recebe tudo de volta.\n\nGolpe não oferece garantia. Golpe não tem suporte. Golpe não deixa você testar antes. Nós fazemos tudo isso porque sabemos que funciona.` },
      { icon: CreditCard, question: `${cashDisp} é tudo? Tem alguma taxa depois?`, answer: `${cashDisp} é o valor total. Ponto final.\n\nNão tem mensalidade, não tem taxa escondida, não tem "desbloqueio premium" por mais dinheiro. Você paga uma única vez e recebe acesso completo — ao método, à plataforma, ao suporte humano e a todos os bônus.\n\nÉ menos que uma pizza. E o retorno pode aparecer no mesmo dia.` },
      { icon: Lock, question: "Preciso colocar mais dinheiro depois pra funcionar?", answer: `Não. Zero.\n\nO método ensina a gerar ganhos sem investimento adicional. O único valor envolvido é o ${cashDisp} de acesso. Tudo que vier depois é lucro líquido pra você.\n\nNão pedimos PIX, não pedimos depósito, não pedimos nada além do acesso. Quem diz o contrário está mentindo.` },
    ],
    en: [
      { icon: HelpCircle, question: "I don't understand anything about tech. Can I do this?", answer: `That's the most common question — and the answer is yes.\n\nThe method was built for people who've never opened anything beyond WhatsApp. Step-by-step instructions, short videos, and real human support. Of our 36,000 members, most are between 45 and 65 and started from absolute zero.\n\nIf you're reading this now, you already have the skill you need.` },
      { icon: Smartphone, question: "Does it work on the phone only? Do I need a computer?", answer: `It works 100% on your phone. In fact, most of our top-earning members use only their phone — lying on the couch, on their lunch break, or waiting for the bus.\n\nNo fast internet needed, no computer needed, nothing special. Just the phone already in your hand.` },
      { icon: Clock, question: "How much time per day do I need?", answer: `15 to 30 minutes. Seriously.\n\nThis isn't a second job. It's a tool that works for you. You set it up once, check in whenever you want, and the earnings show up.\n\nSome members check morning and night. Others once a day. Each at their own pace.` },
      { icon: TrendingUp, question: "But how long until I start earning?", answer: `Many members see their first result the same day they set it up. Others take 2-3 days to get used to the dashboard.\n\nThe point is: it's not a 6-month course where you only see results later. Here, you apply today and see the result today. It's practical income, not theory.` },
      { icon: ShieldCheck, question: "And if I don't like it? Do I lose my money?", answer: `Impossible to lose.\n\nYou have 30 days of unconditional guarantee. If you don't like it — for any reason, even "I changed my mind" — you send a message and we refund 100%. No questions, no form, no waiting.\n\nThe risk is zero. Literally zero. If it doesn't work for you, we're the ones who lose — not you.` },
      { icon: AlertTriangle, question: "I've been scammed before. How do I know this isn't one?", answer: `Your skepticism is 100% valid. The internet is full of empty promises.\n\nBut notice: we offer a full 30-day guarantee, we have human support that answers in minutes, and over 36,000 people have come through here. You can test the whole method and, if you decide it's not worth it, you get everything back.\n\nA scam doesn't offer a guarantee. A scam has no support. A scam doesn't let you test first. We do all of that because we know it works.` },
      { icon: CreditCard, question: `${cashDisp} is all? Is there a fee later?`, answer: `${cashDisp} is the total amount. Full stop.\n\nNo monthly fee, no hidden charge, no "premium unlock" for more money. You pay once and get full access — to the method, the platform, human support, and all the bonuses.\n\nIt's less than a pizza. And the return can show up the same day.` },
      { icon: Lock, question: "Do I have to put in more money later for it to work?", answer: `No. Zero.\n\nThe method teaches you to generate earnings with no extra investment. The only amount involved is the ${cashDisp} for access. Everything after that is net profit for you.\n\nWe don't ask for deposits, we don't ask for anything beyond access. Anyone who says otherwise is lying.` },
    ],
    es: [
      { icon: HelpCircle, question: "No entiendo nada de tecnología. ¿Voy a poder?", answer: `Esa es la duda más común — y la respuesta es sí.\n\nEl método está hecho para quien nunca abrió nada más que WhatsApp. Instrucciones paso a paso, videos cortos y soporte humano real. De nuestros 36.000 miembros, la mayoría tiene entre 45 y 65 años y empezó desde cero absoluto.\n\nSi estás leyendo esto ahora, ya tienes la habilidad necesaria.` },
      { icon: Smartphone, question: "¿Funciona solo por el celular? ¿Necesito computadora?", answer: `Funciona 100% por el celular. De hecho, la mayoría de nuestros miembros que más ganan usa solo el celular — acostados en el sofá, en el almuerzo o esperando el bus.\n\nNo necesitas internet rápido, no necesitas computadora, no necesitas nada especial. Solo el celular que ya tienes en la mano.` },
      { icon: Clock, question: "¿Cuánto tiempo por día necesito dedicar?", answer: `15 a 30 minutos. En serio.\n\nEsto no es un segundo empleo. Es una herramienta que trabaja por ti. Configuras una vez, acompañas cuando quieras, y las ganancias aparecen.\n\nHay miembros que miran de mañana y de noche. Otros una vez al día. Cada uno a su ritmo.` },
      { icon: TrendingUp, question: "¿Pero en cuánto tiempo empiezo a ganar?", answer: `Muchos miembros ven el primer resultado el mismo día que lo configuran. Otros tardan 2-3 días en acostumbrarse al panel.\n\nEl punto es: no es un curso de 6 meses donde solo ves resultado después. Aquí, aplicas hoy y ves el resultado hoy. Es ingreso práctico, no teoría.` },
      { icon: ShieldCheck, question: "¿Y si no me gusta? ¿Pierdo mi dinero?", answer: `Imposible perder.\n\nTienes 30 días de garantía incondicional. Si no te gusta — por cualquier motivo, aunque sea "cambié de idea" — mandas un mensaje y devolvemos el 100%. Sin preguntas, sin formulario, sin espera.\n\nEl riesgo es cero. Literalmente cero. Si no funciona para ti, los que perdemos somos nosotros — no tú.` },
      { icon: AlertTriangle, question: "Ya me han engañado antes. ¿Cómo sé que no es estafa?", answer: `Tu desconfianza es 100% válida. Internet está llena de promesas vacías.\n\nPero fíjate: ofrecemos 30 días de garantía total, tenemos soporte humano que responde en minutos, y más de 36.000 personas ya pasaron por aquí. Puedes probar el método entero y, si crees que no vale, recibes todo de vuelta.\n\nUna estafa no ofrece garantía. Una estafa no tiene soporte. Una estafa no te deja probar antes. Nosotros hacemos todo eso porque sabemos que funciona.` },
      { icon: CreditCard, question: `¿${cashDisp} es todo? ¿Hay alguna tarifa después?`, answer: `${cashDisp} es el valor total. Punto final.\n\nNo hay mensualidad, no hay tarifa oculta, no hay "desbloqueo premium" por más dinero. Pagas una sola vez y recibes acceso completo — al método, a la plataforma, al soporte humano y a todos los bonos.\n\nEs menos que una pizza. Y el retorno puede aparecer el mismo día.` },
      { icon: Lock, question: "¿Necesito poner más dinero después para que funcione?", answer: `No. Cero.\n\nEl método enseña a generar ganancias sin inversión adicional. El único valor involucrado es el ${cashDisp} de acceso. Todo lo que venga después es ganancia neta para ti.\n\nNo pedimos depósitos, no pedimos nada más que el acceso. Quien diga lo contrario está mintiendo.` },
    ],
  }[lang];

  const fixedAges = getFixedAges(answers?.age);
  const yearsW = { pt: "anos", en: "yrs", es: "años" }[lang];
  const testimonials = {
    pt: [
      { name: "Sebastião Moreira", city: "Manaus, AM", avatar: avatarJose, text: "Minha renda não cobria o aluguel. Vivia contando moeda. Hoje tenho uma renda extra que me devolveu a dignidade de não precisar pedir nada a ninguém.", result: "R$147/dia" },
      { name: "Regina Aparecida", city: "Campinas, SP", avatar: avatarRegina, text: "Fui demitida depois de anos. Com dois filhos, o desespero bateu. Em duas semanas já tinha pagado a conta de luz que tava cortada.", result: "R$210/dia" },
      { name: "Luciana Borges", city: "Fortaleza, CE", avatar: avatarLucia, text: "Meu marido ria de mim quando disse que ia ganhar dinheiro pelo celular. Hoje ele me pede pra ensinar. Marcamos a viagem que sonhávamos há anos.", result: "R$180/dia" },
    ],
    en: [
      { name: "Sebastião Moreira", city: "Manaus, BR", avatar: avatarJose, text: "My income didn't cover rent. I lived counting coins. Today I have extra income that gave me back the dignity of not having to ask anyone for anything.", result: "$29/day" },
      { name: "Regina Aparecida", city: "Campinas, BR", avatar: avatarRegina, text: "I was laid off after years. With two kids, panic hit. In two weeks I'd already paid the electric bill that had been cut off.", result: "$40/day" },
      { name: "Luciana Borges", city: "Fortaleza, BR", avatar: avatarLucia, text: "My husband laughed at me when I said I'd make money on my phone. Today he asks me to teach him. We booked the trip we'd dreamed of for years.", result: "$35/day" },
    ],
    es: [
      { name: "Sebastião Moreira", city: "Manaus, BR", avatar: avatarJose, text: "Mi ingreso no cubría el alquiler. Vivía contando monedas. Hoy tengo un ingreso extra que me devolvió la dignidad de no tener que pedirle nada a nadie.", result: "$29/día" },
      { name: "Regina Aparecida", city: "Campinas, BR", avatar: avatarRegina, text: "Me despidieron tras años. Con dos hijos, llegó la desesperación. En dos semanas ya había pagado la cuenta de luz que estaba cortada.", result: "$40/día" },
      { name: "Luciana Borges", city: "Fortaleza, BR", avatar: avatarLucia, text: "Mi esposo se reía de mí cuando dije que iba a ganar dinero por el celular. Hoy me pide que le enseñe. Reservamos el viaje que soñábamos hace años.", result: "$35/día" },
    ],
  }[lang].map((tm, i) => ({ ...tm, age: `${fixedAges[i]} ${yearsW}` }));

  const MT_ALL: any = {
    pt: {
      barExpires: "Oferta expira em", barAfter: `Depois: ${S13_CUR[lang].sym}${p13.old}`,
      heroA: (n: string) => (n ? `${n}, sua` : "Sua"), heroBold: "pronta", heroSubA: "Falta ", heroSubBold: "1 passo", heroSubC: " pra gerar renda extra todo dia.",
      vslBadge: "Assista antes de decidir", vslTitleA: "Descubra como ", vslTitleBold: "pessoas comuns", vslTitleMid: " estão gerando renda extra ", vslTitleBold2: "todos os dias", vslSub: "Veja em 4 minutos como a plataforma funciona na prática.",
      valBadge: "Na mídia", valTitleA: "Seu Valdemar, aos 62 anos, deu ", valTitleBold: "entrevista ao jornal", valTitleC: " contando como a plataforma mudou sua vida", valSub: "Uma história real que pode ser a sua também.",
      pp1Sub: "Prints reais enviados pelos alunos no grupo. Sem edição.", pp2Sub: "Mensagens espontâneas de quem já usa o método no dia a dia.",
      poweredBy: "Powered by ChatGPT", openaiAI: "Inteligência Artificial OpenAI", youPay: "Você paga", aiFee: "Taxa de ativação da IA", weKeep: "Nós ficamos com", zeroNote: "Zero. Nada. Nenhum centavo.", howWeEarn: "Como ganhamos então?", after30A: "Só depois de ", after30Bold: "30 dias", after30Mid: ", quando você já estiver lucrando, cobramos apenas ", after30Pct: "2% dos seus lucros", after30C: ".", weWinA: "Só ganhamos quando ", weWinBold: "você ganha", weWinC: ". Simples assim.",
      mentorQuote: (n: string) => `"${n ? `${n}, ` : ""}Eu sei que você já foi enganado antes. Por isso eu coloco minha cara. Se você não tiver resultado em 30 dias, eu devolvo seu dinheiro pessoalmente. Sem joguinho."`, mentorCredit: "— Ricardo Almeida • Criador do método • +36.000 alunos",
      hiwKicker: "Simples assim", hiwTitle: "Como funciona na prática?", hiwSub: "3 passos. Sem complicação. Sem conhecimento técnico.",
      hiwSteps: [
        { title: "Acesse pelo celular", desc: "Você recebe o acesso por e-mail e WhatsApp. Abre no celular — como abrir qualquer site. Não precisa instalar nada.", detail: "Funciona em qualquer celular, mesmo os mais simples." },
        { title: "Ative a IA com 1 clique", desc: "A inteligência artificial do ChatGPT começa a trabalhar por você automaticamente. É como apertar um botão e deixar a máquina fazer o trabalho.", detail: "Você não precisa entender como funciona por dentro. Só ativar." },
        { title: "Acompanhe seus ganhos", desc: "Os resultados aparecem no seu painel. Você acompanha pelo celular, na hora que quiser. Pode sacar quando quiser.", detail: "A maioria dos alunos vê o primeiro resultado no mesmo dia." },
      ],
      hiwSummaryA: "Resumo: você acessa, ativa e acompanha. ", hiwSummaryBold: "A IA faz o resto.", hiwTimeA: "Tempo médio pra configurar: ", hiwTimeBold: "menos de 10 minutos",
      vdTitleA: "A forma mais ", vdTitleBold1: "justa", vdTitleMid: " de trabalhar é ", vdTitleBold2: "primeiro fazendo você lucrar.", vdSub: "Assista o depoimento de quem já vive isso na prática:",
      miniGuarTitle: "Garantia de 30 dias", miniGuarSub: "Não gostou? Devolvemos 100%. Sem perguntas.",
      carlosName: "Carlos Mendonça, 52 anos", carlosResult: "R$200/dia", carlosText: '"Já perdi dinheiro 2 vezes na internet. Aqui o suporte me acompanhou em cada passo. Hoje faço R$200 por dia só no celular. Minha esposa viu e também começou."',
      moneyObjA: "Custa ", moneyObjBold: "menos que um almoço por semana", moneyObjMid: ". E muitos alunos recuperam o valor ", moneyObjBold2: "no primeiro dia", moneyObjC: ".",
      vsKicker: "ACESSO COMPLETO", vsTitleA: "Tudo que você recebe ao ativar a ", vsTitleBold: "Plataforma de Ganhos com Tempo Livre", vsTitleC: ":",
      vsItems: ["Acesso vitalício à Plataforma de Ganhos com Tempo Livre", "Método passo a passo — do zero ao resultado", "Vídeo-aulas em linguagem simples e direta", "Suporte humano em tempo real via WhatsApp", "Comunidade exclusiva com +36.000 alunos", "Plano personalizado pro seu perfil"],
      vsTotalA: "Valor total da plataforma:",
      vtTitleA: "Depoimentos em ", vtTitleBold: "vídeo", vtSub: "Assista quem já mudou de vida:",
      bonusKicker: "BÔNUS EXCLUSIVOS", bonusTitleA: "Receba ", bonusTitleBold: "6 ferramentas extras", bonusTitleMid: " ao ativar sua ", bonusTitleBold2: "Plataforma de Ganhos com Tempo Livre", bonusTitleC: " hoje", bonusSub: "Tudo incluso. Sem pagar nada a mais.",
      anchorBonusLbl: "Valor total dos 6 bônus:", anchorTodayFree: "Hoje: GRÁTIS com seu acesso",
      whyFreeTitle: "Por que estou dando tudo isso de graça?", whyFreeA: "Simples: eu ", whyFreeBold1: "quero que você ganhe", whyFreeMid: ". Quanto mais você lucra nos primeiros 30 dias, maior é a minha parte de ", whyFreePct: "2%", whyFreeMid2: " depois. Eu só ganho quando ", whyFreeBold2: "você ganha", whyFreeC: ". Por isso faço questão de te dar todas as ferramentas possíveis.",
      objTitle: "Talvez você ainda esteja pensando...",
      obj2q: '"Já perdi dinheiro na internet antes..."', obj2r: "Exatamente por isso existe a garantia de 30 dias. Você testa sem risco. Se não gostar, devolvo cada centavo. Diferente de golpe, aqui você tem proteção total.",
      obj3q: '"Não tenho dinheiro sobrando..."', obj3r: (c: string) => `São ${c} uma única vez. Muitos alunos recuperam esse valor no primeiro dia. E se não recuperar em 30 dias, você recebe tudo de volta. Risco zero.`,
      obj4q: '"Tenho medo de tecnologia..."', obj4r: "Nosso suporte te acompanha em cada clique. Literalmente. Manda mensagem no WhatsApp e alguém responde em minutos. Você nunca vai ficar perdido.",
      waConv: "Conversas reais", waTitleA: "Olha o que estão mandando ", waTitleBold: "agora mesmo", waSub: "Prints diretos do grupo de alunos. Sem edição, sem filtro.",
      paTitleA: "Tudo isso por ", paTitleBold: "quanto?", paSub: "Vamos fazer as contas juntos:",
      paRows: ["Plataforma completa", "6 bônus exclusivos", "Suporte VIP em tempo real"], paTotalLbl: "Valor total real",
      paAiA: "A plataforma usa ", paAiBold1: "inteligência artificial avançada", paAiMid: " pra trabalhar por você. Cada operação consome ", paAiBold2: "processamento de IA", paAiC: " — e esse processamento tem custo real.",
      paFeeA: "O valor abaixo é ", paFeeBold: "apenas a taxa de ativação", paFeeMid: ". Nós ", paFeeBold2: "não ficamos com nenhum centavo", paFeeC: " desse pagamento.",
      paHowA: "Como ganhamos? ", paHowMid: "Só depois de 30 dias, quando você já estiver lucrando, cobramos apenas ", paHowPct: "2% dos seus lucros", paHowMid2: ". Ou seja: ", paHowBold: "só ganhamos quando você ganha.",
      paYouPay: "Você paga apenas", paXof: "x de", paOr: "ou", paPix: " à vista no Pix", paSnackA: "Isso é ", paSnackBold: "menos que um lanche no fim de semana", paSnackC: " — por algo que pode trazer tranquilidade financeira pra você e sua família.",
      payMethods: ["Pix (desconto)", "Cartão de Crédito", "Boleto"],
      guarTitle: "Garantia Blindada de 30 Dias", guarSub: "RISCO ZERO PRA VOCÊ",
      guarBodyA: (n: string) => (n ? `${n}, funciona` : "Funciona"), guarBodyC: " assim: você entra, testa a plataforma por 30 dias inteiros. Se por ", guarBodyStrong1: "qualquer motivo", guarBodyMid: ' — mesmo que seja "não gostei da cor do botão" — achar que não é pra você, basta mandar ', guarBodyStrong2: "uma única mensagem", guarBodyMid2: " e devolvemos ", guarBodyStrong3: "100% do seu dinheiro", guarBodyEnd: ". Sem perguntas. Sem burocracia. Sem letra miúda.",
      guarSeal: "Ou você lucra, ou recebe seu dinheiro de volta. Simples assim.",
      fpTitle: (n: string) => (n ? `${n}, fecha os olhos e imagina...` : "Fecha os olhos e imagina..."),
      fpItems: ["Acordar e ver que já ganhou dinheiro — antes mesmo de tomar café", "Pagar todas as contas em dia, sem aquele aperto no peito", "Dar algo bom pra sua família sem precisar pensar duas vezes", "Olhar pro extrato do banco e sentir orgulho do que construiu", "Não depender de ninguém. Ninguém. Nunca mais."],
      fpFooterA: "Tudo isso pode começar ", fpFooterBold: "hoje", fpFooterMid: ". Por menos de ", fpFooterC: " por dia.",
      faqKicker: "Tire suas dúvidas", faqTitle: "Tudo o que você precisa saber", faqSub: "Se a sua dúvida não estiver aqui, nosso suporte responde em minutos.", faqStillA: "Ainda com dúvida? ", faqStillBold: "O suporte está online agora.",
      lastChance: "Última chance", closeA: (n: string) => (n ? `${n}, essa` : "Essa"), closeMid: " condição de 12x de ", closeC: " é exclusiva pra quem completou a análise agora.", closeSub: (old: string) => `Ao sair desta página, o valor volta para ${old} e os bônus são removidos.`,
      trustSafe: "Compra segura", trustGuar: "Garantia 30 dias", trustSupport: "Suporte real",
      finalMentorQuote: '"Se em 30 dias você não tiver nenhum resultado, eu pessoalmente devolvo seu dinheiro. Sem pergunta, sem formulário. Minha palavra."', finalMentorCredit: "— Ricardo Almeida, criador do método",
      statActive: "alunos ativos", statSat: "satisfação", statResp: "resposta suporte",
      stickyCta: (tm: string) => `ATIVAR MINHA CHAVE AGORA — ${tm}`, stickySafe: "Compra segura", stickyGuar: "Garantia de 30 dias",
      ctxGuar30: "Garantia incondicional de 30 dias", ctxGuarFull: "Garantia de 30 dias · Acesso imediato · Suporte humano",
      pp1Title: <>Alunos lucrando <span className="text-gradient-green">todos os dias</span></>, pp2Title: <>Veja o que falam da <span className="text-gradient-green">plataforma</span></>,
    },
    en: {
      barExpires: "Offer expires in", barAfter: `After: ${S13_CUR[lang].sym}${p13.old}`,
      heroA: (n: string) => (n ? `${n}, your` : "Your"), heroBold: "ready", heroSubA: "Just ", heroSubBold: "1 step", heroSubC: " to earning extra income every day.",
      vslBadge: "Watch before deciding", vslTitleA: "Discover how ", vslTitleBold: "everyday people", vslTitleMid: " are earning extra income ", vslTitleBold2: "every day", vslSub: "See in 4 minutes how the platform works in practice.",
      valBadge: "In the media", valTitleA: "Valdemar, at 62, gave a ", valTitleBold: "newspaper interview", valTitleC: " about how the platform changed his life", valSub: "A real story that could be yours too.",
      pp1Sub: "Real screenshots sent by members in the group. Unedited.", pp2Sub: "Spontaneous messages from people who use the method every day.",
      poweredBy: "Powered by ChatGPT", openaiAI: "OpenAI Artificial Intelligence", youPay: "You pay", aiFee: "AI activation fee", weKeep: "We keep", zeroNote: "Zero. Nothing. Not a cent.", howWeEarn: "So how do we earn?", after30A: "Only after ", after30Bold: "30 days", after30Mid: ", once you're already profiting, we charge just ", after30Pct: "2% of your profits", after30C: ".", weWinA: "We only earn when ", weWinBold: "you earn", weWinC: ". Simple as that.",
      mentorQuote: (n: string) => `"${n ? `${n}, ` : ""}I know you've been fooled before. That's why I put my face on the line. If you have no result in 30 days, I personally refund your money. No games."`, mentorCredit: "— Ricardo Almeida • Creator of the method • 36,000+ members",
      hiwKicker: "That simple", hiwTitle: "How does it work in practice?", hiwSub: "3 steps. No hassle. No tech knowledge.",
      hiwSteps: [
        { title: "Access from your phone", desc: "You get access by email and WhatsApp. Open it on your phone — like opening any website. Nothing to install.", detail: "Works on any phone, even the simplest ones." },
        { title: "Activate the AI with 1 tap", desc: "ChatGPT's AI starts working for you automatically. It's like pressing a button and letting the machine do the work.", detail: "You don't need to understand how it works inside. Just activate it." },
        { title: "Track your earnings", desc: "Results show up on your dashboard. You check on your phone whenever you want. Withdraw whenever you want.", detail: "Most members see their first result the same day." },
      ],
      hiwSummaryA: "Summary: you access, activate and track. ", hiwSummaryBold: "The AI does the rest.", hiwTimeA: "Average setup time: ", hiwTimeBold: "under 10 minutes",
      vdTitleA: "The ", vdTitleBold1: "fairest", vdTitleMid: " way to work is ", vdTitleBold2: "by making you profit first.", vdSub: "Watch the testimonial of someone already living this:",
      miniGuarTitle: "30-day guarantee", miniGuarSub: "Didn't like it? We refund 100%. No questions.",
      carlosName: "Carlos Mendonça, 52", carlosResult: "$40/day", carlosText: '"I\'d lost money twice online. Here support walked me through every step. Today I make $40 a day just on my phone. My wife saw it and started too."',
      moneyObjA: "It costs ", moneyObjBold: "less than one lunch a week", moneyObjMid: ". And many members recover the cost ", moneyObjBold2: "on the first day", moneyObjC: ".",
      vsKicker: "FULL ACCESS", vsTitleA: "Everything you get when you activate the ", vsTitleBold: "Free Time Earnings Platform", vsTitleC: ":",
      vsItems: ["Lifetime access to the Free Time Earnings Platform", "Step-by-step method — from zero to results", "Video lessons in simple, direct language", "Real-time human support via WhatsApp", "Exclusive community with 36,000+ members", "A plan personalized to your profile"],
      vsTotalA: "Total platform value:",
      vtTitleA: "Video ", vtTitleBold: "testimonials", vtSub: "Watch people who've already changed their lives:",
      bonusKicker: "EXCLUSIVE BONUSES", bonusTitleA: "Get ", bonusTitleBold: "6 extra tools", bonusTitleMid: " when you activate your ", bonusTitleBold2: "Free Time Earnings Platform", bonusTitleC: " today", bonusSub: "All included. Nothing extra to pay.",
      anchorBonusLbl: "Total value of the 6 bonuses:", anchorTodayFree: "Today: FREE with your access",
      whyFreeTitle: "Why am I giving all this away for free?", whyFreeA: "Simple: I ", whyFreeBold1: "want you to earn", whyFreeMid: ". The more you profit in the first 30 days, the bigger my ", whyFreePct: "2%", whyFreeMid2: " share later. I only earn when ", whyFreeBold2: "you earn", whyFreeC: ". That's why I insist on giving you every tool possible.",
      objTitle: "Maybe you're still thinking...",
      obj2q: '"I\'ve lost money online before..."', obj2r: "That's exactly why the 30-day guarantee exists. You test it risk-free. If you don't like it, I refund every cent. Unlike a scam, here you have full protection.",
      obj3q: '"I don\'t have money to spare..."', obj3r: (c: string) => `It's ${c} once. Many members recover that amount on the first day. And if you don't in 30 days, you get it all back. Zero risk.`,
      obj4q: '"I\'m afraid of technology..."', obj4r: "Our support walks you through every click. Literally. Message us on WhatsApp and someone answers in minutes. You'll never be lost.",
      waConv: "Real conversations", waTitleA: "Look what they're sending ", waTitleBold: "right now", waSub: "Screenshots straight from the members' group. Unedited, unfiltered.",
      paTitleA: "All this for ", paTitleBold: "how much?", paSub: "Let's do the math together:",
      paRows: ["Full platform", "6 exclusive bonuses", "Real-time VIP support"], paTotalLbl: "Real total value",
      paAiA: "The platform uses ", paAiBold1: "advanced artificial intelligence", paAiMid: " to work for you. Each trade consumes ", paAiBold2: "AI processing", paAiC: " — and that processing has a real cost.",
      paFeeA: "The amount below is ", paFeeBold: "only the activation fee", paFeeMid: ". We ", paFeeBold2: "keep not a single cent", paFeeC: " of this payment.",
      paHowA: "How do we earn? ", paHowMid: "Only after 30 days, once you're profiting, we charge just ", paHowPct: "2% of your profits", paHowMid2: ". In other words: ", paHowBold: "we only earn when you earn.",
      paYouPay: "You pay only", paXof: "x of", paOr: "or", paPix: "one-time via PIX", paSnackA: "That's ", paSnackBold: "less than a weekend snack", paSnackC: " — for something that can bring financial peace to you and your family.",
      payMethods: ["PIX (discount)", "Credit Card", "Bank slip"],
      guarTitle: "Ironclad 30-Day Guarantee", guarSub: "ZERO RISK FOR YOU",
      guarBodyA: (n: string) => (n ? `${n}, here's` : "Here's"), guarBodyC: " how it works: you join, test the platform for a full 30 days. If for ", guarBodyStrong1: "any reason", guarBodyMid: ' — even "I didn\'t like the button color" — you decide it\'s not for you, just send ', guarBodyStrong2: "a single message", guarBodyMid2: " and we refund ", guarBodyStrong3: "100% of your money", guarBodyEnd: ". No questions. No red tape. No fine print.",
      guarSeal: "Either you profit, or you get your money back. Simple as that.",
      fpTitle: (n: string) => (n ? `${n}, close your eyes and imagine...` : "Close your eyes and imagine..."),
      fpItems: ["Waking up and seeing you've already earned money — before your morning coffee", "Paying every bill on time, without that knot in your chest", "Giving your family something good without thinking twice", "Looking at your bank statement and feeling proud of what you built", "Not depending on anyone. Anyone. Ever again."],
      fpFooterA: "All of this can start ", fpFooterBold: "today", fpFooterMid: ". For less than ", fpFooterC: " a day.",
      faqKicker: "Clear your doubts", faqTitle: "Everything you need to know", faqSub: "If your question isn't here, our support answers in minutes.", faqStillA: "Still have a doubt? ", faqStillBold: "Support is online right now.",
      lastChance: "Last chance", closeA: (n: string) => (n ? `${n}, this` : "This"), closeMid: " 12x offer of ", closeC: " is exclusive to whoever completed the analysis just now.", closeSub: (old: string) => `Leave this page and the price goes back to ${old} and the bonuses are removed.`,
      trustSafe: "Secure checkout", trustGuar: "30-day guarantee", trustSupport: "Real support",
      finalMentorQuote: '"If in 30 days you have no result, I personally refund your money. No questions, no form. My word."', finalMentorCredit: "— Ricardo Almeida, creator of the method",
      statActive: "active members", statSat: "satisfaction", statResp: "support reply",
      stickyCta: (tm: string) => `ACTIVATE MY KEY NOW — ${tm}`, stickySafe: "Secure checkout", stickyGuar: "30-day guarantee",
      ctxGuar30: "Unconditional 30-day guarantee", ctxGuarFull: "30-day guarantee · Instant access · Human support",
      pp1Title: <>Members profiting <span className="text-gradient-green">every day</span></>, pp2Title: <>See what they say about the <span className="text-gradient-green">platform</span></>,
    },
    es: {
      barExpires: "La oferta expira en", barAfter: `Después: ${S13_CUR[lang].sym}${p13.old}`,
      heroA: (n: string) => (n ? `${n}, tu` : "Tu"), heroBold: "lista", heroSubA: "Falta ", heroSubBold: "1 paso", heroSubC: " para generar ingreso extra todos los días.",
      vslBadge: "Míralo antes de decidir", vslTitleA: "Descubre cómo ", vslTitleBold: "personas comunes", vslTitleMid: " están generando ingreso extra ", vslTitleBold2: "todos los días", vslSub: "Mira en 4 minutos cómo funciona la plataforma en la práctica.",
      valBadge: "En los medios", valTitleA: "Don Valdemar, a los 62 años, dio una ", valTitleBold: "entrevista al diario", valTitleC: " contando cómo la plataforma cambió su vida", valSub: "Una historia real que también puede ser la tuya.",
      pp1Sub: "Capturas reales enviadas por los miembros en el grupo. Sin editar.", pp2Sub: "Mensajes espontáneos de quienes ya usan el método a diario.",
      poweredBy: "Powered by ChatGPT", openaiAI: "Inteligencia Artificial OpenAI", youPay: "Tú pagas", aiFee: "Tarifa de activación de la IA", weKeep: "Nosotros nos quedamos con", zeroNote: "Cero. Nada. Ni un centavo.", howWeEarn: "¿Entonces cómo ganamos?", after30A: "Solo después de ", after30Bold: "30 días", after30Mid: ", cuando ya estés ganando, cobramos apenas ", after30Pct: "2% de tus ganancias", after30C: ".", weWinA: "Solo ganamos cuando ", weWinBold: "tú ganas", weWinC: ". Así de simple.",
      mentorQuote: (n: string) => `"${n ? `${n}, ` : ""}Sé que ya te han engañado antes. Por eso doy la cara. Si no tienes resultado en 30 días, te devuelvo tu dinero personalmente. Sin juegos."`, mentorCredit: "— Ricardo Almeida • Creador del método • +36.000 miembros",
      hiwKicker: "Así de simple", hiwTitle: "¿Cómo funciona en la práctica?", hiwSub: "3 pasos. Sin complicación. Sin conocimiento técnico.",
      hiwSteps: [
        { title: "Accede desde el celular", desc: "Recibes el acceso por correo y WhatsApp. Lo abres en el celular — como abrir cualquier sitio. No hay que instalar nada.", detail: "Funciona en cualquier celular, incluso los más simples." },
        { title: "Activa la IA con 1 clic", desc: "La inteligencia artificial de ChatGPT empieza a trabajar por ti automáticamente. Es como apretar un botón y dejar que la máquina haga el trabajo.", detail: "No necesitas entender cómo funciona por dentro. Solo activarla." },
        { title: "Acompaña tus ganancias", desc: "Los resultados aparecen en tu panel. Los ves en el celular cuando quieras. Puedes retirar cuando quieras.", detail: "La mayoría de los miembros ve su primer resultado el mismo día." },
      ],
      hiwSummaryA: "Resumen: accedes, activas y acompañas. ", hiwSummaryBold: "La IA hace el resto.", hiwTimeA: "Tiempo medio de configuración: ", hiwTimeBold: "menos de 10 minutos",
      vdTitleA: "La forma más ", vdTitleBold1: "justa", vdTitleMid: " de trabajar es ", vdTitleBold2: "haciéndote ganar primero.", vdSub: "Mira el testimonio de quien ya vive esto en la práctica:",
      miniGuarTitle: "Garantía de 30 días", miniGuarSub: "¿No te gustó? Devolvemos el 100%. Sin preguntas.",
      carlosName: "Carlos Mendonça, 52 años", carlosResult: "$40/día", carlosText: '"Ya perdí dinero 2 veces en internet. Aquí el soporte me acompañó en cada paso. Hoy hago $40 por día solo en el celular. Mi esposa lo vio y también empezó."',
      moneyObjA: "Cuesta ", moneyObjBold: "menos que un almuerzo por semana", moneyObjMid: ". Y muchos miembros recuperan el valor ", moneyObjBold2: "el primer día", moneyObjC: ".",
      vsKicker: "ACCESO COMPLETO", vsTitleA: "Todo lo que recibes al activar la ", vsTitleBold: "Plataforma de Ganancias con Tiempo Libre", vsTitleC: ":",
      vsItems: ["Acceso vitalicio a la Plataforma de Ganancias con Tiempo Libre", "Método paso a paso — de cero al resultado", "Video-clases en lenguaje simple y directo", "Soporte humano en tiempo real por WhatsApp", "Comunidad exclusiva con +36.000 miembros", "Un plan personalizado para tu perfil"],
      vsTotalA: "Valor total de la plataforma:",
      vtTitleA: "Testimonios en ", vtTitleBold: "video", vtSub: "Mira a quienes ya cambiaron de vida:",
      bonusKicker: "BONOS EXCLUSIVOS", bonusTitleA: "Recibe ", bonusTitleBold: "6 herramientas extra", bonusTitleMid: " al activar tu ", bonusTitleBold2: "Plataforma de Ganancias con Tiempo Libre", bonusTitleC: " hoy", bonusSub: "Todo incluido. Sin pagar nada más.",
      anchorBonusLbl: "Valor total de los 6 bonos:", anchorTodayFree: "Hoy: GRATIS con tu acceso",
      whyFreeTitle: "¿Por qué estoy dando todo esto gratis?", whyFreeA: "Simple: yo ", whyFreeBold1: "quiero que ganes", whyFreeMid: ". Cuanto más ganas en los primeros 30 días, mayor es mi parte del ", whyFreePct: "2%", whyFreeMid2: " después. Yo solo gano cuando ", whyFreeBold2: "tú ganas", whyFreeC: ". Por eso me empeño en darte todas las herramientas posibles.",
      objTitle: "Quizás todavía estés pensando...",
      obj2q: '"Ya perdí dinero en internet antes..."', obj2r: "Exactamente por eso existe la garantía de 30 días. Pruebas sin riesgo. Si no te gusta, te devuelvo cada centavo. A diferencia de una estafa, aquí tienes protección total.",
      obj3q: '"No tengo dinero de sobra..."', obj3r: (c: string) => `Son ${c} una sola vez. Muchos miembros recuperan ese valor el primer día. Y si no lo recuperas en 30 días, recibes todo de vuelta. Riesgo cero.`,
      obj4q: '"Le tengo miedo a la tecnología..."', obj4r: "Nuestro soporte te acompaña en cada clic. Literalmente. Escribes por WhatsApp y alguien responde en minutos. Nunca vas a quedar perdido.",
      waConv: "Conversaciones reales", waTitleA: "Mira lo que están mandando ", waTitleBold: "ahora mismo", waSub: "Capturas directas del grupo de miembros. Sin editar, sin filtro.",
      paTitleA: "¿Todo esto por ", paTitleBold: "cuánto?", paSub: "Hagamos las cuentas juntos:",
      paRows: ["Plataforma completa", "6 bonos exclusivos", "Soporte VIP en tiempo real"], paTotalLbl: "Valor total real",
      paAiA: "La plataforma usa ", paAiBold1: "inteligencia artificial avanzada", paAiMid: " para trabajar por ti. Cada operación consume ", paAiBold2: "procesamiento de IA", paAiC: " — y ese procesamiento tiene un costo real.",
      paFeeA: "El valor de abajo es ", paFeeBold: "solo la tarifa de activación", paFeeMid: ". Nosotros ", paFeeBold2: "no nos quedamos con ni un centavo", paFeeC: " de este pago.",
      paHowA: "¿Cómo ganamos? ", paHowMid: "Solo después de 30 días, cuando ya estés ganando, cobramos apenas ", paHowPct: "2% de tus ganancias", paHowMid2: ". Es decir: ", paHowBold: "solo ganamos cuando tú ganas.",
      paYouPay: "Pagas solo", paXof: "x de", paOr: "o", paPix: "en un pago vía PIX", paSnackA: "Eso es ", paSnackBold: "menos que un antojo de fin de semana", paSnackC: " — por algo que puede traer tranquilidad financiera para ti y tu familia.",
      payMethods: ["PIX (descuento)", "Tarjeta de Crédito", "Boleto"],
      guarTitle: "Garantía Blindada de 30 Días", guarSub: "RIESGO CERO PARA TI",
      guarBodyA: (n: string) => (n ? `${n}, funciona` : "Funciona"), guarBodyC: " así: entras, pruebas la plataforma por 30 días enteros. Si por ", guarBodyStrong1: "cualquier motivo", guarBodyMid: ' — aunque sea "no me gustó el color del botón" — decides que no es para ti, solo mandas ', guarBodyStrong2: "un único mensaje", guarBodyMid2: " y devolvemos ", guarBodyStrong3: "el 100% de tu dinero", guarBodyEnd: ". Sin preguntas. Sin burocracia. Sin letra chica.",
      guarSeal: "O ganas, o recibes tu dinero de vuelta. Así de simple.",
      fpTitle: (n: string) => (n ? `${n}, cierra los ojos e imagina...` : "Cierra los ojos e imagina..."),
      fpItems: ["Despertar y ver que ya ganaste dinero — antes del café", "Pagar todas las cuentas a tiempo, sin ese nudo en el pecho", "Darle algo bueno a tu familia sin pensarlo dos veces", "Mirar tu estado de cuenta y sentir orgullo de lo que construiste", "No depender de nadie. Nadie. Nunca más."],
      fpFooterA: "Todo esto puede empezar ", fpFooterBold: "hoy", fpFooterMid: ". Por menos de ", fpFooterC: " al día.",
      faqKicker: "Resuelve tus dudas", faqTitle: "Todo lo que necesitas saber", faqSub: "Si tu duda no está aquí, nuestro soporte responde en minutos.", faqStillA: "¿Aún con dudas? ", faqStillBold: "El soporte está en línea ahora.",
      lastChance: "Última oportunidad", closeA: (n: string) => (n ? `${n}, esta` : "Esta"), closeMid: " condición de 12x de ", closeC: " es exclusiva para quien completó el análisis ahora.", closeSub: (old: string) => `Al salir de esta página, el valor vuelve a ${old} y los bonos se eliminan.`,
      trustSafe: "Compra segura", trustGuar: "Garantía 30 días", trustSupport: "Soporte real",
      finalMentorQuote: '"Si en 30 días no tienes ningún resultado, yo personalmente te devuelvo tu dinero. Sin preguntas, sin formulario. Mi palabra."', finalMentorCredit: "— Ricardo Almeida, creador del método",
      statActive: "miembros activos", statSat: "satisfacción", statResp: "respuesta soporte",
      stickyCta: (tm: string) => `ACTIVAR MI LLAVE AHORA — ${tm}`, stickySafe: "Compra segura", stickyGuar: "Garantía de 30 días",
      ctxGuar30: "Garantía incondicional de 30 días", ctxGuarFull: "Garantía de 30 días · Acceso inmediato · Soporte humano",
      pp1Title: <>Miembros ganando <span className="text-gradient-green">todos los días</span></>, pp2Title: <>Mira lo que dicen de la <span className="text-gradient-green">plataforma</span></>,
    },
  };
  const mt = MT_ALL[lang] || MT_ALL.pt;

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
            <span className="text-xs font-bold text-destructive uppercase tracking-wider">{mt.barExpires}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-destructive" />
            <span className="text-base font-display font-bold text-foreground tabular-nums">
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground">{mt.barAfter}</span>
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
              {mt.heroA(firstName)} {lang === "pt" ? "chave está" : lang === "en" ? "key is" : "llave está"} <span className="text-gradient-green">{lang === "pt" ? "pronta" : lang === "en" ? "ready" : "lista"}</span>.
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {mt.heroSubA}<span className="text-primary font-bold">{mt.heroSubBold}</span>{mt.heroSubC}
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
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider">{mt.vslBadge}</span>
            </div>
            <h3 className="font-display text-xl font-bold text-foreground leading-snug">
              {mt.vslTitleA}<span className="text-gradient-green">{mt.vslTitleBold}</span>{mt.vslTitleMid}{" "}
              <span className="text-primary font-black">{mt.vslTitleBold2}</span>
            </h3>
            <p className="text-sm text-muted-foreground">{mt.vslSub}</p>
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
              <span className="text-[10px] font-bold text-accent uppercase tracking-wider">{mt.valBadge}</span>
            </div>
            <h3 className="font-display text-lg font-bold text-foreground leading-snug">
              {mt.valTitleA}<span className="text-accent font-black">{mt.valTitleBold}</span>{mt.valTitleC}
            </h3>
            <p className="text-sm text-muted-foreground">{mt.valSub}</p>
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
          title={mt.pp1Title}
          subtitle={mt.pp1Sub}
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
            <p className="text-sm font-bold text-foreground">{mt.poweredBy}</p>
            <p className="text-[11px] text-muted-foreground">{mt.openaiAI}</p>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Price breakdown visual */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl p-3 text-center border border-primary/15 bg-primary/5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{mt.youPay}</p>
              <p className="text-xl font-display font-bold text-foreground">
                {S13_CUR[lang].sym}<span className="text-primary">{p13.cash}</span>
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{mt.aiFee}</p>
            </div>
            <div className="rounded-xl p-3 text-center border border-accent/15 bg-accent/5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{mt.weKeep}</p>
              <p className="text-xl font-display font-bold text-foreground">{S13_CUR[lang].sym}0</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{mt.zeroNote}</p>
            </div>
          </div>

          {/* Profit share explanation */}
          <div className="rounded-xl p-3 border border-border bg-card space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                <Zap className="w-3.5 h-3.5 text-primary" />
              </div>
              <p className="text-sm font-bold text-foreground">{mt.howWeEarn}</p>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {mt.after30A}<span className="font-bold text-foreground">{mt.after30Bold}</span>{mt.after30Mid}<span className="text-primary font-bold">{mt.after30Pct}</span>{mt.after30C}
            </p>
            <div className="flex items-center gap-2 bg-primary/8 rounded-lg px-3 py-2 border border-primary/15">
              <CheckCircle className="w-4 h-4 text-primary shrink-0" />
              <p className="text-xs font-medium text-foreground">
                {mt.weWinA}<span className="text-primary font-bold">{mt.weWinBold}</span>{mt.weWinC}
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
              {mt.mentorQuote(firstName)}
            </p>
            <p className="text-muted-foreground text-xs mt-2 not-italic font-semibold">{mt.mentorCredit}</p>
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
              {mt.hiwKicker}
            </p>
            <h3 className="font-display text-xl font-bold text-foreground">
              {mt.hiwTitle}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {mt.hiwSub}
            </p>
          </div>

          {(() => {
            const icons = [Smartphone, Bot, TrendingUp];
            const steps = mt.hiwSteps.map((s: any, i: number) => ({ step: String(i + 1), icon: icons[i], title: s.title, desc: s.desc, detail: s.detail }));
            return steps.map((item: any, i: number) => (
              <StepCard key={i} item={item} index={i} isLast={i === steps.length - 1} />
            ));
          })()}

          <div className="funnel-card border-primary/20 bg-primary/5 text-center space-y-2">
            <p className="text-sm text-foreground font-medium leading-relaxed">
              {mt.hiwSummaryA}<span className="text-primary font-bold">{mt.hiwSummaryBold}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              {mt.hiwTimeA}<span className="font-bold text-foreground">{mt.hiwTimeBold}</span>
            </p>
          </div>
        </div>
      </SectionTracker>

      {/* ═══ VIDEO DEPOIMENTO (primeiro vídeo, antes do CTA) ═══ */}
      <ScrollReveal>
        <div className="w-full space-y-3">
          <h3 className="font-display text-xl font-bold text-foreground text-center leading-snug">
            {mt.vdTitleA}<span className="text-gradient-green">{mt.vdTitleBold1}</span>{mt.vdTitleMid}{" "}
            <span className="text-primary font-black">{mt.vdTitleBold2}</span>
          </h3>
          <p className="text-sm text-muted-foreground text-center leading-relaxed">
            {mt.vdSub}
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
              <p className="text-sm font-bold text-foreground">{mt.miniGuarTitle}</p>
              <p className="text-xs text-muted-foreground">{mt.miniGuarSub}</p>
            </div>
          </div>

          {/* Depoimento forte com resultado numérico */}
          <div className="funnel-card border-primary/20 space-y-2">
            <div className="flex items-center gap-3">
              <img src={avatarCarlos} alt="Carlos" className="w-11 h-11 rounded-full object-cover border-2 border-primary/30" />
              <div className="flex-1">
                <p className="font-bold text-sm text-foreground">{mt.carlosName}</p>
                <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{mt.carlosResult}</span>
              </div>
            </div>
            <p className="text-sm text-foreground/85 italic leading-relaxed">
              {mt.carlosText}
            </p>
          </div>

          {/* Copy segmentada para objeção "dinheiro" */}
          {answers?.obstacle === "dinheiro" && (
            <div className="rounded-xl p-3 border border-accent/20 bg-accent/5 text-center">
              <p className="text-sm text-foreground leading-relaxed">
                <CircleDollarSign className="w-4 h-4 text-accent inline mr-1" />
                {mt.moneyObjA}<span className="text-accent font-bold">{mt.moneyObjBold}</span>{mt.moneyObjMid}<span className="font-bold">{mt.moneyObjBold2}</span>{mt.moneyObjC}
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
          title={mt.pp2Title}
          subtitle={mt.pp2Sub}
          images={[depo5, depo6, depo7, depo8, depo9]}
        />
      </ScrollReveal>

      <Divider />

      {/* ═══ 10. VALUE STACK — What you get ═══ */}
      <ScrollReveal>
      <div className="w-full space-y-4">
        <div className="text-center space-y-2">
          <p className="text-xs uppercase tracking-wider text-accent font-bold">{mt.vsKicker}</p>
          <h3 className="font-display text-xl font-bold text-foreground">
            {mt.vsTitleA}<span className="text-gradient-green">{mt.vsTitleBold}</span>{mt.vsTitleC}
          </h3>
        </div>
        {mt.vsItems.map((text: string, i: number) => ({ text, value: (lang === "pt" ? ["R$497","R$297","R$197","R$197","R$147","R$297"] : ["$99","$59","$39","$39","$29","$59"])[i] })).map((item: any, i: number) => (
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
          <p className="text-sm text-muted-foreground">{mt.vsTotalA}</p>
          <p className="text-lg text-muted-foreground line-through">{lang === "pt" ? "R$1.632,00" : "$324"}</p>
        </div>
      </div>
      </ScrollReveal>

      <Divider />

      {/* ═══ VIDEO TESTIMONIALS (após acesso completo) ═══ */}
      <ScrollReveal>
      <div className="w-full space-y-4 -mx-2 px-2 sm:mx-0 sm:px-0">
        <h3 className="font-display text-xl sm:text-2xl font-bold text-foreground text-center">
          {mt.vtTitleA}<span className="text-gradient-green">{mt.vtTitleBold}</span>
        </h3>
        <p className="text-sm sm:text-base text-muted-foreground text-center">
          {mt.vtSub}
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
            <span className="text-xs uppercase tracking-wider text-accent font-bold">{mt.bonusKicker}</span>
          </div>
          <h3 className="font-display text-xl font-bold text-foreground leading-snug">
            {mt.bonusTitleA}<span className="text-accent">{mt.bonusTitleBold}</span>{mt.bonusTitleMid}
            <span className="text-gradient-green"> {mt.bonusTitleBold2}</span>{mt.bonusTitleC}
          </h3>
          <p className="text-sm text-muted-foreground">{mt.bonusSub}</p>
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
          <p className="text-sm text-muted-foreground">{mt.anchorBonusLbl}</p>
          <p className="text-2xl text-muted-foreground line-through font-semibold">{lang === "pt" ? "R$2.832,00" : "$564"}</p>
          <div className="flex items-center justify-center gap-2">
            <Gift className="w-5 h-5 text-accent" />
            <p className="text-lg font-bold text-accent">{mt.anchorTodayFree}</p>
          </div>
        </motion.div>

        {/* Why free — alignment of interests */}
        <div className="rounded-2xl p-5 border border-primary/15 bg-primary/5 space-y-3">
          <div className="flex items-center justify-center gap-2">
            <Heart className="w-5 h-5 text-primary" />
            <p className="text-base font-bold text-foreground">{mt.whyFreeTitle}</p>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed text-center">
            {mt.whyFreeA}<span className="font-bold text-foreground">{mt.whyFreeBold1}</span>{mt.whyFreeMid}<span className="text-primary font-bold">{mt.whyFreePct}</span>{mt.whyFreeMid2}<span className="text-primary font-bold">{mt.whyFreeBold2}</span>{mt.whyFreeC}
          </p>
        </div>
      </div>
      </ScrollReveal>

      {/* ═══ OBJECTION BREAKING (moved before pricing) ═══ */}
      <ScrollReveal>
      <div className="w-full space-y-4">
        <h3 className="font-display text-xl font-bold text-foreground text-center">
          {mt.objTitle}
        </h3>

        {(() => {
          const AGEOBJ: any = {
            pt: { young: { q: '"Sou muito novo pra isso..."', r: "Muitos dos nossos alunos mais jovens estão construindo sua independência financeira desde cedo. A vantagem é ter mais tempo e energia. Se você usa o celular, já tem tudo que precisa." },
              mid: { q: '"Será que funciona pra quem tem menos de 35?"', r: "Temos milhares de alunos na faixa dos 26 a 35 anos. O método é simples e direto — ideal pra quem quer uma renda extra sem complicação." },
              older: (lbl: string) => ({ q: answers?.age === "56+" ? '"Já tenho mais de 55 anos... será que funciona pra mim?"' : '"Já tenho mais de 40, 50 anos... será que funciona pra mim?"', r: `A maioria dos nossos alunos tem perfil ${lbl}. O método foi desenhado pra quem não tem experiência com tecnologia. Se você usa WhatsApp, você já tem tudo que precisa.` }),
              lbl: answers?.age === "56+" ? "com mais de 50 anos" : "com mais de 40 anos" },
            en: { young: { q: '"I\'m too young for this..."', r: "Many of our younger members are building their financial independence early. The advantage is more time and energy. If you use a phone, you already have everything you need." },
              mid: { q: '"Does it work for people under 35?"', r: "We have thousands of members aged 26 to 35. The method is simple and direct — perfect for anyone who wants extra income without hassle." },
              older: (lbl: string) => ({ q: answers?.age === "56+" ? '"I\'m over 55... will it work for me?"' : '"I\'m over 40, 50... will it work for me?"', r: `Most of our members are ${lbl}. The method was designed for people with no tech experience. If you use WhatsApp, you already have everything you need.` }),
              lbl: answers?.age === "56+" ? "over 50" : "over 40" },
            es: { young: { q: '"Soy muy joven para esto..."', r: "Muchos de nuestros miembros más jóvenes construyen su independencia financiera desde temprano. La ventaja es más tiempo y energía. Si usas el celular, ya tienes todo lo que necesitas." },
              mid: { q: '"¿Funciona para menores de 35?"', r: "Tenemos miles de miembros entre 26 y 35 años. El método es simple y directo — ideal para quien quiere un ingreso extra sin complicación." },
              older: (lbl: string) => ({ q: answers?.age === "56+" ? '"Ya tengo más de 55 años... ¿funciona para mí?"' : '"Ya tengo más de 40, 50 años... ¿funciona para mí?"', r: `La mayoría de nuestros miembros tienen ${lbl}. El método fue diseñado para quien no tiene experiencia con tecnología. Si usas WhatsApp, ya tienes todo lo que necesitas.` }),
              lbl: answers?.age === "56+" ? "más de 50 años" : "más de 40 años" },
          }[lang];
          const ao = answers?.age === "18-25" ? AGEOBJ.young : answers?.age === "26-35" ? AGEOBJ.mid : AGEOBJ.older(AGEOBJ.lbl);
          return [
            { objection: ao.q, response: ao.r },
            { objection: mt.obj2q, response: mt.obj2r },
            { objection: mt.obj3q, response: mt.obj3r(cashDisp) },
            { objection: mt.obj4q, response: mt.obj4r },
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
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider">{mt.waConv}</span>
          </div>
          <h3 className="font-display text-xl font-bold text-foreground">
            {mt.waTitleA}<span className="text-gradient-green">{mt.waTitleBold}</span>
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {mt.waSub}
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
            {mt.paTitleA}<span className="text-gradient-green">{mt.paTitleBold}</span>
          </h3>
          <p className="text-sm text-muted-foreground">
            {mt.paSub}
          </p>
        </div>

        {/* Price comparison */}
        <div className="funnel-card border-border space-y-3">
          {mt.paRows.map((label: string, i: number) => (
            <div key={i} className="flex justify-between items-center py-1.5 border-b border-border/50">
              <span className="text-sm text-muted-foreground">{label}</span>
              <span className="text-sm text-muted-foreground line-through">{(lang === "pt" ? ["R$1.632","R$2.832","R$397"] : ["$324","$564","$79"])[i]}</span>
            </div>
          ))}
          <div className="flex justify-between items-center py-1.5">
            <span className="text-sm font-bold text-foreground">{mt.paTotalLbl}</span>
            <span className="text-sm font-bold text-muted-foreground line-through">{lang === "pt" ? "R$4.861" : "$967"}</span>
          </div>
        </div>

        {/* AI cost explanation */}
        <div className="funnel-card border-primary/25 bg-card text-center space-y-4">
          <img src={chatgptLogo} alt="ChatGPT" className="w-10 h-10 object-contain mx-auto rounded-xl" />
          <p className="text-sm text-muted-foreground leading-relaxed text-left">
            {mt.paAiA}<span className="font-bold text-foreground">{mt.paAiBold1}</span>{mt.paAiMid}<span className="font-bold text-foreground">{mt.paAiBold2}</span>{mt.paAiC}
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed text-left">
            {mt.paFeeA}<span className="font-bold text-foreground">{mt.paFeeBold}</span>{mt.paFeeMid}<span className="text-primary font-bold">{mt.paFeeBold2}</span>{mt.paFeeC}
          </p>
          <div className="bg-primary/10 rounded-xl p-3 border border-primary/20 text-left">
            <p className="text-sm text-foreground leading-relaxed">
              <span className="font-bold">{mt.paHowA}</span>{mt.paHowMid}<span className="text-primary font-bold">{mt.paHowPct}</span>{mt.paHowMid2}<span className="font-bold">{mt.paHowBold}</span>
            </p>
          </div>

          <Separator />

          {/* Price hero inside card */}
          <div className="pt-2 pb-1 space-y-5">
            <p className="text-[10px] uppercase tracking-[0.2em] text-primary font-bold">{mt.paYouPay}</p>

            <div className="space-y-1">
              <p className="text-sm sm:text-base text-muted-foreground font-medium">{pricing.installments}{mt.paXof}</p>
              <p className="text-[3.2rem] sm:text-[4rem] font-display font-black text-foreground leading-none tracking-tight">
                {S13_CUR[lang].sym}<span className="text-gradient-green">{p13.inst}</span>
              </p>
            </div>

            <div className="flex items-center gap-3 justify-center">
              <div className="flex-1 max-w-[60px] h-px bg-border" />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{mt.paOr}</span>
              <div className="flex-1 max-w-[60px] h-px bg-border" />
            </div>

            <p className="text-base sm:text-lg text-foreground font-semibold">
              {S13_CUR[lang].sym}{p13.cash} <span className="text-muted-foreground font-normal text-sm">{mt.paPix}</span>
            </p>

            <div className="rounded-xl p-3 border border-accent/15 bg-accent/5">
              <p className="text-sm text-foreground leading-relaxed text-center">
                {mt.paSnackA}<span className="text-primary font-bold">{mt.paSnackBold}</span>{mt.paSnackC}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-2 pt-1">
            {mt.payMethods.map((m: string) => (
              <span key={m} className="text-xs bg-secondary px-3 py-1.5 rounded-full text-muted-foreground font-medium">{m}</span>
            ))}
          </div>
        </div>
      </div>
      </ScrollReveal>

      {/* ═══ CTA (after pricing) ═══ */}
      <CTABlock showCTA={showCTA} context={mt.ctxGuar30} pricing={pricing} />

      <Divider />

      {/* ═══ GUARANTEE (risk reversal) ═══ */}
      <ScrollReveal>
      <div className="w-full funnel-card border-accent/30 bg-accent/5 space-y-4">
        <div className="flex items-start gap-4">
          <img src={guaranteeSeal} alt="Garantia" className="w-20 h-20 shrink-0 object-contain" />
          <div>
            <h3 className="font-display text-lg font-bold text-foreground">{mt.guarTitle}</h3>
            <p className="text-xs text-accent font-bold uppercase tracking-wider mt-1">{mt.guarSub}</p>
          </div>
        </div>
        <p className="text-sm text-foreground/85 leading-relaxed">
          {mt.guarBodyA(firstName)}{mt.guarBodyC}<strong>{mt.guarBodyStrong1}</strong>{mt.guarBodyMid}<strong>{mt.guarBodyStrong2}</strong>{mt.guarBodyMid2}<strong>{mt.guarBodyStrong3}</strong>{mt.guarBodyEnd}
        </p>
        <div className="bg-card rounded-xl p-3 border border-border">
          <p className="text-sm text-primary font-bold text-center flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4" /> {mt.guarSeal}
          </p>
        </div>
      </div>
      </ScrollReveal>

      <Divider />

      {/* ═══ EMOTIONAL FUTURE PACING ═══ */}
      <ScrollReveal>
      <div className="w-full funnel-card border-primary/20 bg-primary/5 space-y-4">
        <h3 className="font-display text-xl font-bold text-foreground text-center leading-snug">
          {mt.fpTitle(firstName)}
        </h3>
        <div className="space-y-3">
          {[Sun, CreditCard, Heart, Eye, Unlock].map((Icon, i) => ({ icon: Icon, text: mt.fpItems[i] })).map((item: any, i: number) => (
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
          {mt.fpFooterA}<span className="text-primary font-bold not-italic">{mt.fpFooterBold}</span>{mt.fpFooterMid}{S13_CUR[lang].sym}{p13.perDay}{mt.fpFooterC}
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
            {mt.faqKicker}
          </p>
          <h3 className="font-display text-xl font-bold text-foreground">
            {mt.faqTitle}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {mt.faqSub}
          </p>
        </div>
        {faqs.map((faq: any, i: number) => (
          <FAQItem key={i} {...faq} />
        ))}
        <div className="text-center pt-2">
          <p className="text-xs text-muted-foreground">
            {mt.faqStillA}<span className="text-primary font-semibold">{mt.faqStillBold}</span>
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
            <p className="text-sm font-bold text-destructive uppercase tracking-wider">{mt.lastChance}</p>
          </div>
          <p className="text-base font-bold text-foreground leading-snug">
            {mt.closeA(firstName)}{mt.closeMid}{S13_CUR[lang].sym}{p13.inst}{mt.closeC}
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {mt.closeSub(`${S13_CUR[lang].sym}${p13.old}`)}
          </p>
          <p className="text-3xl font-display font-bold text-foreground">
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </p>
        </div>

        <CTABlock showCTA={showCTA} context={mt.ctxGuarFull} pricing={pricing} />

        <div className="w-full space-y-4 pt-2">
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs text-muted-foreground font-medium">{mt.trustSafe}</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs text-muted-foreground font-medium">{mt.trustGuar}</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs text-muted-foreground font-medium">{mt.trustSupport}</span>
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
                {mt.finalMentorQuote}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1 font-semibold">{mt.finalMentorCredit}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="text-center rounded-lg bg-secondary/30 py-2.5 px-2">
              <p className="text-base font-bold text-foreground">36.847</p>
              <p className="text-[10px] text-muted-foreground">{mt.statActive}</p>
            </div>
            <div className="text-center rounded-lg bg-secondary/30 py-2.5 px-2">
              <p className="text-base font-bold text-foreground">4.8<span className="text-xs text-muted-foreground">/5</span></p>
              <p className="text-[10px] text-muted-foreground">{mt.statSat}</p>
            </div>
            <div className="text-center rounded-lg bg-secondary/30 py-2.5 px-2">
              <p className="text-base font-bold text-foreground">2 min</p>
              <p className="text-[10px] text-muted-foreground">{mt.statResp}</p>
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
              trackMetaInitiateCheckout({ amount: pricing.price });
              saveFunnelEvent("checkout_click", { context: "sticky_footer", product: "chave_token_chatgpt", amount: pricing.price });
              const utmQs = buildTrackingQueryString();
              const separator = pricing.checkoutUrl.includes("?") ? "&" : "?";
              const fullUrl = utmQs ? `${pricing.checkoutUrl}${separator}${utmQs.slice(1)}` : pricing.checkoutUrl;
              window.open(fullUrl, "_blank");
            }} variant="accent" className="text-base sm:text-lg tracking-wider w-full funnel-glow-button">
              {mt.stickyCta(`${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`)}
            </CTAButton>
            <div className="flex items-center justify-center gap-3 mt-1.5">
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Lock className="w-3 h-3" /> {mt.stickySafe}
              </p>
              <span className="text-[10px] text-muted-foreground">•</span>
              <p className="text-[10px] text-muted-foreground">
                {mt.stickyGuar}
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
