import { StepContainer, StepTitle, CTAButton } from "./QuizUI";

interface Step1Props {
  onNext: () => void;
}

const Step1Intro = ({ onNext }: Step1Props) => {
  return (
    <StepContainer>
      <div className="w-full funnel-card border-funnel-warning/40 bg-funnel-warning/5">
        <p className="text-sm text-foreground">
          <span className="text-funnel-warning font-bold">⚠️ Atenção:</span>{" "}
          este teste vai revelar se você está pronto para usar a tecnologia que já coloca dinheiro no bolso de pessoas comuns todos os dias.
        </p>
      </div>

      {/* Mentor trust element */}
      <div className="flex items-center gap-4 w-full funnel-card border-primary/20 bg-primary/5">
        <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-3xl shrink-0">
          👨‍🦳
        </div>
        <p className="text-sm text-foreground/90 italic leading-snug">
          "Eu ajudei mais de <span className="font-bold text-primary">36.000 pessoas</span> a encontrarem segurança financeira. Deixe-me mostrar como."
        </p>
      </div>

      <div className="text-center space-y-3 mt-2">
        <h3 className="font-display text-lg font-bold text-foreground">
          TEM <span className="funnel-highlight">10 MINUTOS LIVRE</span> POR DIA?
        </h3>

        <p className="text-base font-bold text-foreground leading-snug">
          As próximas perguntas vão mostrar,{" "}
          <span className="funnel-highlight">em menos de 2 minutos</span>, o caminho para gerar uma{" "}
          <span className="text-gradient-green font-extrabold">
            renda extra segura de R$50 a R$300 por dia
          </span>{" "}
          para{" "}
          <span className="bg-primary/15 text-primary px-1 rounded font-extrabold">pagar suas contas com tranquilidade</span>,{" "}
          usando apenas alguns minutos do seu tempo livre.
        </p>

        <p className="text-xs text-muted-foreground font-medium">
          <span className="funnel-highlight text-xs">10 minutos por dia.</span>{" "}
          Método já validado. Resultados reais.
        </p>
      </div>

      <div className="flex justify-center gap-2 mt-2">
        {["🇧🇷", "🇺🇸", "🇬🇧", "🇫🇷", "🇵🇹", "🇩🇪"].map((flag, i) => (
          <span key={i} className="text-2xl">{flag}</span>
        ))}
      </div>

      <CTAButton onClick={onNext} className="mt-4 animate-bounce-subtle text-lg">
        INICIAR TESTE! 🚀
      </CTAButton>
    </StepContainer>
  );
};

export default Step1Intro;
