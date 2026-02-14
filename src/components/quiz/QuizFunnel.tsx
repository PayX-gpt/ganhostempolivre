import { useState, useCallback } from "react";
import { ProgressBar, type QuizAnswers } from "./QuizUI";
import Step1Intro from "./Step1Intro";
import Step2Age from "./Step2Age";
import Step3MentorVideo from "./Step3SocialProof";
import Step4TriedOnline from "./Step4TriedOnline";
import Step5IncomeGoal from "./Step5IncomeGoal";
import Step6Obstacle from "./Step6Obstacle";
import StepInvestment from "./StepInvestment";
import Step8Device from "./Step8Device";
import Step9Availability from "./Step9Availability";
import Step10Loading from "./Step10Loading";
import Step11SocialProof2 from "./Step11SocialProof2";
import Step12Capture from "./Step12Capture";
import Step13Offer from "./Step13Offer";

const TOTAL_STEPS = 13;

const QuizFunnel = () => {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<QuizAnswers>({});

  const goNext = useCallback(() => {
    setStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const updateAndNext = useCallback(
    (key: keyof QuizAnswers, value: string) => {
      setAnswers((prev) => ({ ...prev, [key]: value }));
      goNext();
    },
    [goNext]
  );

  const renderStep = () => {
    switch (step) {
      case 1:
        return <Step1Intro onNext={goNext} />;
      case 2:
        return <Step2Age onNext={(v) => updateAndNext("age", v)} />;
      case 3:
        return <Step3MentorVideo onNext={goNext} />;
      case 4:
        return <Step4TriedOnline onNext={(v) => updateAndNext("triedOnline", v)} />;
      case 5:
        return <Step5IncomeGoal onNext={(v) => updateAndNext("incomeGoal", v)} />;
      case 6:
        return <Step6Obstacle onNext={(v) => updateAndNext("obstacle", v)} />;
      case 7:
        return <StepInvestment onNext={(v) => updateAndNext("investment", v)} />;
      case 8:
        return <Step8Device onNext={(v) => updateAndNext("device", v)} />;
      case 9:
        return <Step9Availability onNext={(v) => updateAndNext("availability", v)} />;
      case 10:
        return <Step10Loading onNext={goNext} />;
      case 11:
        return <Step11SocialProof2 onNext={goNext} />;
      case 12:
        return (
          <Step12Capture
            onNext={(name, email, phone) => {
              setAnswers((prev) => ({ ...prev, name, email, phone }));
              goNext();
            }}
          />
        );
      case 13:
        return <Step13Offer userName={answers.name} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="w-full bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-center">
          <h1 className="font-display font-bold text-xl text-foreground tracking-tight">
            <span className="text-gradient-green">ALFA</span> HÍBRIDA
          </h1>
        </div>
        {step > 1 && step < TOTAL_STEPS && <ProgressBar current={step - 1} total={TOTAL_STEPS - 2} />}
      </header>

      <main className="flex-1 flex items-start justify-center pb-8" key={step}>
        {renderStep()}
      </main>

      <footer className="w-full py-4 border-t border-border">
        <p className="text-sm text-muted-foreground text-center">
          © 2026 — Alfa Híbrida • Todos os direitos reservados
        </p>
      </footer>
    </div>
  );
};

export default QuizFunnel;
