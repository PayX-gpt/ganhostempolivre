import { useState } from "react";
import { StepContainer, StepTitle, StepSubtitle, OptionCard } from "./QuizUI";
import { Shield, CheckCircle, Home, Star } from "lucide-react";
import { isYoungProfile } from "@/lib/agePersonalization";

interface Step5Props {
  onNext: (answer: string) => void;
  userName?: string;
  userAge?: string;
}

const Step5IncomeGoal = ({ onNext, userName, userAge }: Step5Props) => {
  const [selected, setSelected] = useState<string | null>(null);
  const young = isYoungProfile(userAge);

  const handleSelect = (answer: string) => {
    setSelected(answer);
    setTimeout(() => onNext(answer), 400);
  };

  return (
    <StepContainer>
      <StepTitle>Quanto você gostaria de <span className="text-gradient-green">ganhar a mais</span> por dia?</StepTitle>
      <StepSubtitle>
        Escolha a faixa que faria diferença real na sua vida hoje.
      </StepSubtitle>

      <div className="w-full space-y-3 mt-2">
        <OptionCard
          label="R$50 a R$100 por dia"
          sublabel="= R$1.500 a R$3.000/mês. Paga aluguel, carro, mercado."
          icon={<Shield className="w-5 h-5" />}
          selected={selected === "50-100"}
          onClick={() => handleSelect("50-100")}
        />
        <OptionCard
          label="R$100 a R$300 por dia"
          sublabel="= R$3.000 a R$9.000/mês. Muda de vida."
          icon={<CheckCircle className="w-5 h-5" />}
          selected={selected === "100-300"}
          onClick={() => handleSelect("100-300")}
        />
        <OptionCard
          label="R$300 a R$500 por dia"
          sublabel="= R$9.000 a R$15.000/mês. Liberdade total."
          icon={<Home className="w-5 h-5" />}
          selected={selected === "300-500"}
          onClick={() => handleSelect("300-500")}
        />
        <OptionCard
          label="Mais de R$500 por dia"
          sublabel="= +R$15.000/mês. Outro nível."
          icon={<Star className="w-5 h-5" />}
          selected={selected === "500+"}
          onClick={() => handleSelect("500+")}
        />
      </div>
    </StepContainer>
  );
};

export default Step5IncomeGoal;
