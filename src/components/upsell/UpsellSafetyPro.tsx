import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, TrendingUp, TrendingDown, AlertTriangle, Check,
  Lock, Zap, BarChart3, Eye, RefreshCw, ArrowRight, ChevronRight,
  Play, DollarSign, Target, Activity
} from "lucide-react";
import { saveUpsellExtras } from "@/lib/upsellData";
import { saveFunnelEvent } from "@/lib/metricsClient";
import { logAuditEvent } from "@/hooks/useAuditLog";
import { buildTrackingQueryString } from "@/lib/trackingDataLayer";
import mentorPhoto from "@/assets/mentor-new.webp";
import avatarAntonio from "@/assets/avatar-antonio.jpg";
import avatarLucia from "@/assets/avatar-lucia.jpg";
import avatarCarlos from "@/assets/avatar-carlos.jpg";

interface Props {
  name: string;
  onNext: () => void;
  onDecline: () => void;
}

// ── Live simulation counter ──
const useLiveCounter = (start: number, interval = 4200) => {
  const [count, setCount] = useState(start);
  useEffect(() => {
    const t = setInterval(() => {
      setCount(c => c + Math.floor(Math.random() * 3 + 1));
    }, interval);
    return () => clearInterval(t);
  }, [interval]);
  return count;
};

// ── Visual: demo vs real trade switch ──
const TradeSimulator = () => {
  const [mode, setMode] = useState<"real" | "demo">("real");

  useEffect(() => {
    const interval = setInterval(() => {
      setMode(m => (m === "real" ? "demo" : "real"));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const isReal = mode === "real";

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ background: "#0F172A" }}>
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4" style={{ color: "#94A3B8" }} />
          <span className="text-[12px] font-semibold" style={{ color: "#94A3B8" }}>Alfa Híbrida — IA Operando</span>
        </div>
        <AnimatePresence mode="wait">
          <motion.span
            key={mode}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="text-[10px] font-bold px-2.5 py-1 rounded-full"
            style={{
              background: isReal ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.15)",
              color: isReal ? "#F87171" : "#4ADE80",
              border: isReal ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(34,197,94,0.3)",
            }}
          >
            {isReal ? "⚠ RISCO DETECTADO" : "✓ CONTA DEMO ATIVA"}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* Trade row */}
      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          className="px-4 pb-4 pt-3"
          style={{ background: "#060F1E" }}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: "#475569" }}>Operação atual</p>
              <p className="text-[16px] font-extrabold mt-0.5" style={{ color: "#F8FAFC" }}>EUR/USD · Scalping IA</p>
            </div>
            <div className="text-right">
              <p className="text-[11px]" style={{ color: "#475569" }}>Conta</p>
              <p
                className="text-[15px] font-bold"
                style={{ color: isReal ? "#F87171" : "#4ADE80" }}
              >
                {isReal ? "Real (pausada)" : "Demo (protegida)"}
              </p>
            </div>
          </div>

          {/* Progress bar showing risk */}
          <div className="relative h-2 rounded-full overflow-hidden mb-2" style={{ background: "rgba(255,255,255,0.06)" }}>
            <motion.div
              initial={{ width: isReal ? "75%" : "0%" }}
              animate={{ width: isReal ? "75%" : "100%" }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                background: isReal
                  ? "linear-gradient(90deg, #FACC15, #EF4444)"
                  : "linear-gradient(90deg, #16A34A, #22C55E)",
              }}
            />
          </div>

          <div className="flex justify-between text-[10px]" style={{ color: "#64748B" }}>
            <span>{isReal ? "Exposição ao risco: ALTA" : "Safety Pro: Cenário positivo aguardado"}</span>
            {isReal
              ? <span style={{ color: "#F87171" }}>⚠ IA migrando...</span>
              : <span style={{ color: "#4ADE80" }}>✓ Capital 100% protegido</span>
            }
          </div>

          {/* Result */}
          <div
            className="mt-3 flex items-center justify-between rounded-xl px-4 py-3"
            style={{
              background: isReal ? "rgba(239,68,68,0.06)" : "rgba(22,163,74,0.08)",
              border: isReal ? "1px solid rgba(239,68,68,0.15)" : "1px solid rgba(22,163,74,0.2)",
            }}
          >
            {isReal ? (
              <>
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4" style={{ color: "#F87171" }} />
                  <span className="text-[12px]" style={{ color: "#F87171" }}>Sem Safety Pro: − R$ 340</span>
                </div>
                <span className="text-[11px]" style={{ color: "#475569" }}>perda real</span>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" style={{ color: "#4ADE80" }} />
                  <span className="text-[12px]" style={{ color: "#4ADE80" }}>Com Safety Pro: R$ 0 de perda</span>
                </div>
                <span className="text-[11px] font-bold" style={{ color: "#22C55E" }}>capital salvo</span>
              </>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// ── Plans ──
const plans = [
  {
    id: "mensal",
    label: "Mensal",
    sublabel: "Proteção básica",
    price: 37,
    installments: null,
    color: "#64748B",
    features: [
      "Safety Pro ativo por 1 mês",
      "Migração automática Demo→Real",
      "Relatório de proteções diárias",
    ],
    missing: ["Multiplicador 20x integrado", "Suporte prioritário", "Atualizações perpétuas"],
    badge: null,
    checkoutUrl: "https://pay.kirvano.com/SAFETY-MENSAL-PLACEHOLDER",
  },
  {
    id: "anual",
    label: "Anual",
    sublabel: "Proteção por 12 meses",
    price: 97,
    installments: "12x de R$ 9,50",
    color: "#22C55E",
    features: [
      "Safety Pro ativo por 12 meses",
      "Migração automática Demo→Real",
      "Multiplicador 20x integrado",
      "Relatório de proteções diárias",
      "Suporte prioritário WhatsApp",
    ],
    missing: ["Atualizações perpétuas"],
    badge: "MAIS ESCOLHIDO",
    checkoutUrl: "https://pay.kirvano.com/SAFETY-ANUAL-PLACEHOLDER",
  },
  {
    id: "vitalicio",
    label: "Vitalício",
    sublabel: "Proteção para sempre",
    price: 147,
    installments: "12x de R$ 14,37",
    color: "#FACC15",
    features: [
      "Safety Pro vitalício",
      "Migração automática Demo→Real",
      "Multiplicador 20x integrado",
      "Relatório de proteções diárias",
      "Suporte prioritário WhatsApp",
      "Todas as atualizações futuras",
    ],
    missing: [],
    badge: null,
    checkoutUrl: "https://pay.kirvano.com/SAFETY-VITALICIO-PLACEHOLDER",
  },
];

// ── Main Component ──
const UpsellSafetyPro = ({ name, onNext, onDecline }: Props) => {
  const firstName = name !== "Visitante" ? name : "";
  const [selectedPlan, setSelectedPlan] = useState("anual");
  const [loading, setLoading] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const protectedOps = useLiveCounter(12847);

  const activePlan = plans.find(p => p.id === selectedPlan)!;

  const handleBuy = () => {
    setLoading(true);
    saveUpsellExtras("safety_pro" as any, { price: activePlan.price, plan: activePlan.id });
    saveFunnelEvent("upsell_oneclick_buy", { page: "/upsell5", product: `safety_pro_${activePlan.id}`, price: activePlan.price });
    logAuditEvent({ eventType: "upsell_oneclick_buy", pageId: "/upsell5", metadata: { product: `safety_pro_${activePlan.id}`, price: activePlan.price } });
    const utmQs = buildTrackingQueryString();
    const separator = activePlan.checkoutUrl.includes("?") ? "&" : "?";
    const fullUrl = utmQs ? `${activePlan.checkoutUrl}${separator}${utmQs.slice(1)}` : activePlan.checkoutUrl;
    window.open(fullUrl, "_blank");
    setTimeout(() => setLoading(false), 3000);
  };

  // ── Loss projection ──
  const lossPerMonth = 750;
  const lossPerYear = lossPerMonth * 12;

  return (
    <div className="flex flex-col gap-0 pt-2">

      {/* ── HERO: Hook de risco ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative rounded-3xl overflow-hidden p-6 pb-8"
        style={{
          background: "linear-gradient(180deg, rgba(250,204,21,0.08) 0%, rgba(15,23,42,0.95) 100%)",
          border: "1px solid rgba(250,204,21,0.2)",
        }}
      >
        {/* Pulsing icon */}
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: "rgba(250,204,21,0.1)", border: "1px solid rgba(250,204,21,0.25)" }}
        >
          <ShieldCheck className="w-8 h-8" style={{ color: "#FACC15" }} />
        </motion.div>

        <p className="text-center text-[11px] uppercase tracking-widest font-bold mb-2" style={{ color: "#FACC15" }}>
          Módulo de Proteção Avançado
        </p>

        <h1 className="text-[22px] font-extrabold text-center leading-tight" style={{ color: "#F8FAFC" }}>
          {firstName ? `${firstName}, seu` : "Seu"} sistema está operando.
          <br />
          <span style={{ color: "#FACC15" }}>Mas e quando vier uma perda?</span>
        </h1>

        <p className="text-center text-[13px] mt-3 leading-relaxed" style={{ color: "#94A3B8" }}>
          Toda plataforma de IA tem momentos de mercado adverso. A diferença entre os alunos que crescem e os que desistem está em <strong style={{ color: "#F8FAFC" }}>uma única proteção</strong>.
        </p>

        {/* Live ops counter */}
        <div
          className="mt-5 flex items-center justify-center gap-2 rounded-2xl py-3 px-4"
          style={{ background: "rgba(250,204,21,0.06)", border: "1px solid rgba(250,204,21,0.12)" }}
        >
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#FACC15" }} />
          <span className="text-[13px] font-semibold" style={{ color: "#E2E8F0" }}>
            <span style={{ color: "#FACC15", fontWeight: 800 }}>{protectedOps.toLocaleString("pt-BR")}</span> operações protegidas hoje
          </span>
        </div>
      </motion.div>

      {/* ── What happens WITHOUT Safety Pro ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-6 mx-1"
      >
        <p className="text-[13px] font-bold uppercase tracking-wide mb-4 text-center" style={{ color: "#EF4444" }}>
          O que acontece SEM o Safety Pro:
        </p>

        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.04)" }}>
          {[
            { label: "Mercado adverso", result: "IA opera na conta real → perde capital real", color: "#F87171" },
            { label: "Sequência negativa", result: "Perdas acumulam → desmotivação → abandono", color: "#F87171" },
            { label: "Volatilidade inesperada", result: "Saldo cai rapidamente sem defesa automática", color: "#F87171" },
          ].map((row, i) => (
            <div
              key={row.label}
              className="flex items-start gap-3 px-4 py-3.5"
              style={{ borderBottom: i < 2 ? "1px solid rgba(239,68,68,0.1)" : "none" }}
            >
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#F87171" }} />
              <div>
                <p className="text-[12px] font-bold" style={{ color: "#F87171" }}>{row.label}</p>
                <p className="text-[12px] mt-0.5 leading-relaxed" style={{ color: "#94A3B8" }}>{row.result}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Loss projection */}
        <div
          className="mt-3 rounded-2xl p-4 flex items-center justify-between"
          style={{ background: "rgba(15,23,42,0.9)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div>
            <p className="text-[11px] uppercase tracking-wide font-bold" style={{ color: "#64748B" }}>
              Perda estimada sem proteção
            </p>
            <p className="text-[13px] mt-1" style={{ color: "#94A3B8" }}>
              Média por mês em mercado adverso
            </p>
          </div>
          <div className="text-right">
            <p className="text-[28px] font-extrabold" style={{ color: "#EF4444" }}>
              − R$ {lossPerMonth}
            </p>
            <p className="text-[11px]" style={{ color: "#475569" }}>
              R$ {lossPerYear.toLocaleString("pt-BR")}/ano
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── Live Trade Simulator ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 mx-1"
      >
        <p className="text-[12px] font-bold uppercase tracking-wide mb-3" style={{ color: "#64748B" }}>
          Veja em tempo real o que o Safety Pro faz:
        </p>
        <TradeSimulator />
      </motion.div>

      {/* ── How it works ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="mt-6 mx-1 rounded-2xl p-5"
        style={{ background: "rgba(15,23,42,0.9)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #FACC15, #EAB308)" }}>
            <Zap className="w-4 h-4" style={{ color: "#020617" }} />
          </div>
          <div>
            <p className="text-[15px] font-bold" style={{ color: "#F8FAFC" }}>Como o Safety Pro funciona</p>
            <p className="text-[11px]" style={{ color: "#64748B" }}>Automático. Sem você fazer nada.</p>
          </div>
        </div>

        {[
          {
            icon: Eye,
            title: "Monitoramento contínuo 24h",
            desc: "A IA analisa o mercado a cada segundo, identificando cenários de risco antes que aconteçam.",
            color: "#60A5FA",
          },
          {
            icon: RefreshCw,
            title: "Migração instantânea para Demo",
            desc: "Quando detecta risco, o sistema redireciona automaticamente as operações para a conta demo. Nenhum centavo real exposto.",
            color: "#FACC15",
          },
          {
            icon: TrendingUp,
            title: "Retorno para a conta real",
            desc: "Quando o cenário fica favorável, a IA volta a operar na conta real — e só então. Lucros 20x maiores com risco zero.",
            color: "#22C55E",
          },
        ].map((step, i) => (
          <div key={step.title} className="flex items-start gap-3 mb-4 last:mb-0">
            <div className="relative shrink-0">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: `${step.color}15`, border: `1px solid ${step.color}30` }}
              >
                <step.icon className="w-4 h-4" style={{ color: step.color }} />
              </div>
              {i < 2 && (
                <div
                  className="absolute left-4 top-9 w-px h-5"
                  style={{ background: `linear-gradient(to bottom, ${step.color}40, transparent)` }}
                />
              )}
            </div>
            <div className="pt-1">
              <p className="text-[13px] font-bold" style={{ color: "#F8FAFC" }}>{step.title}</p>
              <p className="text-[12px] mt-1 leading-relaxed" style={{ color: "#94A3B8" }}>{step.desc}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* ── Video placeholder ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-6 mx-1"
      >
        <p className="text-[12px] font-bold uppercase tracking-wide mb-3" style={{ color: "#64748B" }}>
          Assista: Ricardo explica como ativa o Safety Pro
        </p>
        <div
          className="relative rounded-2xl overflow-hidden flex items-center justify-center cursor-pointer"
          style={{
            background: "linear-gradient(135deg, #0F172A, #1E293B)",
            border: "1px solid rgba(250,204,21,0.15)",
            aspectRatio: "16/9",
          }}
          onClick={() => setShowVideo(true)}
        >
          {!showVideo ? (
            <div className="flex flex-col items-center gap-3">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: "rgba(250,204,21,0.15)", border: "2px solid rgba(250,204,21,0.3)" }}
              >
                <Play className="w-7 h-7 ml-1" style={{ color: "#FACC15" }} />
              </motion.div>
              <p className="text-[13px] font-semibold" style={{ color: "#94A3B8" }}>
                Toque para assistir (2 min)
              </p>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {/* Substituir pelo embed real do vídeo */}
              <p className="text-[13px]" style={{ color: "#64748B" }}>
                [Cole aqui o embed do vídeo do Ricardo]
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Mentor word ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="mt-6 mx-1 rounded-2xl p-5"
        style={{
          background: "linear-gradient(135deg, rgba(59,130,246,0.08), rgba(59,130,246,0.02))",
          border: "1px solid rgba(59,130,246,0.15)",
        }}
      >
        <div className="flex items-start gap-3">
          <img
            src={mentorPhoto}
            alt="Ricardo Almeida"
            className="w-11 h-11 rounded-full object-cover shrink-0"
            style={{ border: "2px solid rgba(59,130,246,0.3)" }}
          />
          <div>
            <p className="text-[14px] font-bold" style={{ color: "#F8FAFC" }}>
              Ricardo Almeida · Fundador
            </p>
            <p className="text-[13px] leading-relaxed mt-2" style={{ color: "#94A3B8" }}>
              "Levei 3 anos e mais de R$ 40.000 em perdas para entender que o problema não era a estratégia — era a <strong style={{ color: "#F8FAFC" }}>falta de proteção automática</strong> em momentos de risco. O Safety Pro é o que eu gostaria de ter tido no começo. Com ele ativo, meus alunos nunca mais precisam passar pelo que passei."
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── Result projection WITH Safety Pro ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-6 mx-1"
      >
        <p className="text-[13px] font-bold uppercase tracking-wide mb-4 text-center" style={{ color: "#22C55E" }}>
          Comparativo: com vs. sem Safety Pro
        </p>

        <div className="grid grid-cols-2 gap-3">
          {/* WITHOUT */}
          <div
            className="rounded-2xl p-4"
            style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.18)" }}
          >
            <p className="text-[10px] font-bold uppercase tracking-wide mb-3" style={{ color: "#F87171" }}>
              Sem Safety Pro
            </p>
            {[
              "Perde em mercado adverso",
              "Capital exposto 100%",
              "Desmotivação e abandono",
              "Lucro travado pelo risco",
            ].map(t => (
              <div key={t} className="flex items-start gap-1.5 mb-2">
                <span className="text-[10px] font-bold mt-0.5" style={{ color: "#EF4444" }}>✗</span>
                <span className="text-[11px] leading-tight" style={{ color: "#94A3B8" }}>{t}</span>
              </div>
            ))}
            <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(239,68,68,0.12)" }}>
              <p className="text-[18px] font-extrabold" style={{ color: "#EF4444" }}>− R$ 750/mês</p>
              <p className="text-[10px]" style={{ color: "#475569" }}>em perdas médias</p>
            </div>
          </div>

          {/* WITH */}
          <div
            className="rounded-2xl p-4"
            style={{ background: "rgba(22,163,74,0.06)", border: "1.5px solid rgba(22,163,74,0.3)" }}
          >
            <p className="text-[10px] font-bold uppercase tracking-wide mb-3" style={{ color: "#22C55E" }}>
              Com Safety Pro
            </p>
            {[
              "Nunca perde em real",
              "Capital 100% protegido",
              "Opera com confiança total",
              "Lucro 20x amplificado",
            ].map(t => (
              <div key={t} className="flex items-start gap-1.5 mb-2">
                <span className="text-[10px] font-bold mt-0.5" style={{ color: "#22C55E" }}>✓</span>
                <span className="text-[11px] leading-tight" style={{ color: "#E2E8F0" }}>{t}</span>
              </div>
            ))}
            <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(22,163,74,0.15)" }}>
              <p className="text-[18px] font-extrabold" style={{ color: "#22C55E" }}>+ R$ 0 de perda</p>
              <p className="text-[10px]" style={{ color: "#4ADE80" }}>risco zerado</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── If they have Multiplicador ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className="mt-4 mx-1 rounded-2xl p-4 flex items-start gap-3"
        style={{ background: "rgba(250,204,21,0.05)", border: "1px solid rgba(250,204,21,0.2)" }}
      >
        <Target className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#FACC15" }} />
        <p className="text-[13px] leading-relaxed" style={{ color: "#CBD5E1" }}>
          {firstName ? `${firstName}, você` : "Você"} já tem o <strong style={{ color: "#FACC15" }}>Multiplicador de Lucros</strong> ativo. O Safety Pro <strong style={{ color: "#F8FAFC" }}>se integra direto a ele</strong> — multiplicando os ganhos enquanto zera as perdas. A combinação dos dois é o que os alunos mais avançados usam.
        </p>
      </motion.div>

      {/* ── Testimonials ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-6 mx-1 rounded-2xl p-5"
        style={{ background: "rgba(30,41,59,0.6)", border: "1px solid rgba(255,255,255,0.04)" }}
      >
        <p className="text-[13px] font-bold mb-4" style={{ color: "#E2E8F0" }}>
          Quem já usa o Safety Pro:
        </p>
        {[
          {
            img: avatarAntonio,
            name: "Antônio R., 61 anos",
            text: "Em fevereiro o mercado virou do avesso. Sem o Safety Pro, teria perdido R$ 1.200. Com ele, a IA foi pra demo automaticamente. Não perdi nada. Voltei pra real quando o cenário ficou bom e fiz R$ 340 no mesmo dia.",
          },
          {
            img: avatarLucia,
            name: "Lúcia M., 54 anos",
            text: "Eu tinha medo de perder tudo que juntei. Depois que ativei o Safety Pro, isso sumiu. Sei que a IA está me protegendo o tempo todo. Consigo dormir tranquila agora.",
          },
          {
            img: avatarCarlos,
            name: "Carlos F., 58 anos",
            text: "Junto com o Multiplicador, foi um combinado incrível. Em 3 semanas com as duas ferramentas ativas, meu lucro aumentou 4 vezes sem nenhuma perda relevante.",
          },
        ].map((t) => (
          <div key={t.name} className="flex items-start gap-3 mb-4 last:mb-0">
            <img
              src={t.img}
              alt={t.name}
              className="w-10 h-10 rounded-full object-cover shrink-0"
              style={{ border: "2px solid rgba(34,197,94,0.25)" }}
            />
            <div>
              <p className="text-[13px] font-semibold" style={{ color: "#E2E8F0" }}>{t.name}</p>
              <p className="text-[12px] italic leading-relaxed mt-0.5" style={{ color: "#94A3B8" }}>"{t.text}"</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* ── Solution header ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-center mt-8 px-2"
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
          style={{ background: "linear-gradient(135deg, #FACC15, #EAB308)", boxShadow: "0 0 30px rgba(250,204,21,0.25)" }}
        >
          <ShieldCheck className="w-6 h-6" style={{ color: "#020617" }} />
        </div>
        <p className="text-[11px] uppercase tracking-widest font-bold" style={{ color: "#FACC15" }}>
          Ative agora
        </p>
        <h2 className="text-[22px] font-extrabold mt-1 leading-tight" style={{ color: "#F8FAFC" }}>
          Safety Pro — Proteção de Capital
        </h2>
        <p className="text-[13px] mt-2 leading-relaxed" style={{ color: "#94A3B8" }}>
          Escolha seu plano. A IA começa a proteger seu capital nos próximos minutos.
        </p>
      </motion.div>

      {/* ── Plan selector tabs ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65 }}
        className="mt-5 mx-1"
      >
        <p className="text-[11px] text-center mb-2 font-medium" style={{ color: "#64748B" }}>
          Toque para comparar os planos:
        </p>
        <div
          className="flex rounded-2xl p-1.5 gap-1"
          style={{ background: "#0F172A", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          {plans.map((plan) => {
            const isActive = selectedPlan === plan.id;
            return (
              <motion.button
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                whileTap={{ scale: 0.95 }}
                className="flex-1 py-3 rounded-xl text-center transition-all relative cursor-pointer"
                style={{
                  background: isActive
                    ? `linear-gradient(135deg, ${plan.color}15, ${plan.color}05)`
                    : "rgba(255,255,255,0.03)",
                  border: isActive ? `1.5px solid ${plan.color}` : "1.5px solid rgba(255,255,255,0.08)",
                  boxShadow: isActive ? `0 0 12px ${plan.color}15` : "none",
                }}
              >
                {plan.badge && (
                  <span
                    className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[8px] font-bold px-2 py-0.5 rounded-full text-white whitespace-nowrap"
                    style={{ background: "#16A34A", letterSpacing: "0.5px" }}
                  >
                    {plan.badge}
                  </span>
                )}
                <p className="text-[12px] font-bold" style={{ color: isActive ? plan.color : "#94A3B8" }}>
                  {plan.label}
                </p>
                <p className="text-[10px] mt-0.5 font-medium" style={{ color: isActive ? "#CBD5E1" : "#64748B" }}>
                  R$ {plan.price}
                </p>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* ── Selected plan detail ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedPlan}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="mt-4 mx-1"
        >
          <div
            className="rounded-2xl overflow-hidden"
            style={{ border: `1.5px solid ${activePlan.color}33` }}
          >
            {/* Plan header */}
            <div
              className="px-5 py-4 flex items-center justify-between"
              style={{
                background: `linear-gradient(135deg, ${activePlan.color}10, ${activePlan.color}03)`,
              }}
            >
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5" style={{ color: activePlan.color }} />
                  <h3 className="text-[17px] font-bold" style={{ color: "#F8FAFC" }}>
                    Safety Pro {activePlan.label}
                  </h3>
                </div>
                <p className="text-[12px] mt-0.5" style={{ color: "#94A3B8" }}>{activePlan.sublabel}</p>
              </div>
              <div className="text-right">
                <span className="text-[26px] font-extrabold" style={{ color: "#F8FAFC" }}>R$ {activePlan.price}</span>
                {activePlan.installments && (
                  <p className="text-[10px]" style={{ color: "#64748B" }}>{activePlan.installments}</p>
                )}
              </div>
            </div>

            {/* Features */}
            <div className="px-5 py-4" style={{ background: "#0F172A" }}>
              <div className="flex flex-col gap-2.5 mb-4">
                {activePlan.features.map((f) => (
                  <div key={f} className="flex items-center gap-2.5">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: `${activePlan.color}15` }}
                    >
                      <Check className="w-3 h-3" style={{ color: activePlan.color }} />
                    </div>
                    <span className="text-[13px]" style={{ color: "#E2E8F0" }}>{f}</span>
                  </div>
                ))}
                {activePlan.missing.map((f) => (
                  <div key={f} className="flex items-center gap-2.5 opacity-40">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,0.04)" }}>
                      <span className="text-[10px]" style={{ color: "#475569" }}>✗</span>
                    </div>
                    <span className="text-[13px] line-through" style={{ color: "#475569" }}>{f}</span>
                  </div>
                ))}
              </div>

              {/* Urgência */}
              <div
                className="rounded-xl px-4 py-3 mb-4 flex items-start gap-2.5"
                style={{ background: "rgba(250,204,21,0.06)", border: "1px solid rgba(250,204,21,0.15)" }}
              >
                <Zap className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#FACC15" }} />
                <p className="text-[12px] leading-relaxed" style={{ color: "#CBD5E1" }}>
                  Esta oferta é <strong style={{ color: "#FACC15" }}>exclusiva para novos membros</strong> nesta página. Preço normal: R$ 397.
                </p>
              </div>

              {/* CTA */}
              <button
                onClick={handleBuy}
                disabled={loading}
                className="w-full py-[18px] rounded-xl text-[16px] font-bold text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
                style={{
                  background: "linear-gradient(135deg, #FACC15, #EAB308)",
                  color: "#020617",
                  boxShadow: "0 0 20px rgba(250,204,21,0.25), 0 4px 12px rgba(0,0,0,0.3)",
                }}
              >
                {loading ? (
                  "Processando..."
                ) : (
                  <>
                    ATIVAR SAFETY PRO — R$ {activePlan.price}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Security badges */}
              <div className="flex items-center justify-center gap-5 mt-4">
                <div className="flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" style={{ color: "#475569" }} />
                  <span className="text-[11px]" style={{ color: "#475569" }}>100% seguro</span>
                </div>
                <div className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" style={{ color: "#475569" }} />
                  <span className="text-[11px]" style={{ color: "#475569" }}>Garantia 30 dias</span>
                </div>
                <div className="flex items-center gap-1">
                  <BarChart3 className="w-3.5 h-3.5" style={{ color: "#475569" }} />
                  <span className="text-[11px]" style={{ color: "#475569" }}>Ativação imediata</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ── Skip ── */}
      <button
        onClick={() => {
          saveFunnelEvent("upsell_oneclick_decline", { page: "/upsell5" });
          logAuditEvent({ eventType: "upsell_oneclick_decline", pageId: "/upsell5" });
          onDecline();
        }}
        className="text-[12px] underline cursor-pointer bg-transparent border-none mx-auto py-3 pb-6"
        style={{ color: "#475569" }}
      >
        Não, prefiro deixar meu capital exposto ao risco.
      </button>
    </div>
  );
};

export default UpsellSafetyPro;
