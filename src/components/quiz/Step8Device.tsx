import { useState } from "react";
import { StepContainer, StepTitle, StepSubtitle, OptionCard, CTAButton } from "./QuizUI";
import { Smartphone, Laptop, MonitorSmartphone, CheckCircle } from "lucide-react";

interface Step8Props {
  onNext: (answer: string) => void;
  userName?: string;
}

const getFeedback = (answer: string, name?: string) => {
  const n = name || "você";
  const messages: Record<string, { title: string; message: string }> = {
    celular: {
      title: `Perfeito, ${n}!`,
      message: `93% dos nossos alunos usam apenas o celular — e conseguem resultados excelentes. Nosso sistema foi otimizado para funcionar na palma da sua mão. A IA roda na nuvem, então ${n} não precisa de um celular potente — qualquer smartphone serve.`,
    },
    computador: {
      title: `Ótima escolha, ${n}!`,
      message: `A tela grande facilita o acompanhamento, mas saiba que o sistema faz quase tudo sozinho. A inteligência artificial analisa o mercado e sugere as melhores operações — ${n} só precisa confirmar com um clique.`,
    },
    ambos: {
      title: `Isso é uma vantagem, ${n}!`,
      message: `Quem usa celular e computador consegue acompanhar de qualquer lugar. Nosso sistema sincroniza tudo automaticamente — ${n} pode iniciar no computador e acompanhar pelo celular, sem perder nada.`,
    },
  };
  return messages[answer];
};

const Step8Device = ({ onNext, userName }: Step8Props) => {
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
      <StepTitle>Qual aparelho você mais usa no dia a dia?</StepTitle>
      <StepSubtitle>
        O método funciona em qualquer um deles. Não precisa de computador caro nem de internet rápida.
      </StepSubtitle>

      <div className="w-full space-y-3 mt-2">
        <OptionCard
          label="Celular / Smartphone"
          sublabel="Uso o celular para quase tudo"
          icon={<Smartphone className="w-5 h-5" />}
          selected={selected === "celular"}
          onClick={() => handleSelect("celular")}
        />
        <OptionCard
          label="Computador ou Notebook"
          sublabel="Prefiro usar na tela grande"
          icon={<Laptop className="w-5 h-5" />}
          selected={selected === "computador"}
          onClick={() => handleSelect("computador")}
        />
        <OptionCard
          label="Uso os dois"
          sublabel="Celular e computador, depende do momento"
          icon={<MonitorSmartphone className="w-5 h-5" />}
          selected={selected === "ambos"}
          onClick={() => handleSelect("ambos")}
        />
      </div>
    </StepContainer>
  );
};

export default Step8Device;
