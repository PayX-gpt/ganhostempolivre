import { useState, useEffect } from "react";
import { StepContainer, StepTitle, StepSubtitle, CTAButton, TrustBadge } from "./QuizUI";
import GuaranteeBadge from "./GuaranteeBadge";
import { saveFunnelEvent } from "@/lib/metricsClient";
import { supabase } from "@/integrations/supabase/client";
import { Clock, Users, MessageSquare } from "lucide-react";
import { useLanguage, type Language } from "@/lib/i18n";
import { trackMetaLead, setMetaAdvancedMatching } from "@/lib/metaPixel";
import { sendCAPIEvent } from "@/lib/facebookCAPI";

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

// Países (DDI + bandeira). Brasil como padrão; ordem: BR/LatAm/Lusófonos/Europa/etc.
interface Country { code: string; name: string; dial: string; flag: string; min: number; max: number; }
const COUNTRIES: Country[] = [
  { code: "BR", name: "Brasil", dial: "55", flag: "🇧🇷", min: 10, max: 11 },
  { code: "PT", name: "Portugal", dial: "351", flag: "🇵🇹", min: 9, max: 9 },
  { code: "US", name: "EUA", dial: "1", flag: "🇺🇸", min: 10, max: 10 },
  { code: "AR", name: "Argentina", dial: "54", flag: "🇦🇷", min: 10, max: 11 },
  { code: "PY", name: "Paraguai", dial: "595", flag: "🇵🇾", min: 9, max: 10 },
  { code: "UY", name: "Uruguai", dial: "598", flag: "🇺🇾", min: 8, max: 9 },
  { code: "CL", name: "Chile", dial: "56", flag: "🇨🇱", min: 9, max: 9 },
  { code: "CO", name: "Colômbia", dial: "57", flag: "🇨🇴", min: 10, max: 10 },
  { code: "PE", name: "Peru", dial: "51", flag: "🇵🇪", min: 9, max: 9 },
  { code: "MX", name: "México", dial: "52", flag: "🇲🇽", min: 10, max: 10 },
  { code: "BO", name: "Bolívia", dial: "591", flag: "🇧🇴", min: 8, max: 8 },
  { code: "EC", name: "Equador", dial: "593", flag: "🇪🇨", min: 9, max: 9 },
  { code: "VE", name: "Venezuela", dial: "58", flag: "🇻🇪", min: 10, max: 10 },
  { code: "ES", name: "Espanha", dial: "34", flag: "🇪🇸", min: 9, max: 9 },
  { code: "IT", name: "Itália", dial: "39", flag: "🇮🇹", min: 9, max: 11 },
  { code: "FR", name: "França", dial: "33", flag: "🇫🇷", min: 9, max: 9 },
  { code: "DE", name: "Alemanha", dial: "49", flag: "🇩🇪", min: 10, max: 11 },
  { code: "GB", name: "Reino Unido", dial: "44", flag: "🇬🇧", min: 10, max: 10 },
  { code: "CH", name: "Suíça", dial: "41", flag: "🇨🇭", min: 9, max: 9 },
  { code: "IE", name: "Irlanda", dial: "353", flag: "🇮🇪", min: 9, max: 9 },
  { code: "NL", name: "Holanda", dial: "31", flag: "🇳🇱", min: 9, max: 9 },
  { code: "BE", name: "Bélgica", dial: "32", flag: "🇧🇪", min: 9, max: 9 },
  { code: "AO", name: "Angola", dial: "244", flag: "🇦🇴", min: 9, max: 9 },
  { code: "MZ", name: "Moçambique", dial: "258", flag: "🇲🇿", min: 9, max: 9 },
  { code: "CV", name: "Cabo Verde", dial: "238", flag: "🇨🇻", min: 7, max: 7 },
  { code: "CA", name: "Canadá", dial: "1", flag: "🇨🇦", min: 10, max: 10 },
  { code: "JP", name: "Japão", dial: "81", flag: "🇯🇵", min: 10, max: 10 },
  { code: "AU", name: "Austrália", dial: "61", flag: "🇦🇺", min: 9, max: 9 },
];

const formatBR = (digits: string) => {
  const d = digits.slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

const StepContactInput = ({ method, userName, onNext }: StepContactInputProps) => {
  const { lang } = useLanguage();
  const t = texts[lang];
  const [value, setValue] = useState("");          // email
  const [country, setCountry] = useState<Country>(COUNTRIES[0]); // padrão Brasil
  const [digits, setDigits] = useState("");        // dígitos do telefone (DDD+número, sem DDI)
  const firstName = userName?.split(" ")[0] || "";
  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const [recentCount] = useState(() => Math.floor(Math.random() * 8) + 8);
  const isEmail = method === "email";

  const phoneValid = digits.length >= country.min && digits.length <= country.max;
  const isValid = isEmail
    ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    : phoneValid;
  // Número final em formato internacional (E.164): +DDI + dígitos.
  const fullPhone = `+${country.dial}${digits}`;

  useEffect(() => {
    const interval = setInterval(() => { setTimeLeft((prev) => Math.max(0, prev - 1)); }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const phoneDisplay = country.code === "BR" ? formatBR(digits) : digits;

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

      <GuaranteeBadge />

      <div className="w-full mt-1">
        <label className="text-[13px] text-muted-foreground font-medium mb-1.5 block">
          {isEmail ? t.labelEmail : t.labelWhatsapp}
        </label>
        {isEmail ? (
          <input
            type="email"
            inputMode="email"
            placeholder={t.placeholderEmail}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            maxLength={255}
            className="w-full px-4 py-3.5 rounded-2xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground/60 text-base focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            onKeyDown={(e) => { if (e.key === "Enter" && isValid) onNext(value.trim()); }}
          />
        ) : (
          <>
            <div className="flex items-stretch gap-2">
              {/* Seletor de país (bandeira + DDI) — padrão Brasil, alterável */}
              <div className="relative shrink-0">
                <select
                  value={country.code}
                  onChange={(e) => { const c = COUNTRIES.find(x => x.code === e.target.value); if (c) { setCountry(c); setDigits(""); } }}
                  aria-label="País"
                  className="h-full appearance-none pl-3 pr-7 py-3.5 rounded-2xl bg-secondary border border-border text-foreground text-base focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.flag} +{c.dial}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">▾</span>
              </div>
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder={country.code === "BR" ? "(11) 99999-9999" : "número"}
                value={phoneDisplay}
                onChange={(e) => setDigits(e.target.value.replace(/\D/g, "").slice(0, country.max))}
                className="flex-1 min-w-0 px-4 py-3.5 rounded-2xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground/60 text-base focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                onKeyDown={(e) => { if (e.key === "Enter" && isValid) onNext(fullPhone); }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground/70 mt-1">
              {country.code === "BR"
                ? "Coloque DDD + número (com o 9). Ex.: (11) 99999-9999"
                : `${country.flag} +${country.dial} — digite o número com DDD/área`}
              {digits.length > 0 && !phoneValid && <span className="text-accent"> · número incompleto</span>}
            </p>
          </>
        )}
      </div>

      <CTAButton onClick={() => {
        const contactValue = isEmail ? value.trim() : fullPhone;
        const earlyUtm = (() => { try { return JSON.parse(localStorage.getItem('lead_utm') || '{}'); } catch { return {}; } })();
        saveFunnelEvent("lead_captured", {
          method, has_value: !!contactValue,
          country: isEmail ? undefined : country.code,
          ddi: isEmail ? undefined : country.dial,
          utm_campaign: earlyUtm.utm_campaign || null,
          utm_source: earlyUtm.utm_source || null,
          fbclid: earlyUtm.fbclid || null,
        });
        // Save phone→session for webhook attribution (E.164 completo: DDI+DDD+número)
        // IMPORTANT: Always use trackingData.session_id (sess_* format) — NOT funnel_session_id (session_* format)
        if (method === 'whatsapp' && contactValue) {
          const sessionId = window.trackingData?.session_id;
          if (sessionId) {
            const cleanPhone = fullPhone.replace(/\D/g, '');
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
        setMetaAdvancedMatching({
          email: isEmail ? contactValue : undefined,
          phone: !isEmail ? contactValue : undefined,
        });
        trackMetaLead();
        sendCAPIEvent("Lead", {
          email: isEmail ? contactValue : undefined,
          phone: !isEmail ? contactValue : undefined,
        });
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
