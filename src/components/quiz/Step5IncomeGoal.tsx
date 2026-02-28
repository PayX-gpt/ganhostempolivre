import { useState } from "react";
import { StepContainer, StepTitle, StepSubtitle, OptionCard } from "./QuizUI";
import { Shield, CheckCircle, Home, Star } from "lucide-react";
import { useLanguage, type Language } from "@/lib/i18n";

interface Step5Props {
  onNext: (answer: string) => void;
  userName?: string;
  userAge?: string;
}

const texts = {
  pt: {
    title1: "Quanto você gostaria de ",
    titleHL: "ganhar a mais",
    title2: " por dia?",
    subtitle: "Escolha a faixa que faria diferença real na sua vida hoje.",
    opts: [
      { label: "R$50 a R$100 por dia", sublabel: "= R$1.500 a R$3.000/mês. Paga aluguel, carro, mercado." },
      { label: "R$100 a R$300 por dia", sublabel: "= R$3.000 a R$9.000/mês. Muda de vida." },
      { label: "R$300 a R$500 por dia", sublabel: "= R$9.000 a R$15.000/mês. Liberdade total." },
      { label: "Mais de R$500 por dia", sublabel: "= +R$15.000/mês. Outro nível." },
    ],
  },
  en: {
    title1: "How much would you like to ",
    titleHL: "earn extra",
    title2: " per day?",
    subtitle: "Choose the range that would make a real difference in your life today.",
    opts: [
      { label: "R$50 to R$100 per day", sublabel: "= R$1,500 to R$3,000/month. Covers rent, car, groceries." },
      { label: "R$100 to R$300 per day", sublabel: "= R$3,000 to R$9,000/month. Life-changing." },
      { label: "R$300 to R$500 per day", sublabel: "= R$9,000 to R$15,000/month. Total freedom." },
      { label: "More than R$500 per day", sublabel: "= R$15,000+/month. Next level." },
    ],
  },
  es: {
    title1: "¿Cuánto te gustaría ",
    titleHL: "ganar de más",
    title2: " por día?",
    subtitle: "Elegí el rango que haría una diferencia real en tu vida hoy.",
    opts: [
      { label: "R$50 a R$100 por día", sublabel: "= R$1.500 a R$3.000/mes. Cubre alquiler, auto, mercado." },
      { label: "R$100 a R$300 por día", sublabel: "= R$3.000 a R$9.000/mes. Te cambia la vida." },
      { label: "R$300 a R$500 por día", sublabel: "= R$9.000 a R$15.000/mes. Libertad total." },
      { label: "Más de R$500 por día", sublabel: "= +R$15.000/mes. Otro nivel." },
    ],
  },
} as const;

const icons = [
  <Shield className="w-5 h-5" />,
  <CheckCircle className="w-5 h-5" />,
  <Home className="w-5 h-5" />,
  <Star className="w-5 h-5" />,
];
const values = ["50-100", "100-300", "300-500", "500+"];

const Step5IncomeGoal = ({ onNext }: Step5Props) => {
  const { lang } = useLanguage();
  const t = texts[lang];
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (answer: string) => {
    setSelected(answer);
    setTimeout(() => onNext(answer), 400);
  };

  return (
    <StepContainer>
      <StepTitle>{t.title1}<span className="text-gradient-green">{t.titleHL}</span>{t.title2}</StepTitle>
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

export default Step5IncomeGoal;
