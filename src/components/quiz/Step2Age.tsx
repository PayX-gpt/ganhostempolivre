import { useState } from "react";
import { StepContainer, StepTitle, StepSubtitle, OptionCard } from "./QuizUI";

interface Step2Props {
  onNext: (age: string) => void;
}

const ageOptions = [
  { label: "18 a 25 anos", sublabel: "Início de carreira", icon: "👩" },
  { label: "26 a 35 anos", sublabel: "Fase de crescimento", icon: "👨" },
  { label: "36 a 45 anos", sublabel: "Maturidade profissional", icon: "👩‍💼" },
  { label: "46 a 55 anos", sublabel: "Experiência de vida", icon: "👨‍🦳" },
  { label: "56 anos ou mais", sublabel: "Sabedoria e experiência", icon: "🧓" },
];

const Step2Age = ({ onNext }: Step2Props) => {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (age: string) => {
    setSelected(age);
    setTimeout(() => onNext(age), 500);
  };

  return (
    <StepContainer>
      <StepTitle>Para começar, qual é a sua faixa de idade?</StepTitle>
      <StepSubtitle>
        Essa informação nos ajuda a personalizar o plano ideal para o seu perfil. Não existe idade errada para começar.
      </StepSubtitle>

      <div className="w-full space-y-3 mt-2">
        {ageOptions.map((opt) => (
          <OptionCard
            key={opt.label}
            label={opt.label}
            sublabel={opt.sublabel}
            icon={opt.icon}
            selected={selected === opt.label}
            onClick={() => handleSelect(opt.label)}
          />
        ))}
      </div>
    </StepContainer>
  );
};

export default Step2Age;
