import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";

interface Props { name: string; }

const UpsellRedirectToNext = ({ name }: Props) => {
  const navigate = useNavigate();
  const firstName = name !== "Visitante" ? name : "";

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/upsell2", { replace: true });
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex flex-col items-center gap-5 pt-10">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 14 }}
        className="w-[72px] h-[72px] rounded-full flex items-center justify-center"
        style={{
          background: "linear-gradient(135deg, rgba(22,163,74,0.2), rgba(34,197,94,0.1))",
          border: "2px solid rgba(22,163,74,0.3)",
        }}
      >
        <Check className="w-9 h-9" style={{ color: "#22C55E" }} strokeWidth={3} />
      </motion.div>

      <h1
        className="text-[22px] font-extrabold text-center leading-tight"
        style={{ color: "#F8FAFC" }}
      >
        {firstName ? `Perfeito, ${firstName}!` : "Perfeito!"}
      </h1>

      <p
        className="text-[14px] text-center leading-relaxed"
        style={{ color: "#94A3B8" }}
      >
        Estamos finalizando a configuração da sua conta. Aguarde...
      </p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="flex items-center gap-2"
      >
        <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#22C55E" }} />
        <span className="text-[13px]" style={{ color: "#64748B" }}>
          Calibrando potencial de ganhos...
        </span>
      </motion.div>
    </div>
  );
};

export default UpsellRedirectToNext;
