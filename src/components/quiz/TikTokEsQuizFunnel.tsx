import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ProgressBar, type QuizAnswers } from "./QuizUI";
import { usePagePresence } from "@/hooks/usePagePresence";
import { saveFunnelEvent } from "@/lib/metricsClient";
import { saveSessionAttribution } from "@/lib/trackingDataLayer";
import { useLanguage } from "@/lib/i18n";
import { getEffectiveVariant, saveVariantToAttribution, type QuizVariant } from "@/lib/abTestVariant";
import TikTokEsStep1Landing from "./TikTokEsStep1Landing";
import Step2Age from "./Step2Age";
import Step3SocialProof from "./Step3SocialProof";
import Step5IncomeGoal from "./Step5IncomeGoal";
import Step9Availability from "./Step9Availability";
import StepContactInput from "./StepContactInput";
import Step10Loading from "./Step10Loading";
import StepProfileProjection from "./StepProfileProjection";
import Step11SocialProof2 from "./Step11SocialProof2";

const TIKTOK_ES_STEP_SLUGS = [
  "step-1",
  "step-2",
  "step-3",
  "step-4",
  "step-5",
  "step-6",
  "step-7",
  "step-8",
  "step-9",
] as const;

const TOTAL_STEPS = TIKTOK_ES_STEP_SLUGS.length;
const PROGRESS_STEPS = 6;

const STEP_NAMES: Record<string, string> = {
  "step-1": "tiktok_es_intro",
  "step-2": "tiktok_es_edad",
  "step-3": "tiktok_es_prueba_social",
  "step-4": "tiktok_es_meta_ingreso",
  "step-5": "tiktok_es_disponibilidad",
  "step-6": "tiktok_es_input_contacto",
  "step-7": "tiktok_es_loading",
  "step-8": "tiktok_es_proyeccion_perfil",
  "step-9": "tiktok_es_oferta",
};

const normalizeSlug = (slug?: string) => {
  if (!slug) return "step-1";
  const lower = slug.toLowerCase().replace(/\/+$/, "");
  if (TIKTOK_ES_STEP_SLUGS.includes(lower as any)) return lower;
  return "step-1";
};

const TikTokEsQuizFunnel = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const { setLang } = useLanguage();
  const [variant] = useState<QuizVariant>(() => getEffectiveVariant());
  const [answers, setAnswers] = useState<QuizAnswers>(() => {
    try {
      const saved = sessionStorage.getItem("tiktok_es_quiz_answers");
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  // Force Spanish language on mount
  useEffect(() => {
    setLang("es");
  }, [setLang]);

  const currentSlug = normalizeSlug(slug);
  const isValidSlug = TIKTOK_ES_STEP_SLUGS.includes(currentSlug as any);

  useEffect(() => {
    if (!slug) {
      navigate(`/tiktok-es/step-1${window.location.search}${window.location.hash}`, { replace: true });
      return;
    }
    if (currentSlug !== slug && TIKTOK_ES_STEP_SLUGS.includes(currentSlug as any)) {
      navigate(`/tiktok-es/${currentSlug}${window.location.search}${window.location.hash}`, { replace: true });
      return;
    }
    if (!isValidSlug) {
      navigate(`/tiktok-es/step-1${window.location.search}${window.location.hash}`, { replace: true });
    }
  }, [slug, currentSlug, isValidSlug, navigate]);

  const stepIndex = TIKTOK_ES_STEP_SLUGS.indexOf(currentSlug as any);
  const step = stepIndex >= 0 ? stepIndex + 1 : 1;
  const stepEnteredAt = useRef<number>(Date.now());
  const isNavigatingRef = useRef(false);

  useEffect(() => {
    document.title = `GTL • Paso ${step}/${TOTAL_STEPS}`;
  }, [step]);

  usePagePresence(`/tiktok-es/${currentSlug}`);

  // Block back navigation
  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [currentSlug]);

  // On reload, redirect to step-1
  const hasRedirected = useRef(false);
  useEffect(() => {
    if (!hasRedirected.current) {
      hasRedirected.current = true;
      const isReload = performance.navigation?.type === 1 ||
        (performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming)?.type === "reload";
      if (isReload && currentSlug !== "step-1") {
        sessionStorage.removeItem("tiktok_es_quiz_answers");
        navigate("/tiktok-es/step-1", { replace: true });
      }
    }
  }, []);

  // Save attribution on step 1
  useEffect(() => {
    if (step === 1) {
      void saveSessionAttribution(variant);
      void saveVariantToAttribution(variant);
    }
  }, [step, variant]);

  // Track time spent
  useEffect(() => {
    stepEnteredAt.current = Date.now();
    isNavigatingRef.current = false;
    saveFunnelEvent("step_viewed", {
      step: `tiktok-es/${currentSlug}`,
      step_name: STEP_NAMES[currentSlug] || currentSlug,
      step_number: step,
      variant,
      funnel: "tiktok-es",
    });
  }, [currentSlug, step]);

  const trackStepComplete = useCallback((answer?: { key: string; value: string }) => {
    const timeSpentMs = Date.now() - stepEnteredAt.current;
    saveFunnelEvent("step_completed", {
      step: `tiktok-es/${currentSlug}`,
      step_name: STEP_NAMES[currentSlug] || currentSlug,
      step_number: step,
      time_spent_ms: timeSpentMs,
      time_spent_seconds: Math.round(timeSpentMs / 1000),
      variant,
      funnel: "tiktok-es",
      ...(answer ? { answer_key: answer.key, answer_value: answer.value } : {}),
    });
  }, [currentSlug, step]);

  const goNext = useCallback(() => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    trackStepComplete();
    const nextStep = Math.min(step + 1, TOTAL_STEPS);
    navigate(`/tiktok-es/${TIKTOK_ES_STEP_SLUGS[nextStep - 1]}`);
    window.scrollTo({ top: 0 });
    window.setTimeout(() => { isNavigatingRef.current = false; }, 500);
  }, [step, navigate, trackStepComplete]);

  const updateAndNext = useCallback(
    (key: keyof QuizAnswers, value: string) => {
      if (isNavigatingRef.current) return;
      isNavigatingRef.current = true;
      trackStepComplete({ key, value });
      setAnswers((prev) => {
        const updated = { ...prev, [key]: value };
        try {
          sessionStorage.setItem("tiktok_es_quiz_answers", JSON.stringify(updated));
        } catch {}
        return updated;
      });
      const nextStep = Math.min(step + 1, TOTAL_STEPS);
      navigate(`/tiktok-es/${TIKTOK_ES_STEP_SLUGS[nextStep - 1]}`);
      window.scrollTo({ top: 0 });
      window.setTimeout(() => { isNavigatingRef.current = false; }, 500);
    },
    [step, navigate, trackStepComplete]
  );

  const renderStep = () => {
    switch (currentSlug) {
      case "step-1":
        return <TikTokEsStep1Landing onNext={goNext} />;
      case "step-2":
        return <Step2Age onNext={(v) => updateAndNext("age", v)} />;
      case "step-3":
        return <Step3SocialProof onNext={goNext} userAge={answers.age} pandaVideoId="cacc3211-9810-4ca7-8d75-5108ec1c843e" />;
      case "step-4":
        return <Step5IncomeGoal onNext={(v) => updateAndNext("incomeGoal", v)} userName={answers.name} userAge={answers.age} />;
      case "step-5":
        return <Step9Availability onNext={(v) => updateAndNext("availability", v)} userName={answers.name} userAge={answers.age} />;
      case "step-6":
        return (
          <StepContactInput
            method="email"
            userName={answers.name}
            onNext={(value) => {
              setAnswers((prev) => {
                const updated = { ...prev, email: value };
                try { sessionStorage.setItem("tiktok_es_quiz_answers", JSON.stringify(updated)); } catch {}
                return updated;
              });
              goNext();
            }}
          />
        );
      case "step-7":
        return <Step10Loading onNext={goNext} userAge={answers.age} />;
      case "step-8":
        return <StepProfileProjection onNext={goNext} userName={answers.name} answers={answers} isTiktok />;
      case "step-9":
        return <Step11SocialProof2 onNext={() => {}} userAge={answers.age} pandaVideoId="23cf5521-529d-4627-8144-980f0552575f" pandaButtonId="eb600fb7-bf10-4f88-9b1f-0312a24ad094" videoAspectRatio="16:9" />;
      default:
        return null;
    }
  };

  if (!isValidSlug) return null;

  const showProgressCounter = step <= PROGRESS_STEPS;
  const progressCurrent = showProgressCounter ? step - 1 : PROGRESS_STEPS;
  const progressTotal = PROGRESS_STEPS;

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      {step > 1 && (
        <header className="w-full bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
          <div className="max-w-lg mx-auto px-3 py-2 sm:py-3 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <h1 className="font-bold text-foreground tracking-tight whitespace-nowrap text-sm sm:text-lg">
                <span className="text-gradient-green font-extrabold">GTL</span>
                <span className="text-foreground/80 font-semibold ml-1.5 text-[11px] sm:text-sm uppercase tracking-wider">
                  Ganancias Tiempo Libre
                </span>
              </h1>
            </div>
          </div>
          <ProgressBar current={progressCurrent} total={progressTotal} />
        </header>
      )}

      <main className="flex-1 flex items-start justify-center pt-2" key={step}>
        {renderStep()}
      </main>

      <footer className="w-full py-3 border-t border-border">
        <p className="text-xs sm:text-sm text-muted-foreground text-center">
          © 2026 — Plataforma Ganancias con Tiempo Libre • Todos los derechos reservados
        </p>
      </footer>
    </div>
  );
};

export default TikTokEsQuizFunnel;
