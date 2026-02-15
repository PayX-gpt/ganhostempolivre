import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Zap } from "lucide-react";
import { getUpsellData, getUpsellChoice } from "@/lib/upsellData";

interface Props { onNext: () => void; onDecline: () => void; }

const accelNames: Record<string, string> = { basico: "Básico", duplo: "Duplo", maximo: "Máximo" };
const accelTimes: Record<string, string> = { basico: "72h", duplo: "24h", maximo: "12h" };
const accelProtection: Record<string, string> = { basico: "Básica", duplo: "Dupla", maximo: "Tripla" };
const accelInstallments: Record<string, string> = { basico: "2x de R$ 9,90", duplo: "3x de R$ 9,90", maximo: "4x de R$ 9,90" };

const UpsellStep4 = ({ onNext, onDecline }: Props) => {
  const { name } = getUpsellData();
  const choice = getUpsellChoice();
  const [loading, setLoading] = useState(false);
  const accel = choice.accelerator || "duplo";

  const handleActivate = () => {
    setLoading(true);
    setTimeout(() => onNext(), 3000);
  };

  return (
    <div className="flex flex-col gap-5 pt-8">
      <h1 className="text-xl font-bold text-center" style={{ color: "#F8FAFC" }}>
        Ativando o Acelerador {accelNames[accel]}...
      </h1>

      <div className="rounded-2xl p-6" style={{ background: "#0F172A" }}>
        <h3 className="text-base font-bold mb-4" style={{ color: "#F8FAFC" }}>Resumo da sua ativação</h3>
        {[
          ["Acelerador selecionado:", accelNames[accel]],
          ["Tempo para primeiro resultado:", accelTimes[accel]],
          ["Nível de proteção:", accelProtection[accel]],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between py-2">
            <span className="text-sm" style={{ color: "#94A3B8" }}>{label}</span>
            <span className="text-sm font-semibold" style={{ color: "#F8FAFC" }}>{value}</span>
          </div>
        ))}
        <div className="my-4" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }} />
        <p className="text-2xl font-bold text-center" style={{ color: "#F8FAFC" }}>
          Taxa única de ativação: R$ {choice.price}
        </p>
        <p className="text-[13px] text-center mt-1" style={{ color: "#94A3B8" }}>ou {accelInstallments[accel]}</p>
        <p className="text-[13px] text-center mt-2" style={{ color: "#94A3B8" }}>
          Pagamento processado com o mesmo cartão da compra anterior. Sem precisar digitar nada.
        </p>
      </div>

      <div className="rounded-xl p-3 flex items-start gap-2" style={{ background: "rgba(250,204,21,0.1)", border: "1px solid #FACC15" }}>
        <Zap className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#FACC15" }} />
        <p className="text-[13px] leading-relaxed" style={{ color: "#F8FAFC" }}>
          Esta oferta é exclusiva para novos membros e só está disponível nesta página. Se você sair, o acelerador volta ao preço normal de <strong>R$ 197</strong>.
        </p>
      </div>

      <button
        onClick={handleActivate}
        disabled={loading}
        className="w-full py-4 rounded-xl text-lg font-bold text-white transition-all hover:brightness-110 disabled:opacity-70"
        style={{ background: "#16A34A" }}
      >
        {loading ? (
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Processando ativação...</motion.span>
        ) : (
          "SIM, ATIVAR MEU ACELERADOR AGORA"
        )}
      </button>

      <button onClick={onDecline} className="text-[13px] underline cursor-pointer bg-transparent border-none mx-auto" style={{ color: "#64748B" }}>
        Mudei de ideia, quero continuar sem o acelerador.
      </button>

      <div className="flex items-center justify-center gap-1.5 pb-4">
        <Lock className="w-3.5 h-3.5" style={{ color: "#64748B" }} />
        <span className="text-xs" style={{ color: "#64748B" }}>Pagamento 100% seguro. Garantia de 30 dias.</span>
      </div>
    </div>
  );
};

export default UpsellStep4;
