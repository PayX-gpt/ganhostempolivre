import { motion } from "framer-motion";
import { Check, ShieldCheck, Clock, AlertTriangle } from "lucide-react";

interface Props { name: string; onNext: () => void; }

const UpsellStep1 = ({ name, onNext }: Props) => {
  const firstName = name !== "Visitante" ? name : "";

  return (
    <div className="flex flex-col gap-6 pt-6">
      {/* Celebration — dopamine hit */}
      <div className="flex flex-col items-center gap-4">
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
          Pagamento confirmado com sucesso
        </motion.p>

        <h1 className="text-[26px] font-extrabold text-center leading-tight" style={{ color: "#F8FAFC" }}>
          {firstName ? `Parabéns, ${firstName}!` : "Parabéns!"}<br />
          Seu acesso está ativo.
        </h1>

        <p className="text-[14px] text-center leading-relaxed" style={{ color: "#94A3B8" }}>
          Seu sistema já está sendo configurado nos nossos servidores.
        </p>
      </div>

      {/* Pattern interrupt — ONE seed of doubt, no full explanation */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="rounded-2xl overflow-hidden"
        style={{ border: "1px solid rgba(250,204,21,0.25)" }}
      >
        <div className="px-5 py-4 flex items-center gap-3" style={{ background: "rgba(250,204,21,0.06)" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(250,204,21,0.12)" }}>
            <AlertTriangle className="w-5 h-5" style={{ color: "#FACC15" }} />
          </div>
          <div>
            <p className="text-[15px] font-bold" style={{ color: "#F8FAFC" }}>Antes de continuar — uma informação importante.</p>
          </div>
        </div>

        <div className="px-5 py-4" style={{ background: "#0F172A" }}>
          <p className="text-[14px] leading-relaxed" style={{ color: "#CBD5E1" }}>
            {firstName ? `${firstName}, o` : "O"} sistema funciona. Isso não é o problema.
          </p>
          <p className="text-[14px] leading-relaxed mt-3" style={{ color: "#CBD5E1" }}>
            O problema é <strong style={{ color: "#FACC15" }}>quando</strong> ele começa a funcionar <strong style={{ color: "#FACC15" }}>pra você</strong>. Existe um detalhe técnico que a maioria dos novos membros só descobre <strong style={{ color: "#EF4444" }}>tarde demais</strong>.
          </p>
          <p className="text-[14px] leading-relaxed mt-3" style={{ color: "#CBD5E1" }}>
            Deixa eu te mostrar o que o nosso sistema detectou na sua conta agora.
          </p>
        </div>
      </motion.div>

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

      {/* CTA — curiosity-driven, not solution-driven */}
      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        onClick={onNext}
        className="w-full py-[18px] px-8 rounded-xl text-[17px] font-bold text-white transition-all hover:brightness-110 active:scale-[0.98]"
        style={{ background: "linear-gradient(135deg, #16A34A, #15803D)", boxShadow: "0 0 20px rgba(22,163,74,0.3), 0 4px 12px rgba(0,0,0,0.3)" }}
      >
        VER O QUE FOI DETECTADO →
      </motion.button>

      <p className="text-[12px] text-center pb-4" style={{ color: "#475569" }}>
        Sem compromisso. É só uma verificação.
      </p>
    </div>
  );
};

export default UpsellStep1;
