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
      title: `${n}, eu sei exatamente o que você tá sentindo.`,
      message: `Já perdeu dinheiro, já se sentiu enganado, e agora qualquer coisa nova parece golpe. Faz sentido desconfiar. Mas deixa eu te contar: 7 em cada 10 dos nossos melhores alunos estavam exatamente onde você tá agora. Mesma desconfiança, mesmo medo. A diferença? Eles decidiram dar mais uma chance — mas dessa vez, com uma tecnologia que não depende de sorte, de guru, nem de promessa. A IA mostra o caminho. Você decide se segue.`,
    },
    tempo: {
      icon: <Clock className="w-8 h-8 text-accent" />,
      title: `${n}, você trabalha o dia todo. Eu sei.`,
      message: `Chega em casa cansado, tem mil coisas pra resolver, e a última coisa que quer é mais uma obrigação. Por isso que esse sistema não foi feito pra tomar seu tempo. São 10 minutos. Literalmente. Pode ser antes de dormir, no intervalo do almoço, enquanto espera o café. A IA trabalha o dia inteiro — você só dá uma olhada quando puder.`,
    },
    inicio: {
      icon: <Compass className="w-8 h-8 text-accent" />,
      title: `${n}, todo mundo começa sem saber nada.`,
      message: `A internet tá cheia de informação — e isso paralisa. Você não sabe em quem confiar, não sabe por onde começar, e acaba não fazendo nada. Aqui é diferente. Não tem 500 vídeos pra assistir. É passo 1, passo 2, passo 3. Você segue a ordem, e o sistema te guia. Ninguém fica perdido porque não tem como se perder.`,
    },
    dinheiro: {
      icon: <Wallet className="w-8 h-8 text-accent" />,
      title: `${n}, eu entendo. Cada real importa.`,
      message: `Quando o dinheiro tá curto, qualquer gasto parece um risco enorme. E é mesmo. Por isso que o investimento aqui é mínimo — e muita gente recupera já nos primeiros dias. Não tô pedindo pra você apostar tudo. Tô te mostrando uma porta que milhares de pessoas na mesma situação que você já passaram — e do outro lado, encontraram uma tranquilidade que não tinham há anos.`,
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
