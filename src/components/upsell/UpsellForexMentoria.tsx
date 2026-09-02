import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Check, TrendingUp, AlertTriangle, Video, Shield, Zap, Users, XCircle,
  PackageCheck, Sparkles, Gift, BookOpen, BarChart2, MessageSquare,
  GraduationCap, Clock, BadgeCheck,
} from "lucide-react";
import { saveUpsellExtras } from "@/lib/upsellData";
import { saveFunnelEvent } from "@/lib/metricsClient";
import { logAuditEvent } from "@/hooks/useAuditLog";
import { buildTrackingQueryString } from "@/lib/trackingDataLayer";
import { useLanguage } from "@/lib/i18n";

interface Props { name: string; onNext: () => void; onDecline: () => void; }

const CHECKOUT_URL = "https://pay.hub.la/3b8YUKn1IBaJv98xgyTv/upsell";
const PRICE = 297; // valor REAL cobrado (BRL) — não muda
const TIMER_SECONDS = 15 * 60;

const OWNED_ICONS = [Shield, TrendingUp, Shield, Users, Shield];
const NEW_ICONS = [Video, TrendingUp, Check, Zap];
const BONUS_ICONS = [BookOpen, BarChart2, MessageSquare, GraduationCap];
const TEAM_ICONS = [TrendingUp, Shield, Zap, Check];

const TEXTS = {
  pt: {
    timerTitle: "Esta oferta expira em", timerExpired: "Oferta encerrada", minutes: "minutos",
    expiredMsg: "Você ainda está na página — essa é sua última chance.",
    urgencyA: "Essa oferta some quando você fechar esta página. ", urgencyBold: "Não aparece de novo.",
    kicker: "Oferta exclusiva — apenas hoje",
    h1a: "E se você recuperasse seu investimento ", h1hoje: "HOJE?",
    leadA: (n: string) => `${n ? `${n}, você` : "Você"} chegou até aqui. Isso já diz muito. Agora vou te mostrar a forma mais rápida e segura de recuperar tudo o que investiu — usando o `,
    leadBold: "FOREX, o maior mercado financeiro do mundo.",
    liveTitle: "Trader Profissional ao Vivo", liveSub: "3 sessões por dia • operações guiadas • FOREX", liveNow: "AO VIVO",
    liveBodyA: "Você não vai fazer isso sozinho. Um trader profissional opera ", liveBodyBold: "ao vivo com você", liveBodyB: ", 3 vezes ao dia, mostrando exatamente o que fazer, quando fazer e quanto esperar de retorno. Sem achismo. Sem sorte.",
    teamTitle: "Ricardo + Escritório com 30+ Especialistas", teamSub: "Analistas e traders profissionais ao seu lado",
    teamBodyA: "Quando você entra para essa mentoria, você não ganha apenas um curso. Você ganha acesso direto ao ", teamBodyBold1: "Ricardo e ao escritório dele", teamBodyMid: " — uma estrutura com mais de ", teamBodyBold2: "30 profissionais do mercado financeiro", teamBodyC: ": traders sênior, analistas gráficos e especialistas em FOREX operando todos os dias.",
    teamItems: [
      { title: "Operações em tempo real", desc: "Cada entrada e saída transmitida ao vivo para você copiar exatamente." },
      { title: "Análise coletiva de 30+ analistas", desc: "Nenhuma operação é feita por impulso. Sempre validada por toda a equipe." },
      { title: "Sem chance de erros isolados", desc: "Com um time inteiro monitorando o mercado, as decisões são sempre baseadas em dados reais." },
      { title: "Todo mundo ganha junto", desc: "O objetivo é que cada aluno acompanhe e lucre em cada operação realizada." },
    ],
    teamGuarBold: "Garantia de operações:", teamGuar: " enquanto o mercado estiver aberto, o time do Ricardo está operando e transmitindo ao vivo para você.",
    licenseTitle: "Segunda Licença Premium — o que isso significa pra você:",
    licensePerks: ["Operar em duas contas ao mesmo tempo", "Dobrar seus resultados sem dobrar o esforço", "Usar com alguém de confiança (cônjuge, filho, sócio)", "Ou revender e recuperar o investimento no mesmo dia"],
    ownedTitle: "O que você já conquistou",
    owned: ["Plataforma Híbrida com IA", "Multiplicador de Lucro", "Blindagem de Conta", "Círculo Interno VIP", "Camada Safety Pro"],
    newTitle: "O que você ganha agora",
    newItems: ["Trader profissional ao vivo — 3x ao dia", "Mentoria completa no FOREX", "Operações guiadas diariamente", "Segunda Licença Premium"],
    bonusTitle: "Bônus exclusivos incluídos",
    bonus: ["Bônus 1: Guia FOREX para Iniciantes — R$ 297", "Bônus 2: Planilha de Controle de Operações — R$ 97", "Bônus 3: Grupo Exclusivo de Sinais ao Vivo — R$ 497", "Bônus 4: Masterclass 'Primeiros R$ 1.000 no FOREX' — R$ 197"],
    bonusTotalA: "Valor total dos bônus: ", bonusTotalBold: "R$ 1.088 — GRÁTIS pra você",
    officialTitle: "Valor oficial dessa mentoria", original: "R$ 4.997", todayOnly: "HOJE APENAS",
    priceSymbol: "R$", priceValue: "297", oneTime: "Pagamento único • Sem mensalidade",
    savings: "Você economiza R$ 4.700 — 94% OFF",
    processing: "Processando...", cta: "QUERO RECUPERAR MEU INVESTIMENTO AGORA",
    trust: ["Compra 100% segura", "Acesso imediato", "Suporte 24h"],
    guarTitle: "Garantia Blindada de 60 dias",
    guarA: "Entre para a mentoria sem risco. Se por qualquer motivo você não ficar satisfeito nos primeiros ", guarBold1: "60 dias", guarMid: ", devolvemos ", guarBold2: "100% do seu dinheiro", guarC: " — sem burocracia, sem perguntas.",
    guarSign: "— Ricardo, Fundador da plataforma",
    spBold: "Atenção:", sp: " Vagas limitadas para as sessões ao vivo. Quando o grupo fechar, essa oferta some permanentemente.",
    decline: "Não, prefiro abrir mão desta oportunidade.",
  },
  en: {
    timerTitle: "This offer expires in", timerExpired: "Offer closed", minutes: "minutes",
    expiredMsg: "You're still on the page — this is your last chance.",
    urgencyA: "This offer disappears when you close this page. ", urgencyBold: "It won't show up again.",
    kicker: "Exclusive offer — today only",
    h1a: "What if you got your investment back ", h1hoje: "TODAY?",
    leadA: (n: string) => `${n ? `${n}, you` : "You"} made it this far. That already says a lot. Now I'll show you the fastest, safest way to recover everything you invested — using `,
    leadBold: "FOREX, the biggest financial market in the world.",
    liveTitle: "Live Professional Trader", liveSub: "3 sessions a day • guided trades • FOREX", liveNow: "LIVE",
    liveBodyA: "You won't do this alone. A professional trader operates ", liveBodyBold: "live with you", liveBodyB: ", 3 times a day, showing exactly what to do, when to do it, and how much return to expect. No guessing. No luck.",
    teamTitle: "Ricardo + an office of 30+ specialists", teamSub: "Professional analysts and traders by your side",
    teamBodyA: "When you join this mentorship, you don't just get a course. You get direct access to ", teamBodyBold1: "Ricardo and his office", teamBodyMid: " — a structure with more than ", teamBodyBold2: "30 financial-market professionals", teamBodyC: ": senior traders, chart analysts and FOREX specialists operating every day.",
    teamItems: [
      { title: "Real-time operations", desc: "Every entry and exit streamed live for you to copy exactly." },
      { title: "Collective analysis from 30+ analysts", desc: "No trade is made on impulse. Always validated by the whole team." },
      { title: "No room for isolated mistakes", desc: "With a whole team watching the market, decisions are always based on real data." },
      { title: "Everyone wins together", desc: "The goal is for every member to follow along and profit on every trade." },
    ],
    teamGuarBold: "Trading guarantee:", teamGuar: " while the market is open, Ricardo's team is trading and streaming live for you.",
    licenseTitle: "Second Premium License — what it means for you:",
    licensePerks: ["Trade two accounts at the same time", "Double your results without doubling the effort", "Share it with someone you trust (spouse, child, partner)", "Or resell it and recover your investment the same day"],
    ownedTitle: "What you've already unlocked",
    owned: ["Hybrid AI Platform", "Profit Multiplier", "Account Protection", "VIP Inner Circle", "Safety Pro Layer"],
    newTitle: "What you get now",
    newItems: ["Live professional trader — 3x a day", "Complete FOREX mentorship", "Guided trades every day", "Second Premium License"],
    bonusTitle: "Exclusive bonuses included",
    bonus: ["Bonus 1: FOREX Guide for Beginners — $59", "Bonus 2: Trade Tracking Spreadsheet — $19", "Bonus 3: Exclusive Live Signals Group — $97", "Bonus 4: Masterclass 'Your First $1,000 in FOREX' — $39"],
    bonusTotalA: "Total bonus value: ", bonusTotalBold: "$214 — FREE for you",
    officialTitle: "Official price of this mentorship", original: "$997", todayOnly: "TODAY ONLY",
    priceSymbol: "$", priceValue: "59", oneTime: "One-time payment • No monthly fee",
    savings: "You save $938 — 94% OFF",
    processing: "Processing...", cta: "I WANT TO RECOVER MY INVESTMENT NOW",
    trust: ["100% secure checkout", "Instant access", "24h support"],
    guarTitle: "60-Day Ironclad Guarantee",
    guarA: "Join the mentorship risk-free. If for any reason you're not satisfied in the first ", guarBold1: "60 days", guarMid: ", we refund ", guarBold2: "100% of your money", guarC: " — no hassle, no questions.",
    guarSign: "— Ricardo, Platform Founder",
    spBold: "Heads up:", sp: " Limited spots for the live sessions. When the group closes, this offer disappears for good.",
    decline: "No, I'd rather give up this opportunity.",
  },
  es: {
    timerTitle: "Esta oferta expira en", timerExpired: "Oferta cerrada", minutes: "minutos",
    expiredMsg: "Todavía estás en la página — esta es tu última oportunidad.",
    urgencyA: "Esta oferta desaparece cuando cierres esta página. ", urgencyBold: "No aparece de nuevo.",
    kicker: "Oferta exclusiva — solo hoy",
    h1a: "¿Y si recuperaras tu inversión ", h1hoje: "HOY?",
    leadA: (n: string) => `${n ? `${n}, ` : "Tú "}llegaste hasta aquí. Eso ya dice mucho. Ahora te voy a mostrar la forma más rápida y segura de recuperar todo lo que invertiste — usando `,
    leadBold: "FOREX, el mercado financiero más grande del mundo.",
    liveTitle: "Trader Profesional en Vivo", liveSub: "3 sesiones al día • operaciones guiadas • FOREX", liveNow: "EN VIVO",
    liveBodyA: "No vas a hacer esto solo. Un trader profesional opera ", liveBodyBold: "en vivo contigo", liveBodyB: ", 3 veces al día, mostrando exactamente qué hacer, cuándo hacerlo y cuánto esperar de retorno. Sin adivinar. Sin suerte.",
    teamTitle: "Ricardo + oficina con 30+ especialistas", teamSub: "Analistas y traders profesionales a tu lado",
    teamBodyA: "Cuando entras a esta mentoría, no solo obtienes un curso. Obtienes acceso directo a ", teamBodyBold1: "Ricardo y su oficina", teamBodyMid: " — una estructura con más de ", teamBodyBold2: "30 profesionales del mercado financiero", teamBodyC: ": traders sénior, analistas gráficos y especialistas en FOREX operando todos los días.",
    teamItems: [
      { title: "Operaciones en tiempo real", desc: "Cada entrada y salida transmitida en vivo para que copies exactamente." },
      { title: "Análisis colectivo de 30+ analistas", desc: "Ninguna operación se hace por impulso. Siempre validada por todo el equipo." },
      { title: "Sin margen para errores aislados", desc: "Con todo un equipo monitoreando el mercado, las decisiones siempre se basan en datos reales." },
      { title: "Todos ganan juntos", desc: "El objetivo es que cada miembro acompañe y gane en cada operación." },
    ],
    teamGuarBold: "Garantía de operaciones:", teamGuar: " mientras el mercado esté abierto, el equipo de Ricardo está operando y transmitiendo en vivo para ti.",
    licenseTitle: "Segunda Licencia Premium — lo que significa para ti:",
    licensePerks: ["Operar en dos cuentas al mismo tiempo", "Duplicar tus resultados sin duplicar el esfuerzo", "Usar con alguien de confianza (pareja, hijo, socio)", "O revender y recuperar la inversión el mismo día"],
    ownedTitle: "Lo que ya conquistaste",
    owned: ["Plataforma Híbrida con IA", "Multiplicador de Ganancia", "Blindaje de Cuenta", "Círculo Interno VIP", "Capa Safety Pro"],
    newTitle: "Lo que ganas ahora",
    newItems: ["Trader profesional en vivo — 3x al día", "Mentoría completa en FOREX", "Operaciones guiadas a diario", "Segunda Licencia Premium"],
    bonusTitle: "Bonos exclusivos incluidos",
    bonus: ["Bono 1: Guía FOREX para Principiantes — $59", "Bono 2: Planilla de Control de Operaciones — $19", "Bono 3: Grupo Exclusivo de Señales en Vivo — $97", "Bono 4: Masterclass 'Primeros $1.000 en FOREX' — $39"],
    bonusTotalA: "Valor total de los bonos: ", bonusTotalBold: "$214 — GRATIS para ti",
    officialTitle: "Precio oficial de esta mentoría", original: "$997", todayOnly: "SOLO HOY",
    priceSymbol: "$", priceValue: "59", oneTime: "Pago único • Sin mensualidad",
    savings: "Ahorras $938 — 94% OFF",
    processing: "Procesando...", cta: "QUIERO RECUPERAR MI INVERSIÓN AHORA",
    trust: ["Compra 100% segura", "Acceso inmediato", "Soporte 24h"],
    guarTitle: "Garantía Blindada de 60 días",
    guarA: "Entra a la mentoría sin riesgo. Si por cualquier motivo no quedas satisfecho en los primeros ", guarBold1: "60 días", guarMid: ", devolvemos el ", guarBold2: "100% de tu dinero", guarC: " — sin trámites, sin preguntas.",
    guarSign: "— Ricardo, Fundador de la plataforma",
    spBold: "Atención:", sp: " Cupos limitados para las sesiones en vivo. Cuando el grupo cierre, esta oferta desaparece para siempre.",
    decline: "No, prefiero renunciar a esta oportunidad.",
  },
};

const UpsellForexMentoria = ({ name, onNext, onDecline }: Props) => {
  const { lang } = useLanguage();
  const t = TEXTS[lang];
  const firstName = name !== "Visitante" ? name : "";
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(interval); setExpired(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, "0");
  const seconds = (timeLeft % 60).toString().padStart(2, "0");
  const timerPercent = ((TIMER_SECONDS - timeLeft) / TIMER_SECONDS) * 100;

  const handleBuy = () => {
    setLoading(true);
    saveUpsellExtras("circulo", { price: PRICE, product: "forex_mentoria" });
    saveFunnelEvent("upsell_buy", { page: "/upsell6", product: "forex_mentoria", price: PRICE });
    logAuditEvent({ eventType: "upsell_buy", pageId: "/upsell6", metadata: { product: "forex_mentoria", price: PRICE } });
    const utmQs = buildTrackingQueryString();
    const separator = CHECKOUT_URL.includes("?") ? "&" : "?";
    const fullUrl = utmQs ? `${CHECKOUT_URL}${separator}${utmQs.slice(1)}` : CHECKOUT_URL;
    window.open(fullUrl, "_blank");
    setTimeout(() => setLoading(false), 3000);
  };

  const handleDecline = () => {
    saveFunnelEvent("upsell_decline", { page: "/upsell6", product: "forex_mentoria" });
    logAuditEvent({ eventType: "upsell_decline", pageId: "/upsell6" });
    onDecline();
  };

  return (
    <div className="flex flex-col gap-5 pt-4 pb-6">

      {/* TIMER */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl overflow-hidden"
        style={{ border: expired ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(239,68,68,0.3)" }}>
        <div className="px-4 py-3 flex items-center gap-3" style={{ background: expired ? "rgba(239,68,68,0.15)" : "rgba(239,68,68,0.08)" }}>
          <Clock className="w-4 h-4 shrink-0" style={{ color: "#EF4444" }} />
          <div className="flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "#FCA5A5" }}>{expired ? t.timerExpired : t.timerTitle}</p>
            {!expired && (
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-[28px] font-extrabold leading-none tabular-nums" style={{ color: "#EF4444" }}>{minutes}:{seconds}</span>
                <span className="text-[11px]" style={{ color: "#94A3B8" }}>{t.minutes}</span>
              </div>
            )}
            {expired && <p className="text-[12px] font-semibold" style={{ color: "#EF4444" }}>{t.expiredMsg}</p>}
          </div>
        </div>
        {!expired && (
          <div className="h-1 w-full" style={{ background: "rgba(239,68,68,0.1)" }}>
            <div className="h-full transition-all duration-1000" style={{ width: `${timerPercent}%`, background: "linear-gradient(90deg, #EF4444, #DC2626)" }} />
          </div>
        )}
      </motion.div>

      {/* URGENCY */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="rounded-xl p-3 flex items-center gap-2.5" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
        <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: "#EF4444" }} />
        <p className="text-[12px] font-semibold" style={{ color: "#FCA5A5" }}>{t.urgencyA}<strong style={{ color: "#EF4444" }}>{t.urgencyBold}</strong></p>
      </motion.div>

      {/* HEADER */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="text-center">
        <p className="text-[11px] uppercase tracking-widest font-bold mb-2" style={{ color: "#22C55E" }}>{t.kicker}</p>
        <h1 className="text-[24px] font-extrabold leading-tight" style={{ color: "#F8FAFC" }}>
          {t.h1a}<span style={{ background: "linear-gradient(135deg, #16A34A, #22C55E)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{t.h1hoje}</span>
        </h1>
        <p className="text-[14px] mt-3 leading-relaxed" style={{ color: "#94A3B8" }}>
          {t.leadA(firstName)}<strong style={{ color: "#F8FAFC" }}>{t.leadBold}</strong>
        </p>
      </motion.div>

      {/* LIVE TRADER */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(34,197,94,0.3)" }}>
        <div className="px-5 py-4 flex items-center gap-3" style={{ background: "rgba(22,163,74,0.1)" }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(22,163,74,0.2)", border: "1px solid rgba(34,197,94,0.4)" }}>
            <Video className="w-5 h-5" style={{ color: "#22C55E" }} />
          </div>
          <div>
            <p className="text-[13px] font-bold" style={{ color: "#F8FAFC" }}>{t.liveTitle}</p>
            <p className="text-[11px]" style={{ color: "#86EFAC" }}>{t.liveSub}</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "#22C55E" }} />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: "#16A34A" }} />
            </span>
            <span className="text-[10px] font-bold" style={{ color: "#22C55E" }}>{t.liveNow}</span>
          </div>
        </div>
        <div className="px-5 py-4" style={{ background: "#0F172A" }}>
          <p className="text-[13px] leading-relaxed" style={{ color: "#CBD5E1" }}>{t.liveBodyA}<strong style={{ color: "#F8FAFC" }}>{t.liveBodyBold}</strong>{t.liveBodyB}</p>
        </div>
      </motion.div>

      {/* RICARDO + TEAM */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(250,204,21,0.25)" }}>
        <div className="px-5 py-4 flex items-center gap-3" style={{ background: "rgba(250,204,21,0.07)" }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(250,204,21,0.15)", border: "1px solid rgba(250,204,21,0.35)" }}>
            <Users className="w-5 h-5" style={{ color: "#FACC15" }} />
          </div>
          <div>
            <p className="text-[13px] font-bold" style={{ color: "#F8FAFC" }}>{t.teamTitle}</p>
            <p className="text-[11px]" style={{ color: "#FDE68A" }}>{t.teamSub}</p>
          </div>
        </div>
        <div className="px-5 py-4 flex flex-col gap-3" style={{ background: "#0F172A" }}>
          <p className="text-[13px] leading-relaxed" style={{ color: "#CBD5E1" }}>
            {t.teamBodyA}<strong style={{ color: "#F8FAFC" }}>{t.teamBodyBold1}</strong>{t.teamBodyMid}<strong style={{ color: "#FACC15" }}>{t.teamBodyBold2}</strong>{t.teamBodyC}
          </p>
          <div className="flex flex-col gap-2 mt-1">
            {t.teamItems.map((item, i) => {
              const Icon = TEAM_ICONS[i];
              return (
                <div key={item.title} className="flex items-start gap-3 rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: "rgba(250,204,21,0.12)" }}>
                    <Icon className="w-3.5 h-3.5" style={{ color: "#FACC15" }} />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold" style={{ color: "#F1F5F9" }}>{item.title}</p>
                    <p className="text-[12px] mt-0.5 leading-relaxed" style={{ color: "#94A3B8" }}>{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-1 rounded-xl p-3 flex items-center gap-2.5" style={{ background: "rgba(22,163,74,0.07)", border: "1px solid rgba(34,197,94,0.2)" }}>
            <Shield className="w-4 h-4 shrink-0" style={{ color: "#22C55E" }} />
            <p className="text-[12px] leading-snug" style={{ color: "#86EFAC" }}><strong style={{ color: "#F8FAFC" }}>{t.teamGuarBold}</strong>{t.teamGuar}</p>
          </div>
        </div>
      </motion.div>

      {/* SECOND LICENSE */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }} className="rounded-2xl p-5" style={{ background: "rgba(250,204,21,0.05)", border: "1px solid rgba(250,204,21,0.2)" }}>
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4" style={{ color: "#FACC15" }} />
          <p className="text-[13px] font-bold" style={{ color: "#FACC15" }}>{t.licenseTitle}</p>
        </div>
        <ul className="flex flex-col gap-2.5">
          {t.licensePerks.map((perk) => (
            <li key={perk} className="flex items-start gap-2">
              <Check className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: "#FACC15" }} />
              <span className="text-[13px]" style={{ color: "#E2E8F0" }}>{perk}</span>
            </li>
          ))}
        </ul>
      </motion.div>

      {/* EVERYTHING INCLUDED */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }} className="rounded-2xl p-5 flex flex-col gap-4" style={{ background: "#0F172A", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div>
          <div className="flex items-center gap-2 mb-3">
            <PackageCheck className="w-3.5 h-3.5 shrink-0" style={{ color: "#64748B" }} />
            <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "#64748B" }}>{t.ownedTitle}</p>
          </div>
          <div className="flex flex-col gap-2">
            {t.owned.map((label, i) => {
              const Icon = OWNED_ICONS[i];
              return (
                <div key={label} className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(22,163,74,0.12)" }}>
                    <Icon className="w-3 h-3" style={{ color: "#22C55E" }} />
                  </div>
                  <span className="text-[13px]" style={{ color: "#94A3B8" }}>{label}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-3.5 h-3.5 shrink-0" style={{ color: "#22C55E" }} />
            <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "#22C55E" }}>{t.newTitle}</p>
          </div>
          <div className="flex flex-col gap-2">
            {t.newItems.map((label, i) => {
              const Icon = NEW_ICONS[i];
              return (
                <div key={label} className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(22,163,74,0.2)", border: "1px solid rgba(34,197,94,0.3)" }}>
                    <Icon className="w-3 h-3" style={{ color: "#22C55E" }} />
                  </div>
                  <span className="text-[13px] font-semibold" style={{ color: "#F1F5F9" }}>{label}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Gift className="w-3.5 h-3.5 shrink-0" style={{ color: "#FACC15" }} />
            <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "#FACC15" }}>{t.bonusTitle}</p>
          </div>
          <div className="flex flex-col gap-2">
            {t.bonus.map((label, i) => {
              const Icon = BONUS_ICONS[i];
              return (
                <div key={label} className="flex items-start gap-2.5">
                  <Icon className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: "#FACC15" }} />
                  <span className="text-[13px]" style={{ color: "#E2E8F0" }}>{label}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-3 pt-3" style={{ borderTop: "1px dashed rgba(250,204,21,0.2)" }}>
            <p className="text-[12px] font-bold text-center" style={{ color: "#FACC15" }}>{t.bonusTotalA}<span style={{ color: "#F8FAFC" }}>{t.bonusTotalBold}</span></p>
          </div>
        </div>
      </motion.div>

      {/* PRICE */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }} className="rounded-2xl p-5 text-center"
        style={{ background: "linear-gradient(135deg, rgba(22,163,74,0.08), rgba(15,23,42,0))", border: "2px solid rgba(22,163,74,0.3)" }}>
        <p className="text-[12px] uppercase tracking-wider font-semibold mb-1" style={{ color: "#64748B" }}>{t.officialTitle}</p>
        <p className="text-[28px] font-extrabold line-through" style={{ color: "#475569" }}>{t.original}</p>
        <div className="my-2 flex items-center gap-3 justify-center">
          <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.06)" }} />
          <span className="text-[11px] font-bold px-3 py-1 rounded-full" style={{ background: "rgba(22,163,74,0.15)", color: "#22C55E" }}>{t.todayOnly}</span>
          <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.06)" }} />
        </div>
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-[16px] font-bold" style={{ color: "#94A3B8" }}>{t.priceSymbol}</span>
          <span className="text-[52px] font-extrabold leading-none" style={{ background: "linear-gradient(135deg, #16A34A, #22C55E)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{t.priceValue}</span>
        </div>
        <p className="text-[12px] mt-1" style={{ color: "#64748B" }}>{t.oneTime}</p>
        <div className="mt-3 inline-block px-4 py-1.5 rounded-full" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)" }}>
          <span className="text-[12px] font-bold" style={{ color: "#FCA5A5" }}>{t.savings}</span>
        </div>
      </motion.div>

      {/* CTA */}
      <motion.button initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.36 }} onClick={handleBuy} disabled={loading}
        className="w-full py-[18px] rounded-xl text-[17px] font-extrabold tracking-wide transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-70"
        style={{ background: "linear-gradient(135deg, #16A34A, #15803D)", color: "#FFFFFF", boxShadow: "0 0 30px rgba(22,163,74,0.35), 0 4px 16px rgba(0,0,0,0.4)" }}>
        {loading ? t.processing : t.cta}
      </motion.button>

      <div className="flex items-center justify-center gap-4">
        {t.trust.map((txt) => (
          <div key={txt} className="flex items-center gap-1">
            <Check className="w-3 h-3" style={{ color: "#22C55E" }} />
            <span className="text-[10px]" style={{ color: "#64748B" }}>{txt}</span>
          </div>
        ))}
      </div>

      {/* GUARANTEE */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.40 }} className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(34,197,94,0.2)" }}>
        <div className="px-5 py-4 flex items-start gap-4" style={{ background: "rgba(22,163,74,0.06)" }}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(22,163,74,0.15)", border: "2px solid rgba(34,197,94,0.35)" }}>
            <BadgeCheck className="w-7 h-7" style={{ color: "#22C55E" }} />
          </div>
          <div>
            <p className="text-[14px] font-extrabold" style={{ color: "#F8FAFC" }}>{t.guarTitle}</p>
            <p className="text-[13px] mt-1 leading-relaxed" style={{ color: "#94A3B8" }}>
              {t.guarA}<strong style={{ color: "#F8FAFC" }}>{t.guarBold1}</strong>{t.guarMid}<strong style={{ color: "#22C55E" }}>{t.guarBold2}</strong>{t.guarC}
            </p>
            <p className="text-[12px] mt-2 font-semibold" style={{ color: "#22C55E" }}>{t.guarSign}</p>
          </div>
        </div>
      </motion.div>

      {/* SOCIAL PROOF URGENCY */}
      <div className="rounded-xl p-3.5 flex items-start gap-2.5" style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)" }}>
        <Users className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#EF4444" }} />
        <p className="text-[12px] leading-relaxed" style={{ color: "#CBD5E1" }}><strong style={{ color: "#EF4444" }}>{t.spBold}</strong>{t.sp}</p>
      </div>

      {/* DECLINE */}
      <button onClick={handleDecline} className="flex items-center gap-1.5 text-[12px] mx-auto py-2 bg-transparent border-none cursor-pointer" style={{ color: "#475569" }}>
        <XCircle className="w-3.5 h-3.5" />
        {t.decline}
      </button>
    </div>
  );
};

export default UpsellForexMentoria;
