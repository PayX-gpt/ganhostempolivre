import { useState } from "react";

export interface QuizAnswers {
  age?: string;
  triedOnline?: string;
  incomeGoal?: string;
  obstacle?: string;
  device?: string;
  availability?: string;
  name?: string;
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
      <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full progress-bar-fill rounded-full transition-all duration-700 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground mt-1.5 text-right">
        {percentage}% completo
      </p>
    </div>
  );
};

interface OptionCardProps {
  label: string;
  sublabel?: string;
  icon?: string;
  selected?: boolean;
  onClick: () => void;
  imageSrc?: string;
}

export const OptionCard = ({ label, sublabel, icon, selected, onClick, imageSrc }: OptionCardProps) => (
  <button
    onClick={onClick}
    className={`funnel-card w-full text-left flex items-center gap-4 cursor-pointer ${
      selected ? "border-primary bg-primary/10" : ""
    }`}
  >
    {imageSrc && (
      <img src={imageSrc} alt={label} className="w-14 h-14 rounded-lg object-cover" />
    )}
    {icon && !imageSrc && (
      <span className="text-2xl">{icon}</span>
    )}
    <div className="flex-1">
      <p className="font-semibold text-foreground text-sm">{label}</p>
      {sublabel && <p className="text-xs text-muted-foreground mt-0.5">{sublabel}</p>}
    </div>
    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
      selected ? "border-primary bg-primary" : "border-muted-foreground/40"
    }`}>
      {selected && (
        <svg className="w-3 h-3 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
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
    className={`w-full py-4 px-6 rounded-xl font-bold text-base transition-all duration-300 ${
      variant === "primary"
        ? "bg-primary text-primary-foreground funnel-glow-button hover:brightness-110 active:scale-[0.98]"
        : "bg-accent text-accent-foreground hover:brightness-110 active:scale-[0.98]"
    } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} ${className}`}
  >
    {children}
  </button>
);

export const StepContainer = ({ children }: { children: React.ReactNode }) => (
  <div className="animate-slide-up flex flex-col items-center w-full max-w-md mx-auto px-4 py-6 gap-5">
    {children}
  </div>
);

export const StepTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="font-display text-xl font-bold text-foreground text-center leading-tight">
    {children}
  </h2>
);

export const StepSubtitle = ({ children }: { children: React.ReactNode }) => (
  <p className="text-sm text-muted-foreground text-center leading-relaxed">
    {children}
  </p>
);
