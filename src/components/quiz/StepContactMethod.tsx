import { StepContainer, StepTitle, StepSubtitle, OptionCard } from "./QuizUI";

interface StepContactMethodProps {
  userName?: string;
  onNext: (method: string) => void;
}

const StepContactMethod = ({ userName, onNext }: StepContactMethodProps) => {
  const firstName = userName?.split(" ")[0] || "";

  return (
    <StepContainer>
      <StepTitle>
        {firstName ? `${firstName}, por` : "Por"} onde você prefere receber seu acesso à plataforma?
      </StepTitle>
      <StepSubtitle>
        Escolha o canal mais fácil pra você. Vamos enviar seu link de acesso e o suporte por lá:
      </StepSubtitle>

      <div className="w-full space-y-3 mt-2">
        <OptionCard
          icon="📧"
          label="Por E-mail"
          sublabel="Receber o acesso e instruções no meu e-mail"
          onClick={() => onNext("email")}
        />
        <OptionCard
          icon="📱"
          label="Por WhatsApp"
          sublabel="Receber o acesso e suporte direto no meu WhatsApp"
          onClick={() => onNext("whatsapp")}
        />
      </div>
    </StepContainer>
  );
};

export default StepContactMethod;
