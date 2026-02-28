import { useState, useEffect } from "react";
import { StepContainer } from "./QuizUI";
import { Search, Settings, BarChart3, Target, MapPin, Sparkles, CheckCircle, Square, Lock, Loader2 } from "lucide-react";
import mentorPhoto from "@/assets/mentor-new.webp";
import { isYoungProfile } from "@/lib/agePersonalization";
import { useLanguage, type Language } from "@/lib/i18n";

interface Step10Props {
  onNext: () => void;
  userAge?: string;
}

const texts = {
  pt: {
    steps: [
      { text: "Cruzando suas respostas com nosso banco de dados...", detail: "Perfil, idade, disponibilidade e objetivos" },
      { text: "Verificando compatibilidade com o método...", detail: "Analisando histórico e nível de experiência" },
      { text: "Calculando seu potencial de ganho diário...", detail: "Com base na sua faixa de renda desejada" },
      { text: "Selecionando o plano ideal para o seu perfil...", detail: "Considerando seu tempo disponível e dispositivo" },
      { text: "Consultando vagas disponíveis na sua região...", detail: "Verificando disponibilidade em tempo real" },
      { text: "Gerando seu acesso personalizado...", detail: "Tudo pronto! Preparando seus resultados" },
    ],
    doneTitle: "Análise concluída!",
    doneSubtitle: "Seu perfil é altamente compatível!",
    doneBody: "Preparando seus resultados...",
    analyzingTitle: "Analisando suas respostas...",
    analyzingYoung: "Estamos cruzando suas respostas com o perfil dos nossos alunos de maior resultado para criar um plano sob medida.",
    analyzingMature: "Nosso sistema está cruzando seus dados com o perfil dos nossos ",
    analyzingMature2: "36.000+ alunos",
    analyzingMature3: " de sucesso.",
    doneLabel: "Análise completa",
    processing: "Processando...",
    trust: "Seus dados estão protegidos e criptografados",
  },
  en: {
    steps: [
      { text: "Cross-referencing your answers with our database...", detail: "Profile, age, availability, and goals" },
      { text: "Checking compatibility with the method...", detail: "Analyzing history and experience level" },
      { text: "Calculating your daily earning potential...", detail: "Based on your desired income range" },
      { text: "Selecting the ideal plan for your profile...", detail: "Considering your available time and device" },
      { text: "Checking available spots in your region...", detail: "Verifying real-time availability" },
      { text: "Generating your personalized access...", detail: "All set! Preparing your results" },
    ],
    doneTitle: "Analysis complete!",
    doneSubtitle: "Your profile is highly compatible!",
    doneBody: "Preparing your results...",
    analyzingTitle: "Analyzing your answers...",
    analyzingYoung: "We're cross-referencing your answers with the profile of our top-performing students to create a tailored plan.",
    analyzingMature: "Our system is cross-referencing your data with the profile of our ",
    analyzingMature2: "36,000+ successful students",
    analyzingMature3: ".",
    doneLabel: "Analysis complete",
    processing: "Processing...",
    trust: "Your data is protected and encrypted",
  },
  es: {
    steps: [
      { text: "Cruzando tus respuestas con nuestra base de datos...", detail: "Perfil, edad, disponibilidad y objetivos" },
      { text: "Verificando compatibilidad con el método...", detail: "Analizando historial y nivel de experiencia" },
      { text: "Calculando tu potencial de ganancia diaria...", detail: "Basado en tu rango de ingreso deseado" },
      { text: "Seleccionando el plan ideal para tu perfil...", detail: "Considerando tu tiempo disponible y dispositivo" },
      { text: "Consultando vacantes disponibles en tu región...", detail: "Verificando disponibilidad en tiempo real" },
      { text: "Generando tu acceso personalizado...", detail: "¡Todo listo! Preparando tus resultados" },
    ],
    doneTitle: "¡Análisis completo!",
    doneSubtitle: "¡Tu perfil es altamente compatible!",
    doneBody: "Preparando tus resultados...",
    analyzingTitle: "Analizando tus respuestas...",
    analyzingYoung: "Estamos cruzando tus respuestas con el perfil de nuestros alumnos de mayor resultado para crear un plan a medida.",
    analyzingMature: "Nuestro sistema está cruzando tus datos con el perfil de nuestros ",
    analyzingMature2: "36.000+ alumnos",
    analyzingMature3: " exitosos.",
    doneLabel: "Análisis completo",
    processing: "Procesando...",
    trust: "Tus datos están protegidos y encriptados",
  },
};

const stepIcons = [Search, Settings, BarChart3, Target, MapPin, Sparkles];

const Step10Loading = ({ onNext, userAge }: Step10Props) => {
  const { lang } = useLanguage();
  const t = texts[lang];
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const young = isYoungProfile(userAge);

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= t.steps.length - 1) { clearInterval(stepInterval); setTimeout(() => setShowResult(true), 800); return prev; }
        return prev + 1;
      });
    }, 1200);
    const progressInterval = setInterval(() => {
      setProgress((prev) => { if (prev >= 100) { clearInterval(progressInterval); return 100; } return prev + 1.4; });
    }, 100);
    return () => { clearInterval(stepInterval); clearInterval(progressInterval); };
  }, []);

  useEffect(() => {
    if (showResult) { const timer = setTimeout(onNext, 2000); return () => clearTimeout(timer); }
  }, [showResult, onNext]);

  return (
    <StepContainer>
      <div className="relative mx-auto">
        <div className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 ${showResult ? "border-primary" : "border-primary/30 border-t-primary animate-spin"} absolute inset-0`} />
        <img src={mentorPhoto} alt="Especialista" className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover relative z-10 border-4 border-transparent" />
      </div>

      {showResult ? (
        <div className="text-center space-y-2 animate-fade-in">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="w-6 h-6 text-accent" />
            <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground leading-snug">{t.doneTitle}</h2>
          </div>
          <p className="text-lg text-primary font-semibold">{t.doneSubtitle}</p>
          <p className="text-base text-muted-foreground leading-relaxed">{t.doneBody}</p>
        </div>
      ) : (
        <div className="text-center space-y-2">
          <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground leading-snug">{t.analyzingTitle}</h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            {young ? t.analyzingYoung : <>{t.analyzingMature}<span className="text-primary font-semibold">{t.analyzingMature2}</span>{t.analyzingMature3}</>}
          </p>
        </div>
      )}

      <div className="w-full space-y-2 mt-2">
        {t.steps.map((step, i) => {
          const isDone = i < currentStep || showResult;
          const isCurrent = i === currentStep && !showResult;
          const Icon = stepIcons[i];
          return (
            <div key={i} className={`flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl transition-all duration-500 ${isDone ? "bg-primary/5 border border-primary/20" : isCurrent ? "bg-accent/5 border border-accent/20" : "opacity-30"}`}>
              <div className={`shrink-0 mt-0.5 ${isDone ? "text-primary" : isCurrent ? "text-accent" : "text-muted-foreground"}`}>
                {isDone ? <CheckCircle className="w-4 h-4" /> : isCurrent ? <Icon className="w-4 h-4" /> : <Square className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs sm:text-sm font-semibold leading-snug ${isDone || isCurrent ? "text-foreground" : "text-muted-foreground"}`}>{step.text}</p>
                {(isDone || isCurrent) && <p className="text-xs text-muted-foreground mt-0.5 animate-fade-in">{step.detail}</p>}
              </div>
              {isCurrent && <Loader2 className="w-4 h-4 text-accent animate-spin shrink-0 mt-0.5" />}
            </div>
          );
        })}
      </div>

      <div className="w-full mt-3">
        <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
          <div className="h-full progress-bar-fill rounded-full transition-all duration-200" style={{ width: `${Math.min(progress, 100)}%` }} />
        </div>
        <div className="flex justify-between items-center mt-2">
          <div className="flex items-center gap-1">
            {showResult ? <CheckCircle className="w-3.5 h-3.5 text-primary" /> : <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin" />}
            <p className="text-xs text-muted-foreground">{showResult ? t.doneLabel : t.processing}</p>
          </div>
          <p className="text-sm text-foreground font-bold">{Math.min(Math.round(progress), 100)}%</p>
        </div>
      </div>

      <div className="w-full text-center mt-1">
        <div className="flex items-center gap-1.5 justify-center">
          <Lock className="w-3.5 h-3.5 text-primary" />
          <p className="text-xs text-muted-foreground">{t.trust}</p>
        </div>
      </div>
    </StepContainer>
  );
};

export default Step10Loading;
