import { useState, useEffect } from "react";
import { StepContainer, StepTitle, StepSubtitle, CTAButton, TrustBadge } from "./QuizUI";
import { saveFunnelEvent } from "@/lib/metricsClient";
import { supabase } from "@/integrations/supabase/client";
import { Clock, Users, MessageSquare } from "lucide-react";
import { useLanguage, type Language } from "@/lib/i18n";

interface StepContactInputProps {
  method: string;
  userName?: string;
  onNext: (value: string) => void;
}

const texts = {
  pt: {
    titleWithName: (name: string) => `${name}, seu plano de ganhos está pronto.`,
    titleNoName: "Seu plano de ganhos está pronto.",
    subtitleEmail: "Só falta o e-mail pra liberar seu acesso.",
    subtitleWhatsapp: "Só falta o WhatsApp pra liberar seu acesso.",
    timerLabel: (time: string) => `Seu acesso personalizado expira em ${time}`,
    labelEmail: "Seu melhor e-mail",
    labelWhatsapp: "Seu WhatsApp (com DDD)",
    placeholderEmail: "seuemail@exemplo.com",
    placeholderWhatsapp: "(11) 99999-9999",
    cta: "LIBERAR MEU ACESSO AGORA →",
    trustEmail: "Seu e-mail é protegido. Só a equipe de suporte tem acesso.",
    trustWhatsapp: "Seu número é protegido. Só a equipe de suporte tem acesso.",
    social: (n: number) => <><strong className="text-foreground">{n} pessoas</strong> da sua região ativaram nos últimos 30 minutos</>,
    testimonial: "\"Dei meu número, recebi o link em 2 minutos e no mesmo dia já tava operando.\" — Maria, 34, MG",
  },
  en: {
    titleWithName: (name: string) => `${name}, your earnings plan is ready.`,
    titleNoName: "Your earnings plan is ready.",
    subtitleEmail: "Just your email left to unlock your access.",
    subtitleWhatsapp: "Just your WhatsApp left to unlock your access.",
    timerLabel: (time: string) => `Your personalized access expires in ${time}`,
    labelEmail: "Your best email",
    labelWhatsapp: "Your WhatsApp (with area code)",
    placeholderEmail: "youremail@example.com",
    placeholderWhatsapp: "(11) 99999-9999",
    cta: "UNLOCK MY ACCESS NOW →",
    trustEmail: "Your email is protected. Only the support team has access.",
    trustWhatsapp: "Your number is protected. Only the support team has access.",
    social: (n: number) => <><strong className="text-foreground">{n} people</strong> in your region activated in the last 30 minutes</>,
    testimonial: "\"I gave my number, received the link in 2 minutes and was operating the same day.\" — Maria, 34",
  },
  es: {
    titleWithName: (name: string) => `${name}, tu plan de ganancias está listo.`,
    titleNoName: "Tu plan de ganancias está listo.",
    subtitleEmail: "Solo falta tu e-mail para liberar tu acceso.",
    subtitleWhatsapp: "Solo falta tu WhatsApp para liberar tu acceso.",
    timerLabel: (time: string) => `Tu acceso personalizado expira en ${time}`,
    labelEmail: "Tu mejor e-mail",
    labelWhatsapp: "Tu WhatsApp (con código de área)",
    placeholderEmail: "tuemail@ejemplo.com",
    placeholderWhatsapp: "(11) 99999-9999",
    cta: "LIBERAR MI ACCESO AHORA →",
    trustEmail: "Tu e-mail está protegido. Solo el equipo de soporte tiene acceso.",
    trustWhatsapp: "Tu número está protegido. Solo el equipo de soporte tiene acceso.",
    social: (n: number) => <><strong className="text-foreground">{n} personas</strong> de tu región activaron en los últimos 30 minutos</>,
    testimonial: "\"Di mi número, recibí el link en 2 minutos y ese mismo día ya estaba operando.\" — María, 34",
  },
};

const StepContactInput = ({ method, userName, onNext }: StepContactInputProps) => {
  const { lang } = useLanguage();
  const t = texts[lang];
  const [value, setValue] = useState("");
  const firstName = userName?.split(" ")[0] || "";
  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const [recentCount] = useState(() => Math.floor(Math.random() * 8) + 8);
  const isEmail = method === "email";

  const isValid = isEmail
    ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    : value.replace(/\D/g, "").length >= 10;

  useEffect(() => {
    const interval = setInterval(() => { setTimeLeft((prev) => Math.max(0, prev - 1)); }, 1000);
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
      <StepTitle>{firstName ? t.titleWithName(firstName) : t.titleNoName}</StepTitle>
      <StepSubtitle>{isEmail ? t.subtitleEmail : t.subtitleWhatsapp}</StepSubtitle>

      <div className="w-full funnel-card border-accent/30 bg-accent/5 text-center py-2.5">
        <div className="flex items-center justify-center gap-2">
          <Clock className="w-4 h-4 text-accent animate-pulse" />
          <p className="text-sm font-bold text-accent">{t.timerLabel(formatTime(timeLeft))}</p>
        </div>
      </div>

      <div className="w-full mt-1">
        <label className="text-[13px] text-muted-foreground font-medium mb-1.5 block">
          {isEmail ? t.labelEmail : t.labelWhatsapp}
        </label>
        <input
          type={isEmail ? "email" : "tel"}
          placeholder={isEmail ? t.placeholderEmail : t.placeholderWhatsapp}
          value={value}
          onChange={(e) => setValue(isEmail ? e.target.value : formatPhone(e.target.value))}
          maxLength={isEmail ? 255 : 15}
          className="w-full px-4 py-3.5 rounded-2xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground/60 text-base focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          onKeyDown={(e) => { if (e.key === "Enter" && isValid) onNext(value.trim()); }}
        />
      </div>

      <CTAButton onClick={() => {
        const contactValue = value.trim();
        const earlyUtm = (() => { try { return JSON.parse(localStorage.getItem('lead_utm') || '{}'); } catch { return {}; } })();
        saveFunnelEvent("lead_captured", { 
          method, has_value: !!contactValue,
          utm_campaign: earlyUtm.utm_campaign || null,
          utm_source: earlyUtm.utm_source || null,
          fbclid: earlyUtm.fbclid || null,
        });
        // Save phone→session for webhook attribution
        // IMPORTANT: Always use trackingData.session_id (sess_* format) — NOT funnel_session_id (session_* format)
        if (method === 'whatsapp' && contactValue) {
          const sessionId = window.trackingData?.session_id;
          if (sessionId) {
            const cleanPhone = contactValue.replace(/\D/g, '');
            supabase.from("phone_session_map" as any).insert({ phone: cleanPhone, session_id: sessionId }).then(() => {});
            console.log(`📱 [Attribution] Phone mapped: ${cleanPhone.slice(-4)} → ${sessionId}`);
          }
        }
        // Save email→session for webhook attribution
        if (method === 'email' && contactValue) {
          const sessionId = window.trackingData?.session_id;
          if (sessionId) {
            supabase.from("email_session_map" as any).insert({ email: contactValue.toLowerCase().trim(), session_id: sessionId }).then(() => {});
            console.log(`📧 [Attribution] Email mapped: ${contactValue} → ${sessionId}`);
          }
        }
        onNext(contactValue);
      }} disabled={!isValid}>
        {t.cta}
      </CTAButton>

      <TrustBadge>{isEmail ? t.trustEmail : t.trustWhatsapp}</TrustBadge>

      <div className="w-full funnel-card border-primary/20 bg-primary/5 py-2.5">
        <div className="flex items-center justify-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          <p className="text-xs text-foreground/70">{t.social(recentCount)}</p>
        </div>
      </div>

      <div className="w-full funnel-card border-border/30 bg-card/30 py-2.5">
        <div className="flex items-start gap-2">
          <MessageSquare className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-foreground/70 italic leading-relaxed">{t.testimonial}</p>
        </div>
      </div>
    </StepContainer>
  );
};

export default StepContactInput;
