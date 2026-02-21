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
  { label: "18 a 25 anos", sublabel: "Início da jornada: construindo sua independência", imageSrc: couple1825 },
  { label: "26 a 35 anos", sublabel: "Acelerando o crescimento e novas conquistas", imageSrc: couple2635 },
  { label: "36 a 45 anos", sublabel: "Maturidade profissional", imageSrc: couple3645 },
  { label: "46 a 55 anos", sublabel: "Experiência de vida", imageSrc: couple4655 },
  { label: "56 anos ou mais", sublabel: "Sabedoria e experiência", imageSrc: couple56plus },
];

const feedbackMessages: Record<string, { title: string; message: string }> = {
  "18 a 25 anos": {
    title: "Excelente decisão. Poucos começam tão cedo.",
    message: "A maioria das pessoas só começa a pensar em independência financeira depois dos 30. Você está saindo na frente — e isso faz toda a diferença. Nosso método foi desenhado para funcionar com pouco tempo e sem experiência prévia. O primeiro passo já foi dado.",
  },
  "26 a 35 anos": {
    title: "Este é o momento ideal para acelerar.",
    message: "Você está numa fase em que cada decisão inteligente tem um impacto desproporcional no seu futuro. A maioria só acorda para isso depois dos 40. Você tem a vantagem de construir agora, com uma tecnologia que trabalha por você. Vamos montar o caminho certo para o seu perfil.",
  },
  "36 a 45 anos": {
    title: "Sabe o que faz diferença na sua idade?",
    message: "Você já passou por muita coisa. Já viu promessa que não se cumpriu. E é exatamente por isso que esse sistema funciona tão bem pra quem tem sua vivência — porque ele não pede que você acredite cegamente. Ele te mostra o resultado primeiro. Você decide depois.",
  },
  "46 a 55 anos": {
    title: "Você tá exatamente no perfil que mais gera resultado aqui.",
    message: "Não é papo de venda, é estatística. As pessoas entre 46 e 55 anos são as que mais se dedicam e mais colhem resultado. Sabe por quê? Porque não tão atrás de ficarem ricas da noite pro dia. Querem pagar as contas com dignidade. E é isso que o sistema entrega.",
  },
  "56 anos ou mais": {
    title: "Deixa eu te falar uma coisa com sinceridade.",
    message: "Muita gente na sua faixa de idade acha que 'já passou da hora'. Mas os nossos melhores resultados vêm justamente de pessoas com 56, 60, 65 anos. Gente que nunca mexeu com nada online — mas que seguiu o passo a passo e hoje dorme tranquila sabendo que tem uma renda entrando todo dia.",
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
