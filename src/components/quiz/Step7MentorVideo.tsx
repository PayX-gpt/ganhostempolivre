import { useState, useEffect, useRef } from "react";
import { StepContainer, StepTitle, StepSubtitle, CTAButton } from "./QuizUI";
import { MessageSquare, Loader2 } from "lucide-react";
import mentorPhoto from "@/assets/mentor-new.webp";
import { isYoungProfile } from "@/lib/agePersonalization";
import { useLanguage, type Language } from "@/lib/i18n";

interface Step7Props {
  onNext: () => void;
  userAge?: string;
}

const texts = {
  pt: {
    mentorName: "Ricardo Almeida",
    mentorRole: "Criador do Método Tempo Livre — +R$12M em resultados",
    title1: "Uma mensagem especial do nosso ",
    titleHL: "especialista",
    title2: " para você",
    subtitleYoung: "Ricardo Almeida já orientou milhares de pessoas — de todas as idades — a construírem uma fonte de renda consistente. Ele tem uma mensagem para você. São apenas 3 minutos:",
    subtitleMature: "Ricardo já ajudou mais de 36.000 pessoas a conquistarem segurança financeira. Ouça o que ele tem a dizer — são apenas 3 minutos:",
    cta: "CONTINUAR MEU TESTE →",
    waiting: "Já vi o suficiente. Quero continuar →",
    quoteYoung: '"Já orientei pessoas de 20 a 65 anos. A idade não importa — o que importa é seguir o processo. Se você dedicar 10 minutos por dia, vai ver resultado. Não é promessa, é método."',
    quoteMature: '"A maioria dos meus melhores alunos tem mais de 50 anos. Eles não tinham experiência nenhuma com tecnologia. Mesmo assim, conseguiram. Se eles conseguiram, você também consegue."',
  },
  en: {
    mentorName: "Ricardo Almeida",
    mentorRole: "Creator of the Free Time Method — $12M+ in results",
    title1: "A special message from our ",
    titleHL: "expert",
    title2: " for you",
    subtitleYoung: "Ricardo Almeida has guided thousands of people — of all ages — to build a consistent income source. He has a message for you. It's just 3 minutes:",
    subtitleMature: "Ricardo has helped over 36,000 people achieve financial security. Hear what he has to say — it's just 3 minutes:",
    cta: "CONTINUE MY TEST →",
    waiting: "I've seen enough. Let me continue →",
    quoteYoung: '"I\'ve mentored people from 20 to 65. Age doesn\'t matter — what matters is following the process. If you dedicate 10 minutes a day, you\'ll see results. It\'s not a promise, it\'s a method."',
    quoteMature: '"Most of my best students are over 50. They had zero experience with technology. And yet, they made it. If they could do it, so can you."',
  },
  es: {
    mentorName: "Ricardo Almeida",
    mentorRole: "Creador del Método Tiempo Libre — +$12M en resultados",
    title1: "Un mensaje especial de nuestro ",
    titleHL: "especialista",
    title2: " para vos",
    subtitleYoung: "Ricardo Almeida ya orientó a miles de personas — de todas las edades — a construir una fuente de ingreso estable. Tiene un mensaje para vos. Son solo 3 minutos:",
    subtitleMature: "Ricardo ya ayudó a más de 36.000 personas a lograr seguridad financiera. Escuchá lo que tiene para decir — son solo 3 minutos:",
    cta: "CONTINUAR MI TEST →",
    waiting: "Ya vi suficiente. Quiero continuar →",
    quoteYoung: '"Ya orienté a personas de 20 a 65 años. La edad no importa — lo que importa es seguir el proceso. Si dedicás 10 minutos por día, vas a ver resultados. No es promesa, es método."',
    quoteMature: '"La mayoría de mis mejores alumnos tienen más de 50 años. No tenían ninguna experiencia con tecnología. Y aun así, lo lograron. Si ellos pudieron, vos también podés."',
  },
} as const;

const Step7MentorVideo = ({ onNext, userAge }: Step7Props) => {
  const { lang } = useLanguage();
  const t = texts[lang];
  const [showCTA, setShowCTA] = useState(false);
  const videoRef = useRef<HTMLDivElement>(null);
  const young = isYoungProfile(userAge);

  useEffect(() => { const timer = setTimeout(() => setShowCTA(true), 12_000); return () => clearTimeout(timer); }, []);
  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, []);

  // Panda Video - no script needed

  return (
    <StepContainer>
      <div className="flex items-center gap-2.5 w-full">
        <img src={mentorPhoto} alt={t.mentorName} className="w-10 h-10 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-primary/40 shrink-0" />
        <div className="min-w-0">
          <p className="font-bold text-foreground text-[13px] sm:text-base">{t.mentorName}</p>
          <p className="text-[11px] sm:text-sm text-muted-foreground">{t.mentorRole}</p>
        </div>
      </div>

      <StepTitle>{t.title1}<span className="text-gradient-green">{t.titleHL}</span>{t.title2}</StepTitle>
      <StepSubtitle>{young ? t.subtitleYoung : t.subtitleMature}</StepSubtitle>

      <div className="w-full rounded-2xl overflow-hidden border border-border scroll-mt-24" ref={videoRef}>
        <div style={{ position: "relative", paddingTop: "177.77777777777777%" }}>
          <iframe
            id="panda-c43f8946-fd30-48f5-9d97-bdd7a0e2f4d8"
            src="https://player-vz-350772d9-cdc.tv.pandavideo.com.br/embed/?v=c43f8946-fd30-48f5-9d97-bdd7a0e2f4d8"
            style={{ border: "none", position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
            allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture"
            allowFullScreen
            
          />
        </div>
      </div>

      <CTAButton onClick={onNext} className={showCTA ? "animate-fade-in" : "opacity-0 pointer-events-none"}>{t.cta}</CTAButton>
      {!showCTA && (
        <div className="flex items-center gap-2 justify-center">
          <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
          <p className="text-sm text-muted-foreground animate-pulse">{t.waiting}</p>
        </div>
      )}

      <div className="w-full funnel-card border-primary/20 bg-primary/5">
        <div className="flex items-start gap-2">
          <MessageSquare className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p className="text-sm text-foreground/80 text-center leading-relaxed italic">
            {young ? t.quoteYoung : t.quoteMature}
          </p>
        </div>
      </div>
    </StepContainer>
  );
};

export default Step7MentorVideo;
