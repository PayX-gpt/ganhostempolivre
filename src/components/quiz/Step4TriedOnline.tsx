import { useState } from "react";
import { StepContainer, StepTitle, StepSubtitle, OptionCard } from "./QuizUI";

interface Step4Props {
  onNext: (answer: string) => void;
}

const Step4TriedOnline = ({ onNext }: Step4Props) => {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (answer: string) => {
    setSelected(answer);
    setTimeout(() => onNext(answer), 500);
  };

  return (
    <StepContainer>
      <StepTitle>Você já tentou ganhar dinheiro pela internet antes?</StepTitle>
      <StepSubtitle>
        Seja sincero(a). Não existe resposta errada — sua honestidade vai nos ajudar a montar o melhor caminho pra você.
      </StepSubtitle>

      <div className="w-full space-y-3 mt-2">
        <OptionCard
          label="Sim, mas não deu certo"
          sublabel="Tentei e acabei perdendo dinheiro, tempo ou os dois"
          icon="😔"
          selected={selected === "sim_falhou"}
          onClick={() => handleSelect("sim_falhou")}
        />
        <OptionCard
          label="Sim, tenho alguma experiência"
          sublabel="Já tive alguns resultados, mas quero melhorar"
          icon="👍"
          selected={selected === "sim_experiencia"}
          onClick={() => handleSelect("sim_experiencia")}
        />
        <OptionCard
          label="Não, nunca tentei"
          sublabel="Sempre tive vontade, mas nunca dei o primeiro passo"
          icon="🤷"
          selected={selected === "nunca"}
          onClick={() => handleSelect("nunca")}
        />
      </div>

      <p className="text-sm text-muted-foreground text-center mt-1">
        📊 <em>68% dos nossos alunos responderam "Sim, mas não deu certo" — e mesmo assim conseguiram resultados.</em>
      </p>
    </StepContainer>
  );
};

export default Step4TriedOnline;
