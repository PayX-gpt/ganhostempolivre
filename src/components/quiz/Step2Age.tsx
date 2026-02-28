import { useState } from "react";
import { StepContainer, StepTitle, StepSubtitle, OptionCard } from "./QuizUI";
import { useLanguage, type Language } from "@/lib/i18n";
import couple1825 from "@/assets/couple-18-25.jpg";
import couple2635 from "@/assets/couple-26-35.jpg";
import couple3645 from "@/assets/couple-36-45.jpg";
import couple4655 from "@/assets/couple-46-55.jpg";
import couple56plus from "@/assets/couple-56-plus.jpg";

interface Step2Props {
  onNext: (age: string) => void;
}

const texts = {
  pt: {
    title1: "Para começar, qual é a sua ",
    titleHighlight: "faixa de idade",
    title2: "?",
    subtitle: "Essa informação nos ajuda a personalizar o plano ideal para o seu perfil.",
    options: [
      { label: "18 a 25 anos", sublabel: "Nossos alunos dessa faixa ganham em média R$120/dia" },
      { label: "26 a 35 anos", sublabel: "Faixa com maior taxa de resultado na primeira semana" },
      { label: "36 a 45 anos", sublabel: "Complemento de renda mais buscado nessa faixa" },
      { label: "46 a 55 anos", sublabel: "Grupo que mais cresce na plataforma — +340% em 2024" },
      { label: "56 anos ou mais", sublabel: "Nosso aluno mais velho tem 72 anos e opera todo dia" },
    ],
  },
  en: {
    title1: "To get started, what's your ",
    titleHighlight: "age range",
    title2: "?",
    subtitle: "This helps us create the ideal plan for your profile.",
    options: [
      { label: "18 to 25", sublabel: "Our students in this range earn $25/day on average" },
      { label: "26 to 35", sublabel: "Highest success rate in the first week" },
      { label: "36 to 45", sublabel: "Most popular income supplement in this range" },
      { label: "46 to 55", sublabel: "Fastest growing group on the platform — +340% in 2024" },
      { label: "56 or older", sublabel: "Our oldest student is 72 and uses it every day" },
    ],
  },
  es: {
    title1: "Para empezar, ¿cuál es tu ",
    titleHighlight: "rango de edad",
    title2: "?",
    subtitle: "Esta información nos ayuda a personalizar el plan ideal para tu perfil.",
    options: [
      { label: "18 a 25 años", sublabel: "Nuestros alumnos en este rango ganan $25/día en promedio" },
      { label: "26 a 35 años", sublabel: "Mayor tasa de éxito en la primera semana" },
      { label: "36 a 45 años", sublabel: "Complemento de ingreso más buscado en esta franja" },
      { label: "46 a 55 años", sublabel: "Grupo de mayor crecimiento — +340% en 2024" },
      { label: "56 años o más", sublabel: "Nuestro alumno mayor tiene 72 años y opera todos los días" },
    ],
  },
} as const;

const images = [couple1825, couple2635, couple3645, couple4655, couple56plus];

const Step2Age = ({ onNext }: Step2Props) => {
  const { lang } = useLanguage();
  const t = texts[lang];
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (age: string) => {
    setSelected(age);
    setTimeout(() => onNext(age), 400);
  };

  return (
    <StepContainer>
      <StepTitle>{t.title1}<span className="text-gradient-green">{t.titleHighlight}</span>{t.title2}</StepTitle>
      <StepSubtitle>{t.subtitle}</StepSubtitle>

      <div className="w-full space-y-3 mt-2">
        {t.options.map((opt, i) => (
          <OptionCard
            key={opt.label}
            label={opt.label}
            sublabel={opt.sublabel}
            imageSrc={images[i]}
            selected={selected === opt.label}
            onClick={() => handleSelect(opt.label)}
          />
        ))}
      </div>
    </StepContainer>
  );
};

export default Step2Age;
