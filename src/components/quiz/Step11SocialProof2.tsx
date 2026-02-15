import { useState, useEffect } from "react";
import { StepContainer, StepTitle, StepSubtitle, CTAButton } from "./QuizUI";
import { Target, CheckCircle, Loader2 } from "lucide-react";
import avatarJose from "@/assets/avatar-jose.jpg";
import avatarLucia from "@/assets/avatar-lucia.jpg";

interface Step11Props {
  onNext: () => void;
}

const Step11SocialProof2 = ({ onNext }: Step11Props) => {
  const [showCTA, setShowCTA] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowCTA(true), 100_000); // 100 seconds
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const s = document.createElement("script");
    s.src = "https://scripts.converteai.net/lib/js/smartplayer-wc/v4/sdk.js";
    s.async = true;
    document.head.appendChild(s);

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
      <div className="flex items-center gap-2">
        <Target className="w-5 h-5 text-primary shrink-0" />
        <StepTitle>Ótima notícia: seu perfil é compatível!</StepTitle>
      </div>

      <p className="text-xs sm:text-sm text-muted-foreground text-center -mt-1">
        Pessoas com o mesmo perfil que o seu já estão tendo resultados reais.
      </p>

      {/* Headline Copy */}
      <div className="w-full funnel-card border-accent/30 bg-accent/5 text-center py-2.5 px-3">
        <p className="text-xs sm:text-sm text-foreground font-bold leading-snug">
          Nos próximos <span className="text-accent">30 SEGUNDOS</span> vou te explicar como ganhar com apenas{" "}
          <span className="text-accent">10 MIN DO SEU TEMPO LIVRE</span>{" "}
          de <span className="text-gradient-green">R$200 a R$1.000</span> reais!
        </p>
      </div>

      {/* ConverteAI Video Player */}
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

      {/* CTA */}
      {showCTA ? (
        <CTAButton onClick={onNext} className="animate-fade-in">
          PEGAR MEU ACESSO →
        </CTAButton>
      ) : (
        <div className="flex items-center gap-2 justify-center">
          <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
          <p className="text-sm text-muted-foreground animate-pulse">
            Assista o vídeo para continuar...
          </p>
        </div>
      )}

      {/* Testimonials - compact */}
      <div className="w-full space-y-2">
        {[
          { img: avatarJose, name: "Antônio, 45", loc: "SP", text: "Comecei devagar e no terceiro dia já tinha feito R$87. Hoje pago minhas contas com tranquilidade." },
          { img: avatarLucia, name: "Cláudia, 53", loc: "MG", text: "Complemento com R$150 por dia e finalmente durmo sem preocupação. O suporte ajudou em cada passo." },
        ].map((t, i) => (
          <div key={i} className="funnel-card border-primary/25 bg-primary/5 py-2.5 px-3">
            <div className="flex items-center gap-2.5">
              <img src={t.img} alt={t.name} className="w-9 h-9 rounded-full object-cover border border-primary/30 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <p className="font-bold text-foreground text-xs">{t.name} <span className="font-normal text-muted-foreground">• {t.loc}</span></p>
                  <CheckCircle className="w-3 h-3 text-primary shrink-0" />
                </div>
                <p className="text-xs text-foreground/80 italic leading-snug mt-0.5">"{t.text}"</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Emotional CTA - compact */}
      <div className="w-full funnel-card border-accent/20 bg-accent/5 text-center py-2 px-3">
        <p className="text-xs sm:text-sm text-foreground font-semibold leading-snug">
          Você merece a <span className="text-primary font-bold">tranquilidade</span> de ter as contas pagas.{" "}
          <span className="font-bold">Chega de viver no limite.</span>
        </p>
      </div>
    </StepContainer>
  );
};

export default Step11SocialProof2;
