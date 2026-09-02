import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Rocket, ExternalLink } from "lucide-react";
import { getUpsellChoice, getUpsellExtras } from "@/lib/upsellData";
import { useLanguage, type Language } from "@/lib/i18n";

const TEXTS = {
  pt: {
    accelNames: { basico: "Básico", duplo: "Duplo", maximo: "Máximo" },
    accelTimes: { basico: "72h", duplo: "24h", maximo: "12h" },
    multiNames: { prata: "Prata", ouro: "Ouro", diamante: "Diamante" },
    ready: (n: string) => (n ? `Tudo pronto, ${n}!` : "Tudo pronto!"),
    subAccel: (nm: string, tm: string) => `Seu Acelerador ${nm} está ativo. Primeiros resultados em até ${tm}. Nosso suporte vai te chamar no WhatsApp em instantes.`,
    subGuide: "Seu Guia Primeiros Passos foi liberado! Acesso enviado pro seu e-mail em até 5 minutos. Siga o passo a passo e em 7 dias você estará gerando resultados.",
    subDefault: "Seu acesso está sendo finalizado. Você receberá o link no seu e-mail em até 15 minutos.",
    packageTitle: "Seu pacote completo",
    base: ["Acesso à Plataforma Tempo Livre", "Método passo a passo completo", "Comunidade de +36.000 alunos", "Suporte por WhatsApp"],
    itemAccel: (nm: string) => `Acelerador ${nm} ativado`,
    itemGuide: "Guia Primeiros Passos liberado",
    itemMulti: (nm: string) => `Potencial ${nm} ativado`,
    itemBlindagem: "Blindagem Anual de Estratégia ativa",
    itemCirculo: "Círculo Interno — vaga garantida",
    cta: "ACESSAR MINHA PLATAFORMA",
    support: "Suporte disponível 24h pelo WhatsApp. Estamos aqui pra te ajudar.",
  },
  en: {
    accelNames: { basico: "Basic", duplo: "Double", maximo: "Maximum" },
    accelTimes: { basico: "72h", duplo: "24h", maximo: "12h" },
    multiNames: { prata: "Silver", ouro: "Gold", diamante: "Diamond" },
    ready: (n: string) => (n ? `You're all set, ${n}!` : "You're all set!"),
    subAccel: (nm: string, tm: string) => `Your ${nm} Accelerator is active. First results within ${tm}. Our support will reach out on WhatsApp in a moment.`,
    subGuide: "Your First Steps Guide is unlocked! Access sent to your email within 5 minutes. Follow the steps and in 7 days you'll be generating results.",
    subDefault: "Your access is being finalized. You'll get the link in your email within 15 minutes.",
    packageTitle: "Your complete package",
    base: ["Access to the Free-Time Platform", "Full step-by-step method", "Community of 36,000+ members", "WhatsApp support"],
    itemAccel: (nm: string) => `${nm} Accelerator activated`,
    itemGuide: "First Steps Guide unlocked",
    itemMulti: (nm: string) => `${nm} Potential activated`,
    itemBlindagem: "Annual Strategy Shield active",
    itemCirculo: "Inner Circle — spot secured",
    cta: "OPEN MY PLATFORM",
    support: "Support available 24h on WhatsApp. We're here to help.",
  },
  es: {
    accelNames: { basico: "Básico", duplo: "Doble", maximo: "Máximo" },
    accelTimes: { basico: "72h", duplo: "24h", maximo: "12h" },
    multiNames: { prata: "Plata", ouro: "Oro", diamante: "Diamante" },
    ready: (n: string) => (n ? `¡Todo listo, ${n}!` : "¡Todo listo!"),
    subAccel: (nm: string, tm: string) => `Tu Acelerador ${nm} está activo. Primeros resultados en hasta ${tm}. Nuestro soporte te va a escribir por WhatsApp en instantes.`,
    subGuide: "¡Tu Guía Primeros Pasos fue liberada! Acceso enviado a tu correo en hasta 5 minutos. Sigue el paso a paso y en 7 días estarás generando resultados.",
    subDefault: "Tu acceso se está finalizando. Recibirás el enlace en tu correo en hasta 15 minutos.",
    packageTitle: "Tu paquete completo",
    base: ["Acceso a la Plataforma Tiempo Libre", "Método paso a paso completo", "Comunidad de +36.000 miembros", "Soporte por WhatsApp"],
    itemAccel: (nm: string) => `Acelerador ${nm} activado`,
    itemGuide: "Guía Primeros Pasos liberada",
    itemMulti: (nm: string) => `Potencial ${nm} activado`,
    itemBlindagem: "Blindaje Anual de Estrategia activo",
    itemCirculo: "Círculo Interno — cupo asegurado",
    cta: "ENTRAR A MI PLATAFORMA",
    support: "Soporte disponible 24h por WhatsApp. Estamos aquí para ayudarte.",
  },
};

const Confetti = () => {
  const [particles] = useState(() =>
    Array.from({ length: 40 }, (_, i) => ({
      id: i, x: Math.random() * 100, delay: Math.random() * 1.5,
      duration: 1.5 + Math.random() * 2, color: ["#16A34A", "#22C55E", "#FACC15", "#4ADE80"][i % 4],
      size: 3 + Math.random() * 5, rotation: Math.random() * 360,
    }))
  );
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {particles.map((p) => (
        <motion.div key={p.id} className="absolute"
          style={{ left: `${p.x}%`, top: -10, width: p.size, height: p.size * 1.5, background: p.color, borderRadius: 1 }}
          initial={{ y: -20, opacity: 1, rotate: 0 }}
          animate={{ y: "100vh", opacity: 0, rotate: p.rotation + 720 }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeIn" }}
        />
      ))}
    </div>
  );
};

interface Props { name: string; }

const UpsellStep6 = ({ name }: Props) => {
  const { lang } = useLanguage();
  const t = TEXTS[lang];
  const choice = getUpsellChoice();
  const extras = getUpsellExtras();
  const [showConfetti, setShowConfetti] = useState(true);
  const firstName = name !== "Visitante" ? name : "";

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 3500);
    return () => clearTimeout(timer);
  }, []);

  const boughtAccel = !!choice.accelerator;
  const boughtGuide = choice.guide;
  const boughtMultiplicador = !!extras.multiplicador;
  const boughtBlindagem = !!extras.blindagem;
  const boughtCirculo = !!extras.circulo;

  let subtitle: string;
  if (boughtAccel) {
    const key = choice.accelerator as "basico" | "duplo" | "maximo";
    subtitle = t.subAccel(t.accelNames[key], t.accelTimes[key]);
  } else if (boughtGuide) {
    subtitle = t.subGuide;
  } else {
    subtitle = t.subDefault;
  }

  const checklist = [...t.base];
  if (boughtAccel) checklist.push(t.itemAccel(t.accelNames[choice.accelerator as "basico" | "duplo" | "maximo"]));
  if (boughtGuide) checklist.push(t.itemGuide);
  if (boughtMultiplicador) checklist.push(t.itemMulti((t.multiNames as any)[extras.multiplicador!.plan] || "Multiplicador"));
  if (boughtBlindagem) checklist.push(t.itemBlindagem);
  if (boughtCirculo) checklist.push(t.itemCirculo);

  return (
    <>
      {showConfetti && <Confetti />}
      <div className="flex flex-col items-center gap-5 pt-6">
        <motion.div
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 12 }}
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, rgba(22,163,74,0.2), rgba(34,197,94,0.1))", border: "2px solid rgba(22,163,74,0.3)" }}
        >
          <Rocket className="w-10 h-10" style={{ color: "#22C55E" }} />
        </motion.div>

        <h1 className="text-[26px] font-extrabold text-center leading-tight" style={{ color: "#F8FAFC" }}>
          {t.ready(firstName)} 🚀
        </h1>

        <p className="text-[14px] text-center leading-relaxed" style={{ color: "#94A3B8" }}>{subtitle}</p>

        <div className="w-full rounded-2xl p-5" style={{ background: "#0F172A", border: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-[12px] font-bold uppercase tracking-wider mb-3" style={{ color: "#64748B" }}>{t.packageTitle}</p>
          {checklist.map((item) => (
            <div key={item} className="flex items-center gap-2.5 py-2">
              <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(22,163,74,0.15)" }}>
                <Check className="w-3 h-3" style={{ color: "#22C55E" }} />
              </div>
              <span className="text-[14px]" style={{ color: "#E2E8F0" }}>{item}</span>
            </div>
          ))}
        </div>

        <a
          href="https://plataforma.exemplo.com"
          target="_blank" rel="noopener noreferrer"
          className="w-full py-[18px] rounded-xl text-[16px] font-bold text-white text-center transition-all hover:brightness-110 active:scale-[0.98] flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg, #16A34A, #15803D)", boxShadow: "0 0 20px rgba(22,163,74,0.25), 0 4px 12px rgba(0,0,0,0.3)" }}
        >
          {t.cta} <ExternalLink className="w-4 h-4" />
        </a>

        <p className="text-[11px] pb-6" style={{ color: "#475569" }}>{t.support}</p>
      </div>
    </>
  );
};

export default UpsellStep6;
