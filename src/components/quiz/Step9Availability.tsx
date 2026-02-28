import { useState } from "react";
import { StepContainer, StepTitle, StepSubtitle, OptionCard } from "./QuizUI";
import { CheckCircle, XCircle } from "lucide-react";
import { useLanguage, type Language } from "@/lib/i18n";

interface Step9Props {
  onNext: (answer: string) => void;
  userName?: string;
  userAge?: string;
}

const texts = {
  pt: {
    title: (name: string) => `${name ? `${name}, se` : "Se"} a IA precisasse de `,
    titleHL: "APENAS 10 minutos",
    titleEnd: " seus por dia pra gerar R$100+, você teria esses 10 minutos?",
    subtitle: "Pode ser no transporte, na pausa do almoço, antes de dormir.",
    yes: "Sim, tenho 10 minutos",
    yesSub: "Consigo encaixar isso na minha rotina",
    no: "Agora não",
    noSub: "Minha rotina não permite neste momento",
  },
  en: {
    title: (name: string) => `${name ? `${name}, if` : "If"} the AI only needed `,
    titleHL: "JUST 10 minutes",
    titleEnd: " of your day to generate $100+, would you have those 10 minutes?",
    subtitle: "It can be during commute, lunch break, or before bed.",
    yes: "Yes, I have 10 minutes",
    yesSub: "I can fit that into my routine",
    no: "Not right now",
    noSub: "My schedule doesn't allow it at this time",
  },
  es: {
    title: (name: string) => `${name ? `${name}, si` : "Si"} la IA necesitara `,
    titleHL: "SOLO 10 minutos",
    titleEnd: " tuyos por día para generar $100+, ¿tendrías esos 10 minutos?",
    subtitle: "Puede ser en el transporte, en la pausa del almuerzo, antes de dormir.",
    yes: "Sí, tengo 10 minutos",
    yesSub: "Puedo encajarlo en mi rutina",
    no: "Ahora no",
    noSub: "Mi rutina no me lo permite en este momento",
  },
} as const;

const Step9Availability = ({ onNext, userName }: Step9Props) => {
  const { lang } = useLanguage();
  const t = texts[lang];
  const [selected, setSelected] = useState<string | null>(null);
  const firstName = userName?.split(" ")[0] || "";

  const handleSelect = (answer: string) => {
    setSelected(answer);
    setTimeout(() => onNext(answer), 400);
  };

  return (
    <StepContainer>
      <StepTitle>
        {t.title(firstName)}<span className="text-gradient-green">{t.titleHL}</span>{t.titleEnd}
      </StepTitle>
      <StepSubtitle>{t.subtitle}</StepSubtitle>

      <div className="w-full space-y-3 mt-2">
        <OptionCard label={t.yes} sublabel={t.yesSub} icon={<CheckCircle className="w-5 h-5" />} selected={selected === "sim"} onClick={() => handleSelect("sim")} />
        <OptionCard label={t.no} sublabel={t.noSub} icon={<XCircle className="w-5 h-5" />} selected={selected === "nao"} onClick={() => handleSelect("nao")} />
      </div>
    </StepContainer>
  );
};

export default Step9Availability;
