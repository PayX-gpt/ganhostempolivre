import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ProgressBar, type QuizAnswers } from "./QuizUI";
import { usePagePresence } from "@/hooks/usePagePresence";
import { saveFunnelEvent } from "@/lib/metricsClient";
import Step1Intro from "./Step1Intro";
import Step2Age from "./Step2Age";
import StepName from "./StepName";
import Step3SocialProof from "./Step3SocialProof";
import Step4TriedOnline from "./Step4TriedOnline";
import Step5IncomeGoal from "./Step5IncomeGoal";
import Step6Obstacle from "./Step6Obstacle";
import StepFinancialDream from "./StepFinancialDream";
import StepAccountBalance from "./StepAccountBalance";
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
  "step-19",
] as const;

const TOTAL_STEPS = STEP_SLUGS.length;

const STEP_NAMES: Record<string, string> = {
  "step-1": "intro", "step-2": "idade", "step-3": "nome", "step-4": "prova_social",
  "step-5": "tentou_online", "step-6": "meta_renda", "step-7": "obstaculo",
  "step-8": "sonho_financeiro", "step-9": "saldo_conta", "step-10": "video_mentor",
  "step-11": "dispositivo", "step-12": "disponibilidade", "step-13": "demo_plataforma",
  "step-14": "loading", "step-15": "prova_social_2", "step-16": "whatsapp_proof",
  "step-17": "metodo_contato", "step-18": "input_contato", "step-19": "oferta_final",
};

const QuizFunnel = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const [answers, setAnswers] = useState<QuizAnswers>(() => {
    try {
      const saved = sessionStorage.getItem("quiz_answers");
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });
  const currentSlug = slug || "step-1";
  const isValidQuizSlug = !slug || STEP_SLUGS.includes(slug as any);

  // Guard: if the slug belongs to a known non-quiz route, bail out immediately
  const NON_QUIZ_ROUTES = ["upsell1", "upsell2", "upsell3", "upsell4", "live"];
  const isNonQuizRoute = slug && NON_QUIZ_ROUTES.includes(slug);

  useEffect(() => {
    if (isNonQuizRoute) {
      // Force a hard navigation to break out of the /:slug catch-all
      window.location.replace(`/${slug}${window.location.search}`);
      return;
    }
    if (!isValidQuizSlug) {
      navigate(`/${slug}`, { replace: true });
    }
  }, [slug, isValidQuizSlug, isNonQuizRoute, navigate]);

  const step = Math.max(1, (STEP_SLUGS.indexOf(currentSlug as any) + 1) || 1);
  const stepEnteredAt = useRef<number>(Date.now());

  // Track presence for the current step
  usePagePresence(`/${currentSlug}`);

  // Block back navigation and reset on reload
  useEffect(() => {
    // Push a dummy state so popstate fires on back
    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => {
      // Re-push to prevent going back
      window.history.pushState(null, "", window.location.href);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [currentSlug]);

  // On first mount, always redirect to step-1 (handles page reload)
  const hasRedirected = useRef(false);
  useEffect(() => {
    if (!hasRedirected.current) {
      hasRedirected.current = true;
      const isReload = performance.navigation?.type === 1 ||
        (performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming)?.type === "reload";
      if (isReload && currentSlug !== "step-1") {
        sessionStorage.removeItem("quiz_answers");
        navigate("/step-1", { replace: true });
      }
    }
  }, []);

  // Track time spent when step changes
  useEffect(() => {
    stepEnteredAt.current = Date.now();
    saveFunnelEvent("step_viewed", {
      step: currentSlug,
      step_name: STEP_NAMES[currentSlug] || currentSlug,
      step_number: step,
    });
  }, [currentSlug, step]);

  const trackStepComplete = useCallback((answer?: { key: string; value: string }) => {
    const timeSpentMs = Date.now() - stepEnteredAt.current;
    saveFunnelEvent("step_completed", {
      step: currentSlug,
      step_name: STEP_NAMES[currentSlug] || currentSlug,
      step_number: step,
      time_spent_ms: timeSpentMs,
      time_spent_seconds: Math.round(timeSpentMs / 1000),
      ...(answer ? { answer_key: answer.key, answer_value: answer.value } : {}),
    });
  }, [currentSlug, step]);

  const goNext = useCallback(() => {
    trackStepComplete();
    const nextStep = Math.min(step + 1, TOTAL_STEPS);
    navigate(`/${STEP_SLUGS[nextStep - 1]}`);
    window.scrollTo({ top: 0 });
  }, [step, navigate, trackStepComplete]);

  const updateAndNext = useCallback(
    (key: keyof QuizAnswers, value: string) => {
      trackStepComplete({ key, value });
      setAnswers((prev) => {
        const updated = { ...prev, [key]: value };
        try { sessionStorage.setItem("quiz_answers", JSON.stringify(updated)); } catch {}
        return updated;
      });
      const nextStep = Math.min(step + 1, TOTAL_STEPS);
      navigate(`/${STEP_SLUGS[nextStep - 1]}`);
      window.scrollTo({ top: 0 });
    },
    [step, navigate, trackStepComplete]
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
        return <StepAccountBalance onNext={(v) => updateAndNext("accountBalance", v)} userName={answers.name} />;
      case 10:
        return <Step7MentorVideo onNext={goNext} />;
      case 11:
        return <Step8Device onNext={(v) => updateAndNext("device", v)} userName={answers.name} />;
      case 12:
        return <Step9Availability onNext={(v) => updateAndNext("availability", v)} userName={answers.name} />;
      case 13:
        return <StepPlatformDemo onNext={goNext} userName={answers.name} />;
      case 14:
        return <Step10Loading onNext={goNext} />;
      case 15:
        return <Step11SocialProof2 onNext={goNext} />;
      case 16:
        return <StepWhatsAppProof onNext={goNext} />;
      case 17:
        return <StepContactMethod userName={answers.name} onNext={(v) => updateAndNext("contactMethod", v)} />;
      case 18:
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
      case 19:
        return <Step13Offer userName={answers.name} answers={answers} />;
      default:
        return null;
    }
  };

  // Don't render quiz UI for non-quiz slugs (e.g. /upsell1, /upsell2)
  if (!isValidQuizSlug || isNonQuizRoute) return null;

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      <header className="w-full bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="max-w-lg mx-auto px-4 py-2.5 sm:py-3 flex items-center justify-center">
          <h1 className="font-bold text-lg sm:text-xl text-foreground tracking-tight flex items-center gap-1.5">
            <span className="text-gradient-green font-extrabold tracking-widest text-xl sm:text-2xl">G</span>
            <span className="text-foreground/90 uppercase tracking-[0.15em] text-sm sm:text-base font-semibold">anhos com</span>
            <span className="text-gradient-green font-extrabold tracking-widest text-xl sm:text-2xl">T</span>
            <span className="text-foreground/90 uppercase tracking-[0.15em] text-sm sm:text-base font-semibold">empo</span>
            <span className="text-gradient-green font-extrabold tracking-widest text-xl sm:text-2xl">L</span>
            <span className="text-foreground/90 uppercase tracking-[0.15em] text-sm sm:text-base font-semibold">ivre</span>
          </h1>
        </div>
        {step > 1 && step < TOTAL_STEPS && <ProgressBar current={step - 1} total={TOTAL_STEPS - 2} />}
      </header>

      <main className="flex-1 flex items-start justify-center pt-2" key={step}>
        {renderStep()}
      </main>

      <footer className="w-full py-3 border-t border-border">
        <p className="text-xs sm:text-sm text-muted-foreground text-center">
          © 2026 — Plataforma de Ganhos com Tempo Livre • Todos os direitos reservados
        </p>
      </footer>
    </div>
  );
};

export default QuizFunnel;
