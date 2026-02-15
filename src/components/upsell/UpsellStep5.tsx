import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import UpsellLayout from "./UpsellLayout";
import { getUpsellData, saveUpsellChoice } from "@/lib/upsellData";

const days = [
  "Dia 1: Como acessar e entender o painel",
  "Dia 2: Como ativar o robô pela primeira vez",
  "Dia 3: Como ler seus primeiros resultados",
  "Dia 4: Como ajustar a meta de ganho",
  "Dia 5: Como sacar seus primeiros lucros",
  "Dia 6: Como aumentar os ganhos com segurança",
  "Dia 7: Como colocar no piloto automático",
];

const UpsellStep5 = () => {
  const navigate = useNavigate();
  const { name } = getUpsellData();
  const [loading, setLoading] = useState(false);

  const handleBuy = () => {
    setLoading(true);
    saveUpsellChoice({ accelerator: null, guide: true, price: 9.9 });
    setTimeout(() => navigate("/upsell1.6"), 3000);
  };

  return (
    <UpsellLayout progress={75}>
      <div className="flex flex-col gap-5 pt-8">
        <h1 className="text-xl font-bold text-center" style={{ color: "#F8FAFC" }}>
          Espera, {name}! Antes de ir...
        </h1>
        <p className="text-sm text-center" style={{ color: "#94A3B8" }}>
          Entendo que talvez agora não seja o momento para o acelerador. Mas não quero que você passe pelos 7 dias de espera sem nenhum suporte.
        </p>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-5"
          style={{ background: "#0F172A", border: "1px solid #FACC15" }}
        >
          <h3 className="text-xl font-bold" style={{ color: "#F8FAFC" }}>Plano Primeiros Passos</h3>
          <p className="text-[13px] mt-1" style={{ color: "#FACC15" }}>O mapa para não se perder nos primeiros 7 dias</p>
          <p className="text-sm mt-3 leading-relaxed" style={{ color: "#94A3B8" }}>
            Um guia dia a dia do que fazer em cada um dos 7 primeiros dias na plataforma. Cada dia tem uma única tarefa simples de no máximo 10 minutos.
          </p>
          <ul className="mt-4 flex flex-col gap-2">
            {days.map((d) => (
              <li key={d} className="flex items-center gap-2 text-sm" style={{ color: "#F8FAFC" }}>
                <Check className="w-4 h-4 shrink-0" style={{ color: "#16A34A" }} />
                {d}
              </li>
            ))}
          </ul>

          <div className="mt-5">
            <span className="text-sm line-through" style={{ color: "#64748B" }}>De R$ 47</span>
            <p className="text-[28px] font-bold" style={{ color: "#F8FAFC" }}>Por apenas R$ 9,90</p>
            <p className="text-[13px]" style={{ color: "#94A3B8" }}>Pagamento único. Sem mensalidade.</p>
          </div>

          <button
            onClick={handleBuy}
            disabled={loading}
            className="w-full mt-4 py-4 rounded-xl text-base font-bold text-white transition-all hover:brightness-110 disabled:opacity-70"
            style={{ background: "#16A34A" }}
          >
            {loading ? "Processando..." : "SIM, QUERO O GUIA POR R$ 9,90"}
          </button>
        </motion.div>

        <button
          onClick={() => {
            saveUpsellChoice({ accelerator: null, guide: false, price: 0 });
            navigate("/upsell1.6");
          }}
          className="text-[13px] underline cursor-pointer bg-transparent border-none mx-auto"
          style={{ color: "#64748B" }}
        >
          Não, obrigado. Eu prefiro descobrir sozinho.
        </button>
      </div>
    </UpsellLayout>
  );
};

export default UpsellStep5;
