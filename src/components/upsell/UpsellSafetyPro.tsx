import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, TrendingUp, TrendingDown, Check, Lock, Zap,
  BarChart3, Eye, RefreshCw, Activity, Play, ArrowRight,
} from "lucide-react";
import { saveUpsellExtras } from "@/lib/upsellData";
import { saveFunnelEvent } from "@/lib/metricsClient";
import { logAuditEvent } from "@/hooks/useAuditLog";
import { buildTrackingQueryString } from "@/lib/trackingDataLayer";
import avatarAntonio from "@/assets/avatar-antonio.jpg";

interface Props {
  name: string;
  onNext: () => void;
  onDecline: () => void;
}

// ── Live counter ──
const useLiveCounter = (start: number) => {
  const [count, setCount] = useState(start);
  useEffect(() => {
    const t = setInterval(() => setCount(c => c + Math.floor(Math.random() * 3 + 1)), 4000);
    return () => clearInterval(t);
  }, []);
  return count;
};

// ── Trade Simulator ──
const TradeSimulator = () => {
  const [mode, setMode] = useState<"risk" | "safe">("risk");
  useEffect(() => {
    const t = setInterval(() => setMode(m => (m === "risk" ? "safe" : "risk")), 3200);
    return () => clearInterval(t);
  }, []);
  const isRisk = mode === "risk";
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="flex items-center justify-between px-4 py-2.5" style={{ background: "#0F172A" }}>
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5" style={{ color: "#64748B" }} />
          <span className="text-[11px] font-semibold" style={{ color: "#64748B" }}>Alfa Híbrida · IA ao vivo</span>
        </div>
        <AnimatePresence mode="wait">
          <motion.span
            key={mode}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            className="text-[10px] font-bold px-2.5 py-1 rounded-full"
            style={{
              background: isRisk ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.15)",
              color: isRisk ? "#F87171" : "#4ADE80",
              border: isRisk ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(34,197,94,0.3)",
            }}
          >
            {isRisk ? "⚠ RISCO DETECTADO" : "✓ DEMO ATIVA — CAPITAL SALVO"}
          </motion.span>
        </AnimatePresence>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          className="px-4 pb-4 pt-3"
          style={{ background: "#060F1E" }}
        >
          <div className="flex justify-between mb-2.5">
            <div>
              <p className="text-[10px] uppercase tracking-wide font-bold" style={{ color: "#475569" }}>Operação</p>
              <p className="text-[15px] font-extrabold mt-0.5" style={{ color: "#F8FAFC" }}>EUR/USD · Scalping IA</p>
            </div>
            <div className="text-right">
              <p className="text-[10px]" style={{ color: "#475569" }}>Conta</p>
              <p className="text-[14px] font-bold" style={{ color: isRisk ? "#F87171" : "#4ADE80" }}>
                {isRisk ? "Real (exposta)" : "Demo (protegida)"}
              </p>
            </div>
          </div>

          <div className="relative h-2 rounded-full overflow-hidden mb-2" style={{ background: "rgba(255,255,255,0.06)" }}>
            <motion.div
              initial={{ width: isRisk ? "0%" : "75%" }}
              animate={{ width: isRisk ? "75%" : "100%" }}
              transition={{ duration: 1.4, ease: "easeOut" }}
              className="absolute inset-y-0 left-0 rounded-full"
              style={{ background: isRisk ? "linear-gradient(90deg,#FACC15,#EF4444)" : "linear-gradient(90deg,#16A34A,#22C55E)" }}
            />
          </div>

          <div
            className="flex items-center justify-between rounded-xl px-3 py-2.5 mt-3"
            style={{
              background: isRisk ? "rgba(239,68,68,0.06)" : "rgba(22,163,74,0.08)",
              border: isRisk ? "1px solid rgba(239,68,68,0.15)" : "1px solid rgba(22,163,74,0.2)",
            }}
          >
            {isRisk ? (
              <>
                <div className="flex items-center gap-1.5">
                  <TrendingDown className="w-4 h-4" style={{ color: "#F87171" }} />
                  <span className="text-[12px]" style={{ color: "#F87171" }}>Sem Safety Pro: − R$ 340 perdidos</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4" style={{ color: "#4ADE80" }} />
                  <span className="text-[12px]" style={{ color: "#4ADE80" }}>Com Safety Pro: R$ 0 de perda</span>
                </div>
                <span className="text-[10px] font-bold" style={{ color: "#22C55E" }}>✓ salvo</span>
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
    price: 37,
    installments: null,
    color: "#64748B",
    badge: null,
    checkoutUrl: "https://pay.kirvano.com/SAFETY-MENSAL-PLACEHOLDER",
  },
  {
    id: "anual",
    label: "Anual",
    price: 97,
    installments: "12x de R$ 9,50",
    color: "#22C55E",
    badge: "MAIS ESCOLHIDO",
    checkoutUrl: "https://pay.kirvano.com/SAFETY-ANUAL-PLACEHOLDER",
  },
  {
    id: "vitalicio",
    label: "Vitalício",
    price: 147,
    installments: "12x de R$ 14,37",
    color: "#FACC15",
    badge: null,
    checkoutUrl: "https://pay.kirvano.com/SAFETY-VITALICIO-PLACEHOLDER",
  },
];

const features: Record<string, string[]> = {
  mensal: ["Safety Pro ativo por 1 mês", "Migração automática Demo→Real", "Relatório diário de proteções"],
  anual: ["Safety Pro por 12 meses", "Migração automática Demo→Real", "Multiplicador 20x integrado", "Relatório diário de proteções", "Suporte prioritário WhatsApp"],
  vitalicio: ["Safety Pro vitalício", "Migração automática Demo→Real", "Multiplicador 20x integrado", "Relatório diário de proteções", "Suporte prioritário WhatsApp", "Todas as atualizações futuras"],
};

// ── Main ──
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
    const sep = activePlan.checkoutUrl.includes("?") ? "&" : "?";
    const fullUrl = utmQs ? `${activePlan.checkoutUrl}${sep}${utmQs.slice(1)}` : activePlan.checkoutUrl;
    window.open(fullUrl, "_blank");
    setTimeout(() => setLoading(false), 3000);
  };

  return (
    <div className="flex flex-col gap-5 pt-4">

      {/* ── HERO ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-3xl p-6 text-center"
        style={{
          background: "linear-gradient(180deg, rgba(250,204,21,0.08) 0%, rgba(15,23,42,0.95) 100%)",
          border: "1px solid rgba(250,204,21,0.2)",
        }}
      >
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: "rgba(250,204,21,0.1)", border: "1px solid rgba(250,204,21,0.25)" }}
        >
          <ShieldCheck className="w-7 h-7" style={{ color: "#FACC15" }} />
        </motion.div>

        <p className="text-[11px] uppercase tracking-widest font-bold mb-2" style={{ color: "#FACC15" }}>
          Módulo de Proteção Avançado
        </p>
        <h1 className="text-[22px] font-extrabold leading-tight" style={{ color: "#F8FAFC" }}>
          {firstName ? `${firstName}, seu` : "Seu"} sistema opera.
          <br />
          <span style={{ color: "#FACC15" }}>Mas e quando vier uma perda?</span>
        </h1>
        <p className="text-[13px] mt-3 leading-relaxed" style={{ color: "#94A3B8" }}>
          Toda IA tem momentos adversos. A diferença entre quem cresce e quem desiste é{" "}
          <strong style={{ color: "#F8FAFC" }}>uma única proteção automática</strong>.
        </p>

        {/* Live counter */}
        <div
          className="mt-4 inline-flex items-center gap-2 rounded-xl py-2 px-4"
          style={{ background: "rgba(250,204,21,0.06)", border: "1px solid rgba(250,204,21,0.12)" }}
        >
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#FACC15" }} />
          <span className="text-[12px] font-semibold" style={{ color: "#E2E8F0" }}>
            <span style={{ color: "#FACC15", fontWeight: 800 }}>{protectedOps.toLocaleString("pt-BR")}</span> operações protegidas hoje
          </span>
        </div>
      </motion.div>

      {/* ── Trade Simulator ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <p className="text-[11px] font-bold uppercase tracking-wide mb-2.5" style={{ color: "#64748B" }}>
          Veja o que acontece em tempo real:
        </p>
        <TradeSimulator />
      </motion.div>

      {/* ── How it works — 3 chips horizontais ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl p-4"
        style={{ background: "rgba(15,23,42,0.9)", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        <p className="text-[12px] font-bold uppercase tracking-wide mb-3" style={{ color: "#64748B" }}>
          Como funciona — automático, sem fazer nada
        </p>
        <div className="flex flex-col gap-3">
          {[
            { icon: Eye, color: "#60A5FA", label: "Monitora o mercado 24h/dia, identificando risco a cada segundo" },
            { icon: RefreshCw, color: "#FACC15", label: "Detectou risco? Migra instantaneamente para conta demo. Capital real intocado." },
            { icon: TrendingUp, color: "#22C55E", label: "Cenário favorável? Volta para a conta real e maximiza o lucro — 20x mais." },
          ].map((s, i) => (
            <div key={i} className="flex items-start gap-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${s.color}15`, border: `1px solid ${s.color}30` }}
              >
                <s.icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
              <p className="text-[13px] leading-relaxed pt-1" style={{ color: "#CBD5E1" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Video do expert ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <p className="text-[11px] font-bold uppercase tracking-wide mb-2.5" style={{ color: "#64748B" }}>
          Ricardo explica em 2 minutos:
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
            <div className="flex flex-col items-center gap-2.5">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ background: "rgba(250,204,21,0.15)", border: "2px solid rgba(250,204,21,0.3)" }}
              >
                <Play className="w-6 h-6 ml-1" style={{ color: "#FACC15" }} />
              </motion.div>
              <p className="text-[12px]" style={{ color: "#94A3B8" }}>Toque para assistir</p>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center p-6">
              {/* ↓ Substituir pelo embed real do vídeo */}
              <p className="text-[13px] text-center" style={{ color: "#64748B" }}>
                [Cole aqui o embed do vídeo do Ricardo]
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── 1 depoimento social proof ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl p-4 flex items-start gap-3"
        style={{ background: "rgba(30,41,59,0.7)", border: "1px solid rgba(255,255,255,0.05)" }}
      >
        <img
          src={avatarAntonio}
          alt="Antônio R."
          className="w-10 h-10 rounded-full object-cover shrink-0"
          style={{ border: "2px solid rgba(34,197,94,0.25)" }}
        />
        <div>
          <p className="text-[13px] font-semibold" style={{ color: "#E2E8F0" }}>Antônio R., 61 anos</p>
          <p className="text-[12px] italic leading-relaxed mt-0.5" style={{ color: "#94A3B8" }}>
            "O mercado virou em fevereiro. Sem o Safety Pro, teria perdido R$ 1.200. A IA foi pra demo sozinha. Não perdi nada — e ainda fechei o dia no verde."
          </p>
        </div>
      </motion.div>

      {/* ── Sinergia com Multiplicador ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="rounded-xl px-4 py-3 flex items-start gap-2.5"
        style={{ background: "rgba(250,204,21,0.05)", border: "1px solid rgba(250,204,21,0.18)" }}
      >
        <Zap className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#FACC15" }} />
        <p className="text-[13px] leading-relaxed" style={{ color: "#CBD5E1" }}>
          {firstName ? `${firstName}, você` : "Você"} já tem o <strong style={{ color: "#FACC15" }}>Multiplicador ativo</strong>. O Safety Pro <strong style={{ color: "#F8FAFC" }}>integra direto a ele</strong> — multiplica os ganhos e zera as perdas ao mesmo tempo.
        </p>
      </motion.div>

      {/* ── Plan selector ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <p className="text-[11px] text-center mb-2.5 font-medium" style={{ color: "#64748B" }}>
          Escolha seu plano de proteção:
        </p>
        <div
          className="flex rounded-2xl p-1.5 gap-1 mb-4"
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
                  background: isActive ? `linear-gradient(135deg, ${plan.color}15, ${plan.color}05)` : "rgba(255,255,255,0.03)",
                  border: isActive ? `1.5px solid ${plan.color}` : "1.5px solid rgba(255,255,255,0.08)",
                  boxShadow: isActive ? `0 0 12px ${plan.color}18` : "none",
                }}
              >
                {plan.badge && (
                  <span
                    className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[8px] font-bold px-2 py-0.5 rounded-full text-white whitespace-nowrap"
                    style={{ background: "#16A34A" }}
                  >
                    {plan.badge}
                  </span>
                )}
                <p className="text-[12px] font-bold" style={{ color: isActive ? plan.color : "#94A3B8" }}>
                  {plan.label}
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: isActive ? "#CBD5E1" : "#64748B" }}>
                  R$ {plan.price}
                </p>
              </motion.button>
            );
          })}
        </div>

        {/* Selected plan detail */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedPlan}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl overflow-hidden"
            style={{ border: `1.5px solid ${activePlan.color}33` }}
          >
            {/* Header */}
            <div
              className="px-5 py-4 flex items-center justify-between"
              style={{ background: `linear-gradient(135deg, ${activePlan.color}10, ${activePlan.color}03)` }}
            >
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" style={{ color: activePlan.color }} />
                  <h3 className="text-[16px] font-bold" style={{ color: "#F8FAFC" }}>
                    Safety Pro {activePlan.label}
                  </h3>
                </div>
                {activePlan.installments && (
                  <p className="text-[11px] mt-0.5" style={{ color: "#64748B" }}>{activePlan.installments}</p>
                )}
              </div>
              <div className="text-right">
                <span className="text-[26px] font-extrabold" style={{ color: "#F8FAFC" }}>R$ {activePlan.price}</span>
                <p className="text-[10px]" style={{ color: "#64748B" }}>único</p>
              </div>
            </div>

            {/* Features */}
            <div className="px-5 py-4" style={{ background: "#0F172A" }}>
              <div className="flex flex-col gap-2 mb-5">
                {features[activePlan.id].map((f) => (
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
              </div>

              {/* CTA */}
              <button
                onClick={handleBuy}
                disabled={loading}
                className="w-full py-[17px] rounded-xl text-[15px] font-bold transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
                style={{
                  background: "linear-gradient(135deg, #FACC15, #EAB308)",
                  color: "#020617",
                  boxShadow: "0 0 20px rgba(250,204,21,0.25), 0 4px 12px rgba(0,0,0,0.3)",
                }}
              >
                {loading ? "Processando..." : <>ATIVAR SAFETY PRO — R$ {activePlan.price} <ArrowRight className="w-4 h-4" /></>}
              </button>

              {/* Badges */}
              <div className="flex items-center justify-center gap-5 mt-3">
                {[
                  [Lock, "100% seguro"],
                  [ShieldCheck, "Garantia 30 dias"],
                  [BarChart3, "Ativação imediata"],
                ].map(([Icon, label]) => (
                  <div key={label as string} className="flex items-center gap-1">
                    <Icon className="w-3.5 h-3.5" style={{ color: "#475569" }} />
                    <span className="text-[10px]" style={{ color: "#475569" }}>{label as string}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* ── Skip ── */}
      <button
        onClick={() => {
          saveFunnelEvent("upsell_oneclick_decline", { page: "/upsell5" });
          logAuditEvent({ eventType: "upsell_oneclick_decline", pageId: "/upsell5" });
          onDecline();
        }}
        className="text-[12px] underline cursor-pointer bg-transparent border-none mx-auto py-2 pb-6"
        style={{ color: "#475569" }}
      >
        Não, prefiro continuar sem proteção.
      </button>
    </div>
  );
};

export default UpsellSafetyPro;
