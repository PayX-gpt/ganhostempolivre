import { useState } from "react";
import { StepContainer, StepTitle, StepSubtitle, OptionCard, CTAButton } from "./QuizUI";

interface Step6Props {
  onNext: (answer: string) => void;
}

const obstacleMessages: Record<string, { title: string; message: string }> = {
  medo: {
    title: "Nós entendemos você. 💛",
    message: "Saiba que 7 em cada 10 dos nossos melhores alunos sentiam exatamente o mesmo medo que você. Eles já tinham perdido dinheiro antes, já tinham desconfiado de tudo... mas decidiram dar mais uma chance — e dessa vez, deu certo. Continue para ver como eles superaram isso.",
  },
  tempo: {
    title: "Sua rotina é corrida, e tudo bem. ⏰",
    message: "A maioria dos nossos alunos trabalha o dia todo, cuida da casa e da família. Por isso, o método foi criado para funcionar com apenas 10 minutos por dia — no horário que você escolher. Continue para ver como encaixar na sua rotina.",
  },
  inicio: {
    title: "É normal se sentir assim. 🧭",
    message: "Muita gente chega até aqui se sentindo perdida com tanta informação na internet. É por isso que o método é 100% passo a passo — você nunca fica sozinho(a) e nunca fica perdido(a). Continue para ver como funciona na prática.",
  },
  dinheiro: {
    title: "Nós pensamos nisso por você. 🌱",
    message: "Entendemos que dinheiro está curto. O investimento inicial é mínimo e acessível — e muitos alunos recuperaram o valor já nos primeiros dias de operação. Continue para ver os detalhes e se surpreender.",
  },
};

const Step6Obstacle = ({ onNext }: Step6Props) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [showValidation, setShowValidation] = useState(false);

  const handleSelect = (answer: string) => {
    setSelected(answer);
    setShowValidation(true);
  };

  if (showValidation && selected) {
    const msg = obstacleMessages[selected];
    return (
      <StepContainer>
        <div className="w-full flex flex-col items-center gap-6 py-4">
          <div className="w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center border-2 border-primary/30">
            <span className="text-4xl">✅</span>
          </div>

          <h2 className="font-display text-2xl font-bold text-foreground text-center leading-snug">
            {msg.title}
          </h2>

          <p className="text-lg text-muted-foreground text-center leading-relaxed max-w-md">
            {msg.message}
          </p>

          <div className="w-full mt-4">
            <CTAButton onClick={() => onNext(selected)}>
              Continuar →
            </CTAButton>
          </div>
        </div>
      </StepContainer>
    );
  }

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
    </StepContainer>
  );
};

export default Step6Obstacle;
