import { useEffect, useRef } from "react";
import { StepContainer, CTAButton } from "./QuizUI";
import { useLanguage } from "@/lib/i18n";

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
        <div className="relative w-full" style={{ paddingTop: "50%" }}>
          <iframe
            id="panda-f97837c4-d33c-4e5a-8ae3-27f0e36f2b6d"
            src="https://player-vz-350772d9-cdc.tv.pandavideo.com.br/embed/?v=f97837c4-d33c-4e5a-8ae3-27f0e36f2b6d"
            className="absolute inset-0 w-full h-full rounded-xl"
            style={{ border: "none" }}
            allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture"
            allowFullScreen
            {...{ fetchPriority: "high" } as any}
          />
        </div>
      </div>

      {/* CTA */}
      <div className="w-full mt-4">
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
