import { StepContainer, StepTitle, StepSubtitle, CTAButton } from "./QuizUI";

interface Step11Props {
  onNext: () => void;
}

const Step11SocialProof2 = ({ onNext }: Step11Props) => {
  return (
    <StepContainer>
      <div className="w-full funnel-card border-primary/30 bg-primary/5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-2xl">
            👨‍🦳
          </div>
          <div>
            <p className="font-bold text-foreground text-sm">Depoimento Real</p>
            <p className="text-xs text-muted-foreground">Aluno verificado ✅</p>
          </div>
        </div>
        <p className="text-sm text-foreground/90 italic leading-relaxed">
          "Eu tinha muito medo de perder dinheiro de novo. Já tinha caído em golpe antes. Mas desta vez foi diferente — comecei devagar, seguindo o passo a passo, e no terceiro dia já tinha feito R$87. Hoje consigo pagar minhas contas com tranquilidade."
        </p>
      </div>

      <StepTitle>Pessoas como você já estão tendo resultados</StepTitle>

      <StepSubtitle>
        Você merece terminar cada mês com a tranquilidade de quem tem as contas pagas e dinheiro sobrando. Chega de viver no limite.
      </StepSubtitle>

      <CTAButton onClick={onNext}>
        QUERO VER MEUS RESULTADOS →
      </CTAButton>
    </StepContainer>
  );
};

export default Step11SocialProof2;
