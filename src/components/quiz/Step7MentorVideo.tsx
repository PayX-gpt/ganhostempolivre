import { useState, useEffect } from "react";
import { StepContainer, StepTitle, StepSubtitle, CTAButton, VideoPlaceholder } from "./QuizUI";
import mentorPhoto from "@/assets/mentor-photo.jpg";

interface Step7Props {
  onNext: () => void;
}

const Step7MentorVideo = ({ onNext }: Step7Props) => {
  const [showCTA, setShowCTA] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowCTA(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <StepContainer>
      <div className="flex items-center gap-3 w-full">
        <img
          src={mentorPhoto}
          alt="Especialista Ricardo"
          className="w-14 h-14 rounded-full object-cover border-2 border-primary/40 shrink-0"
        />
        <div>
          <p className="font-bold text-foreground text-base">Ricardo Almeida</p>
          <p className="text-sm text-muted-foreground">Especialista em Renda Digital</p>
        </div>
      </div>

      <StepTitle>
        Uma mensagem especial do nosso <span className="text-gradient-green">especialista</span> para você
      </StepTitle>

      <StepSubtitle>
        Ricardo já ajudou mais de 36.000 pessoas a conquistarem segurança financeira. Ouça o que ele tem a dizer — são apenas 3 minutos:
      </StepSubtitle>

      <VideoPlaceholder label="Mensagem do Especialista Ricardo (3 min)" />

      <div className="w-full funnel-card border-primary/20 bg-primary/5">
        <p className="text-sm text-foreground/80 text-center leading-relaxed italic">
          💬 "A maioria dos meus melhores alunos tem mais de 50 anos. Eles não tinham experiência nenhuma com tecnologia. Mesmo assim, conseguiram. Se eles conseguiram, você também consegue."
        </p>
      </div>

      {showCTA ? (
        <CTAButton onClick={onNext} className="animate-fade-in">
          ENTENDI, QUERO CONTINUAR →
        </CTAButton>
      ) : (
        <p className="text-sm text-muted-foreground text-center animate-pulse">
          ⏳ Assista o vídeo para continuar...
        </p>
      )}
    </StepContainer>
  );
};

export default Step7MentorVideo;
