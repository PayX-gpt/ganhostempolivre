import { useState } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck, Check, Lock, RefreshCw, AlertTriangle, CheckCircle2,
  XCircle, Crown, Clock, Shield, Star, Headphones, BarChart3, Zap,
} from "lucide-react";
import { saveUpsellExtras } from "@/lib/upsellData";
import { saveFunnelEvent } from "@/lib/metricsClient";
import { logAuditEvent } from "@/hooks/useAuditLog";
import { buildTrackingQueryString } from "@/lib/trackingDataLayer";
import avatarAntonio from "@/assets/avatar-antonio.jpg";
import avatarClaudia from "@/assets/avatar-claudia.jpg";

interface Props {
  name: string;
  onNext: () => void;
  onDecline: () => void;
}

const plans = [
  {
    id: "extensao" as const,
    name: "Extensão 12 Meses",
    subtitle: "Mais tempo, mas ainda expira",
    subtitleColor: "#94A3B8",
    description:
      "Seu acesso é estendido por mais 12 meses (total de 18 meses). Após esse período, será necessário renovar novamente.",
    features: [
      { icon: Clock, text: "+12 meses de acesso (total 18)" },
      { icon: Shield, text: "Proteção contra desativação temporária" },
      { icon: Headphones, text: "Suporte por e-mail" },
    ],
    warning: "Expira novamente após 18 meses",
    price: 67,
    installments: "6x de R$ 12,90",
    border: "1px solid rgba(255,255,255,0.08)",
    btnBg: "transparent",
    btnColor: "#94A3B8",
    btnBorder: "1.5px solid rgba(148,163,184,0.4)",
    btnText: "ATIVAR EXTENSÃO",
    badge: null,
    badgeBg: "",
    checkoutUrl: "https://pay.kirvano.com/2a2419a3-3c67-4dae-9f69-d2e1f23f8474",
  },
  {
    id: "vitalicio" as const,
    name: "Acesso Vitalício",
    subtitle: "Nunca mais se preocupe com expiração",
    subtitleColor: "#22C55E",
    description:
      "Seu acesso nunca expira. Todas as atualizações da plataforma e novas estratégias são incluídas automaticamente, para sempre.",
    features: [
      { icon: ShieldCheck, text: "Acesso vitalício — nunca expira" },
      { icon: Zap, text: "Todas as atualizações automáticas" },
      { icon: Shield, text: "Proteção permanente contra desativação" },
      { icon: Star, text: "Novas estratégias adicionadas na sua conta" },
    ],
    warning: null,
    price: 127,
    installments: "12x de R$ 12,42",
    border: "2px solid #22C55E",
    btnBg: "linear-gradient(135deg, #16A34A, #15803D)",
    btnColor: "#fff",
    btnBorder: "none",
    btnText: "ATIVAR VITALÍCIO — MAIS ESCOLHIDO",
    badge: "⚡ RECOMENDADO",
    badgeBg: "linear-gradient(135deg, #16A34A, #15803D)",
    checkoutUrl: "https://pay.kirvano.com/6f72fe81-e5ab-4df0-9a24-f7f3e94a0429",
  },
  {
    id: "vip" as const,
    name: "Vitalício VIP",
    subtitle: "O máximo de proteção e acompanhamento",
    subtitleColor: "#FACC15",
    description:
      "Tudo do Vitalício + suporte prioritário direto com a equipe e relatórios semanais de performance do seu sistema.",
    features: [
      { icon: ShieldCheck, text: "Acesso vitalício — nunca expira" },
      { icon: Zap, text: "Todas as atualizações automáticas" },
      { icon: BarChart3, text: "Relatório semanal de performance" },
      { icon: Headphones, text: "Suporte prioritário no WhatsApp" },
      { icon: Crown, text: "Acesso antecipado a novos recursos" },
    ],
    warning: null,
    price: 197,
    installments: "12x de R$ 19,25",
    border: "1px solid rgba(250,204,21,0.25)",
    btnBg: "linear-gradient(135deg, #FACC15, #EAB308)",
    btnColor: "#020617",
    btnBorder: "none",
    btnText: "ATIVAR VIP",
    badge: null,
    badgeBg: "",
    checkoutUrl: "https://pay.kirvano.com/a7cfdcbf-849f-4060-b660-b850f46a0e52",
  },
];

const UpsellBlindagem = ({ name, onNext, onDecline }: Props) => {
  const firstName = name !== "Visitante" ? name : "";
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleBuy = (plan: (typeof plans)[0]) => {
    setLoadingId(plan.id);
    saveUpsellExtras("blindagem", { price: plan.price, plan: plan.id });
    saveFunnelEvent("upsell_oneclick_buy", { page: "/upsell3", product: `blindagem_${plan.id}`, price: plan.price });
    logAuditEvent({ eventType: "upsell_oneclick_buy", pageId: "/upsell3", metadata: { product: `blindagem_${plan.id}`, price: plan.price } });
    const utmQs = buildTrackingQueryString();
    const separator = plan.checkoutUrl.includes("?") ? "&" : "?";
    const fullUrl = utmQs ? `${plan.checkoutUrl}${separator}${utmQs.slice(1)}` : plan.checkoutUrl;
    window.open(fullUrl, "_blank");
  };

  return (
    <div className="flex flex-col gap-6 pt-4">
      {/* Alert banner */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))",
          border: "1px solid rgba(239,68,68,0.3)",
        }}
      >
        <div className="flex items-center gap-3 px-5 py-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(239,68,68,0.2)" }}
          >
            <AlertTriangle className="w-5 h-5" style={{ color: "#EF4444" }} />
          </div>
          <p className="text-[14px] font-bold leading-tight" style={{ color: "#F8FAFC" }}>
            ATENÇÃO: Seu acesso à Plataforma de Ganhos com Tempo Livre expira em 6 meses!
          </p>
        </div>
      </motion.div>

      {/* Active items */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl p-4 space-y-2.5"
        style={{ background: "#0F172A", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <p className="text-[11px] uppercase tracking-wider font-semibold mb-2" style={{ color: "#64748B" }}>
          Você acabou de ativar:
        </p>
        {["Plataforma de Ganhos com Tempo Livre", "Plano Acelerador", "Multiplicador de Lucros"].map((item) => (
          <div key={item} className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: "#22C55E" }} />
            <span className="text-[13px]" style={{ color: "#CBD5E1" }}>{item}</span>
          </div>
        ))}
      </motion.div>

      {/* Crucial info */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <p className="text-[15px] font-bold mb-1" style={{ color: "#F59E0B" }}>
          Mas tem algo importante que você precisa saber...
        </p>
        <h1 className="text-[22px] font-extrabold leading-tight" style={{ color: "#F8FAFC" }}>
          Seu acesso expira em exatamente 6 meses.
        </h1>
      </motion.div>

      {/* Why + What happens */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl p-5"
        style={{ background: "rgba(15,23,42,0.9)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <p className="text-[15px] font-bold mb-3" style={{ color: "#F59E0B" }}>Por quê?</p>
        <p className="text-[13px] leading-relaxed" style={{ color: "#94A3B8" }}>
          A plataforma opera através de parcerias estratégicas com instituições financeiras e provedores de dados.
          Esses acordos são renovados a cada seis meses e, por razões contratuais,{" "}
          <strong style={{ color: "#F8FAFC" }}>não podemos garantir o acesso além de 6 meses</strong>.
        </p>

        <div className="mt-4 pt-4 flex flex-col gap-2.5" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-[14px] font-bold" style={{ color: "#EF4444" }}>O que acontece em 6 meses:</p>
          {["Sua conta será desativada", "Você perde acesso ao sistema", "Seus ganhos param de crescer"].map((item) => (
            <div key={item} className="flex items-center gap-2.5">
              <XCircle className="w-4 h-4 shrink-0" style={{ color: "#EF4444" }} />
              <span className="text-[13px]" style={{ color: "#CBD5E1" }}>{item}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Imagine */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-2xl p-5"
        style={{ background: "rgba(15,23,42,0.9)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <p className="text-[15px] font-bold mb-3" style={{ color: "#F8FAFC" }}>Imagine isso:</p>
        <p className="text-[13px] leading-relaxed" style={{ color: "#94A3B8" }}>
          Você passou 6 meses construindo resultados consistentes... Seu sistema está operando perfeitamente...
        </p>
        <p className="text-[14px] font-bold mt-3" style={{ color: "#EF4444" }}>
          E de repente: acesso encerrado.
        </p>
      </motion.div>

      {/* Solution header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-center"
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
          style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}
        >
          <Crown className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-[20px] font-extrabold" style={{ color: "#F8FAFC" }}>
          {firstName ? `${firstName}, escolha` : "Escolha"} como proteger seu acesso
        </h2>
        <p className="text-[13px] mt-2 leading-relaxed" style={{ color: "#94A3B8" }}>
          Cada plano garante a continuidade do seu sistema. Escolha o nível de proteção ideal para você.
        </p>
      </motion.div>

      {/* Plan cards */}
      {plans.map((plan, i) => (
        <motion.div
          key={plan.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 + i * 0.12 }}
          className="relative rounded-2xl p-5"
          style={{ background: "#0F172A", border: plan.border }}
        >
          {plan.badge && (
            <span
              className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-bold px-4 py-1 rounded-full text-white whitespace-nowrap"
              style={{ background: plan.badgeBg, boxShadow: "0 2px 8px rgba(22,163,74,0.3)" }}
            >
              {plan.badge}
            </span>
          )}

          <h3 className="text-[17px] font-bold" style={{ color: "#F8FAFC" }}>{plan.name}</h3>
          <p className="text-[13px] font-medium mt-1" style={{ color: plan.subtitleColor }}>{plan.subtitle}</p>
          <p className="text-[13px] mt-3 leading-relaxed" style={{ color: "#94A3B8" }}>{plan.description}</p>

          <ul className="mt-3 flex flex-col gap-2.5">
            {plan.features.map((f) => (
              <li key={f.text} className="flex items-center gap-2.5">
                <f.icon className="w-4 h-4 shrink-0" style={{ color: "#22C55E" }} />
                <span className="text-[13px]" style={{ color: "#E2E8F0" }}>{f.text}</span>
              </li>
            ))}
          </ul>

          {plan.warning && (
            <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}>
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" style={{ color: "#EF4444" }} />
              <span className="text-[12px] font-medium" style={{ color: "#F87171" }}>{plan.warning}</span>
            </div>
          )}

          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-[28px] font-extrabold" style={{ color: "#F8FAFC" }}>R$ {plan.price}</span>
            <span className="text-[12px]" style={{ color: "#64748B" }}>ou {plan.installments}</span>
          </div>

          <button
            onClick={() => handleBuy(plan)}
            disabled={loadingId === plan.id}
            className="w-full mt-4 py-[14px] rounded-xl font-bold text-[15px] transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-70"
            style={{ background: plan.btnBg, color: plan.btnColor, border: plan.btnBorder }}
          >
            {loadingId === plan.id ? "Processando..." : plan.btnText}
          </button>
        </motion.div>
      ))}

      {/* Social proof */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.95 }}
        className="rounded-xl p-4"
        style={{ background: "rgba(30,41,59,0.6)", border: "1px solid rgba(255,255,255,0.04)" }}
      >
        <p className="text-[14px] font-bold mb-3" style={{ color: "#E2E8F0" }}>
          Quem já protegeu o acesso:
        </p>
        {[
          { img: avatarAntonio, name: "Antônio, 57", text: "Ativei o vitalício na hora. Não faz sentido investir tanto tempo e perder tudo em 6 meses. Melhor decisão." },
          { img: avatarClaudia, name: "Cláudia, 49", text: "Eu ia pegar só a extensão, mas aí pensei: vou ter que passar por isso de novo? Peguei o vitalício e fiquei em paz." },
        ].map((t) => (
          <div key={t.name} className="flex items-start gap-3 mt-3">
            <img src={t.img} alt={t.name} className="w-10 h-10 rounded-full object-cover shrink-0" style={{ border: "2px solid rgba(22,163,74,0.3)" }} />
            <div>
              <p className="text-[13px] font-semibold" style={{ color: "#E2E8F0" }}>{t.name}</p>
              <p className="text-[12px] italic leading-relaxed mt-0.5" style={{ color: "#94A3B8" }}>"{t.text}"</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Security badges */}
      <div className="flex items-center justify-center gap-4">
        <div className="flex items-center gap-1">
          <Lock className="w-3.5 h-3.5" style={{ color: "#475569" }} />
          <span className="text-[11px]" style={{ color: "#475569" }}>100% seguro</span>
        </div>
        <div className="flex items-center gap-1">
          <RefreshCw className="w-3.5 h-3.5" style={{ color: "#475569" }} />
          <span className="text-[11px]" style={{ color: "#475569" }}>Garantia 30 dias</span>
        </div>
      </div>

      <button
        onClick={() => {
          saveFunnelEvent("upsell_oneclick_decline", { page: "/upsell3" });
          logAuditEvent({ eventType: "upsell_oneclick_decline", pageId: "/upsell3" });
          onDecline();
        }}
        className="text-[12px] underline cursor-pointer bg-transparent border-none mx-auto py-2"
        style={{ color: "#475569" }}
      >
        Não, obrigado. Prefiro arriscar perder meu acesso em 6 meses.
      </button>
    </div>
  );
};

export default UpsellBlindagem;
