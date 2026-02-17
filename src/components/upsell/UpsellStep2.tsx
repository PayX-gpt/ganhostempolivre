import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Loader2, Server, Users, Gauge, Rocket } from "lucide-react";

const steps = [
  { text: "Verificando posição na fila de processamento...", icon: Server },
  { text: "Analisando carga atual dos servidores...", icon: Gauge },
  { text: "Calculando tempo de espera do seu perfil...", icon: Users },
  { text: "Identificando atalhos disponíveis...", icon: Rocket },
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
    <div className="flex flex-col items-center gap-6 pt-8">
      {/* Header with same card style */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full rounded-2xl overflow-hidden"
        style={{ border: "1px solid rgba(250,204,21,0.2)" }}
      >
        <div className="px-5 py-4 flex items-center gap-3" style={{ background: "rgba(250,204,21,0.06)" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(250,204,21,0.12)" }}>
            <Server className="w-5 h-5" style={{ color: "#FACC15" }} />
          </div>
          <div>
            <p className="text-[15px] font-bold" style={{ color: "#F8FAFC" }}>Verificando sua posição na fila</p>
            <p className="text-[12px]" style={{ color: "#FACC15" }}>Aguarde enquanto analisamos seu perfil...</p>
          </div>
        </div>

        <div className="px-5 py-4 flex flex-col gap-3" style={{ background: "#0F172A" }}>
          {steps.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.2, duration: 0.3 }}
                className="flex items-center gap-3 rounded-xl py-3 px-4"
                style={{
                  background: completed.includes(i) ? "rgba(22,163,74,0.06)" : "rgba(255,255,255,0.02)",
                  border: `1px solid ${completed.includes(i) ? "rgba(22,163,74,0.15)" : "rgba(255,255,255,0.04)"}`,
                  transition: "all 0.4s ease",
                }}
              >
                {completed.includes(i) ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400 }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: "rgba(22,163,74,0.15)" }}
                  >
                    <Check className="w-4 h-4" style={{ color: "#22C55E" }} />
                  </motion.div>
                ) : (
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,0.04)" }}>
                    <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#475569" }} />
                  </div>
                )}
                <span className="text-[13px]" style={{ color: completed.includes(i) ? "#E2E8F0" : "#64748B" }}>
                  {item.text}
                </span>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {allDone && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full rounded-2xl overflow-hidden"
          style={{ border: "1px solid rgba(34,197,94,0.25)" }}
        >
          <div className="px-5 py-4 flex items-center gap-3" style={{ background: "rgba(34,197,94,0.08)" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(34,197,94,0.15)" }}>
              <Rocket className="w-5 h-5" style={{ color: "#22C55E" }} />
            </div>
            <div>
              <p className="text-[15px] font-bold" style={{ color: "#F8FAFC" }}>Análise concluída</p>
              <p className="text-[12px]" style={{ color: "#22C55E" }}>Encontramos 3 formas de pular a fila</p>
            </div>
          </div>
          <div className="px-5 py-3" style={{ background: "#0F172A" }}>
            <p className="text-[13px] text-center" style={{ color: "#CBD5E1" }}>
              Seu perfil é <strong style={{ color: "#22C55E" }}>elegível</strong> para aceleração. Veja as opções disponíveis:
            </p>
          </div>
        </motion.div>
      )}

      {allDone && (
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={onNext}
          className="w-full py-4 rounded-xl text-[16px] font-bold text-white transition-all hover:brightness-110 active:scale-[0.98]"
          style={{ background: "linear-gradient(135deg, #16A34A, #15803D)", boxShadow: "0 0 20px rgba(22,163,74,0.2), 0 4px 12px rgba(0,0,0,0.3)" }}
        >
          VER COMO PULAR A FILA →
        </motion.button>
      )}
    </div>
  );
};

export default UpsellStep2;
