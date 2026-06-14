import { ShieldCheck } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

interface Props {
  className?: string;
  compact?: boolean;
}

/**
 * Small reusable trust badge used on Steps 13-16 to reduce anxiety
 * before the WhatsApp/email capture and the final pitch (Step 17).
 * Per project guarantee policy (mem://strategy/guarantee-policy): 30-day base.
 */
const GuaranteeBadge = ({ className = "", compact = false }: Props) => {
  const { lang } = useLanguage();
  const text =
    lang === "es"
      ? "Garantía 30 días — 100% de tu dinero de vuelta"
      : lang === "en"
      ? "30-day guarantee — 100% money back"
      : "Garantia 30 dias — 100% do seu dinheiro de volta";
  return (
    <div
      className={`w-full flex items-center justify-center gap-1.5 rounded-full border border-primary/25 bg-primary/5 ${
        compact ? "py-1 px-2.5" : "py-1.5 px-3"
      } ${className}`}
    >
      <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
      <span className="text-[11px] font-semibold text-foreground/85 leading-none">
        {text}
      </span>
    </div>
  );
};

export default GuaranteeBadge;
