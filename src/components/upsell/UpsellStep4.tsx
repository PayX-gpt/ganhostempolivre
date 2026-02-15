import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Zap, ShieldCheck } from "lucide-react";
import { getUpsellChoice } from "@/lib/upsellData";

interface Props { name: string; onNext: () => void; onDecline: () => void; }

const accelNames: Record<string, string> = { basico: "Básico", duplo: "Duplo", maximo: "Máximo" };
const accelTimes: Record<string, string> = { basico: "72 horas", duplo: "24 horas", maximo: "12 horas" };
const accelProtection: Record<string, string> = { basico: "Básica", duplo: "Dupla", maximo: "Tripla" };
const accelInstallments: Record<string, string> = { basico: "2x de R$ 9,90", duplo: "3x de R$ 9,90", maximo: "4x de R$ 9,90" };

const UpsellStep4 = ({ name, onNext, onDecline }: Props) => {
  const choice = getUpsellChoice();
  const [loading, setLoading] = useState(false);
  const accel = choice.accelerator || "duplo";
  const firstName = name !== "Visitante" ? name : "";

  const handleActivate = () => {
    setLoading(true);
    setTimeout(onNext, 2500);
  };

  return (
    <div className="flex flex-col gap-5 pt-6">
      <h1 className="text-xl font-bold text-center" style={{ color: "#F8FAFC" }}>
        {firstName ? `${firstName}, confirme` : "Confirme"} sua ativação
      </h1>

      <div className="rounded-2xl p-5" style={{ background: "#0F172A", border: "1px solid rgba(255,255,255,0.06)" }}>
        <h3 className="text-[15px] font-bold mb-4" style={{ color: "#94A3B8" }}>RESUMO</h3>

        {[
          ["Acelerador", accelNames[accel]],
          ["Primeiro resultado em", accelTimes[accel]],
          ["Proteção", accelProtection[accel]],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            <span className="text-[14px]" style={{ color: "#94A3B8" }}>{label}</span>
            <span className="text-[14px] font-semibold" style={{ color: "#F8FAFC" }}>{value}</span>
          </div>
        ))}

        <div className="mt-5 text-center">
          <p className="text-[13px]" style={{ color: "#64748B" }}>Taxa única de ativação</p>
          <p className="text-[32px] font-extrabold mt-1" style={{ color: "#F8FAFC" }}>
            R$ {choice.price}
          </p>
          <p className="text-[12px] mt-1" style={{ color: "#64748B" }}>ou {accelInstallments[accel]}</p>
        </div>

        <p className="text-[12px] text-center mt-3 leading-relaxed" style={{ color: "#64748B" }}>
          Cobrado no mesmo cartão da compra anterior. Você não precisa digitar nada.
        </p>
      </div>

      {/* Urgência */}
      <div className="rounded-xl p-3.5 flex items-start gap-2.5" style={{ background: "rgba(250,204,21,0.06)", border: "1px solid rgba(250,204,21,0.2)" }}>
        <Zap className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#FACC15" }} />
        <p className="text-[12px] leading-relaxed" style={{ color: "#CBD5E1" }}>
          Oferta exclusiva para novos membros. Disponível <strong style={{ color: "#FACC15" }}>apenas nesta página</strong>. Preço normal: R$ 197.
        </p>
      </div>

      <button
        onClick={handleActivate}
        disabled={loading}
        className="w-full py-[18px] rounded-xl text-[16px] font-bold text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-70"
        style={{ background: "linear-gradient(135deg, #16A34A, #15803D)", boxShadow: "0 0 20px rgba(22,163,74,0.25), 0 4px 12px rgba(0,0,0,0.3)" }}
      >
        {loading ? (
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Processando ativação...</motion.span>
        ) : (
          "ATIVAR MEU ACELERADOR AGORA"
        )}
      </button>

      <button onClick={onDecline} className="text-[12px] underline cursor-pointer bg-transparent border-none mx-auto" style={{ color: "#475569" }}>
        Mudei de ideia
      </button>

      <div className="flex items-center justify-center gap-4 pb-4">
        <div className="flex items-center gap-1">
          <Lock className="w-3.5 h-3.5" style={{ color: "#475569" }} />
          <span className="text-[11px]" style={{ color: "#475569" }}>100% seguro</span>
        </div>
        <div className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" style={{ color: "#475569" }} />
          <span className="text-[11px]" style={{ color: "#475569" }}>Garantia 30 dias</span>
        </div>
      </div>
    </div>
  );
};

export default UpsellStep4;
