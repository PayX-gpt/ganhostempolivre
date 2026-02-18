import { useState, useEffect } from "react";
import { StepContainer, CTAButton } from "./QuizUI";
import { AlertTriangle, Lock, Globe, CheckCircle } from "lucide-react";
import mentorPhoto from "@/assets/mentor-new.webp";

interface Step1Props {
  onNext: () => void;
}

const Step1Intro = ({ onNext }: Step1Props) => {
  const [count, setCount] = useState(2847);

  useEffect(() => {
    const interval = setInterval(() => {
      setCount((prev) => prev + Math.floor(Math.random() * 3) + 1);
    }, 4000 + Math.random() * 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <StepContainer>
      {/* Social proof numérico */}
      <div className="w-full flex items-center justify-center gap-2 py-2">
        <CheckCircle className="w-4 h-4 text-primary shrink-0" />
        <p className="text-sm font-semibold text-foreground">
          {count.toLocaleString("pt-BR")} pessoas fizeram este teste hoje
        </p>
      </div>

      {/* Alert bar */}
      <div className="w-full funnel-card border-funnel-warning/30 bg-funnel-warning/5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-funnel-warning shrink-0 mt-0.5" />
          <p className="text-sm sm:text-base text-foreground leading-relaxed">
            <span className="text-funnel-warning font-bold">Atenção:</span>{" "}
            este teste rápido vai revelar se você pode usar a mesma tecnologia que já está gerando renda extra para{" "}
            <span className="font-bold">milhares de brasileiros acima de 40 anos.</span>
          </p>
        </div>
      </div>

      {/* Mentor trust card */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 w-full funnel-card border-primary/25 bg-primary/5 text-center sm:text-left">
        <img
          src={mentorPhoto}
          alt="Especialista Ricardo"
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-primary/40 shrink-0"
        />
        <div>
          <p className="text-sm sm:text-base text-foreground leading-snug italic">
            "Eu ajudei mais de <span className="font-bold text-primary">36.000 pessoas</span> a encontrarem segurança financeira. Deixe-me mostrar como."
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-medium">— Ricardo Almeida, Especialista</p>
        </div>
      </div>

      {/* Copy de apoio — acima do CTA */}
      <div className="text-center space-y-2">
        <h3 className="font-display text-lg sm:text-xl font-bold text-foreground leading-snug">
          Descubra em 30 segundos se você pode{" "}
          <span className="funnel-highlight">gerar renda extra com IA</span>
        </h3>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          Responda algumas perguntas e veja se este método <span className="font-bold">simples e já validado</span> funciona pra você.
        </p>
      </div>

      {/* CTA */}
      <div className="w-full space-y-3">
        <CTAButton onClick={onNext} className="animate-bounce-subtle text-lg sm:text-xl">
          INICIAR TESTE →
        </CTAButton>
        <div className="flex items-center gap-2 justify-center">
          <Lock className="w-3.5 h-3.5 text-primary shrink-0" />
          <p className="text-sm text-muted-foreground text-center">
            100% gratuito • Sem compromisso • Leva 30 segundos
          </p>
        </div>
      </div>

      {/* Global trust */}
      <div className="flex justify-center gap-2 mt-1">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Globe className="w-4 h-4 text-primary" />
          <span className="text-xs font-medium">Usado em 6+ países</span>
        </div>
      </div>
    </StepContainer>
  );
};

export default Step1Intro;
