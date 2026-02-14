import { StepContainer, StepTitle, StepSubtitle, OptionCard } from "./QuizUI";
import { Banknote, Briefcase, Trophy, Heart, Sun } from "lucide-react";

interface StepFinancialDreamProps {
  onNext: (value: string) => void;
  userName?: string;
}

const StepFinancialDream = ({ onNext, userName }: StepFinancialDreamProps) => {
  const firstName = userName?.split(" ")[0];

  const options = [
    {
      value: "contas",
      label: "Pagar todas as contas sem sufoco",
      sublabel: "E ainda sobrar no fim do mês",
      icon: <Banknote className="w-5 h-5" />,
    },
    {
      value: "independencia",
      label: "Sair do meu trabalho atual",
      sublabel: "Focar 100% em mim e no meu negócio",
      icon: <Briefcase className="w-5 h-5" />,
    },
    {
      value: "valorizado",
      label: "Me sentir valorizado por algo MEU",
      sublabel: "Ver minha conta subir com meu próprio esforço",
      icon: <Trophy className="w-5 h-5" />,
    },
    {
      value: "familia",
      label: "Cuidar melhor da minha família",
      sublabel: "Sem depender de ninguém",
      icon: <Heart className="w-5 h-5" />,
    },
    {
      value: "liberdade",
      label: "Quero tempo e liberdade",
      sublabel: "Pra viver — não apenas pra pagar conta",
      icon: <Sun className="w-5 h-5" />,
    },
  ];

  return (
    <StepContainer>
      <StepTitle>
        {firstName ? `${firstName}, ao` : "Ao"} ser aceito, qual o primeiro grande problema que você vai resolver?
      </StepTitle>
      <StepSubtitle>
        Escolha uma única opção abaixo:
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
    </StepContainer>
  );
};

export default StepFinancialDream;
