import { useState } from "react";
import { StepContainer, StepTitle, StepSubtitle, CTAButton, TrustBadge } from "./QuizUI";
import { saveFunnelEvent } from "@/lib/metricsClient";

interface StepContactInputProps {
  method: string;
  userName?: string;
  onNext: (value: string) => void;
}

const StepContactInput = ({ method, userName, onNext }: StepContactInputProps) => {
  const [value, setValue] = useState("");
  const firstName = userName?.split(" ")[0] || "";

  const isEmail = method === "email";

  const isValid = isEmail
    ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    : value.replace(/\D/g, "").length >= 10;

  const formatPhone = (input: string) => {
    const digits = input.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  return (
    <StepContainer>
      <StepTitle>
        {isEmail
          ? `${firstName ? `${firstName}, qual` : "Qual"} é o seu melhor e-mail?`
          : `${firstName ? `${firstName}, qual` : "Qual"} é o seu WhatsApp?`}
      </StepTitle>
      <StepSubtitle>
        {isEmail
          ? "Vamos enviar seu link de acesso e as instruções diretamente no seu e-mail."
          : "Vamos enviar seu link de acesso e o suporte personalizado direto no seu WhatsApp."}
      </StepSubtitle>

      <div className="w-full mt-2">
        <label className="text-sm text-muted-foreground font-medium mb-1.5 block">
          {isEmail ? "Seu melhor e-mail" : "Seu WhatsApp (com DDD)"}
        </label>
        <input
          type={isEmail ? "email" : "tel"}
          placeholder={isEmail ? "seuemail@exemplo.com" : "(11) 99999-9999"}
          value={value}
          onChange={(e) => setValue(isEmail ? e.target.value : formatPhone(e.target.value))}
          maxLength={isEmail ? 255 : 15}
          className="w-full px-5 py-4 rounded-2xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground/60 text-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          onKeyDown={(e) => {
            if (e.key === "Enter" && isValid) onNext(value.trim());
          }}
        />
      </div>

      <TrustBadge>
        {isEmail
          ? "Seu e-mail está protegido. Nada de spam, prometemos."
          : "Seu número está protegido. Apenas a equipe de suporte terá acesso."}
      </TrustBadge>

      <CTAButton onClick={() => {
        saveFunnelEvent("lead_captured", {
          method,
          has_value: !!value.trim(),
        });
        onNext(value.trim());
      }} disabled={!isValid}>
        LIBERAR MEU ACESSO EXCLUSIVO
      </CTAButton>
    </StepContainer>
  );
};

export default StepContactInput;
