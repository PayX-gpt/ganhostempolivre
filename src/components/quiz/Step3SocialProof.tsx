import { useState, useEffect } from "react";
import { StepContainer, StepTitle, StepSubtitle, CTAButton } from "./QuizUI";

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
      <div className="text-center space-y-2">
        <StepTitle>
          Mais de <span className="text-gradient-green">36.000 brasileiros</span> já descobriram como ter uma nova fonte de renda segura
        </StepTitle>
      </div>

      <StepSubtitle>
        Assista esta mensagem especial do nosso especialista — ele pode mudar sua perspectiva sobre ganhar dinheiro online:
      </StepSubtitle>

      {/* Mentor Video placeholder */}
      <div className="w-full aspect-video bg-secondary rounded-xl flex items-center justify-center border border-border overflow-hidden relative">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-primary" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
          </div>
          <p className="text-xs text-muted-foreground">Vídeo do mentor / especialista</p>
        </div>
      </div>

      {showCTA ? (
        <CTAButton onClick={onNext} className="animate-fade-in">
          CONTINUAR →
        </CTAButton>
      ) : (
        <p className="text-xs text-muted-foreground text-center animate-pulse">
          Assista o vídeo para continuar...
        </p>
      )}
    </StepContainer>
  );
};

export default Step3MentorVideo;
