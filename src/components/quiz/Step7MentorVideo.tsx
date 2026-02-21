import { useState, useEffect, useRef } from "react";
import { StepContainer, StepTitle, StepSubtitle, CTAButton } from "./QuizUI";
import { MessageSquare, Loader2 } from "lucide-react";
import mentorPhoto from "@/assets/mentor-new.webp";
import { isYoungProfile } from "@/lib/agePersonalization";

interface Step7Props {
  onNext: () => void;
  userAge?: string;
}

const Step7MentorVideo = ({ onNext, userAge }: Step7Props) => {
  const [showCTA, setShowCTA] = useState(false);
  const videoRef = useRef<HTMLDivElement>(null);
  const young = isYoungProfile(userAge);

  useEffect(() => {
    const timer = setTimeout(() => setShowCTA(true), 20_000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://scripts.converteai.net/lib/js/smartplayer-wc/v4/sdk.js";
    script.async = true;
    document.head.appendChild(script);

    const iframe = document.getElementById("ifr_692056147cc713fc76f6135f") as HTMLIFrameElement;
    if (iframe) {
      iframe.src =
        "https://scripts.converteai.net/09ec79a4-c31f-44ce-ba7d-89003424c826/players/692056147cc713fc76f6135f/v4/embed.html" +
        (window.location.search || "?") +
        "&vl=" +
        encodeURIComponent(window.location.href);
    }

    return () => {
      script.remove();
    };
  }, []);

  return (
    <StepContainer>
      <div className="flex items-center gap-3 w-full">
        <img
          src={mentorPhoto}
          alt="Especialista Ricardo"
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-primary/40 shrink-0"
        />
        <div className="min-w-0">
          <p className="font-bold text-foreground text-sm sm:text-base">Ricardo Almeida</p>
          <p className="text-xs sm:text-sm text-muted-foreground">Especialista em Renda Digital</p>
        </div>
      </div>

      <StepTitle>
        Uma mensagem especial do nosso <span className="text-gradient-green">especialista</span> para você
      </StepTitle>

      <StepSubtitle>
        {young
          ? "Ricardo Almeida já orientou milhares de pessoas — de todas as idades — a construírem uma fonte de renda consistente. Ele tem uma mensagem para você. São apenas 3 minutos:"
          : "Ricardo já ajudou mais de 36.000 pessoas a conquistarem segurança financeira. Ouça o que ele tem a dizer — são apenas 3 minutos:"}
      </StepSubtitle>

      {/* ConverteAI Video Player */}
      <div className="w-full rounded-2xl overflow-hidden border border-border scroll-mt-24" ref={videoRef}>
        <div
          id="ifr_692056147cc713fc76f6135f_wrapper"
          style={{ margin: "0 auto", width: "100%" }}
        >
          <div
            style={{ position: "relative", paddingTop: "177.77777777777777%", width: "100%" }}
            id="ifr_692056147cc713fc76f6135f_aspect"
          >
            <iframe
              frameBorder="0"
              allowFullScreen
              src="about:blank"
              id="ifr_692056147cc713fc76f6135f"
              style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
              referrerPolicy="origin"
            />
          </div>
        </div>
      </div>

      {showCTA ? (
        <CTAButton onClick={onNext} className="animate-fade-in">
          ENTENDI, QUERO CONTINUAR →
        </CTAButton>
      ) : (
        <div className="flex items-center gap-2 justify-center">
          <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
          <p className="text-sm text-muted-foreground animate-pulse">
            Assista o vídeo para continuar...
          </p>
        </div>
      )}

      <div className="w-full funnel-card border-primary/20 bg-primary/5">
        <div className="flex items-start gap-2">
          <MessageSquare className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p className="text-sm text-foreground/80 text-center leading-relaxed italic">
            {young
              ? '"Já orientei pessoas de 20 a 65 anos. A idade não importa — o que importa é seguir o processo. Se você dedicar 10 minutos por dia, vai ver resultado. Não é promessa, é método."'
              : '"A maioria dos meus melhores alunos tem mais de 50 anos. Eles não tinham experiência nenhuma com tecnologia. Mesmo assim, conseguiram. Se eles conseguiram, você também consegue."'}
          </p>
        </div>
      </div>
    </StepContainer>
  );
};

export default Step7MentorVideo;
