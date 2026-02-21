import { StepContainer, CTAButton } from "./QuizUI";
import { AlertTriangle, Lock, Globe } from "lucide-react";
import mentorPhoto from "@/assets/mentor-new.webp";

interface Step1Props {
  onNext: () => void;
}

const Step1Intro = ({ onNext }: Step1Props) => {

  return (
    <StepContainer>
      {/* Alert bar */}
      <div className="w-full funnel-card border-funnel-warning/30 bg-funnel-warning/5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-funnel-warning shrink-0 mt-0.5" />
          <p className="text-sm sm:text-base text-foreground leading-relaxed">
            <span className="text-funnel-warning font-bold">Atenção:</span>{" "}
            descubra em 2 minutos se você pode usar a tecnologia que está{" "}
            <span className="font-bold">transformando a vida financeira de milhares de brasileiros.</span>
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
            "Mais de <span className="font-bold text-primary">36.000 pessoas</span> já transformaram suas finanças com a minha ajuda. Quer saber como?"
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-medium">— Ricardo Almeida, Especialista</p>
        </div>
      </div>


      {/* Main copy */}
      <div className="text-center space-y-4 mt-1">
        <h3 className="font-display text-lg sm:text-xl font-bold text-foreground leading-snug">
          TEM <span className="funnel-highlight">10 MINUTOS LIVRE</span> POR DIA?
        </h3>

        <p className="text-base sm:text-lg font-semibold text-foreground leading-relaxed">
          Descubra{" "}
          <span className="funnel-highlight">em menos de 2 minutos</span> como gerar uma{" "}
          <span className="text-gradient-green font-extrabold">renda extra de R$50 a R$300 por dia</span>,{" "}
          usando seu tempo livre para{" "}
          <span className="font-extrabold">conquistar seus objetivos e viver com mais liberdade</span>.
        </p>

        <p className="text-sm text-muted-foreground font-medium">
          <span className="funnel-highlight text-sm">10 minutos por dia.</span>{" "}
          Método simples. Já validado. Resultados reais.
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
            Teste 100% gratuito • Sem compromisso • Leva menos de 2 minutos
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
