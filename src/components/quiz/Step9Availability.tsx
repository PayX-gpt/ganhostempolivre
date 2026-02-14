import { useState } from "react";
import { StepContainer, StepTitle, StepSubtitle, OptionCard, CTAButton } from "./QuizUI";
import { Timer, Clock, Clock2, Clock3, CheckCircle } from "lucide-react";

interface Step9Props {
  onNext: (answer: string) => void;
  userName?: string;
}

const getFeedback = (answer: string, name?: string) => {
  const n = name || "você";
  const messages: Record<string, { title: string; message: string }> = {
    menos30: {
      title: `${n}, quer saber a verdade?`,
      message: `Menos de 30 minutos é mais do que a maioria dos nossos alunos com resultado usa. Tem gente que dedica 10 minutos antes de dormir e acorda com dinheiro na conta. Não tô exagerando. A IA trabalha o dia inteiro — você só precisa de alguns minutos pra acompanhar o que ela já fez.`,
    },
    "30-60": {
      title: `${n}, esse tempo é ouro.`,
      message: `Com meia hora a uma hora, você consegue não só acompanhar os resultados, mas entender por que eles tão acontecendo. Isso gera confiança. E confiança gera consistência. É exatamente a faixa de tempo que a maioria dos nossos alunos mais satisfeitos dedica.`,
    },
    "1-2h": {
      title: `${n}, com esse tempo você vai longe.`,
      message: `Quem dedica 1 a 2 horas consegue ir além do básico. Dá pra entender como a IA pensa, otimizar suas operações, e acelerar os resultados. Nossos alunos nessa faixa costumam ser os que atingem as metas mais rápido — simplesmente porque têm tempo de absorver o processo.`,
    },
    "2h+": {
      title: `${n}, eu vou ser honesto.`,
      message: `Com mais de 2 horas por dia, você tem mais tempo disponível do que a maioria dos nossos alunos. E isso é uma vantagem real. Mas aqui vai um conselho: não precisa usar tudo de uma vez. Comece com calma, ganhe confiança, e aumente aos poucos. O sistema acompanha seu ritmo.`,
    },
  };
  return messages[answer];
};

const Step9Availability = ({ onNext, userName }: Step9Props) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const handleSelect = (answer: string) => {
    setSelected(answer);
    setShowFeedback(true);
  };

  if (showFeedback && selected) {
    const fb = getFeedback(selected, userName);
    if (fb) {
      return (
        <StepContainer>
          <div className="w-full flex flex-col items-center gap-5 py-4">
            <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center border-2 border-primary/30">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground text-center leading-snug">
              {fb.title}
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground text-center leading-relaxed max-w-md">
              {fb.message}
            </p>
            <div className="w-full mt-2">
              <CTAButton onClick={() => onNext(selected)}>
                Continuar →
              </CTAButton>
            </div>
          </div>
        </StepContainer>
      );
    }
  }

  return (
    <StepContainer>
      <StepTitle>Quanto tempo livre você tem por dia?</StepTitle>
      <StepSubtitle>
        Nossos alunos com os melhores resultados dedicam em média 15 a 30 minutos. Mas mesmo com 10 minutos, já é possível começar.
      </StepSubtitle>

      <div className="w-full space-y-3 mt-2">
        <OptionCard
          label="Menos de 30 minutos"
          sublabel="Tenho pouquinho tempo, mas quero aproveitar"
          icon={<Timer className="w-5 h-5" />}
          selected={selected === "menos30"}
          onClick={() => handleSelect("menos30")}
        />
        <OptionCard
          label="30 minutos a 1 hora"
          sublabel="Consigo encaixar no meu dia com tranquilidade"
          icon={<Clock className="w-5 h-5" />}
          selected={selected === "30-60"}
          onClick={() => handleSelect("30-60")}
        />
        <OptionCard
          label="1 a 2 horas"
          sublabel="Tenho um bom tempo livre disponível"
          icon={<Clock2 className="w-5 h-5" />}
          selected={selected === "1-2h"}
          onClick={() => handleSelect("1-2h")}
        />
        <OptionCard
          label="Mais de 2 horas"
          sublabel="Tenho bastante tempo e quero dedicar"
          icon={<Clock3 className="w-5 h-5" />}
          selected={selected === "2h+"}
          onClick={() => handleSelect("2h+")}
        />
      </div>
    </StepContainer>
  );
};

export default Step9Availability;
