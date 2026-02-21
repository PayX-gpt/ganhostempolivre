import { StepContainer, StepTitle, StepSubtitle, OptionCard } from "./QuizUI";
import { Banknote, Briefcase, Trophy, Heart, Sun } from "lucide-react";
import { isYoungProfile } from "@/lib/agePersonalization";

interface StepFinancialDreamProps {
  onNext: (value: string) => void;
  userName?: string;
  userAge?: string;
}

const StepFinancialDream = ({ onNext, userName, userAge }: StepFinancialDreamProps) => {
  const firstName = userName?.split(" ")[0];
  const young = isYoungProfile(userAge);

  const options = young
    ? [
        {
          value: "contas",
          label: "Ter grana pra tudo sem perrengue",
          sublabel: "Pagar as contas e ainda sobrar pra curtir",
          icon: <Banknote className="w-5 h-5" />,
        },
        {
          value: "independencia",
          label: "Ser meu próprio patrão",
          sublabel: "Dizer adeus ao chefe e construir algo meu",
          icon: <Briefcase className="w-5 h-5" />,
        },
        {
          value: "valorizado",
          label: "Construir algo do zero",
          sublabel: "Ver o resultado do meu próprio esforço crescer",
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
          label: "Viver a vida que eu sempre quis",
          sublabel: "Com tempo e liberdade para fazer o que amo",
          icon: <Sun className="w-5 h-5" />,
        },
      ]
    : [
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
        {firstName ? `${firstName}, qual` : "Qual"}{" "}
        {young
          ? "a sua maior motivação para começar a gerar renda extra?"
          : "o primeiro grande problema que você vai resolver ao ser aceito?"}
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
