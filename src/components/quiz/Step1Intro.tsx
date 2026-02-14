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

      <div className="text-center space-y-3 mt-2">
        <h3 className="font-display text-lg font-bold text-foreground">
          TEM <span className="funnel-highlight">10 MINUTOS LIVRE</span> POR DIA?
        </h3>

        <p className="text-base font-bold text-foreground leading-snug">
          As próximas perguntas vão mostrar,{" "}
          <span className="funnel-highlight">em menos de 2 minutos</span>, o caminho mais rápido pra você{" "}
          <span className="bg-destructive/20 text-destructive px-1 rounded font-extrabold">SAIR DAS DÍVIDAS</span>{" "}
          e começar a{" "}
          <span className="text-gradient-green font-extrabold">
            GANHAR R$200 a R$1.000/DIA apenas utilizando seu tempo livre.
          </span>
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
