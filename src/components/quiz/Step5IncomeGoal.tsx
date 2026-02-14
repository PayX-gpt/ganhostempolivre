import { useState } from "react";
import { StepContainer, StepTitle, StepSubtitle, OptionCard } from "./QuizUI";
import { Shield, CheckCircle, Home, Star } from "lucide-react";

interface Step5Props {
  onNext: (answer: string) => void;
}

const Step5IncomeGoal = ({ onNext }: Step5Props) => {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (answer: string) => {
    setSelected(answer);
    setTimeout(() => onNext(answer), 500);
  };

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
