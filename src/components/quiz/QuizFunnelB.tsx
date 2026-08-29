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
import { getEffectiveQuizVersion, shouldSkipStep, saveQuizVersionToAttribution, type QuizVersion } from "@/lib/quizVersionAB";
import { saveEditionToAttribution } from "@/lib/quizEdition";
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
import VturbVideoStep from "./VturbVideoStep";

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

// QUIZ B — 19 etapas (modelo "IA PRO" adaptado ao nosso contexto: 50+, segurança).
const STEP_SLUGS = [
  "step-1",   // 1: Intro / Hook
  "step-2",   // 2: Idade
  "step-3",   // 3: Nome
  "step-4",   // 4: Prova social (depoimentos)
  "step-5",   // 5: Tentou online
  "step-6",   // 6: Meta de renda
  "step-7",   // 7: Obstáculo
  "step-8",   // 8: 🎥 VÍDEO 1 — Como funciona (vturb)
  "step-9",   // 9: Saldo na conta
  "step-10",  // 10: Disponibilidade
  "step-11",  // 11: 🎥 VÍDEO 2 — 15 a 30 min bastam (vturb)
  "step-12",  // 12: IA Liberada / Demo (aprovado + operar e ganhar)
  "step-13",  // 13: 🎥 VÍDEO 3 — Acessar, operar e sacar (vturb)
  "step-14",  // 14: Prova social 2 (WhatsApp)
  "step-15",  // 15: Método de contato
  "step-16",  // 16: Input de contato
  "step-17",  // 17: Analisando (loading)
  "step-18",  // 18: 🎥 VÍDEO 4 — Como vai funcionar (vturb)
  "step-19",  // 19: OFERTA / PITCH (VSL + checkout)
] as const;

const TOTAL_STEPS = STEP_SLUGS.length;

const STEP_NAMES: Record<string, string> = {
  "step-1": "b_intro", "step-2": "b_idade", "step-3": "b_nome", "step-4": "b_prova_social",
  "step-5": "b_tentou_online", "step-6": "b_meta_renda", "step-7": "b_obstaculo",
  "step-8": "b_video1_como_funciona", "step-9": "b_saldo", "step-10": "b_disponibilidade",
  "step-11": "b_video2_tempo", "step-12": "b_ia_liberada", "step-13": "b_video3_saque",
  "step-14": "b_prova_social2", "step-15": "b_metodo_contato", "step-16": "b_input_contato",
  "step-17": "b_loading", "step-18": "b_video4_funcionar", "step-19": "b_oferta_pitch",
};

const STEP_ALIASES: Record<string, (typeof STEP_SLUGS)[number]> = {
  step1: "step-1", step2: "step-2", step3: "step-3", step4: "step-4", step5: "step-5",
  step6: "step-6", step7: "step-7", step8: "step-8", step9: "step-9", step10: "step-10",
  step11: "step-11", step12: "step-12", step13: "step-13", step14: "step-14", step15: "step-15",
  step16: "step-16", step17: "step-17", step18: "step-18", step19: "step-19",
};

const normalizeSlug = (slug?: string) => {
  if (!slug) return "step-1";
  // Strip trailing slashes, dots, and other punctuation that some ad networks append
  const lower = slug.toLowerCase().replace(/[\/.\s,;:!?]+$/, "");
  if (STEP_SLUGS.includes(lower as any)) return lower;
  return STEP_ALIASES[lower] ?? lower;
};

// ─────────────────────────────────────────────────────────────────────────
// QUIZ B — Edição paralela (teste A/B de funil completo).
// Começa como cópia EXATA do Quiz A. As mudanças que você pedir (etapas extras,
// remover etapas, trocar vídeos, copy) são feitas AQUI — o Quiz A não é tocado.
// ─────────────────────────────────────────────────────────────────────────
const QuizFunnelB = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const { lang } = useLanguage();
  // Modo preview do Studio: ?preview=1 → renderiza a etapa SEM rastrear, sem
  // redirecionar e sem registrar presença. Inerte para o visitante real.
  const isPreview = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("preview") === "1";
  const [variant] = useState<QuizVariant>(() => {
    const urlVariant = new URLSearchParams(window.location.search).get("variant")?.toUpperCase();
    if (urlVariant && ["A","B","C","D","E"].includes(urlVariant)) return urlVariant as QuizVariant;
    return getEffectiveVariant();
  });
  const [quizVersion] = useState<QuizVersion>(() => getEffectiveQuizVersion());
  const [answers, setAnswers] = useState<QuizAnswers>(() => {
    try {
      const saved = sessionStorage.getItem("quiz_answers");
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });
  const currentSlug = normalizeSlug(slug);
  const isValidQuizSlug = STEP_SLUGS.includes(currentSlug as any);

  // Guard: if the slug belongs to a known non-quiz route, bail out immediately
  const NON_QUIZ_ROUTES = ["upsell1", "upsell2", "upsell3", "upsell4", "upsell5", "upsell6", "live", "live-demo", "oferta", "tiktok", "go"];
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

  usePagePresence(`/${currentSlug}`, !isPreview);

  // Block back navigation
  useEffect(() => {
    if (isPreview) return;
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
    if (isPreview) return;
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
    if (isPreview) return;
    if (step === 1) {
      void saveSessionAttribution(variant as string);
      void saveVariantToAttribution(variant);
      void saveQuizVersionToAttribution(quizVersion);
      void saveEditionToAttribution("B");
    }
  }, [step, variant, quizVersion]);

  // Track time spent when step changes
  useEffect(() => {
    stepEnteredAt.current = Date.now();
    isNavigatingRef.current = false;
    if (isPreview) return;
    saveFunnelEvent("step_viewed", {
      step: currentSlug,
      step_name: STEP_NAMES[currentSlug] || currentSlug,
      step_number: step,
      variant,
      quiz_version: quizVersion,
      edition: "B",
    });
  }, [currentSlug, step, quizVersion]);

  const trackStepComplete = useCallback((answer?: { key: string; value: string }) => {
    if (isPreview) return;
    const timeSpentMs = Date.now() - stepEnteredAt.current;
    saveFunnelEvent("step_completed", {
      step: currentSlug,
      step_name: STEP_NAMES[currentSlug] || currentSlug,
      step_number: step,
      time_spent_ms: timeSpentMs,
      time_spent_seconds: Math.round(timeSpentMs / 1000),
      variant,
      quiz_version: quizVersion,
      edition: "B",
      ...(answer ? { answer_key: answer.key, answer_value: answer.value } : {}),
    });
  }, [currentSlug, step, quizVersion]);

  // Quiz B tem fluxo próprio — segue sequencial, sem o "pular etapas" do teste V1/V2.
  const findNextStep = useCallback((fromStep: number): number => {
    return Math.min(fromStep + 1, TOTAL_STEPS);
  }, []);

  const goNext = useCallback(() => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;

    trackStepComplete();
    const nextStep = findNextStep(step);
    navigate(`/${STEP_SLUGS[nextStep - 1]}`);
    window.scrollTo({ top: 0 });

    window.setTimeout(() => {
      isNavigatingRef.current = false;
    }, 500);
  }, [step, navigate, trackStepComplete, findNextStep]);

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
      const nextStep = findNextStep(step);
      navigate(`/${STEP_SLUGS[nextStep - 1]}`);
      window.scrollTo({ top: 0 });

      window.setTimeout(() => {
        isNavigatingRef.current = false;
      }, 500);
    },
    [step, navigate, trackStepComplete, findNextStep]
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
        return <Step4TriedOnline onNext={(v) => updateAndNext("triedOnline", v)} userName={answers.name} userAge={answers.age} quizVersion={quizVersion} />;
      case "step-6":
        return <Step5IncomeGoal onNext={(v) => updateAndNext("incomeGoal", v)} userName={answers.name} userAge={answers.age} />;
      case "step-7":
        return <Step6Obstacle onNext={(v) => updateAndNext("obstacle", v)} userName={answers.name} userAge={answers.age} quizVersion={quizVersion} />;
      case "step-8":
        // 🎥 VÍDEO 1 — Como funciona
        return <VturbVideoStep playerId="69b9877521afa4b7be25e6a7" revealSeconds={30}
          headline={<>Veja como funciona <span className="text-gradient-green">essa oportunidade</span></>}
          subheadline="Assista até o fim — em 30 segundos você entende tudo."
          buttonText="Continuar →" onClick={goNext} />;
      case "step-9":
        return <StepAccountBalance onNext={(v) => updateAndNext("accountBalance", v)} userName={answers.name} userAge={answers.age} />;
      case "step-10":
        return <Step9Availability onNext={(v) => updateAndNext("availability", v)} userName={answers.name} userAge={answers.age} />;
      case "step-11":
        // 🎥 VÍDEO 2 — 15 a 30 min bastam
        return <VturbVideoStep playerId="69b9877fa10d9a398ac7bc42" revealSeconds={115}
          headline={<>Só com <span className="text-gradient-green">15 a 30 minutos por dia</span></>}
          subheadline="A parte mais tranquila: pouco tempo, sem pressão."
          buttonText="Continuar →" onClick={goNext} />;
      case "step-12":
        // IA Liberada / Demo — "Parabéns, você foi aprovado" + operar e ganhar
        return <StepPlatformDemo onNext={goNext} userName={answers.name} />;
      case "step-13":
        // 🎥 VÍDEO 3 — Acessar, operar e sacar
        return <VturbVideoStep playerId="69b98793faf9397e233e1dd5" revealSeconds={54}
          headline={<>Como acessar, operar e <span className="text-gradient-green">fazer seu saque</span></>}
          subheadline="Veja como o dinheiro entra e sai — de forma simples e segura."
          buttonText="Continuar →" onClick={goNext} />;
      case "step-14":
        return <StepWhatsAppProof onNext={goNext} userAge={answers.age} />;
      case "step-15":
        return <StepContactMethod userName={answers.name} onNext={(v) => updateAndNext("contactMethod", v)} />;
      case "step-16":
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
      case "step-17":
        return <Step10Loading onNext={goNext} userAge={answers.age} userName={answers.name} />;
      case "step-18":
        // 🎥 VÍDEO 4 — PITCH + APROVAÇÃO disfarçado. O botão vai DIRETO pro checkout,
        // aparecendo aos 366s (= 40s antes do fim do vídeo de ~406s). NÃO passa pela
        // oferta antiga do "senhor".
        return <VturbVideoStep playerId="6a07a12e86b03df313b90694" revealSeconds={366}
          headline={<>Você foi <span className="text-gradient-green">APROVADO</span>. Assista até o fim e destrave sua renda de <span className="text-gradient-green">R$50 a R$300 por dia</span>.</>}
          subheadline="Nos próximos minutos você vê, passo a passo, como pessoas comuns (até 60, 70 anos) já estão pagando as contas com tranquilidade — e como garantir o SEU acesso hoje, antes de fechar."
          buttonText="GARANTIR MEU ACESSO AGORA →"
          checkoutUrl="https://pay.kirvano.com/4630333d-d5d1-4591-b767-2151f77c6b13"
          amount={47}
          eventContext="b_video4_pitch_checkout"
          onClick={goNext} />;
      case "step-19":
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

export default QuizFunnelB;
