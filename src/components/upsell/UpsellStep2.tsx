import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Loader2, Server, Users, Gauge, AlertTriangle, Clock } from "lucide-react";

const analysisSteps = [
  { text: "Localizando sua conta nos servidores...", icon: Server },
  { text: "Verificando posição na fila de ativação...", icon: Gauge },
  { text: "Contando contas na sua frente...", icon: Users },
  { text: "Calculando tempo estimado de espera...", icon: Clock },
];

interface Props { onNext: () => void; }

const UpsellStep2 = ({ onNext }: Props) => {
  const [completed, setCompleted] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    analysisSteps.forEach((_, i) => {
      setTimeout(() => setCompleted((prev) => [...prev, i]), (i + 1) * 1300);
    });
    setTimeout(() => setShowResult(true), 6000);
  }, []);

  return (
    <div className="flex flex-col items-center gap-6 pt-8">
      {/* Analysis card */}
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
            <p className="text-[15px] font-bold" style={{ color: "#F8FAFC" }}>Analisando sua conta...</p>
            <p className="text-[12px]" style={{ color: "#FACC15" }}>Verificação em tempo real</p>
          </div>
        </div>

        <div className="px-5 py-4 flex flex-col gap-3" style={{ background: "#0F172A" }}>
          {analysisSteps.map((item, i) => (
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
          ))}
        </div>
      </motion.div>

      {/* Result — reveals the problem with TENSION, not the full story */}
      {showResult && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full rounded-2xl overflow-hidden"
          style={{ border: "1px solid rgba(239,68,68,0.25)" }}
        >
          <div className="px-5 py-4 flex items-center gap-3" style={{ background: "rgba(239,68,68,0.08)" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(239,68,68,0.15)" }}>
              <AlertTriangle className="w-5 h-5" style={{ color: "#EF4444" }} />
            </div>
            <div>
              <p className="text-[15px] font-bold" style={{ color: "#F8FAFC" }}>Problema detectado na sua conta</p>
              <p className="text-[12px]" style={{ color: "#EF4444" }}>Ação necessária para continuar</p>
            </div>
          </div>
          <div className="px-5 py-4 flex flex-col gap-3" style={{ background: "#0F172A" }}>
            {/* Mini stats that tease the problem */}
            <div className="flex flex-col gap-2">
              {[
                { value: "2.847", label: "contas na sua frente na fila" },
                { value: "~15 dias", label: "tempo estimado de espera" },
                { value: "73%", label: "desistem antes de operar" },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-3 rounded-lg px-4 py-2.5" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.1)" }}>
                  <span className="text-[18px] font-extrabold min-w-[70px]" style={{ color: "#EF4444" }}>{s.value}</span>
                  <span className="text-[12px]" style={{ color: "#94A3B8" }}>{s.label}</span>
                </div>
              ))}
            </div>

            <p className="text-[13px] leading-relaxed" style={{ color: "#CBD5E1" }}>
              Sua conta está na <strong style={{ color: "#E2E8F0" }}>fila comum de processamento</strong>. No ritmo atual, o sistema só vai começar a operar pra você daqui a <strong style={{ color: "#EF4444" }}>15 dias</strong> — e seu primeiro saque só acontece <strong style={{ color: "#EF4444" }}>depois disso</strong>. Mas existe uma forma de resolver isso agora.
            </p>
          </div>
        </motion.div>
      )}

      {showResult && (
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={onNext}
          className="w-full py-4 rounded-xl text-[16px] font-bold text-white transition-all hover:brightness-110 active:scale-[0.98]"
          style={{ background: "linear-gradient(135deg, #16A34A, #15803D)", boxShadow: "0 0 20px rgba(22,163,74,0.2), 0 4px 12px rgba(0,0,0,0.3)" }}
        >
          VER COMO RESOLVER →
        </motion.button>
      )}
    </div>
  );
};

export default UpsellStep2;
