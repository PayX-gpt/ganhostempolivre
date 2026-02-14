import { useState } from "react";
import { StepContainer, StepTitle, StepSubtitle, OptionCard } from "./QuizUI";

interface Step6Props {
  onNext: (answer: string) => void;
}

const obstacleMessages: Record<string, string> = {
  medo: "Entendido. Saiba que 7 em cada 10 dos nossos melhores alunos sentiam exatamente o mesmo medo que você. Eles superaram — e você também pode. Continue para ver como.",
  tempo: "Perfeito. A maioria dos nossos alunos tem uma rotina cheia. Por isso, o método foi criado para funcionar com apenas 10 minutos por dia. Continue para ver como.",
  inicio: "Normal. Muita gente se sente assim no começo. É por isso que o método é 100% passo a passo — você nunca fica perdido. Continue para ver como funciona.",
  dinheiro: "Entendemos. O investimento inicial é mínimo e acessível — e muitos alunos recuperaram o valor já nos primeiros dias. Continue para ver os detalhes.",
};

const Step6Obstacle = ({ onNext }: Step6Props) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [showValidation, setShowValidation] = useState(false);

  const handleSelect = (answer: string) => {
    setSelected(answer);
    setShowValidation(true);
    setTimeout(() => onNext(answer), 2500);
  };

  return (
    <StepContainer>
      <StepTitle>Qual é o seu maior obstáculo hoje para ganhar dinheiro online?</StepTitle>
      <StepSubtitle>
        Identificar isso é o primeiro passo. Nós já ajudamos milhares de pessoas a superar exatamente esse obstáculo.
      </StepSubtitle>

      <div className="w-full space-y-3 mt-2">
        <OptionCard
          label="Medo de errar de novo"
          sublabel="Já tentei antes e perdi dinheiro. Tenho receio de repetir."
          icon="😰"
          selected={selected === "medo"}
          onClick={() => handleSelect("medo")}
        />
        <OptionCard
          label="Falta de tempo"
          sublabel="Minha rotina é corrida, não sei se consigo encaixar"
          icon="⏰"
          selected={selected === "tempo"}
          onClick={() => handleSelect("tempo")}
        />
        <OptionCard
          label="Não sei por onde começar"
          sublabel="Me sinto perdido com tanta informação na internet"
          icon="🧭"
          selected={selected === "inicio"}
          onClick={() => handleSelect("inicio")}
        />
        <OptionCard
          label="Falta de dinheiro para investir"
          sublabel="Não tenho capital sobrando para começar"
          icon="💸"
          selected={selected === "dinheiro"}
          onClick={() => handleSelect("dinheiro")}
        />
      </div>

      {showValidation && selected && (
        <div className="w-full funnel-card border-primary/40 bg-primary/5 animate-fade-in mt-2">
          <p className="text-base text-foreground text-center leading-relaxed">
            ✅ {obstacleMessages[selected]}
          </p>
        </div>
      )}
    </StepContainer>
  );
};

export default Step6Obstacle;
