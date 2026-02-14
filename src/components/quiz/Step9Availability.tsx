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
      title: `${n}, isso já é mais que suficiente!`,
      message: `Nosso sistema foi criado justamente para quem tem pouco tempo. Em menos de 30 minutos, a IA já analisa, identifica e executa as melhores oportunidades. ${n} só precisa dar uma olhada e confirmar — é como ter um assistente trabalhando por você.`,
    },
    "30-60": {
      title: `Tempo ideal, ${n}!`,
      message: `Com 30 minutos a 1 hora por dia, ${n} consegue acompanhar tudo com calma e ainda aprender como o sistema funciona nos bastidores. É o tempo perfeito para quem quer segurança e consistência nos resultados.`,
    },
    "1-2h": {
      title: `${n}, você vai voar com esse tempo!`,
      message: `Com 1 a 2 horas disponíveis, ${n} consegue não só operar, mas entender profundamente como a IA toma decisões. Isso acelera demais seus resultados — nossos alunos com esse tempo disponível atingem as metas mais rápido.`,
    },
    "2h+": {
      title: `Impressionante, ${n}!`,
      message: `Com mais de 2 horas por dia, ${n} tem potencial para resultados acima da média. Nosso sistema escala com você — quanto mais tempo dedicar, mais oportunidades a IA identifica e mais ${n} aprende a otimizar seus ganhos.`,
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
