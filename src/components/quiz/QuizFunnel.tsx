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
import Step7MentorVideo from "./Step7MentorVideo";
import Step9Availability from "./Step9Availability";
import StepPlatformDemo from "./StepPlatformDemo";
import Step10Loading from "./Step10Loading";
import Step11SocialProof2 from "./Step11SocialProof2";
import StepWhatsAppProof from "./StepWhatsAppProof";
import StepContactMethod from "./StepContactMethod";
import StepContactInput from "./StepContactInput";
import Step13Offer from "./Step13Offer";

const STEP_SLUGS = [
  "step-1",  // 1: Intro
  "step-2",  // 2: Idade
  "step-3",  // 3: Nome
  "step-4",  // 4: Prova social (vídeo depoimento)
  "step-5",  // 5: Tentou online
  "step-6",  // 6: Meta de renda
  "step-7",  // 7: Obstáculo
  "step-8",  // 8: Vídeo mentor
  "step-9",  // 9: Disponibilidade (binário)
  "step-10", // 10: Demo plataforma
  "step-11", // 11: Loading
  "step-12", // 12: Prova social 2 + vídeo venda
  "step-13", // 13: WhatsApp proof
  "step-14", // 14: Método contato
  "step-15", // 15: Input contato
  "step-16", // 16: Oferta final
] as const;

const TOTAL_STEPS = STEP_SLUGS.length;

const STEP_NAMES: Record<string, string> = {
  "step-1": "intro", "step-2": "idade", "step-3": "nome", "step-4": "prova_social",
  "step-5": "tentou_online", "step-6": "meta_renda", "step-7": "obstaculo",
  "step-8": "video_mentor", "step-9": "disponibilidade", "step-10": "demo_plataforma",
  "step-11": "loading", "step-12": "prova_social_2", "step-13": "whatsapp_proof",
  "step-14": "metodo_contato", "step-15": "input_contato", "step-16": "oferta_final",
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
      window.location.replace(`/${slug}${window.location.search}`);
      return;
    }
    if (!isValidQuizSlug) {
      navigate(`/${slug}`, { replace: true });
    }
  }, [slug, isValidQuizSlug, isNonQuizRoute, navigate]);

  const step = Math.max(1, (STEP_SLUGS.indexOf(currentSlug as any) + 1) || 1);
  const stepEnteredAt = useRef<number>(Date.now());

  usePagePresence(`/${currentSlug}`);

  // Block back navigation
  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [currentSlug]);

  // On first mount, redirect to step-1 on reload
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
        try {
          sessionStorage.setItem("quiz_answers", JSON.stringify(updated));
          if (key === "name" && value.trim()) {
            window.dispatchEvent(new CustomEvent("quiz_name_updated", { detail: { name: value.trim() } }));
          }
        } catch {}
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
        return <Step3SocialProof onNext={goNext} userAge={answers.age} />;
      case 5:
        return <Step4TriedOnline onNext={(v) => updateAndNext("triedOnline", v)} userName={answers.name} userAge={answers.age} />;
      case 6:
        return <Step5IncomeGoal onNext={(v) => updateAndNext("incomeGoal", v)} userName={answers.name} userAge={answers.age} />;
      case 7:
        return <Step6Obstacle onNext={(v) => updateAndNext("obstacle", v)} userName={answers.name} userAge={answers.age} />;
      case 8:
        return <Step7MentorVideo onNext={goNext} userAge={answers.age} />;
      case 9:
        return <Step9Availability onNext={(v) => updateAndNext("availability", v)} userName={answers.name} userAge={answers.age} />;
      case 10:
        return <StepPlatformDemo onNext={goNext} userName={answers.name} />;
      case 11:
        return <Step10Loading onNext={goNext} userAge={answers.age} />;
      case 12:
        return <Step11SocialProof2 onNext={goNext} userAge={answers.age} />;
      case 13:
        return <StepWhatsAppProof onNext={goNext} userAge={answers.age} />;
      case 14:
        return <StepContactMethod userName={answers.name} onNext={(v) => updateAndNext("contactMethod", v)} />;
      case 15:
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
      case 16:
        return <Step13Offer userName={answers.name} answers={answers} />;
      default:
        return null;
    }
  };

  if (!isValidQuizSlug || isNonQuizRoute) return null;

  // Progress bar: start at 15% offset
  const progressCurrent = step - 1;
  const progressTotal = TOTAL_STEPS - 2;

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
        {step > 1 && step < TOTAL_STEPS && <ProgressBar current={progressCurrent} total={progressTotal} />}
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
