import { useState } from "react";
import { StepContainer, StepTitle, StepSubtitle, OptionCard } from "./QuizUI";

interface StepProps {
  onNext: (answer: string) => void;
}

const StepInvestment = ({ onNext }: StepProps) => {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (answer: string) => {
    setSelected(answer);
    setTimeout(() => onNext(answer), 500);
  };

  return (
    <StepContainer>
      <StepTitle>Quanto você estaria disposto(a) a investir para mudar sua situação financeira?</StepTitle>
      <StepSubtitle>
        Pense nisso como um investimento em você mesmo(a). Não é um gasto — é o primeiro passo para a sua segurança financeira.
      </StepSubtitle>

      <div className="w-full space-y-3 mt-2">
        <OptionCard
          label="Menos de R$100"
          sublabel="Quero começar com pouco e ir aumentando"
          icon="🌱"
          selected={selected === "menos100"}
          onClick={() => handleSelect("menos100")}
        />
        <OptionCard
          label="Entre R$100 e R$500"
          sublabel="Posso fazer um investimento moderado"
          icon="📈"
          selected={selected === "100-500"}
          onClick={() => handleSelect("100-500")}
        />
        <OptionCard
          label="Mais de R$500"
          sublabel="Estou pronto(a) para investir sério"
          icon="💎"
          selected={selected === "500+"}
          onClick={() => handleSelect("500+")}
        />
        <OptionCard
          label="Depende dos resultados possíveis"
          sublabel="Preciso entender melhor antes de decidir"
          icon="🤔"
          selected={selected === "depende"}
          onClick={() => handleSelect("depende")}
        />
      </div>
    </StepContainer>
  );
};

export default StepInvestment;
