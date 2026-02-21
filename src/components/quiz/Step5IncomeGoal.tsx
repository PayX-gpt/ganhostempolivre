import { useState } from "react";
import { StepContainer, StepTitle, StepSubtitle, OptionCard, CTAButton } from "./QuizUI";
import { Shield, CheckCircle, Home, Star } from "lucide-react";
import { isYoungProfile } from "@/lib/agePersonalization";

interface Step5Props {
  onNext: (answer: string) => void;
  userName?: string;
  userAge?: string;
}

const getFeedback = (answer: string, name?: string) => {
  const n = name || "você";
  const messages: Record<string, { title: string; message: string }> = {
    "50-100": {
      title: `Sabe o que são R$50 a R$100 por dia, ${n}?`,
      message: `São R$1.500 a R$3.000 por mês. É aquele valor que paga a conta de luz, o mercado, o remédio — e ainda sobra pra você respirar. Não é sobre ficar rico. É sobre parar de apertar. E é exatamente isso que o sistema entrega pra maioria das pessoas que seguem o passo a passo.`,
    },
    "100-300": {
      title: `${n}, essa faixa muda a vida de verdade.`,
      message: `R$100 a R$300 por dia é quando a pessoa para de sobreviver e começa a viver. É a faixa onde a maioria dos nossos alunos diz: "agora eu durmo tranquilo". E o mais interessante? É totalmente alcançável com poucos minutos por dia. Não precisa largar o que faz hoje — é um complemento que faz diferença real.`,
    },
    "300-500": {
      title: `${n}, você sabe o que quer. E isso é raro.`,
      message: `R$300 a R$500 por dia exige um pouco mais de dedicação, mas é perfeitamente possível. A diferença é que aqui a tecnologia escala com você — conforme você ganha confiança, os resultados acompanham. Não é promessa vazia. É matemática: mais tempo no sistema, mais oportunidades a IA encontra.`,
    },
    "500+": {
      title: `${n}, vou ser direto com você.`,
      message: `Mais de R$500 por dia não é pra todo mundo — mas é pra quem se dedica de verdade. Temos alunos nessa faixa, sim. E a maioria começou achando que R$100 já seria muito. O sistema vai crescendo com você. Primeiro a confiança vem, depois os resultados maiores vêm naturalmente.`,
    },
  };
  return messages[answer];
};

const Step5IncomeGoal = ({ onNext, userName, userAge }: Step5Props) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const young = isYoungProfile(userAge);

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
      <StepTitle>Quanto você gostaria de <span className="text-gradient-green">ganhar a mais</span> por dia?</StepTitle>
      <StepSubtitle>
        {young
          ? "Pense no valor que te daria mais liberdade pra fazer o que você quer. Consistência é a chave."
          : "Pense no valor que faria diferença real na sua vida hoje. O que importa é a consistência."}
      </StepSubtitle>

      <div className="w-full space-y-3 mt-2">
        <OptionCard
          label="R$50 a R$100 por dia"
          sublabel={young ? "Para ter mais liberdade e bancar seus hobbies" : "O suficiente para pagar contas e ter paz"}
          icon={<Shield className="w-5 h-5" />}
          selected={selected === "50-100"}
          onClick={() => handleSelect("50-100")}
        />
        <OptionCard
          label="R$100 a R$300 por dia"
          sublabel={young ? "Uma grana extra para investir em você, viajar ou realizar aquele sonho" : "Uma renda extra que traz segurança real"}
          icon={<CheckCircle className="w-5 h-5" />}
          selected={selected === "100-300"}
          onClick={() => handleSelect("100-300")}
        />
        <OptionCard
          label="R$300 a R$500 por dia"
          sublabel={young ? "O boost que você precisa para mudar de vida e conquistar independência" : "O valor que muda o padrão de vida da família"}
          icon={<Home className="w-5 h-5" />}
          selected={selected === "300-500"}
          onClick={() => handleSelect("300-500")}
        />
        <OptionCard
          label="Mais de R$500 por dia"
          sublabel={young ? "Construir algo grande e viver a vida dos seus sonhos" : "Quero construir algo maior para minha família"}
          icon={<Star className="w-5 h-5" />}
          selected={selected === "500+"}
          onClick={() => handleSelect("500+")}
        />
      </div>
    </StepContainer>
  );
};

export default Step5IncomeGoal;
