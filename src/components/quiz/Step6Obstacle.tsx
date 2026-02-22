import { useState } from "react";
import { StepContainer, StepTitle, StepSubtitle, OptionCard } from "./QuizUI";
import { AlertCircle, Clock, Compass, Wallet } from "lucide-react";

interface Step6Props {
  onNext: (answer: string) => void;
  userName?: string;
  userAge?: string;
}

const Step6Obstacle = ({ onNext, userName, userAge }: Step6Props) => {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (answer: string) => {
    setSelected(answer);
    setTimeout(() => onNext(answer), 400);
  };

  return (
    <StepContainer>
      <StepTitle>Qual é o seu <span className="text-gradient-green">maior obstáculo</span> hoje?</StepTitle>
      <StepSubtitle>
        Cada uma dessas barreiras tem solução. A IA resolve todas.
      </StepSubtitle>

      <div className="w-full space-y-3 mt-2">
        <OptionCard
          label="Medo de errar de novo"
          sublabel="Já tentei antes e perdi dinheiro. Tenho receio de repetir."
          icon={<AlertCircle className="w-5 h-5" />}
          selected={selected === "medo"}
          onClick={() => handleSelect("medo")}
        />
        <OptionCard
          label="Falta de tempo"
          sublabel="Minha rotina é corrida, não sei se consigo encaixar"
          icon={<Clock className="w-5 h-5" />}
          selected={selected === "tempo"}
          onClick={() => handleSelect("tempo")}
        />
        <OptionCard
          label="Não sei por onde começar"
          sublabel="Me sinto perdido com tanta informação na internet"
          icon={<Compass className="w-5 h-5" />}
          selected={selected === "inicio"}
          onClick={() => handleSelect("inicio")}
        />
        <OptionCard
          label="Falta de dinheiro para investir"
          sublabel="Não tenho capital sobrando para começar"
          icon={<Wallet className="w-5 h-5" />}
          selected={selected === "dinheiro"}
          onClick={() => handleSelect("dinheiro")}
        />
      </div>
    </StepContainer>
  );
};

export default Step6Obstacle;
