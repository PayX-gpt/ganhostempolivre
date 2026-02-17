import { motion } from "framer-motion";
import { Check, AlertTriangle, ShieldCheck, Clock } from "lucide-react";

interface Props { name: string; onNext: () => void; }

const UpsellStep1 = ({ name, onNext }: Props) => {
  const firstName = name !== "Visitante" ? name : "";

  return (
    <div className="flex flex-col items-center gap-5 pt-6">
      {/* Animated check */}
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
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-sm font-semibold tracking-wide"
        style={{ color: "#22C55E" }}
      >
        ✓ Pagamento confirmado com sucesso
      </motion.p>

      <h1 className="text-[26px] font-extrabold text-center leading-tight" style={{ color: "#F8FAFC" }}>
        {firstName ? `${firstName}, você está dentro.` : "Você está dentro."}
      </h1>

      <p className="text-[15px] text-center leading-relaxed" style={{ color: "#94A3B8" }}>
        Seu acesso está sendo configurado agora mesmo.{" "}
        {firstName ? `Mas ${firstName}, ` : "Mas "}antes de liberar tudo, preciso te mostrar algo que vai definir a velocidade dos seus primeiros resultados.
      </p>

      {/* Warning card */}
      <div className="w-full rounded-xl p-4" style={{ background: "linear-gradient(135deg, rgba(30,41,59,0.8), rgba(30,41,59,0.6))", borderLeft: "3px solid #FACC15" }}>
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" style={{ color: "#FACC15" }} />
          <div>
            <p className="text-[13px] font-bold mb-1" style={{ color: "#FACC15" }}>Aviso Importante</p>
            <p className="text-[13px] leading-relaxed" style={{ color: "#CBD5E1" }}>
              Na configuração padrão, a plataforma leva <strong style={{ color: "#F8FAFC" }}>em média 7 dias</strong> para calibrar e gerar os primeiros resultados. Durante essa espera, <strong style={{ color: "#F8FAFC" }}>73% dos novos membros desistem</strong> antes de ver o primeiro centavo.
            </p>
          </div>
        </div>
      </div>

      {/* Personal touch */}
      <div className="w-full rounded-xl p-4" style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <p className="text-[14px] leading-relaxed" style={{ color: "#CBD5E1" }}>
          {firstName
            ? `${firstName}, eu sei que você não investiu nesse acesso pra ficar 7 dias olhando pra tela esperando alguma coisa acontecer. Ninguém quer essa sensação. Por isso, quero te dar a chance de pular essa etapa agora.`
            : "Você não investiu nesse acesso pra ficar 7 dias esperando. Ninguém quer isso. Por isso, quero te dar a chance de pular essa etapa agora."}
        </p>
      </div>

      {/* Trust indicators */}
      <div className="flex items-center gap-4 w-full justify-center">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4" style={{ color: "#64748B" }} />
          <span className="text-[11px]" style={{ color: "#64748B" }}>Garantia 30 dias</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-4 h-4" style={{ color: "#64748B" }} />
          <span className="text-[11px]" style={{ color: "#64748B" }}>Leva 30 segundos</span>
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={onNext}
        className="w-full py-[18px] px-8 rounded-xl text-[17px] font-bold text-white transition-all hover:brightness-110 active:scale-[0.98]"
        style={{ background: "linear-gradient(135deg, #16A34A, #15803D)", boxShadow: "0 0 20px rgba(22,163,74,0.3), 0 4px 12px rgba(0,0,0,0.3)", animation: "pulse-btn 2.5s ease-in-out infinite" }}
      >
        ENTENDI — O QUE VOCÊS RECOMENDAM?
      </button>

      <p className="text-[12px]" style={{ color: "#475569" }}>
        Sem compromisso. Você decide se faz sentido.
      </p>
    </div>
  );
};

export default UpsellStep1;
