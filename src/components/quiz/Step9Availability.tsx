import { useState } from "react";
import { StepContainer, StepTitle, StepSubtitle, OptionCard } from "./QuizUI";
import { CheckCircle, XCircle } from "lucide-react";

interface Step9Props {
  onNext: (answer: string) => void;
  userName?: string;
  userAge?: string;
}

const Step9Availability = ({ onNext, userName, userAge }: Step9Props) => {
  const [selected, setSelected] = useState<string | null>(null);
  const firstName = userName?.split(" ")[0] || "";

  const handleSelect = (answer: string) => {
    setSelected(answer);
    setTimeout(() => onNext(answer), 400);
  };

  return (
    <StepContainer>
      <StepTitle>
        {firstName ? `${firstName}, se` : "Se"} a IA precisasse de <span className="text-gradient-green">APENAS 10 minutos</span> seus por dia pra gerar R$100+, você teria esses 10 minutos?
      </StepTitle>
      <StepSubtitle>
        Pode ser no transporte, na pausa do almoço, antes de dormir.
      </StepSubtitle>

      <div className="w-full space-y-3 mt-2">
        <OptionCard
          label="Sim, tenho 10 minutos"
          sublabel="Consigo encaixar isso na minha rotina"
          icon={<CheckCircle className="w-5 h-5" />}
          selected={selected === "sim"}
          onClick={() => handleSelect("sim")}
        />
        <OptionCard
          label="Agora não"
          sublabel="Minha rotina não permite neste momento"
          icon={<XCircle className="w-5 h-5" />}
          selected={selected === "nao"}
          onClick={() => handleSelect("nao")}
        />
      </div>
    </StepContainer>
  );
};

export default Step9Availability;
