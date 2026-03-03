import { StepContainer, CTAButton } from "./QuizUI";
import { Lock, Smartphone, Bot, Banknote, AlertTriangle } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import avatarMaria from "@/assets/avatar-maria.jpg";
import avatarJose from "@/assets/avatar-jose.jpg";
import avatarAmanda from "@/assets/avatar-amanda.jpg";

interface Props {
  onNext: () => void;
}

const PersonCard = ({ avatar, name, age, today, week }: { avatar: string; name: string; age: number; today: string; week: string }) => (
  <div className="flex-1 funnel-card border-border/50 bg-card/50 py-3 px-2.5 space-y-2 text-center min-w-0">
    <img src={avatar} alt={name} className="w-10 h-10 rounded-full object-cover mx-auto" />
    <p className="text-[11px] font-semibold text-foreground truncate">{name}, {age} anos</p>
    <div className="space-y-0.5">
      <p className="text-[11px] text-muted-foreground">Hoje: <strong className="text-primary">{today}</strong></p>
      <p className="text-[11px] text-muted-foreground">Semana: <strong className="text-foreground">{week}</strong></p>
    </div>
    <span className="text-amber-400 text-[10px]">⭐⭐⭐⭐⭐</span>
  </div>
);

const Step1VariantD = ({ onNext }: Props) => {
  const { lang } = useLanguage();

  return (
    <StepContainer>
      {/* Headline impacto direto */}
      <div className="text-center space-y-3 pt-2">
        <h1 className="font-display text-[1.3rem] sm:text-3xl font-extrabold text-foreground leading-tight">
          <span className="text-amber-400">R$985 pagos hoje.</span>{" "}
          R$23.400 essa semana.{" "}
          <span className="text-amber-400">Pra pessoas comuns.</span>
        </h1>
        <p className="text-[13px] sm:text-base text-muted-foreground leading-relaxed">
          Esses números são reais. São de brasileiros que usam uma{" "}
          <strong className="text-foreground">inteligência artificial por 10 minutos no celular</strong>.
          E você pode ser o próximo.
        </p>
      </div>

      {/* 3 cards de pessoas */}
      <div className="grid grid-cols-3 gap-2 w-full">
        <PersonCard avatar={avatarMaria} name="Maria" age={48} today="R$143" week="R$847" />
        <PersonCard avatar={avatarJose} name="José" age={56} today="R$87" week="R$534" />
        <PersonCard avatar={avatarAmanda} name="Ana" age={33} today="R$212" week="R$1.203" />
      </div>

      {/* Divisor */}
      <div className="flex items-center gap-2 w-full">
        <div className="flex-1 h-px bg-primary/30" />
        <span className="text-xs font-semibold text-primary whitespace-nowrap">Como eles fazem isso? É simples:</span>
        <div className="flex-1 h-px bg-primary/30" />
      </div>

      {/* 3 passos */}
      <div className="grid grid-cols-3 gap-2 w-full">
        <div className="flex flex-col items-center gap-1.5 funnel-card border-border/50 bg-card/50 py-3 px-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Smartphone className="w-4 h-4 text-primary" />
          </div>
          <span className="text-[11px] sm:text-xs font-semibold text-foreground text-center">Abre no celular</span>
        </div>
        <div className="flex flex-col items-center gap-1.5 funnel-card border-border/50 bg-card/50 py-3 px-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Bot className="w-4 h-4 text-primary" />
          </div>
          <span className="text-[11px] sm:text-xs font-semibold text-foreground text-center">Usa a IA 10 min</span>
        </div>
        <div className="flex flex-col items-center gap-1.5 funnel-card border-border/50 bg-card/50 py-3 px-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Banknote className="w-4 h-4 text-primary" />
          </div>
          <span className="text-[11px] sm:text-xs font-semibold text-foreground text-center">Recebe na conta</span>
        </div>
      </div>

      {/* Urgência */}
      <div className="w-full funnel-card border-l-4 border-l-destructive border-border/30 bg-destructive/5 py-3 px-4">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
          <p className="text-[12px] sm:text-sm text-muted-foreground leading-relaxed">
            <strong className="text-destructive">⚠️ A plataforma aceita novos usuários em lotes.</strong>{" "}
            O lote atual fecha em breve. Faça o teste agora pra garantir sua vaga.
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="w-full space-y-2.5">
        <CTAButton
          onClick={onNext}
          className="animate-bounce-subtle text-[15px] sm:text-xl !bg-amber-500 !text-black hover:!bg-amber-400"
        >
          VERIFICAR MINHA VAGA →
        </CTAButton>
        <div className="flex items-center gap-2 justify-center">
          <Lock className="w-3 h-3 text-primary shrink-0" />
          <p className="text-[11px] text-muted-foreground text-center">
            Sem investimento • Sem experiência • Vagas limitadas
          </p>
        </div>
      </div>
    </StepContainer>
  );
};

export default Step1VariantD;
