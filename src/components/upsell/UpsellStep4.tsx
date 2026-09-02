import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Zap, ShieldCheck } from "lucide-react";
import { getUpsellChoice } from "@/lib/upsellData";
import { useLanguage, type Language } from "@/lib/i18n";

// Preço real (BRL) -> exibição. PT mantém R$; EN/ES convertem pra US$ (marketing).
const USD_MAP: Record<number, string> = { 37: "$7", 67: "$13", 97: "$19", 197: "$39", 297: "$59", 347: "$69" };
function money(brl: number, lang: Language): string {
  if (lang === "pt") return `R$ ${brl}`;
  if (USD_MAP[brl]) return USD_MAP[brl];
  return `$${Math.max(1, Math.round(brl / 5.3))}`;
}

const TEXTS = {
  pt: {
    title: (n: string) => (n ? `${n}, confirme sua ativação` : "Confirme sua ativação"),
    summary: "RESUMO", lAccel: "Acelerador", lFirst: "Primeiro resultado em", lProtection: "Proteção",
    names: { basico: "Básico", duplo: "Duplo", maximo: "Máximo" },
    times: { basico: "72 horas", duplo: "24 horas", maximo: "12 horas" },
    protection: { basico: "Básica", duplo: "Dupla", maximo: "Tripla" },
    installments: { basico: "2x de R$ 9,90", duplo: "3x de R$ 9,90", maximo: "4x de R$ 9,90" },
    fee: "Taxa única de ativação", orWord: "ou",
    sameCard: "Cobrado no mesmo cartão da compra anterior. Você não precisa digitar nada.",
    urgencyA: "Oferta exclusiva para novos membros. Disponível ", urgencyBold: "apenas nesta página", urgencyB: ". Preço normal: ",
    processing: "Processando ativação...", cta: "ATIVAR MEU ACELERADOR AGORA", changed: "Mudei de ideia",
    safe: "100% seguro", guarantee: "Garantia 30 dias",
  },
  en: {
    title: (n: string) => (n ? `${n}, confirm your activation` : "Confirm your activation"),
    summary: "SUMMARY", lAccel: "Accelerator", lFirst: "First result in", lProtection: "Protection",
    names: { basico: "Basic", duplo: "Double", maximo: "Maximum" },
    times: { basico: "72 hours", duplo: "24 hours", maximo: "12 hours" },
    protection: { basico: "Basic", duplo: "Double", maximo: "Triple" },
    installments: { basico: "2x $1.90", duplo: "3x $1.90", maximo: "4x $1.90" },
    fee: "One-time activation fee", orWord: "or",
    sameCard: "Charged to the same card as your previous purchase. You don't have to type anything.",
    urgencyA: "Exclusive offer for new members. Available ", urgencyBold: "on this page only", urgencyB: ". Regular price: ",
    processing: "Processing activation...", cta: "ACTIVATE MY ACCELERATOR NOW", changed: "I changed my mind",
    safe: "100% secure", guarantee: "30-day guarantee",
  },
  es: {
    title: (n: string) => (n ? `${n}, confirma tu activación` : "Confirma tu activación"),
    summary: "RESUMEN", lAccel: "Acelerador", lFirst: "Primer resultado en", lProtection: "Protección",
    names: { basico: "Básico", duplo: "Doble", maximo: "Máximo" },
    times: { basico: "72 horas", duplo: "24 horas", maximo: "12 horas" },
    protection: { basico: "Básica", duplo: "Doble", maximo: "Triple" },
    installments: { basico: "2x $1,90", duplo: "3x $1,90", maximo: "4x $1,90" },
    fee: "Tarifa única de activación", orWord: "o",
    sameCard: "Se cobra en la misma tarjeta de tu compra anterior. No tienes que escribir nada.",
    urgencyA: "Oferta exclusiva para nuevos miembros. Disponible ", urgencyBold: "solo en esta página", urgencyB: ". Precio normal: ",
    processing: "Procesando activación...", cta: "ACTIVAR MI ACELERADOR AHORA", changed: "Cambié de idea",
    safe: "100% seguro", guarantee: "Garantía 30 días",
  },
};

interface Props { name: string; onNext: () => void; onDecline: () => void; }

const UpsellStep4 = ({ name, onNext, onDecline }: Props) => {
  const { lang } = useLanguage();
  const t = TEXTS[lang];
  const choice = getUpsellChoice();
  const [loading, setLoading] = useState(false);
  const accel = (choice.accelerator || "duplo") as "basico" | "duplo" | "maximo";
  const firstName = name !== "Visitante" ? name : "";

  const handleActivate = () => {
    setLoading(true);
    setTimeout(onNext, 2500);
  };

  return (
    <div className="flex flex-col gap-5 pt-6">
      <h1 className="text-xl font-bold text-center" style={{ color: "#F8FAFC" }}>{t.title(firstName)}</h1>

      <div className="rounded-2xl p-5" style={{ background: "#0F172A", border: "1px solid rgba(255,255,255,0.06)" }}>
        <h3 className="text-[15px] font-bold mb-4" style={{ color: "#94A3B8" }}>{t.summary}</h3>

        {[
          [t.lAccel, t.names[accel]],
          [t.lFirst, t.times[accel]],
          [t.lProtection, t.protection[accel]],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            <span className="text-[14px]" style={{ color: "#94A3B8" }}>{label}</span>
            <span className="text-[14px] font-semibold" style={{ color: "#F8FAFC" }}>{value}</span>
          </div>
        ))}

        <div className="mt-5 text-center">
          <p className="text-[13px]" style={{ color: "#64748B" }}>{t.fee}</p>
          <p className="text-[32px] font-extrabold mt-1" style={{ color: "#F8FAFC" }}>
            {money(choice.price, lang)}
          </p>
          <p className="text-[12px] mt-1" style={{ color: "#64748B" }}>{t.orWord} {t.installments[accel]}</p>
        </div>

        <p className="text-[12px] text-center mt-3 leading-relaxed" style={{ color: "#64748B" }}>{t.sameCard}</p>
      </div>

      <div className="rounded-xl p-3.5 flex items-start gap-2.5" style={{ background: "rgba(250,204,21,0.06)", border: "1px solid rgba(250,204,21,0.2)" }}>
        <Zap className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#FACC15" }} />
        <p className="text-[12px] leading-relaxed" style={{ color: "#CBD5E1" }}>
          {t.urgencyA}<strong style={{ color: "#FACC15" }}>{t.urgencyBold}</strong>{t.urgencyB}{money(197, lang)}.
        </p>
      </div>

      <button
        onClick={handleActivate}
        disabled={loading}
        className="w-full py-[18px] rounded-xl text-[16px] font-bold text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-70"
        style={{ background: "linear-gradient(135deg, #16A34A, #15803D)", boxShadow: "0 0 20px rgba(22,163,74,0.25), 0 4px 12px rgba(0,0,0,0.3)" }}
      >
        {loading ? (
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{t.processing}</motion.span>
        ) : (
          t.cta
        )}
      </button>

      <button onClick={onDecline} className="text-[12px] underline cursor-pointer bg-transparent border-none mx-auto" style={{ color: "#475569" }}>
        {t.changed}
      </button>

      <div className="flex items-center justify-center gap-4 pb-4">
        <div className="flex items-center gap-1">
          <Lock className="w-3.5 h-3.5" style={{ color: "#475569" }} />
          <span className="text-[11px]" style={{ color: "#475569" }}>{t.safe}</span>
        </div>
        <div className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" style={{ color: "#475569" }} />
          <span className="text-[11px]" style={{ color: "#475569" }}>{t.guarantee}</span>
        </div>
      </div>
    </div>
  );
};

export default UpsellStep4;
