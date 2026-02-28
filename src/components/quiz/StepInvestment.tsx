import { useState } from "react";
import { StepContainer, StepTitle, StepSubtitle, OptionCard } from "./QuizUI";
import { Sprout, TrendingUp, Gem, HelpCircle } from "lucide-react";
import { useLanguage, type Language } from "@/lib/i18n";

interface StepProps {
  onNext: (answer: string) => void;
}

const texts = {
  pt: {
    title: "Quanto você estaria disposto(a) a investir para mudar sua situação financeira?",
    subtitle: "Pense nisso como um investimento em você mesmo(a). Não é um gasto — é o primeiro passo para a sua segurança financeira.",
    opts: [
      { label: "Menos de R$100", sublabel: "Quero começar com pouco e ir aumentando" },
      { label: "Entre R$100 e R$500", sublabel: "Posso fazer um investimento moderado" },
      { label: "Mais de R$500", sublabel: "Estou pronto(a) para investir sério" },
      { label: "Depende dos resultados possíveis", sublabel: "Preciso entender melhor antes de decidir" },
    ],
  },
  en: {
    title: "How much would you be willing to invest to change your financial situation?",
    subtitle: "Think of it as an investment in yourself. It's not an expense — it's the first step toward your financial security.",
    opts: [
      { label: "Less than $100", sublabel: "I want to start small and grow" },
      { label: "$100 to $500", sublabel: "I can make a moderate investment" },
      { label: "More than $500", sublabel: "I'm ready to invest seriously" },
      { label: "Depends on possible results", sublabel: "I need to understand better before deciding" },
    ],
  },
  es: {
    title: "¿Cuánto estarías dispuesto(a) a invertir para cambiar tu situación financiera?",
    subtitle: "Pensalo como una inversión en vos mismo(a). No es un gasto — es el primer paso hacia tu seguridad financiera.",
    opts: [
      { label: "Menos de $100", sublabel: "Quiero empezar con poco e ir aumentando" },
      { label: "Entre $100 y $500", sublabel: "Puedo hacer una inversión moderada" },
      { label: "Más de $500", sublabel: "Estoy listo(a) para invertir en serio" },
      { label: "Depende de los resultados posibles", sublabel: "Necesito entender mejor antes de decidir" },
    ],
  },
} as const;

const icons = [
  <Sprout className="w-5 h-5" />,
  <TrendingUp className="w-5 h-5" />,
  <Gem className="w-5 h-5" />,
  <HelpCircle className="w-5 h-5" />,
];
const values = ["menos100", "100-500", "500+", "depende"];

const StepInvestment = ({ onNext }: StepProps) => {
  const { lang } = useLanguage();
  const t = texts[lang];
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (answer: string) => {
    setSelected(answer);
    setTimeout(() => onNext(answer), 500);
  };

  return (
    <StepContainer>
      <StepTitle>{t.title}</StepTitle>
      <StepSubtitle>{t.subtitle}</StepSubtitle>

      <div className="w-full space-y-3 mt-2">
        {t.opts.map((opt, i) => (
          <OptionCard
            key={values[i]}
            label={opt.label}
            sublabel={opt.sublabel}
            icon={icons[i]}
            selected={selected === values[i]}
            onClick={() => handleSelect(values[i])}
          />
        ))}
      </div>
    </StepContainer>
  );
};

export default StepInvestment;
