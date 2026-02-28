import { useState } from "react";
import { StepContainer, StepTitle, StepSubtitle, OptionCard } from "./QuizUI";
import { AlertCircle, Clock, Compass, Wallet } from "lucide-react";
import { useLanguage, type Language } from "@/lib/i18n";

interface Step6Props {
  onNext: (answer: string) => void;
  userName?: string;
  userAge?: string;
}

const texts = {
  pt: {
    title1: "Qual é o seu ",
    titleHL: "maior obstáculo",
    title2: " hoje?",
    subtitle: "Cada uma dessas barreiras tem solução. A IA resolve todas.",
    opts: [
      { label: "Medo de errar de novo", sublabel: "Já tentei antes e perdi dinheiro. Tenho receio de repetir.", val: "medo" },
      { label: "Falta de tempo", sublabel: "Minha rotina é corrida, não sei se consigo encaixar", val: "tempo" },
      { label: "Não sei por onde começar", sublabel: "Me sinto perdido com tanta informação na internet", val: "inicio" },
      { label: "Falta de dinheiro para investir", sublabel: "Não tenho capital sobrando para começar", val: "dinheiro" },
    ],
  },
  en: {
    title1: "What's your ",
    titleHL: "biggest obstacle",
    title2: " right now?",
    subtitle: "Each of these barriers has a solution. AI solves them all.",
    opts: [
      { label: "Fear of failing again", sublabel: "I've tried before and lost money. I'm afraid of repeating that.", val: "medo" },
      { label: "Lack of time", sublabel: "My schedule is busy, not sure I can fit it in", val: "tempo" },
      { label: "Don't know where to start", sublabel: "I feel lost with so much information online", val: "inicio" },
      { label: "No money to invest", sublabel: "I don't have spare capital to get started", val: "dinheiro" },
    ],
  },
  es: {
    title1: "¿Cuál es tu ",
    titleHL: "mayor obstáculo",
    title2: " hoy?",
    subtitle: "Cada una de estas barreras tiene solución. La IA las resuelve todas.",
    opts: [
      { label: "Miedo a equivocarme de nuevo", sublabel: "Ya intenté antes y perdí plata. Tengo miedo de repetirlo.", val: "medo" },
      { label: "Falta de tiempo", sublabel: "Mi rutina es intensa, no sé si puedo encajarlo", val: "tempo" },
      { label: "No sé por dónde empezar", sublabel: "Me siento perdido con tanta información en internet", val: "inicio" },
      { label: "No tengo plata para invertir", sublabel: "No me sobra capital para empezar", val: "dinheiro" },
    ],
  },
} as const;

const icons = [
  <AlertCircle className="w-5 h-5" />,
  <Clock className="w-5 h-5" />,
  <Compass className="w-5 h-5" />,
  <Wallet className="w-5 h-5" />,
];

const Step6Obstacle = ({ onNext }: Step6Props) => {
  const { lang } = useLanguage();
  const t = texts[lang];
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (val: string) => {
    setSelected(val);
    setTimeout(() => onNext(val), 400);
  };

  return (
    <StepContainer>
      <StepTitle>{t.title1}<span className="text-gradient-green">{t.titleHL}</span>{t.title2}</StepTitle>
      <StepSubtitle>{t.subtitle}</StepSubtitle>

      <div className="w-full space-y-3 mt-2">
        {t.opts.map((opt, i) => (
          <OptionCard
            key={opt.val}
            label={opt.label}
            sublabel={opt.sublabel}
            icon={icons[i]}
            selected={selected === opt.val}
            onClick={() => handleSelect(opt.val)}
          />
        ))}
      </div>
    </StepContainer>
  );
};

export default Step6Obstacle;
