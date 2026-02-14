import { useState, useEffect } from "react";
import { StepContainer, StepTitle, StepSubtitle, CTAButton, VideoPlaceholder } from "./QuizUI";
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
      <VideoPlaceholder label="Depoimento — Dona Márcia, 56 anos (2 min)" />

      <div className="w-full funnel-card border-primary/25 bg-primary/5">
        <div className="flex items-center gap-3 mb-3">
          <img src={avatarRegina} alt="Dona Márcia" className="w-12 h-12 rounded-full object-cover border-2 border-primary/30 shrink-0" />
          <div>
            <p className="font-bold text-foreground text-base">Dona Márcia, 56 anos</p>
            <p className="text-sm text-muted-foreground">Goiânia, GO • Aluna verificada ✅</p>
          </div>
        </div>
        <p className="text-base text-foreground/90 italic leading-relaxed">
          "Eu tinha vergonha de pedir dinheiro emprestado todo mês. Minha aposentadoria não cobria nem as contas básicas. Comecei com medo, mas o passo a passo me deu segurança. Hoje tiro R$180 por dia e não dependo mais de ninguém."
        </p>
      </div>

      <div className="w-full funnel-card border-accent/20 bg-accent/5 text-center">
        <p className="text-sm text-foreground/80 leading-relaxed">
          📊 <strong>Dado real:</strong> 73% dos nossos alunos acima de 50 anos conseguiram seus primeiros resultados na primeira semana.
        </p>
      </div>

      {showCTA ? (
        <CTAButton onClick={onNext} className="animate-fade-in">
          QUERO DESCOBRIR SE É PRA MIM →
        </CTAButton>
      ) : (
        <p className="text-sm text-muted-foreground text-center animate-pulse">
          ⏳ Assista o depoimento para continuar...
        </p>
      )}
    </StepContainer>
  );
};

export default Step3SocialProof;
