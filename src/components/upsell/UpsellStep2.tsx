import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Loader2, Sparkles } from "lucide-react";

const steps = [
  { text: "Verificando seu nível de experiência...", icon: "🔍" },
  { text: "Calculando tempo estimado para resultados...", icon: "⏱️" },
  { text: "Identificando o acelerador ideal...", icon: "🎯" },
  { text: "Gerando recomendação personalizada...", icon: "✨" },
];

interface Props { onNext: () => void; }

const UpsellStep2 = ({ onNext }: Props) => {
  const [completed, setCompleted] = useState<number[]>([]);
  const [allDone, setAllDone] = useState(false);

  useEffect(() => {
    steps.forEach((_, i) => {
      setTimeout(() => setCompleted((prev) => [...prev, i]), (i + 1) * 1200);
    });
    setTimeout(() => setAllDone(true), 5500);
    const auto = setTimeout(onNext, 7000);
    return () => clearTimeout(auto);
  }, [onNext]);

  return (
    <div className="flex flex-col items-center gap-6 pt-10">
      <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "rgba(22,163,74,0.1)", border: "2px solid rgba(22,163,74,0.2)" }}>
        <Sparkles className="w-7 h-7" style={{ color: "#22C55E" }} />
      </div>

      <h1 className="text-xl font-bold text-center" style={{ color: "#F8FAFC" }}>
        Analisando seu perfil...
      </h1>

      <div className="w-full flex flex-col gap-3 mt-2">
        {steps.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.2, duration: 0.3 }}
            className="flex items-center gap-3 rounded-lg py-3 px-4"
            style={{
              background: completed.includes(i) ? "rgba(22,163,74,0.08)" : "rgba(15,23,42,0.5)",
              border: `1px solid ${completed.includes(i) ? "rgba(22,163,74,0.2)" : "rgba(255,255,255,0.04)"}`,
              transition: "all 0.3s ease",
            }}
          >
            {completed.includes(i) ? (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400 }}>
                <Check className="w-5 h-5" style={{ color: "#22C55E" }} />
              </motion.div>
            ) : (
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: "#475569" }} />
            )}
            <span className="text-[14px]" style={{ color: completed.includes(i) ? "#E2E8F0" : "#64748B" }}>
              {item.text}
            </span>
          </motion.div>
        ))}
      </div>

      {allDone && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full rounded-xl p-4 mt-2" style={{ background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.25)" }}>
          <p className="text-[14px] text-center font-medium" style={{ color: "#E2E8F0" }}>
            Pronto! Identificamos <strong style={{ color: "#22C55E" }}>3 opções</strong> de aceleração para o seu perfil.
          </p>
        </motion.div>
      )}

      {allDone && (
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={onNext}
          className="w-full py-4 rounded-xl text-[16px] font-bold text-white transition-all hover:brightness-110 active:scale-[0.98]"
          style={{ background: "linear-gradient(135deg, #16A34A, #15803D)", boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}
        >
          VER MINHAS OPÇÕES →
        </motion.button>
      )}
    </div>
  );
};

export default UpsellStep2;
