import { useState, useEffect } from "react";
import { StepContainer } from "./QuizUI";
import { Search, Settings, BarChart3, Target, MapPin, Sparkles, CheckCircle, Square, Lock, Loader2 } from "lucide-react";
import mentorPhoto from "@/assets/mentor-new.webp";
import { isYoungProfile } from "@/lib/agePersonalization";

interface Step10Props {
  onNext: () => void;
  userAge?: string;
}

const loadingSteps = [
  { text: "Cruzando suas respostas com nosso banco de dados...", icon: <Search className="w-4 h-4" />, detail: "Perfil, idade, disponibilidade e objetivos" },
  { text: "Verificando compatibilidade com o método...", icon: <Settings className="w-4 h-4" />, detail: "Analisando histórico e nível de experiência" },
  { text: "Calculando seu potencial de ganho diário...", icon: <BarChart3 className="w-4 h-4" />, detail: "Com base na sua faixa de renda desejada" },
  { text: "Selecionando o plano ideal para o seu perfil...", icon: <Target className="w-4 h-4" />, detail: "Considerando seu tempo disponível e dispositivo" },
  { text: "Consultando vagas disponíveis na sua região...", icon: <MapPin className="w-4 h-4" />, detail: "Verificando disponibilidade em tempo real" },
  { text: "Gerando seu acesso personalizado...", icon: <Sparkles className="w-4 h-4" />, detail: "Tudo pronto! Preparando seus resultados" },
];

const Step10Loading = ({ onNext, userAge }: Step10Props) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const young = isYoungProfile(userAge);

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
        <div className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 ${showResult ? "border-primary" : "border-primary/30 border-t-primary animate-spin"} absolute inset-0`} />
        <img
          src={mentorPhoto}
          alt="Especialista"
          className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover relative z-10 border-4 border-transparent"
        />
      </div>

      {/* Title changes based on state */}
      {showResult ? (
        <div className="text-center space-y-2 animate-fade-in">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="w-6 h-6 text-accent" />
            <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground leading-snug">
              Análise concluída!
            </h2>
          </div>
          <p className="text-lg text-primary font-semibold">
            Seu perfil é altamente compatível!
          </p>
          <p className="text-base text-muted-foreground leading-relaxed">
            Preparando seus resultados...
          </p>
        </div>
      ) : (
        <div className="text-center space-y-2">
          <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground leading-snug">
            Analisando suas respostas...
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            {young
              ? "Estamos cruzando suas respostas com o perfil dos nossos alunos de maior resultado para criar um plano sob medida."
              : <>Nosso sistema está cruzando seus dados com o perfil dos nossos <span className="text-primary font-semibold">36.000+ alunos</span> de sucesso.</>}
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
              className={`flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl transition-all duration-500 ${
                isDone
                  ? "bg-primary/5 border border-primary/20"
                  : isCurrent
                  ? "bg-accent/5 border border-accent/20"
                  : "opacity-30"
              }`}
            >
              <div className={`shrink-0 mt-0.5 ${isDone ? "text-primary" : isCurrent ? "text-accent" : "text-muted-foreground"}`}>
                {isDone ? <CheckCircle className="w-4 h-4" /> : isCurrent ? step.icon : <Square className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs sm:text-sm font-semibold leading-snug ${isDone ? "text-foreground" : isCurrent ? "text-foreground" : "text-muted-foreground"}`}>
                  {step.text}
                </p>
                {(isDone || isCurrent) && (
                  <p className="text-xs text-muted-foreground mt-0.5 animate-fade-in">
                    {step.detail}
                  </p>
                )}
              </div>
              {isCurrent && (
                <Loader2 className="w-4 h-4 text-accent animate-spin shrink-0 mt-0.5" />
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
          <div className="flex items-center gap-1">
            {showResult ? (
              <CheckCircle className="w-3.5 h-3.5 text-primary" />
            ) : (
              <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin" />
            )}
            <p className="text-xs text-muted-foreground">
              {showResult ? "Análise completa" : "Processando..."}
            </p>
          </div>
          <p className="text-sm text-foreground font-bold">{Math.min(Math.round(progress), 100)}%</p>
        </div>
      </div>

      {/* Trust element */}
      <div className="w-full text-center mt-1">
        <div className="flex items-center gap-1.5 justify-center">
          <Lock className="w-3.5 h-3.5 text-primary" />
          <p className="text-xs text-muted-foreground">
            Seus dados estão protegidos e criptografados
          </p>
        </div>
      </div>
    </StepContainer>
  );
};

export default Step10Loading;
