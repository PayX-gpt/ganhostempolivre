import { useState } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck, Check, Lock, RefreshCw, AlertTriangle, CheckCircle2,
  XCircle, Crown, Clock, Shield, Star, Headphones, BarChart3, Zap,
  ChevronRight, ShieldOff, ShieldAlert,
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
    label: "Extensão",
    duration: "+12 meses",
    totalAccess: "18 meses no total",
    price: 67,
    installments: "6x de R$ 12,90",
    features: ["+12 meses de acesso", "Proteção temporária", "Suporte por e-mail"],
    missing: ["Atualizações futuras", "Suporte prioritário", "Recursos antecipados"],
    warning: "Expira de novo após 18 meses",
    color: "#64748B",
    checkoutUrl: "https://pay.kirvano.com/5efbb9e7-6033-4281-bd6d-6b5830e7145d",
  },
  {
    id: "vitalicio" as const,
    label: "Vitalício",
    duration: "Para sempre",
    totalAccess: "Acesso permanente",
    price: 127,
    installments: "12x de R$ 12,42",
    features: ["Acesso vitalício", "Atualizações automáticas", "Proteção permanente", "Novas estratégias incluídas"],
    missing: ["Suporte prioritário", "Recursos antecipados"],
    warning: null,
    color: "#22C55E",
    checkoutUrl: "https://pay.kirvano.com/8b821768-dfb9-487d-a6a6-8beb9a9cdb20",
  },
  {
    id: "vip" as const,
    label: "VIP",
    duration: "Para sempre + extras",
    totalAccess: "Acesso premium vitalício",
    price: 197,
    installments: "12x de R$ 19,25",
    features: ["Acesso vitalício", "Atualizações automáticas", "Proteção permanente", "Novas estratégias incluídas", "Suporte prioritário WhatsApp", "Acesso antecipado a recursos"],
    missing: [],
    warning: null,
    color: "#FACC15",
    checkoutUrl: "https://pay.kirvano.com/a7cfdcbf-849f-4060-b660-b850f46a0e52",
  },
];

const UpsellBlindagem = ({ name, onNext, onDecline }: Props) => {
  const firstName = name !== "Visitante" ? name : "";
  const [selectedPlan, setSelectedPlan] = useState<string>("vitalicio");
  const [loading, setLoading] = useState(false);

  const activePlan = plans.find((p) => p.id === selectedPlan)!;

  const handleBuy = () => {
    setLoading(true);
    saveUpsellExtras("blindagem", { price: activePlan.price, plan: activePlan.id });
    saveFunnelEvent("upsell_oneclick_buy", { page: "/upsell3", product: `blindagem_${activePlan.id}`, price: activePlan.price });
    logAuditEvent({ eventType: "upsell_oneclick_buy", pageId: "/upsell3", metadata: { product: `blindagem_${activePlan.id}`, price: activePlan.price } });
    const utmQs = buildTrackingQueryString();
    const separator = activePlan.checkoutUrl.includes("?") ? "&" : "?";
    const fullUrl = utmQs ? `${activePlan.checkoutUrl}${separator}${utmQs.slice(1)}` : activePlan.checkoutUrl;
    window.open(fullUrl, "_blank");
  };

  return (
    <div className="flex flex-col gap-0 pt-2">

      {/* ── HERO: Expiration Timeline ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative rounded-3xl overflow-hidden p-6 pb-8"
        style={{
          background: "linear-gradient(180deg, rgba(239,68,68,0.12) 0%, rgba(15,23,42,0.95) 100%)",
          border: "1px solid rgba(239,68,68,0.2)",
        }}
      >
        {/* Pulsing shield icon */}
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.25)" }}
        >
          <ShieldOff className="w-8 h-8" style={{ color: "#EF4444" }} />
        </motion.div>

        <h1 className="text-[20px] font-extrabold text-center leading-tight" style={{ color: "#F8FAFC" }}>
          {firstName ? `${firstName}, seu` : "Seu"} acesso expira em
        </h1>
        <p className="text-center text-[42px] font-black mt-1" style={{ color: "#EF4444", letterSpacing: "-1px" }}>
          6 meses
        </p>

        {/* Visual timeline bar */}
        <div className="mt-5 mx-2">
          <div className="flex justify-between text-[10px] font-semibold mb-1.5" style={{ color: "#64748B" }}>
            <span>HOJE</span>
            <span style={{ color: "#EF4444" }}>EXPIRAÇÃO</span>
          </div>
          <div className="relative h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 2, ease: "easeOut", delay: 0.5 }}
              className="absolute inset-y-0 left-0 rounded-full"
              style={{ background: "linear-gradient(90deg, #22C55E 0%, #FACC15 50%, #EF4444 100%)" }}
            />
          </div>
          <div className="flex justify-between text-[10px] mt-1.5" style={{ color: "#475569" }}>
            <span>Ativo</span>
            <span>3 meses</span>
            <span>Desativado</span>
          </div>
        </div>

        {/* What you lose */}
        <div className="mt-5 flex flex-col gap-1.5">
          {["Conta desativada permanentemente", "Ganhos acumulados perdidos", "Sem possibilidade de reativação"].map((t, i) => (
            <motion.div
              key={t}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.5 + i * 0.15 }}
              className="flex items-center gap-2"
            >
              <XCircle className="w-3.5 h-3.5 shrink-0" style={{ color: "#EF4444" }} />
              <span className="text-[12px]" style={{ color: "#F87171" }}>{t}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── Active items pill ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mx-4 -mt-4 rounded-2xl p-4 relative z-10"
        style={{ background: "#0F172A", border: "1px solid rgba(34,197,94,0.15)", boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }}
      >
        <p className="text-[10px] uppercase tracking-widest font-bold mb-2.5" style={{ color: "#22C55E" }}>
          Em risco de perda:
        </p>
        <div className="grid grid-cols-1 gap-1.5">
          {["Plataforma de Ganhos", "Acelerador Ativado", "Multiplicador de Lucros"].map((item) => (
            <div key={item} className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: "#22C55E" }} />
              <span className="text-[12px] font-medium" style={{ color: "#CBD5E1" }}>{item}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Why it happens + Negotiation ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-6 mx-1 rounded-2xl p-5"
        style={{ background: "rgba(15,23,42,0.9)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <p className="text-[15px] font-bold mb-3" style={{ color: "#F59E0B" }}>
          Por que isso acontece?
        </p>
        <p className="text-[13px] leading-relaxed" style={{ color: "#94A3B8" }}>
          A Plataforma de Ganhos com Tempo Livre opera através de{" "}
          <strong style={{ color: "#F8FAFC" }}>parcerias estratégicas com instituições financeiras e provedores de dados de mercado</strong>.
        </p>
        <p className="text-[13px] leading-relaxed mt-3" style={{ color: "#94A3B8" }}>
          Esses acordos são renovados a cada seis meses e, por razões contratuais,{" "}
          <strong style={{ color: "#EF4444" }}>não podemos garantir o acesso além de 6 meses</strong> para contas com plano padrão.
        </p>
        <p className="text-[13px] leading-relaxed mt-3" style={{ color: "#94A3B8" }}>
          Imagine: você passou 6 meses construindo resultados consistentes, seu sistema operando perfeitamente...{" "}
          <strong style={{ color: "#EF4444" }}>e de repente: acesso encerrado.</strong>
        </p>
      </motion.div>

      {/* ── Special negotiation ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-4 mx-1 rounded-2xl p-5"
        style={{
          background: "linear-gradient(135deg, rgba(59,130,246,0.08), rgba(59,130,246,0.02))",
          border: "1px solid rgba(59,130,246,0.15)",
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(59,130,246,0.15)" }}
          >
            <Crown className="w-5 h-5" style={{ color: "#3B82F6" }} />
          </div>
          <div>
            <p className="text-[14px] font-bold" style={{ color: "#F8FAFC" }}>
              Negociação exclusiva para membros fundadores
            </p>
            <p className="text-[13px] leading-relaxed mt-2" style={{ color: "#94A3B8" }}>
              Ricardo Almeida negociou pessoalmente um acordo especial com os parceiros para permitir que{" "}
              <strong style={{ color: "#60A5FA" }}>membros fundadores</strong> — como você, que está entrando agora — possam ativar uma{" "}
              <strong style={{ color: "#F8FAFC" }}>blindagem permanente no acesso</strong>.
            </p>
            <p className="text-[13px] leading-relaxed mt-2" style={{ color: "#94A3B8" }}>
              Com essa blindagem, seu sistema{" "}
              <strong style={{ color: "#F8FAFC" }}>nunca será desativado</strong>. Todas as atualizações, melhorias e novas estratégias chegam na sua conta automaticamente.
            </p>
            <p className="text-[12px] font-semibold mt-3" style={{ color: "#F59E0B" }}>
              Essa condição só está disponível agora, nesta página.
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── Solution section ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center mt-8 px-2"
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
          style={{ background: "linear-gradient(135deg, #3B82F6, #1D4ED8)", boxShadow: "0 0 30px rgba(59,130,246,0.3)" }}
        >
          <ShieldCheck className="w-6 h-6 text-white" />
        </div>
        <p className="text-[11px] uppercase tracking-widest font-bold" style={{ color: "#3B82F6" }}>
          A solução
        </p>
        <h2 className="text-[22px] font-extrabold mt-1 leading-tight" style={{ color: "#F8FAFC" }}>
          Blindagem de Acesso
        </h2>
        <p className="text-[13px] mt-2 leading-relaxed" style={{ color: "#94A3B8" }}>
          Escolha o nível de proteção e nunca mais se preocupe com a expiração do seu sistema.
        </p>
      </motion.div>

      {/* ── Plan selector tabs ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-6 mx-1"
      >
        <div
          className="flex rounded-2xl p-1.5 gap-1"
          style={{ background: "#0F172A", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          {plans.map((plan) => {
            const isActive = selectedPlan === plan.id;
            return (
              <button
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className="flex-1 py-3 rounded-xl text-center transition-all relative"
                style={{
                  background: isActive
                    ? plan.id === "vitalicio"
                      ? "linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.05))"
                      : plan.id === "vip"
                        ? "linear-gradient(135deg, rgba(250,204,21,0.15), rgba(250,204,21,0.05))"
                        : "rgba(255,255,255,0.05)"
                    : "transparent",
                  border: isActive ? `1.5px solid ${plan.color}` : "1.5px solid transparent",
                }}
              >
                {plan.id === "vitalicio" && (
                  <span
                    className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[8px] font-bold px-2 py-0.5 rounded-full text-white whitespace-nowrap"
                    style={{ background: "#16A34A", letterSpacing: "0.5px" }}
                  >
                    POPULAR
                  </span>
                )}
                <p className="text-[13px] font-bold" style={{ color: isActive ? plan.color : "#475569" }}>
                  {plan.label}
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: isActive ? "#94A3B8" : "#334155" }}>
                  {plan.duration}
                </p>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* ── Selected plan detail ── */}
      <motion.div
        key={selectedPlan}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
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
              background: activePlan.id === "vitalicio"
                ? "linear-gradient(135deg, rgba(34,197,94,0.1), rgba(34,197,94,0.03))"
                : activePlan.id === "vip"
                  ? "linear-gradient(135deg, rgba(250,204,21,0.1), rgba(250,204,21,0.03))"
                  : "rgba(255,255,255,0.02)",
            }}
          >
            <div>
              <div className="flex items-center gap-2">
                {activePlan.id === "extensao" && <Clock className="w-5 h-5" style={{ color: activePlan.color }} />}
                {activePlan.id === "vitalicio" && <ShieldCheck className="w-5 h-5" style={{ color: activePlan.color }} />}
                {activePlan.id === "vip" && <Crown className="w-5 h-5" style={{ color: activePlan.color }} />}
                <h3 className="text-[17px] font-bold" style={{ color: "#F8FAFC" }}>
                  {activePlan.id === "extensao" && "Extensão 12 Meses"}
                  {activePlan.id === "vitalicio" && "Acesso Vitalício"}
                  {activePlan.id === "vip" && "Vitalício VIP"}
                </h3>
              </div>
              <p className="text-[12px] mt-0.5" style={{ color: "#94A3B8" }}>{activePlan.totalAccess}</p>
            </div>
            <div className="text-right">
              <span className="text-[26px] font-extrabold" style={{ color: "#F8FAFC" }}>R$ {activePlan.price}</span>
              <p className="text-[10px]" style={{ color: "#64748B" }}>{activePlan.installments}</p>
            </div>
          </div>

          {/* Features */}
          <div className="px-5 py-4" style={{ background: "#0F172A" }}>
            <div className="flex flex-col gap-2.5">
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
                    <XCircle className="w-3 h-3" style={{ color: "#475569" }} />
                  </div>
                  <span className="text-[13px] line-through" style={{ color: "#475569" }}>{f}</span>
                </div>
              ))}
            </div>

            {activePlan.warning && (
              <div className="mt-4 flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.12)" }}>
                <ShieldAlert className="w-4 h-4 shrink-0" style={{ color: "#F87171" }} />
                <span className="text-[12px] font-medium" style={{ color: "#F87171" }}>{activePlan.warning}</span>
              </div>
            )}

            {/* CTA */}
            <button
              onClick={handleBuy}
              disabled={loading}
              className="w-full mt-5 py-[16px] rounded-xl font-bold text-[15px] transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
              style={{
                background: activePlan.id === "extensao"
                  ? "transparent"
                  : activePlan.id === "vitalicio"
                    ? "linear-gradient(135deg, #16A34A, #15803D)"
                    : "linear-gradient(135deg, #FACC15, #EAB308)",
                color: activePlan.id === "extensao" ? "#94A3B8" : activePlan.id === "vip" ? "#020617" : "#fff",
                border: activePlan.id === "extensao" ? "1.5px solid rgba(148,163,184,0.3)" : "none",
                boxShadow: activePlan.id !== "extensao" ? `0 0 20px ${activePlan.color}25, 0 4px 12px rgba(0,0,0,0.3)` : "none",
              }}
            >
              {loading ? "Processando..." : (
                <>
                  {activePlan.id === "extensao" && "ATIVAR EXTENSÃO"}
                  {activePlan.id === "vitalicio" && "BLINDAR MEU ACESSO PARA SEMPRE"}
                  {activePlan.id === "vip" && "ATIVAR VIP COMPLETO"}
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>

            {activePlan.id !== "extensao" && (
              <p className="text-[11px] text-center mt-2.5" style={{ color: "#64748B" }}>
                Pagamento único · Sem mensalidade · Sem surpresa
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── Quick comparison strip ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mt-6 mx-1 rounded-2xl p-4"
        style={{ background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.04)" }}
      >
        <p className="text-[11px] uppercase tracking-widest font-bold mb-3" style={{ color: "#64748B" }}>
          Comparação rápida
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]" style={{ color: "#94A3B8" }}>
            <thead>
              <tr>
                <th className="text-left py-1.5 pr-2 font-medium" style={{ color: "#475569" }}></th>
                <th className="text-center py-1.5 px-2 font-semibold" style={{ color: "#64748B" }}>Extensão</th>
                <th className="text-center py-1.5 px-2 font-bold" style={{ color: "#22C55E" }}>Vitalício</th>
                <th className="text-center py-1.5 px-2 font-semibold" style={{ color: "#FACC15" }}>VIP</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: "Duração", vals: ["18 meses", "∞", "∞"] },
                { label: "Atualizações", vals: ["—", "✓", "✓"] },
                { label: "Suporte WhatsApp", vals: ["—", "—", "✓"] },
                { label: "Novos recursos", vals: ["—", "—", "✓"] },
              ].map((row) => (
                <tr key={row.label} style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                  <td className="py-2 pr-2 font-medium" style={{ color: "#CBD5E1" }}>{row.label}</td>
                  {row.vals.map((v, i) => (
                    <td key={i} className="text-center py-2 px-2">
                      {v === "✓" ? (
                        <Check className="w-4 h-4 mx-auto" style={{ color: i === 1 ? "#22C55E" : "#FACC15" }} />
                      ) : v === "—" ? (
                        <span style={{ color: "#334155" }}>—</span>
                      ) : v === "∞" ? (
                        <span className="font-bold" style={{ color: i === 1 ? "#22C55E" : "#FACC15" }}>∞</span>
                      ) : (
                        <span>{v}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* ── Social proof ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-5 mx-1"
      >
        {[
          { img: avatarAntonio, name: "Antônio, 57", text: "Ativei o vitalício na hora. Não faz sentido investir tanto tempo e perder tudo em 6 meses." },
          { img: avatarClaudia, name: "Cláudia, 49", text: "Ia pegar só a extensão, mas pensei: vou ter que passar por isso de novo? Peguei o vitalício." },
        ].map((t, i) => (
          <div
            key={t.name}
            className="flex items-start gap-3 py-3"
            style={{ borderBottom: i === 0 ? "1px solid rgba(255,255,255,0.04)" : "none" }}
          >
            <img src={t.img} alt={t.name} className="w-9 h-9 rounded-full object-cover shrink-0" style={{ border: "2px solid rgba(34,197,94,0.2)" }} />
            <div>
              <p className="text-[12px] font-semibold" style={{ color: "#E2E8F0" }}>{t.name}</p>
              <p className="text-[11px] italic leading-relaxed mt-0.5" style={{ color: "#94A3B8" }}>"{t.text}"</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* ── Security badges ── */}
      <div className="flex items-center justify-center gap-4 mt-4">
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
        className="text-[12px] underline cursor-pointer bg-transparent border-none mx-auto py-3 mt-1"
        style={{ color: "#475569" }}
      >
        Não, prefiro arriscar perder meu acesso em 6 meses.
      </button>
    </div>
  );
};

export default UpsellBlindagem;
