import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Users, MessageCircle, Headphones, Sparkles } from "lucide-react";
import { saveUpsellExtras } from "@/lib/upsellData";
import { saveFunnelEvent } from "@/lib/metricsClient";
import { logAuditEvent } from "@/hooks/useAuditLog";
import KirvanoOneClick from "./KirvanoOneClick";


interface Props {
  name: string;
  onNext: () => void;
  onDecline: () => void;
}

const benefits = [
  {
    icon: MessageCircle,
    text: "Grupo no WhatsApp com o Ricardo e os alunos que mais ganham. Você tira dúvidas direto com ele.",
  },
  {
    icon: Headphones,
    text: "Toda semana, o Ricardo manda áudios explicando o que está acontecendo no mercado, de um jeito fácil de entender.",
  },
  {
    icon: Sparkles,
    text: "Você recebe ferramentas novas antes de todo mundo.",
  },
  {
    icon: Users,
    text: "Conhece outras pessoas que também estão ganhando dinheiro com o sistema. Troca de experiências.",
  },
];

const UpsellCirculoInterno = ({ name, onNext, onDecline }: Props) => {
  const firstName = name !== "Visitante" ? name : "";
  const [loading, setLoading] = useState(false);

  // Kirvano variables handled by KirvanoOneClick component

  const handleBuy = () => {
    saveUpsellExtras("circulo", { price: 29.9 });
    saveFunnelEvent("upsell_oneclick_buy", { page: "/upsell4", product: "circulo", price: 29.9 });
    logAuditEvent({ eventType: "upsell_oneclick_buy", pageId: "/upsell4", metadata: { product: "circulo", price: 29.9 } });
  };

  return (
    <>
    <KirvanoOneClick
      offer="67e759ec-598c-43c6-890e-b993901712b7"
      nextPageURL="https://ganhostempolivre.lovable.app/upsell5"
      refusePageURL={null}
    />
    <div className="flex flex-col gap-5 pt-4">
      {/* Header */}
      <div className="text-center">
        <p
          className="text-[11px] uppercase tracking-widest font-semibold mb-2"
          style={{ color: "#D4A017" }}
        >
          Um convite especial pra você
        </p>
        <h1
          className="text-[22px] font-extrabold leading-tight"
          style={{ color: "#F8FAFC" }}
        >
          Tudo pronto! Só falta uma coisa...
        </h1>
        <p
          className="text-[14px] mt-3 leading-relaxed"
          style={{ color: "#94A3B8" }}
        >
          Isso aqui não é uma venda. É um convite pessoal do Ricardo. E ele não faz isso pra todo mundo.
        </p>
      </div>

      {/* Logo / Visual */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mx-auto w-28 h-28 rounded-full flex items-center justify-center"
        style={{
          background: "radial-gradient(circle, rgba(212,160,23,0.15) 0%, transparent 70%)",
          border: "2px solid rgba(212,160,23,0.4)",
          boxShadow: "0 0 40px rgba(212,160,23,0.1)",
        }}
      >
        <span
          className="text-[48px] font-black"
          style={{
            background: "linear-gradient(135deg, #FACC15, #D4A017)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          C
        </span>
      </motion.div>

      {/* Invite Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-2xl overflow-hidden"
        style={{ border: "2px solid rgba(212,160,23,0.3)" }}
      >
        <div
          className="p-4"
          style={{ background: "rgba(212,160,23,0.06)" }}
        >
          <h3
            className="text-[18px] font-bold"
            style={{ color: "#F8FAFC" }}
          >
            Você está sendo convidado para o Círculo Interno.
          </h3>
        </div>

        <div className="p-5" style={{ background: "#0F172A" }}>
          <p
            className="text-[13px] leading-relaxed mb-4"
            style={{ color: "#94A3B8" }}
          >
            O Ricardo escolhe pessoalmente quem entra no grupo de WhatsApp dele. É um grupo pequeno, com poucas pessoas, onde ele compartilha o que está funcionando e responde dúvidas de verdade. São os alunos desse grupo que conseguem os melhores resultados.{" "}
            <strong style={{ color: "#EF4444" }}>Hoje só tem 3 vagas.</strong>
          </p>

          <ul className="flex flex-col gap-3">
            {benefits.map((b) => (
              <li key={b.text} className="flex items-start gap-2.5">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: "rgba(212,160,23,0.15)" }}
                >
                  <Check className="w-3 h-3" style={{ color: "#FACC15" }} />
                </div>
                <span className="text-[13px]" style={{ color: "#E2E8F0" }}>
                  {b.text}
                </span>
              </li>
            ))}
          </ul>

          <div
            className="mt-5 pt-4"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            <p className="text-[12px]" style={{ color: "#64748B" }}>
              Só R$ 29,90 por mês (você cancela quando quiser, sem burocracia)
            </p>
            <div className="flex items-baseline gap-1 mt-1">
              <span
                className="text-[32px] font-extrabold"
                style={{ color: "#F8FAFC" }}
              >
                R$ 29,90
              </span>
              <span className="text-[14px]" style={{ color: "#64748B" }}>
                /mês
              </span>
            </div>
          </div>

          <button
            onClick={handleBuy}
            disabled={loading}
            className="kirvano-payment-trigger w-full mt-4 py-[16px] rounded-xl text-[15px] font-bold transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-70"
            style={{
              background: "linear-gradient(135deg, #FACC15, #D4A017)",
              color: "#020617",
              boxShadow:
                "0 0 20px rgba(212,160,23,0.25), 0 4px 12px rgba(0,0,0,0.3)",
            }}
          >
            {loading
              ? "Processando..."
              : "QUERO ENTRAR NO GRUPO DO RICARDO"}
          </button>
        </div>
      </motion.div>

      {/* Scarcity */}
      <div
        className="rounded-xl p-3.5 flex items-start gap-2.5"
        style={{
          background: "rgba(239,68,68,0.06)",
          border: "1px solid rgba(239,68,68,0.2)",
        }}
      >
        <Users className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#EF4444" }} />
        <p className="text-[12px] leading-relaxed" style={{ color: "#CBD5E1" }}>
          <strong style={{ color: "#EF4444" }}>Importante:</strong> O grupo é pequeno de propósito, pra todo mundo receber atenção. Quando as vagas acabam, não abrimos mais.
        </p>
      </div>

      <button
        onClick={() => { saveFunnelEvent("upsell_oneclick_decline", { page: "/upsell4" }); logAuditEvent({ eventType: "upsell_oneclick_decline", pageId: "/upsell4" }); onDecline(); }}
        className="text-[12px] underline cursor-pointer bg-transparent border-none mx-auto py-2 pb-6"
        style={{ color: "#475569" }}
      >
        Não, obrigado. Prefiro seguir sem o grupo por enquanto.
      </button>
    </div>
    </>
  );
};

export default UpsellCirculoInterno;
