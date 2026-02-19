import { useState } from "react";
import { motion } from "framer-motion";
import {
  Check,
  TrendingUp,
  AlertTriangle,
  Video,
  Shield,
  Zap,
  Users,
  XCircle,
  PackageCheck,
  Sparkles,
  Gift,
  BookOpen,
  BarChart2,
  MessageSquare,
  GraduationCap,
} from "lucide-react";
import { saveUpsellExtras } from "@/lib/upsellData";
import { saveFunnelEvent } from "@/lib/metricsClient";
import { logAuditEvent } from "@/hooks/useAuditLog";
import { buildTrackingQueryString } from "@/lib/trackingDataLayer";

interface Props {
  name: string;
  onNext: () => void;
  onDecline: () => void;
}

const CHECKOUT_URL = "https://pay.kirvano.com/FOREX-MENTORIA-PLACEHOLDER";
const PRICE = 297;
const ORIGINAL_PRICE = 4997;

const alreadyOwned = [
  { Icon: Shield, label: "Plataforma Híbrida com IA" },
  { Icon: TrendingUp, label: "Multiplicador de Lucro" },
  { Icon: Shield, label: "Blindagem de Conta" },
  { Icon: Users, label: "Círculo Interno VIP" },
  { Icon: Shield, label: "Camada Safety Pro" },
];

const newItems = [
  { Icon: Video, label: "Trader profissional ao vivo — 3x ao dia" },
  { Icon: TrendingUp, label: "Mentoria completa no FOREX" },
  { Icon: Check, label: "Operações guiadas diariamente" },
  { Icon: Zap, label: "Segunda Licença Premium" },
];

const bonusItems = [
  { Icon: BookOpen, label: "Bônus 1: Guia FOREX para Iniciantes — R$ 297" },
  { Icon: BarChart2, label: "Bônus 2: Planilha de Controle de Operações — R$ 97" },
  { Icon: MessageSquare, label: "Bônus 3: Grupo Exclusivo de Sinais ao Vivo — R$ 497" },
  { Icon: GraduationCap, label: "Bônus 4: Masterclass 'Primeiros R$ 1.000 no FOREX' — R$ 197" },
];

const licensePerks = [
  "Operar em duas contas ao mesmo tempo",
  "Dobrar seus resultados sem dobrar o esforço",
  "Usar com alguém de confiança (cônjuge, filho, sócio)",
  "Ou revender e recuperar o investimento no mesmo dia",
];

const UpsellForexMentoria = ({ name, onNext, onDecline }: Props) => {
  const firstName = name !== "Visitante" ? name : "";
  const [loading, setLoading] = useState(false);

  const handleBuy = () => {
    setLoading(true);
    saveUpsellExtras("circulo", { price: PRICE, product: "forex_mentoria" });
    saveFunnelEvent("upsell_buy", {
      page: "/upsell6",
      product: "forex_mentoria",
      price: PRICE,
    });
    logAuditEvent({
      eventType: "upsell_buy",
      pageId: "/upsell6",
      metadata: { product: "forex_mentoria", price: PRICE },
    });
    const utmQs = buildTrackingQueryString();
    const separator = CHECKOUT_URL.includes("?") ? "&" : "?";
    const fullUrl = utmQs
      ? `${CHECKOUT_URL}${separator}${utmQs.slice(1)}`
      : CHECKOUT_URL;
    window.open(fullUrl, "_blank");
    setTimeout(() => setLoading(false), 3000);
  };

  const handleDecline = () => {
    saveFunnelEvent("upsell_decline", {
      page: "/upsell6",
      product: "forex_mentoria",
    });
    logAuditEvent({
      eventType: "upsell_decline",
      pageId: "/upsell6",
    });
    onDecline();
  };

  return (
    <div className="flex flex-col gap-5 pt-4 pb-6">

      {/* Urgency Banner */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl p-3 flex items-center gap-2.5"
        style={{
          background: "rgba(239,68,68,0.08)",
          border: "1px solid rgba(239,68,68,0.25)",
        }}
      >
        <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: "#EF4444" }} />
        <p className="text-[12px] font-semibold" style={{ color: "#FCA5A5" }}>
          Essa oferta some quando você fechar esta página.{" "}
          <strong style={{ color: "#EF4444" }}>Não aparece de novo.</strong>
        </p>
      </motion.div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="text-center"
      >
        <p
          className="text-[11px] uppercase tracking-widest font-bold mb-2"
          style={{ color: "#22C55E" }}
        >
          Oferta exclusiva — apenas hoje
        </p>
        <h1
          className="text-[24px] font-extrabold leading-tight"
          style={{ color: "#F8FAFC" }}
        >
          E se você recuperasse seu investimento{" "}
          <span
            style={{
              background: "linear-gradient(135deg, #16A34A, #22C55E)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            HOJE?
          </span>
        </h1>
        <p
          className="text-[14px] mt-3 leading-relaxed"
          style={{ color: "#94A3B8" }}
        >
          {firstName ? `${firstName}, você` : "Você"} chegou até aqui. Isso já
          diz muito. Agora vou te mostrar a forma mais rápida e segura de
          recuperar tudo o que investiu — usando o{" "}
          <strong style={{ color: "#F8FAFC" }}>
            FOREX, o maior mercado financeiro do mundo.
          </strong>
        </p>
      </motion.div>

      {/* Live Trader Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="rounded-2xl overflow-hidden"
        style={{ border: "1px solid rgba(34,197,94,0.3)" }}
      >
        <div
          className="px-5 py-4 flex items-center gap-3"
          style={{ background: "rgba(22,163,74,0.1)" }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "rgba(22,163,74,0.2)", border: "1px solid rgba(34,197,94,0.4)" }}
          >
            <Video className="w-5 h-5" style={{ color: "#22C55E" }} />
          </div>
          <div>
            <p className="text-[13px] font-bold" style={{ color: "#F8FAFC" }}>
              Trader Profissional ao Vivo
            </p>
            <p className="text-[11px]" style={{ color: "#86EFAC" }}>
              3 sessões por dia • operações guiadas • FOREX
            </p>
          </div>
          {/* Live pulse */}
          <div className="ml-auto flex items-center gap-1.5">
            <span className="relative flex h-2.5 w-2.5">
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                style={{ background: "#22C55E" }}
              />
              <span
                className="relative inline-flex rounded-full h-2.5 w-2.5"
                style={{ background: "#16A34A" }}
              />
            </span>
            <span className="text-[10px] font-bold" style={{ color: "#22C55E" }}>
              AO VIVO
            </span>
          </div>
        </div>

        <div className="px-5 py-4" style={{ background: "#0F172A" }}>
          <p className="text-[13px] leading-relaxed" style={{ color: "#CBD5E1" }}>
            Você não vai fazer isso sozinho. Um trader profissional opera{" "}
            <strong style={{ color: "#F8FAFC" }}>ao vivo com você</strong>, 3
            vezes ao dia, mostrando exatamente o que fazer, quando fazer e
            quanto esperar de retorno. Sem achismo. Sem sorte.
          </p>
        </div>
      </motion.div>

      {/* Ricardo + Team Section */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.16 }}
        className="rounded-2xl overflow-hidden"
        style={{ border: "1px solid rgba(250,204,21,0.25)" }}
      >
        {/* Header */}
        <div
          className="px-5 py-4 flex items-center gap-3"
          style={{ background: "rgba(250,204,21,0.07)" }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "rgba(250,204,21,0.15)", border: "1px solid rgba(250,204,21,0.35)" }}
          >
            <Users className="w-5 h-5" style={{ color: "#FACC15" }} />
          </div>
          <div>
            <p className="text-[13px] font-bold" style={{ color: "#F8FAFC" }}>
              Ricardo + Escritório com 30+ Especialistas
            </p>
            <p className="text-[11px]" style={{ color: "#FDE68A" }}>
              Analistas e traders profissionais ao seu lado
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-4 flex flex-col gap-3" style={{ background: "#0F172A" }}>
          <p className="text-[13px] leading-relaxed" style={{ color: "#CBD5E1" }}>
            Quando você entra para essa mentoria, você não ganha apenas um curso.
            Você ganha acesso direto ao{" "}
            <strong style={{ color: "#F8FAFC" }}>Ricardo e ao escritório dele</strong>{" "}
            — uma estrutura com mais de{" "}
            <strong style={{ color: "#FACC15" }}>30 profissionais do mercado financeiro</strong>:
            traders sênior, analistas gráficos e especialistas em FOREX operando todos os dias.
          </p>

          {/* Promise cards */}
          <div className="flex flex-col gap-2 mt-1">
            {[
              {
                Icon: TrendingUp,
                title: "Operações em tempo real",
                desc: "Cada entrada e saída transmitida ao vivo para você copiar exatamente.",
              },
              {
                Icon: Shield,
                title: "Análise coletiva de 30+ analistas",
                desc: "Nenhuma operação é feita por impulso. Sempre validada por toda a equipe.",
              },
              {
                Icon: Zap,
                title: "Sem chance de erros isolados",
                desc: "Com um time inteiro monitorando o mercado, as decisões são sempre baseadas em dados reais.",
              },
              {
                Icon: Check,
                title: "Todo mundo ganha junto",
                desc: "O objetivo é que cada aluno acompanhe e lucre em cada operação realizada.",
              },
            ].map(({ Icon, title, desc }) => (
              <div
                key={title}
                className="flex items-start gap-3 rounded-xl p-3"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: "rgba(250,204,21,0.12)" }}
                >
                  <Icon className="w-3.5 h-3.5" style={{ color: "#FACC15" }} />
                </div>
                <div>
                  <p className="text-[13px] font-bold" style={{ color: "#F1F5F9" }}>{title}</p>
                  <p className="text-[12px] mt-0.5 leading-relaxed" style={{ color: "#94A3B8" }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Credibility pill */}
          <div
            className="mt-1 rounded-xl p-3 flex items-center gap-2.5"
            style={{ background: "rgba(22,163,74,0.07)", border: "1px solid rgba(34,197,94,0.2)" }}
          >
            <Shield className="w-4 h-4 shrink-0" style={{ color: "#22C55E" }} />
            <p className="text-[12px] leading-snug" style={{ color: "#86EFAC" }}>
              <strong style={{ color: "#F8FAFC" }}>Garantia de operações:</strong> enquanto o mercado estiver aberto, o time do Ricardo está operando e transmitindo ao vivo para você.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Second License Highlight */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.20 }}
        className="rounded-2xl p-5"
        style={{
          background: "rgba(250,204,21,0.05)",
          border: "1px solid rgba(250,204,21,0.2)",
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4" style={{ color: "#FACC15" }} />
          <p className="text-[13px] font-bold" style={{ color: "#FACC15" }}>
            Segunda Licença Premium — o que isso significa pra você:
          </p>
        </div>
        <ul className="flex flex-col gap-2.5">
          {licensePerks.map((perk) => (
            <li key={perk} className="flex items-start gap-2">
              <Check className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: "#FACC15" }} />
              <span className="text-[13px]" style={{ color: "#E2E8F0" }}>
                {perk}
              </span>
            </li>
          ))}
        </ul>
      </motion.div>

      {/* Everything included — 3 sections */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22 }}
        className="rounded-2xl p-5 flex flex-col gap-4"
        style={{ background: "#0F172A", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        {/* Already Owned */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <PackageCheck className="w-3.5 h-3.5 shrink-0" style={{ color: "#64748B" }} />
            <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "#64748B" }}>
              O que você já conquistou
            </p>
          </div>
          <div className="flex flex-col gap-2">
            {alreadyOwned.map(({ Icon, label }) => (
              <div key={label} className="flex items-center gap-2.5">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: "rgba(22,163,74,0.12)" }}
                >
                  <Icon className="w-3 h-3" style={{ color: "#22C55E" }} />
                </div>
                <span className="text-[13px]" style={{ color: "#94A3B8" }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="h-px" style={{ background: "rgba(255,255,255,0.06)" }} />

        {/* New Items */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-3.5 h-3.5 shrink-0" style={{ color: "#22C55E" }} />
            <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "#22C55E" }}>
              O que você ganha agora
            </p>
          </div>
          <div className="flex flex-col gap-2">
            {newItems.map(({ Icon, label }) => (
              <div key={label} className="flex items-center gap-2.5">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: "rgba(22,163,74,0.2)", border: "1px solid rgba(34,197,94,0.3)" }}
                >
                  <Icon className="w-3 h-3" style={{ color: "#22C55E" }} />
                </div>
                <span className="text-[13px] font-semibold" style={{ color: "#F1F5F9" }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="h-px" style={{ background: "rgba(255,255,255,0.06)" }} />

        {/* Bonus Items */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Gift className="w-3.5 h-3.5 shrink-0" style={{ color: "#FACC15" }} />
            <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "#FACC15" }}>
              Bônus exclusivos incluídos
            </p>
          </div>
          <div className="flex flex-col gap-2">
            {bonusItems.map(({ Icon, label }) => (
              <div key={label} className="flex items-start gap-2.5">
                <Icon className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: "#FACC15" }} />
                <span className="text-[13px]" style={{ color: "#E2E8F0" }}>{label}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3" style={{ borderTop: "1px dashed rgba(250,204,21,0.2)" }}>
            <p className="text-[12px] font-bold text-center" style={{ color: "#FACC15" }}>
              Valor total dos bônus:{" "}
              <span style={{ color: "#F8FAFC" }}>R$ 1.088 — GRÁTIS pra você</span>
            </p>
          </div>
        </div>
      </motion.div>

      {/* Price Block */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.27 }}
        className="rounded-2xl p-5 text-center"
        style={{
          background: "linear-gradient(135deg, rgba(22,163,74,0.08), rgba(15,23,42,0))",
          border: "2px solid rgba(22,163,74,0.3)",
        }}
      >
        <p className="text-[12px] uppercase tracking-wider font-semibold mb-1" style={{ color: "#64748B" }}>
          Valor oficial dessa mentoria
        </p>
        <p
          className="text-[28px] font-extrabold line-through"
          style={{ color: "#475569" }}
        >
          R$ {ORIGINAL_PRICE.toLocaleString("pt-BR")}
        </p>

        <div className="my-2 flex items-center gap-3 justify-center">
          <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.06)" }} />
          <span
            className="text-[11px] font-bold px-3 py-1 rounded-full"
            style={{ background: "rgba(22,163,74,0.15)", color: "#22C55E" }}
          >
            HOJE APENAS
          </span>
          <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.06)" }} />
        </div>

        <div className="flex items-baseline justify-center gap-1">
          <span className="text-[16px] font-bold" style={{ color: "#94A3B8" }}>R$</span>
          <span
            className="text-[52px] font-extrabold leading-none"
            style={{
              background: "linear-gradient(135deg, #16A34A, #22C55E)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            297
          </span>
        </div>
        <p className="text-[12px] mt-1" style={{ color: "#64748B" }}>
          Pagamento único • Sem mensalidade
        </p>

        {/* Savings pill */}
        <div
          className="mt-3 inline-block px-4 py-1.5 rounded-full"
          style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)" }}
        >
          <span className="text-[12px] font-bold" style={{ color: "#FCA5A5" }}>
            Você economiza R$ {(ORIGINAL_PRICE - PRICE).toLocaleString("pt-BR")} — 94% OFF
          </span>
        </div>
      </motion.div>

      {/* CTA Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.32 }}
        onClick={handleBuy}
        disabled={loading}
        className="w-full py-[18px] rounded-xl text-[17px] font-extrabold tracking-wide transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-70"
        style={{
          background: "linear-gradient(135deg, #16A34A, #15803D)",
          color: "#FFFFFF",
          boxShadow: "0 0 30px rgba(22,163,74,0.35), 0 4px 16px rgba(0,0,0,0.4)",
        }}
      >
        {loading
          ? "Processando..."
          : "QUERO RECUPERAR MEU INVESTIMENTO AGORA"}
      </motion.button>

      {/* Trust line */}
      <div className="flex items-center justify-center gap-4">
        {["Compra 100% segura", "Acesso imediato", "Suporte 24h"].map((t) => (
          <div key={t} className="flex items-center gap-1">
            <Check className="w-3 h-3" style={{ color: "#22C55E" }} />
            <span className="text-[10px]" style={{ color: "#64748B" }}>{t}</span>
          </div>
        ))}
      </div>

      {/* Social proof urgency */}
      <div
        className="rounded-xl p-3.5 flex items-start gap-2.5"
        style={{
          background: "rgba(239,68,68,0.05)",
          border: "1px solid rgba(239,68,68,0.15)",
        }}
      >
        <Users className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#EF4444" }} />
        <p className="text-[12px] leading-relaxed" style={{ color: "#CBD5E1" }}>
          <strong style={{ color: "#EF4444" }}>Atenção:</strong> Vagas limitadas para as sessões ao vivo. Quando o grupo fechar, essa oferta some permanentemente.
        </p>
      </div>

      {/* Decline */}
      <button
        onClick={handleDecline}
        className="flex items-center gap-1.5 text-[12px] mx-auto py-2 bg-transparent border-none cursor-pointer"
        style={{ color: "#475569" }}
      >
        <XCircle className="w-3.5 h-3.5" />
        Não, prefiro abrir mão desta oportunidade.
      </button>
    </div>
  );
};

export default UpsellForexMentoria;
