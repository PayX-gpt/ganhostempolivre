import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import { navigateToUpsell } from "@/lib/upsellData";
import { useLanguage } from "@/lib/i18n";

const TEXTS = {
  pt: { title: (n: string) => (n ? `Perfeito, ${n}!` : "Perfeito!"), sub: "Estamos finalizando a configuração da sua conta. Aguarde...", calib: "Calibrando potencial de ganhos..." },
  en: { title: (n: string) => (n ? `Perfect, ${n}!` : "Perfect!"), sub: "We're finishing setting up your account. One moment...", calib: "Calibrating your earnings potential..." },
  es: { title: (n: string) => (n ? `¡Perfecto, ${n}!` : "¡Perfecto!"), sub: "Estamos terminando de configurar tu cuenta. Un momento...", calib: "Calibrando tu potencial de ganancias..." },
};

interface Props { name: string; }

const UpsellRedirectToNext = ({ name }: Props) => {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const t = TEXTS[lang];
  const firstName = name !== "Visitante" ? name : "";

  useEffect(() => {
    const timer = setTimeout(() => {
      navigateToUpsell(navigate, "/upsell2", true);
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
        {t.title(firstName)}
      </h1>

      <p
        className="text-[14px] text-center leading-relaxed"
        style={{ color: "#94A3B8" }}
      >
        {t.sub}
      </p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="flex items-center gap-2"
      >
        <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#22C55E" }} />
        <span className="text-[13px]" style={{ color: "#64748B" }}>
          {t.calib}
        </span>
      </motion.div>
    </div>
  );
};

export default UpsellRedirectToNext;
