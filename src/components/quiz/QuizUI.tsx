import { Lock } from "lucide-react";

export interface QuizAnswers {
  age?: string;
  name?: string;
  triedOnline?: string;
  incomeGoal?: string;
  obstacle?: string;
  financialDream?: string;
  device?: string;
  availability?: string;
  investment?: string;
  contactMethod?: string;
  email?: string;
  phone?: string;
}

interface ProgressBarProps {
  current: number;
  total: number;
}

export const ProgressBar = ({ current, total }: ProgressBarProps) => {
  const percentage = Math.round((current / total) * 100);

  return (
    <div className="w-full px-4 py-3">
      <div className="w-full h-2.5 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full progress-bar-fill rounded-full transition-all duration-700 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-sm text-muted-foreground mt-2 text-right font-medium">
        {percentage}% completo
      </p>
    </div>
  );
};

interface OptionCardProps {
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
  selected?: boolean;
  onClick: () => void;
  imageSrc?: string;
}

export const OptionCard = ({ label, sublabel, icon, selected, onClick, imageSrc }: OptionCardProps) => (
  <button
    onClick={onClick}
    className={`funnel-card w-full text-left flex items-center gap-3 cursor-pointer min-h-[64px] p-3 sm:p-5 sm:gap-4 ${
      selected ? "border-primary bg-primary/10" : ""
    }`}
  >
    {imageSrc && (
      <img src={imageSrc} alt={label} className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl object-cover shrink-0" />
    )}
    {icon && !imageSrc && (
      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-primary">
        {icon}
      </div>
    )}
    <div className="flex-1 min-w-0">
      <p className="font-bold text-foreground text-sm sm:text-base leading-snug">{label}</p>
      {sublabel && <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 leading-snug">{sublabel}</p>}
    </div>
    <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${
      selected ? "border-foreground bg-foreground" : "border-muted-foreground/40"
    }`}>
      {selected && (
        <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-background" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      )}
    </div>
  </button>
);

interface CTAButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "primary" | "accent";
  disabled?: boolean;
  className?: string;
}

export const CTAButton = ({ children, onClick, variant = "primary", disabled, className = "" }: CTAButtonProps) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`w-full py-4 sm:py-5 px-5 sm:px-6 rounded-2xl font-extrabold text-base sm:text-lg tracking-wide transition-all duration-300 ${
      variant === "primary"
        ? "bg-primary text-primary-foreground funnel-glow-button hover:brightness-110 active:scale-[0.98]"
        : "bg-accent text-accent-foreground hover:brightness-110 active:scale-[0.98]"
    } ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"} ${className}`}
  >
    {children}
  </button>
);

export const StepContainer = ({ children }: { children: React.ReactNode }) => (
  <div className="animate-slide-up flex flex-col items-center w-full max-w-lg mx-auto px-4 sm:px-5 py-5 sm:py-6 gap-4 sm:gap-5">
    {children}
  </div>
);

export const StepTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground text-center leading-snug">
    {children}
  </h2>
);

export const StepSubtitle = ({ children }: { children: React.ReactNode }) => (
  <p className="text-base text-muted-foreground text-center leading-relaxed">
    {children}
  </p>
);

export const TrustBadge = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-2 justify-center">
    <Lock className="w-4 h-4 text-primary shrink-0" />
    <p className="text-sm text-muted-foreground">{children}</p>
  </div>
);

export const VideoPlaceholder = ({ label }: { label: string }) => (
  <div className="w-full aspect-video bg-secondary rounded-2xl flex items-center justify-center border border-border overflow-hidden relative">
    <div className="text-center space-y-3">
      <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto border-2 border-primary/30">
        <svg className="w-10 h-10 text-primary" fill="currentColor" viewBox="0 0 20 20">
          <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
        </svg>
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  </div>
);
