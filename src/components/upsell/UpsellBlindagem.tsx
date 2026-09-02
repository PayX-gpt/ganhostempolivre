import { useState } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck, Check, Lock, RefreshCw, XCircle, CheckCircle2,
  Crown, Clock, ChevronRight, ShieldOff, ShieldAlert,
} from "lucide-react";
import { saveUpsellExtras } from "@/lib/upsellData";
import { saveFunnelEvent } from "@/lib/metricsClient";
import { logAuditEvent } from "@/hooks/useAuditLog";
import { buildTrackingQueryString } from "@/lib/trackingDataLayer";
import { useLanguage } from "@/lib/i18n";

import mentorPhoto from "@/assets/mentor-new.webp";
import avatarAntonio from "@/assets/avatar-antonio.jpg";
import avatarClaudia from "@/assets/avatar-claudia.jpg";

interface Props { name: string; onNext: () => void; onDecline: () => void; }

// Base (independente de idioma): preço REAL cobrado, cor, link.
const BASE_PLANS = [
  { id: "extensao" as const, price: 67, color: "#64748B", checkoutUrl: "https://pay.hub.la/0Q77oXAu8QkVUTwHYm20/upsell" },
  { id: "vitalicio" as const, price: 127, color: "#22C55E", checkoutUrl: "https://pay.hub.la/uAAU42mMeJpoJYyfwbzb/upsell" },
  { id: "vip" as const, price: 197, color: "#FACC15", checkoutUrl: "https://pay.hub.la/VsknPAXdimoqr8jsOW03/upsell" },
];

const TEXTS = {
  pt: {
    heroTitle: (n: string) => (n ? `${n}, seu acesso expira em` : "Seu acesso expira em"),
    heroValue: "6 meses",
    tlToday: "HOJE", tlExpire: "EXPIRAÇÃO", tlActive: "Ativo", tl3: "3 meses", tlOff: "Desativado",
    lose: ["Conta desativada permanentemente", "Ganhos acumulados perdidos", "Sem possibilidade de reativação"],
    atRiskTitle: "Em risco de perda:",
    atRisk: ["Plataforma de Ganhos", "Acelerador Ativado", "Multiplicador de Lucros"],
    whyTitle: "Por que isso acontece?",
    why1a: "A Plataforma de Ganhos com Tempo Livre opera através de ", why1b: "parcerias estratégicas com instituições financeiras e provedores de dados de mercado", why1c: ".",
    why2a: "Esses acordos são renovados a cada seis meses e, por razões contratuais, ", why2b: "não podemos garantir o acesso além de 6 meses", why2c: " para contas com plano padrão.",
    why3a: "Imagine: você passou 6 meses construindo resultados consistentes, seu sistema operando perfeitamente... ", why3b: "e de repente: acesso encerrado.",
    negTitle: "Negociação exclusiva para membros fundadores",
    neg1a: "Ricardo Almeida negociou pessoalmente um acordo especial com os parceiros para permitir que ", neg1b: "membros fundadores", neg1c: " — como você, que está entrando agora — possam ativar uma ", neg1d: "blindagem permanente no acesso", neg1e: ".",
    neg2a: "Com essa blindagem, seu sistema ", neg2b: "nunca será desativado", neg2c: ". Todas as atualizações, melhorias e novas estratégias chegam na sua conta automaticamente.",
    neg3: "Essa condição só está disponível agora, nesta página.",
    solKicker: "A solução", solTitle: "Blindagem de Acesso", solSub: "Escolha o nível de proteção e nunca mais se preocupe com a expiração do seu sistema.",
    tapCompare: "Toque para comparar os planos:", popular: "POPULAR", processing: "Processando...",
    oneTime: "Pagamento único · Sem mensalidade · Sem surpresa",
    compareTitle: "Comparação rápida",
    compareCols: ["Extensão", "Vitalício", "VIP"],
    compareRows: [
      { label: "Duração", vals: ["18 meses", "∞", "∞"] },
      { label: "Atualizações", vals: ["—", "✓", "✓"] },
      { label: "Suporte WhatsApp", vals: ["—", "—", "✓"] },
      { label: "Novos recursos", vals: ["—", "—", "✓"] },
    ],
    secure: "100% seguro", guarantee: "Garantia 30 dias",
    decline: "Não, prefiro arriscar perder meu acesso em 6 meses.",
    plans: {
      extensao: { label: "Extensão", totalAccess: "18 meses no total", priceDisplay: "R$ 67", installments: "6x de R$ 12,90", header: "Extensão 12 Meses", cta: "ATIVAR EXTENSÃO",
        features: ["+12 meses de acesso", "Proteção temporária", "Suporte por e-mail"], missing: ["Atualizações futuras", "Suporte prioritário", "Recursos antecipados"], warning: "Expira de novo após 18 meses" },
      vitalicio: { label: "Vitalício", totalAccess: "Acesso permanente", priceDisplay: "R$ 127", installments: "12x de R$ 12,42", header: "Acesso Vitalício", cta: "BLINDAR MEU ACESSO PARA SEMPRE",
        features: ["Acesso vitalício", "Atualizações automáticas", "Proteção permanente", "Novas estratégias incluídas"], missing: ["Suporte prioritário", "Recursos antecipados"], warning: null },
      vip: { label: "VIP", totalAccess: "Acesso premium vitalício", priceDisplay: "R$ 197", installments: "12x de R$ 19,25", header: "Vitalício VIP", cta: "ATIVAR VIP COMPLETO",
        features: ["Acesso vitalício", "Atualizações automáticas", "Proteção permanente", "Novas estratégias incluídas", "Suporte prioritário WhatsApp", "Acesso antecipado a recursos"], missing: [], warning: null },
    },
    proof: [
      { name: "Antônio, 57", text: "Ativei o vitalício na hora. Não faz sentido investir tanto tempo e perder tudo em 6 meses." },
      { name: "Cláudia, 49", text: "Ia pegar só a extensão, mas pensei: vou ter que passar por isso de novo? Peguei o vitalício." },
    ],
  },
  en: {
    heroTitle: (n: string) => (n ? `${n}, your access expires in` : "Your access expires in"),
    heroValue: "6 months",
    tlToday: "TODAY", tlExpire: "EXPIRES", tlActive: "Active", tl3: "3 months", tlOff: "Off",
    lose: ["Account permanently deactivated", "Accumulated earnings lost", "No way to reactivate"],
    atRiskTitle: "At risk of losing:",
    atRisk: ["Earnings Platform", "Activated Accelerator", "Profit Multiplier"],
    whyTitle: "Why does this happen?",
    why1a: "The Free-Time Earnings Platform operates through ", why1b: "strategic partnerships with financial institutions and market data providers", why1c: ".",
    why2a: "These agreements are renewed every six months and, for contractual reasons, ", why2b: "we can't guarantee access beyond 6 months", why2c: " for standard-plan accounts.",
    why3a: "Picture this: you spent 6 months building consistent results, your system running perfectly... ", why3b: "and suddenly: access ended.",
    negTitle: "Exclusive deal for founding members",
    neg1a: "Ricardo Almeida personally negotiated a special deal with the partners to let ", neg1b: "founding members", neg1c: " — like you, joining right now — activate ", neg1d: "permanent access protection", neg1e: ".",
    neg2a: "With this protection, your system ", neg2b: "will never be deactivated", neg2c: ". All updates, improvements and new strategies land in your account automatically.",
    neg3: "This condition is only available now, on this page.",
    solKicker: "The solution", solTitle: "Access Protection", solSub: "Choose your level of protection and never worry about your system expiring again.",
    tapCompare: "Tap to compare the plans:", popular: "POPULAR", processing: "Processing...",
    oneTime: "One-time payment · No monthly fee · No surprises",
    compareTitle: "Quick comparison",
    compareCols: ["Extension", "Lifetime", "VIP"],
    compareRows: [
      { label: "Duration", vals: ["18 months", "∞", "∞"] },
      { label: "Updates", vals: ["—", "✓", "✓"] },
      { label: "WhatsApp support", vals: ["—", "—", "✓"] },
      { label: "New features", vals: ["—", "—", "✓"] },
    ],
    secure: "100% secure", guarantee: "30-day guarantee",
    decline: "No, I'd rather risk losing my access in 6 months.",
    plans: {
      extensao: { label: "Extension", totalAccess: "18 months total", priceDisplay: "$13", installments: "6x $2.50", header: "12-Month Extension", cta: "ACTIVATE EXTENSION",
        features: ["+12 months of access", "Temporary protection", "Email support"], missing: ["Future updates", "Priority support", "Early features"], warning: "Expires again after 18 months" },
      vitalicio: { label: "Lifetime", totalAccess: "Permanent access", priceDisplay: "$25", installments: "12x $2.40", header: "Lifetime Access", cta: "PROTECT MY ACCESS FOREVER",
        features: ["Lifetime access", "Automatic updates", "Permanent protection", "New strategies included"], missing: ["Priority support", "Early features"], warning: null },
      vip: { label: "VIP", totalAccess: "Lifetime premium access", priceDisplay: "$39", installments: "12x $3.70", header: "Lifetime VIP", cta: "ACTIVATE FULL VIP",
        features: ["Lifetime access", "Automatic updates", "Permanent protection", "New strategies included", "Priority WhatsApp support", "Early access to features"], missing: [], warning: null },
    },
    proof: [
      { name: "Antônio, 57", text: "I activated lifetime right away. Doesn't make sense to invest so much time and lose it all in 6 months." },
      { name: "Cláudia, 49", text: "I was going to get just the extension, but I thought: will I have to go through this again? I got lifetime." },
    ],
  },
  es: {
    heroTitle: (n: string) => (n ? `${n}, tu acceso expira en` : "Tu acceso expira en"),
    heroValue: "6 meses",
    tlToday: "HOY", tlExpire: "EXPIRA", tlActive: "Activo", tl3: "3 meses", tlOff: "Desactivado",
    lose: ["Cuenta desactivada permanentemente", "Ganancias acumuladas perdidas", "Sin posibilidad de reactivación"],
    atRiskTitle: "En riesgo de perder:",
    atRisk: ["Plataforma de Ganancias", "Acelerador Activado", "Multiplicador de Ganancias"],
    whyTitle: "¿Por qué pasa esto?",
    why1a: "La Plataforma de Ganancias con Tiempo Libre opera a través de ", why1b: "alianzas estratégicas con instituciones financieras y proveedores de datos de mercado", why1c: ".",
    why2a: "Estos acuerdos se renuevan cada seis meses y, por razones contractuales, ", why2b: "no podemos garantizar el acceso más allá de 6 meses", why2c: " para cuentas con plan estándar.",
    why3a: "Imagina: pasaste 6 meses construyendo resultados consistentes, tu sistema operando perfecto... ", why3b: "y de repente: acceso cerrado.",
    negTitle: "Negociación exclusiva para miembros fundadores",
    neg1a: "Ricardo Almeida negoció personalmente un acuerdo especial con los socios para permitir que los ", neg1b: "miembros fundadores", neg1c: " — como tú, que estás entrando ahora — puedan activar un ", neg1d: "blindaje permanente del acceso", neg1e: ".",
    neg2a: "Con este blindaje, tu sistema ", neg2b: "nunca será desactivado", neg2c: ". Todas las actualizaciones, mejoras y nuevas estrategias llegan a tu cuenta automáticamente.",
    neg3: "Esta condición solo está disponible ahora, en esta página.",
    solKicker: "La solución", solTitle: "Blindaje de Acceso", solSub: "Elige tu nivel de protección y nunca más te preocupes por la expiración de tu sistema.",
    tapCompare: "Toca para comparar los planes:", popular: "POPULAR", processing: "Procesando...",
    oneTime: "Pago único · Sin mensualidad · Sin sorpresas",
    compareTitle: "Comparación rápida",
    compareCols: ["Extensión", "Vitalicio", "VIP"],
    compareRows: [
      { label: "Duración", vals: ["18 meses", "∞", "∞"] },
      { label: "Actualizaciones", vals: ["—", "✓", "✓"] },
      { label: "Soporte WhatsApp", vals: ["—", "—", "✓"] },
      { label: "Nuevos recursos", vals: ["—", "—", "✓"] },
    ],
    secure: "100% seguro", guarantee: "Garantía 30 días",
    decline: "No, prefiero arriesgarme a perder mi acceso en 6 meses.",
    plans: {
      extensao: { label: "Extensión", totalAccess: "18 meses en total", priceDisplay: "$13", installments: "6x $2,50", header: "Extensión 12 Meses", cta: "ACTIVAR EXTENSIÓN",
        features: ["+12 meses de acceso", "Protección temporal", "Soporte por e-mail"], missing: ["Actualizaciones futuras", "Soporte prioritario", "Recursos anticipados"], warning: "Expira de nuevo después de 18 meses" },
      vitalicio: { label: "Vitalicio", totalAccess: "Acceso permanente", priceDisplay: "$25", installments: "12x $2,40", header: "Acceso Vitalicio", cta: "BLINDAR MI ACCESO PARA SIEMPRE",
        features: ["Acceso vitalicio", "Actualizaciones automáticas", "Protección permanente", "Nuevas estrategias incluidas"], missing: ["Soporte prioritario", "Recursos anticipados"], warning: null },
      vip: { label: "VIP", totalAccess: "Acceso premium vitalicio", priceDisplay: "$39", installments: "12x $3,70", header: "Vitalicio VIP", cta: "ACTIVAR VIP COMPLETO",
        features: ["Acceso vitalicio", "Actualizaciones automáticas", "Protección permanente", "Nuevas estrategias incluidas", "Soporte prioritario WhatsApp", "Acceso anticipado a recursos"], missing: [], warning: null },
    },
    proof: [
      { name: "Antônio, 57", text: "Activé el vitalicio al instante. No tiene sentido invertir tanto tiempo y perder todo en 6 meses." },
      { name: "Cláudia, 49", text: "Iba a comprar solo la extensión, pero pensé: ¿voy a tener que pasar por esto de nuevo? Compré el vitalicio." },
    ],
  },
};

const UpsellBlindagem = ({ name, onNext, onDecline }: Props) => {
  const { lang } = useLanguage();
  const t = TEXTS[lang];
  const firstName = name !== "Visitante" ? name : "";
  const [selectedPlan, setSelectedPlan] = useState<string>("vitalicio");
  const [loading, setLoading] = useState(false);

  const plans = BASE_PLANS.map(b => ({ ...b, ...(t.plans as any)[b.id] }));
  const activePlan = plans.find((p) => p.id === selectedPlan)!;

  const handleBuy = () => {
    setLoading(true);
    saveUpsellExtras("blindagem", { price: activePlan.price, plan: activePlan.id });
    saveFunnelEvent("upsell_oneclick_buy", { page: "/upsell3", product: `blindagem_${activePlan.id}`, price: activePlan.price });
    logAuditEvent({ eventType: "upsell_oneclick_buy", pageId: "/upsell3", metadata: { product: `blindagem_${activePlan.id}`, price: activePlan.price } });
    const utmQs = buildTrackingQueryString();
    const separator = activePlan.checkoutUrl.includes("?") ? "&" : "?";
    const fullUrl = utmQs ? `${activePlan.checkoutUrl}${separator}${utmQs.slice(1)}` : activePlan.checkoutUrl;
    window.open(fullUrl, "_blank");
    setTimeout(() => setLoading(false), 3000);
  };

  return (
    <>
    <div className="flex flex-col gap-0 pt-2">

      {/* HERO */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative rounded-3xl overflow-hidden p-6 pb-8"
        style={{ background: "linear-gradient(180deg, rgba(239,68,68,0.12) 0%, rgba(15,23,42,0.95) 100%)", border: "1px solid rgba(239,68,68,0.2)" }}>
        <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.25)" }}>
          <ShieldOff className="w-8 h-8" style={{ color: "#EF4444" }} />
        </motion.div>

        <h1 className="text-[20px] font-extrabold text-center leading-tight" style={{ color: "#F8FAFC" }}>{t.heroTitle(firstName)}</h1>
        <p className="text-center text-[42px] font-black mt-1" style={{ color: "#EF4444", letterSpacing: "-1px" }}>{t.heroValue}</p>

        <div className="mt-5 mx-2">
          <div className="flex justify-between text-[10px] font-semibold mb-1.5" style={{ color: "#64748B" }}>
            <span>{t.tlToday}</span><span style={{ color: "#EF4444" }}>{t.tlExpire}</span>
          </div>
          <div className="relative h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
            <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 2, ease: "easeOut", delay: 0.5 }}
              className="absolute inset-y-0 left-0 rounded-full" style={{ background: "linear-gradient(90deg, #22C55E 0%, #FACC15 50%, #EF4444 100%)" }} />
          </div>
          <div className="flex justify-between text-[10px] mt-1.5" style={{ color: "#475569" }}>
            <span>{t.tlActive}</span><span>{t.tl3}</span><span>{t.tlOff}</span>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-1.5">
          {t.lose.map((txt, i) => (
            <motion.div key={txt} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.5 + i * 0.15 }} className="flex items-center gap-2">
              <XCircle className="w-3.5 h-3.5 shrink-0" style={{ color: "#EF4444" }} />
              <span className="text-[12px]" style={{ color: "#F87171" }}>{txt}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Active items pill */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="mx-4 -mt-4 rounded-2xl p-4 relative z-10" style={{ background: "#0F172A", border: "1px solid rgba(34,197,94,0.15)", boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }}>
        <p className="text-[10px] uppercase tracking-widest font-bold mb-2.5" style={{ color: "#22C55E" }}>{t.atRiskTitle}</p>
        <div className="grid grid-cols-1 gap-1.5">
          {t.atRisk.map((item) => (
            <div key={item} className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: "#22C55E" }} />
              <span className="text-[12px] font-medium" style={{ color: "#CBD5E1" }}>{item}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Why */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="mt-6 mx-1 rounded-2xl p-5" style={{ background: "rgba(15,23,42,0.9)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <p className="text-[15px] font-bold mb-3" style={{ color: "#F59E0B" }}>{t.whyTitle}</p>
        <p className="text-[13px] leading-relaxed" style={{ color: "#94A3B8" }}>{t.why1a}<strong style={{ color: "#F8FAFC" }}>{t.why1b}</strong>{t.why1c}</p>
        <p className="text-[13px] leading-relaxed mt-3" style={{ color: "#94A3B8" }}>{t.why2a}<strong style={{ color: "#EF4444" }}>{t.why2b}</strong>{t.why2c}</p>
        <p className="text-[13px] leading-relaxed mt-3" style={{ color: "#94A3B8" }}>{t.why3a}<strong style={{ color: "#EF4444" }}>{t.why3b}</strong></p>
      </motion.div>

      {/* Negotiation */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="mt-4 mx-1 rounded-2xl p-5" style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.08), rgba(59,130,246,0.02))", border: "1px solid rgba(59,130,246,0.15)" }}>
        <div className="flex items-start gap-3">
          <img src={mentorPhoto} alt="Ricardo Almeida" className="w-11 h-11 rounded-full object-cover shrink-0" style={{ border: "2px solid rgba(59,130,246,0.3)" }} />
          <div>
            <p className="text-[14px] font-bold" style={{ color: "#F8FAFC" }}>{t.negTitle}</p>
            <p className="text-[13px] leading-relaxed mt-2" style={{ color: "#94A3B8" }}>
              {t.neg1a}<strong style={{ color: "#60A5FA" }}>{t.neg1b}</strong>{t.neg1c}<strong style={{ color: "#F8FAFC" }}>{t.neg1d}</strong>{t.neg1e}
            </p>
            <p className="text-[13px] leading-relaxed mt-2" style={{ color: "#94A3B8" }}>
              {t.neg2a}<strong style={{ color: "#F8FAFC" }}>{t.neg2b}</strong>{t.neg2c}
            </p>
            <p className="text-[12px] font-semibold mt-3" style={{ color: "#F59E0B" }}>{t.neg3}</p>
          </div>
        </div>
      </motion.div>

      {/* Solution */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-center mt-8 px-2">
        <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: "linear-gradient(135deg, #3B82F6, #1D4ED8)", boxShadow: "0 0 30px rgba(59,130,246,0.3)" }}>
          <ShieldCheck className="w-6 h-6 text-white" />
        </div>
        <p className="text-[11px] uppercase tracking-widest font-bold" style={{ color: "#3B82F6" }}>{t.solKicker}</p>
        <h2 className="text-[22px] font-extrabold mt-1 leading-tight" style={{ color: "#F8FAFC" }}>{t.solTitle}</h2>
        <p className="text-[13px] mt-2 leading-relaxed" style={{ color: "#94A3B8" }}>{t.solSub}</p>
      </motion.div>

      {/* Selector */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mt-6 mx-1">
        <p className="text-[11px] text-center mb-2 font-medium" style={{ color: "#64748B" }}>{t.tapCompare}</p>
        <div className="flex rounded-2xl p-1.5 gap-1" style={{ background: "#0F172A", border: "1px solid rgba(255,255,255,0.06)" }}>
          {plans.map((plan) => {
            const isActive = selectedPlan === plan.id;
            return (
              <motion.button key={plan.id} onClick={() => setSelectedPlan(plan.id)} whileTap={{ scale: 0.95 }}
                className="flex-1 py-3 rounded-xl text-center transition-all relative cursor-pointer"
                style={{
                  background: isActive ? (plan.id === "vitalicio" ? "linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.05))" : plan.id === "vip" ? "linear-gradient(135deg, rgba(250,204,21,0.15), rgba(250,204,21,0.05))" : "rgba(255,255,255,0.08)") : "rgba(255,255,255,0.03)",
                  border: isActive ? `1.5px solid ${plan.color}` : "1.5px solid rgba(255,255,255,0.08)",
                  boxShadow: isActive ? `0 0 12px ${plan.color}15` : "none",
                }}>
                {plan.id === "vitalicio" && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[8px] font-bold px-2 py-0.5 rounded-full text-white whitespace-nowrap" style={{ background: "#16A34A", letterSpacing: "0.5px" }}>{t.popular}</span>
                )}
                <p className="text-[13px] font-bold" style={{ color: isActive ? plan.color : "#94A3B8" }}>{plan.label}</p>
                <p className="text-[10px] mt-0.5 font-medium" style={{ color: isActive ? "#CBD5E1" : "#64748B" }}>{plan.priceDisplay}</p>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Selected plan detail */}
      <motion.div key={selectedPlan} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="mt-4 mx-1">
        <div className="rounded-2xl overflow-hidden" style={{ border: `1.5px solid ${activePlan.color}33` }}>
          <div className="px-5 py-4 flex items-center justify-between"
            style={{ background: activePlan.id === "vitalicio" ? "linear-gradient(135deg, rgba(34,197,94,0.1), rgba(34,197,94,0.03))" : activePlan.id === "vip" ? "linear-gradient(135deg, rgba(250,204,21,0.1), rgba(250,204,21,0.03))" : "rgba(255,255,255,0.02)" }}>
            <div>
              <div className="flex items-center gap-2">
                {activePlan.id === "extensao" && <Clock className="w-5 h-5" style={{ color: activePlan.color }} />}
                {activePlan.id === "vitalicio" && <ShieldCheck className="w-5 h-5" style={{ color: activePlan.color }} />}
                {activePlan.id === "vip" && <Crown className="w-5 h-5" style={{ color: activePlan.color }} />}
                <h3 className="text-[17px] font-bold" style={{ color: "#F8FAFC" }}>{activePlan.header}</h3>
              </div>
              <p className="text-[12px] mt-0.5" style={{ color: "#94A3B8" }}>{activePlan.totalAccess}</p>
            </div>
            <div className="text-right">
              <span className="text-[26px] font-extrabold" style={{ color: "#F8FAFC" }}>{activePlan.priceDisplay}</span>
              <p className="text-[10px]" style={{ color: "#64748B" }}>{activePlan.installments}</p>
            </div>
          </div>

          <div className="px-5 py-4" style={{ background: "#0F172A" }}>
            <div className="flex flex-col gap-2.5">
              {activePlan.features.map((f: string) => (
                <div key={f} className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: `${activePlan.color}15` }}>
                    <Check className="w-3 h-3" style={{ color: activePlan.color }} />
                  </div>
                  <span className="text-[13px]" style={{ color: "#E2E8F0" }}>{f}</span>
                </div>
              ))}
              {activePlan.missing.map((f: string) => (
                <div key={f} className="flex items-center gap-2.5 opacity-40">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,0.04)" }}>
                    <XCircle className="w-3 h-3" style={{ color: "#475569" }} />
                  </div>
                  <span className="text-[13px] line-through" style={{ color: "#475569" }}>{f}</span>
                </div>
              ))}
            </div>

            {activePlan.warning && (
              <div className="mt-4 flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.12)" }}>
                <ShieldAlert className="w-4 h-4 shrink-0" style={{ color: "#F87171" }} />
                <span className="text-[12px] font-medium" style={{ color: "#F87171" }}>{activePlan.warning}</span>
              </div>
            )}

            <button onClick={handleBuy} disabled={loading}
              className="w-full mt-5 py-[16px] rounded-xl font-bold text-[15px] transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
              style={{
                background: activePlan.id === "extensao" ? "transparent" : activePlan.id === "vitalicio" ? "linear-gradient(135deg, #16A34A, #15803D)" : "linear-gradient(135deg, #FACC15, #EAB308)",
                color: activePlan.id === "extensao" ? "#94A3B8" : activePlan.id === "vip" ? "#020617" : "#fff",
                border: activePlan.id === "extensao" ? "1.5px solid rgba(148,163,184,0.3)" : "none",
                boxShadow: activePlan.id !== "extensao" ? `0 0 20px ${activePlan.color}25, 0 4px 12px rgba(0,0,0,0.3)` : "none",
              }}>
              {loading ? t.processing : (<>{activePlan.cta}<ChevronRight className="w-4 h-4" /></>)}
            </button>

            {activePlan.id !== "extensao" && (
              <p className="text-[11px] text-center mt-2.5" style={{ color: "#64748B" }}>{t.oneTime}</p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Quick comparison */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="mt-6 mx-1 rounded-2xl p-4" style={{ background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.04)" }}>
        <p className="text-[11px] uppercase tracking-widest font-bold mb-3" style={{ color: "#64748B" }}>{t.compareTitle}</p>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]" style={{ color: "#94A3B8" }}>
            <thead>
              <tr>
                <th className="text-left py-1.5 pr-2 font-medium" style={{ color: "#475569" }}></th>
                <th className="text-center py-1.5 px-2 font-semibold" style={{ color: "#64748B" }}>{t.compareCols[0]}</th>
                <th className="text-center py-1.5 px-2 font-bold" style={{ color: "#22C55E" }}>{t.compareCols[1]}</th>
                <th className="text-center py-1.5 px-2 font-semibold" style={{ color: "#FACC15" }}>{t.compareCols[2]}</th>
              </tr>
            </thead>
            <tbody>
              {t.compareRows.map((row) => (
                <tr key={row.label} style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                  <td className="py-2 pr-2 font-medium" style={{ color: "#CBD5E1" }}>{row.label}</td>
                  {row.vals.map((v, i) => (
                    <td key={i} className="text-center py-2 px-2">
                      {v === "✓" ? (<Check className="w-4 h-4 mx-auto" style={{ color: i === 1 ? "#22C55E" : "#FACC15" }} />)
                        : v === "—" ? (<span style={{ color: "#334155" }}>—</span>)
                        : v === "∞" ? (<span className="font-bold" style={{ color: i === 1 ? "#22C55E" : "#FACC15" }}>∞</span>)
                        : (<span>{v}</span>)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Social proof */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="mt-5 mx-1">
        {[{ img: avatarAntonio, ...t.proof[0] }, { img: avatarClaudia, ...t.proof[1] }].map((p, i) => (
          <div key={p.name} className="flex items-start gap-3 py-3" style={{ borderBottom: i === 0 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
            <img src={p.img} alt={p.name} className="w-9 h-9 rounded-full object-cover shrink-0" style={{ border: "2px solid rgba(34,197,94,0.2)" }} />
            <div>
              <p className="text-[12px] font-semibold" style={{ color: "#E2E8F0" }}>{p.name}</p>
              <p className="text-[11px] italic leading-relaxed mt-0.5" style={{ color: "#94A3B8" }}>"{p.text}"</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Badges */}
      <div className="flex items-center justify-center gap-4 mt-4">
        <div className="flex items-center gap-1">
          <Lock className="w-3.5 h-3.5" style={{ color: "#475569" }} />
          <span className="text-[11px]" style={{ color: "#475569" }}>{t.secure}</span>
        </div>
        <div className="flex items-center gap-1">
          <RefreshCw className="w-3.5 h-3.5" style={{ color: "#475569" }} />
          <span className="text-[11px]" style={{ color: "#475569" }}>{t.guarantee}</span>
        </div>
      </div>

      <button
        onClick={() => { saveFunnelEvent("upsell_oneclick_decline", { page: "/upsell3" }); logAuditEvent({ eventType: "upsell_oneclick_decline", pageId: "/upsell3" }); onDecline(); }}
        className="text-[12px] underline cursor-pointer bg-transparent border-none mx-auto py-3 mt-1" style={{ color: "#475569" }}>
        {t.decline}
      </button>
    </div>
    </>
  );
};

export default UpsellBlindagem;
