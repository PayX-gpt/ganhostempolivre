import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Rocket } from "lucide-react";
import { getUpsellData, getUpsellChoice } from "@/lib/upsellData";

const accelNames: Record<string, string> = { basico: "Básico", duplo: "Duplo", maximo: "Máximo" };
const accelTimes: Record<string, string> = { basico: "72h", duplo: "24h", maximo: "12h" };

const Confetti = () => {
  const [particles] = useState(() =>
    Array.from({ length: 30 }, (_, i) => ({
      id: i, x: Math.random() * 100, delay: Math.random() * 2,
      duration: 2 + Math.random() * 2, color: i % 2 === 0 ? "#16A34A" : "#FACC15",
      size: 4 + Math.random() * 6,
    }))
  );
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {particles.map((p) => (
        <motion.div key={p.id} className="absolute rounded-full"
          style={{ left: `${p.x}%`, top: -10, width: p.size, height: p.size, background: p.color }}
          initial={{ y: -20, opacity: 1 }}
          animate={{ y: "100vh", opacity: 0, rotate: 360 }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeIn" }}
        />
      ))}
    </div>
  );
};

const UpsellStep6 = () => {
  const { name } = getUpsellData();
  const choice = getUpsellChoice();
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShowConfetti(false), 4000);
    return () => clearTimeout(t);
  }, []);

  const boughtAccel = !!choice.accelerator;
  const boughtGuide = choice.guide;

  let subtitle = "Seu acesso à plataforma está sendo finalizado. Você receberá o link de acesso no seu e-mail em até 15 minutos.";
  if (boughtAccel) subtitle = `Seu Acelerador ${accelNames[choice.accelerator!]} foi ativado com sucesso. Seus primeiros resultados devem aparecer em até ${accelTimes[choice.accelerator!]}. Fique de olho no seu WhatsApp — nosso suporte vai entrar em contato em instantes.`;
  else if (boughtGuide) subtitle = "Seu Guia Primeiros Passos foi liberado. Você vai receber o acesso no seu e-mail em até 5 minutos. Siga o passo a passo e em 7 dias você estará gerando seus primeiros resultados.";

  const checklist = [
    "Acesso à Plataforma Tempo Livre", "Método passo a passo completo",
    "Comunidade de +36.000 alunos", "Suporte por WhatsApp",
  ];
  if (boughtAccel) checklist.push(`Acelerador ${accelNames[choice.accelerator!]} ativado`);
  if (boughtGuide) checklist.push("Guia Primeiros Passos liberado");

  return (
    <>
      {showConfetti && <Confetti />}
      <div className="flex flex-col items-center gap-5 pt-8">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 12 }}
          className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "rgba(22,163,74,0.15)" }}>
          <Rocket className="w-10 h-10" style={{ color: "#16A34A" }} />
        </motion.div>
        <h1 className="text-[26px] font-bold text-center" style={{ color: "#F8FAFC" }}>Tudo pronto, {name}! 🚀</h1>
        <p className="text-sm text-center leading-relaxed" style={{ color: "#94A3B8" }}>{subtitle}</p>
        <div className="w-full rounded-2xl p-5" style={{ background: "#0F172A" }}>
          {checklist.map((item) => (
            <div key={item} className="flex items-center gap-2 py-1.5">
              <Check className="w-4 h-4 shrink-0" style={{ color: "#16A34A" }} />
              <span className="text-sm" style={{ color: "#F8FAFC" }}>{item}</span>
            </div>
          ))}
        </div>
        <a href="https://plataforma.exemplo.com" target="_blank" rel="noopener noreferrer"
          className="w-full py-4 rounded-xl text-lg font-bold text-white text-center transition-all hover:brightness-110 block"
          style={{ background: "#16A34A" }}>
          ACESSAR MINHA PLATAFORMA AGORA
        </a>
        <p className="text-xs pb-6" style={{ color: "#64748B" }}>Qualquer dúvida, nosso suporte está disponível 24h pelo WhatsApp.</p>
      </div>
    </>
  );
};

export default UpsellStep6;
