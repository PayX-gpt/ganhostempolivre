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
      sublabel: young ? "Começo com pouco, mas estou decidido(a)" : "Tô apertado, mas quero sair dessa",
      icon: <Wallet className="w-5 h-5" />,
    },
    {
      value: "100-500",
      label: "Entre R$100 e R$500",
      sublabel: "Tenho um pouco guardado",
      icon: <PiggyBank className="w-5 h-5" />,
    },
    {
      value: "500-2000",
      label: "Entre R$500 e R$2.000",
      sublabel: "Tenho uma reserva moderada",
      icon: <Landmark className="w-5 h-5" />,
    },
    {
      value: "2000-10000",
      label: "Entre R$2.000 e R$10.000",
      sublabel: "Tenho uma reserva confortável",
      icon: <TrendingUp className="w-5 h-5" />,
    },
    {
      value: "10000+",
      label: "Mais de R$10.000",
      sublabel: "Tenho capital disponível para investir",
      icon: <Gem className="w-5 h-5" />,
    },
  ];

  return (
    <StepContainer>
      <StepTitle>
        {firstName ? `${firstName}, vamos` : "Vamos"}{" "}
        {young
          ? "ser diretos: quanto você tem disponível para dar o primeiro passo?"
          : "ser sincero(a) agora — consigo mesmo e comigo."}
      </StepTitle>
      <StepSubtitle>
        {young
          ? "Essa informação nos ajuda a criar um plano personalizado para o seu perfil. Não existe valor certo ou errado — o importante é a honestidade."
          : <>Quanto você tem hoje parado na sua conta? Isso vai nos ajudar a traçar um investimento <strong className="text-foreground">personalizado de multiplicação</strong> pra você. De valores maiores a menores — não importa. O importante é a sinceridade.</>}
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
        🔒 Sua resposta é 100% sigilosa e usada apenas para personalizar seu plano.
      </p>
    </StepContainer>
  );
};

export default StepAccountBalance;
