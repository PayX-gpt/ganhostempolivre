import { useState } from "react";
import { StepContainer, StepTitle, StepSubtitle, OptionCard } from "./QuizUI";

interface Step2Props {
  onNext: (age: string) => void;
}

const ageOptions = [
  { label: "18 a 25 anos", icon: "👩" },
  { label: "26 a 35 anos", icon: "👨" },
  { label: "36 a 45 anos", icon: "👩‍💼" },
  { label: "46 a 55 anos", icon: "👨‍🦳" },
  { label: "56 anos ou mais", icon: "🧓" },
];

const Step2Age = ({ onNext }: Step2Props) => {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (age: string) => {
    setSelected(age);
    setTimeout(() => onNext(age), 400);
  };

  return (
    <StepContainer>
      <StepTitle>Qual é a sua faixa de idade?</StepTitle>
      <StepSubtitle>Isso nos ajuda a personalizar o melhor plano para o seu perfil.</StepSubtitle>

      <div className="w-full space-y-3 mt-2">
        {ageOptions.map((opt) => (
          <OptionCard
            key={opt.label}
            label={opt.label}
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
