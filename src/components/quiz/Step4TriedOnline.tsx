import { useState } from "react";
import { StepContainer, StepTitle, StepSubtitle, OptionCard, CTAButton } from "./QuizUI";
import { Frown, ThumbsUp, HelpCircle, CheckCircle, BarChart3 } from "lucide-react";

interface Step4Props {
  onNext: (answer: string) => void;
  userName?: string;
}

const getFeedback = (answer: string, name?: string) => {
  const n = name || "você";
  const messages: Record<string, { title: string; message: string }> = {
    sim_falhou: {
      title: `${n}, isso não foi culpa sua.`,
      message: `A maioria das "oportunidades" na internet são complicadas demais ou simplesmente não funcionam. Nosso sistema é diferente porque usa inteligência artificial de verdade — a mesma tecnologia das maiores empresas do mundo — adaptada para ser simples e acessível. Dessa vez, ${n}, vai ser diferente.`,
    },
    sim_experiencia: {
      title: `Ótimo, ${n}! Sua experiência conta muito.`,
      message: `Quem já tem alguma noção de como a internet funciona consegue resultados ainda mais rápido com o nosso sistema. A diferença aqui é que a IA faz 90% do trabalho — você só precisa acompanhar e ajustar. Vamos potencializar o que você já sabe, ${n}.`,
    },
    nunca: {
      title: `${n}, isso é na verdade uma vantagem!`,
      message: `Pode parecer estranho, mas quem nunca tentou nada costuma ter os melhores resultados. Sabe por quê? Porque não tem vícios de métodos antigos. Nosso sistema foi feito do zero para ser simples — qualquer pessoa consegue usar, mesmo sem experiência nenhuma.`,
    },
  };
  return messages[answer];
};

const Step4TriedOnline = ({ onNext, userName }: Step4Props) => {
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
      <StepTitle>Você já tentou ganhar dinheiro pela internet antes?</StepTitle>
      <StepSubtitle>
        Seja sincero(a). Não existe resposta errada — sua honestidade vai nos ajudar a montar o melhor caminho pra você.
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
          <em>68% dos nossos alunos responderam "Sim, mas não deu certo" — e mesmo assim conseguiram resultados.</em>
        </p>
      </div>
    </StepContainer>
  );
};

export default Step4TriedOnline;
