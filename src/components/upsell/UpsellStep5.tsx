import { useState } from "react";
import { motion } from "framer-motion";
import { Check, BookOpen, ArrowRight } from "lucide-react";
import { saveUpsellChoice } from "@/lib/upsellData";
import { buildTrackingQueryString } from "@/lib/trackingDataLayer";

interface Props { name: string; onBuy: () => void; onDecline: () => void; }

const days = [
  { day: "Dia 1", task: "Acessar e entender o painel" },
  { day: "Dia 2", task: "Ativar o robô pela primeira vez" },
  { day: "Dia 3", task: "Ler seus primeiros resultados" },
  { day: "Dia 4", task: "Ajustar a meta de ganho" },
  { day: "Dia 5", task: "Sacar seus primeiros lucros" },
  { day: "Dia 6", task: "Aumentar ganhos com segurança" },
  { day: "Dia 7", task: "Colocar no piloto automático" },
];

const UpsellStep5 = ({ name, onBuy, onDecline }: Props) => {
  const firstName = name !== "Visitante" ? name : "";
  const [loading, setLoading] = useState(false);

  const handleBuy = () => {
    setLoading(true);
    saveUpsellChoice({ accelerator: null, guide: true, price: 9.9 });
    const checkoutUrl = "https://pay.kirvano.com/06c6007a-0cd9-48f2-8f95-1b933e05509a";
    const utmQs = buildTrackingQueryString();
    const separator = checkoutUrl.includes("?") ? "&" : "?";
    const fullUrl = utmQs ? `${checkoutUrl}${separator}${utmQs.slice(1)}` : checkoutUrl;
    window.open(fullUrl, "_blank");
  };

  return (
    <div className="flex flex-col gap-5 pt-6">
      <div className="text-center">
        <h1 className="text-[22px] font-extrabold" style={{ color: "#F8FAFC" }}>
          {firstName ? `${firstName}, espera...` : "Espera..."}
        </h1>
        <p className="text-[14px] mt-2 leading-relaxed" style={{ color: "#94A3B8" }}>
          Entendo que o acelerador talvez não faça sentido agora. Mas {firstName ? `${firstName}, ` : ""}não quero que você fique perdido nos primeiros 7 dias.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl overflow-hidden"
        style={{ border: "1px solid rgba(250,204,21,0.25)" }}
      >
        {/* Header */}
        <div className="p-4 flex items-center gap-3" style={{ background: "rgba(250,204,21,0.08)" }}>
          <BookOpen className="w-6 h-6" style={{ color: "#FACC15" }} />
          <div>
            <h3 className="text-[17px] font-bold" style={{ color: "#F8FAFC" }}>Guia Primeiros Passos</h3>
            <p className="text-[12px]" style={{ color: "#FACC15" }}>7 dias · 1 tarefa por dia · 10 min cada</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-4" style={{ background: "#0F172A" }}>
          <p className="text-[13px] leading-relaxed mb-4" style={{ color: "#94A3B8" }}>
            Um mapa dia a dia do que fazer em cada etapa. Cada dia tem uma única tarefa simples. Você nunca vai se sentir perdido.
          </p>

          <div className="flex flex-col gap-2">
            {days.map((d) => (
              <div key={d.day} className="flex items-center gap-2.5 py-1.5">
                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(22,163,74,0.15)" }}>
                  <Check className="w-3 h-3" style={{ color: "#22C55E" }} />
                </div>
                <span className="text-[13px]" style={{ color: "#64748B" }}>{d.day}:</span>
                <span className="text-[13px]" style={{ color: "#E2E8F0" }}>{d.task}</span>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-baseline gap-3">
              <span className="text-[14px] line-through" style={{ color: "#475569" }}>R$ 47</span>
              <span className="text-[28px] font-extrabold" style={{ color: "#F8FAFC" }}>R$ 9,90</span>
            </div>
            <p className="text-[12px] mt-1" style={{ color: "#64748B" }}>Pagamento único. Sem assinatura.</p>
          </div>

          <button
            onClick={handleBuy}
            disabled={loading}
            className="w-full mt-4 py-[16px] rounded-xl text-[15px] font-bold text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, #16A34A, #15803D)" }}
          >
            {loading ? "Processando..." : <>QUERO O GUIA POR R$ 9,90 <ArrowRight className="w-4 h-4" /></>}
          </button>
        </div>
      </motion.div>

      <button
        onClick={() => {
          saveUpsellChoice({ accelerator: null, guide: false, price: 0 });
          onDecline();
        }}
        className="text-[12px] underline cursor-pointer bg-transparent border-none mx-auto py-2"
        style={{ color: "#475569" }}
      >
        Não, prefiro descobrir sozinho.
      </button>
    </div>
  );
};

export default UpsellStep5;
