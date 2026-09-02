import { useState } from "react";
import { motion } from "framer-motion";
import { Check, BookOpen, ArrowRight } from "lucide-react";
import { saveUpsellChoice } from "@/lib/upsellData";
import { buildTrackingQueryString } from "@/lib/trackingDataLayer";
import { useLanguage } from "@/lib/i18n";

const TEXTS = {
  pt: {
    title: (n: string) => (n ? `${n}, espera...` : "Espera..."),
    sub: (n: string) => `Entendo que o acelerador talvez não faça sentido agora. Mas ${n ? `${n}, ` : ""}não quero que você fique perdido nos primeiros 7 dias.`,
    guideTitle: "Guia Primeiros Passos", guideSub: "7 dias · 1 tarefa por dia · 10 min cada",
    intro: "Um mapa dia a dia do que fazer em cada etapa. Cada dia tem uma única tarefa simples. Você nunca vai se sentir perdido.",
    days: [
      { day: "Dia 1", task: "Acessar e entender o painel" },
      { day: "Dia 2", task: "Ativar o robô pela primeira vez" },
      { day: "Dia 3", task: "Ler seus primeiros resultados" },
      { day: "Dia 4", task: "Ajustar a meta de ganho" },
      { day: "Dia 5", task: "Sacar seus primeiros lucros" },
      { day: "Dia 6", task: "Aumentar ganhos com segurança" },
      { day: "Dia 7", task: "Colocar no piloto automático" },
    ],
    was: "R$ 47", now: "R$ 9,90", once: "Pagamento único. Sem assinatura.",
    processing: "Processando...", cta: "QUERO O GUIA POR R$ 9,90", decline: "Não, prefiro descobrir sozinho.",
  },
  en: {
    title: (n: string) => (n ? `${n}, wait...` : "Wait..."),
    sub: (n: string) => `I get that the accelerator may not make sense right now. But ${n ? `${n}, ` : ""}I don't want you getting lost in your first 7 days.`,
    guideTitle: "First Steps Guide", guideSub: "7 days · 1 task per day · 10 min each",
    intro: "A day-by-day map of what to do at each step. Each day has a single, simple task. You'll never feel lost.",
    days: [
      { day: "Day 1", task: "Log in and get to know the dashboard" },
      { day: "Day 2", task: "Turn the bot on for the first time" },
      { day: "Day 3", task: "Read your first results" },
      { day: "Day 4", task: "Adjust your earnings goal" },
      { day: "Day 5", task: "Withdraw your first profits" },
      { day: "Day 6", task: "Scale earnings safely" },
      { day: "Day 7", task: "Set it on autopilot" },
    ],
    was: "$9", now: "$1.90", once: "One-time payment. No subscription.",
    processing: "Processing...", cta: "I WANT THE GUIDE FOR $1.90", decline: "No, I'd rather figure it out myself.",
  },
  es: {
    title: (n: string) => (n ? `${n}, espera...` : "Espera..."),
    sub: (n: string) => `Entiendo que el acelerador quizás no tenga sentido ahora. Pero ${n ? `${n}, ` : ""}no quiero que te pierdas en tus primeros 7 días.`,
    guideTitle: "Guía Primeros Pasos", guideSub: "7 días · 1 tarea por día · 10 min cada una",
    intro: "Un mapa día a día de qué hacer en cada etapa. Cada día tiene una única tarea simple. Nunca te vas a sentir perdido.",
    days: [
      { day: "Día 1", task: "Entrar y entender el panel" },
      { day: "Día 2", task: "Activar el robot por primera vez" },
      { day: "Día 3", task: "Leer tus primeros resultados" },
      { day: "Día 4", task: "Ajustar la meta de ganancia" },
      { day: "Día 5", task: "Retirar tus primeras ganancias" },
      { day: "Día 6", task: "Aumentar ganancias con seguridad" },
      { day: "Día 7", task: "Ponerlo en piloto automático" },
    ],
    was: "$9", now: "$1.90", once: "Pago único. Sin suscripción.",
    processing: "Procesando...", cta: "QUIERO LA GUÍA POR $1.90", decline: "No, prefiero descubrirlo solo.",
  },
};

interface Props { name: string; onBuy: () => void; onDecline: () => void; }

const UpsellStep5 = ({ name, onBuy, onDecline }: Props) => {
  const { lang } = useLanguage();
  const t = TEXTS[lang];
  const firstName = name !== "Visitante" ? name : "";
  const [loading, setLoading] = useState(false);

  const handleBuy = () => {
    setLoading(true);
    saveUpsellChoice({ accelerator: null, guide: true, price: 9.9 });
    const checkoutUrl = "https://pay.kirvano.com/06c6007a-0cd9-48f2-8f95-1b933e05509a";
    const utmQs = buildTrackingQueryString();
    const separator = checkoutUrl.includes("?") ? "&" : "?";
    const fullUrl = utmQs ? `${checkoutUrl}${separator}${utmQs.slice(1)}` : checkoutUrl;
    window.open(fullUrl, "_blank");
    setTimeout(() => setLoading(false), 3000);
  };

  return (
    <div className="flex flex-col gap-5 pt-6">
      <div className="text-center">
        <h1 className="text-[22px] font-extrabold" style={{ color: "#F8FAFC" }}>{t.title(firstName)}</h1>
        <p className="text-[14px] mt-2 leading-relaxed" style={{ color: "#94A3B8" }}>{t.sub(firstName)}</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(250,204,21,0.25)" }}
      >
        <div className="p-4 flex items-center gap-3" style={{ background: "rgba(250,204,21,0.08)" }}>
          <BookOpen className="w-6 h-6" style={{ color: "#FACC15" }} />
          <div>
            <h3 className="text-[17px] font-bold" style={{ color: "#F8FAFC" }}>{t.guideTitle}</h3>
            <p className="text-[12px]" style={{ color: "#FACC15" }}>{t.guideSub}</p>
          </div>
        </div>

        <div className="p-4" style={{ background: "#0F172A" }}>
          <p className="text-[13px] leading-relaxed mb-4" style={{ color: "#94A3B8" }}>{t.intro}</p>

          <div className="flex flex-col gap-2">
            {t.days.map((d) => (
              <div key={d.day} className="flex items-center gap-2.5 py-1.5">
                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(22,163,74,0.15)" }}>
                  <Check className="w-3 h-3" style={{ color: "#22C55E" }} />
                </div>
                <span className="text-[13px]" style={{ color: "#64748B" }}>{d.day}:</span>
                <span className="text-[13px]" style={{ color: "#E2E8F0" }}>{d.task}</span>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-baseline gap-3">
              <span className="text-[14px] line-through" style={{ color: "#475569" }}>{t.was}</span>
              <span className="text-[28px] font-extrabold" style={{ color: "#F8FAFC" }}>{t.now}</span>
            </div>
            <p className="text-[12px] mt-1" style={{ color: "#64748B" }}>{t.once}</p>
          </div>

          <button
            onClick={handleBuy}
            disabled={loading}
            className="w-full mt-4 py-[16px] rounded-xl text-[15px] font-bold text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, #16A34A, #15803D)" }}
          >
            {loading ? t.processing : <>{t.cta} <ArrowRight className="w-4 h-4" /></>}
          </button>
        </div>
      </motion.div>

      <button
        onClick={() => { saveUpsellChoice({ accelerator: null, guide: false, price: 0 }); onDecline(); }}
        className="text-[12px] underline cursor-pointer bg-transparent border-none mx-auto py-2"
        style={{ color: "#475569" }}
      >
        {t.decline}
      </button>
    </div>
  );
};

export default UpsellStep5;
