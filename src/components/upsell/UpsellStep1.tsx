import { motion } from "framer-motion";
import { Check, AlertTriangle, ShieldCheck, Clock, Users, TrendingDown, XCircle } from "lucide-react";

interface Props { name: string; onNext: () => void; }

const UpsellStep1 = ({ name, onNext }: Props) => {
  const firstName = name !== "Visitante" ? name : "";

  return (
    <div className="flex flex-col gap-6 pt-6">
      {/* Confirmation badge */}
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
          {firstName ? `${firstName}, você está dentro.` : "Você está dentro."}
        </h1>
      </div>

      {/* Critical alert card — same design as Step3 problem card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="rounded-2xl overflow-hidden"
        style={{ border: "1px solid rgba(239,68,68,0.25)" }}
      >
        <div className="px-5 py-4 flex items-center gap-3" style={{ background: "rgba(239,68,68,0.08)" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(239,68,68,0.15)" }}>
            <AlertTriangle className="w-5 h-5" style={{ color: "#EF4444" }} />
          </div>
          <div>
            <p className="text-[15px] font-bold" style={{ color: "#F8FAFC" }}>Mas eu preciso te avisar de uma coisa.</p>
            <p className="text-[12px]" style={{ color: "#EF4444" }}>Leia com atenção antes de continuar.</p>
          </div>
        </div>

        <div className="px-5 py-4 flex flex-col gap-4" style={{ background: "#0F172A" }}>
          <p className="text-[13px] leading-relaxed" style={{ color: "#CBD5E1" }}>
            O sistema que você acabou de ativar <strong style={{ color: "#E2E8F0" }}>funciona</strong>. Já provou isso com milhares de pessoas. Mas existe um problema que ninguém te conta:
          </p>

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl p-3 text-center" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.1)" }}>
              <div className="flex justify-center mb-1.5">
                <Clock className="w-5 h-5" style={{ color: "#EF4444" }} />
              </div>
              <p className="text-[20px] font-extrabold" style={{ color: "#EF4444" }}>15 dias</p>
              <p className="text-[11px] mt-0.5" style={{ color: "#94A3B8" }}>até o sistema começar a operar</p>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.1)" }}>
              <div className="flex justify-center mb-1.5">
                <XCircle className="w-5 h-5" style={{ color: "#EF4444" }} />
              </div>
              <p className="text-[20px] font-extrabold" style={{ color: "#EF4444" }}>73%</p>
              <p className="text-[11px] mt-0.5" style={{ color: "#94A3B8" }}>desistem antes de ver o primeiro resultado</p>
            </div>
          </div>

          <p className="text-[13px] leading-relaxed" style={{ color: "#CBD5E1" }}>
            Sua conta acabou de entrar numa <strong style={{ color: "#E2E8F0" }}>fila de processamento</strong> com milhares de outras pessoas. Na configuração padrão, o primeiro saque só acontece com <strong style={{ color: "#E2E8F0" }}>30 dias</strong>. E é exatamente nessa espera que a maioria desiste.
          </p>
        </div>
      </motion.div>

      {/* Personal message — same card style */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="rounded-2xl overflow-hidden"
        style={{ border: "1px solid rgba(250,204,21,0.2)" }}
      >
        <div className="px-5 py-4" style={{ background: "rgba(250,204,21,0.04)" }}>
          <p className="text-[14px] leading-relaxed" style={{ color: "#CBD5E1" }}>
            {firstName
              ? <><strong style={{ color: "#FACC15" }}>{firstName}</strong>, eu sei que você não investiu nesse acesso pra ficar 15 dias olhando pra tela sem nada acontecer. Ninguém quer essa sensação.</>
              : <>Você não investiu nesse acesso pra ficar 15 dias sem nada acontecer. Ninguém quer isso.</>}
          </p>
          <p className="text-[14px] leading-relaxed mt-3" style={{ color: "#CBD5E1" }}>
            A boa notícia? <strong style={{ color: "#22C55E" }}>Existe uma forma de pular essa fila e começar a ver resultados muito mais rápido.</strong> E ela está disponível <strong style={{ color: "#FACC15" }}>apenas nesta página, agora.</strong>
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

      {/* CTA */}
      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        onClick={onNext}
        className="w-full py-[18px] px-8 rounded-xl text-[17px] font-bold text-white transition-all hover:brightness-110 active:scale-[0.98]"
        style={{ background: "linear-gradient(135deg, #16A34A, #15803D)", boxShadow: "0 0 20px rgba(22,163,74,0.3), 0 4px 12px rgba(0,0,0,0.3)" }}
      >
        COMO FAÇO PRA PULAR A FILA?
      </motion.button>

      <p className="text-[12px] text-center pb-4" style={{ color: "#475569" }}>
        Sem compromisso. Você decide se faz sentido.
      </p>
    </div>
  );
};

export default UpsellStep1;
