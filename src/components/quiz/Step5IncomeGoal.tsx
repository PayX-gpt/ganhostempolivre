import { useState } from "react";
import { StepContainer, StepTitle, StepSubtitle, OptionCard } from "./QuizUI";

interface Step5Props {
  onNext: (answer: string) => void;
}

const Step5IncomeGoal = ({ onNext }: Step5Props) => {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (answer: string) => {
    setSelected(answer);
    setTimeout(() => onNext(answer), 400);
  };

  return (
    <StepContainer>
      <StepTitle>Quanto você gostaria de ganhar por dia?</StepTitle>
      <StepSubtitle>Escolha a faixa que mais combina com seu objetivo atual.</StepSubtitle>

      <div className="w-full space-y-3 mt-2">
        <OptionCard
          label="R$50 a R$100 por dia"
          sublabel="O suficiente para pagar contas com tranquilidade"
          icon="💰"
          selected={selected === "50-100"}
          onClick={() => handleSelect("50-100")}
        />
        <OptionCard
          label="R$100 a R$300 por dia"
          sublabel="Uma renda extra significativa"
          icon="💵"
          selected={selected === "100-300"}
          onClick={() => handleSelect("100-300")}
        />
        <OptionCard
          label="R$300 a R$500 por dia"
          sublabel="Renda que muda de vida"
          icon="🤑"
          selected={selected === "300-500"}
          onClick={() => handleSelect("300-500")}
        />
        <OptionCard
          label="R$500+ por dia"
          sublabel="Quero ir além e construir algo grande"
          icon="🚀"
          selected={selected === "500+"}
          onClick={() => handleSelect("500+")}
        />
      </div>
    </StepContainer>
  );
};

export default Step5IncomeGoal;
