import { useState } from "react";
import { StepContainer, StepTitle, StepSubtitle, OptionCard, CTAButton } from "./QuizUI";
import { Frown, ThumbsUp, HelpCircle, CheckCircle, BarChart3 } from "lucide-react";
import { isYoungProfile } from "@/lib/agePersonalization";
import { useLanguage, type Language } from "@/lib/i18n";

interface Step4Props {
  onNext: (answer: string) => void;
  userName?: string;
  userAge?: string;
}

const texts = {
  pt: {
    title1: "Você já tentou ",
    titleHL: "ganhar dinheiro",
    title2: " pela internet antes?",
    subtitle: "Não importa sua resposta. O que importa é o próximo passo.",
    opt1: "Sim, mas não deu certo",
    opt1sub: "Tentei e acabei perdendo dinheiro, tempo ou os dois",
    opt2: "Sim, tenho alguma experiência",
    opt2sub: "Já tive alguns resultados, mas quero melhorar",
    opt3: "Não, nunca tentei",
    opt3sub: "Sempre tive vontade, mas nunca dei o primeiro passo",
    stat: "68% responderam \"Sim, mas não deu certo\" — e mesmo assim conseguiram resultados.",
    feedbackTitleYoung: (n: string) => `${n}, o problema não foi você — foi o método.`,
    feedbackTitleMature: (n: string) => `${n}, eu preciso te dizer uma coisa.`,
    feedbackBodyYoung: "O que vou te mostrar agora é diferente. Uma IA que faz o trabalho pesado. Sem complicação.",
    feedbackBodyMature: "Se não deu certo antes, o problema não foi você. O que eu vou te mostrar aqui é diferente de tudo que você já viu. A tecnologia faz o trabalho. Você só acompanha.",
    feedbackCta: "CONTINUAR MEU TESTE →",
  },
  en: {
    title1: "Have you ever tried to ",
    titleHL: "make money",
    title2: " online before?",
    subtitle: "Your answer doesn't matter. What matters is the next step.",
    opt1: "Yes, but it didn't work",
    opt1sub: "I tried and ended up losing money, time, or both",
    opt2: "Yes, I have some experience",
    opt2sub: "I've had some results, but I want to improve",
    opt3: "No, I've never tried",
    opt3sub: "I've always wanted to, but never took the first step",
    stat: "68% answered \"Yes, but it didn't work\" — and still managed to get results.",
    feedbackTitleYoung: (n: string) => `${n}, the problem wasn't you — it was the method.`,
    feedbackTitleMature: (n: string) => `${n}, I need to tell you something.`,
    feedbackBodyYoung: "What I'm about to show you is different. An AI that does the heavy lifting. No complications.",
    feedbackBodyMature: "If it didn't work before, the problem wasn't you. What I'm going to show you here is unlike anything you've seen. The technology does the work. You just follow along.",
    feedbackCta: "CONTINUE MY TEST →",
  },
  es: {
    title1: "¿Ya intentaste ",
    titleHL: "ganar dinero",
    title2: " por internet antes?",
    subtitle: "No importa tu respuesta. Lo que importa es el próximo paso.",
    opt1: "Sí, pero no funcionó",
    opt1sub: "Intenté y terminé perdiendo plata, tiempo o los dos",
    opt2: "Sí, tengo algo de experiencia",
    opt2sub: "Tuve algunos resultados, pero quiero mejorar",
    opt3: "No, nunca intenté",
    opt3sub: "Siempre quise, pero nunca di el primer paso",
    stat: "El 68% respondió \"Sí, pero no funcionó\" — y aun así lograron resultados.",
    feedbackTitleYoung: (n: string) => `${n}, el problema no fuiste vos — fue el método.`,
    feedbackTitleMature: (n: string) => `${n}, necesito decirte algo.`,
    feedbackBodyYoung: "Lo que te voy a mostrar ahora es diferente. Una IA que hace el trabajo pesado. Sin complicaciones.",
    feedbackBodyMature: "Si no funcionó antes, el problema no fuiste vos. Lo que te voy a mostrar acá es diferente a todo lo que viste. La tecnología hace el trabajo. Vos solo acompañás.",
    feedbackCta: "CONTINUAR MI TEST →",
  },
} as const;

const Step4TriedOnline = ({ onNext, userName, userAge }: Step4Props) => {
  const { lang } = useLanguage();
  const t = texts[lang];
  const [selected, setSelected] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const young = isYoungProfile(userAge);
  const n = userName || (lang === "en" ? "you" : lang === "es" ? "vos" : "você");

  const handleSelect = (answer: string) => {
    setSelected(answer);
    if (answer === "sim_falhou") setShowFeedback(true);
    else setTimeout(() => onNext(answer), 400);
  };

  if (showFeedback && selected === "sim_falhou") {
    return (
      <StepContainer>
        <div className="w-full flex flex-col items-center gap-5 py-4">
          <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center border-2 border-primary/30">
            <CheckCircle className="w-8 h-8 text-primary" />
          </div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground text-center leading-snug">
            {young ? t.feedbackTitleYoung(n) : t.feedbackTitleMature(n)}
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground text-center leading-relaxed max-w-md">
            {young ? t.feedbackBodyYoung : t.feedbackBodyMature}
          </p>
          <div className="w-full mt-2">
            <CTAButton onClick={() => onNext(selected)}>{t.feedbackCta}</CTAButton>
          </div>
        </div>
      </StepContainer>
    );
  }

  return (
    <StepContainer>
      <StepTitle>{t.title1}<span className="text-gradient-green">{t.titleHL}</span>{t.title2}</StepTitle>
      <StepSubtitle>{t.subtitle}</StepSubtitle>

      <div className="w-full space-y-3 mt-2">
        <OptionCard label={t.opt1} sublabel={t.opt1sub} icon={<Frown className="w-5 h-5" />} selected={selected === "sim_falhou"} onClick={() => handleSelect("sim_falhou")} />
        <OptionCard label={t.opt2} sublabel={t.opt2sub} icon={<ThumbsUp className="w-5 h-5" />} selected={selected === "sim_experiencia"} onClick={() => handleSelect("sim_experiencia")} />
        <OptionCard label={t.opt3} sublabel={t.opt3sub} icon={<HelpCircle className="w-5 h-5" />} selected={selected === "nunca"} onClick={() => handleSelect("nunca")} />
      </div>

      <div className="flex items-center gap-2 justify-center mt-1">
        <BarChart3 className="w-4 h-4 text-primary shrink-0" />
        <p className="text-sm text-muted-foreground text-center"><em>{t.stat}</em></p>
      </div>
    </StepContainer>
  );
};

export default Step4TriedOnline;
