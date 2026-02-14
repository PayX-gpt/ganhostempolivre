import { useState, useEffect } from "react";
import { StepContainer, StepTitle } from "./QuizUI";

interface Step10Props {
  onNext: () => void;
}

const loadingSteps = [
  { text: "Analisando seu perfil...", icon: "🔍" },
  { text: "Verificando compatibilidade...", icon: "⚙️" },
  { text: "Calculando seu potencial de ganho...", icon: "📊" },
  { text: "Preparando seu plano personalizado...", icon: "✨" },
];

const Step10Loading = ({ onNext }: Step10Props) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= loadingSteps.length - 1) {
          clearInterval(stepInterval);
          setTimeout(onNext, 800);
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
        return prev + 2;
      });
    }, 90);

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    };
  }, [onNext]);

  return (
    <StepContainer>
      <div className="w-20 h-20 rounded-full border-4 border-primary/30 border-t-primary animate-spin mx-auto" />

      <StepTitle>Analisando suas respostas...</StepTitle>

      <div className="w-full space-y-3 mt-4">
        {loadingSteps.map((step, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 transition-all duration-500 ${
              i <= currentStep ? "opacity-100" : "opacity-20"
            }`}
          >
            <span className="text-lg">
              {i < currentStep ? "✅" : i === currentStep ? step.icon : "⬜"}
            </span>
            <p className="text-sm text-foreground">{step.text}</p>
          </div>
        ))}
      </div>

      <div className="w-full mt-4">
        <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full progress-bar-fill rounded-full transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1 text-center">{progress}%</p>
      </div>
    </StepContainer>
  );
};

export default Step10Loading;
