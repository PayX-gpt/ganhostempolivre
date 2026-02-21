import { useState, useEffect, useRef } from "react";
import { StepContainer, StepTitle, StepSubtitle, CTAButton } from "./QuizUI";
import { BarChart3, CheckCircle, Loader2 } from "lucide-react";
import avatarRegina from "@/assets/avatar-regina.jpg";
import avatarCarlos from "@/assets/avatar-carlos.jpg";
import { isYoungProfile } from "@/lib/agePersonalization";

interface Step3Props {
  onNext: () => void;
  userAge?: string;
}

const Step3SocialProof = ({ onNext, userAge }: Step3Props) => {
  const [showCTA, setShowCTA] = useState(false);
  const videoRef = useRef<HTMLDivElement>(null);
  const young = isYoungProfile(userAge);

  useEffect(() => {
    const timer = setTimeout(() => setShowCTA(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://scripts.converteai.net/lib/js/smartplayer/v1/sdk.min.js";
    script.dataset.id = "67d187e9fad7e51c45b357f2";
    script.async = true;
    document.head.appendChild(script);

    const iframe = document.getElementById("ifr_67d187e9fad7e51c45b357f2") as HTMLIFrameElement;
    if (iframe) {
      iframe.src =
        "https://scripts.converteai.net/09ec79a4-c31f-44ce-ba7d-89003424c826/players/67d187e9fad7e51c45b357f2/embed.html" +
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
      <StepTitle>
        Mais de <span className="text-gradient-green">36.000 brasileiros</span> já descobriram como ter uma renda extra segura
      </StepTitle>

      <StepSubtitle>
        {young
          ? "Veja o depoimento de quem deu o primeiro passo — e hoje tem uma fonte de renda consistente:"
          : "Veja o depoimento de quem estava na mesma situação que você — e hoje vive com tranquilidade financeira:"}
      </StepSubtitle>

      {/* ConverteAI Video Player */}
      <div className="w-full rounded-2xl overflow-hidden border border-border scroll-mt-24" ref={videoRef}>
        <div id="ifr_67d187e9fad7e51c45b357f2_wrapper" style={{ margin: "0 auto", width: "100%" }}>
          <div style={{ padding: "56.25% 0 0 0", position: "relative" }} id="ifr_67d187e9fad7e51c45b357f2_aspect">
            <iframe
              frameBorder="0"
              allowFullScreen
              src="about:blank"
              id="ifr_67d187e9fad7e51c45b357f2"
              style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
              referrerPolicy="origin"
            />
          </div>
        </div>
      </div>

      <div className="w-full funnel-card border-primary/25 bg-primary/5">
        <div className="flex items-center gap-3 mb-3">
          <img src={young ? avatarCarlos : avatarRegina} alt={young ? "Lucas" : "Dona Márcia"} className="w-11 h-11 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-primary/30 shrink-0" />
          <div className="min-w-0">
            <p className="font-bold text-foreground text-sm sm:text-base">{young ? "Lucas Oliveira, 27 anos" : "Dona Márcia, 52 anos"}</p>
            <div className="flex items-center gap-1">
              <span className="text-xs sm:text-sm text-muted-foreground">{young ? "São Paulo, SP" : "Goiânia, GO"} • Aluno verificado</span>
              <CheckCircle className="w-3.5 h-3.5 text-primary" />
            </div>
          </div>
        </div>
        <p className="text-sm sm:text-base text-foreground/90 italic leading-relaxed">
          {young
            ? "\"Eu trabalhava o dia inteiro e no fim do mês nunca sobrava nada. Comecei usando no tempo livre, sem largar nada. Hoje complemento minha renda com R$160 por dia e finalmente consigo planejar meu futuro com tranquilidade.\""
            : "\"Eu tinha vergonha de pedir dinheiro emprestado todo mês. Minha aposentadoria não cobria nem as contas básicas. Comecei com medo, mas o passo a passo me deu segurança. Hoje tiro R$180 por dia e não dependo mais de ninguém.\""}
        </p>
      </div>

      <div className="w-full funnel-card border-accent/20 bg-accent/5 text-center">
        <div className="flex items-center justify-center gap-2">
          <BarChart3 className="w-4 h-4 text-accent shrink-0" />
          <p className="text-sm text-foreground/80 leading-relaxed">
            {young ? (
              <><strong>Dado real:</strong> Nossos alunos entre 18 e 35 anos são os que mais rápido atingem os primeiros resultados — em média, na primeira semana.</>
            ) : (
              <><strong>Dado real:</strong> 73% dos nossos alunos acima de 40 anos conseguiram seus primeiros resultados na primeira semana.</>
            )}
          </p>
        </div>
      </div>

      {showCTA ? (
        <CTAButton onClick={onNext} className="animate-fade-in">
          QUERO DESCOBRIR SE É PRA MIM →
        </CTAButton>
      ) : (
        <div className="flex items-center gap-2 justify-center">
          <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
          <p className="text-sm text-muted-foreground animate-pulse">
            Assista o depoimento para continuar...
          </p>
        </div>
      )}
    </StepContainer>
  );
};

export default Step3SocialProof;
