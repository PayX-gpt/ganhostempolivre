import { useState, useEffect } from "react";
import { StepContainer, CTAButton } from "./QuizUI";
import { Lock, Clock, Shield, BarChart3, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import avatarClaudia from "@/assets/avatar-claudia.jpg";

interface Props {
  onNext: () => void;
}

const Step1VariantC = ({ onNext }: Props) => {
  const { lang, locale } = useLanguage();
  const [counter, setCounter] = useState(36859);

  useEffect(() => {
    const interval = setInterval(() => {
      setCounter((c) => c + Math.floor(Math.random() * 3) + 1);
    }, 4000 + Math.random() * 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <StepContainer>
      {/* Badge verificado */}
      <div className="w-full funnel-card border-sky-500/30 bg-sky-500/5 py-2 px-3">
        <div className="flex items-center justify-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
          <p className="text-xs sm:text-sm font-bold text-sky-400">
            ✓ Teste verificado por {counter.toLocaleString(locale)} brasileiros
          </p>
        </div>
      </div>

      {/* Headline gamificação */}
      <div className="text-center space-y-3">
        <h1 className="font-display text-[1.3rem] sm:text-3xl font-extrabold text-foreground leading-tight">
          Descubra em 2 minutos{" "}
          <span className="text-sky-400">quanto a IA pode gerar pra você</span>{" "}
          por dia.
        </h1>
        <p className="text-[13px] sm:text-base text-muted-foreground leading-relaxed">
          Responda 7 perguntas simples. A inteligência artificial vai analisar seu perfil e calcular seu{" "}
          <strong className="text-foreground">potencial de ganho diário</strong>. Sem compromisso.
        </p>
      </div>

      {/* Barra de progresso */}
      <div className="w-full funnel-card border-border/30 bg-card/50 py-3 px-4 space-y-2">
        <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
          <div className="h-full w-0 bg-gradient-to-r from-sky-500 to-sky-400 rounded-full" />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">0% completo</span>
          <span className="text-[11px] text-muted-foreground">Etapa 1 de 7 — Seu perfil</span>
        </div>
      </div>

      {/* 3 cards */}
      <div className="grid grid-cols-3 gap-2 w-full">
        <div className="flex flex-col items-center gap-1.5 funnel-card border-border/50 bg-card/50 py-3 px-2">
          <Clock className="w-5 h-5 text-sky-400" />
          <span className="text-[11px] sm:text-xs font-semibold text-foreground text-center">Leva 2 minutos</span>
        </div>
        <div className="flex flex-col items-center gap-1.5 funnel-card border-border/50 bg-card/50 py-3 px-2">
          <Shield className="w-5 h-5 text-sky-400" />
          <span className="text-[11px] sm:text-xs font-semibold text-foreground text-center">100% gratuito</span>
        </div>
        <div className="flex flex-col items-center gap-1.5 funnel-card border-border/50 bg-card/50 py-3 px-2">
          <BarChart3 className="w-5 h-5 text-sky-400" />
          <span className="text-[11px] sm:text-xs font-semibold text-foreground text-center">Resultado personalizado</span>
        </div>
      </div>

      {/* Depoimento */}
      <div className="w-full funnel-card border-border/30 bg-card/30 py-3 px-4">
        <div className="flex items-start gap-3">
          <img src={avatarClaudia} alt="Cláudia" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
          <div className="space-y-1 min-w-0">
            <p className="text-[13px] text-muted-foreground leading-relaxed italic">
              "Fiz o teste achando que era besteira. No dia seguinte já tinha R$87 na conta."
            </p>
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] font-semibold text-foreground">— Cláudia, 52 anos</span>
              <span className="text-amber-400 text-xs">⭐⭐⭐⭐⭐</span>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="w-full space-y-2.5">
        <CTAButton onClick={onNext} className="animate-bounce-subtle text-[15px] sm:text-xl">
          COMEÇAR MEU TESTE GRATUITO →
        </CTAButton>
        <div className="flex items-center gap-2 justify-center">
          <Lock className="w-3 h-3 text-primary shrink-0" />
          <p className="text-[11px] text-muted-foreground text-center">
            Sem cadastro • Sem cartão • Resultado imediato
          </p>
        </div>
      </div>
    </StepContainer>
  );
};

export default Step1VariantC;
