import { useEffect } from "react";
import { StepContainer, StepTitle, StepSubtitle, CTAButton } from "./QuizUI";
import avatarJose from "@/assets/avatar-jose.jpg";
import avatarLucia from "@/assets/avatar-lucia.jpg";

interface Step11Props {
  onNext: () => void;
}

const Step11SocialProof2 = ({ onNext }: Step11Props) => {
  useEffect(() => {
    // Load ConverteAI SDK
    const s = document.createElement("script");
    s.src = "https://scripts.converteai.net/lib/js/smartplayer-wc/v4/sdk.js";
    s.async = true;
    document.head.appendChild(s);
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

      {/* ConverteAI Video Player */}
      <div className="w-full">
        <div id="ifr_690fc5f5da9cb48e0b5df28c_wrapper" style={{ margin: "0 auto", width: "100%", maxWidth: "400px" }}>
          <div style={{ position: "relative", paddingTop: "177.78%" }} id="ifr_690fc5f5da9cb48e0b5df28c_aspect">
            <iframe
              frameBorder="0"
              allowFullScreen
              src="about:blank"
              id="ifr_690fc5f5da9cb48e0b5df28c"
              style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
              referrerPolicy="origin"
              onLoad={(e) => {
                const iframe = e.currentTarget;
                iframe.src = "https://scripts.converteai.net/09ec79a4-c31f-44ce-ba7d-89003424c826/players/690fc5f5da9cb48e0b5df28c/v4/embed.html" + (window.location.search || "?") + "&vl=" + encodeURIComponent(window.location.href);
              }}
            />
          </div>
        </div>
      </div>

      <div className="w-full space-y-3">
        <div className="funnel-card border-primary/25 bg-primary/5">
          <div className="flex items-center gap-3 mb-3">
            <img src={avatarJose} alt="Antônio" className="w-12 h-12 rounded-full object-cover border-2 border-primary/30 shrink-0" />
            <div>
              <p className="font-bold text-foreground text-base">Antônio, 58 anos</p>
              <p className="text-sm text-muted-foreground">São Paulo, SP • Aluno verificado ✅</p>
            </div>
          </div>
          <p className="text-base text-foreground/90 italic leading-relaxed">
            "Eu tinha muito medo de perder dinheiro de novo. Já tinha caído em golpe antes. Mas desta vez foi diferente — comecei devagar, seguindo o passo a passo, e no terceiro dia já tinha feito R$87. Hoje pago minhas contas com tranquilidade e ainda sobra."
          </p>
        </div>

        <div className="funnel-card border-primary/25 bg-primary/5">
          <div className="flex items-center gap-3 mb-3">
            <img src={avatarLucia} alt="Dona Cláudia" className="w-12 h-12 rounded-full object-cover border-2 border-primary/30 shrink-0" />
            <div>
              <p className="font-bold text-foreground text-base">Dona Cláudia, 62 anos</p>
              <p className="text-sm text-muted-foreground">Belo Horizonte, MG • Aluna verificada ✅</p>
            </div>
          </div>
          <p className="text-base text-foreground/90 italic leading-relaxed">
            "Minha aposentadoria não dava pra nada. Vivia no limite. Hoje complemento com R$150 por dia e finalmente durmo sem preocupação. O suporte me ajudou em cada passo, como se eu tivesse um professor particular."
          </p>
        </div>
      </div>

      <div className="w-full funnel-card border-accent/20 bg-accent/5 text-center">
        <p className="text-base text-foreground font-semibold leading-relaxed">
          Você merece terminar cada mês com a <span className="text-primary font-bold">tranquilidade</span> de quem tem as contas pagas e dinheiro sobrando.{" "}
          <span className="font-bold">Chega de viver no limite.</span>
        </p>
      </div>

      <CTAButton onClick={onNext}>
        QUERO VER COMO FUNCIONA →
      </CTAButton>
    </StepContainer>
  );
};

export default Step11SocialProof2;
