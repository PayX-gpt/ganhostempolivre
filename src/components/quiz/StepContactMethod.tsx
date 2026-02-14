import { StepContainer, StepTitle, StepSubtitle, OptionCard, TrustBadge } from "./QuizUI";
import { PartyPopper, Mail, Smartphone } from "lucide-react";

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
        Seu plano personalizado está pronto. Escolha onde quer receber o link de acesso e o suporte da nossa equipe:
      </StepSubtitle>

      <div className="w-full space-y-3 mt-2">
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

      <TrustBadge>Seus dados estão protegidos e jamais serão compartilhados.</TrustBadge>
    </StepContainer>
  );
};

export default StepContactMethod;
