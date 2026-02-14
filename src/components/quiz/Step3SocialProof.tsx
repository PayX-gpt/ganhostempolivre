import { useState, useEffect } from "react";
import { StepContainer, StepTitle, StepSubtitle, CTAButton, VideoPlaceholder } from "./QuizUI";
import { BarChart3, CheckCircle, Loader2 } from "lucide-react";
import avatarRegina from "@/assets/avatar-regina.jpg";

interface Step3Props {
  onNext: () => void;
}

const Step3SocialProof = ({ onNext }: Step3Props) => {
  const [showCTA, setShowCTA] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowCTA(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <StepContainer>
      <StepTitle>
        Mais de <span className="text-gradient-green">36.000 brasileiros</span> já descobriram como ter uma renda extra segura
      </StepTitle>

      <StepSubtitle>
        Veja o depoimento de quem estava na mesma situação que você — e hoje vive com tranquilidade financeira:
      </StepSubtitle>

      {/* Video testimonial - 50+ person */}
      <VideoPlaceholder label="Depoimento — Dona Márcia, 52 anos (2 min)" />

      <div className="w-full funnel-card border-primary/25 bg-primary/5">
        <div className="flex items-center gap-3 mb-3">
          <img src={avatarRegina} alt="Dona Márcia" className="w-11 h-11 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-primary/30 shrink-0" />
          <div className="min-w-0">
            <p className="font-bold text-foreground text-sm sm:text-base">Dona Márcia, 52 anos</p>
            <div className="flex items-center gap-1">
              <span className="text-xs sm:text-sm text-muted-foreground">Goiânia, GO • Aluna verificada</span>
              <CheckCircle className="w-3.5 h-3.5 text-primary" />
            </div>
          </div>
        </div>
        <p className="text-sm sm:text-base text-foreground/90 italic leading-relaxed">
          "Eu tinha vergonha de pedir dinheiro emprestado todo mês. Minha aposentadoria não cobria nem as contas básicas. Comecei com medo, mas o passo a passo me deu segurança. Hoje tiro R$180 por dia e não dependo mais de ninguém."
        </p>
      </div>

      <div className="w-full funnel-card border-accent/20 bg-accent/5 text-center">
        <div className="flex items-center justify-center gap-2">
          <BarChart3 className="w-4 h-4 text-accent shrink-0" />
          <p className="text-sm text-foreground/80 leading-relaxed">
            <strong>Dado real:</strong> 73% dos nossos alunos acima de 40 anos conseguiram seus primeiros resultados na primeira semana.
          </p>
        </div>
      </div>

      {showCTA ? (
        <CTAButton onClick={onNext} className="animate-fade-in">
          QUERO DESCOBRIR SE É PRA MIM →
        </CTAButton>
      ) : (
        <div className="flex items-center gap-2 justify-center">
          <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
          <p className="text-sm text-muted-foreground animate-pulse">
            Assista o depoimento para continuar...
          </p>
        </div>
      )}
    </StepContainer>
  );
};

export default Step3SocialProof;
