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
          label: "Ter estabilidade financeira real",
          sublabel: "Pagar as contas com folga e investir no que importa",
          icon: <Banknote className="w-5 h-5" />,
        },
        {
          value: "independencia",
          label: "Construir minha própria fonte de renda",
          sublabel: "Ter autonomia e não depender de um único salário",
          icon: <Briefcase className="w-5 h-5" />,
        },
        {
          value: "valorizado",
          label: "Criar algo do zero com o meu esforço",
          sublabel: "Ver um projeto meu crescer e gerar resultados concretos",
          icon: <Trophy className="w-5 h-5" />,
        },
        {
          value: "familia",
          label: "Poder ajudar quem eu amo",
          sublabel: "Ter condições de cuidar da minha família com tranquilidade",
          icon: <Heart className="w-5 h-5" />,
        },
        {
          value: "liberdade",
          label: "Conquistar liberdade de escolha",
          sublabel: "Ter tempo e recursos para viver do meu jeito",
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
          ? "é a sua principal motivação para construir uma nova fonte de renda?"
          : "o primeiro grande problema que você vai resolver ao ser aceito?"}
      </StepTitle>
      <StepSubtitle>
        Escolha a opção que mais se conecta com o seu momento:
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
