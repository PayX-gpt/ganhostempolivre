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
import Step1VariantE from "./Step1VariantE";
import { getEffectiveVariant, saveVariantToAttribution, type QuizVariant } from "@/lib/abTestVariant";
import Step2Age from "./Step2Age";
import StepName from "./StepName";
import Step3SocialProof from "./Step3SocialProof";
import Step4TriedOnline from "./Step4TriedOnline";
import Step5IncomeGoal from "./Step5IncomeGoal";
import Step6Obstacle from "./Step6Obstacle";
import Step7MentorVideo from "./Step7MentorVideo";
import StepAccountBalance from "./StepAccountBalance";
import Step9Availability from "./Step9Availability";
import StepPlatformDemo from "./StepPlatformDemo";
import Step10Loading from "./Step10Loading";
import Step11SocialProof2 from "./Step11SocialProof2";
import StepWhatsAppProof from "./StepWhatsAppProof";
import StepContactMethod from "./StepContactMethod";
import StepContactInput from "./StepContactInput";
import Step13Offer from "./Step13Offer";
import StepProfileProjection from "./StepProfileProjection";

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

const STEP_SLUGS = [
  "step-1",  // 1: Intro
  "step-2",  // 2: Idade
  "step-3",  // 3: Nome
  "step-4",  // 4: Prova social (vídeo depoimento)
  "step-5",  // 5: Tentou online
  "step-6",  // 6: Meta de renda
  "step-7",  // 7: Obstáculo
  "step-8",  // 8: Vídeo mentor
  "step-9",  // 9: Saldo na conta (preço dinâmico)
  "step-10", // 10: Disponibilidade (binário)
  "step-11", // 11: Demo plataforma
  "step-12", // 12: WhatsApp proof
  "step-13", // 13: Método contato
  "step-14", // 14: Input contato
  "step-15", // 15: Loading (análise)
  "step-16", // 16: Projeção de perfil e lucro
  "step-17", // 17: Prova social 2 + vídeo venda (OFERTA FINAL via Vturb CTA)
] as const;

const TOTAL_STEPS = STEP_SLUGS.length;

const STEP_NAMES: Record<string, string> = {
  "step-1": "intro", "step-2": "idade", "step-3": "nome", "step-4": "prova_social",
  "step-5": "tentou_online", "step-6": "meta_renda", "step-7": "obstaculo",
  "step-8": "video_mentor", "step-9": "saldo_conta", "step-10": "disponibilidade",
  "step-11": "demo_plataforma", "step-12": "whatsapp_proof", "step-13": "metodo_contato",
  "step-14": "input_contato", "step-15": "loading", "step-16": "projecao_perfil",
  "step-17": "oferta_vturb",
};

const STEP_ALIASES: Record<string, (typeof STEP_SLUGS)[number]> = {
  step1: "step-1",
  step2: "step-2",
  step3: "step-3",
  step4: "step-4",
  step5: "step-5",
  step6: "step-6",
  step7: "step-7",
  step8: "step-8",
  step9: "step-9",
  step10: "step-10",
  step11: "step-11",
  step12: "step-12",
  step13: "step-13",
  step14: "step-14",
  step15: "step-15",
  step16: "step-16",
  step17: "step-17",
  // Legacy: redirect step-18 to step-17 (offer is now on Vturb CTA)
  "step-18": "step-17",
  step18: "step-17",
};

const normalizeSlug = (slug?: string) => {
  if (!slug) return "step-1";
  const lower = slug.toLowerCase().replace(/\/+$/, "");
  if (STEP_SLUGS.includes(lower as any)) return lower;
  return STEP_ALIASES[lower] ?? slug;
};

const QuizFunnel = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const { lang } = useLanguage();
  const [variant] = useState<QuizVariant>(() => getEffectiveVariant());
  const [answers, setAnswers] = useState<QuizAnswers>(() => {
    try {
      const saved = sessionStorage.getItem("quiz_answers");
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });
  const currentSlug = normalizeSlug(slug);
  const isValidQuizSlug = STEP_SLUGS.includes(currentSlug as any);

  // Guard: if the slug belongs to a known non-quiz route, bail out immediately
  const NON_QUIZ_ROUTES = ["upsell1", "upsell2", "upsell3", "upsell4", "upsell5", "upsell6", "live", "oferta", "tiktok", "go"];
  const isNonQuizRoute = slug && NON_QUIZ_ROUTES.includes(slug);

  useEffect(() => {
    if (!slug) {
      navigate(`/step-1${window.location.search}${window.location.hash}`, { replace: true });
      return;
    }

    if (isNonQuizRoute) {
      window.location.replace(`/${slug}${window.location.search}`);
      return;
    }

    if (currentSlug !== slug && STEP_SLUGS.includes(currentSlug as any)) {
      navigate(`/${currentSlug}${window.location.search}${window.location.hash}`, { replace: true });
      return;
    }

    if (!isValidQuizSlug) {
      navigate(`/step-1${window.location.search}${window.location.hash}`, { replace: true });
    }
  }, [slug, currentSlug, isValidQuizSlug, isNonQuizRoute, navigate]);

  const stepIndex = STEP_SLUGS.indexOf(currentSlug as any);
  const step = stepIndex >= 0 ? stepIndex + 1 : 1;
  const stepEnteredAt = useRef<number>(Date.now());
  const isNavigatingRef = useRef(false);

  useEffect(() => {
    document.title = `GTL • ${stepBadgeTexts[lang]} ${step}/${TOTAL_STEPS}`;
  }, [lang, step]);

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

  // Save attribution on funnel entry (step 1)
  useEffect(() => {
    if (step === 1) {
      void saveSessionAttribution(variant as string);
      void saveVariantToAttribution(variant);
    }
  }, [step, variant]);

  // Track time spent when step changes
  useEffect(() => {
    stepEnteredAt.current = Date.now();
    isNavigatingRef.current = false;
    saveFunnelEvent("step_viewed", {
      step: currentSlug,
      step_name: STEP_NAMES[currentSlug] || currentSlug,
      step_number: step,
      variant,
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
      variant,
      ...(answer ? { answer_key: answer.key, answer_value: answer.value } : {}),
    });
  }, [currentSlug, step]);

  const goNext = useCallback(() => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;

    trackStepComplete();
    const nextStep = Math.min(step + 1, TOTAL_STEPS);
    navigate(`/${STEP_SLUGS[nextStep - 1]}`);
    window.scrollTo({ top: 0 });

    window.setTimeout(() => {
      isNavigatingRef.current = false;
    }, 500);
  }, [step, navigate, trackStepComplete]);

  const updateAndNext = useCallback(
    (key: keyof QuizAnswers, value: string) => {
      if (isNavigatingRef.current) return;
      isNavigatingRef.current = true;

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

      window.setTimeout(() => {
        isNavigatingRef.current = false;
      }, 500);
    },
    [step, navigate, trackStepComplete]
  );

  const renderStep = () => {
    switch (currentSlug) {
      case "step-1":
        switch (variant) {
          case "B": return <Step1VariantB onNext={goNext} />;
          case "C": return <Step1VariantC onNext={goNext} />;
          case "D": return <Step1VariantD onNext={goNext} />;
          case "E": return <Step1VariantE onNext={goNext} />;
          default: return <Step1Intro onNext={goNext} />;
        }
      case "step-2":
        return <Step2Age onNext={(v) => updateAndNext("age", v)} />;
      case "step-3":
        return <StepName onNext={(name) => updateAndNext("name", name)} />;
      case "step-4":
        return <Step3SocialProof onNext={goNext} userAge={answers.age} />;
      case "step-5":
        return <Step4TriedOnline onNext={(v) => updateAndNext("triedOnline", v)} userName={answers.name} userAge={answers.age} />;
      case "step-6":
        return <Step5IncomeGoal onNext={(v) => updateAndNext("incomeGoal", v)} userName={answers.name} userAge={answers.age} />;
      case "step-7":
        return <Step6Obstacle onNext={(v) => updateAndNext("obstacle", v)} userName={answers.name} userAge={answers.age} />;
      case "step-8":
        return <Step7MentorVideo onNext={goNext} userAge={answers.age} />;
      case "step-9":
        return <StepAccountBalance onNext={(v) => updateAndNext("accountBalance", v)} userName={answers.name} userAge={answers.age} />;
      case "step-10":
        return <Step9Availability onNext={(v) => updateAndNext("availability", v)} userName={answers.name} userAge={answers.age} />;
      case "step-11":
        return <StepPlatformDemo onNext={goNext} userName={answers.name} />;
      case "step-12":
        return <StepWhatsAppProof onNext={goNext} userAge={answers.age} />;
      case "step-13":
        return <StepContactMethod userName={answers.name} onNext={(v) => updateAndNext("contactMethod", v)} />;
      case "step-14":
        return (
          <StepContactInput
            method={answers.contactMethod || "email"}
            userName={answers.name}
            onNext={(value) => {
              if (answers.contactMethod === "whatsapp") {
                setAnswers((prev) => ({ ...prev, phone: value }));
                const cleanPhone = value.replace(/\D/g, "");
                if (cleanPhone.length >= 10) {
                  const sessionId = sessionStorage.getItem("session_id") || localStorage.getItem("session_id") || "";
                  const sendAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
                  (async () => {
                    try {
                      const { supabase } = await import("@/integrations/supabase/client");
                      const { error } = await supabase.from("whatsapp_welcome_queue").insert({
                        phone: cleanPhone,
                        lead_name: answers.name || null,
                        session_id: sessionId || null,
                        send_at: sendAt,
                        lead_type: "unknown",
                        purchased: false,
                        sent: false,
                      });

                      if (error) {
                        console.warn("WhatsApp queue insert error:", error.message);
                      } else {
                        console.log("✅ Lead enqueued for WhatsApp welcome");
                      }
                    } catch (err) {
                      console.error("Unexpected WhatsApp queue error:", err);
                    }
                  })();
                }
              } else {
                setAnswers((prev) => ({ ...prev, email: value }));
              }
              goNext();
            }}
          />
        );
      case "step-15":
        return <Step10Loading onNext={goNext} userAge={answers.age} />;
      case "step-16":
        return <StepProfileProjection onNext={goNext} userName={answers.name} answers={answers} />;
      case "step-17":
        return <Step11SocialProof2 onNext={() => {}} userAge={answers.age} />;
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
        {step > 1 && step < TOTAL_STEPS && <ProgressBar current={progressCurrent} total={progressTotal} />}
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

export default QuizFunnel;
