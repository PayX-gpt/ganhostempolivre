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
  "Você recebe todas as melhorias do sistema automaticamente, sem precisar fazer nada",
  "Novas formas de ganhar dinheiro são adicionadas na sua conta assim que ficam prontas",
  "O sistema de proteção do seu dinheiro é sempre atualizado com o que há de mais seguro",
  "Você paga uma vez só. Não tem mensalidade, não tem surpresa",
  "Você recebe um resumo fácil de entender mostrando como está indo",
];

const UpsellBlindagem = ({ name, onNext, onDecline }: Props) => {
  const firstName = name !== "Visitante" ? name : "";
  const [loading, setLoading] = useState(false);

  const checkoutUrl = "https://pay.kirvano.com/a7cfdcbf-849f-4060-b660-b850f46a0e52";

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
          Proteja seus ganhos para o futuro
        </p>
        <h1
          className="text-[22px] font-extrabold leading-tight"
          style={{ color: "#F8FAFC" }}
        >
          Seu sistema está funcionando. Agora vamos garantir que ele continue funcionando pra sempre.
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
          {firstName ? `"${firstName}, ` : '"'}agora que tudo está funcionando, preciso te falar uma coisa importante. O mercado muda o tempo todo. O que funciona hoje pode parar de funcionar daqui uns meses. E aí muita gente perde o que conquistou, porque o sistema ficou desatualizado.
        </p>
        <p
          className="text-[14px] leading-relaxed mt-3"
          style={{ color: "#CBD5E1" }}
        >
          É como um carro:{" "}
          <strong style={{ color: "#60A5FA" }}>se você não faz a revisão, uma hora ele para</strong>.
          {" "}A Blindagem garante que seu sistema receba todas as melhorias automaticamente, pra sempre. Você não precisa se preocupar com nada. É pagar uma vez e ficar tranquilo."
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
              Blindagem: Proteção para o Futuro
            </h3>
            <p className="text-[12px]" style={{ color: "#60A5FA" }}>
              Pague uma vez só · Funciona pra sempre
            </p>
          </div>
        </div>

        <div className="p-5" style={{ background: "#0F172A" }}>
          <p
            className="text-[13px] leading-relaxed mb-4"
            style={{ color: "#94A3B8" }}
          >
            Com um pagamento único, você garante que o seu sistema vai continuar funcionando e melhorando, sem você precisar fazer nada. Todas as melhorias, todas as proteções novas — tudo chega na sua conta automaticamente. É a tranquilidade de saber que seus ganhos estão protegidos.
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
              Pagamento único — você paga uma vez e nunca mais
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
              : "QUERO PROTEGER MEUS GANHOS PRA SEMPRE"}
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
        Não, obrigado. Prefiro seguir sem a proteção por enquanto.
      </button>
    </div>
  );
};

export default UpsellBlindagem;
