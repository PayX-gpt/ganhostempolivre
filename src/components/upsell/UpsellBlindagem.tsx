import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Check, Lock, Infinity, RefreshCw } from "lucide-react";
import { saveUpsellExtras } from "@/lib/upsellData";
import { buildTrackingQueryString } from "@/lib/trackingDataLayer";

interface Props {
  name: string;
  onNext: () => void;
  onDecline: () => void;
}

const benefits = [
  "Todas as futuras atualizações da IA incluídas",
  "Novos robôs e estratégias automaticamente liberados",
  "Proteções de segurança sempre na versão mais recente",
  "Sem mensalidades. Pagamento único, acesso vitalício",
  "Relatórios de performance atualizados com as últimas métricas",
];

const UpsellBlindagem = ({ name, onNext, onDecline }: Props) => {
  const firstName = name !== "Visitante" ? name : "";
  const [loading, setLoading] = useState(false);

  const checkoutUrl = "https://pay.kirvano.com/BLINDAGEM_PLACEHOLDER";

  const handleBuy = () => {
    setLoading(true);
    saveUpsellExtras("blindagem", { price: 197 });
    const utmQs = buildTrackingQueryString();
    const separator = checkoutUrl.includes("?") ? "&" : "?";
    const fullUrl = utmQs
      ? `${checkoutUrl}${separator}${utmQs.slice(1)}`
      : checkoutUrl;
    window.open(fullUrl, "_blank");
    setTimeout(onNext, 1500);
  };

  return (
    <div className="flex flex-col gap-5 pt-4">
      {/* Header */}
      <div className="text-center">
        <p
          className="text-[11px] uppercase tracking-widest font-semibold mb-2"
          style={{ color: "#3B82F6" }}
        >
          Ativando Protocolo de Blindagem e Atualização Futura
        </p>
        <h1
          className="text-[22px] font-extrabold leading-tight"
          style={{ color: "#F8FAFC" }}
        >
          Sua conta está calibrada para lucros máximos. Agora, vamos proteger
          seus ganhos para o futuro.
        </h1>
      </div>

      {/* VSL placeholder */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl p-5"
        style={{
          background: "rgba(15,23,42,0.8)",
          border: "1px solid rgba(59,130,246,0.2)",
        }}
      >
        <p
          className="text-[14px] leading-relaxed"
          style={{ color: "#CBD5E1" }}
        >
          {firstName ? `"${firstName}, ` : '"'}agora que sua máquina está pronta
          para gerar dinheiro, temos que falar sobre o futuro. O mercado é vivo.
          Ele muda. Uma estratégia que funciona hoje pode não funcionar em 6
          meses. E é aí que 90% das pessoas quebram: elas param de se atualizar
          e a fonte de renda seca.
        </p>
        <p
          className="text-[14px] leading-relaxed mt-3"
          style={{ color: "#CBD5E1" }}
        >
          Pense nisso como a{" "}
          <strong style={{ color: "#60A5FA" }}>vacina para o seu dinheiro</strong>.
          A Blindagem Anual garante que sua plataforma receba todas as futuras
          atualizações da nossa IA, para sempre. Novas estratégias, novos robôs,
          novas proteções... tudo, automaticamente."
        </p>
        <p
          className="text-[12px] italic mt-3 text-right"
          style={{ color: "#64748B" }}
        >
          — Ricardo Almeida
        </p>
      </motion.div>

      {/* Offer card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl overflow-hidden"
        style={{ border: "2px solid rgba(59,130,246,0.3)" }}
      >
        <div
          className="p-4 flex items-center gap-3"
          style={{ background: "rgba(59,130,246,0.08)" }}
        >
          <ShieldCheck className="w-7 h-7" style={{ color: "#3B82F6" }} />
          <div>
            <h3
              className="text-[18px] font-bold"
              style={{ color: "#F8FAFC" }}
            >
              Blindagem Anual de Estratégia
            </h3>
            <p className="text-[12px]" style={{ color: "#60A5FA" }}>
              Pagamento único · Acesso vitalício
            </p>
          </div>
        </div>

        <div className="p-5" style={{ background: "#0F172A" }}>
          <p
            className="text-[13px] leading-relaxed mb-4"
            style={{ color: "#94A3B8" }}
          >
            Com um pagamento único, você garante acesso vitalício a todas as
            futuras atualizações da nossa IA, robôs e estratégias de segurança.
            Proteja seus ganhos contra as mudanças do mercado e garanta sua
            tranquilidade a longo prazo.
          </p>

          <ul className="flex flex-col gap-2.5">
            {benefits.map((b) => (
              <li key={b} className="flex items-start gap-2.5">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: "rgba(59,130,246,0.15)" }}
                >
                  <Check className="w-3 h-3" style={{ color: "#3B82F6" }} />
                </div>
                <span className="text-[13px]" style={{ color: "#E2E8F0" }}>
                  {b}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-5 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-[12px]" style={{ color: "#64748B" }}>
              Taxa Única de Acesso Vitalício
            </p>
            <span
              className="text-[32px] font-extrabold"
              style={{ color: "#F8FAFC" }}
            >
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
            {loading
              ? "Processando..."
              : "ATIVAR BLINDAGEM ANUAL E PROTEGER MEUS GANHOS"}
          </button>
        </div>
      </motion.div>

      {/* Security badges */}
      <div className="flex items-center justify-center gap-4">
        <div className="flex items-center gap-1">
          <Lock className="w-3.5 h-3.5" style={{ color: "#475569" }} />
          <span className="text-[11px]" style={{ color: "#475569" }}>
            100% seguro
          </span>
        </div>
        <div className="flex items-center gap-1">
          <RefreshCw className="w-3.5 h-3.5" style={{ color: "#475569" }} />
          <span className="text-[11px]" style={{ color: "#475569" }}>
            Garantia 30 dias
          </span>
        </div>
      </div>

      <button
        onClick={onDecline}
        className="text-[12px] underline cursor-pointer bg-transparent border-none mx-auto py-2"
        style={{ color: "#475569" }}
      >
        Não, obrigado. Entendo os riscos e prefiro não ativar a proteção futura.
      </button>
    </div>
  );
};

export default UpsellBlindagem;
