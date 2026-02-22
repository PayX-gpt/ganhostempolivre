import { useState } from "react";
import { StepContainer, StepTitle, StepSubtitle, OptionCard, CTAButton } from "./QuizUI";
import { Frown, ThumbsUp, HelpCircle, CheckCircle, BarChart3 } from "lucide-react";
import { isYoungProfile } from "@/lib/agePersonalization";

interface Step4Props {
  onNext: (answer: string) => void;
  userName?: string;
  userAge?: string;
}

const Step4TriedOnline = ({ onNext, userName, userAge }: Step4Props) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const young = isYoungProfile(userAge);
  const n = userName || "você";

  const handleSelect = (answer: string) => {
    setSelected(answer);
    // Only show the "O problema não foi você" feedback for sim_falhou
    if (answer === "sim_falhou") {
      setShowFeedback(true);
    } else {
      // Auto-advance for other answers
      setTimeout(() => onNext(answer), 400);
    }
  };

  if (showFeedback && selected === "sim_falhou") {
    return (
      <StepContainer>
        <div className="w-full flex flex-col items-center gap-5 py-4">
          <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center border-2 border-primary/30">
            <CheckCircle className="w-8 h-8 text-primary" />
          </div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground text-center leading-snug">
            {young
              ? `${n}, o problema não foi você — foi o método.`
              : `${n}, eu preciso te dizer uma coisa.`}
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground text-center leading-relaxed max-w-md">
            {young
              ? `O que vou te mostrar agora é diferente. Uma IA que faz o trabalho pesado. Sem complicação.`
              : `Se não deu certo antes, o problema não foi você. O que eu vou te mostrar aqui é diferente de tudo que você já viu. A tecnologia faz o trabalho. Você só acompanha.`}
          </p>
          <div className="w-full mt-2">
            <CTAButton onClick={() => onNext(selected)}>
              CONTINUAR MEU TESTE →
            </CTAButton>
          </div>
        </div>
      </StepContainer>
    );
  }

  return (
    <StepContainer>
      <StepTitle>Você já tentou <span className="text-gradient-green">ganhar dinheiro</span> pela internet antes?</StepTitle>
      <StepSubtitle>
        Não importa sua resposta. O que importa é o próximo passo.
      </StepSubtitle>

      <div className="w-full space-y-3 mt-2">
        <OptionCard
          label="Sim, mas não deu certo"
          sublabel="Tentei e acabei perdendo dinheiro, tempo ou os dois"
          icon={<Frown className="w-5 h-5" />}
          selected={selected === "sim_falhou"}
          onClick={() => handleSelect("sim_falhou")}
        />
        <OptionCard
          label="Sim, tenho alguma experiência"
          sublabel="Já tive alguns resultados, mas quero melhorar"
          icon={<ThumbsUp className="w-5 h-5" />}
          selected={selected === "sim_experiencia"}
          onClick={() => handleSelect("sim_experiencia")}
        />
        <OptionCard
          label="Não, nunca tentei"
          sublabel="Sempre tive vontade, mas nunca dei o primeiro passo"
          icon={<HelpCircle className="w-5 h-5" />}
          selected={selected === "nunca"}
          onClick={() => handleSelect("nunca")}
        />
      </div>

      <div className="flex items-center gap-2 justify-center mt-1">
        <BarChart3 className="w-4 h-4 text-primary shrink-0" />
        <p className="text-sm text-muted-foreground text-center">
          <em>68% responderam "Sim, mas não deu certo" — e mesmo assim conseguiram resultados.</em>
        </p>
      </div>
    </StepContainer>
  );
};

export default Step4TriedOnline;
