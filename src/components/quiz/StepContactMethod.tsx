import { StepContainer, StepTitle, StepSubtitle, OptionCard, TrustBadge } from "./QuizUI";
import { PartyPopper, Mail, Smartphone, Users, MessageSquare } from "lucide-react";
import { useLanguage, type Language } from "@/lib/i18n";

interface StepContactMethodProps {
  userName?: string;
  onNext: (method: string) => void;
}

const texts = {
  pt: {
    congrats: (name: string) => `Parabéns${name ? `, ${name}` : ""}! Você foi aprovado(a)!`,
    compatible: "Seu perfil é 100% compatível com o método.",
    title: "Última etapa: por onde você quer receber seu acesso exclusivo?",
    subtitle: "Seu plano personalizado está pronto. Escolha onde quer receber:",
    scarcity: "Restam 7 vagas na sua região",
    email: "Quero receber por E-mail",
    emailSub: "Link de acesso + instruções direto na sua caixa de entrada",
    whatsapp: "Quero receber por WhatsApp",
    whatsappSub: "Link de acesso + suporte humano direto no seu celular",
    microTestimonial: "\"Recebi pelo WhatsApp e em 10 minutos já tava operando.\" — Carlos, 41",
    trust: "Seus dados estão protegidos e jamais serão compartilhados.",
  },
  en: {
    congrats: (name: string) => `Congratulations${name ? `, ${name}` : ""}! You've been approved!`,
    compatible: "Your profile is 100% compatible with the method.",
    title: "Last step: how do you want to receive your exclusive access?",
    subtitle: "Your personalized plan is ready. Choose where you'd like to receive it:",
    scarcity: "Only 7 spots left in your region",
    email: "I want to receive by Email",
    emailSub: "Access link + instructions straight to your inbox",
    whatsapp: "I want to receive by WhatsApp",
    whatsappSub: "Access link + human support directly on your phone",
    microTestimonial: "\"I received it on WhatsApp and within 10 minutes I was already operating.\" — Carlos, 41",
    trust: "Your data is protected and will never be shared.",
  },
  es: {
    congrats: (name: string) => `¡Felicitaciones${name ? `, ${name}` : ""}! ¡Fuiste aprobado/a!`,
    compatible: "Tu perfil es 100% compatible con el método.",
    title: "Última etapa: ¿por dónde querés recibir tu acceso exclusivo?",
    subtitle: "Tu plan personalizado está listo. Elegí dónde querés recibirlo:",
    scarcity: "Quedan 7 vacantes en tu región",
    email: "Quiero recibirlo por E-mail",
    emailSub: "Link de acceso + instrucciones directo en tu bandeja de entrada",
    whatsapp: "Quiero recibirlo por WhatsApp",
    whatsappSub: "Link de acceso + soporte humano directo en tu celular",
    microTestimonial: "\"Lo recibí por WhatsApp y en 10 minutos ya estaba operando.\" — Carlos, 41",
    trust: "Tus datos están protegidos y jamás serán compartidos.",
  },
} as const;

const StepContactMethod = ({ userName, onNext }: StepContactMethodProps) => {
  const { lang } = useLanguage();
  const t = texts[lang];
  const firstName = userName?.split(" ")[0] || "";

  return (
    <StepContainer>
      <div className="w-full funnel-card border-primary/25 bg-primary/5 text-center space-y-2.5 py-3 px-3">
        <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center mx-auto">
          <PartyPopper className="w-6 h-6 text-primary" />
        </div>
        <p className="font-display text-base sm:text-lg font-bold text-foreground">{t.congrats(firstName)}</p>
        <p className="text-[13px] text-primary font-semibold">{t.compatible}</p>
      </div>

      <StepTitle>{t.title}</StepTitle>
      <StepSubtitle>{t.subtitle}</StepSubtitle>

      <div className="w-full funnel-card border-accent/20 bg-accent/5 py-2 text-center">
        <div className="flex items-center justify-center gap-2">
          <Users className="w-4 h-4 text-accent" />
          <p className="text-xs font-bold text-accent">{t.scarcity}</p>
        </div>
      </div>

      <div className="w-full space-y-3">
        <OptionCard icon={<Mail className="w-5 h-5" />} label={t.email} sublabel={t.emailSub} onClick={() => onNext("email")} />
        <OptionCard icon={<Smartphone className="w-5 h-5" />} label={t.whatsapp} sublabel={t.whatsappSub} onClick={() => onNext("whatsapp")} />
      </div>

      <div className="w-full funnel-card border-border/30 bg-card/30 py-2">
        <div className="flex items-start gap-2">
          <MessageSquare className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-foreground/70 italic">{t.microTestimonial}</p>
        </div>
      </div>

      <TrustBadge>{t.trust}</TrustBadge>
    </StepContainer>
  );
};

export default StepContactMethod;
