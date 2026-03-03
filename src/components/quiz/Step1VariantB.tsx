import { useState, useEffect } from "react";
import { StepContainer, CTAButton } from "./QuizUI";
import { Lock, Zap, Shield } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

interface Props {
  onNext: () => void;
}

const Step1VariantB = ({ onNext }: Props) => {
  const { lang } = useLanguage();
  const [recentCount, setRecentCount] = useState(312);

  useEffect(() => {
    const interval = setInterval(() => {
      setRecentCount((c) => c + Math.floor(Math.random() * 5) - 1);
    }, 5000 + Math.random() * 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <StepContainer>
      {/* Badge urgência */}
      <div className="w-full funnel-card border-primary/30 bg-primary/5 py-2 px-3">
        <div className="flex items-center justify-center gap-2">
          <Zap className="w-3.5 h-3.5 text-primary animate-pulse" />
          <p className="text-xs sm:text-sm font-bold text-primary">
            ⚡ {recentCount} pessoas acessaram nos últimos 30 minutos
          </p>
        </div>
      </div>

      {/* Headline curiosidade */}
      <div className="text-center space-y-3">
        <h1 className="font-display text-[1.3rem] sm:text-3xl font-extrabold text-foreground leading-tight">
          Existe uma forma de ganhar dinheiro com o celular que{" "}
          <span className="text-gradient-green">ninguém te contou.</span>
        </h1>
        <p className="text-[13px] sm:text-base text-muted-foreground leading-relaxed">
          Não é vender. Não é gravar vídeo. Não é investir. É algo que leva{" "}
          <strong className="text-foreground">10 minutos por dia</strong> e paga entre{" "}
          <strong className="text-foreground">R$50 e R$300</strong>.
        </p>
      </div>

      {/* Notificação simulada */}
      <div className="w-full rounded-2xl overflow-hidden border border-primary/20 bg-card/80 shadow-lg">
        <div className="bg-primary/10 px-4 py-2 flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-sm">🔔</span>
          </div>
          <span className="text-xs font-semibold text-primary">Transferência recebida</span>
        </div>
        <div className="px-4 py-3 space-y-1">
          <p className="text-xs text-muted-foreground">Plataforma de Tempo Livre LTDA</p>
          <p className="text-2xl font-extrabold text-foreground">R$ 187,00</p>
          <p className="text-[11px] text-muted-foreground">Hoje, 09:47</p>
        </div>
      </div>

      {/* Bloco de prova */}
      <div className="w-full funnel-card border-l-4 border-l-primary border-border/30 bg-card/30 py-3 px-4">
        <p className="text-[13px] sm:text-sm text-muted-foreground leading-relaxed">
          Mais de <strong className="text-foreground">36.000 brasileiros</strong> já descobriram. A maioria tem entre{" "}
          <strong className="text-foreground">35 e 60 anos</strong>. Nunca mexeram com tecnologia.
          E estão recebendo dinheiro toda semana.
        </p>
      </div>

      {/* Urgência */}
      <div className="flex items-center gap-2 justify-center w-full">
        <Shield className="w-3.5 h-3.5 text-accent shrink-0" />
        <p className="text-[12px] sm:text-sm font-medium text-accent">
          🔒 Essa ferramenta não vai ficar aberta pra sempre. Faça o teste agora e descubra quanto você pode gerar por dia.
        </p>
      </div>

      {/* CTA */}
      <div className="w-full space-y-2.5">
        <CTAButton
          onClick={onNext}
          className="animate-bounce-subtle text-[15px] sm:text-xl !bg-accent !text-accent-foreground hover:!brightness-110"
        >
          DESCOBRIR QUANTO POSSO GANHAR →
        </CTAButton>
        <div className="flex items-center gap-2 justify-center">
          <Lock className="w-3 h-3 text-primary shrink-0" />
          <p className="text-[11px] text-muted-foreground text-center">
            Teste gratuito • Resultado em 2 minutos • Sem pegadinha
          </p>
        </div>
      </div>
    </StepContainer>
  );
};

export default Step1VariantB;
