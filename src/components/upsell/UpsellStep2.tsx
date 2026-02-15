import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import UpsellLayout from "./UpsellLayout";

const steps = [
  "Verificando seu nível de experiência...",
  "Calculando tempo estimado para primeiro resultado...",
  "Identificando o acelerador ideal para seu perfil...",
  "Gerando recomendação personalizada...",
];

const UpsellStep2 = () => {
  const navigate = useNavigate();
  const [completed, setCompleted] = useState<number[]>([]);
  const [allDone, setAllDone] = useState(false);

  useEffect(() => {
    steps.forEach((_, i) => {
      setTimeout(() => setCompleted((prev) => [...prev, i]), (i + 1) * 1500);
    });
    setTimeout(() => setAllDone(true), 6500);
    const autoRedirect = setTimeout(() => navigate("/upsell1.3"), 8500);
    return () => clearTimeout(autoRedirect);
  }, [navigate]);

  return (
    <UpsellLayout progress={25}>
      <div className="flex flex-col items-center gap-6 pt-10">
        <h1 className="text-xl font-bold text-center" style={{ color: "#F8FAFC" }}>
          Analisando o melhor plano para o seu perfil...
        </h1>

        <div className="w-full flex flex-col gap-4 mt-4">
          {steps.map((text, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.3 }}
              className="flex items-center gap-3"
            >
              {completed.includes(i) ? (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
                  <Check className="w-5 h-5" style={{ color: "#16A34A" }} />
                </motion.div>
              ) : (
                <Loader2 className="w-5 h-5 animate-spin" style={{ color: "#94A3B8" }} />
              )}
              <span className="text-sm" style={{ color: completed.includes(i) ? "#F8FAFC" : "#94A3B8" }}>
                {text}
              </span>
            </motion.div>
          ))}
        </div>

        {allDone && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full rounded-2xl p-4 mt-4"
            style={{ background: "#1E293B", border: "1px solid #16A34A" }}
          >
            <p className="text-sm text-center leading-relaxed" style={{ color: "#F8FAFC" }}>
              ✅ Análise concluída! Com base no seu perfil, identificamos <strong>3 opções de aceleração</strong> disponíveis para você.
            </p>
          </motion.div>
        )}

        {allDone && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => navigate("/upsell1.3")}
            className="w-full py-4 px-8 rounded-xl text-lg font-bold text-white transition-all hover:brightness-110"
            style={{ background: "#16A34A" }}
          >
            VER MINHAS OPÇÕES
          </motion.button>
        )}
      </div>
    </UpsellLayout>
  );
};

export default UpsellStep2;
