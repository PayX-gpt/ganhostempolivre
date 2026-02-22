import { useState, useEffect } from "react";
import { StepContainer, CTAButton } from "./QuizUI";
import { Lock, Zap, TrendingUp, Users } from "lucide-react";

interface Step1Props {
  onNext: () => void;
}

const Step1Intro = ({ onNext }: Step1Props) => {
  const [counter, setCounter] = useState(36847);

  useEffect(() => {
    const interval = setInterval(() => {
      setCounter((c) => c + Math.floor(Math.random() * 3) + 1);
    }, 4000 + Math.random() * 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <StepContainer>
      {/* Live counter */}
      <div className="w-full funnel-card border-primary/30 bg-primary/5">
        <div className="flex items-center justify-center gap-2">
          <Users className="w-4 h-4 text-primary animate-pulse" />
          <p className="text-sm font-bold text-primary">
            {counter.toLocaleString("pt-BR")} brasileiros já estão usando
          </p>
        </div>
      </div>

      {/* Main headline */}
      <div className="text-center space-y-4 mt-1">
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground leading-tight">
          <span className="text-gradient-green">R$300 por dia.</span>{" "}
          10 minutos.{" "}
          <span className="text-gradient-green">Uma IA faz o resto.</span>
        </h1>

        <p className="text-base sm:text-lg font-bold text-foreground/80">
          Você vai ficar de fora?
        </p>
      </div>

      {/* Dopamine triggers */}
      <div className="grid grid-cols-2 gap-2 w-full">
        {["Sem investir", "Sem aparecer", "Sem vender", "Sem experiência"].map((item) => (
          <div key={item} className="flex items-center gap-2 funnel-card border-border/50 bg-card/50 py-2.5 px-3">
            <Zap className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-sm font-semibold text-foreground">{item}</span>
          </div>
        ))}
      </div>

      {/* Body copy */}
      <div className="w-full funnel-card border-border/30 bg-card/30">
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed text-center">
          Não importa se você tem <strong className="text-foreground">18 ou 65 anos</strong>. 
          Não importa se você nunca mexeu com tecnologia. 
          Não importa se já tentou de tudo. 
          <strong className="text-foreground"> Essa IA foi feita pra pessoas comuns.</strong>
        </p>
      </div>

      {/* Proof nudge */}
      <div className="flex items-center gap-2 justify-center">
        <TrendingUp className="w-4 h-4 text-primary" />
        <p className="text-sm font-medium text-foreground/70">
          Faça o teste de 2 minutos. <span className="font-bold text-foreground">Veja com seus próprios olhos</span> quanto você pode gerar por dia.
        </p>
      </div>

      {/* CTA */}
      <div className="w-full space-y-3">
        <CTAButton onClick={onNext} className="animate-bounce-subtle text-lg sm:text-xl">
          EU QUERO MEUS R$300 POR DIA →
        </CTAButton>
        <div className="flex items-center gap-2 justify-center">
          <Lock className="w-3.5 h-3.5 text-primary shrink-0" />
          <p className="text-xs text-muted-foreground text-center">
            Teste gratuito • Resultado imediato • Sem pegadinha
          </p>
        </div>
      </div>
    </StepContainer>
  );
};

export default Step1Intro;
