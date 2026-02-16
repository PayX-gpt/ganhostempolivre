import { motion } from "framer-motion";
import { ShieldOff, Clock } from "lucide-react";

/**
 * Ghost page shown to unauthorized visitors (cloners, direct access).
 * Displays a convincing "Vagas Encerradas" message to hide the real offer.
 */
const GhostPage = () => {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-12"
      style={{ background: "linear-gradient(180deg, #0B0F1A 0%, #0F172A 100%)" }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="max-w-md w-full text-center"
      >
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: "rgba(239,68,68,0.1)", border: "2px solid rgba(239,68,68,0.25)" }}
        >
          <ShieldOff className="w-10 h-10" style={{ color: "#EF4444" }} />
        </div>

        <h1
          className="text-[28px] font-extrabold leading-tight"
          style={{ color: "#F8FAFC" }}
        >
          Vagas Encerradas
        </h1>

        <p
          className="text-[15px] mt-4 leading-relaxed"
          style={{ color: "#94A3B8" }}
        >
          Infelizmente, todas as vagas disponíveis para este programa já foram preenchidas. 
          Estamos operando com capacidade máxima no momento.
        </p>

        <div
          className="mt-8 rounded-2xl p-5"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center gap-3 justify-center mb-3">
            <Clock className="w-5 h-5" style={{ color: "#F59E0B" }} />
            <p className="text-[14px] font-semibold" style={{ color: "#F59E0B" }}>
              Lista de espera
            </p>
          </div>
          <p className="text-[13px] leading-relaxed" style={{ color: "#64748B" }}>
            Novas vagas podem ser abertas em breve. Fique atento aos nossos canais 
            oficiais para não perder a próxima oportunidade.
          </p>
        </div>

        <p className="text-[11px] mt-8" style={{ color: "#334155" }}>
          © {new Date().getFullYear()} Ganhos com Tempo Livre. Todos os direitos reservados.
        </p>
      </motion.div>
    </div>
  );
};

export default GhostPage;
