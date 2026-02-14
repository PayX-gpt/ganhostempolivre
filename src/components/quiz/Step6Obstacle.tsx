import { useState } from "react";
import { StepContainer, StepTitle, StepSubtitle, OptionCard } from "./QuizUI";

interface Step6Props {
  onNext: (answer: string) => void;
}

const Step6Obstacle = ({ onNext }: Step6Props) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [showValidation, setShowValidation] = useState(false);

  const handleSelect = (answer: string) => {
    setSelected(answer);
    setShowValidation(true);
    setTimeout(() => onNext(answer), 1500);
  };

  return (
    <StepContainer>
      <StepTitle>Qual é o seu maior obstáculo hoje?</StepTitle>
      <StepSubtitle>Identificar isso é o primeiro passo para superá-lo.</StepSubtitle>

      <div className="w-full space-y-3 mt-2">
        <OptionCard
          label="Medo de errar de novo"
          sublabel="Já perdi dinheiro e não quero repetir"
          icon="😰"
          selected={selected === "medo"}
          onClick={() => handleSelect("medo")}
        />
        <OptionCard
          label="Falta de tempo"
          sublabel="Minha rotina é muito corrida"
          icon="⏰"
          selected={selected === "tempo"}
          onClick={() => handleSelect("tempo")}
        />
        <OptionCard
          label="Não sei por onde começar"
          sublabel="Me sinto perdido com tanta informação"
          icon="🧭"
          selected={selected === "inicio"}
          onClick={() => handleSelect("inicio")}
        />
        <OptionCard
          label="Falta de dinheiro para investir"
          sublabel="Não tenho capital inicial"
          icon="💸"
          selected={selected === "dinheiro"}
          onClick={() => handleSelect("dinheiro")}
        />
      </div>

      {showValidation && (
        <div className="w-full funnel-card border-primary/40 bg-primary/5 animate-fade-in mt-2">
          <p className="text-sm text-foreground text-center">
            ✅ Entendido. Saiba que{" "}
            <span className="font-bold text-primary">7 em cada 10</span>{" "}
            dos nossos melhores alunos sentiam exatamente o mesmo que você. Continue para ver como eles superaram isso.
          </p>
        </div>
      )}
    </StepContainer>
  );
};

export default Step6Obstacle;
