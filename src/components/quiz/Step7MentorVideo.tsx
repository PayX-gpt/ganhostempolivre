import { useState, useEffect } from "react";
import { StepContainer, StepTitle, StepSubtitle, CTAButton } from "./QuizUI";

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
      <StepTitle>Uma mensagem especial para você</StepTitle>
      <StepSubtitle>
        Assista este vídeo curto — ele pode mudar sua perspectiva sobre ganhar dinheiro online.
      </StepSubtitle>

      {/* Video placeholder */}
      <div className="w-full aspect-video bg-secondary rounded-xl flex items-center justify-center border border-border overflow-hidden relative">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-primary" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
          </div>
          <p className="text-xs text-muted-foreground">Vídeo do mentor</p>
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

export default Step7MentorVideo;
