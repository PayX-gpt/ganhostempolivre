import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, AlertTriangle } from "lucide-react";
import UpsellLayout from "./UpsellLayout";
import { getUpsellData } from "@/lib/upsellData";

const UpsellStep1 = () => {
  const navigate = useNavigate();
  const { name } = getUpsellData();

  return (
    <UpsellLayout progress={10}>
      <div className="flex flex-col items-center gap-6 pt-8">
        {/* Check animado */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.3 }}
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: "rgba(22,163,74,0.15)" }}
        >
          <Check className="w-8 h-8" style={{ color: "#16A34A" }} />
        </motion.div>

        <p className="text-sm font-medium" style={{ color: "#16A34A" }}>
          Pagamento confirmado com sucesso!
        </p>

        <h1 className="text-2xl font-bold text-center" style={{ color: "#F8FAFC" }}>
          Parabéns, {name}. Você está dentro.
        </h1>

        <p className="text-[15px] text-center leading-relaxed" style={{ color: "#94A3B8" }}>
          Seu acesso à Plataforma Tempo Livre está sendo gerado agora. Enquanto isso, preciso te mostrar algo importante — vai levar menos de 60 segundos.
        </p>

        {/* Card de aviso */}
        <div className="w-full rounded-2xl p-4" style={{ background: "#1E293B", borderLeft: "3px solid #FACC15" }}>
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" style={{ color: "#FACC15" }} />
            <p className="text-sm leading-relaxed" style={{ color: "#94A3B8" }}>
              <strong style={{ color: "#FACC15" }}>Aviso do Sistema:</strong> A configuração padrão da sua conta leva em média 7 dias para gerar os primeiros resultados. Durante esse período, muitos novos membros ficam ansiosos e desistem antes de ver o dinheiro entrar.
            </p>
          </div>
        </div>

        <p className="text-[15px] text-center leading-relaxed" style={{ color: "#94A3B8" }}>
          {name}, eu sei que você já passou por isso antes — aquela sensação de esperar e nada acontecer. Por isso, antes de liberar seu acesso, quero te dar uma chance de eliminar essa espera.
        </p>

        {/* CTA */}
        <button
          onClick={() => navigate("/upsell1.2")}
          className="w-full py-4 px-8 rounded-xl text-lg font-bold text-white transition-all hover:brightness-110"
          style={{ background: "#16A34A", animation: "pulse-btn 2.5s ease-in-out infinite" }}
        >
          ENTENDI. O QUE VOCÊS RECOMENDAM?
        </button>

        <p className="text-[13px]" style={{ color: "#64748B" }}>
          Configuração leva menos de 30 segundos.
        </p>
      </div>
    </UpsellLayout>
  );
};

export default UpsellStep1;
