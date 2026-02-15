import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Zap, BarChart3, Star, Crown, Diamond } from "lucide-react";
import { saveUpsellExtras } from "@/lib/upsellData";
import { buildTrackingQueryString } from "@/lib/trackingDataLayer";

interface Props {
  name: string;
  onNext: () => void;
  onDecline: () => void;
}

const plans = [
  {
    id: "prata",
    icon: Shield,
    name: "Potencial Prata",
    subtitle: "Até R$ 250/dia",
    subtitleColor: "#94A3B8",
    description:
      "Aumenta o teto de segurança da sua IA. Ideal para quem quer dobrar os ganhos mantendo um controle conservador.",
    price: 47,
    installments: "5x de R$ 9,90",
    border: "1px solid rgba(255,255,255,0.08)",
    btnBg: "transparent",
    btnColor: "#94A3B8",
    btnBorder: "1.5px solid #94A3B8",
    btnText: "ATIVAR POTENCIAL PRATA",
    badge: null,
    checkoutUrl: "https://pay.kirvano.com/PRATA_PLACEHOLDER",
  },
  {
    id: "ouro",
    icon: Crown,
    name: "Potencial Ouro",
    subtitle: "Até R$ 500/dia",
    subtitleColor: "#FACC15",
    description:
      "Aumenta o teto e instala o 'Robô Vigia', uma segunda IA que monitora as operações de maior valor, permitindo buscar lucros maiores com a mesma segurança.",
    price: 67,
    installments: "7x de R$ 9,90",
    border: "2px solid #FACC15",
    btnBg: "linear-gradient(135deg, #FACC15, #EAB308)",
    btnColor: "#020617",
    btnBorder: "none",
    btnText: "ATIVAR POTENCIAL OURO",
    badge: "⭐ RECOMENDADO",
    checkoutUrl: "https://pay.kirvano.com/OURO_PLACEHOLDER",
  },
  {
    id: "diamante",
    icon: Diamond,
    name: "Potencial Ilimitado",
    subtitle: "Sem Limites",
    subtitleColor: "#60A5FA",
    description:
      "Removemos todos os tetos. A IA opera com 100% do potencial, 24h por dia. Inclui o 'Robô Vigia' e um relatório semanal de performance enviado no seu WhatsApp.",
    price: 97,
    installments: "10x de R$ 9,90",
    border: "1px solid rgba(96,165,250,0.25)",
    btnBg: "linear-gradient(135deg, #3B82F6, #2563EB)",
    btnColor: "#fff",
    btnBorder: "none",
    btnText: "ATIVAR POTENCIAL DIAMANTE",
    badge: null,
    checkoutUrl: "https://pay.kirvano.com/DIAMANTE_PLACEHOLDER",
  },
];

const UpsellMultiplicador = ({ name, onNext, onDecline }: Props) => {
  const firstName = name !== "Visitante" ? name : "";

  const handleSelect = (plan: (typeof plans)[0]) => {
    saveUpsellExtras("multiplicador", { plan: plan.id, price: plan.price });
    const utmQs = buildTrackingQueryString();
    const separator = plan.checkoutUrl.includes("?") ? "&" : "?";
    const fullUrl = utmQs
      ? `${plan.checkoutUrl}${separator}${utmQs.slice(1)}`
      : plan.checkoutUrl;
    window.open(fullUrl, "_blank");
    onNext();
  };

  return (
    <div className="flex flex-col gap-5 pt-4">
      {/* Header */}
      <div className="text-center">
        <p
          className="text-[11px] uppercase tracking-widest font-semibold mb-2"
          style={{ color: "#FACC15" }}
        >
          Calibrando seu Potencial de Ganhos Diários
        </p>
        <h1
          className="text-[22px] font-extrabold leading-tight"
          style={{ color: "#F8FAFC" }}
        >
          Seu Acelerador está ativo. Última calibração de potencial...
        </h1>
        <p
          className="text-[14px] mt-3 leading-relaxed"
          style={{ color: "#94A3B8" }}
        >
          {firstName ? `${firstName}, p` : "P"}or padrão, sua conta vem com um{" "}
          <strong style={{ color: "#FACC15" }}>teto de segurança de R$100/dia</strong>{" "}
          para proteger seu capital inicial. Para ganhar mais, precisamos que
          você autorize o sistema a buscar lucros maiores. Escolha até onde você
          quer chegar:
        </p>
      </div>

      {/* Cards */}
      {plans.map((plan, i) => (
        <motion.div
          key={plan.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.12 }}
          className="relative rounded-2xl p-5"
          style={{ background: "#0F172A", border: plan.border }}
        >
          {plan.badge && (
            <span
              className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-bold px-4 py-1 rounded-full whitespace-nowrap"
              style={{
                background: "linear-gradient(135deg, #FACC15, #EAB308)",
                color: "#020617",
                boxShadow: "0 2px 8px rgba(250,204,21,0.3)",
              }}
            >
              {plan.badge}
            </span>
          )}

          <div className="flex items-center gap-2.5 mb-1">
            <plan.icon
              className="w-5 h-5"
              style={{ color: plan.subtitleColor }}
            />
            <h3
              className="text-[17px] font-bold"
              style={{ color: "#F8FAFC" }}
            >
              {plan.name}
            </h3>
          </div>
          <p
            className="text-[13px] font-medium"
            style={{ color: plan.subtitleColor }}
          >
            {plan.subtitle}
          </p>
          <p
            className="text-[13px] mt-3 leading-relaxed"
            style={{ color: "#94A3B8" }}
          >
            {plan.description}
          </p>

          <div className="mt-4 flex items-baseline gap-2">
            <span
              className="text-[28px] font-extrabold"
              style={{ color: "#F8FAFC" }}
            >
              R$ {plan.price}
            </span>
            <span className="text-[12px]" style={{ color: "#64748B" }}>
              ou {plan.installments}
            </span>
          </div>

          <button
            onClick={() => handleSelect(plan)}
            className="w-full mt-4 py-[14px] rounded-xl font-bold text-[15px] transition-all hover:brightness-110 active:scale-[0.98]"
            style={{
              background: plan.btnBg,
              color: plan.btnColor,
              border: plan.btnBorder,
            }}
          >
            {plan.btnText}
          </button>
        </motion.div>
      ))}

      <button
        onClick={onDecline}
        className="text-[12px] underline cursor-pointer bg-transparent border-none mx-auto py-2"
        style={{ color: "#475569" }}
      >
        Não, obrigado. Prefiro manter o teto de R$100/dia por enquanto.
      </button>
    </div>
  );
};

export default UpsellMultiplicador;
