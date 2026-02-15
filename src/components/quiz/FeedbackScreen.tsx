import { useRef, useEffect } from "react";
import { StepContainer, CTAButton } from "./QuizUI";
import { Sparkles, Quote } from "lucide-react";

interface FeedbackScreenProps {
  icon?: React.ReactNode;
  eyebrow?: string;
  title: string;
  message: string;
  highlight?: string;
  onNext: () => void;
  buttonText?: string;
}

const FeedbackScreen = ({
  icon,
  eyebrow,
  title,
  message,
  highlight,
  onNext,
  buttonText = "Continuar →",
}: FeedbackScreenProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  return (
    <StepContainer>
      <div ref={containerRef} className="w-full flex flex-col items-center gap-6 py-2">
        {/* Eyebrow badge */}
        {eyebrow && (
          <div className="inline-flex items-center gap-1.5 bg-accent/10 border border-accent/20 rounded-full px-4 py-1.5 animate-fade-in">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span className="text-xs font-bold text-accent uppercase tracking-wider">{eyebrow}</span>
          </div>
        )}

        {/* Icon */}
        {icon && (
          <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/25 flex items-center justify-center animate-fade-in">
            {icon}
          </div>
        )}

        {/* Title */}
        <h2 className="font-display text-[1.35rem] sm:text-[1.6rem] font-bold text-foreground text-center leading-[1.3] tracking-tight">
          {title}
        </h2>

        {/* Message card */}
        <div className="w-full bg-card border border-border rounded-2xl p-5 relative overflow-hidden">
          <Quote className="w-8 h-8 text-accent/15 absolute top-3 left-3" />
          <p className="text-[0.95rem] sm:text-base text-foreground/80 leading-[1.75] relative z-10 pl-2">
            {message}
          </p>
          {highlight && (
            <div className="mt-4 pt-3 border-t border-border/60">
              <p className="text-sm font-bold text-accent text-center">
                {highlight}
              </p>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="w-full mt-1">
          <CTAButton onClick={onNext}>
            {buttonText}
          </CTAButton>
        </div>
      </div>
    </StepContainer>
  );
};

export default FeedbackScreen;
