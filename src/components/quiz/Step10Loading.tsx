import { useState, useEffect } from "react";
import { StepContainer } from "./QuizUI";
import mentorPhoto from "@/assets/mentor-photo.jpg";

interface Step10Props {
  onNext: () => void;
}

const loadingSteps = [
  { text: "Cruzando suas respostas com nosso banco de dados...", icon: "🔍", detail: "Perfil, idade, disponibilidade e objetivos" },
  { text: "Verificando compatibilidade com o método...", icon: "⚙️", detail: "Analisando histórico e nível de experiência" },
  { text: "Calculando seu potencial de ganho diário...", icon: "📊", detail: "Com base na sua faixa de renda desejada" },
  { text: "Selecionando o plano ideal para o seu perfil...", icon: "🎯", detail: "Considerando seu tempo disponível e dispositivo" },
  { text: "Consultando vagas disponíveis na sua região...", icon: "📍", detail: "Verificando disponibilidade em tempo real" },
  { text: "Gerando seu acesso personalizado...", icon: "✨", detail: "Tudo pronto! Preparando seus resultados" },
];

const Step10Loading = ({ onNext }: Step10Props) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= loadingSteps.length - 1) {
          clearInterval(stepInterval);
          setTimeout(() => setShowResult(true), 800);
          return prev;
        }
        return prev + 1;
      });
    }, 1200);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 1.4;
      });
    }, 100);

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    };
  }, []);

  useEffect(() => {
    if (showResult) {
      const timer = setTimeout(onNext, 2000);
      return () => clearTimeout(timer);
    }
  }, [showResult, onNext]);

  return (
    <StepContainer>
      {/* Mentor photo + spinner */}
      <div className="relative mx-auto">
        <div className={`w-28 h-28 rounded-full border-4 ${showResult ? "border-primary" : "border-primary/30 border-t-primary animate-spin"} absolute inset-0`} />
        <img
          src={mentorPhoto}
          alt="Especialista"
          className="w-28 h-28 rounded-full object-cover relative z-10 border-4 border-transparent"
        />
      </div>

      {/* Title changes based on state */}
      {showResult ? (
        <div className="text-center space-y-2 animate-fade-in">
          <h2 className="font-display text-2xl font-bold text-foreground leading-snug">
            🎉 Análise concluída!
          </h2>
          <p className="text-lg text-primary font-semibold">
            Seu perfil é altamente compatível!
          </p>
          <p className="text-base text-muted-foreground leading-relaxed">
            Preparando seus resultados...
          </p>
        </div>
      ) : (
        <div className="text-center space-y-2">
          <h2 className="font-display text-2xl font-bold text-foreground leading-snug">
            Analisando suas respostas...
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            Nosso sistema está cruzando seus dados com o perfil dos nossos <span className="text-primary font-semibold">36.000+ alunos</span> de sucesso.
          </p>
        </div>
      )}

      {/* Steps checklist */}
      <div className="w-full space-y-2 mt-2">
        {loadingSteps.map((step, i) => {
          const isDone = i < currentStep || showResult;
          const isCurrent = i === currentStep && !showResult;
          const isPending = i > currentStep && !showResult;

          return (
            <div
              key={i}
              className={`flex items-start gap-3 p-3 rounded-xl transition-all duration-500 ${
                isDone
                  ? "bg-primary/5 border border-primary/20"
                  : isCurrent
                  ? "bg-accent/5 border border-accent/20"
                  : "opacity-30"
              }`}
            >
              <span className="text-lg shrink-0 mt-0.5">
                {isDone ? "✅" : isCurrent ? step.icon : "⬜"}
              </span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold leading-snug ${isDone ? "text-foreground" : isCurrent ? "text-foreground" : "text-muted-foreground"}`}>
                  {step.text}
                </p>
                {(isDone || isCurrent) && (
                  <p className="text-xs text-muted-foreground mt-0.5 animate-fade-in">
                    {step.detail}
                  </p>
                )}
              </div>
              {isCurrent && (
                <div className="w-4 h-4 rounded-full border-2 border-accent/50 border-t-accent animate-spin shrink-0 mt-1" />
              )}
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="w-full mt-3">
        <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full progress-bar-fill rounded-full transition-all duration-200"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <div className="flex justify-between items-center mt-2">
          <p className="text-xs text-muted-foreground">
            {showResult ? "✅ Análise completa" : "⏳ Processando..."}
          </p>
          <p className="text-sm text-foreground font-bold">{Math.min(Math.round(progress), 100)}%</p>
        </div>
      </div>

      {/* Trust element */}
      <div className="w-full text-center mt-1">
        <p className="text-xs text-muted-foreground">
          🔒 Seus dados estão protegidos e criptografados
        </p>
      </div>
    </StepContainer>
  );
};

export default Step10Loading;
