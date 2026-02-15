import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Rocket, ExternalLink } from "lucide-react";
import { getUpsellChoice } from "@/lib/upsellData";

const accelNames: Record<string, string> = { basico: "Básico", duplo: "Duplo", maximo: "Máximo" };
const accelTimes: Record<string, string> = { basico: "72h", duplo: "24h", maximo: "12h" };

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
  const choice = getUpsellChoice();
  const [showConfetti, setShowConfetti] = useState(true);
  const firstName = name !== "Visitante" ? name : "";

  useEffect(() => {
    const t = setTimeout(() => setShowConfetti(false), 3500);
    return () => clearTimeout(t);
  }, []);

  const boughtAccel = !!choice.accelerator;
  const boughtGuide = choice.guide;

  let subtitle: string;
  if (boughtAccel) {
    subtitle = `Seu Acelerador ${accelNames[choice.accelerator!]} está ativo. Primeiros resultados em até ${accelTimes[choice.accelerator!]}. Nosso suporte vai te chamar no WhatsApp em instantes.`;
  } else if (boughtGuide) {
    subtitle = "Seu Guia Primeiros Passos foi liberado! Acesso enviado pro seu e-mail em até 5 minutos. Siga o passo a passo e em 7 dias você estará gerando resultados.";
  } else {
    subtitle = "Seu acesso está sendo finalizado. Você receberá o link no seu e-mail em até 15 minutos.";
  }

  const checklist = [
    "Acesso à Plataforma Tempo Livre",
    "Método passo a passo completo",
    "Comunidade de +36.000 alunos",
    "Suporte por WhatsApp",
  ];
  if (boughtAccel) checklist.push(`Acelerador ${accelNames[choice.accelerator!]} ativado`);
  if (boughtGuide) checklist.push("Guia Primeiros Passos liberado");

  return (
    <>
      {showConfetti && <Confetti />}
      <div className="flex flex-col items-center gap-5 pt-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 12 }}
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, rgba(22,163,74,0.2), rgba(34,197,94,0.1))", border: "2px solid rgba(22,163,74,0.3)" }}
        >
          <Rocket className="w-10 h-10" style={{ color: "#22C55E" }} />
        </motion.div>

        <h1 className="text-[26px] font-extrabold text-center leading-tight" style={{ color: "#F8FAFC" }}>
          {firstName ? `Tudo pronto, ${firstName}!` : "Tudo pronto!"} 🚀
        </h1>

        <p className="text-[14px] text-center leading-relaxed" style={{ color: "#94A3B8" }}>
          {subtitle}
        </p>

        <div className="w-full rounded-2xl p-5" style={{ background: "#0F172A", border: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-[12px] font-bold uppercase tracking-wider mb-3" style={{ color: "#64748B" }}>Seu pacote completo</p>
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
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-[18px] rounded-xl text-[16px] font-bold text-white text-center transition-all hover:brightness-110 active:scale-[0.98] flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg, #16A34A, #15803D)", boxShadow: "0 0 20px rgba(22,163,74,0.25), 0 4px 12px rgba(0,0,0,0.3)" }}
        >
          ACESSAR MINHA PLATAFORMA <ExternalLink className="w-4 h-4" />
        </a>

        <p className="text-[11px] pb-6" style={{ color: "#475569" }}>
          Suporte disponível 24h pelo WhatsApp. Estamos aqui pra te ajudar.
        </p>
      </div>
    </>
  );
};

export default UpsellStep6;
