import { useState } from "react";
import { StepContainer, StepTitle, StepSubtitle, OptionCard, CTAButton } from "./QuizUI";
import { Frown, ThumbsUp, HelpCircle, CheckCircle, BarChart3 } from "lucide-react";
import { isYoungProfile } from "@/lib/agePersonalization";

interface Step4Props {
  onNext: (answer: string) => void;
  userName?: string;
  userAge?: string;
}

const getFeedback = (answer: string, name?: string, young?: boolean) => {
  const n = name || "você";
  if (young) {
    const messages: Record<string, { title: string; message: string }> = {
      sim_falhou: {
        title: `${n}, o problema não foi você — foi o método.`,
        message: `A internet está cheia de promessas vazias: cursos sem suporte, métodos desatualizados, esquemas que não entregam resultado. Se não funcionou antes, é porque você ainda não tinha acesso à tecnologia certa. O que vou te mostrar aqui é diferente — uma inteligência artificial que faz o trabalho pesado por você. Sem complicação, sem precisar de experiência prévia.`,
      },
      sim_experiencia: {
        title: `Excelente, ${n}. Você já tem uma vantagem real.`,
        message: `Quem já colocou a mão na massa sabe que resultado online é possível. A diferença agora é que você vai contar com uma inteligência artificial fazendo 90% do trabalho. Imagine unir a sua experiência com uma tecnologia que opera 24 horas por dia. Os resultados vão surpreender.`,
      },
      nunca: {
        title: `${n}, começar do zero é na verdade uma vantagem.`,
        message: `Quem nunca tentou começa sem vícios e sem medo de repetir erros antigos. Você vai seguir um passo a passo claro, do zero, e ver resultado rapidamente. Se sabe usar o celular, já tem o que precisa. É mais simples do que parece.`,
      },
    };
    return messages[answer];
  }
  const messages: Record<string, { title: string; message: string }> = {
    sim_falhou: {
      title: `${n}, eu preciso te dizer uma coisa.`,
      message: `Se não deu certo antes, o problema não foi você. A internet tá cheia de coisa que parece boa e não entrega nada. Você tentou, perdeu tempo, talvez perdeu dinheiro — e ficou com aquele gosto amargo. Eu entendo. Mas o que eu vou te mostrar aqui é diferente de tudo que você já viu. Não depende de sorte, não depende de você saber mexer em nada. A tecnologia faz o trabalho. Você só acompanha.`,
    },
    sim_experiencia: {
      title: `Bom, ${n}. Então você já sabe que funciona.`,
      message: `A diferença é que até agora você provavelmente fez tudo sozinho, no braço. Aqui a inteligência artificial cuida de 90% do processo. Você já tem a base — agora imagina o que acontece quando você junta sua experiência com uma tecnologia que trabalha 24 horas sem parar? Os resultados aceleram de um jeito que você vai se perguntar por que não encontrou isso antes.`,
    },
    nunca: {
      title: `${n}, e sabe o que é curioso?`,
      message: `Quem nunca tentou nada costuma ter os melhores resultados. Parece estranho, mas faz sentido: você não tem vícios, não tem aquele "ah, já sei como funciona". Você começa do zero, segue o passo a passo direitinho, e a coisa acontece. Não precisa entender de tecnologia. Se você sabe usar o WhatsApp, já sabe o suficiente.`,
    },
  };
  return messages[answer];
};

const Step4TriedOnline = ({ onNext, userName, userAge }: Step4Props) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const young = isYoungProfile(userAge);

  const handleSelect = (answer: string) => {
    setSelected(answer);
    setShowFeedback(true);
  };

  if (showFeedback && selected) {
    const fb = getFeedback(selected, userName, young);
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
