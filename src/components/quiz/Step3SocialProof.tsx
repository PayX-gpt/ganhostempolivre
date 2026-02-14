import { useState, useEffect } from "react";
import { StepContainer, StepTitle, StepSubtitle, CTAButton, VideoPlaceholder } from "./QuizUI";
import mentorPhoto from "@/assets/mentor-photo.jpg";

interface Step3Props {
  onNext: () => void;
}

const Step3MentorVideo = ({ onNext }: Step3Props) => {
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
          className="w-12 h-12 rounded-full object-cover border-2 border-primary/40 shrink-0"
        />
        <div>
          <p className="font-bold text-foreground text-base">Ricardo Almeida</p>
          <p className="text-sm text-muted-foreground">Especialista em Renda Digital</p>
        </div>
      </div>

      <StepTitle>
        Mais de <span className="text-gradient-green">36.000 brasileiros</span> já descobriram como ter uma renda extra segura
      </StepTitle>

      <StepSubtitle>
        Assista esta mensagem especial — são apenas 2 minutos que podem mudar a forma como você vê sua situação financeira:
      </StepSubtitle>

      <VideoPlaceholder label="Mensagem do Especialista Ricardo (2 min)" />

      <div className="w-full funnel-card border-primary/20 bg-primary/5">
        <p className="text-sm text-foreground/80 text-center leading-relaxed">
          💬 <em>"A maioria dos meus melhores alunos tem mais de 50 anos. Eles não tinham experiência nenhuma com tecnologia. Mesmo assim, conseguiram."</em>
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

export default Step3MentorVideo;
