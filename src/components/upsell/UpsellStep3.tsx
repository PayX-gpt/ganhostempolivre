import { motion } from "framer-motion";
import { Check, Shield, Zap, MessageCircle, BarChart3, Headphones } from "lucide-react";
import { saveUpsellChoice } from "@/lib/upsellData";
import { buildTrackingQueryString } from "@/lib/trackingDataLayer";
import avatarAntonio from "@/assets/avatar-antonio.jpg";
import avatarMaria from "@/assets/avatar-maria.jpg";

interface Props { name: string; onNext: () => void; onDecline: () => void; }

const plans = [
  {
    id: "basico" as const,
    name: "Acelerador Básico",
    subtitle: "Resultados em até 72 horas",
    subtitleColor: "#22C55E",
    description: "A plataforma opera com prioridade nos servidores dedicados, reduzindo de 7 dias para 72 horas. Proteção básica ativada.",
    features: [
      { icon: Zap, text: "Servidores prioritários" },
      { icon: Shield, text: "Proteção básica contra perdas" },
      { icon: Headphones, text: "Suporte por e-mail" },
    ],
    price: 19, installments: "2x de R$ 9,90",
    border: "1px solid rgba(255,255,255,0.08)",
    btnBg: "transparent", btnColor: "#22C55E", btnBorder: "1.5px solid #22C55E",
    btnText: "ATIVAR BÁSICO",
    badge: null,
    checkoutUrl: "https://pay.kirvano.com/863c8fe9-ca48-452f-9fa4-22e14df182cf",
  },
  {
    id: "duplo" as const,
    name: "Acelerador Duplo",
    subtitle: "Resultados em até 24 horas",
    subtitleColor: "#22C55E",
    description: "Tudo do Básico + uma segunda IA monitora cada operação em tempo real. É o que 9 em cada 10 novos membros escolhem.",
    features: [
      { icon: Zap, text: "Servidores prioritários" },
      { icon: Shield, text: "Proteção dupla contra perdas" },
      { icon: BarChart3, text: "Monitoramento 24h por segunda IA" },
      { icon: MessageCircle, text: "Suporte prioritário no WhatsApp" },
    ],
    price: 27, installments: "3x de R$ 9,90",
    border: "2px solid #22C55E",
    btnBg: "linear-gradient(135deg, #16A34A, #15803D)", btnColor: "#fff", btnBorder: "none",
    btnText: "ATIVAR DUPLO — MAIS ESCOLHIDO",
    badge: "⚡ RECOMENDADO",
    checkoutUrl: "https://pay.kirvano.com/59a5cba3-f876-46a8-b0e4-6e2c72cf725a",
  },
  {
    id: "maximo" as const,
    name: "Acelerador Máximo",
    subtitle: "Resultados em até 12 horas",
    subtitleColor: "#FACC15",
    description: "O nível máximo. Tudo do Duplo + um especialista humano te guia clique por clique no WhatsApp por 48h.",
    features: [
      { icon: Zap, text: "Servidores prioritários" },
      { icon: Shield, text: "Proteção tripla contra perdas" },
      { icon: BarChart3, text: "Monitoramento 24h por segunda IA" },
      { icon: MessageCircle, text: "Especialista pessoal no WhatsApp — 48h" },
      { icon: Headphones, text: "Relatório de ganhos toda manhã" },
    ],
    price: 37, installments: "4x de R$ 9,90",
    border: "1px solid rgba(250,204,21,0.25)",
    btnBg: "linear-gradient(135deg, #FACC15, #EAB308)", btnColor: "#020617", btnBorder: "none",
    btnText: "ATIVAR MÁXIMO",
    badge: null,
    checkoutUrl: "https://pay.kirvano.com/e8135deb-de2d-4cac-bbeb-1aed6610921c",
  },
];

const UpsellStep3 = ({ name, onNext, onDecline }: Props) => {
  const firstName = name !== "Visitante" ? name : "";

  const handleSelect = (plan: typeof plans[0]) => {
    saveUpsellChoice({ accelerator: plan.id, guide: false, price: plan.price });
    const utmQs = buildTrackingQueryString();
    const separator = plan.checkoutUrl.includes("?") ? "&" : "?";
    const fullUrl = utmQs ? `${plan.checkoutUrl}${separator}${utmQs.slice(1)}` : plan.checkoutUrl;
    window.open(fullUrl, "_blank");
  };

  return (
    <div className="flex flex-col gap-5 pt-4">
      <div className="text-center">
        <h1 className="text-[22px] font-extrabold leading-tight" style={{ color: "#F8FAFC" }}>
          {firstName ? `${firstName}, como` : "Como"} você quer começar?
        </h1>
        <p className="text-[14px] mt-2 leading-relaxed" style={{ color: "#94A3B8" }}>
          Cada plano acelera seus primeiros resultados e protege seu capital. Escolha o que faz sentido pra sua realidade agora.
        </p>
      </div>

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
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-bold px-4 py-1 rounded-full text-white whitespace-nowrap" style={{ background: "linear-gradient(135deg, #16A34A, #15803D)", boxShadow: "0 2px 8px rgba(22,163,74,0.3)" }}>
              {plan.badge}
            </span>
          )}

          <h3 className="text-[17px] font-bold" style={{ color: "#F8FAFC" }}>{plan.name}</h3>
          <p className="text-[13px] font-medium mt-1" style={{ color: plan.subtitleColor }}>{plan.subtitle}</p>
          <p className="text-[13px] mt-3 leading-relaxed" style={{ color: "#94A3B8" }}>{plan.description}</p>

          <ul className="mt-3 flex flex-col gap-2">
            {plan.features.map((f) => (
              <li key={f.text} className="flex items-center gap-2.5">
                <f.icon className="w-4 h-4 shrink-0" style={{ color: "#22C55E" }} />
                <span className="text-[13px]" style={{ color: "#E2E8F0" }}>{f.text}</span>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-[28px] font-extrabold" style={{ color: "#F8FAFC" }}>R$ {plan.price}</span>
            <span className="text-[12px]" style={{ color: "#64748B" }}>ou {plan.installments}</span>
          </div>

          <button
            onClick={() => handleSelect(plan)}
            className="w-full mt-4 py-[14px] rounded-xl font-bold text-[15px] transition-all hover:brightness-110 active:scale-[0.98]"
            style={{ background: plan.btnBg, color: plan.btnColor, border: plan.btnBorder }}
          >
            {plan.btnText}
          </button>
        </motion.div>
      ))}

      {/* Social proof */}
      <div className="rounded-xl p-4" style={{ background: "rgba(30,41,59,0.6)", border: "1px solid rgba(255,255,255,0.04)" }}>
        <p className="text-[14px] font-bold mb-3" style={{ color: "#E2E8F0" }}>
          Quem ativou o acelerador:
        </p>
        {[
          { img: avatarAntonio, name: "Antônio, 57", text: "Ativei o Duplo e no dia seguinte caiu R$43 na conta. Se tivesse esperado os 7 dias, já tinha desistido." },
          { img: avatarMaria, name: "Dona Márcia, 52", text: "O especialista me ajudou a configurar tudo em 10 minutos. Primeira vez que me senti segura com algo na internet." },
        ].map((t) => (
          <div key={t.name} className="flex items-start gap-3 mt-3">
            <img src={t.img} alt={t.name} className="w-10 h-10 rounded-full object-cover shrink-0" style={{ border: "2px solid rgba(22,163,74,0.3)" }} />
            <div>
              <p className="text-[13px] font-semibold" style={{ color: "#E2E8F0" }}>{t.name}</p>
              <p className="text-[12px] italic leading-relaxed mt-0.5" style={{ color: "#94A3B8" }}>"{t.text}"</p>
            </div>
          </div>
        ))}
      </div>

      <button onClick={onDecline} className="text-[12px] underline cursor-pointer bg-transparent border-none mx-auto py-2" style={{ color: "#475569" }}>
        Não, prefiro esperar os 7 dias com a configuração padrão.
      </button>
    </div>
  );
};

export default UpsellStep3;
