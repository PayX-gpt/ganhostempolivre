import { useState } from "react";
import { StepContainer, StepTitle, StepSubtitle, CTAButton, TrustBadge } from "./QuizUI";
import { useLanguage, type Language } from "@/lib/i18n";

interface StepNameProps {
  onNext: (name: string) => void;
}

const texts = {
  pt: {
    title: "Antes de continuar, como podemos te chamar?",
    subtitle: "Queremos personalizar sua experiência para que tudo faça sentido pra você.",
    label: "Seu primeiro nome",
    placeholder: "Ex: Carlos",
    trust: "Seus dados estão protegidos e jamais serão compartilhados.",
    cta: "CONTINUAR",
  },
  en: {
    title: "Before we continue, what should we call you?",
    subtitle: "We want to personalize your experience so everything makes sense for you.",
    label: "Your first name",
    placeholder: "E.g.: John",
    trust: "Your data is protected and will never be shared.",
    cta: "CONTINUE",
  },
  es: {
    title: "Antes de continuar, ¿cómo podemos llamarte?",
    subtitle: "Queremos personalizar tu experiencia para que todo tenga sentido para vos.",
    label: "Tu primer nombre",
    placeholder: "Ej: Carlos",
    trust: "Tus datos están protegidos y jamás serán compartidos.",
    cta: "CONTINUAR",
  },
} as const;

const StepName = ({ onNext }: StepNameProps) => {
  const { lang } = useLanguage();
  const t = texts[lang];
  const [name, setName] = useState("");
  const isValid = name.trim().length > 1;

  return (
    <StepContainer>
      <StepTitle>{t.title}</StepTitle>
      <StepSubtitle>{t.subtitle}</StepSubtitle>

      <div className="w-full mt-1">
        <label className="text-[13px] text-muted-foreground font-medium mb-1.5 block">{t.label}</label>
        <input
          type="text"
          placeholder={t.placeholder}
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={50}
          className="w-full px-4 py-3.5 rounded-2xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground/60 text-base focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          onKeyDown={(e) => { if (e.key === "Enter" && isValid) onNext(name.trim()); }}
        />
      </div>

      <TrustBadge>{t.trust}</TrustBadge>
      <CTAButton onClick={() => onNext(name.trim())} disabled={!isValid}>{t.cta}</CTAButton>
    </StepContainer>
  );
};

export default StepName;
