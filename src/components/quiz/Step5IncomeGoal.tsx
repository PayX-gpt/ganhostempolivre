import { useState } from "react";
import { StepContainer, StepTitle, StepSubtitle, OptionCard } from "./QuizUI";
import { Shield, Home, Star, Rocket, Target, TrendingUp, Flame } from "lucide-react";
import FeedbackScreen from "./FeedbackScreen";

interface Step5Props {
  onNext: (answer: string) => void;
  userName?: string;
}

const getFeedback = (answer: string, name?: string) => {
  const n = name || "você";
  const messages: Record<string, { eyebrow: string; icon: React.ReactNode; title: string; message: string; highlight: string }> = {
    "50-100": {
      eyebrow: "Meta realista",
      icon: <Target className="w-7 h-7 text-accent" />,
      title: `Sabe o que são R$50 a R$100 por dia, ${n}?`,
      message: `São R$1.500 a R$3.000 por mês. É aquele valor que paga a conta de luz, o mercado, o remédio — e ainda sobra pra você respirar. Não é sobre ficar rico. É sobre parar de apertar. E é exatamente isso que o sistema entrega pra maioria das pessoas que seguem o passo a passo.`,
      highlight: "R$1.500 a R$3.000/mês — é sobre parar de apertar.",
    },
    "100-300": {
      eyebrow: "Faixa que transforma",
      icon: <TrendingUp className="w-7 h-7 text-accent" />,
      title: `${n}, essa faixa muda a vida de verdade.`,
      message: `R$100 a R$300 por dia é quando a pessoa para de sobreviver e começa a viver. É a faixa onde a maioria dos nossos alunos diz: "agora eu durmo tranquilo". E o mais interessante? É totalmente alcançável com poucos minutos por dia.`,
      highlight: "É a faixa onde nossos alunos dizem: 'agora eu durmo tranquilo'.",
    },
    "300-500": {
      eyebrow: "Ambição inteligente",
      icon: <Rocket className="w-7 h-7 text-accent" />,
      title: `${n}, você sabe o que quer. E isso é raro.`,
      message: `R$300 a R$500 por dia exige um pouco mais de dedicação, mas é perfeitamente possível. A diferença é que aqui a tecnologia escala com você — conforme você ganha confiança, os resultados acompanham. Não é promessa vazia. É matemática.`,
      highlight: "A tecnologia escala com você — mais confiança, mais resultado.",
    },
    "500+": {
      eyebrow: "Mentalidade de crescimento",
      icon: <Flame className="w-7 h-7 text-accent" />,
      title: `${n}, vou ser direto com você.`,
      message: `Mais de R$500 por dia não é pra todo mundo — mas é pra quem se dedica de verdade. Temos alunos nessa faixa. E a maioria começou achando que R$100 já seria muito. O sistema vai crescendo com você. Primeiro a confiança vem, depois os resultados maiores vêm naturalmente.`,
      highlight: "A maioria começou achando que R$100 já seria muito.",
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
      <StepTitle>Quanto você gostaria de <span className="text-gradient-green">ganhar a mais</span> por dia?</StepTitle>
      <StepSubtitle>
        Pense no valor que faria diferença real na sua vida hoje. O que importa é a consistência.
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
          icon={<Star className="w-5 h-5" />}
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
