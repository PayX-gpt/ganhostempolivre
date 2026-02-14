import { useState, useEffect } from "react";
import { StepContainer, StepTitle, StepSubtitle } from "./QuizUI";

interface Step10Props {
  onNext: () => void;
}

const loadingSteps = [
  { text: "Analisando seu perfil e suas respostas...", icon: "🔍" },
  { text: "Verificando compatibilidade com o método...", icon: "⚙️" },
  { text: "Calculando seu potencial de ganho diário...", icon: "📊" },
  { text: "Identificando o melhor plano para você...", icon: "🎯" },
  { text: "Preparando seu acesso personalizado...", icon: "✨" },
];

const Step10Loading = ({ onNext }: Step10Props) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= loadingSteps.length - 1) {
          clearInterval(stepInterval);
          setTimeout(onNext, 1000);
          return prev;
        }
        return prev + 1;
      });
    }, 1400);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 1.5;
      });
    }, 100);

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    };
  }, [onNext]);

  return (
    <StepContainer>
      <div className="w-24 h-24 rounded-full border-4 border-primary/30 border-t-primary animate-spin mx-auto" />

      <StepTitle>Analisando suas respostas...</StepTitle>
      <StepSubtitle>Estamos montando um plano personalizado com base no seu perfil.</StepSubtitle>

      <div className="w-full space-y-4 mt-4">
        {loadingSteps.map((step, i) => (
          <div
            key={i}
            className={`flex items-center gap-4 transition-all duration-500 ${
              i <= currentStep ? "opacity-100" : "opacity-15"
            }`}
          >
            <span className="text-xl shrink-0">
              {i < currentStep ? "✅" : i === currentStep ? step.icon : "⬜"}
            </span>
            <p className="text-base text-foreground">{step.text}</p>
          </div>
        ))}
      </div>

      <div className="w-full mt-5">
        <div className="w-full h-4 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full progress-bar-fill rounded-full transition-all duration-200"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <p className="text-sm text-muted-foreground mt-2 text-center font-medium">{Math.min(Math.round(progress), 100)}%</p>
      </div>
    </StepContainer>
  );
};

export default Step10Loading;
