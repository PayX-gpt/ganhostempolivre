import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Shield, Zap, MessageCircle, BarChart3, Headphones, AlertTriangle, Clock, Users, TrendingDown, Rocket } from "lucide-react";

const QueueCounter = () => {
  const [count, setCount] = useState(2847);
  useEffect(() => {
    const interval = setInterval(() => {
      setCount((c) => c + Math.floor(Math.random() * 3) + 1);
    }, 2500);
    return () => clearInterval(interval);
  }, []);
  return <>{count.toLocaleString("pt-BR")}</>;
};
import { saveUpsellChoice } from "@/lib/upsellData";
import { buildTrackingQueryString } from "@/lib/trackingDataLayer";
import avatarAntonio from "@/assets/avatar-antonio.jpg";
import avatarMaria from "@/assets/avatar-maria.jpg";

interface Props { name: string; onNext: () => void; onDecline: () => void; }

const plans = [
  {
    id: "basico" as const,
    name: "Acelerador Básico",
    subtitle: "Primeiro saque em 7 dias",
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
    subtitle: "Primeiro saque em 24 horas",
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
    subtitle: "Saque imediato",
    subtitleColor: "#FACC15",
    description: "O nível mais alto. Tudo do Duplo + um especialista humano configura sua conta pessoalmente e te acompanha nos primeiros dias.",
    features: [
      { icon: Zap, text: "Servidor exclusivo — sem fila" },
      { icon: Shield, text: "Tripla verificação de segurança" },
      { icon: BarChart3, text: "Monitoramento 24h por segunda IA" },
      { icon: MessageCircle, text: "Especialista pessoal no WhatsApp — 48h" },
      { icon: Headphones, text: "Relatório de ganhos toda manhã" },
    ],
    price: 67, installments: "6x de R$ 11,90",
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
    <div className="flex flex-col gap-6 pt-4">
      {/* Header — acknowledges what they just saw, transitions to WHY */}
      <div className="text-center">
        <p className="text-[11px] uppercase tracking-widest font-semibold mb-3" style={{ color: "#EF4444" }}>
          Atenção — leia antes de fechar esta página
        </p>
        <h1 className="text-[22px] font-extrabold leading-tight" style={{ color: "#F8FAFC" }}>
          {firstName ? `${firstName}, agora` : "Agora"} você sabe do problema.
        </h1>

        {/* Wait time counter between the two headline parts */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="mx-auto my-4 rounded-xl px-5 py-3 flex items-center justify-center gap-2.5"
          style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}
        >
          <Users className="w-5 h-5" style={{ color: "#EF4444" }} />
          <span className="text-[13px]" style={{ color: "#CBD5E1" }}>Pessoas na fila agora:</span>
          <span className="text-[20px] font-extrabold" style={{ color: "#EF4444" }}><QueueCounter /></span>
        </motion.div>

        <h1 className="text-[22px] font-extrabold leading-tight" style={{ color: "#22C55E" }}>
          Aqui está a solução.
        </h1>
      </div>

      {/* WHY it happens — the explanation they've been waiting for */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl overflow-hidden"
        style={{ border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="px-5 py-4" style={{ background: "rgba(255,255,255,0.02)" }}>
          <p className="text-[14px] leading-relaxed" style={{ color: "#CBD5E1" }}>
            Quando milhares de pessoas ativam o sistema ao mesmo tempo, os servidores processam por <strong style={{ color: "#E2E8F0" }}>ordem de chegada</strong>. Sua conta fica numa fila esperando sua vez. E nessa espera de 15 a 30 dias, a pessoa não vê nada acontecendo — e desiste.
          </p>
          <p className="text-[14px] leading-relaxed mt-3" style={{ color: "#CBD5E1" }}>
            <strong style={{ color: "#FACC15" }}>Mas não precisa ser assim.</strong> O Acelerador move sua conta pra frente da fila. O sistema sai do modo de espera e começa a operar pra você <strong style={{ color: "#22C55E" }}>imediatamente</strong>.
          </p>
        </div>
      </motion.div>

      {/* Urgency — exclusive to this page */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-xl p-3.5 flex items-start gap-2.5"
        style={{ background: "rgba(250,204,21,0.04)", border: "1px solid rgba(250,204,21,0.15)" }}
      >
        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#FACC15" }} />
        <p className="text-[12px] leading-relaxed" style={{ color: "#CBD5E1" }}>
          <strong style={{ color: "#FACC15" }}>Esta oferta existe apenas nesta página.</strong> Se você fechar, volta pra fila comum e não tem como ativar o acelerador depois.
        </p>
      </motion.div>

      <p className="text-[14px] font-bold text-center" style={{ color: "#E2E8F0" }}>
        Escolha a velocidade do seu primeiro saque:
      </p>

      {plans.map((plan, i) => (
        <motion.div
          key={plan.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 + i * 0.12 }}
          className="relative rounded-2xl overflow-hidden"
          style={{ border: plan.border }}
        >
          {plan.badge && (
            <span className="absolute -top-0 left-1/2 -translate-x-1/2 text-[11px] font-bold px-4 py-1.5 rounded-b-lg text-white whitespace-nowrap z-10" style={{ background: "linear-gradient(135deg, #16A34A, #15803D)", boxShadow: "0 4px 12px rgba(22,163,74,0.3)" }}>
              {plan.badge}
            </span>
          )}

          {/* Plan header */}
          <div className={`px-5 pb-3 ${plan.badge ? "pt-9" : "pt-5"}`} style={{ background: plan.id === "duplo" ? "rgba(34,197,94,0.06)" : plan.id === "maximo" ? "rgba(250,204,21,0.06)" : "rgba(255,255,255,0.02)" }}>
            <h3 className="text-[17px] font-bold" style={{ color: "#F8FAFC" }}>{plan.name}</h3>
            <p className="text-[14px] font-semibold mt-1" style={{ color: plan.subtitleColor }}>{plan.subtitle}</p>
          </div>

          {/* Plan body */}
          <div className="px-5 pb-5 pt-3" style={{ background: "#0F172A" }}>
            <p className="text-[13px] leading-relaxed mb-3" style={{ color: "#94A3B8" }}>{plan.description}</p>

            <ul className="flex flex-col gap-2.5">
              {plan.features.map((f) => (
                <li key={f.text} className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(34,197,94,0.1)" }}>
                    <f.icon className="w-3.5 h-3.5" style={{ color: "#22C55E" }} />
                  </div>
                  <span className="text-[13px]" style={{ color: "#E2E8F0" }}>{f.text}</span>
                </li>
              ))}
            </ul>

            <div className="mt-4 pt-4 flex items-baseline gap-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <span className="text-[28px] font-extrabold" style={{ color: "#F8FAFC" }}>R$ {plan.price}</span>
              <span className="text-[12px]" style={{ color: "#64748B" }}>ou {plan.installments}</span>
            </div>

            <button
              onClick={() => handleSelect(plan)}
              className="w-full mt-3 py-[14px] rounded-xl font-bold text-[15px] transition-all hover:brightness-110 active:scale-[0.98]"
              style={{
                background: plan.btnBg,
                color: plan.btnColor,
                border: plan.btnBorder,
                boxShadow: plan.id === "duplo" ? "0 0 20px rgba(22,163,74,0.2), 0 4px 12px rgba(0,0,0,0.3)" : plan.id === "maximo" ? "0 0 20px rgba(250,204,21,0.15), 0 4px 12px rgba(0,0,0,0.3)" : "none",
              }}
            >
              {plan.btnText}
            </button>
          </div>
        </motion.div>
      ))}

      {/* Social proof */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="rounded-2xl overflow-hidden"
        style={{ border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="px-5 py-3" style={{ background: "rgba(34,197,94,0.06)" }}>
          <p className="text-[14px] font-bold" style={{ color: "#E2E8F0" }}>
            Quem furou a fila e já está sacando:
          </p>
        </div>
        <div className="px-5 py-4 flex flex-col gap-4" style={{ background: "#0F172A" }}>
          {[
            { img: avatarAntonio, name: "Antônio, 57", text: "Tava quase desistindo porque não via resultado. Ativei o Duplo e no segundo dia já tinha R$43 na conta. Era só a fila." },
            { img: avatarMaria, name: "Dona Márcia, 52", text: "O especialista me explicou da fila e ativou tudo pra mim. Em 3 dias eu já tava sacando. Se não tivesse acelerado, sei que ia desistir." },
          ].map((t) => (
            <div key={t.name} className="flex items-start gap-3">
              <img src={t.img} alt={t.name} className="w-10 h-10 rounded-full object-cover shrink-0" style={{ border: "2px solid rgba(22,163,74,0.3)" }} />
              <div>
                <p className="text-[13px] font-semibold" style={{ color: "#E2E8F0" }}>{t.name}</p>
                <p className="text-[12px] italic leading-relaxed mt-0.5" style={{ color: "#94A3B8" }}>"{t.text}"</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      <button onClick={onDecline} className="text-[12px] underline cursor-pointer bg-transparent border-none mx-auto py-2 pb-6" style={{ color: "#475569" }}>
        Não, prefiro esperar os 15 dias na fila padrão.
      </button>
    </div>
  );
};

export default UpsellStep3;
