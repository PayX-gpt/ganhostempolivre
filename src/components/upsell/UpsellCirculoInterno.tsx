import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Users, MessageCircle, Headphones, Sparkles } from "lucide-react";
import { saveUpsellExtras } from "@/lib/upsellData";
import { buildTrackingQueryString } from "@/lib/trackingDataLayer";
import { saveFunnelEvent } from "@/lib/metricsClient";
import { logAuditEvent } from "@/hooks/useAuditLog";
import { useLanguage } from "@/lib/i18n";

interface Props {
  name: string;
  onNext: () => void;
  onDecline: () => void;
}

const BENEFIT_ICONS = [MessageCircle, Headphones, Sparkles, Users];

const TEXTS = {
  pt: {
    kicker: "Um convite especial pra você",
    title: "Tudo pronto! Só falta uma coisa...",
    lead: "Isso aqui não é uma venda. É um convite pessoal do Ricardo. E ele não faz isso pra todo mundo.",
    cardTitle: "Você está sendo convidado para o Círculo Interno.",
    bodyA: "O Ricardo escolhe pessoalmente quem entra no grupo de WhatsApp dele. É um grupo pequeno, com poucas pessoas, onde ele compartilha o que está funcionando e responde dúvidas de verdade. São os alunos desse grupo que conseguem os melhores resultados. ",
    bodyBold: "Hoje só tem 3 vagas.",
    benefits: [
      "Grupo no WhatsApp com o Ricardo e os alunos que mais ganham. Você tira dúvidas direto com ele.",
      "Toda semana, o Ricardo manda áudios explicando o que está acontecendo no mercado, de um jeito fácil de entender.",
      "Você recebe ferramentas novas antes de todo mundo.",
      "Conhece outras pessoas que também estão ganhando dinheiro com o sistema. Troca de experiências.",
    ],
    priceNote: "Só $5,90 por mês (você cancela quando quiser, sem burocracia)",
    price: "R$ 29,90", perMonth: "/mês",
    processing: "Processando...", cta: "QUERO ENTRAR NO GRUPO DO RICARDO",
    scarcityBold: "Importante:", scarcity: " O grupo é pequeno de propósito, pra todo mundo receber atenção. Quando as vagas acabam, não abrimos mais.",
    decline: "Não, obrigado. Prefiro seguir sem o grupo por enquanto.",
  },
  en: {
    kicker: "A special invitation for you",
    title: "All set! Just one more thing...",
    lead: "This isn't a sale. It's a personal invitation from Ricardo. And he doesn't do this for everyone.",
    cardTitle: "You're being invited to the Inner Circle.",
    bodyA: "Ricardo personally chooses who gets into his WhatsApp group. It's a small group, few people, where he shares what's working and actually answers questions. It's the members of this group who get the best results. ",
    bodyBold: "Today there are only 3 spots.",
    benefits: [
      "A WhatsApp group with Ricardo and the top-earning members. You ask him questions directly.",
      "Every week, Ricardo sends audio messages explaining what's happening in the market, in a way that's easy to understand.",
      "You get new tools before everyone else.",
      "You meet other people also making money with the system. You swap experiences.",
    ],
    priceNote: "Just $5.90/month (cancel anytime, no hassle)",
    price: "$5.90", perMonth: "/month",
    processing: "Processing...", cta: "I WANT IN RICARDO'S GROUP",
    scarcityBold: "Important:", scarcity: " The group is small on purpose, so everyone gets attention. When the spots are gone, we don't open more.",
    decline: "No thanks. I'll keep going without the group for now.",
  },
  es: {
    kicker: "Una invitación especial para ti",
    title: "¡Todo listo! Solo falta una cosa...",
    lead: "Esto no es una venta. Es una invitación personal de Ricardo. Y no lo hace con todo el mundo.",
    cardTitle: "Estás siendo invitado al Círculo Interno.",
    bodyA: "Ricardo elige personalmente quién entra a su grupo de WhatsApp. Es un grupo pequeño, con pocas personas, donde comparte lo que está funcionando y responde dudas de verdad. Son los miembros de ese grupo los que consiguen los mejores resultados. ",
    bodyBold: "Hoy solo quedan 3 cupos.",
    benefits: [
      "Un grupo de WhatsApp con Ricardo y los miembros que más ganan. Le preguntas directo a él.",
      "Cada semana, Ricardo manda audios explicando lo que pasa en el mercado, de una forma fácil de entender.",
      "Recibes herramientas nuevas antes que todos.",
      "Conoces a otras personas que también están ganando dinero con el sistema. Intercambian experiencias.",
    ],
    priceNote: "Solo $5,90/mes (cancelas cuando quieras, sin trámites)",
    price: "$5,90", perMonth: "/mes",
    processing: "Procesando...", cta: "QUIERO ENTRAR AL GRUPO DE RICARDO",
    scarcityBold: "Importante:", scarcity: " El grupo es pequeño a propósito, para que todos reciban atención. Cuando se acaban los cupos, no abrimos más.",
    decline: "No, gracias. Prefiero seguir sin el grupo por ahora.",
  },
};

const UpsellCirculoInterno = ({ name, onNext, onDecline }: Props) => {
  const { lang } = useLanguage();
  const t = TEXTS[lang];
  const firstName = name !== "Visitante" ? name : "";
  const [loading, setLoading] = useState(false);

  // Kirvano variables handled by KirvanoOneClick component

  const CHECKOUT_URL = "https://pay.hub.la/eV4MZXM5DC9l1r97Fuk7/upsell";

  const handleBuy = () => {
    setLoading(true);
    saveUpsellExtras("circulo", { price: 29.9 });
    saveFunnelEvent("upsell_buy_click", { page: "/upsell4", product: "circulo", price: 29.9 });
    logAuditEvent({ eventType: "upsell_buy_click", pageId: "/upsell4", metadata: { product: "circulo", price: 29.9 } });
    const utmQs = buildTrackingQueryString();
    const separator = CHECKOUT_URL.includes("?") ? "&" : "?";
    const fullUrl = utmQs ? `${CHECKOUT_URL}${separator}${utmQs.slice(1)}` : CHECKOUT_URL;
    window.open(fullUrl, "_blank");
    setTimeout(() => setLoading(false), 3000);
  };

  return (
    <div className="flex flex-col gap-5 pt-4">
      {/* Header */}
      <div className="text-center">
        <p
          className="text-[11px] uppercase tracking-widest font-semibold mb-2"
          style={{ color: "#D4A017" }}
        >
          {t.kicker}
        </p>
        <h1
          className="text-[22px] font-extrabold leading-tight"
          style={{ color: "#F8FAFC" }}
        >
          {t.title}
        </h1>
        <p
          className="text-[14px] mt-3 leading-relaxed"
          style={{ color: "#94A3B8" }}
        >
          {t.lead}
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
            {t.cardTitle}
          </h3>
        </div>

        <div className="p-5" style={{ background: "#0F172A" }}>
          <p
            className="text-[13px] leading-relaxed mb-4"
            style={{ color: "#94A3B8" }}
          >
            {t.bodyA}
            <strong style={{ color: "#EF4444" }}>{t.bodyBold}</strong>
          </p>

          <ul className="flex flex-col gap-3">
            {t.benefits.map((text, bi) => {
              const Icon = BENEFIT_ICONS[bi] || Check;
              return (
                <li key={text} className="flex items-start gap-2.5">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: "rgba(212,160,23,0.15)" }}
                  >
                    <Check className="w-3 h-3" style={{ color: "#FACC15" }} />
                  </div>
                  <span className="text-[13px]" style={{ color: "#E2E8F0" }}>
                    {text}
                  </span>
                </li>
              );
            })}
          </ul>

          <div
            className="mt-5 pt-4"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            <p className="text-[12px]" style={{ color: "#64748B" }}>
              {t.priceNote}
            </p>
            <div className="flex items-baseline gap-1 mt-1">
              <span
                className="text-[32px] font-extrabold"
                style={{ color: "#F8FAFC" }}
              >
                {t.price}
              </span>
              <span className="text-[14px]" style={{ color: "#64748B" }}>
                {t.perMonth}
              </span>
            </div>
          </div>

          <button
            onClick={handleBuy}
            disabled={loading}
            className="w-full mt-4 py-[16px] rounded-xl text-[15px] font-bold transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-70"
            style={{
              background: "linear-gradient(135deg, #FACC15, #D4A017)",
              color: "#020617",
              boxShadow:
                "0 0 20px rgba(212,160,23,0.25), 0 4px 12px rgba(0,0,0,0.3)",
            }}
          >
            {loading ? t.processing : t.cta}
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
          <strong style={{ color: "#EF4444" }}>{t.scarcityBold}</strong>{t.scarcity}
        </p>
      </div>

      <button
        onClick={() => { saveFunnelEvent("upsell_oneclick_decline", { page: "/upsell4" }); logAuditEvent({ eventType: "upsell_oneclick_decline", pageId: "/upsell4" }); onDecline(); }}
        className="text-[12px] underline cursor-pointer bg-transparent border-none mx-auto py-2 pb-6"
        style={{ color: "#475569" }}
      >
        {t.decline}
      </button>
    </div>
  );
};

export default UpsellCirculoInterno;
