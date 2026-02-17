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
    subtitle: "Primeiro saque em até 10 dias",
    subtitleColor: "#22C55E",
    description: "Sua conta sai da fila comum e entra nos servidores dedicados. O sistema começa a operar com mais frequência desde o primeiro dia.",
    features: [
      { icon: Zap, text: "Sai da fila de espera dos servidores" },
      { icon: Shield, text: "Proteção básica contra perdas" },
      { icon: Headphones, text: "Suporte por e-mail" },
    ],
    price: 37, installments: "4x de R$ 9,90",
    border: "1px solid rgba(255,255,255,0.08)",
    btnBg: "transparent", btnColor: "#22C55E", btnBorder: "1.5px solid #22C55E",
    btnText: "ATIVAR BÁSICO",
    badge: null,
    checkoutUrl: "https://pay.kirvano.com/863c8fe9-ca48-452f-9fa4-22e14df182cf",
  },
  {
    id: "duplo" as const,
    name: "Acelerador Duplo",
    subtitle: "Primeiro saque em até 5 dias",
    subtitleColor: "#22C55E",
    description: "Tudo do Básico + uma segunda IA verifica cada operação antes de executar. É o que 9 em cada 10 novos membros escolhem.",
    features: [
      { icon: Zap, text: "Prioridade máxima nos servidores" },
      { icon: Shield, text: "Dupla verificação antes de cada operação" },
      { icon: BarChart3, text: "Monitoramento 24h por segunda IA" },
      { icon: MessageCircle, text: "Suporte prioritário no WhatsApp" },
    ],
    price: 47, installments: "5x de R$ 9,90",
    border: "2px solid #22C55E",
    btnBg: "linear-gradient(135deg, #16A34A, #15803D)", btnColor: "#fff", btnBorder: "none",
    btnText: "ATIVAR DUPLO — MAIS ESCOLHIDO",
    badge: "⚡ RECOMENDADO",
    checkoutUrl: "https://pay.kirvano.com/59a5cba3-f876-46a8-b0e4-6e2c72cf725a",
  },
  {
    id: "maximo" as const,
    name: "Acelerador Máximo",
    subtitle: "Primeiro saque em até 48 horas",
    subtitleColor: "#FACC15",
    description: "O nível mais alto. Tudo do Duplo + um especialista humano configura sua conta pessoalmente e te acompanha nos primeiros dias.",
    features: [
      { icon: Zap, text: "Servidor exclusivo — sem fila" },
      { icon: Shield, text: "Tripla verificação de segurança" },
      { icon: BarChart3, text: "Monitoramento 24h por segunda IA" },
      { icon: MessageCircle, text: "Especialista pessoal no WhatsApp — 48h" },
      { icon: Headphones, text: "Relatório de ganhos toda manhã" },
    ],
    price: 47, installments: "5x de R$ 9,90",
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
          {firstName ? `${firstName}, preciso` : "Preciso"} te explicar uma coisa antes de continuar.
        </h1>
        <p className="text-[14px] mt-3 leading-relaxed" style={{ color: "#94A3B8" }}>
          O sistema que você acabou de ativar <strong style={{ color: "#E2E8F0" }}>funciona</strong>. Mas existe um detalhe que pouca gente conta:
        </p>
      </div>

      {/* The "why" explanation */}
      <div className="rounded-xl p-4" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
        <p className="text-[14px] font-bold mb-2" style={{ color: "#EF4444" }}>
          ⚠️ Por que a maioria demora pra ver resultado?
        </p>
        <p className="text-[13px] leading-relaxed" style={{ color: "#CBD5E1" }}>
          Toda conta nova entra numa <strong style={{ color: "#E2E8F0" }}>fila de processamento</strong>. São milhares de pessoas ativando ao mesmo tempo, e o servidor processa por ordem de chegada. Na configuração padrão, o sistema leva cerca de <strong style={{ color: "#E2E8F0" }}>15 dias pra começar a operar de verdade</strong>, e o primeiro saque só acontece com <strong style={{ color: "#E2E8F0" }}>30 dias</strong>.
        </p>
        <p className="text-[13px] leading-relaxed mt-2" style={{ color: "#CBD5E1" }}>
          É nesse período que <strong style={{ color: "#EF4444" }}>a maioria desiste</strong>. Não porque o sistema não funciona — mas porque não teve paciência de esperar a fila andar.
        </p>
      </div>

      {/* The solution */}
      <div className="rounded-xl p-4" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)" }}>
        <p className="text-[14px] font-bold mb-2" style={{ color: "#22C55E" }}>
          ✅ A solução: furar a fila.
        </p>
        <p className="text-[13px] leading-relaxed" style={{ color: "#CBD5E1" }}>
          O Acelerador move sua conta pra <strong style={{ color: "#E2E8F0" }}>frente da fila</strong>. Em vez de esperar 15 dias com todo mundo, o sistema começa a operar pra você em horas. Quanto mais forte o acelerador, mais rápido você saca.
        </p>
      </div>

      <p className="text-[13px] text-center" style={{ color: "#94A3B8" }}>
        Escolha o nível que faz sentido pra sua realidade:
      </p>

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
          { img: avatarAntonio, name: "Antônio, 57", text: "Tava quase desistindo porque não via resultado. Ativei o Duplo e no segundo dia já tinha R$43 na conta. Era só a fila." },
          { img: avatarMaria, name: "Dona Márcia, 52", text: "O especialista me explicou da fila e ativou tudo pra mim. Em 3 dias eu já tava sacando. Se não tivesse acelerado, sei que ia desistir." },
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
        Não, prefiro esperar os 15 dias na fila padrão.
      </button>
    </div>
  );
};

export default UpsellStep3;
