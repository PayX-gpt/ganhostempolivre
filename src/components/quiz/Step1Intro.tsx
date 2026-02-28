import { useState, useEffect } from "react";
import { StepContainer, CTAButton } from "./QuizUI";
import { Lock, Zap, TrendingUp, Users } from "lucide-react";
import chatgptLogo from "@/assets/chatgpt-logo.png";
import { useLanguage, type Language } from "@/lib/i18n";

interface Step1Props {
  onNext: () => void;
}

const texts = {
  pt: {
    counter: (n: string) => `${n} brasileiros já estão usando`,
    headline1: "R$50 a R$300 por dia.",
    headline2: "10 minutos.",
    headline3: "A IA faz o resto.",
    subheadline: "O resto do dia é seu. Tempo livre de verdade.",
    powered: "Powered by ChatGPT — Você vai ficar de fora?",
    triggers: ["Sem investir", "Sem aparecer", "Sem vender", "Sem experiência"],
    body: (b: string, s: string) =>
      `Não importa se você tem ${b}. Não importa se você nunca mexeu com tecnologia. Não importa se já tentou de tudo. ${s}`,
    bodyBold1: "18 ou 65 anos",
    bodyBold2: "Essa IA foi feita pra pessoas comuns que querem tempo livre e renda extra.",
    proof: "Faça o teste de 2 minutos.",
    proofBold: "Veja com seus próprios olhos",
    proofEnd: " quanto você pode gerar por dia.",
    cta: "EU QUERO MEUS R$300 POR DIA →",
    trust: "Teste gratuito • Resultado imediato • Sem pegadinha",
  },
  en: {
    counter: (n: string) => `${n} people are already using this`,
    headline1: "$50 to $300 per day.",
    headline2: "10 minutes.",
    headline3: "AI does the rest.",
    subheadline: "The rest of the day is yours. Real free time.",
    powered: "Powered by ChatGPT — Are you going to miss out?",
    triggers: ["No investment", "No showing face", "No selling", "No experience"],
    body: (b: string, s: string) =>
      `It doesn't matter if you're ${b}. It doesn't matter if you've never touched technology. It doesn't matter if you've tried everything. ${s}`,
    bodyBold1: "18 or 65 years old",
    bodyBold2: "This AI was built for everyday people who want free time and extra income.",
    proof: "Take the 2-minute test.",
    proofBold: "See for yourself",
    proofEnd: " how much you can earn per day.",
    cta: "I WANT MY $300 PER DAY →",
    trust: "Free test • Instant results • No catch",
  },
  es: {
    counter: (n: string) => `${n} personas ya lo están usando`,
    headline1: "$50 a $300 por día.",
    headline2: "10 minutos.",
    headline3: "La IA hace el resto.",
    subheadline: "El resto del día es tuyo. Tiempo libre de verdad.",
    powered: "Powered by ChatGPT — ¿Te vas a quedar afuera?",
    triggers: ["Sin invertir", "Sin aparecer", "Sin vender", "Sin experiencia"],
    body: (b: string, s: string) =>
      `No importa si tenés ${b}. No importa si nunca tocaste la tecnología. No importa si ya intentaste de todo. ${s}`,
    bodyBold1: "18 o 65 años",
    bodyBold2: "Esta IA fue creada para personas comunes que quieren tiempo libre e ingresos extra.",
    proof: "Hacé el test de 2 minutos.",
    proofBold: "Comprobalo con tus propios ojos",
    proofEnd: " cuánto podés generar por día.",
    cta: "QUIERO MIS $300 POR DÍA →",
    trust: "Test gratuito • Resultado inmediato • Sin trampa",
  },
} as const;

const Step1Intro = ({ onNext }: Step1Props) => {
  const { lang, locale } = useLanguage();
  const t = texts[lang];
  const [counter, setCounter] = useState(36847);

  useEffect(() => {
    const interval = setInterval(() => {
      setCounter((c) => c + Math.floor(Math.random() * 3) + 1);
    }, 4000 + Math.random() * 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <StepContainer>
      <div className="w-full funnel-card border-primary/30 bg-primary/5">
        <div className="flex items-center justify-center gap-2">
          <Users className="w-4 h-4 text-primary animate-pulse" />
          <p className="text-sm font-bold text-primary">
            {t.counter(counter.toLocaleString(locale))}
          </p>
        </div>
      </div>

      <div className="text-center space-y-4 mt-1">
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground leading-tight">
          <span className="text-gradient-green">{t.headline1}</span>{" "}
          {t.headline2}{" "}
          <span className="text-gradient-green">{t.headline3}</span>
        </h1>
        <p className="text-sm sm:text-base font-semibold text-primary/90">
          {t.subheadline}
        </p>

        <div className="flex items-center justify-center gap-2 mt-1">
          <img src={chatgptLogo} alt="ChatGPT" className="w-6 h-6 sm:w-7 sm:h-7" />
          <p className="text-base sm:text-lg font-bold text-foreground/80">
            {t.powered}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 w-full">
        {t.triggers.map((item) => (
          <div key={item} className="flex items-center gap-2 funnel-card border-border/50 bg-card/50 py-2.5 px-3">
            <Zap className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-sm font-semibold text-foreground">{item}</span>
          </div>
        ))}
      </div>

      <div className="w-full funnel-card border-border/30 bg-card/30">
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed text-center">
          {t.body(
            `<strong class="text-foreground">${t.bodyBold1}</strong>`,
            `<strong class="text-foreground">${t.bodyBold2}</strong>`
          ).split(/<strong.*?<\/strong>/g).length > 1 ? (
            <>
              {lang === "pt" && <>Não importa se você tem <strong className="text-foreground">{t.bodyBold1}</strong>. Não importa se você nunca mexeu com tecnologia. Não importa se já tentou de tudo. <strong className="text-foreground">{t.bodyBold2}</strong></>}
              {lang === "en" && <>It doesn't matter if you're <strong className="text-foreground">{t.bodyBold1}</strong>. It doesn't matter if you've never touched technology. It doesn't matter if you've tried everything. <strong className="text-foreground">{t.bodyBold2}</strong></>}
              {lang === "es" && <>No importa si tenés <strong className="text-foreground">{t.bodyBold1}</strong>. No importa si nunca tocaste la tecnología. No importa si ya intentaste de todo. <strong className="text-foreground">{t.bodyBold2}</strong></>}
            </>
          ) : null}
        </p>
      </div>

      <div className="flex items-center gap-2 justify-center">
        <TrendingUp className="w-4 h-4 text-primary" />
        <p className="text-sm font-medium text-foreground/70">
          {t.proof} <span className="font-bold text-foreground">{t.proofBold}</span>{t.proofEnd}
        </p>
      </div>

      <div className="w-full space-y-3">
        <CTAButton onClick={onNext} className="animate-bounce-subtle text-lg sm:text-xl">
          {t.cta}
        </CTAButton>
        <div className="flex items-center gap-2 justify-center">
          <Lock className="w-3.5 h-3.5 text-primary shrink-0" />
          <p className="text-xs text-muted-foreground text-center">
            {t.trust}
          </p>
        </div>
      </div>
    </StepContainer>
  );
};

export default Step1Intro;
