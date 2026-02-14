import { StepContainer, StepTitle, StepSubtitle, CTAButton } from "./QuizUI";

interface Step11Props {
  onNext: () => void;
}

const Step11SocialProof2 = ({ onNext }: Step11Props) => {
  return (
    <StepContainer>
      <StepTitle>Pessoas como você já estão tendo resultados</StepTitle>

      <div className="w-full space-y-3">
        <div className="funnel-card border-primary/30 bg-primary/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-2xl">
              👨‍🦳
            </div>
            <div>
              <p className="font-bold text-foreground text-sm">Antônio, 58 anos</p>
              <p className="text-xs text-muted-foreground">Aluno verificado ✅</p>
            </div>
          </div>
          <p className="text-sm text-foreground/90 italic leading-relaxed">
            "Eu tinha muito medo de perder dinheiro de novo. Já tinha caído em golpe antes. Mas desta vez foi diferente — comecei devagar, seguindo o passo a passo, e no terceiro dia já tinha feito R$87. Hoje consigo pagar minhas contas com tranquilidade."
          </p>
        </div>

        <div className="funnel-card border-primary/30 bg-primary/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-2xl">
              👩‍🦳
            </div>
            <div>
              <p className="font-bold text-foreground text-sm">Dona Cláudia, 62 anos</p>
              <p className="text-xs text-muted-foreground">Aluna verificada ✅</p>
            </div>
          </div>
          <p className="text-sm text-foreground/90 italic leading-relaxed">
            "Minha aposentadoria não dava pra nada. Hoje complemento com mais R$150 por dia e finalmente durmo sem preocupação. O suporte me ajudou em cada passo."
          </p>
        </div>
      </div>

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
