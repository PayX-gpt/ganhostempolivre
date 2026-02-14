import { useState } from "react";
import { StepContainer, StepTitle, StepSubtitle, CTAButton } from "./QuizUI";

interface Step12Props {
  onNext: (name: string, email: string, phone: string) => void;
}

const Step12Capture = ({ onNext }: Step12Props) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const isValid = name.trim().length > 0 && email.includes("@") && phone.trim().length > 7;

  return (
    <StepContainer>
      <div className="text-center space-y-1">
        <p className="text-4xl">🎉</p>
        <StepTitle>Parabéns! Você foi aprovado!</StepTitle>
      </div>

      <StepSubtitle>
        Seu perfil é compatível com o método. Preencha seus dados para liberar seu acesso exclusivo:
      </StepSubtitle>

      <div className="w-full space-y-3 mt-2">
        <input
          type="text"
          placeholder="Seu nome completo"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-3.5 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        />
        <input
          type="email"
          placeholder="Seu melhor e-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3.5 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        />
        <input
          type="tel"
          placeholder="Seu WhatsApp (com DDD)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full px-4 py-3.5 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        />
      </div>

      <div className="flex items-center gap-2 w-full">
        <span className="text-xs text-primary">🔒</span>
        <p className="text-xs text-muted-foreground">
          Seus dados estão seguros e não serão compartilhados.
        </p>
      </div>

      <CTAButton onClick={() => onNext(name, email, phone)} disabled={!isValid}>
        LIBERAR MEU ACESSO →
      </CTAButton>
    </StepContainer>
  );
};

export default Step12Capture;
