import { motion } from "framer-motion";
import { Check, AlertTriangle, ShieldCheck, Clock, Zap, Turtle, ArrowDown, Lock } from "lucide-react";
import { useLanguage, type Language } from "@/lib/i18n";

interface Props { name: string; onNext: () => void; }

function detectV147(): boolean {
  try {
    const u = new URLSearchParams(window.location.search);
    if (u.get("oferta") === "147" || u.get("offer") === "v147") { try { localStorage.setItem("offer_exp", "v147"); } catch { /* ignore */ } return true; }
    return localStorage.getItem("offer_exp") === "v147";
  } catch { return false; }
}

// Nome da marca + esclarecedor discreto, por idioma.
const BRAND: Record<Language, { name: string; clar: string }> = {
  pt: { name: "Guardião", clar: "(Plataforma de tempo livre)" },
  en: { name: "Guardian", clar: "(your free-time platform)" },
  es: { name: "Guardián", clar: "(plataforma de tiempo libre)" },
};
const G = ({ lang }: { lang: Language }) => (
  <>{BRAND[lang].name} <span style={{ color: "#64748B", fontWeight: 400 }}>{BRAND[lang].clar}</span></>
);

const T = {
  pt: {
    paid: "✓ Pagamento confirmado com sucesso",
    youIn: (n: string) => (n ? `${n}, você está dentro.` : "Você está dentro."),
    avisoTitle: "Aviso",
    statText: (<> dos novos membros <b>desistem</b> nesses 7 dias, antes de ver o primeiro centavo.</>),
    padrao: { label: "Padrão", per: "R$25", perUnit: "/dia", l1: "7 dias pro 1º real", l2: "saque na fila" },
    acel: { label: "Acelerado", upto: "até R$1.200", list: "R$310 · R$700 · R$1.200 /dia", times: "72h · 24h · 12h", saque: "saque cedo", risk: "risco não sobe" },
    reforco: ["Um pagamento", "Garantia 30 dias", "Leva 30 segundos", "Sem compromisso"],
    cta: "ENTENDI — QUAL MODO VOCÊS RECOMENDAM?",
    footer: "Sem compromisso. Você decide.",
    // normal
    n_sub: "Seu acesso está sendo configurado agora mesmo. Mas antes de liberar tudo, preciso te mostrar algo que vai definir a velocidade dos seus primeiros resultados.",
    n_avisoTitle: "Aviso Importante",
    n_trust1: "Garantia 30 dias", n_trust2: "Leva 30 segundos",
    n_cta: "ENTENDI — O QUE VOCÊS RECOMENDAM?",
    n_footer: "Sem compromisso. Você decide se faz sentido.",
  },
  en: {
    paid: "✓ Payment confirmed successfully",
    youIn: (n: string) => (n ? `${n}, you're in.` : "You're in."),
    avisoTitle: "Heads up",
    statText: (<> of new members <b>give up</b> during those 7 days, before seeing a single dollar.</>),
    padrao: { label: "Standard", per: "$5", perUnit: "/day", l1: "7 days to 1st result", l2: "payout in the queue" },
    acel: { label: "Accelerated", upto: "up to $240", list: "$60 · $140 · $240 /day", times: "72h · 24h · 12h", saque: "early payout", risk: "risk stays flat" },
    reforco: ["One payment", "30-day guarantee", "Takes 30 seconds", "No commitment"],
    cta: "GOT IT — WHICH MODE DO YOU RECOMMEND?",
    footer: "No commitment. You decide.",
    n_sub: "Your access is being set up right now. But before we unlock everything, I need to show you something that decides how fast your first results come in.",
    n_avisoTitle: "Important notice",
    n_trust1: "30-day guarantee", n_trust2: "Takes 30 seconds",
    n_cta: "GOT IT — WHAT DO YOU RECOMMEND?",
    n_footer: "No commitment. You decide if it makes sense.",
  },
  es: {
    paid: "✓ Pago confirmado con éxito",
    youIn: (n: string) => (n ? `${n}, estás dentro.` : "Estás dentro."),
    avisoTitle: "Aviso",
    statText: (<> de los nuevos miembros <b>abandonan</b> en esos 7 días, antes de ver el primer dólar.</>),
    padrao: { label: "Estándar", per: "$5", perUnit: "/día", l1: "7 días al 1er resultado", l2: "retiro en la fila" },
    acel: { label: "Acelerado", upto: "hasta $240", list: "$60 · $140 · $240 /día", times: "72h · 24h · 12h", saque: "retiro anticipado", risk: "el riesgo no sube" },
    reforco: ["Un solo pago", "Garantía 30 días", "Toma 30 segundos", "Sin compromiso"],
    cta: "ENTENDIDO — ¿QUÉ MODO RECOMIENDAN?",
    footer: "Sin compromiso. Tú decides.",
    n_sub: "Tu acceso se está configurando ahora mismo. Pero antes de liberar todo, necesito mostrarte algo que define qué tan rápido llegan tus primeros resultados.",
    n_avisoTitle: "Aviso importante",
    n_trust1: "Garantía 30 días", n_trust2: "Toma 30 segundos",
    n_cta: "ENTENDIDO — ¿QUÉ RECOMIENDAN?",
    n_footer: "Sin compromiso. Tú decides si tiene sentido.",
  },
};

const UpsellStep1 = ({ name, onNext }: Props) => {
  const { lang } = useLanguage();
  const t = T[lang];
  const firstName = name !== "Visitante" ? name : "";
  const isV147 = detectV147();

  const Header = (
    <>
      <motion.div
        initial={{ scale: 0, rotate: -45 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.2 }}
        className="w-[72px] h-[72px] rounded-full flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, rgba(22,163,74,0.2), rgba(34,197,94,0.1))", border: "2px solid rgba(22,163,74,0.3)" }}
      >
        <Check className="w-9 h-9" style={{ color: "#22C55E" }} strokeWidth={3} />
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        className="text-sm font-semibold tracking-wide" style={{ color: "#22C55E" }}
      >
        {t.paid}
      </motion.p>
      <h1 className="text-[26px] font-extrabold text-center leading-tight" style={{ color: "#F8FAFC" }}>
        {t.youIn(firstName)}
      </h1>
    </>
  );

  // ───────────────────────────── VARIAÇÃO CARA (v147) ─────────────────────────────
  if (isV147) {
    return (
      <div className="flex flex-col items-center gap-5 pt-6">
        {Header}

        {/* Intro */}
        <p className="text-[15px] text-center leading-relaxed" style={{ color: "#CBD5E1" }}>
          {lang === "pt" && <>O <G lang="pt" /> já está sendo ligado na sua conta agora. Antes de liberar tudo, tem <b style={{ color: "#F8FAFC" }}>uma coisa que define quando o primeiro real cai</b> — e quanto por dia ele pode fazer.</>}
          {lang === "en" && <>The <G lang="en" /> is being switched on in your account right now. Before we unlock everything, there's <b style={{ color: "#F8FAFC" }}>one thing that decides when your first payout lands</b> — and how much per day it can make.</>}
          {lang === "es" && <>El <G lang="es" /> ya se está activando en tu cuenta ahora mismo. Antes de liberar todo, hay <b style={{ color: "#F8FAFC" }}>una cosa que define cuándo cae tu primer retiro</b> — y cuánto por día puede generar.</>}
        </p>

        {/* AVISO */}
        <div className="w-full rounded-xl p-4" style={{ background: "linear-gradient(135deg, rgba(30,41,59,0.85), rgba(30,41,59,0.6))", borderLeft: "3px solid #FACC15" }}>
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" style={{ color: "#FACC15" }} />
            <div className="flex flex-col gap-2">
              <p className="text-[13px] font-bold" style={{ color: "#FACC15" }}>{t.avisoTitle}</p>

              <p className="text-[13px] leading-relaxed" style={{ color: "#CBD5E1" }}>
                {lang === "pt" && <>No modo padrão, o <G lang="pt" /> opera devagar <b style={{ color: "#F8FAFC" }}>de propósito</b>. Protege o capital. É seguro.</>}
                {lang === "en" && <>In standard mode, the <G lang="en" /> runs slow <b style={{ color: "#F8FAFC" }}>on purpose</b>. It protects your capital. It's safe.</>}
                {lang === "es" && <>En modo estándar, el <G lang="es" /> opera lento <b style={{ color: "#F8FAFC" }}>a propósito</b>. Protege tu capital. Es seguro.</>}
              </p>

              <p className="text-[13px] leading-relaxed" style={{ color: "#CBD5E1" }}>
                {lang === "pt" && <>O problema: leva <b style={{ color: "#F8FAFC" }}>7 dias</b> pra calibrar e gerar o primeiro resultado. Limite: <b style={{ color: "#F8FAFC" }}>R$25 por dia</b>. Saque na fila.</>}
                {lang === "en" && <>The problem: it takes <b style={{ color: "#F8FAFC" }}>7 days</b> to calibrate and produce the first result. Cap: <b style={{ color: "#F8FAFC" }}>$5 per day</b>. Payout in the queue.</>}
                {lang === "es" && <>El problema: tarda <b style={{ color: "#F8FAFC" }}>7 días</b> en calibrar y generar el primer resultado. Límite: <b style={{ color: "#F8FAFC" }}>$5 por día</b>. Retiro en la fila.</>}
              </p>

              {/* Stat 73% */}
              <div className="rounded-lg px-3 py-2 mt-0.5 flex items-center gap-2.5" style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.25)" }}>
                <span className="text-[24px] font-extrabold leading-none" style={{ color: "#F87171" }}>73%</span>
                <span className="text-[12px] leading-tight" style={{ color: "#FCA5A5" }}>{t.statText}</span>
              </div>

              <p className="text-[13px] leading-relaxed" style={{ color: "#CBD5E1" }}>
                {lang === "pt" && <>Quem fica só no padrão ganha pouco, ganha lento, e larga. <b style={{ color: "#F8FAFC" }}>Não é falta de sistema. É velocidade.</b></>}
                {lang === "en" && <>Stay on standard only and you earn little, earn slow, and quit. <b style={{ color: "#F8FAFC" }}>It's not a lack of system. It's speed.</b></>}
                {lang === "es" && <>Quien se queda solo en el estándar gana poco, gana lento, y abandona. <b style={{ color: "#F8FAFC" }}>No es falta de sistema. Es velocidad.</b></>}
              </p>
            </div>
          </div>
        </div>

        {/* A CHANCE */}
        <div className="w-full rounded-xl p-4" style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(34,197,94,0.18)" }}>
          <p className="text-[14px] leading-relaxed" style={{ color: "#E2E8F0" }}>
            {lang === "pt" && <>{firstName ? `${firstName}, você ` : "Você "}não pagou esse acesso pra ficar <b style={{ color: "#F8FAFC" }}>7 dias no zero</b>.</>}
            {lang === "en" && <>{firstName ? `${firstName}, you ` : "You "}didn't pay for this access to sit <b style={{ color: "#F8FAFC" }}>7 days at zero</b>.</>}
            {lang === "es" && <>{firstName ? `${firstName}, ` : "Tú "}no pagaste este acceso para pasar <b style={{ color: "#F8FAFC" }}>7 días en cero</b>.</>}
          </p>
          <p className="text-[14px] leading-relaxed mt-2" style={{ color: "#CBD5E1" }}>
            {lang === "pt" && <>Dá pra fazer o <G lang="pt" /> trabalhar mais desde o primeiro dia — sem tirar a mão da proteção. <b style={{ color: "#22C55E" }}>O risco não sobe. Sobe o limite e o saque.</b></>}
            {lang === "en" && <>You can make the <G lang="en" /> work harder from day one — without taking your hand off the protection. <b style={{ color: "#22C55E" }}>The risk doesn't go up. The limit and the payout do.</b></>}
            {lang === "es" && <>Puedes hacer que el <G lang="es" /> trabaje más desde el primer día — sin soltar la protección. <b style={{ color: "#22C55E" }}>El riesgo no sube. Suben el límite y el retiro.</b></>}
          </p>
        </div>

        {/* COMPARATIVO Padrão vs Acelerado */}
        <div className="w-full grid grid-cols-2 gap-2.5 items-stretch">
          <div className="rounded-xl p-3.5 flex flex-col" style={{ background: "rgba(15,23,42,0.5)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-1.5 mb-2">
              <Turtle className="w-4 h-4" style={{ color: "#64748B" }} />
              <span className="text-[12px] font-bold" style={{ color: "#64748B" }}>{t.padrao.label}</span>
            </div>
            <span className="text-[22px] font-extrabold leading-none" style={{ color: "#64748B" }}>{t.padrao.per}<span className="text-[12px] font-medium">{t.padrao.perUnit}</span></span>
            <div className="mt-2.5 flex flex-col gap-1.5 text-[11.5px]" style={{ color: "#64748B" }}>
              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {t.padrao.l1}</span>
              <span className="flex items-center gap-1.5"><ArrowDown className="w-3.5 h-3.5" /> {t.padrao.l2}</span>
            </div>
          </div>

          <div className="relative rounded-xl p-3.5 flex flex-col overflow-hidden" style={{ background: "linear-gradient(160deg, rgba(22,163,74,0.14), rgba(250,204,21,0.06))", border: "1.5px solid #22C55E", boxShadow: "0 6px 22px rgba(22,163,74,0.18)" }}>
            <div className="flex items-center gap-1.5 mb-2">
              <Zap className="w-4 h-4" style={{ color: "#22C55E" }} />
              <span className="text-[12px] font-bold" style={{ color: "#22C55E" }}>{t.acel.label}</span>
            </div>
            <span className="text-[22px] font-extrabold leading-none" style={{ color: "#F8FAFC" }}>{t.acel.upto}</span>
            <span className="text-[11px] mt-0.5" style={{ color: "#86EFAC" }}>{t.acel.list}</span>
            <div className="mt-2.5 flex flex-col gap-1.5 text-[11.5px]" style={{ color: "#E2E8F0" }}>
              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" style={{ color: "#22C55E" }} /> {t.acel.times}</span>
              <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" style={{ color: "#FACC15" }} /> {t.acel.saque}</span>
            </div>
            <div className="mt-2.5 rounded-md px-2 py-1 flex items-center gap-1.5" style={{ background: "rgba(34,197,94,0.12)" }}>
              <Lock className="w-3 h-3" style={{ color: "#22C55E" }} />
              <span className="text-[10px] font-semibold" style={{ color: "#86EFAC" }}>{t.acel.risk}</span>
            </div>
          </div>
        </div>

        {/* Reforço */}
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5">
          {t.reforco.map((txt, i) => (
            <span key={txt} className="flex items-center gap-1.5 text-[11.5px]" style={{ color: "#94A3B8" }}>
              {i === 1 ? <ShieldCheck className="w-3.5 h-3.5" style={{ color: "#22C55E" }} /> : <Check className="w-3.5 h-3.5" style={{ color: "#22C55E" }} />}
              {txt}
            </span>
          ))}
        </div>

        <button
          onClick={onNext}
          className="w-full py-[18px] px-6 rounded-xl text-[16px] font-bold text-white transition-all hover:brightness-110 active:scale-[0.98] leading-tight"
          style={{ background: "linear-gradient(135deg, #16A34A, #15803D)", boxShadow: "0 0 20px rgba(22,163,74,0.3), 0 4px 12px rgba(0,0,0,0.3)", animation: "pulse-btn 2.5s ease-in-out infinite" }}
        >
          {t.cta}
        </button>
        <p className="text-[12px] -mt-1" style={{ color: "#475569" }}>{t.footer}</p>
      </div>
    );
  }

  // ───────────────────────────── VARIAÇÃO NORMAL ─────────────────────────────
  return (
    <div className="flex flex-col items-center gap-5 pt-6">
      {Header}

      <p className="text-[15px] text-center leading-relaxed" style={{ color: "#94A3B8" }}>
        {t.n_sub}
      </p>

      <div className="w-full rounded-xl p-4" style={{ background: "linear-gradient(135deg, rgba(30,41,59,0.8), rgba(30,41,59,0.6))", borderLeft: "3px solid #FACC15" }}>
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" style={{ color: "#FACC15" }} />
          <div>
            <p className="text-[13px] font-bold mb-1" style={{ color: "#FACC15" }}>{t.n_avisoTitle}</p>
            <p className="text-[13px] leading-relaxed" style={{ color: "#CBD5E1" }}>
              {lang === "pt" && <>Na configuração padrão, a plataforma leva <strong style={{ color: "#F8FAFC" }}>em média 7 dias</strong> para calibrar e gerar os primeiros resultados. Durante essa espera, <strong style={{ color: "#F8FAFC" }}>73% dos novos membros desistem</strong> antes de ver o primeiro centavo.</>}
              {lang === "en" && <>On the standard setup, the platform takes <strong style={{ color: "#F8FAFC" }}>about 7 days</strong> to calibrate and produce the first results. During that wait, <strong style={{ color: "#F8FAFC" }}>73% of new members give up</strong> before seeing a single dollar.</>}
              {lang === "es" && <>En la configuración estándar, la plataforma tarda <strong style={{ color: "#F8FAFC" }}>unos 7 días</strong> en calibrar y generar los primeros resultados. Durante esa espera, <strong style={{ color: "#F8FAFC" }}>el 73% de los nuevos miembros abandona</strong> antes de ver el primer dólar.</>}
            </p>
          </div>
        </div>
      </div>

      <div className="w-full rounded-xl p-4" style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <p className="text-[14px] leading-relaxed" style={{ color: "#CBD5E1" }}>
          {lang === "pt" && (firstName
            ? `${firstName}, eu sei que você não investiu nesse acesso pra ficar 7 dias olhando pra tela esperando alguma coisa acontecer. Ninguém quer essa sensação. Por isso, quero te dar a chance de pular essa etapa agora.`
            : "Você não investiu nesse acesso pra ficar 7 dias esperando. Ninguém quer isso. Por isso, quero te dar a chance de pular essa etapa agora.")}
          {lang === "en" && (firstName
            ? `${firstName}, I know you didn't invest in this access just to stare at a screen for 7 days waiting for something to happen. Nobody wants that feeling. So I want to give you the chance to skip that wait now.`
            : "You didn't invest in this access to wait around for 7 days. Nobody wants that. So I want to give you the chance to skip that wait now.")}
          {lang === "es" && (firstName
            ? `${firstName}, sé que no invertiste en este acceso para mirar la pantalla 7 días esperando que algo pase. Nadie quiere esa sensación. Por eso quiero darte la oportunidad de saltarte esa espera ahora.`
            : "No invertiste en este acceso para esperar 7 días. Nadie quiere eso. Por eso quiero darte la oportunidad de saltarte esa espera ahora.")}
        </p>
      </div>

      <div className="flex items-center gap-4 w-full justify-center">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4" style={{ color: "#64748B" }} />
          <span className="text-[11px]" style={{ color: "#64748B" }}>{t.n_trust1}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-4 h-4" style={{ color: "#64748B" }} />
          <span className="text-[11px]" style={{ color: "#64748B" }}>{t.n_trust2}</span>
        </div>
      </div>

      <button
        onClick={onNext}
        className="w-full py-[18px] px-8 rounded-xl text-[17px] font-bold text-white transition-all hover:brightness-110 active:scale-[0.98]"
        style={{ background: "linear-gradient(135deg, #16A34A, #15803D)", boxShadow: "0 0 20px rgba(22,163,74,0.3), 0 4px 12px rgba(0,0,0,0.3)", animation: "pulse-btn 2.5s ease-in-out infinite" }}
      >
        {t.n_cta}
      </button>

      <p className="text-[12px]" style={{ color: "#475569" }}>{t.n_footer}</p>
    </div>
  );
};

export default UpsellStep1;
