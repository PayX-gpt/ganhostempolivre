import { useState, useEffect } from "react";
import { StepContainer, StepTitle, StepSubtitle, CTAButton } from "./QuizUI";

interface Step13Props {
  userName?: string;
}

const Step13Offer = ({ userName }: Step13Props) => {
  const [showCTA, setShowCTA] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600);

  useEffect(() => {
    const timer = setTimeout(() => setShowCTA(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const countdown = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(countdown);
  }, []);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <StepContainer>
      {/* Timer */}
      <div className="w-full funnel-card border-destructive/40 bg-destructive/5 text-center">
        <p className="text-xs text-destructive font-bold">⏰ OFERTA EXPIRA EM</p>
        <p className="text-2xl font-display font-bold text-foreground mt-1">
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </p>
      </div>

      <div className="text-center space-y-2">
        <StepTitle>
          {userName ? `${userName}, seu acesso está pronto!` : "Seu acesso está pronto!"}
        </StepTitle>
        <StepSubtitle>
          A plataforma que te guia para gerar uma renda extra segura, todos os dias.
        </StepSubtitle>
      </div>

      {/* Video placeholder */}
      <div className="w-full aspect-video bg-secondary rounded-xl flex items-center justify-center border border-border overflow-hidden relative">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-primary" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
          </div>
          <p className="text-xs text-muted-foreground">Vídeo de apresentação da plataforma</p>
        </div>
      </div>

      {/* Benefits */}
      <div className="w-full space-y-2 mt-2">
        {[
          "✅ Acesso completo à plataforma",
          "✅ Suporte passo a passo em tempo real",
          "✅ Comunidade exclusiva de alunos",
          "✅ Acompanhamento personalizado",
          "✅ Garantia de 7 dias ou seu dinheiro de volta",
        ].map((benefit, i) => (
          <p key={i} className="text-sm text-foreground">{benefit}</p>
        ))}
      </div>

      {/* Price */}
      <div className="w-full text-center space-y-1 mt-2">
        <p className="text-sm text-muted-foreground line-through">De R$297,00</p>
        <p className="text-xs text-primary font-medium">Condição especial para quem completou o teste:</p>
        <p className="text-4xl font-display font-bold text-foreground">
          R$<span className="text-gradient-green">66</span>
        </p>
        <p className="text-xs text-muted-foreground">ou 12x de R$6,58</p>
      </div>

      {/* Real testimonials */}
      <div className="w-full space-y-3 mt-3">
        <p className="text-xs text-muted-foreground text-center font-medium uppercase tracking-wider">
          Depoimentos de alunos reais
        </p>

        <div className="funnel-card border-primary/20">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xl">👨‍🦳</span>
            <p className="font-bold text-sm text-foreground">José, 61 anos</p>
          </div>
          <p className="text-xs text-foreground/80 italic">
            "Finalmente tenho tranquilidade financeira. O suporte é excelente, me ajudaram em cada passo. Já não preciso pedir dinheiro emprestado no final do mês."
          </p>
        </div>

        <div className="funnel-card border-primary/20">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xl">👩‍🦳</span>
            <p className="font-bold text-sm text-foreground">Maria, 54 anos</p>
          </div>
          <p className="text-xs text-foreground/80 italic">
            "Paguei todas as minhas contas atrasadas no primeiro mês. Não acreditava que era possível. Hoje tenho paz de espírito."
          </p>
        </div>

        <div className="funnel-card border-primary/20">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xl">👨‍🦳</span>
            <p className="font-bold text-sm text-foreground">Seu Carlos, 67 anos</p>
          </div>
          <p className="text-xs text-foreground/80 italic">
            "Eu tinha medo porque já perdi dinheiro na internet. Mas aqui é diferente. Comecei devagar, e hoje minha esposa também usa. Juntos tiramos mais de R$200 por dia."
          </p>
        </div>
      </div>

      {showCTA ? (
        <CTAButton onClick={() => window.open("#", "_blank")} variant="accent" className="animate-fade-in text-lg animate-bounce-subtle">
          🔥 GARANTIR MEU ACESSO POR R$66
        </CTAButton>
      ) : (
        <p className="text-xs text-muted-foreground text-center animate-pulse">
          Assista o vídeo para liberar o botão...
        </p>
      )}

      <p className="text-xs text-muted-foreground text-center mt-2">
        🔒 Pagamento 100% seguro • Garantia de 7 dias
      </p>
    </StepContainer>
  );
};

export default Step13Offer;
