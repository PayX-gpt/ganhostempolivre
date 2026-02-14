import { useState } from "react";
import { StepContainer, StepTitle, StepSubtitle, OptionCard, CTAButton } from "./QuizUI";
import { Shield, CheckCircle, Home, Star } from "lucide-react";

interface Step5Props {
  onNext: (answer: string) => void;
  userName?: string;
}

const getFeedback = (answer: string, name?: string) => {
  const n = name || "você";
  const messages: Record<string, { title: string; message: string }> = {
    "50-100": {
      title: `${n}, essa meta é muito alcançável!`,
      message: `R$50 a R$100 por dia pode parecer pouco, mas são R$1.500 a R$3.000 por mês — o suficiente para pagar contas com tranquilidade. Nosso sistema foi feito exatamente para entregar esse tipo de resultado de forma consistente, sem riscos desnecessários.`,
    },
    "100-300": {
      title: `Perfeito, ${n}! Essa é a meta mais comum.`,
      message: `A maioria dos nossos alunos que atinge R$100 a R$300 por dia diz que foi o momento em que a vida mudou de verdade. É o valor que traz segurança real — e nosso sistema é calibrado para entregar isso com apenas alguns minutos por dia.`,
    },
    "300-500": {
      title: `${n}, você pensa grande — e isso é bom!`,
      message: `R$300 a R$500 por dia é totalmente possível com dedicação. O diferencial do nosso sistema é que a inteligência artificial escala junto com você — quanto mais você opera, mais ela aprende e otimiza os resultados.`,
    },
    "500+": {
      title: `${n}, esse é um objetivo ambicioso — e realista!`,
      message: `Temos alunos que ultrapassam R$500 por dia. A chave? Constância e confiança no sistema. A IA trabalha 24 horas para identificar as melhores oportunidades — você só precisa acompanhar e confirmar. Vamos construir isso juntos!`,
    },
  };
  return messages[answer];
};

const Step5IncomeGoal = ({ onNext, userName }: Step5Props) => {
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
      <StepTitle>Quanto você gostaria de ganhar a mais por dia?</StepTitle>
      <StepSubtitle>
        Pense no valor que faria diferença real na sua vida hoje. Não precisa ser um número gigante — o que importa é a consistência.
      </StepSubtitle>

      <div className="w-full space-y-3 mt-2">
        <OptionCard
          label="R$50 a R$100 por dia"
          sublabel="O suficiente para pagar contas e ter paz"
          icon={<Shield className="w-5 h-5" />}
          selected={selected === "50-100"}
          onClick={() => handleSelect("50-100")}
        />
        <OptionCard
          label="R$100 a R$300 por dia"
          sublabel="Uma renda extra que traz segurança real"
          icon={<CheckCircle className="w-5 h-5" />}
          selected={selected === "100-300"}
          onClick={() => handleSelect("100-300")}
        />
        <OptionCard
          label="R$300 a R$500 por dia"
          sublabel="O valor que muda o padrão de vida da família"
          icon={<Home className="w-5 h-5" />}
          selected={selected === "300-500"}
          onClick={() => handleSelect("300-500")}
        />
        <OptionCard
          label="Mais de R$500 por dia"
          sublabel="Quero construir algo maior para minha família"
          icon={<Star className="w-5 h-5" />}
          selected={selected === "500+"}
          onClick={() => handleSelect("500+")}
        />
      </div>
    </StepContainer>
  );
};

export default Step5IncomeGoal;
