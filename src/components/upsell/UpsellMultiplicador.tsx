import { motion } from "framer-motion";
import { Shield, Zap, BarChart3, Star, Crown, Diamond, Check } from "lucide-react";
import { saveUpsellExtras } from "@/lib/upsellData";


interface Props {
  name: string;
  onNext: () => void;
  onDecline: () => void;
}

const plans = [
  {
    id: "prata",
    icon: Shield,
    name: "Plano Prata",
    subtitle: "Ganhe até R$ 250 por dia",
    subtitleColor: "#94A3B8",
    description:
      "O sistema passa a buscar ganhos maiores pra você, mas ainda com bastante cuidado. É como trocar a marcha do carro — você anda mais rápido, mas com segurança.",
    price: 47,
    installments: "5x de R$ 9,90",
    border: "1px solid rgba(255,255,255,0.08)",
    btnBg: "transparent",
    btnColor: "#94A3B8",
    btnBorder: "1.5px solid #94A3B8",
    btnText: "QUERO O PLANO PRATA",
    badge: null,
    checkoutUrl: "https://pay.kirvano.com/b61b6335-9325-4ecb-9b87-8214d948e90e",
  },
  {
    id: "ouro",
    icon: Crown,
    name: "Plano Ouro",
    subtitle: "Ganhe até R$ 500 por dia",
    subtitleColor: "#FACC15",
    description:
      "Além de buscar ganhos maiores, o sistema ganha um 'vigia' automático que fica de olho nas operações o dia todo. Você não precisa fazer nada — ele cuida de tudo pra você.",
    price: 67,
    installments: "7x de R$ 9,90",
    border: "2px solid #FACC15",
    btnBg: "linear-gradient(135deg, #FACC15, #EAB308)",
    btnColor: "#020617",
    btnBorder: "none",
    btnText: "QUERO O PLANO OURO",
    badge: "⭐ MAIS ESCOLHIDO",
    checkoutUrl: "https://pay.kirvano.com/2f8e1d23-b71c-4c4b-9da1-672a6ca75c9b",
  },
  {
    id: "diamante",
    icon: Diamond,
    name: "Plano Diamante",
    subtitle: "Ganhos sem limite",
    subtitleColor: "#60A5FA",
    description:
      "O sistema trabalha no máximo, 24 horas por dia, sem limite de ganho. Você ainda recebe um resumo toda semana no seu WhatsApp mostrando quanto ganhou.",
    price: 97,
    installments: "10x de R$ 9,90",
    border: "1px solid rgba(96,165,250,0.25)",
    btnBg: "linear-gradient(135deg, #3B82F6, #2563EB)",
    btnColor: "#fff",
    btnBorder: "none",
    btnText: "QUERO O PLANO DIAMANTE",
    badge: null,
    checkoutUrl: "https://pay.kirvano.com/e7d1995f-9b55-47d0-a1c4-762b07721162",
  },
];

const UpsellMultiplicador = ({ name, onNext, onDecline }: Props) => {
  const firstName = name !== "Visitante" ? name : "";

  const handleSelect = (plan: (typeof plans)[0]) => {
    saveUpsellExtras("multiplicador", { plan: plan.id, price: plan.price });
  };

  return (
    <div className="flex flex-col gap-5 pt-4">
      {/* Header */}
      <div className="text-center">
        <p
          className="text-[11px] uppercase tracking-widest font-semibold mb-2"
          style={{ color: "#FACC15" }}
        >
          Escolha quanto você quer ganhar por dia
        </p>
        <h1
          className="text-[22px] font-extrabold leading-tight flex items-center justify-center gap-2 flex-wrap"
          style={{ color: "#F8FAFC" }}
        >
          <span>Seu Acelerador já está ativo!</span>
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full shrink-0" style={{ background: "rgba(22,163,74,0.2)", border: "1.5px solid rgba(22,163,74,0.4)" }}>
            <Check className="w-4 h-4" style={{ color: "#22C55E" }} strokeWidth={3} />
          </span>
          <span className="w-full text-center">Agora escolha o seu objetivo de ganho diário.</span>
        </h1>
        <p
          className="text-[14px] mt-3 leading-relaxed"
          style={{ color: "#94A3B8" }}
        >
          {firstName ? `${firstName}, h` : "H"}oje o sistema está configurado para buscar{" "}
          <strong style={{ color: "#FACC15" }}>até R$25 por dia</strong>.{" "}
          Isso é uma proteção pra quem está começando. Se você quiser que ele busque ganhos maiores, é só escolher abaixo. É simples — você escolhe, e o sistema faz o resto.
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
            className="kirvano-payment-trigger w-full mt-4 py-[14px] rounded-xl font-bold text-[15px] transition-all hover:brightness-110 active:scale-[0.98]"
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
        className="kirvano-refuse-trigger text-[12px] underline cursor-pointer bg-transparent border-none mx-auto py-2"
        style={{ color: "#475569" }}
      >
        Não, obrigado. Prefiro manter o limite de R$25/dia por enquanto.
      </button>
    </div>
  );
};

export default UpsellMultiplicador;
