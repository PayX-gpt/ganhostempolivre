import { StepContainer, StepTitle, StepSubtitle, CTAButton } from "./QuizUI";

interface Step3Props {
  onNext: () => void;
}

const Step3SocialProof = ({ onNext }: Step3Props) => {
  return (
    <StepContainer>
      <div className="text-center space-y-2">
        <p className="text-3xl font-display font-bold text-gradient-green">36.327</p>
        <StepTitle>alunos já estão lucrando com este método</StepTitle>
      </div>

      <StepSubtitle>
        Veja o depoimento de quem já começou a ter resultados reais:
      </StepSubtitle>

      {/* Video placeholder */}
      <div className="w-full aspect-video bg-secondary rounded-xl flex items-center justify-center border border-border overflow-hidden relative">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-primary" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
          </div>
          <p className="text-xs text-muted-foreground">Depoimento em vídeo</p>
        </div>
      </div>

      <CTAButton onClick={onNext}>
        CONTINUAR →
      </CTAButton>
    </StepContainer>
  );
};

export default Step3SocialProof;
