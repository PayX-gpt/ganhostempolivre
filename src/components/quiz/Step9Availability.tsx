import { useState } from "react";
import { StepContainer, StepTitle, StepSubtitle, OptionCard } from "./QuizUI";

interface Step9Props {
  onNext: (answer: string) => void;
}

const Step9Availability = ({ onNext }: Step9Props) => {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (answer: string) => {
    setSelected(answer);
    setTimeout(() => onNext(answer), 500);
  };

  return (
    <StepContainer>
      <StepTitle>Quanto tempo livre você tem por dia?</StepTitle>
      <StepSubtitle>
        Nossos alunos com os melhores resultados dedicam em média 15 a 30 minutos. Mas mesmo com 10 minutos, já é possível começar.
      </StepSubtitle>

      <div className="w-full space-y-3 mt-2">
        <OptionCard
          label="Menos de 30 minutos"
          sublabel="Tenho pouquinho tempo, mas quero aproveitar"
          icon="⏱️"
          selected={selected === "menos30"}
          onClick={() => handleSelect("menos30")}
        />
        <OptionCard
          label="30 minutos a 1 hora"
          sublabel="Consigo encaixar no meu dia com tranquilidade"
          icon="🕐"
          selected={selected === "30-60"}
          onClick={() => handleSelect("30-60")}
        />
        <OptionCard
          label="1 a 2 horas"
          sublabel="Tenho um bom tempo livre disponível"
          icon="🕑"
          selected={selected === "1-2h"}
          onClick={() => handleSelect("1-2h")}
        />
        <OptionCard
          label="Mais de 2 horas"
          sublabel="Tenho bastante tempo e quero dedicar"
          icon="🕒"
          selected={selected === "2h+"}
          onClick={() => handleSelect("2h+")}
        />
      </div>
    </StepContainer>
  );
};

export default Step9Availability;
