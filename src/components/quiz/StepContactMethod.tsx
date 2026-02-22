import { StepContainer, StepTitle, StepSubtitle, OptionCard, TrustBadge } from "./QuizUI";
import { PartyPopper, Mail, Smartphone, Users, MessageSquare } from "lucide-react";

interface StepContactMethodProps {
  userName?: string;
  onNext: (method: string) => void;
}

const StepContactMethod = ({ userName, onNext }: StepContactMethodProps) => {
  const firstName = userName?.split(" ")[0] || "";

  return (
    <StepContainer>
      <div className="w-full funnel-card border-primary/25 bg-primary/5 text-center space-y-3">
        <div className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center mx-auto">
          <PartyPopper className="w-7 h-7 text-primary" />
        </div>
        <p className="font-display text-lg font-bold text-foreground">
          Parabéns{firstName ? `, ${firstName}` : ""}! Você foi aprovado(a)!
        </p>
        <p className="text-sm text-primary font-semibold">
          Seu perfil é 100% compatível com o método.
        </p>
      </div>

      <StepTitle>
        Última etapa: por onde você quer receber seu acesso exclusivo?
      </StepTitle>
      <StepSubtitle>
        Seu plano personalizado está pronto. Escolha onde quer receber:
      </StepSubtitle>

      {/* Escassez */}
      <div className="w-full funnel-card border-accent/20 bg-accent/5 py-2 text-center">
        <div className="flex items-center justify-center gap-2">
          <Users className="w-4 h-4 text-accent" />
          <p className="text-xs font-bold text-accent">
            Restam 7 vagas na sua região
          </p>
        </div>
      </div>

      <div className="w-full space-y-3">
        <OptionCard
          icon={<Mail className="w-5 h-5" />}
          label="Quero receber por E-mail"
          sublabel="Link de acesso + instruções direto na sua caixa de entrada"
          onClick={() => onNext("email")}
        />
        <OptionCard
          icon={<Smartphone className="w-5 h-5" />}
          label="Quero receber por WhatsApp"
          sublabel="Link de acesso + suporte humano direto no seu celular"
          onClick={() => onNext("whatsapp")}
        />
      </div>

      {/* Micro-depoimento */}
      <div className="w-full funnel-card border-border/30 bg-card/30 py-2">
        <div className="flex items-start gap-2">
          <MessageSquare className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-foreground/70 italic">
            "Recebi pelo WhatsApp e em 10 minutos já tava operando." — Carlos, 41
          </p>
        </div>
      </div>

      <TrustBadge>Seus dados estão protegidos e jamais serão compartilhados.</TrustBadge>
    </StepContainer>
  );
};

export default StepContactMethod;
