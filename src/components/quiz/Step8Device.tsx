import { useState } from "react";
import { StepContainer, StepTitle, StepSubtitle, OptionCard } from "./QuizUI";

interface Step8Props {
  onNext: (answer: string) => void;
}

const Step8Device = ({ onNext }: Step8Props) => {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (answer: string) => {
    setSelected(answer);
    setTimeout(() => onNext(answer), 400);
  };

  return (
    <StepContainer>
      <StepTitle>Qual dispositivo você mais usa no dia a dia?</StepTitle>
      <StepSubtitle>O método funciona em qualquer um deles.</StepSubtitle>

      <div className="w-full space-y-3 mt-2">
        <OptionCard
          label="Celular"
          sublabel="Uso o celular para quase tudo"
          icon="📱"
          selected={selected === "celular"}
          onClick={() => handleSelect("celular")}
        />
        <OptionCard
          label="Computador / Notebook"
          sublabel="Prefiro usar no computador"
          icon="💻"
          selected={selected === "computador"}
          onClick={() => handleSelect("computador")}
        />
        <OptionCard
          label="Ambos"
          sublabel="Uso celular e computador"
          icon="📱💻"
          selected={selected === "ambos"}
          onClick={() => handleSelect("ambos")}
        />
      </div>
    </StepContainer>
  );
};

export default Step8Device;
