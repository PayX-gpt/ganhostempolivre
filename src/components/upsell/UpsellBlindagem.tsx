import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Check, Lock, RefreshCw, AlertTriangle, CheckCircle2, XCircle, Crown } from "lucide-react";
import { saveUpsellExtras } from "@/lib/upsellData";
import { saveFunnelEvent } from "@/lib/metricsClient";
import { logAuditEvent } from "@/hooks/useAuditLog";
import { buildTrackingQueryString } from "@/lib/trackingDataLayer";

interface Props {
  name: string;
  onNext: () => void;
  onDecline: () => void;
}

const UpsellBlindagem = ({ name, onNext, onDecline }: Props) => {
  const firstName = name !== "Visitante" ? name : "";
  const [loading, setLoading] = useState(false);

  const handleBuy = () => {
    setLoading(true);
    saveUpsellExtras("blindagem", { price: 197 });
    saveFunnelEvent("upsell_oneclick_buy", { page: "/upsell3", product: "blindagem", price: 197 });
    logAuditEvent({ eventType: "upsell_oneclick_buy", pageId: "/upsell3", metadata: { product: "blindagem", price: 197 } });
    const checkoutUrl = "https://pay.kirvano.com/a7cfdcbf-849f-4060-b660-b850f46a0e52";
    const utmQs = buildTrackingQueryString();
    const separator = checkoutUrl.includes("?") ? "&" : "?";
    const fullUrl = utmQs ? `${checkoutUrl}${separator}${utmQs.slice(1)}` : checkoutUrl;
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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <p className="text-[15px] font-bold mb-1" style={{ color: "#F59E0B" }}>
          Mas tem algo importante que você precisa saber...
        </p>
        <h1 className="text-[22px] font-extrabold leading-tight" style={{ color: "#F8FAFC" }}>
          Seu acesso expira em exatamente 6 meses.
        </h1>
      </motion.div>

      {/* Why card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl p-5"
        style={{
          background: "rgba(15,23,42,0.9)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <p className="text-[15px] font-bold mb-3" style={{ color: "#F59E0B" }}>
          Por quê?
        </p>
        <p className="text-[13px] leading-relaxed" style={{ color: "#94A3B8" }}>
          A Plataforma de Ganhos com Tempo Livre opera através de parcerias estratégicas com instituições financeiras e provedores de dados de mercado.
        </p>
        <p className="text-[13px] leading-relaxed mt-3" style={{ color: "#94A3B8" }}>
          Esses acordos são renovados a cada seis meses e, por razões contratuais,{" "}
          <strong style={{ color: "#F8FAFC" }}>não podemos garantir o acesso além de 6 meses</strong>.
        </p>
      </motion.div>

      {/* What happens */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <p className="text-[15px] font-bold mb-3" style={{ color: "#F59E0B" }}>
          O que acontece em 6 meses?
        </p>
        <div className="flex flex-col gap-2.5">
          {[
            "Sua conta será desativada",
            "Você perde acesso ao sistema",
            "Seus ganhos param de crescer",
          ].map((item) => (
            <div key={item} className="flex items-center gap-2.5">
              <XCircle className="w-4 h-4 shrink-0" style={{ color: "#EF4444" }} />
              <span className="text-[13px]" style={{ color: "#CBD5E1" }}>{item}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Imagine card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="rounded-2xl p-5"
        style={{
          background: "rgba(15,23,42,0.9)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <p className="text-[15px] font-bold mb-3" style={{ color: "#F8FAFC" }}>
          Imagine isso:
        </p>
        <p className="text-[13px] leading-relaxed" style={{ color: "#94A3B8" }}>
          Você passou 6 meses construindo resultados consistentes...
        </p>
        <p className="text-[13px] leading-relaxed mt-2" style={{ color: "#94A3B8" }}>
          Seu sistema está operando perfeitamente...
        </p>
        <p className="text-[14px] font-bold mt-3" style={{ color: "#EF4444" }}>
          E de repente: acesso encerrado.
        </p>
      </motion.div>

      {/* Solution */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="text-center"
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
          style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}
        >
          <Crown className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-[20px] font-extrabold" style={{ color: "#F8FAFC" }}>
          A Solução
        </h2>
        <p className="text-[13px] leading-relaxed mt-3" style={{ color: "#94A3B8" }}>
          Ricardo Almeida negociou um acordo especial para permitir que{" "}
          <strong style={{ color: "#F8FAFC" }}>membros fundadores</strong> ativem o{" "}
          <strong style={{ color: "#3B82F6" }}>acesso vitalício</strong>.
        </p>
        <p className="text-[13px] leading-relaxed mt-2" style={{ color: "#94A3B8" }}>
          Com um único pagamento, você garante que seu sistema{" "}
          <strong style={{ color: "#F8FAFC" }}>nunca será desativado</strong>. Todas as atualizações, todas as melhorias — tudo chega na sua conta automaticamente, para sempre.
        </p>
      </motion.div>

      {/* Offer card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="rounded-2xl overflow-hidden"
        style={{ border: "2px solid rgba(59,130,246,0.3)" }}
      >
        <div
          className="p-4 flex items-center gap-3"
          style={{ background: "rgba(59,130,246,0.08)" }}
        >
          <ShieldCheck className="w-7 h-7" style={{ color: "#3B82F6" }} />
          <div>
            <h3 className="text-[18px] font-bold" style={{ color: "#F8FAFC" }}>
              Blindagem: Acesso Vitalício
            </h3>
            <p className="text-[12px]" style={{ color: "#60A5FA" }}>
              Pague uma vez só · Acesso para sempre
            </p>
          </div>
        </div>

        <div className="p-5" style={{ background: "#0F172A" }}>
          <ul className="flex flex-col gap-2.5">
            {[
              "Acesso vitalício à plataforma — nunca expira",
              "Todas as atualizações e melhorias automaticamente",
              "Proteção contra desativação de conta",
              "Novas estratégias de ganhos adicionadas na sua conta",
              "Pagamento único — sem mensalidade, sem surpresa",
            ].map((b) => (
              <li key={b} className="flex items-start gap-2.5">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: "rgba(59,130,246,0.15)" }}
                >
                  <Check className="w-3 h-3" style={{ color: "#3B82F6" }} />
                </div>
                <span className="text-[13px]" style={{ color: "#E2E8F0" }}>{b}</span>
              </li>
            ))}
          </ul>

          <div className="mt-5 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-[12px]" style={{ color: "#64748B" }}>
              Pagamento único — você paga uma vez e nunca mais
            </p>
            <span className="text-[32px] font-extrabold" style={{ color: "#F8FAFC" }}>
              R$ 197
            </span>
          </div>

          <button
            onClick={handleBuy}
            disabled={loading}
            className="w-full mt-4 py-[16px] rounded-xl text-[15px] font-bold text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-70"
            style={{
              background: "linear-gradient(135deg, #3B82F6, #2563EB)",
              boxShadow: "0 0 20px rgba(59,130,246,0.25), 0 4px 12px rgba(0,0,0,0.3)",
            }}
          >
            {loading ? "Processando..." : "ATIVAR ACESSO VITALÍCIO AGORA"}
          </button>

          <p className="text-[11px] text-center mt-3" style={{ color: "#64748B" }}>
            Disponível apenas AGORA, nesta página.
          </p>
        </div>
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
