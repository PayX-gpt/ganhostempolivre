import { useState } from "react";
import { StepContainer, StepTitle, StepSubtitle, CTAButton, TrustBadge } from "./QuizUI";
import { PartyPopper, Zap } from "lucide-react";

interface Step12Props {
  onNext: (name: string, email: string, phone: string) => void;
}

const Step12Capture = ({ onNext }: Step12Props) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const isValid = name.trim().length > 1 && email.includes("@") && phone.trim().length > 8;

  return (
    <StepContainer>
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center mx-auto">
          <PartyPopper className="w-7 h-7 text-primary" />
        </div>
        <StepTitle>Parabéns! Você foi aprovado(a)!</StepTitle>
      </div>

      <StepSubtitle>
        Seu perfil é 100% compatível com o método. Preencha seus dados abaixo para liberar seu acesso exclusivo ao plano personalizado:
      </StepSubtitle>

      <div className="w-full space-y-4 mt-2">
        <div>
          <label className="text-sm text-muted-foreground font-medium mb-1.5 block">Seu nome</label>
          <input
            type="text"
            placeholder="Digite seu nome completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-5 py-4 rounded-2xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground/60 text-base focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>
        <div>
          <label className="text-sm text-muted-foreground font-medium mb-1.5 block">Seu melhor e-mail</label>
          <input
            type="email"
            placeholder="seuemail@exemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-5 py-4 rounded-2xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground/60 text-base focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>
        <div>
          <label className="text-sm text-muted-foreground font-medium mb-1.5 block">Seu WhatsApp (com DDD)</label>
          <input
            type="tel"
            placeholder="(11) 99999-9999"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-5 py-4 rounded-2xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground/60 text-base focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>
      </div>

      <TrustBadge>Seus dados estão protegidos e jamais serão compartilhados com terceiros.</TrustBadge>

      <CTAButton onClick={() => onNext(name, email, phone)} disabled={!isValid}>
        LIBERAR MEU ACESSO EXCLUSIVO →
      </CTAButton>

      <div className="flex items-center gap-1.5 justify-center">
        <Zap className="w-4 h-4 text-accent" />
        <p className="text-sm text-muted-foreground text-center">
          Vagas limitadas — não perca sua oportunidade
        </p>
      </div>
    </StepContainer>
  );
};

export default Step12Capture;
