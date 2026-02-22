import { useState, useEffect } from "react";
import { StepContainer, StepTitle, StepSubtitle, CTAButton, TrustBadge } from "./QuizUI";
import { saveFunnelEvent } from "@/lib/metricsClient";
import { Clock, Users, MessageSquare } from "lucide-react";

interface StepContactInputProps {
  method: string;
  userName?: string;
  onNext: (value: string) => void;
}

const StepContactInput = ({ method, userName, onNext }: StepContactInputProps) => {
  const [value, setValue] = useState("");
  const firstName = userName?.split(" ")[0] || "";
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes
  const [recentCount] = useState(() => Math.floor(Math.random() * 8) + 8); // 8-15

  const isEmail = method === "email";

  const isValid = isEmail
    ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    : value.replace(/\D/g, "").length >= 10;

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const formatPhone = (input: string) => {
    const digits = input.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  return (
    <StepContainer>
      <StepTitle>
        {firstName
          ? `${firstName}, seu plano de ganhos está pronto.`
          : "Seu plano de ganhos está pronto."}
      </StepTitle>
      <StepSubtitle>
        {isEmail
          ? `Só falta o e-mail pra liberar seu acesso.`
          : `Só falta o WhatsApp pra liberar seu acesso.`}
      </StepSubtitle>

      {/* Timer de urgência */}
      <div className="w-full funnel-card border-accent/30 bg-accent/5 text-center py-2.5">
        <div className="flex items-center justify-center gap-2">
          <Clock className="w-4 h-4 text-accent animate-pulse" />
          <p className="text-sm font-bold text-accent">
            Seu acesso personalizado expira em {formatTime(timeLeft)}
          </p>
        </div>
      </div>

      <div className="w-full mt-1">
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

      <CTAButton onClick={() => {
        saveFunnelEvent("lead_captured", {
          method,
          has_value: !!value.trim(),
        });
        onNext(value.trim());
      }} disabled={!isValid}>
        LIBERAR MEU ACESSO AGORA →
      </CTAButton>

      <TrustBadge>
        {isEmail
          ? "Seu e-mail é protegido. Só a equipe de suporte tem acesso."
          : "Seu número é protegido. Só a equipe de suporte tem acesso."}
      </TrustBadge>

      {/* Prova social em tempo real */}
      <div className="w-full funnel-card border-primary/20 bg-primary/5 py-2.5">
        <div className="flex items-center justify-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          <p className="text-xs text-foreground/70">
            <strong className="text-foreground">{recentCount} pessoas</strong> da sua região ativaram nos últimos 30 minutos
          </p>
        </div>
      </div>

      {/* Micro-depoimento */}
      <div className="w-full funnel-card border-border/30 bg-card/30 py-2.5">
        <div className="flex items-start gap-2">
          <MessageSquare className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-foreground/70 italic leading-relaxed">
            "Dei meu número, recebi o link em 2 minutos e no mesmo dia já tava operando." — Maria, 34, MG
          </p>
        </div>
      </div>
    </StepContainer>
  );
};

export default StepContactInput;
