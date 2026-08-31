import { useEffect, useRef } from "react";
import { StepContainer, StepTitle, StepSubtitle, OptionCard } from "./QuizUI";
import { Wallet, PiggyBank, Landmark, TrendingUp, Gem } from "lucide-react";
import { useLanguage, type Language } from "@/lib/i18n";

interface StepAccountBalanceProps {
  onNext: (value: string) => void;
  userName?: string;
  userAge?: string;
  variant?: "A" | "B"; // A = original; B = pergunta suavizada (intenção, não posse)
}

// Versão B (suave): foco em "com quanto QUER começar" + reforço de que não precisa ter muito.
const bTexts = {
  pt: {
    title: (name?: string) => `${name ? `${name}, falta` : "Falta"} só isso pro seu plano:`,
    subtitle: <>Não precisa ter muito guardado — <strong className="text-foreground">tem gente começando com R$50</strong>. Com quanto <strong className="text-foreground">você se sentiria confortável</strong> pra começar?</>,
    opts: [
      { label: "Quero começar pequeno", sublabel: "Até R$100 — perfeito pra testar" },
      { label: "Um pouco mais tranquilo", sublabel: "R$100 a R$500" },
      { label: "Dá pra acelerar", sublabel: "R$500 a R$2.000" },
      { label: "Quero resultado rápido", sublabel: "R$2.000 a R$10.000" },
      { label: "Vou com tudo", sublabel: "Mais de R$10.000 — potencial máximo" },
    ],
    footer: "🔒 Sem julgamento e 100% sigiloso — é só pra IA calibrar seu plano no seu ritmo.",
  },
  en: {
    title: (name?: string) => `${name ? `${name}, just` : "Just"} this left for your plan:`,
    subtitle: <>You don't need much saved — <strong className="text-foreground">many start with $50</strong>. How much would <strong className="text-foreground">you feel comfortable</strong> starting with?</>,
    opts: [
      { label: "Start small", sublabel: "Up to $100 — perfect to test" },
      { label: "A bit more relaxed", sublabel: "$100 to $500" },
      { label: "Ready to speed up", sublabel: "$500 to $2,000" },
      { label: "Want fast results", sublabel: "$2,000 to $10,000" },
      { label: "All in", sublabel: "Over $10,000 — max potential" },
    ],
    footer: "🔒 No judgment, 100% private — just for the AI to calibrate your plan.",
  },
  es: {
    title: (name?: string) => `${name ? `${name}, falta` : "Falta"} solo esto para tu plan:`,
    subtitle: <>No necesitás tener mucho — <strong className="text-foreground">hay gente empezando con $50</strong>. ¿Con cuánto <strong className="text-foreground">te sentirías cómodo</strong> para empezar?</>,
    opts: [
      { label: "Empezar de a poco", sublabel: "Hasta $100 — perfecto para probar" },
      { label: "Un poco más tranquilo", sublabel: "$100 a $500" },
      { label: "Puedo acelerar", sublabel: "$500 a $2.000" },
      { label: "Quiero resultado rápido", sublabel: "$2.000 a $10.000" },
      { label: "Voy con todo", sublabel: "Más de $10.000 — máximo potencial" },
    ],
    footer: "🔒 Sin juicios y 100% confidencial — solo para que la IA calibre tu plan.",
  },
};

const texts = {
  pt: {
    title: (name?: string) => `${name ? `${name}, última` : "Última"} pergunta antes do seu plano personalizado:`,
    subtitle: <>Pra IA montar a <strong className="text-foreground">melhor estratégia pro seu perfil</strong>, preciso saber: quanto você tem disponível hoje pra dar o primeiro passo?</>,
    opts: [
      { label: "Menos de R$100", sublabel: "Tudo bem — muitos começaram assim" },
      { label: "Entre R$100 e R$500", sublabel: "Já é o suficiente pra começar" },
      { label: "Entre R$500 e R$2.000", sublabel: "Ótimo ponto de partida" },
      { label: "Entre R$2.000 e R$10.000", sublabel: "Excelente — mais opções pra você" },
      { label: "Mais de R$10.000", sublabel: "Máximo potencial de retorno" },
    ],
    footer: "🔒 Resposta 100% sigilosa — usada apenas pela IA para calibrar seu plano.",
  },
  en: {
    title: (name?: string) => `${name ? `${name}, last` : "Last"} question before your personalized plan:`,
    subtitle: <>For the AI to build the <strong className="text-foreground">best strategy for your profile</strong>, I need to know: how much do you have available today to take the first step?</>,
    opts: [
      { label: "Less than $100", sublabel: "That's okay — many started this way" },
      { label: "$100 to $500", sublabel: "That's enough to get started" },
      { label: "$500 to $2,000", sublabel: "Great starting point" },
      { label: "$2,000 to $10,000", sublabel: "Excellent — more options for you" },
      { label: "More than $10,000", sublabel: "Maximum return potential" },
    ],
    footer: "🔒 100% confidential — used only by the AI to calibrate your plan.",
  },
  es: {
    title: (name?: string) => `${name ? `${name}, última` : "Última"} pregunta antes de tu plan personalizado:`,
    subtitle: <>Para que la IA arme la <strong className="text-foreground">mejor estrategia para tu perfil</strong>, necesito saber: ¿cuánto tenés disponible hoy para dar el primer paso?</>,
    opts: [
      { label: "Menos de $100", sublabel: "Está bien — muchos empezaron así" },
      { label: "Entre $100 y $500", sublabel: "Ya es suficiente para empezar" },
      { label: "Entre $500 y $2.000", sublabel: "Excelente punto de partida" },
      { label: "Entre $2.000 y $10.000", sublabel: "Excelente — más opciones para vos" },
      { label: "Más de $10.000", sublabel: "Máximo potencial de retorno" },
    ],
    footer: "🔒 Respuesta 100% confidencial — usada solo por la IA para calibrar tu plan.",
  },
};

const icons = [
  <Wallet className="w-5 h-5" />,
  <PiggyBank className="w-5 h-5" />,
  <Landmark className="w-5 h-5" />,
  <TrendingUp className="w-5 h-5" />,
  <Gem className="w-5 h-5" />,
];
const values = ["menos100", "100-500", "500-2000", "2000-10000", "10000+"];

const StepAccountBalance = ({ onNext, userName, variant = "A" }: StepAccountBalanceProps) => {
  const { lang } = useLanguage();
  const t = (variant === "B" ? bTexts : texts)[lang];
  const firstName = userName?.split(" ")[0];
  const ttFired = useRef(false);

  useEffect(() => {
    if (ttFired.current) return;
    ttFired.current = true;
    try {
      if (window.ttq) {
        window.ttq.track("ViewContent", {
          content_name: "Quiz - Etapa Saldo",
          content_type: "product",
        });
        console.log("[TikTok Pixel] ✅ ViewContent fired (Saldo)");
      }
    } catch (err) {
      console.warn("[TikTok Pixel] ViewContent error:", err);
    }
  }, []);

  return (
    <StepContainer>
      <StepTitle>{t.title(firstName)}</StepTitle>
      <StepSubtitle>{t.subtitle}</StepSubtitle>

      <div className="w-full space-y-3">
        {t.opts.map((opt, i) => (
          <OptionCard key={values[i]} label={opt.label} sublabel={opt.sublabel} icon={icons[i]} onClick={() => onNext(values[i])} />
        ))}
      </div>

      <p className="text-xs text-muted-foreground/60 text-center leading-relaxed">{t.footer}</p>
    </StepContainer>
  );
};

export default StepAccountBalance;
