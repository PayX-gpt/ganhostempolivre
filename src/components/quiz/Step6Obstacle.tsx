import { useState } from "react";
import { StepContainer, StepTitle, StepSubtitle, OptionCard, CTAButton } from "./QuizUI";
import { AlertCircle, Clock, Compass, Wallet, Heart, CheckCircle } from "lucide-react";

interface Step6Props {
  onNext: (answer: string) => void;
  userName?: string;
}

const getObstacleMessages = (name?: string) => {
  const n = name || "você";
  return {
    medo: {
      icon: <Heart className="w-8 h-8 text-accent" />,
      title: `${n}, nós entendemos você.`,
      message: `Saiba que 7 em cada 10 dos nossos melhores alunos sentiam exatamente o mesmo medo. Eles já tinham perdido dinheiro antes, já tinham desconfiado de tudo... mas nosso sistema é diferente porque a IA faz o trabalho pesado — ${n}, você nunca opera no escuro. Cada decisão é guiada pela tecnologia.`,
    },
    tempo: {
      icon: <Clock className="w-8 h-8 text-accent" />,
      title: `${n}, sua rotina é corrida — e tudo bem.`,
      message: `A maioria dos nossos alunos trabalha o dia todo, cuida da casa e da família. Por isso, nosso sistema foi criado para funcionar com apenas 10 minutos por dia. A IA trabalha enquanto ${n} vive a vida — e você só acompanha quando puder.`,
    },
    inicio: {
      icon: <Compass className="w-8 h-8 text-accent" />,
      title: `${n}, é normal se sentir assim.`,
      message: `Muita gente chega até aqui se sentindo perdida com tanta informação. Nosso sistema é diferente porque é 100% passo a passo — ${n} nunca fica sozinho(a) e nunca fica perdido(a). A tecnologia guia cada etapa automaticamente.`,
    },
    dinheiro: {
      icon: <Wallet className="w-8 h-8 text-accent" />,
      title: `${n}, nós pensamos nisso por você.`,
      message: `Entendemos que o dinheiro está curto. O investimento é mínimo e acessível — e muitos alunos como ${n} recuperaram o valor já nos primeiros dias. Nosso sistema foi desenhado para gerar retorno rápido, justamente porque sabemos que cada real conta.`,
    },
  };
};

const Step6Obstacle = ({ onNext, userName }: Step6Props) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [showValidation, setShowValidation] = useState(false);

  const handleSelect = (answer: string) => {
    setSelected(answer);
    setShowValidation(true);
  };

  const obstacleMessages = getObstacleMessages(userName);

  if (showValidation && selected) {
    const msg = obstacleMessages[selected as keyof typeof obstacleMessages];
    return (
      <StepContainer>
        <div className="w-full flex flex-col items-center gap-6 py-4">
          <div className="w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center border-2 border-primary/30">
            <CheckCircle className="w-10 h-10 text-primary" />
          </div>

          <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground text-center leading-snug">
            {msg.title}
          </h2>

          <p className="text-base sm:text-lg text-muted-foreground text-center leading-relaxed max-w-md">
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
