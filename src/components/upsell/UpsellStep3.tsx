import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Zap, MessageCircle, BarChart3, Headphones, Check, Crown, Clock, TrendingUp, Users, CalendarClock, Gauge } from "lucide-react";
import { saveUpsellChoice } from "@/lib/upsellData";
import { buildTrackingQueryString } from "@/lib/trackingDataLayer";
import { useLanguage, type Language } from "@/lib/i18n";
import avatarAntonio from "@/assets/avatar-antonio.jpg";
import avatarMaria from "@/assets/avatar-maria.jpg";

interface Props { name: string; onNext: () => void; onDecline: () => void; }

// Estrutura independente de idioma (ids, links, preço REAL cobrado, cores, ícones).
const V147_LINKS = {
  essencial: "https://pay.hub.la/VWl1fjDbG6ONhlKunD4S/upsell",
  avancado:  "https://pay.hub.la/pYcsABZulGE2viELYvDK/upsell",
  max:       "https://pay.hub.la/Bc5NPZjzZbV2vHTAXEkv/upsell",
};
const BASE_TIERS = [
  { id: "basico", checkoutUrl: V147_LINKS.essencial, price: 197, accent: "#22C55E", btnBg: "transparent", btnColor: "#22C55E", btnBorder: "1.5px solid #22C55E", recommended: false },
  { id: "duplo",  checkoutUrl: V147_LINKS.avancado,  price: 297, accent: "#22C55E", btnBg: "linear-gradient(135deg, #16A34A, #15803D)", btnColor: "#fff", btnBorder: "none", recommended: true },
  { id: "maximo", checkoutUrl: V147_LINKS.max,       price: 347, accent: "#FACC15", btnBg: "linear-gradient(135deg, #FACC15, #EAB308)", btnColor: "#020617", btnBorder: "none", recommended: false },
] as const;

const BASE_PLANS = [
  { id: "basico", price: 37, checkoutUrl: "https://pay.hub.la/LzOocnV4vkWEqJu08WQo/upsell", border: "1px solid rgba(255,255,255,0.08)", subtitleColor: "#22C55E", btnBg: "transparent", btnColor: "#22C55E", btnBorder: "1.5px solid #22C55E", badge: false, icons: [Zap, Shield, Headphones] },
  { id: "duplo",  price: 67, checkoutUrl: "https://pay.hub.la/NxLkOmGzH1PJSm1Nz63o/upsell", border: "2px solid #22C55E", subtitleColor: "#22C55E", btnBg: "linear-gradient(135deg, #16A34A, #15803D)", btnColor: "#fff", btnBorder: "none", badge: true, icons: [Zap, Shield, BarChart3, MessageCircle] },
  { id: "maximo", price: 97, checkoutUrl: "https://pay.hub.la/dYNMVeaVxs3bS32Ioffo/upsell", border: "1px solid rgba(250,204,21,0.25)", subtitleColor: "#FACC15", btnBg: "linear-gradient(135deg, #FACC15, #EAB308)", btnColor: "#020617", btnBorder: "none", badge: false, icons: [Zap, Shield, BarChart3, MessageCircle, Headphones] },
] as const;

const TABLE_ICONS = [TrendingUp, Clock, CalendarClock, Gauge, Users, Shield, Check];

// Textos por idioma. PT = idêntico ao que já roda. EN/ES = adaptação cultural + valores em US$.
const L = {
  pt: {
    v_head: (n: string) => (n ? `${n}, qual velocidade você quer?` : "Qual velocidade você quer?"),
    v_sub: "Cada modo faz o Guardião trabalhar mais por você.",
    v_subBold: "Sem aumentar o risco.",
    v_noBoost: "Sem acelerar:", v_noBoostTxt: " R$25 por dia, primeiro real em 7 dias, saque na fila.",
    v_boost: "Com acelerador:", v_boostTxt: " o limite sobe, o primeiro saque antecipa. Você não opera. Ele opera.",
    v_micro: "Pagamento único · Garantia 30 dias · Sem mensalidade",
    tblBest: "★ MELHOR", tblTop: "TETO",
    cols: ["Hoje", "Essencial", "Avançado", "MAX"],
    rows: [
      { label: "Potencial por dia", vals: ["R$25", "até R$310", "até R$700", "~R$1.200"] },
      { label: "Primeiro resultado", vals: ["7 dias", "72 horas", "24 horas", "12 horas"] },
      { label: "Primeiro saque", vals: ["Fila", "72h", "Amanhã", "Hoje"] },
      { label: "Quando opera", vals: ["Padrão", "+ ativo", "24h + FDS", "24h · 3 merc"] },
      { label: "Quem configura", vals: ["Você", "Você", "Você", "O time"] },
      { label: "Risco", vals: ["—", "Sem aumentar", "Sem aumentar", "Sem aumentar"] },
      { label: "Paga uma vez", vals: ["—", "R$197", "R$297", "R$347"] },
    ],
    fourLines: [
      "Quanto maior a velocidade, maior o potencial por dia.",
      "O risco não sobe. Quem sobe é o Guardião.",
      "Você não opera. No MAX, o time liga tudo no 1º dia.",
      "Um pagamento. 30 dias. Se não for a tua, volta.",
    ],
    orWord: "ou", opening: "Abrindo checkout...", guaranteeShort: "Garantia 30 dias incondicional",
    tiers: {
      basico: { tag: "PRO Essencial", perDay: "até R$310", perDayLabel: "por dia", headline: "Até R$310 por dia · primeiro saque em 72h",
        body: "Pra o Guardião operar mais ativo já nessa primeira semana. Mais microoperações que o padrão. Otimizado pra Forex.",
        bullets: ["Sem acelerar: R$25/dia e 7 dias de espera.", "Com Essencial: até R$310/dia, resultado em 72h, saque em 3 dias."],
        cta: "ATIVAR R$310/DIA · SAQUE EM 72H", priceDisplay: "R$ 197", installments: "12x de R$ 19,90", badge: null, diffLine: null },
      duplo: { tag: "PRO Avançado", perDay: "até R$700", perDayLabel: "por dia", headline: "Até R$700 por dia · primeiro saque amanhã",
        body: "Tudo do Essencial. O Guardião passa a trabalhar enquanto você dorme, no fim de semana, feriado — quando o Forex fecha, a cripto 24/7 continua.",
        bullets: ["Análise de notícia em tempo real (o modo padrão ignora).", "Grupo VIP no WhatsApp.", "Até R$700/dia · resultado em 24h · saque amanhã. Sem aumentar o risco."],
        cta: "ATIVAR R$700/DIA · SAQUE EM 24H", priceDisplay: "R$ 297", installments: "12x de R$ 29,70", badge: "★ MELHOR ESCOLHA", diffLine: null },
      maximo: { tag: "PRO MAX", perDay: "~R$1.200", perDayLabel: "por dia", headline: "~R$1.200 por dia · primeiro saque hoje",
        body: "Tudo do Avançado. O time configura o Guardião no turbo no seu primeiro dia. Você não mexe em nada.",
        bullets: ["Forex + cripto + índices ao mesmo tempo", "LIVE OURO · amanhã, 20h — fechada pra quem ativar o MAX hoje", "Consultoria 1 a 1 de 30 min", "Suporte 24h (minutos, não dias)", "+ US$ 100 na corretora (além dos US$ 100 do acesso)", "Versões novas do Guardião antes de todo mundo", "Relatório de ganhos toda manhã"],
        cta: "ATIVAR MAX · R$1.200/DIA · SAQUE HOJE", priceDisplay: "R$ 347", installments: "12x de R$ 34,70", badge: "só R$50 a mais", diffLine: "só R$50 a mais que o Avançado" },
    },
    fechoA: "A maioria ativa o ", fechoABold: "Avançado", fechoAEnd: ": até R$700/dia, saque amanhã.",
    fechoB: "Quem quer o teto e o time no primeiro dia paga ", fechoBBold: "R$50 a mais", fechoBEnd: " e vai no MAX.",
    guarBtn: "Quero saber da garantia primeiro", guarTitle: "Garantia de 30 dias incondicional",
    guarA: "Ativa hoje e testa por 30 dias. Se não for pra você, devolvemos ", guarBold: "100%", guarB: " — sem pergunta, sem burocracia. O risco é todo nosso, não seu.",
    v_decline: "Não, prefiro continuar no ritmo padrão (R$25/dia, 7 dias).",
    // normal
    n_head: (n: string) => (n ? `${n}, como você quer começar?` : "Como você quer começar?"),
    n_sub: "Cada plano acelera seus primeiros resultados e protege seu capital. Escolha o que faz sentido pra sua realidade agora.",
    n_proof: "Quem ativou o acelerador:",
    n_decline: "Não, prefiro esperar os 7 dias com a configuração padrão.",
    plans: {
      basico: { name: "Acelerador Básico", subtitle: "Resultados em até 72 horas", description: "A plataforma opera com prioridade nos servidores dedicados, reduzindo de 7 dias para 72 horas. Proteção básica ativada.",
        features: ["Servidores prioritários", "Proteção básica contra perdas", "Suporte por e-mail"], priceDisplay: "R$ 37", installments: "12x de R$ 3,08", btnText: "ATIVAR BÁSICO", badge: null },
      duplo: { name: "Acelerador Duplo", subtitle: "Resultados em até 24 horas", description: "Tudo do Básico + uma segunda IA monitora cada operação em tempo real. É o que 9 em cada 10 novos membros escolhem.",
        features: ["Servidores prioritários", "Proteção dupla contra perdas", "Monitoramento 24h por segunda IA", "Suporte prioritário no WhatsApp"], priceDisplay: "R$ 67", installments: "12x de R$ 5,58", btnText: "ATIVAR DUPLO — MAIS ESCOLHIDO", badge: "⚡ RECOMENDADO" },
      maximo: { name: "Acelerador Máximo", subtitle: "Resultados em até 12 horas", description: "O nível máximo. Tudo do Duplo + um especialista humano te guia clique por clique no WhatsApp por 48h.",
        features: ["Servidores prioritários", "Proteção tripla contra perdas", "Monitoramento 24h por segunda IA", "Especialista pessoal no WhatsApp — 48h", "Relatório de ganhos toda manhã"], priceDisplay: "R$ 97", installments: "12x de R$ 8,08", btnText: "ATIVAR MÁXIMO", badge: null },
    },
    proof: [
      { name: "Antônio, 57", text: "Ativei o Duplo e no dia seguinte caiu R$43 na conta. Se tivesse esperado os 7 dias, já tinha desistido." },
      { name: "Dona Márcia, 52", text: "O especialista me ajudou a configurar tudo em 10 minutos. Primeira vez que me senti segura com algo na internet." },
    ],
  },
  en: {
    v_head: (n: string) => (n ? `${n}, which speed do you want?` : "Which speed do you want?"),
    v_sub: "Each mode makes the Guardian work harder for you.",
    v_subBold: "Without raising the risk.",
    v_noBoost: "No boost:", v_noBoostTxt: " $5 a day, first result in 7 days, payout in the queue.",
    v_boost: "With a boost:", v_boostTxt: " the limit goes up, the first payout comes sooner. You don't trade. It trades.",
    v_micro: "One-time payment · 30-day guarantee · No monthly fee",
    tblBest: "★ BEST", tblTop: "TOP",
    cols: ["Today", "Essential", "Advanced", "MAX"],
    rows: [
      { label: "Potential per day", vals: ["$5", "up to $60", "up to $140", "~$240"] },
      { label: "First result", vals: ["7 days", "72 hours", "24 hours", "12 hours"] },
      { label: "First payout", vals: ["Queue", "72h", "Tomorrow", "Today"] },
      { label: "When it runs", vals: ["Standard", "+ active", "24h + wkend", "24h · 3 mkts"] },
      { label: "Who sets it up", vals: ["You", "You", "You", "The team"] },
      { label: "Risk", vals: ["—", "No increase", "No increase", "No increase"] },
      { label: "One-time payment", vals: ["—", "$39", "$59", "$69"] },
    ],
    fourLines: [
      "The higher the speed, the higher the potential per day.",
      "The risk doesn't go up. The Guardian does.",
      "You don't trade. On MAX, the team switches it all on day one.",
      "One payment. 30 days. If it's not for you, you get it back.",
    ],
    orWord: "or", opening: "Opening checkout...", guaranteeShort: "30-day unconditional guarantee",
    tiers: {
      basico: { tag: "PRO Essential", perDay: "up to $60", perDayLabel: "per day", headline: "Up to $60 a day · first payout in 72h",
        body: "So the Guardian runs more actively in your very first week. More micro-operations than standard. Optimized for Forex.",
        bullets: ["No boost: $5/day and a 7-day wait.", "With Essential: up to $60/day, result in 72h, payout in 3 days."],
        cta: "ACTIVATE $60/DAY · PAYOUT IN 72H", priceDisplay: "$39", installments: "12x $3.90", badge: null, diffLine: null },
      duplo: { tag: "PRO Advanced", perDay: "up to $140", perDayLabel: "per day", headline: "Up to $140 a day · first payout tomorrow",
        body: "Everything in Essential. The Guardian starts working while you sleep, on weekends and holidays — when Forex closes, crypto runs 24/7.",
        bullets: ["Real-time news analysis (standard mode ignores it).", "VIP WhatsApp group.", "Up to $140/day · result in 24h · payout tomorrow. No added risk."],
        cta: "ACTIVATE $140/DAY · PAYOUT IN 24H", priceDisplay: "$59", installments: "12x $5.90", badge: "★ BEST CHOICE", diffLine: null },
      maximo: { tag: "PRO MAX", perDay: "~$240", perDayLabel: "per day", headline: "~$240 a day · first payout today",
        body: "Everything in Advanced. The team sets the Guardian to turbo on your first day. You touch nothing.",
        bullets: ["Forex + crypto + indices at the same time", "GOLD LIVE · tomorrow, 8pm — closed, only for those who activate MAX today", "1-on-1 consulting, 30 min", "24h support (minutes, not days)", "+ US$100 at the broker (on top of the US$100 from your access)", "New Guardian versions before everyone else", "Earnings report every morning"],
        cta: "ACTIVATE MAX · $240/DAY · PAYOUT TODAY", priceDisplay: "$69", installments: "12x $6.90", badge: "just $10 more", diffLine: "just $10 more than Advanced" },
    },
    fechoA: "Most people activate ", fechoABold: "Advanced", fechoAEnd: ": up to $140/day, payout tomorrow.",
    fechoB: "Those who want the ceiling and the team on day one pay ", fechoBBold: "$10 more", fechoBEnd: " and go MAX.",
    guarBtn: "I want to hear about the guarantee first", guarTitle: "30-day unconditional guarantee",
    guarA: "Activate today and test it for 30 days. If it's not for you, we refund ", guarBold: "100%", guarB: " — no questions, no red tape. The risk is all ours, not yours.",
    v_decline: "No, I'll stick with the standard pace ($5/day, 7 days).",
    n_head: (n: string) => (n ? `${n}, how do you want to start?` : "How do you want to start?"),
    n_sub: "Each plan speeds up your first results and protects your capital. Pick the one that fits your reality right now.",
    n_proof: "Who activated the accelerator:",
    n_decline: "No, I'd rather wait the 7 days on the standard setup.",
    plans: {
      basico: { name: "Basic Accelerator", subtitle: "Results in up to 72 hours", description: "The platform runs with priority on dedicated servers, cutting 7 days down to 72 hours. Basic protection on.",
        features: ["Priority servers", "Basic loss protection", "Email support"], priceDisplay: "$7", installments: "12x $0.60", btnText: "ACTIVATE BASIC", badge: null },
      duplo: { name: "Double Accelerator", subtitle: "Results in up to 24 hours", description: "Everything in Basic + a second AI monitors every operation in real time. It's what 9 out of 10 new members choose.",
        features: ["Priority servers", "Double loss protection", "24h monitoring by a second AI", "Priority WhatsApp support"], priceDisplay: "$13", installments: "12x $1.10", btnText: "ACTIVATE DOUBLE — MOST CHOSEN", badge: "⚡ RECOMMENDED" },
      maximo: { name: "Maximum Accelerator", subtitle: "Results in up to 12 hours", description: "The top level. Everything in Double + a human specialist guides you click by click on WhatsApp for 48h.",
        features: ["Priority servers", "Triple loss protection", "24h monitoring by a second AI", "Personal specialist on WhatsApp — 48h", "Earnings report every morning"], priceDisplay: "$19", installments: "12x $1.60", btnText: "ACTIVATE MAXIMUM", badge: null },
    },
    proof: [
      { name: "Antônio, 57", text: "I activated Double and the next day $8 hit my account. If I'd waited the 7 days, I'd have quit." },
      { name: "Ms. Márcia, 52", text: "The specialist helped me set everything up in 10 minutes. First time I felt safe with something online." },
    ],
  },
  es: {
    v_head: (n: string) => (n ? `${n}, ¿qué velocidad quieres?` : "¿Qué velocidad quieres?"),
    v_sub: "Cada modo hace que el Guardián trabaje más por ti.",
    v_subBold: "Sin subir el riesgo.",
    v_noBoost: "Sin acelerar:", v_noBoostTxt: " $5 por día, primer resultado en 7 días, retiro en la fila.",
    v_boost: "Con acelerador:", v_boostTxt: " el límite sube, el primer retiro se adelanta. Tú no operas. Él opera.",
    v_micro: "Pago único · Garantía 30 días · Sin mensualidad",
    tblBest: "★ MEJOR", tblTop: "TOPE",
    cols: ["Hoy", "Esencial", "Avanzado", "MAX"],
    rows: [
      { label: "Potencial por día", vals: ["$5", "hasta $60", "hasta $140", "~$240"] },
      { label: "Primer resultado", vals: ["7 días", "72 horas", "24 horas", "12 horas"] },
      { label: "Primer retiro", vals: ["Fila", "72h", "Mañana", "Hoy"] },
      { label: "Cuándo opera", vals: ["Estándar", "+ activo", "24h + finde", "24h · 3 merc"] },
      { label: "Quién configura", vals: ["Tú", "Tú", "Tú", "El equipo"] },
      { label: "Riesgo", vals: ["—", "Sin subir", "Sin subir", "Sin subir"] },
      { label: "Pago único", vals: ["—", "$39", "$59", "$69"] },
    ],
    fourLines: [
      "Cuanta más velocidad, más potencial por día.",
      "El riesgo no sube. Sube el Guardián.",
      "Tú no operas. En MAX, el equipo activa todo el 1er día.",
      "Un pago. 30 días. Si no es para ti, te lo devolvemos.",
    ],
    orWord: "o", opening: "Abriendo checkout...", guaranteeShort: "Garantía 30 días incondicional",
    tiers: {
      basico: { tag: "PRO Esencial", perDay: "hasta $60", perDayLabel: "por día", headline: "Hasta $60 por día · primer retiro en 72h",
        body: "Para que el Guardián opere más activo ya en la primera semana. Más microoperaciones que el estándar. Optimizado para Forex.",
        bullets: ["Sin acelerar: $5/día y 7 días de espera.", "Con Esencial: hasta $60/día, resultado en 72h, retiro en 3 días."],
        cta: "ACTIVAR $60/DÍA · RETIRO EN 72H", priceDisplay: "$39", installments: "12x $3,90", badge: null, diffLine: null },
      duplo: { tag: "PRO Avanzado", perDay: "hasta $140", perDayLabel: "por día", headline: "Hasta $140 por día · primer retiro mañana",
        body: "Todo lo de Esencial. El Guardián empieza a trabajar mientras duermes, el fin de semana y feriados — cuando el Forex cierra, la cripto sigue 24/7.",
        bullets: ["Análisis de noticias en tiempo real (el modo estándar lo ignora).", "Grupo VIP en WhatsApp.", "Hasta $140/día · resultado en 24h · retiro mañana. Sin aumentar el riesgo."],
        cta: "ACTIVAR $140/DÍA · RETIRO EN 24H", priceDisplay: "$59", installments: "12x $5,90", badge: "★ MEJOR OPCIÓN", diffLine: null },
      maximo: { tag: "PRO MAX", perDay: "~$240", perDayLabel: "por día", headline: "~$240 por día · primer retiro hoy",
        body: "Todo lo de Avanzado. El equipo configura el Guardián en turbo tu primer día. Tú no tocas nada.",
        bullets: ["Forex + cripto + índices al mismo tiempo", "LIVE ORO · mañana, 20h — cerrada, solo para quien active MAX hoy", "Consultoría 1 a 1 de 30 min", "Soporte 24h (minutos, no días)", "+ US$100 en el bróker (además de los US$100 del acceso)", "Versiones nuevas del Guardián antes que todos", "Reporte de ganancias cada mañana"],
        cta: "ACTIVAR MAX · $240/DÍA · RETIRO HOY", priceDisplay: "$69", installments: "12x $6,90", badge: "solo $10 más", diffLine: "solo $10 más que Avanzado" },
    },
    fechoA: "La mayoría activa ", fechoABold: "Avanzado", fechoAEnd: ": hasta $140/día, retiro mañana.",
    fechoB: "Quien quiere el tope y el equipo el primer día paga ", fechoBBold: "$10 más", fechoBEnd: " y va a MAX.",
    guarBtn: "Quiero saber de la garantía primero", guarTitle: "Garantía de 30 días incondicional",
    guarA: "Actívalo hoy y pruébalo 30 días. Si no es para ti, devolvemos el ", guarBold: "100%", guarB: " — sin preguntas, sin burocracia. El riesgo es todo nuestro, no tuyo.",
    v_decline: "No, prefiero seguir al ritmo estándar ($5/día, 7 días).",
    n_head: (n: string) => (n ? `${n}, ¿cómo quieres empezar?` : "¿Cómo quieres empezar?"),
    n_sub: "Cada plan acelera tus primeros resultados y protege tu capital. Elige el que tenga sentido para tu realidad ahora.",
    n_proof: "Quiénes activaron el acelerador:",
    n_decline: "No, prefiero esperar los 7 días con la configuración estándar.",
    plans: {
      basico: { name: "Acelerador Básico", subtitle: "Resultados en hasta 72 horas", description: "La plataforma opera con prioridad en servidores dedicados, reduciendo de 7 días a 72 horas. Protección básica activada.",
        features: ["Servidores prioritarios", "Protección básica contra pérdidas", "Soporte por e-mail"], priceDisplay: "$7", installments: "12x $0,60", btnText: "ACTIVAR BÁSICO", badge: null },
      duplo: { name: "Acelerador Doble", subtitle: "Resultados en hasta 24 horas", description: "Todo lo del Básico + una segunda IA monitorea cada operación en tiempo real. Es lo que eligen 9 de cada 10 nuevos miembros.",
        features: ["Servidores prioritarios", "Protección doble contra pérdidas", "Monitoreo 24h por una segunda IA", "Soporte prioritario en WhatsApp"], priceDisplay: "$13", installments: "12x $1,10", btnText: "ACTIVAR DOBLE — MÁS ELEGIDO", badge: "⚡ RECOMENDADO" },
      maximo: { name: "Acelerador Máximo", subtitle: "Resultados en hasta 12 horas", description: "El nivel máximo. Todo lo del Doble + un especialista humano te guía clic a clic por WhatsApp durante 48h.",
        features: ["Servidores prioritarios", "Protección triple contra pérdidas", "Monitoreo 24h por una segunda IA", "Especialista personal en WhatsApp — 48h", "Reporte de ganancias cada mañana"], priceDisplay: "$19", installments: "12x $1,60", btnText: "ACTIVAR MÁXIMO", badge: null },
    },
    proof: [
      { name: "Antônio, 57", text: "Activé el Doble y al día siguiente cayeron $8 en la cuenta. Si hubiera esperado los 7 días, ya habría abandonado." },
      { name: "Doña Márcia, 52", text: "El especialista me ayudó a configurar todo en 10 minutos. La primera vez que me sentí segura con algo en internet." },
    ],
  },
};

const UpsellStep3 = ({ name, onNext, onDecline }: Props) => {
  const { lang } = useLanguage();
  const c = L[lang];
  const firstName = name !== "Visitante" ? name : "";
  const [loading, setLoading] = useState<string | null>(null);
  const [showGuar, setShowGuar] = useState(false);

  const isV147 = (() => {
    try {
      const u = new URLSearchParams(window.location.search);
      const forced = u.get("oferta") === "147" || u.get("offer") === "v147";
      if (forced) { try { localStorage.setItem("offer_exp", "v147"); } catch { /* ignore */ } return true; }
      return localStorage.getItem("offer_exp") === "v147";
    } catch { return false; }
  })();

  const openCheckout = (id: string, price: number, url: string) => {
    setLoading(id);
    saveUpsellChoice({ accelerator: id, guide: false, price });
    const utmQs = buildTrackingQueryString();
    const separator = url.includes("?") ? "&" : "?";
    const fullUrl = utmQs ? `${url}${separator}${utmQs.slice(1)}` : url;
    window.open(fullUrl, "_blank");
    setTimeout(() => setLoading(null), 3000);
  };

  // ───────────────────────── VARIAÇÃO CARA (v147) ─────────────────────────
  if (isV147) {
    const tiers = BASE_TIERS.map(b => ({ ...b, ...(c.tiers as any)[b.id] }));
    return (
      <div className="flex flex-col gap-5 pt-3">
        {/* Headline */}
        <div className="text-center">
          <h1 className="text-[24px] font-extrabold leading-tight" style={{ color: "#F8FAFC" }}>{c.v_head(firstName)}</h1>
          <p className="text-[14px] mt-2 leading-relaxed" style={{ color: "#94A3B8" }}>
            {c.v_sub} <b style={{ color: "#E2E8F0" }}>{c.v_subBold}</b>
          </p>
          <div className="mt-3 flex flex-col gap-1.5 text-left mx-auto max-w-[340px]">
            <p className="text-[12.5px] leading-snug" style={{ color: "#94A3B8" }}>
              <b style={{ color: "#64748B" }}>{c.v_noBoost}</b>{c.v_noBoostTxt}
            </p>
            <p className="text-[12.5px] leading-snug" style={{ color: "#CBD5E1" }}>
              <b style={{ color: "#22C55E" }}>{c.v_boost}</b>{c.v_boostTxt}
            </p>
          </div>
          <p className="text-[11px] mt-2.5" style={{ color: "#64748B" }}>{c.v_micro}</p>
        </div>

        {/* TABELA COMPARATIVA */}
        <div className="rounded-2xl overflow-hidden" style={{ background: "#0B1220", border: "1px solid rgba(255,255,255,0.06)" }}>
          <table className="w-full border-collapse" style={{ tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: "29%" }} /><col style={{ width: "15%" }} />
              <col style={{ width: "18%" }} /><col style={{ width: "19%" }} /><col style={{ width: "19%" }} />
            </colgroup>
            <thead>
              <tr>
                <th className="text-left px-1.5 py-2" style={{ background: "#0B1220" }}></th>
                {c.cols.map((col, i) => {
                  const rec = i === 2, max = i === 3, free = i === 0;
                  return (
                    <th key={col} className="px-0.5 py-2 text-center align-bottom"
                      style={{ background: rec ? "rgba(34,197,94,0.10)" : max ? "rgba(250,204,21,0.08)" : "transparent" }}>
                      {rec && <div className="text-[7px] font-bold mb-0.5 leading-none" style={{ color: "#22C55E" }}>{c.tblBest}</div>}
                      {max && <div className="text-[7px] font-bold mb-0.5 leading-none" style={{ color: "#FACC15" }}>{c.tblTop}</div>}
                      <span className="text-[11px] font-extrabold" style={{ color: free ? "#475569" : rec ? "#22C55E" : max ? "#FACC15" : "#E2E8F0" }}>{col}</span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {c.rows.map((row, ri) => {
                const Icon = TABLE_ICONS[ri];
                return (
                  <tr key={row.label} style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                    <td className="px-1.5 py-1.5" style={{ background: "#0B1220" }}>
                      <div className="flex items-center gap-1">
                        <Icon className="w-3 h-3 shrink-0" style={{ color: "#475569" }} />
                        <span className="text-[9.5px] font-medium leading-tight" style={{ color: "#94A3B8" }}>{row.label}</span>
                      </div>
                    </td>
                    {row.vals.map((v, ci) => {
                      const rec = ci === 2, max = ci === 3, free = ci === 0;
                      const strong = ri === 0;
                      return (
                        <td key={ci} className="px-0.5 py-1.5 text-center"
                          style={{ background: rec ? "rgba(34,197,94,0.07)" : max ? "rgba(250,204,21,0.05)" : "transparent" }}>
                          <span style={{ color: free ? "#475569" : strong ? (rec ? "#22C55E" : max ? "#FACC15" : "#F8FAFC") : (rec ? "#86EFAC" : max ? "#FDE68A" : "#CBD5E1"),
                                     fontWeight: strong ? 800 : 700, fontSize: strong ? 12 : 9.5, lineHeight: 1.15, display: "inline-block" }}>
                            {v}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Uma linha */}
        <p className="text-[13px] text-center leading-relaxed px-2" style={{ color: "#CBD5E1" }}>
          {lang === "pt" && <>De <b style={{ color: "#475569" }}>vinte e cinco</b> por dia pra <b style={{ color: "#86EFAC" }}>trezentos</b>, <b style={{ color: "#86EFAC" }}>setecentos</b> ou <b style={{ color: "#FDE68A" }}>mil e duzentos</b>. A diferença é a velocidade. <b style={{ color: "#F8FAFC" }}>O risco não sobe.</b></>}
          {lang === "en" && <>From <b style={{ color: "#475569" }}>five</b> a day to <b style={{ color: "#86EFAC" }}>sixty</b>, <b style={{ color: "#86EFAC" }}>a hundred forty</b> or <b style={{ color: "#FDE68A" }}>two hundred forty</b>. The difference is speed. <b style={{ color: "#F8FAFC" }}>The risk doesn't go up.</b></>}
          {lang === "es" && <>De <b style={{ color: "#475569" }}>cinco</b> por día a <b style={{ color: "#86EFAC" }}>sesenta</b>, <b style={{ color: "#86EFAC" }}>ciento cuarenta</b> o <b style={{ color: "#FDE68A" }}>doscientos cuarenta</b>. La diferencia es la velocidad. <b style={{ color: "#F8FAFC" }}>El riesgo no sube.</b></>}
        </p>

        {/* 4 linhas */}
        <div className="rounded-xl p-3.5 flex flex-col gap-2" style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(34,197,94,0.15)" }}>
          {c.fourLines.map((l, i) => (
            <div key={i} className="flex items-start gap-2">
              <Check className="w-4 h-4 shrink-0 mt-[1px]" style={{ color: "#22C55E" }} />
              <span className="text-[12.5px] leading-snug" style={{ color: "#E2E8F0" }}>{l}</span>
            </div>
          ))}
        </div>

        {/* CARDS */}
        {tiers.map((t, i) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="relative rounded-2xl p-5"
            style={{
              background: t.recommended ? "linear-gradient(180deg, rgba(22,163,74,0.08), #0F172A)" : "#0F172A",
              border: t.recommended ? "2px solid #22C55E" : t.accent === "#FACC15" ? "1.5px solid rgba(250,204,21,0.35)" : "1px solid rgba(255,255,255,0.08)",
              boxShadow: t.recommended ? "0 8px 30px rgba(22,163,74,0.15)" : "none",
            }}
          >
            {t.badge && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-bold px-4 py-1 rounded-full whitespace-nowrap"
                style={{ background: t.recommended ? "linear-gradient(135deg, #16A34A, #15803D)" : "linear-gradient(135deg, #FACC15, #EAB308)", color: t.recommended ? "#fff" : "#020617", boxShadow: t.recommended ? "0 2px 10px rgba(22,163,74,0.4)" : "0 2px 10px rgba(250,204,21,0.35)" }}>
                {t.badge}
              </span>
            )}
            <div className="flex items-center gap-2">
              {t.accent === "#FACC15" ? <Crown className="w-5 h-5" style={{ color: "#FACC15" }} /> : <Zap className="w-5 h-5" style={{ color: "#22C55E" }} />}
              <h3 className="text-[18px] font-extrabold" style={{ color: "#F8FAFC" }}>{t.tag}</h3>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-[30px] font-extrabold leading-none" style={{ color: t.accent }}>{t.perDay}</span>
              <span className="text-[13px]" style={{ color: "#94A3B8" }}>{t.perDayLabel}</span>
            </div>
            <p className="text-[12.5px] font-semibold mt-1" style={{ color: t.accent }}>{t.headline}</p>
            <p className="text-[13px] mt-3 leading-relaxed" style={{ color: "#94A3B8" }}>{t.body}</p>
            <ul className="mt-3 flex flex-col gap-2">
              {t.bullets.map((b: string) => (
                <li key={b} className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 shrink-0 mt-[2px]" style={{ color: t.accent }} />
                  <span className="text-[12.5px] leading-snug" style={{ color: "#E2E8F0" }}>{b}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-baseline gap-2 flex-wrap">
              <span className="text-[26px] font-extrabold" style={{ color: "#F8FAFC" }}>{t.priceDisplay}</span>
              <span className="text-[12px]" style={{ color: "#64748B" }}>{c.orWord} {t.installments}</span>
            </div>
            {t.diffLine && <p className="text-[11px] mt-0.5 font-medium" style={{ color: "#FDE68A" }}>{t.diffLine}</p>}
            <p className="text-[11px] mt-1 flex items-center gap-1.5" style={{ color: "#64748B" }}>
              <Shield className="w-3.5 h-3.5" style={{ color: "#22C55E" }} /> {c.guaranteeShort}
            </p>
            <button
              onClick={() => openCheckout(t.id, t.price, t.checkoutUrl)}
              disabled={loading === t.id}
              className="w-full mt-4 py-[15px] rounded-xl font-bold text-[14px] transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-70 leading-tight"
              style={{ background: t.btnBg, color: t.btnColor, border: t.btnBorder }}
            >
              {loading === t.id ? c.opening : t.cta}
            </button>
          </motion.div>
        ))}

        {/* FECHO */}
        <div className="rounded-xl p-4 text-center" style={{ background: "rgba(22,163,74,0.06)", border: "1px solid rgba(34,197,94,0.2)" }}>
          <p className="text-[13.5px] leading-relaxed" style={{ color: "#E2E8F0" }}>
            {c.fechoA}<b style={{ color: "#22C55E" }}>{c.fechoABold}</b>{c.fechoAEnd}
          </p>
          <p className="text-[13.5px] leading-relaxed mt-1.5" style={{ color: "#CBD5E1" }}>
            {c.fechoB}<b style={{ color: "#FACC15" }}>{c.fechoBBold}</b>{c.fechoBEnd}
          </p>
        </div>

        {/* Garantia (toggle) */}
        <button onClick={() => setShowGuar(v => !v)} className="text-[13px] underline cursor-pointer bg-transparent border-none mx-auto py-1" style={{ color: "#94A3B8" }}>
          {c.guarBtn}
        </button>
        {showGuar && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="rounded-xl p-4 -mt-2" style={{ background: "#0F172A", border: "1px solid rgba(34,197,94,0.25)" }}>
            <div className="flex items-start gap-3">
              <Shield className="w-6 h-6 shrink-0" style={{ color: "#22C55E" }} />
              <div>
                <p className="text-[13px] font-bold" style={{ color: "#F8FAFC" }}>{c.guarTitle}</p>
                <p className="text-[12.5px] leading-relaxed mt-1" style={{ color: "#94A3B8" }}>
                  {c.guarA}<b style={{ color: "#22C55E" }}>{c.guarBold}</b>{c.guarB}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        <button onClick={onDecline} className="text-[12px] underline cursor-pointer bg-transparent border-none mx-auto py-2" style={{ color: "#475569" }}>
          {c.v_decline}
        </button>
      </div>
    );
  }

  // ───────────────────────── VARIAÇÃO NORMAL (37/67/97) ─────────────────────────
  const plans = BASE_PLANS.map(b => ({ ...b, ...(c.plans as any)[b.id] }));
  return (
    <>
    <div className="flex flex-col gap-5 pt-4">
      <div className="text-center">
        <h1 className="text-[22px] font-extrabold leading-tight" style={{ color: "#F8FAFC" }}>{c.n_head(firstName)}</h1>
        <p className="text-[14px] mt-2 leading-relaxed" style={{ color: "#94A3B8" }}>{c.n_sub}</p>
      </div>

      {plans.map((plan, i) => (
        <motion.div
          key={plan.id}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.12 }}
          className="relative rounded-2xl p-5"
          style={{ background: "#0F172A", border: plan.border }}
        >
          {plan.badge && (
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-bold px-4 py-1 rounded-full text-white whitespace-nowrap" style={{ background: "linear-gradient(135deg, #16A34A, #15803D)", boxShadow: "0 2px 8px rgba(22,163,74,0.3)" }}>
              {plan.badge}
            </span>
          )}
          <h3 className="text-[17px] font-bold" style={{ color: "#F8FAFC" }}>{plan.name}</h3>
          <p className="text-[13px] font-medium mt-1" style={{ color: plan.subtitleColor }}>{plan.subtitle}</p>
          <p className="text-[13px] mt-3 leading-relaxed" style={{ color: "#94A3B8" }}>{plan.description}</p>
          <ul className="mt-3 flex flex-col gap-2">
            {plan.features.map((text: string, fi: number) => {
              const Icon = plan.icons[fi] || Check;
              return (
                <li key={text} className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 shrink-0" style={{ color: "#22C55E" }} />
                  <span className="text-[13px]" style={{ color: "#E2E8F0" }}>{text}</span>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-[28px] font-extrabold" style={{ color: "#F8FAFC" }}>{plan.priceDisplay}</span>
            <span className="text-[12px]" style={{ color: "#64748B" }}>{c.orWord} {plan.installments}</span>
          </div>
          <button
            onClick={() => openCheckout(plan.id, plan.price, plan.checkoutUrl)}
            disabled={loading === plan.id}
            className="w-full mt-4 py-[14px] rounded-xl font-bold text-[15px] transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-70"
            style={{ background: plan.btnBg, color: plan.btnColor, border: plan.btnBorder }}
          >
            {loading === plan.id ? c.opening : plan.btnText}
          </button>
        </motion.div>
      ))}

      {/* Social proof */}
      <div className="rounded-xl p-4" style={{ background: "rgba(30,41,59,0.6)", border: "1px solid rgba(255,255,255,0.04)" }}>
        <p className="text-[14px] font-bold mb-3" style={{ color: "#E2E8F0" }}>{c.n_proof}</p>
        {[{ img: avatarAntonio, ...c.proof[0] }, { img: avatarMaria, ...c.proof[1] }].map((t) => (
          <div key={t.name} className="flex items-start gap-3 mt-3">
            <img src={t.img} alt={t.name} className="w-10 h-10 rounded-full object-cover shrink-0" style={{ border: "2px solid rgba(22,163,74,0.3)" }} />
            <div>
              <p className="text-[13px] font-semibold" style={{ color: "#E2E8F0" }}>{t.name}</p>
              <p className="text-[12px] italic leading-relaxed mt-0.5" style={{ color: "#94A3B8" }}>"{t.text}"</p>
            </div>
          </div>
        ))}
      </div>

      <button onClick={onDecline} className="text-[12px] underline cursor-pointer bg-transparent border-none mx-auto py-2" style={{ color: "#475569" }}>
        {c.n_decline}
      </button>
    </div>
    </>
  );
};

export default UpsellStep3;
