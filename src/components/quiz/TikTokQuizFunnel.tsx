import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ProgressBar, type QuizAnswers } from "./QuizUI";
import { usePagePresence } from "@/hooks/usePagePresence";
import { saveFunnelEvent } from "@/lib/metricsClient";
import { saveSessionAttribution } from "@/lib/trackingDataLayer";
import { useLanguage, LanguageSelector, type Language } from "@/lib/i18n";
import Step1Intro from "./Step1Intro";
import Step1VariantB from "./Step1VariantB";
import Step1VariantC from "./Step1VariantC";
import Step1VariantD from "./Step1VariantD";
import { getEffectiveVariant, saveVariantToAttribution, type QuizVariant } from "@/lib/abTestVariant";
import Step2Age from "./Step2Age";
import Step3SocialProof from "./Step3SocialProof";
import Step5IncomeGoal from "./Step5IncomeGoal";
import Step9Availability from "./Step9Availability";
import StepContactInput from "./StepContactInput";
import StepPlatformDemo from "./StepPlatformDemo";
import Step10Loading from "./Step10Loading";
import StepProfileProjection from "./StepProfileProjection";
import Step11SocialProof2 from "./Step11SocialProof2";

const footerTexts: Record<Language, string> = {
  pt: "© 2026 — Plataforma de Ganhos com Tempo Livre • Todos os direitos reservados",
  en: "© 2026 — Free Time Earnings Platform • All rights reserved",
  es: "© 2026 — Plataforma Ganancias con Tiempo Libre • Todos los derechos reservados",
};

const stepBadgeTexts: Record<Language, string> = {
  pt: "Etapa",
  en: "Step",
  es: "Paso",
};

const TIKTOK_STEP_SLUGS = [
  "step-1",   // → original step-1 (intro)
  "step-2",   // → original step-2 (idade)
  "step-3",   // → original step-4 (vídeo depoimento Dona Márcia)
  "step-4",   // → original step-6 (meta de renda)
  "step-5",   // → original step-10 (disponibilidade 10 min)
  "step-6",   // → original step-11 (demo plataforma) ← NOVO
  "step-7",   // → original step-14 (campo email com timer)
  "step-8",   // → original step-15 (loading)
  "step-9",   // → original step-16 (projeção perfil)
  "step-10",  // → original step-17 (vídeo vendas final)
] as const;

const TOTAL_STEPS = TIKTOK_STEP_SLUGS.length;
const PROGRESS_STEPS = 7; // steps 1-7 show progress

const STEP_NAMES: Record<string, string> = {
  "step-1": "tiktok_intro",
  "step-2": "tiktok_idade",
  "step-3": "tiktok_prova_social",
  "step-4": "tiktok_meta_renda",
  "step-5": "tiktok_disponibilidade",
  "step-6": "tiktok_demo_plataforma",
  "step-7": "tiktok_input_contato",
  "step-8": "tiktok_loading",
  "step-9": "tiktok_projecao_perfil",
  "step-10": "tiktok_oferta_vturb",
};

const normalizeSlug = (slug?: string) => {
  if (!slug) return "step-1";
  const lower = slug.toLowerCase().replace(/\/+$/, "");
  if (TIKTOK_STEP_SLUGS.includes(lower as any)) return lower;
  return "step-1";
};

const TikTokQuizFunnel = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const { lang } = useLanguage();
  const [variant] = useState<QuizVariant>(() => getEffectiveVariant());
  const [answers, setAnswers] = useState<QuizAnswers>(() => {
    try {
      const saved = sessionStorage.getItem("tiktok_quiz_answers");
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  const currentSlug = normalizeSlug(slug);
  const isValidSlug = TIKTOK_STEP_SLUGS.includes(currentSlug as any);

  useEffect(() => {
    if (!slug) {
      navigate(`/tiktok/step-1${window.location.search}${window.location.hash}`, { replace: true });
      return;
    }
    if (currentSlug !== slug && TIKTOK_STEP_SLUGS.includes(currentSlug as any)) {
      navigate(`/tiktok/${currentSlug}${window.location.search}${window.location.hash}`, { replace: true });
      return;
    }
    if (!isValidSlug) {
      navigate(`/tiktok/step-1${window.location.search}${window.location.hash}`, { replace: true });
    }
  }, [slug, currentSlug, isValidSlug, navigate]);

  const stepIndex = TIKTOK_STEP_SLUGS.indexOf(currentSlug as any);
  const step = stepIndex >= 0 ? stepIndex + 1 : 1;
  const stepEnteredAt = useRef<number>(Date.now());
  const isNavigatingRef = useRef(false);

  useEffect(() => {
    document.title = `GTL • ${stepBadgeTexts[lang]} ${step}/${TOTAL_STEPS}`;
  }, [lang, step]);

  usePagePresence(`/tiktok/${currentSlug}`);

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
        sessionStorage.removeItem("tiktok_quiz_answers");
        navigate("/tiktok/step-1", { replace: true });
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
      step: `tiktok/${currentSlug}`,
      step_name: STEP_NAMES[currentSlug] || currentSlug,
      step_number: step,
      variant,
      funnel: "tiktok",
    });
  }, [currentSlug, step]);

  const trackStepComplete = useCallback((answer?: { key: string; value: string }) => {
    const timeSpentMs = Date.now() - stepEnteredAt.current;
    saveFunnelEvent("step_completed", {
      step: `tiktok/${currentSlug}`,
      step_name: STEP_NAMES[currentSlug] || currentSlug,
      step_number: step,
      time_spent_ms: timeSpentMs,
      time_spent_seconds: Math.round(timeSpentMs / 1000),
      variant,
      funnel: "tiktok",
      ...(answer ? { answer_key: answer.key, answer_value: answer.value } : {}),
    });
  }, [currentSlug, step]);

  const goNext = useCallback(() => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    trackStepComplete();
    const nextStep = Math.min(step + 1, TOTAL_STEPS);
    navigate(`/tiktok/${TIKTOK_STEP_SLUGS[nextStep - 1]}`);
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
          sessionStorage.setItem("tiktok_quiz_answers", JSON.stringify(updated));
        } catch {}
        return updated;
      });
      const nextStep = Math.min(step + 1, TOTAL_STEPS);
      navigate(`/tiktok/${TIKTOK_STEP_SLUGS[nextStep - 1]}`);
      window.scrollTo({ top: 0 });
      window.setTimeout(() => { isNavigatingRef.current = false; }, 500);
    },
    [step, navigate, trackStepComplete]
  );

  const renderStep = () => {
    switch (currentSlug) {
      case "step-1": // intro (original step-1)
        switch (variant) {
          case "B": return <Step1VariantB onNext={goNext} />;
          case "C": return <Step1VariantC onNext={goNext} />;
          case "D": return <Step1VariantD onNext={goNext} />;
          default: return <Step1Intro onNext={goNext} />;
        }
      case "step-2": // idade (original step-2)
        return <Step2Age onNext={(v) => updateAndNext("age", v)} />;
      case "step-3": // prova social vídeo (original step-4)
        return <Step3SocialProof onNext={goNext} userAge={answers.age} />;
      case "step-4": // meta de renda (original step-6)
        return <Step5IncomeGoal onNext={(v) => updateAndNext("incomeGoal", v)} userName={answers.name} userAge={answers.age} />;
      case "step-5": // disponibilidade (original step-10)
        return <Step9Availability onNext={(v) => updateAndNext("availability", v)} userName={answers.name} userAge={answers.age} />;
      case "step-6": // demo plataforma (original step-11)
        return <StepPlatformDemo onNext={goNext} userName={answers.name} />;
      case "step-7": // email input (original step-14)
        return (
          <StepContactInput
            method="email"
            userName={answers.name}
            onNext={(value) => {
              setAnswers((prev) => {
                const updated = { ...prev, email: value };
                try { sessionStorage.setItem("tiktok_quiz_answers", JSON.stringify(updated)); } catch {}
                return updated;
              });
              goNext();
            }}
          />
        );
      case "step-8": // loading (original step-15)
        return <Step10Loading onNext={goNext} userAge={answers.age} />;
      case "step-9": // projeção perfil (original step-16)
        return <StepProfileProjection onNext={goNext} userName={answers.name} answers={answers} isTiktok />;
      case "step-10": // oferta vturb (original step-17)
        return <Step11SocialProof2 onNext={() => {}} userAge={answers.age} vturbVideoId="69d3a4e6781b1e0902fd6f9b" />;
      default:
        return null;
    }
  };

  if (!isValidSlug) return null;

  // Progress: steps 1-6 show "X of 6", steps 7-9 show 100%
  const showProgressCounter = step <= PROGRESS_STEPS;
  const progressCurrent = showProgressCounter ? step - 1 : PROGRESS_STEPS;
  const progressTotal = PROGRESS_STEPS;

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      <header className="w-full bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="max-w-lg mx-auto px-3 py-2 sm:py-3 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h1 className="font-bold text-foreground tracking-tight whitespace-nowrap text-sm sm:text-lg">
              <span className="text-gradient-green font-extrabold">
                {lang === "pt" ? "GTL" : lang === "en" ? "FTE" : "GTL"}
              </span>
              <span className="text-foreground/80 font-semibold ml-1.5 text-[11px] sm:text-sm uppercase tracking-wider">
                {lang === "pt" ? "Ganhos com Tempo Livre" : lang === "en" ? "Free Time Earnings" : "Ganancias Tiempo Libre"}
              </span>
            </h1>
          </div>
          <LanguageSelector />
        </div>
        <ProgressBar current={progressCurrent} total={progressTotal} />
      </header>

      <main className="flex-1 flex items-start justify-center pt-2" key={step}>
        {renderStep()}
      </main>

      <footer className="w-full py-3 border-t border-border">
        <p className="text-xs sm:text-sm text-muted-foreground text-center">
          {footerTexts[lang]}
        </p>
      </footer>
    </div>
  );
};

export default TikTokQuizFunnel;
