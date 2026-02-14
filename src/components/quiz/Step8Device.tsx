import { useState } from "react";
import { StepContainer, StepTitle, StepSubtitle, OptionCard } from "./QuizUI";
import { Smartphone, Laptop, MonitorSmartphone, CheckCircle } from "lucide-react";

interface Step8Props {
  onNext: (answer: string) => void;
}

const Step8Device = ({ onNext }: Step8Props) => {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (answer: string) => {
    setSelected(answer);
    setTimeout(() => onNext(answer), 500);
  };

  return (
    <StepContainer>
      <StepTitle>Qual aparelho você mais usa no dia a dia?</StepTitle>
      <StepSubtitle>
        O método funciona em qualquer um deles. Não precisa de computador caro nem de internet rápida.
      </StepSubtitle>

      <div className="w-full space-y-3 mt-2">
        <OptionCard
          label="Celular / Smartphone"
          sublabel="Uso o celular para quase tudo"
          icon={<Smartphone className="w-5 h-5" />}
          selected={selected === "celular"}
          onClick={() => handleSelect("celular")}
        />
        <OptionCard
          label="Computador ou Notebook"
          sublabel="Prefiro usar na tela grande"
          icon={<Laptop className="w-5 h-5" />}
          selected={selected === "computador"}
          onClick={() => handleSelect("computador")}
        />
        <OptionCard
          label="Uso os dois"
          sublabel="Celular e computador, depende do momento"
          icon={<MonitorSmartphone className="w-5 h-5" />}
          selected={selected === "ambos"}
          onClick={() => handleSelect("ambos")}
        />
      </div>

      <div className="flex items-center gap-2 justify-center mt-1">
        <CheckCircle className="w-4 h-4 text-primary shrink-0" />
        <p className="text-sm text-muted-foreground text-center">
          <em>93% dos nossos alunos acima de 50 anos usam apenas o celular — e conseguem resultados normalmente.</em>
        </p>
      </div>
    </StepContainer>
  );
};

export default Step8Device;
