import { useState } from "react";
import { StepContainer, StepTitle, StepSubtitle, OptionCard } from "./QuizUI";
import couple1825 from "@/assets/couple-18-25.jpg";
import couple2635 from "@/assets/couple-26-35.jpg";
import couple3645 from "@/assets/couple-36-45.jpg";
import couple4655 from "@/assets/couple-46-55.jpg";
import couple56plus from "@/assets/couple-56-plus.jpg";

interface Step2Props {
  onNext: (age: string) => void;
}

const ageOptions = [
  { label: "18 a 25 anos", sublabel: "Nossos alunos dessa faixa ganham em média R$120/dia", imageSrc: couple1825 },
  { label: "26 a 35 anos", sublabel: "Faixa com maior taxa de resultado na primeira semana", imageSrc: couple2635 },
  { label: "36 a 45 anos", sublabel: "Complemento de renda mais buscado nessa faixa", imageSrc: couple3645 },
  { label: "46 a 55 anos", sublabel: "Grupo que mais cresce na plataforma — +340% em 2024", imageSrc: couple4655 },
  { label: "56 anos ou mais", sublabel: "Nosso aluno mais velho tem 72 anos e opera todo dia", imageSrc: couple56plus },
];

const Step2Age = ({ onNext }: Step2Props) => {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (age: string) => {
    setSelected(age);
    // Auto-advance after brief delay for visual feedback
    setTimeout(() => onNext(age), 400);
  };

  return (
    <StepContainer>
      <StepTitle>Para começar, qual é a sua <span className="text-gradient-green">faixa de idade</span>?</StepTitle>
      <StepSubtitle>
        Essa informação nos ajuda a personalizar o plano ideal para o seu perfil.
      </StepSubtitle>

      <div className="w-full space-y-3 mt-2">
        {ageOptions.map((opt) => (
          <OptionCard
            key={opt.label}
            label={opt.label}
            sublabel={opt.sublabel}
            imageSrc={opt.imageSrc}
            selected={selected === opt.label}
            onClick={() => handleSelect(opt.label)}
          />
        ))}
      </div>
    </StepContainer>
  );
};

export default Step2Age;
