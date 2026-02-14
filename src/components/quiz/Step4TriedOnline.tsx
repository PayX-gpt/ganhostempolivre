import { useState } from "react";
import { StepContainer, StepTitle, StepSubtitle, OptionCard } from "./QuizUI";

interface Step4Props {
  onNext: (answer: string) => void;
}

const Step4TriedOnline = ({ onNext }: Step4Props) => {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (answer: string) => {
    setSelected(answer);
    setTimeout(() => onNext(answer), 400);
  };

  return (
    <StepContainer>
      <StepTitle>Você já tentou ganhar dinheiro pela internet?</StepTitle>
      <StepSubtitle>Seja honesto, sua resposta vai personalizar sua experiência.</StepSubtitle>

      <div className="w-full space-y-3 mt-2">
        <OptionCard
          label="Sim, mas não deu certo"
          sublabel="Tentei e acabei perdendo dinheiro ou tempo"
          icon="😔"
          selected={selected === "sim_falhou"}
          onClick={() => handleSelect("sim_falhou")}
        />
        <OptionCard
          label="Sim, tenho alguma experiência"
          sublabel="Já consegui alguns resultados"
          icon="🤔"
          selected={selected === "sim_experiencia"}
          onClick={() => handleSelect("sim_experiencia")}
        />
        <OptionCard
          label="Não, nunca tentei"
          sublabel="Quero começar do zero"
          icon="🆕"
          selected={selected === "nunca"}
          onClick={() => handleSelect("nunca")}
        />
      </div>
    </StepContainer>
  );
};

export default Step4TriedOnline;
