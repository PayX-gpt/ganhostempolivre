import { useEffect, useRef, useState } from "react";
import { StepContainer, CTAButton } from "./QuizUI";
import { useLanguage } from "@/lib/i18n";
import { usePandaPreload } from "@/lib/usePandaPreload";

interface Step1VariantEProps {
  onNext: () => void;
}

const texts = {
  pt: { cta: "CLIQUE AGORA PARA CONTINUAR →" },
  en: { cta: "CLICK NOW TO CONTINUE →" },
  es: { cta: "HAZ CLIC AHORA PARA CONTINUAR →" },
} as const;

const Step1VariantE = ({ onNext }: Step1VariantEProps) => {
  const { lang } = useLanguage();
  const t = texts[lang];
  const iframeRef = useRef<HTMLDivElement>(null);
  const [showCta, setShowCta] = useState(false);

  usePandaPreload("f97837c4-d33c-4e5a-8ae3-27f0e36f2b6d");

  // CTA appears 60s after page load — watchdog based on absolute time so it
  // still fires if the tab was throttled/backgrounded or the player fails.
  useEffect(() => {
    const startedAt = Date.now();
    const reveal = () => setShowCta(true);
    const timer = setTimeout(reveal, 60000);
    const watchdog = setInterval(() => {
      if (Date.now() - startedAt >= 60000) {
        reveal();
        clearInterval(watchdog);
      }
    }, 1000);
    const onVisible = () => {
      if (document.visibilityState === "visible" && Date.now() - startedAt >= 60000) reveal();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearTimeout(timer);
      clearInterval(watchdog);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  // Send parent context to Panda iframe
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "panda_ready") {
        const iframe = iframeRef.current?.querySelector("iframe");
        iframe?.contentWindow?.postMessage(
          { type: "PANDA_CONTEXT", url: window.location.href },
          "*"
        );
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  return (
    <StepContainer>
      {/* Video */}
      <div className="w-full max-w-lg mx-auto" ref={iframeRef}>
        <div className="relative w-full" style={{ paddingTop: "177.77777777777777%" }}>
          <iframe
            id="panda-f97837c4-d33c-4e5a-8ae3-27f0e36f2b6d"
            src="https://player-vz-350772d9-cdc.tv.pandavideo.com.br/embed/?v=f97837c4-d33c-4e5a-8ae3-27f0e36f2b6d"
            className="absolute inset-0 w-full h-full"
            style={{ border: "none" }}
            allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture"
            allowFullScreen
            {...{ fetchPriority: "high" } as any}
          />
        </div>
      </div>

      {/* CTA */}
      <div className={`w-full mt-4 transition-all duration-700 ${showCta ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}>
        <button
          onClick={onNext}
          className="w-full py-4 px-6 rounded-xl font-extrabold text-[15px] sm:text-xl text-black uppercase tracking-wide animate-bounce-subtle transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
          style={{
            background: "linear-gradient(135deg, #FFD600 0%, #FFB300 100%)",
            boxShadow: "0 4px 20px rgba(255, 214, 0, 0.4)",
          }}
        >
          {t.cta}
        </button>
      </div>
    </StepContainer>
  );
};

export default Step1VariantE;
