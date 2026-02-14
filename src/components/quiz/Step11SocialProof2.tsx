import { useState, useEffect } from "react";
import { StepContainer, StepTitle, StepSubtitle, CTAButton } from "./QuizUI";
import avatarJose from "@/assets/avatar-jose.jpg";
import avatarLucia from "@/assets/avatar-lucia.jpg";

interface Step11Props {
  onNext: () => void;
}

const Step11SocialProof2 = ({ onNext }: Step11Props) => {
  const [showCTA, setShowCTA] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowCTA(true), 8000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Load ConverteAI SDK
    const s = document.createElement("script");
    s.src = "https://scripts.converteai.net/lib/js/smartplayer-wc/v4/sdk.js";
    s.async = true;
    document.head.appendChild(s);

    // Set iframe src after mount
    const iframe = document.getElementById("ifr_690fc5f5da9cb48e0b5df28c") as HTMLIFrameElement;
    if (iframe) {
      iframe.src =
        "https://scripts.converteai.net/09ec79a4-c31f-44ce-ba7d-89003424c826/players/690fc5f5da9cb48e0b5df28c/v4/embed.html" +
        (window.location.search || "?") +
        "&vl=" +
        encodeURIComponent(window.location.href);
    }

    return () => {
      document.head.removeChild(s);
    };
  }, []);

  return (
    <StepContainer>
      <div className="text-center space-y-1">
        <p className="text-3xl">🎯</p>
        <StepTitle>Ótima notícia: seu perfil é compatível!</StepTitle>
      </div>

      <StepSubtitle>
        Pessoas com o mesmo perfil que o seu já estão tendo resultados reais. Veja o que elas dizem:
      </StepSubtitle>

      {/* ─── Headline Copy ─── */}
      <div className="w-full funnel-card border-accent/30 bg-accent/5 text-center space-y-2">
        <p className="text-sm sm:text-base text-foreground font-bold leading-snug">
          Nos próximos <span className="text-accent">30 SEGUNDOS</span> vou te explicar como você pode se tornar
          meu <span className="text-gradient-green">parceiro(a)</span> na única plataforma capaz de te fazer ganhar com apenas{" "}
          <span className="text-accent">10 MINUTOS DO SEU TEMPO LIVRE POR DIA</span>
        </p>
        <p className="text-lg sm:text-xl font-display font-bold text-foreground">
          de <span className="text-gradient-green">R$200 a R$1.000</span> reais!
        </p>
      </div>

      {/* ─── ConverteAI Video Player ─── */}
      <div className="w-full rounded-2xl overflow-hidden border border-border shadow-xl">
        <div
          id="ifr_690fc5f5da9cb48e0b5df28c_wrapper"
          style={{ margin: "0 auto", width: "100%", maxWidth: "400px" }}
        >
          <div
            style={{ position: "relative", paddingTop: "177.78%" }}
            id="ifr_690fc5f5da9cb48e0b5df28c_aspect"
          >
            <iframe
              frameBorder="0"
              allowFullScreen
              src="about:blank"
              id="ifr_690fc5f5da9cb48e0b5df28c"
              style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
              referrerPolicy="origin"
            />
          </div>
        </div>
      </div>

      {/* ─── Testimonials ─── */}
      <div className="w-full space-y-3">
        <div className="funnel-card border-primary/25 bg-primary/5">
          <div className="flex items-center gap-3 mb-3">
            <img src={avatarJose} alt="Antônio" className="w-11 h-11 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-primary/30 shrink-0" />
            <div className="min-w-0">
              <p className="font-bold text-foreground text-sm sm:text-base">Antônio, 58 anos</p>
              <p className="text-xs sm:text-sm text-muted-foreground">São Paulo, SP • Aluno verificado ✅</p>
            </div>
          </div>
          <p className="text-sm sm:text-base text-foreground/90 italic leading-relaxed">
            "Eu tinha muito medo de perder dinheiro de novo. Já tinha caído em golpe antes. Mas desta vez foi diferente — comecei devagar, seguindo o passo a passo, e no terceiro dia já tinha feito R$87. Hoje pago minhas contas com tranquilidade e ainda sobra."
          </p>
        </div>

        <div className="funnel-card border-primary/25 bg-primary/5">
          <div className="flex items-center gap-3 mb-3">
            <img src={avatarLucia} alt="Dona Cláudia" className="w-11 h-11 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-primary/30 shrink-0" />
            <div className="min-w-0">
              <p className="font-bold text-foreground text-sm sm:text-base">Dona Cláudia, 62 anos</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Belo Horizonte, MG • Aluna verificada ✅</p>
            </div>
          </div>
          <p className="text-sm sm:text-base text-foreground/90 italic leading-relaxed">
            "Minha aposentadoria não dava pra nada. Vivia no limite. Hoje complemento com R$150 por dia e finalmente durmo sem preocupação. O suporte me ajudou em cada passo, como se eu tivesse um professor particular."
          </p>
        </div>
      </div>

      {/* ─── Emotional CTA ─── */}
      <div className="w-full funnel-card border-accent/20 bg-accent/5 text-center">
        <p className="text-sm sm:text-base text-foreground font-semibold leading-relaxed">
          Você merece terminar cada mês com a <span className="text-primary font-bold">tranquilidade</span> de quem tem as contas pagas e dinheiro sobrando.{" "}
          <span className="font-bold">Chega de viver no limite.</span>
        </p>
      </div>

      {/* ─── CTA ─── */}
      {showCTA ? (
        <CTAButton onClick={onNext} className="animate-fade-in">
          QUERO VER COMO FUNCIONA →
        </CTAButton>
      ) : (
        <div className="text-center space-y-2">
          <div className="w-8 h-8 rounded-full border-[3px] border-primary/30 border-t-primary animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground animate-pulse">
            ⏳ Assista o vídeo para continuar...
          </p>
        </div>
      )}
    </StepContainer>
  );
};

export default Step11SocialProof2;
