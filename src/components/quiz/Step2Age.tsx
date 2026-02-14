import { useState } from "react";
import { StepContainer, StepTitle, StepSubtitle, OptionCard, CTAButton } from "./QuizUI";
import { CheckCircle } from "lucide-react";
import couple1825 from "@/assets/couple-18-25.jpg";
import couple2635 from "@/assets/couple-26-35.jpg";
import couple3645 from "@/assets/couple-36-45.jpg";
import couple4655 from "@/assets/couple-46-55.jpg";
import couple56plus from "@/assets/couple-56-plus.jpg";

interface Step2Props {
  onNext: (age: string) => void;
}

const ageOptions = [
  { label: "18 a 25 anos", sublabel: "Início de carreira", imageSrc: couple1825 },
  { label: "26 a 35 anos", sublabel: "Fase de crescimento", imageSrc: couple2635 },
  { label: "36 a 45 anos", sublabel: "Maturidade profissional", imageSrc: couple3645 },
  { label: "46 a 55 anos", sublabel: "Experiência de vida", imageSrc: couple4655 },
  { label: "56 anos ou mais", sublabel: "Sabedoria e experiência", imageSrc: couple56plus },
];

const feedbackMessages: Record<string, { title: string; message: string }> = {
  "18 a 25 anos": {
    title: "Excelente escolha começar cedo!",
    message: "A maioria das pessoas só descobre esse método depois dos 40. Você está saindo na frente. Nosso sistema foi feito para ser simples — independente da sua experiência. Vamos juntos nessa!",
  },
  "26 a 35 anos": {
    title: "Essa é uma fase poderosa!",
    message: "Você está na fase ideal para construir uma renda extra que cresce com o tempo. Nosso sistema aproveita a inteligência artificial para fazer o trabalho pesado — você só precisa dedicar alguns minutos por dia.",
  },
  "36 a 45 anos": {
    title: "Sua experiência é uma vantagem!",
    message: "Com a maturidade que você já tem, aprender o método vai ser mais fácil do que imagina. Nosso sistema é diferente porque não exige conhecimento técnico — a tecnologia trabalha por você.",
  },
  "46 a 55 anos": {
    title: "Você está no perfil ideal!",
    message: "Sabia que a maioria dos nossos alunos com melhores resultados tem entre 46 e 55 anos? Sua experiência de vida é uma vantagem real. O sistema foi desenhado pensando em pessoas como você — simples, direto e sem complicação.",
  },
  "56 anos ou mais": {
    title: "Sua sabedoria é o seu maior ativo!",
    message: "Mais de 60% dos nossos alunos acima de 56 anos nunca tinham usado tecnologia para ganhar dinheiro. Mesmo assim, conseguiram resultados reais na primeira semana. Nosso sistema faz o trabalho pesado — você só acompanha.",
  },
};

const Step2Age = ({ onNext }: Step2Props) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const handleSelect = (age: string) => {
    setSelected(age);
    setShowFeedback(true);
  };

  if (showFeedback && selected) {
    const fb = feedbackMessages[selected];
    return (
      <StepContainer>
        <div className="w-full flex flex-col items-center gap-5 py-4">
          <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center border-2 border-primary/30">
            <CheckCircle className="w-8 h-8 text-primary" />
          </div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground text-center leading-snug">
            {fb.title}
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground text-center leading-relaxed max-w-md">
            {fb.message}
          </p>
          <div className="w-full mt-2">
            <CTAButton onClick={() => onNext(selected)}>
              Continuar →
            </CTAButton>
          </div>
        </div>
      </StepContainer>
    );
  }

  return (
    <StepContainer>
      <StepTitle>Para começar, qual é a sua faixa de idade?</StepTitle>
      <StepSubtitle>
        Essa informação nos ajuda a personalizar o plano ideal para o seu perfil. Não existe idade errada para começar.
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
