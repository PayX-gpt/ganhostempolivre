import { useState } from "react";
import { StepContainer, StepTitle, StepSubtitle, OptionCard } from "./QuizUI";
import { Frown, ThumbsUp, HelpCircle, BarChart3, ShieldCheck, Zap, Lightbulb } from "lucide-react";
import FeedbackScreen from "./FeedbackScreen";

interface Step4Props {
  onNext: (answer: string) => void;
  userName?: string;
}

const getFeedback = (answer: string, name?: string) => {
  const n = name || "você";
  const messages: Record<string, { eyebrow: string; icon: React.ReactNode; title: string; message: string; highlight: string }> = {
    sim_falhou: {
      eyebrow: "Isso muda agora",
      icon: <ShieldCheck className="w-7 h-7 text-accent" />,
      title: `${n}, o problema nunca foi você.`,
      message: `A internet tá cheia de coisa que parece boa e não entrega nada. Você tentou, perdeu tempo, talvez perdeu dinheiro — e ficou com aquele gosto amargo. Eu entendo. Mas o que eu vou te mostrar aqui é diferente de tudo que você já viu. Não depende de sorte. A tecnologia faz o trabalho. Você só acompanha.`,
      highlight: "Aqui a tecnologia trabalha por você — sem depender de sorte.",
    },
    sim_experiencia: {
      eyebrow: "Próximo nível",
      icon: <Zap className="w-7 h-7 text-accent" />,
      title: `Bom, ${n}. Você já sabe que funciona.`,
      message: `A diferença é que até agora você provavelmente fez tudo sozinho, no braço. Aqui a inteligência artificial cuida de 90% do processo. Você já tem a base — agora imagina o que acontece quando você junta sua experiência com uma tecnologia que trabalha 24 horas sem parar?`,
      highlight: "Sua experiência + IA = resultados que você nunca viu.",
    },
    nunca: {
      eyebrow: "Vantagem sua",
      icon: <Lightbulb className="w-7 h-7 text-accent" />,
      title: `${n}, e sabe o que é curioso?`,
      message: `Quem nunca tentou nada costuma ter os melhores resultados. Parece estranho, mas faz sentido: você não tem vícios, não tem aquele "ah, já sei como funciona". Você começa do zero, segue o passo a passo direitinho, e a coisa acontece. Se você sabe usar o WhatsApp, já sabe o suficiente.`,
      highlight: "Começar do zero é uma vantagem — não uma desvantagem.",
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
        <FeedbackScreen
          eyebrow={fb.eyebrow}
          icon={fb.icon}
          title={fb.title}
          message={fb.message}
          highlight={fb.highlight}
          onNext={() => onNext(selected)}
        />
      );
    }
  }

  return (
    <StepContainer>
      <StepTitle>Você já tentou <span className="text-gradient-green">ganhar dinheiro</span> pela internet antes?</StepTitle>
      <StepSubtitle>
        Seja sincero(a). Não existe resposta errada — sua honestidade nos ajuda a montar o melhor caminho pra você.
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
