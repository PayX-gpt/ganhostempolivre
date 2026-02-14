import { useState, useCallback, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ProgressBar, type QuizAnswers } from "./QuizUI";
import { usePagePresence } from "@/hooks/usePagePresence";
import Step1Intro from "./Step1Intro";
import Step2Age from "./Step2Age";
import StepName from "./StepName";
import Step3SocialProof from "./Step3SocialProof";
import Step4TriedOnline from "./Step4TriedOnline";
import Step5IncomeGoal from "./Step5IncomeGoal";
import Step6Obstacle from "./Step6Obstacle";
import StepFinancialDream from "./StepFinancialDream";
import Step7MentorVideo from "./Step7MentorVideo";
import Step8Device from "./Step8Device";
import Step9Availability from "./Step9Availability";
import StepPlatformDemo from "./StepPlatformDemo";
import Step10Loading from "./Step10Loading";
import Step11SocialProof2 from "./Step11SocialProof2";
import StepWhatsAppProof from "./StepWhatsAppProof";
import StepContactMethod from "./StepContactMethod";
import StepContactInput from "./StepContactInput";
import Step13Offer from "./Step13Offer";

const STEP_SLUGS = [
  "step-1",
  "step-2",
  "step-3",
  "step-4",
  "step-5",
  "step-6",
  "step-7",
  "step-8",
  "step-9",
  "step-10",
  "step-11",
  "step-12",
  "step-13",
  "step-14",
  "step-15",
  "step-16",
  "step-17",
  "step-18",
] as const;

const TOTAL_STEPS = STEP_SLUGS.length;

const QuizFunnel = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const currentSlug = slug || "step-1";
  const step = Math.max(1, (STEP_SLUGS.indexOf(currentSlug as any) + 1) || 1);

  // Track presence for the current step
  usePagePresence(`/${currentSlug}`);

  const goNext = useCallback(() => {
    const nextStep = Math.min(step + 1, TOTAL_STEPS);
    navigate(`/${STEP_SLUGS[nextStep - 1]}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step, navigate]);

  const updateAndNext = useCallback(
    (key: keyof QuizAnswers, value: string) => {
      setAnswers((prev) => ({ ...prev, [key]: value }));
      const nextStep = Math.min(step + 1, TOTAL_STEPS);
      navigate(`/${STEP_SLUGS[nextStep - 1]}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [step, navigate]
  );

  const renderStep = () => {
    switch (step) {
      case 1:
        return <Step1Intro onNext={goNext} />;
      case 2:
        return <Step2Age onNext={(v) => updateAndNext("age", v)} />;
      case 3:
        return <StepName onNext={(name) => updateAndNext("name", name)} />;
      case 4:
        return <Step3SocialProof onNext={goNext} />;
      case 5:
        return <Step4TriedOnline onNext={(v) => updateAndNext("triedOnline", v)} userName={answers.name} />;
      case 6:
        return <Step5IncomeGoal onNext={(v) => updateAndNext("incomeGoal", v)} userName={answers.name} />;
      case 7:
        return <Step6Obstacle onNext={(v) => updateAndNext("obstacle", v)} userName={answers.name} />;
      case 8:
        return <StepFinancialDream onNext={(v) => updateAndNext("financialDream", v)} userName={answers.name} />;
      case 9:
        return <Step7MentorVideo onNext={goNext} />;
      case 10:
        return <Step8Device onNext={(v) => updateAndNext("device", v)} userName={answers.name} />;
      case 11:
        return <Step9Availability onNext={(v) => updateAndNext("availability", v)} userName={answers.name} />;
      case 12:
        return <StepPlatformDemo onNext={goNext} userName={answers.name} />;
      case 13:
        return <Step10Loading onNext={goNext} />;
      case 14:
        return <Step11SocialProof2 onNext={goNext} />;
      case 15:
        return <StepWhatsAppProof onNext={goNext} />;
      case 16:
        return <StepContactMethod userName={answers.name} onNext={(v) => updateAndNext("contactMethod", v)} />;
      case 17:
        return (
          <StepContactInput
            method={answers.contactMethod || "email"}
            userName={answers.name}
            onNext={(value) => {
              if (answers.contactMethod === "whatsapp") {
                setAnswers((prev) => ({ ...prev, phone: value }));
              } else {
                setAnswers((prev) => ({ ...prev, email: value }));
              }
              goNext();
            }}
          />
        );
      case 18:
        return <Step13Offer userName={answers.name} answers={answers} />;
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
