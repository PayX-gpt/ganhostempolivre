import { StepContainer, StepTitle, StepSubtitle, OptionCard } from "./QuizUI";
import { Wallet, PiggyBank, Landmark, TrendingUp, Gem } from "lucide-react";
import { isYoungProfile } from "@/lib/agePersonalization";

interface StepAccountBalanceProps {
  onNext: (value: string) => void;
  userName?: string;
  userAge?: string;
}

const StepAccountBalance = ({ onNext, userName, userAge }: StepAccountBalanceProps) => {
  const firstName = userName?.split(" ")[0];
  const young = isYoungProfile(userAge);

  const options = [
    {
      value: "menos100",
      label: "Menos de R$100",
      sublabel: "Tudo bem — muitos começaram assim",
      icon: <Wallet className="w-5 h-5" />,
    },
    {
      value: "100-500",
      label: "Entre R$100 e R$500",
      sublabel: "Já é o suficiente pra começar",
      icon: <PiggyBank className="w-5 h-5" />,
    },
    {
      value: "500-2000",
      label: "Entre R$500 e R$2.000",
      sublabel: "Ótimo ponto de partida",
      icon: <Landmark className="w-5 h-5" />,
    },
    {
      value: "2000-10000",
      label: "Entre R$2.000 e R$10.000",
      sublabel: "Excelente — mais opções pra você",
      icon: <TrendingUp className="w-5 h-5" />,
    },
    {
      value: "10000+",
      label: "Mais de R$10.000",
      sublabel: "Máximo potencial de retorno",
      icon: <Gem className="w-5 h-5" />,
    },
  ];

  return (
    <StepContainer>
      <StepTitle>
        {firstName ? `${firstName}, última` : "Última"} pergunta antes do seu plano personalizado:
      </StepTitle>
      <StepSubtitle>
        Pra IA montar a <strong className="text-foreground">melhor estratégia pro seu perfil</strong>, 
        preciso saber: quanto você tem disponível hoje pra dar o primeiro passo?
      </StepSubtitle>

      <div className="w-full space-y-3">
        {options.map((opt) => (
          <OptionCard
            key={opt.value}
            label={opt.label}
            sublabel={opt.sublabel}
            icon={opt.icon}
            onClick={() => onNext(opt.value)}
          />
        ))}
      </div>

      <p className="text-xs text-muted-foreground/60 text-center leading-relaxed">
        🔒 Resposta 100% sigilosa — usada apenas pela IA para calibrar seu plano.
      </p>
    </StepContainer>
  );
};

export default StepAccountBalance;
