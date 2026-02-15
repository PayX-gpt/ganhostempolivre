import { useState } from "react";
import { StepContainer, StepTitle, StepSubtitle, OptionCard } from "./QuizUI";
import { Users, TrendingUp, Award, Heart, Star } from "lucide-react";
import FeedbackScreen from "./FeedbackScreen";
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

const feedbackMessages: Record<string, { eyebrow: string; icon: React.ReactNode; title: string; message: string; highlight: string }> = {
  "18 a 25 anos": {
    eyebrow: "Visão de futuro",
    icon: <TrendingUp className="w-7 h-7 text-accent" />,
    title: "Pouca gente começa tão cedo. E isso é bom pra você.",
    message: "Enquanto a maioria só descobre isso lá pelos 40, depois de muito perrengue, você tem a chance de construir essa base agora. O sistema é tão simples que a idade nem importa — o que importa é dar o primeiro passo. E você já tá dando.",
    highlight: "Comece agora e construa sua base antes de todo mundo.",
  },
  "26 a 35 anos": {
    eyebrow: "Momento ideal",
    icon: <Award className="w-7 h-7 text-accent" />,
    title: "Fase boa pra construir algo sólido.",
    message: "Você tá naquele ponto da vida onde ainda dá tempo de montar uma renda extra antes de realmente precisar dela. A maioria das pessoas só corre atrás quando a água bate no pescoço. Você tá se antecipando — e isso faz toda a diferença.",
    highlight: "Se antecipar é o que separa quem conquista de quem corre atrás.",
  },
  "36 a 45 anos": {
    eyebrow: "Experiência que conta",
    icon: <Users className="w-7 h-7 text-accent" />,
    title: "Sabe o que faz diferença na sua idade?",
    message: "Você já passou por muita coisa. Já viu promessa que não se cumpriu. E é exatamente por isso que esse sistema funciona tão bem pra quem tem sua vivência — porque ele não pede que você acredite cegamente. Ele te mostra o resultado primeiro. Você decide depois.",
    highlight: "O sistema prova antes — você decide depois.",
  },
  "46 a 55 anos": {
    eyebrow: "Perfil de resultado",
    icon: <Star className="w-7 h-7 text-accent" />,
    title: "Você tá exatamente no perfil que mais gera resultado.",
    message: "Não é papo de venda, é estatística. As pessoas entre 46 e 55 anos são as que mais se dedicam e mais colhem resultado. Sabe por quê? Porque não tão atrás de ficarem ricas da noite pro dia. Querem pagar as contas com dignidade. E é isso que o sistema entrega.",
    highlight: "Sua faixa etária é a que mais gera resultado no sistema.",
  },
  "56 anos ou mais": {
    eyebrow: "Sabedoria que transforma",
    icon: <Heart className="w-7 h-7 text-accent" />,
    title: "Deixa eu te falar uma coisa com sinceridade.",
    message: "Muita gente na sua faixa de idade acha que 'já passou da hora'. Mas os nossos melhores resultados vêm justamente de pessoas com 56, 60, 65 anos. Gente que nunca mexeu com nada online — mas que seguiu o passo a passo e hoje dorme tranquila sabendo que tem uma renda entrando todo dia.",
    highlight: "Os melhores resultados vêm de quem tem mais de 56 anos.",
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
      <FeedbackScreen
        eyebrow={fb.eyebrow}
        icon={fb.icon}
        title={fb.title}
        message={fb.message}
        highlight={fb.highlight}
        onNext={() => onNext(selected)}
      />
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
