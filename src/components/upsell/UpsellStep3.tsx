import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { getUpsellData, saveUpsellChoice } from "@/lib/upsellData";
import avatarAntonio from "@/assets/avatar-antonio.jpg";
import avatarMaria from "@/assets/avatar-maria.jpg";

interface Props { onNext: () => void; onDecline: () => void; }

const plans = [
  {
    id: "basico" as const,
    name: "Acelerador Básico",
    subtitle: "Primeiros resultados em até 72 horas",
    subtitleColor: "#16A34A",
    description: "A IA opera com prioridade nos servidores, reduzindo o tempo de espera de 7 dias para 72 horas. Inclui uma camada de proteção básica que limita operações de alto risco.",
    features: ["Servidores prioritários ativados", "Proteção básica contra perdas", "Suporte por e-mail"],
    price: 19,
    installments: "2x de R$ 9,90",
    border: "1px solid rgba(255,255,255,0.08)",
    btnStyle: { background: "transparent", color: "#16A34A", border: "2px solid #16A34A" },
    btnText: "ATIVAR ACELERADOR BÁSICO",
    badge: null,
  },
  {
    id: "duplo" as const,
    name: "Acelerador Duplo",
    subtitle: "Primeiros resultados em até 24 horas",
    subtitleColor: "#16A34A",
    description: "Tudo do Básico, mais: uma segunda IA monitora todas as operações em tempo real, garantindo que cada centavo do seu capital esteja protegido. É o plano que 9 em cada 10 novos membros escolhem.",
    features: ["Servidores prioritários ativados", "Proteção dupla contra perdas", "Monitoramento 24h por segunda IA", "Suporte prioritário por WhatsApp"],
    price: 27,
    installments: "3x de R$ 9,90",
    border: "2px solid #16A34A",
    btnStyle: { background: "#16A34A", color: "#fff", border: "none" },
    btnText: "ATIVAR ACELERADOR DUPLO",
    badge: "MAIS ESCOLHIDO",
  },
  {
    id: "maximo" as const,
    name: "Acelerador Máximo",
    subtitle: "Primeiros resultados em até 12 horas",
    subtitleColor: "#FACC15",
    description: "O nível mais alto de aceleração e proteção. Tudo do Duplo, mais: acesso direto a um especialista humano no WhatsApp por 48 horas para te guiar clique por clique.",
    features: ["Servidores prioritários ativados", "Proteção tripla contra perdas", "Monitoramento 24h por segunda IA", "Especialista pessoal no WhatsApp por 48h", "Relatório de ganhos enviado toda manhã"],
    price: 37,
    installments: "4x de R$ 9,90",
    border: "1px solid rgba(255,255,255,0.08)",
    btnStyle: { background: "#FACC15", color: "#020617", border: "none" },
    btnText: "ATIVAR ACELERADOR MÁXIMO",
    badge: null,
  },
];

const UpsellStep3 = ({ onNext, onDecline }: Props) => {
  const { name } = getUpsellData();

  const handleSelect = (plan: typeof plans[0]) => {
    saveUpsellChoice({ accelerator: plan.id, guide: false, price: plan.price });
    onNext();
  };

  return (
    <div className="flex flex-col gap-5 pt-6">
      <h1 className="text-[22px] font-bold text-center" style={{ color: "#F8FAFC" }}>
        {name}, escolha como você quer começar:
      </h1>
      <p className="text-sm text-center" style={{ color: "#94A3B8" }}>
        Cada plano acelera seus primeiros resultados e adiciona camadas de proteção ao seu capital.
      </p>

      {plans.map((plan, i) => (
        <motion.div
          key={plan.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.15 }}
          className="relative rounded-2xl p-5"
          style={{ background: "#0F172A", border: plan.border }}
        >
          {plan.badge && (
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-bold px-3 py-1 rounded-full text-white" style={{ background: "#16A34A" }}>
              {plan.badge}
            </span>
          )}
          <h3 className="text-lg font-bold" style={{ color: "#F8FAFC" }}>{plan.name}</h3>
          <p className="text-[13px] mt-1" style={{ color: plan.subtitleColor }}>{plan.subtitle}</p>
          <p className="text-sm mt-3 leading-relaxed" style={{ color: "#94A3B8" }}>{plan.description}</p>
          <ul className="mt-3 flex flex-col gap-2">
            {plan.features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm" style={{ color: "#F8FAFC" }}>
                <Check className="w-4 h-4 shrink-0" style={{ color: "#16A34A" }} />
                {f}
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-[28px] font-bold" style={{ color: "#F8FAFC" }}>R$ {plan.price}</span>
            <span className="text-[13px]" style={{ color: "#94A3B8" }}>ou {plan.installments}</span>
          </div>
          <button
            onClick={() => handleSelect(plan)}
            className="w-full mt-4 py-4 rounded-xl font-bold text-base transition-all hover:brightness-110"
            style={plan.btnStyle}
          >
            {plan.btnText}
          </button>
        </motion.div>
      ))}

      <div className="rounded-xl p-4" style={{ background: "#1E293B" }}>
        <p className="text-[15px] font-bold mb-3" style={{ color: "#F8FAFC" }}>
          Quem ativou o acelerador está dizendo:
        </p>
        {[
          { img: avatarAntonio, name: "Antônio, 57 anos", text: "Ativei o Duplo e no dia seguinte já tinha R$43 na conta. Se eu tivesse esperado os 7 dias, tinha desistido." },
          { img: avatarMaria, name: "Dona Márcia, 52 anos", text: "O especialista me ajudou a configurar tudo em 10 minutos. Nunca me senti tão segura com algo na internet." },
        ].map((t) => (
          <div key={t.name} className="flex items-start gap-3 mt-3">
            <img src={t.img} alt={t.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
            <div>
              <p className="text-[13px] font-semibold" style={{ color: "#F8FAFC" }}>{t.name}</p>
              <p className="text-[13px] italic leading-relaxed" style={{ color: "#94A3B8" }}>"{t.text}"</p>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={onDecline}
        className="text-[13px] underline cursor-pointer bg-transparent border-none mx-auto"
        style={{ color: "#64748B" }}
      >
        Não, obrigado. Prefiro esperar os 7 dias com a configuração padrão.
      </button>
    </div>
  );
};

export default UpsellStep3;
