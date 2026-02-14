import { useState } from "react";
import { StepContainer, StepTitle, StepSubtitle, CTAButton, TrustBadge } from "./QuizUI";

interface StepNameProps {
  onNext: (name: string) => void;
}

const StepName = ({ onNext }: StepNameProps) => {
  const [name, setName] = useState("");

  const isValid = name.trim().length > 1;

  return (
    <StepContainer>
      <StepTitle>
        Antes de continuar, como podemos te chamar?
      </StepTitle>
      <StepSubtitle>
        Queremos personalizar sua experiência para que tudo faça sentido pra você.
      </StepSubtitle>

      <div className="w-full mt-2">
        <label className="text-sm text-muted-foreground font-medium mb-1.5 block">Seu primeiro nome</label>
        <input
          type="text"
          placeholder="Ex: Carlos"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={50}
          className="w-full px-5 py-4 rounded-2xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground/60 text-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          onKeyDown={(e) => {
            if (e.key === "Enter" && isValid) onNext(name.trim());
          }}
        />
      </div>

      <TrustBadge>Seus dados estão protegidos e jamais serão compartilhados.</TrustBadge>

      <CTAButton onClick={() => onNext(name.trim())} disabled={!isValid}>
        CONTINUAR
      </CTAButton>
    </StepContainer>
  );
};

export default StepName;
