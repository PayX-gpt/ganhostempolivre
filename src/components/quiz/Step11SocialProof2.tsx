import { useState, useEffect } from "react";
import { StepContainer, StepTitle, CTAButton } from "./QuizUI";
import { CheckCircle, Loader2 } from "lucide-react";
import avatarJose from "@/assets/avatar-jose.jpg";
import avatarLucia from "@/assets/avatar-lucia.jpg";
import avatarRafael from "@/assets/avatar-rafael.jpg";
import avatarCamila from "@/assets/avatar-camila.jpg";
import { isYoungProfile } from "@/lib/agePersonalization";
import { useLanguage, type Language } from "@/lib/i18n";

interface Step11Props {
  onNext: () => void;
  userAge?: string;
}

const texts = {
  pt: {
    title1: "Ótima notícia: seu perfil é ",
    titleHL: "compatível!",
    subtitleYoung: "Pessoas com o mesmo perfil que o seu já estão construindo resultados reais com nosso método.",
    subtitleMature: "Pessoas com o mesmo perfil que o seu já estão tendo resultados reais.",
    headlineYoung: <>Prepare-se! Em apenas <span className="text-accent">30 SEGUNDOS</span>, vou te mostrar como gerar de <span className="text-gradient-green">R$200 a R$1.000</span> de renda extra, dedicando apenas <span className="text-accent">10 MINUTOS DO SEU DIA</span>!</>,
    headlineMature: <>Nos próximos <span className="text-accent">30 SEGUNDOS</span> vou te explicar como ganhar com apenas <span className="text-accent">10 MIN DO SEU TEMPO LIVRE</span> de <span className="text-gradient-green">R$200 a R$1.000</span> reais!</>,
    cta: "PEGAR MEU ACESSO →",
    watchToUnlock: "Assista o vídeo para continuar...",
    youngTestimonials: [
      { name: "Rafael, 29", loc: "SP", text: "Comecei dedicando 15 minutos por dia. No terceiro dia já tinha feito R$92. Hoje é parte da minha renda mensal." },
      { name: "Camila, 32", loc: "RJ", text: "Complemento com R$140 por dia e finalmente consigo investir no meu futuro. O suporte é excelente." },
    ],
    matureTestimonials: [
      { name: "Antônio, 45", loc: "SP", text: "Comecei devagar e no terceiro dia já tinha feito R$87. Hoje pago minhas contas com tranquilidade." },
      { name: "Cláudia, 53", loc: "MG", text: "Complemento com R$150 por dia e finalmente durmo sem preocupação. O suporte ajudou em cada passo." },
    ],
    emotionalYoung: <>Você merece ter <span className="text-primary font-bold">autonomia financeira</span>. <span className="font-bold">Comece agora a construir algo que é seu.</span></>,
    emotionalMature: <>Você merece a <span className="text-primary font-bold">tranquilidade</span> de ter as contas pagas. <span className="font-bold">Chega de viver no limite.</span></>,
  },
  en: {
    title1: "Great news: your profile is ",
    titleHL: "compatible!",
    subtitleYoung: "People with the same profile as yours are already building real results with our method.",
    subtitleMature: "People with the same profile as yours are already seeing real results.",
    headlineYoung: <>Get ready! In just <span className="text-accent">30 SECONDS</span>, I'll show you how to generate <span className="text-gradient-green">R$200 to R$1,000</span> in extra income, dedicating only <span className="text-accent">10 MINUTES OF YOUR DAY</span>!</>,
    headlineMature: <>In the next <span className="text-accent">30 SECONDS</span> I'll explain how to earn with just <span className="text-accent">10 MIN OF YOUR FREE TIME</span> from <span className="text-gradient-green">R$200 to R$1,000</span>!</>,
    cta: "GET MY ACCESS →",
    watchToUnlock: "Watch the video to continue...",
    youngTestimonials: [
      { name: "Rafael, 29", loc: "SP", text: "I started dedicating 15 minutes a day. By the third day I had already made R$92. Now it's part of my monthly income." },
      { name: "Camila, 32", loc: "RJ", text: "I supplement with R$140 per day and can finally invest in my future. The support is excellent." },
    ],
    matureTestimonials: [
      { name: "Antônio, 45", loc: "SP", text: "I started slowly and by the third day I had already made R$87. Today I pay my bills with peace of mind." },
      { name: "Cláudia, 53", loc: "MG", text: "I supplement with R$150 per day and finally sleep without worry. Support helped at every step." },
    ],
    emotionalYoung: <>You deserve <span className="text-primary font-bold">financial independence</span>. <span className="font-bold">Start building something of your own now.</span></>,
    emotionalMature: <>You deserve the <span className="text-primary font-bold">peace of mind</span> of having your bills covered. <span className="font-bold">No more living on the edge.</span></>,
  },
  es: {
    title1: "Gran noticia: tu perfil es ",
    titleHL: "¡compatible!",
    subtitleYoung: "Personas con el mismo perfil que el tuyo ya están construyendo resultados reales con nuestro método.",
    subtitleMature: "Personas con el mismo perfil que el tuyo ya están teniendo resultados reales.",
    headlineYoung: <>¡Preparate! En solo <span className="text-accent">30 SEGUNDOS</span>, te voy a mostrar cómo generar de <span className="text-gradient-green">R$200 a R$1.000</span> de ingreso extra, dedicando solo <span className="text-accent">10 MINUTOS DE TU DÍA</span>!</>,
    headlineMature: <>En los próximos <span className="text-accent">30 SEGUNDOS</span> te voy a explicar cómo ganar con solo <span className="text-accent">10 MIN DE TU TIEMPO LIBRE</span> de <span className="text-gradient-green">R$200 a R$1.000</span>!</>,
    cta: "OBTENER MI ACCESO →",
    watchToUnlock: "Mirá el video para continuar...",
    youngTestimonials: [
      { name: "Rafael, 29", loc: "SP", text: "Empecé dedicando 15 minutos por día. Al tercer día ya había ganado R$92. Hoy es parte de mi ingreso mensual." },
      { name: "Camila, 32", loc: "RJ", text: "Complemento con R$140 por día y finalmente puedo invertir en mi futuro. El soporte es excelente." },
    ],
    matureTestimonials: [
      { name: "Antônio, 45", loc: "SP", text: "Empecé despacio y al tercer día ya había ganado R$87. Hoy pago mis cuentas con tranquilidad." },
      { name: "Cláudia, 53", loc: "MG", text: "Complemento con R$150 por día y finalmente duermo sin preocupación. El soporte me ayudó en cada paso." },
    ],
    emotionalYoung: <>Merecés tener <span className="text-primary font-bold">autonomía financiera</span>. <span className="font-bold">Empezá ahora a construir algo que sea tuyo.</span></>,
    emotionalMature: <>Merecés la <span className="text-primary font-bold">tranquilidad</span> de tener las cuentas al día. <span className="font-bold">Basta de vivir al límite.</span></>,
  },
};

const Step11SocialProof2 = ({ onNext, userAge }: Step11Props) => {
  const { lang } = useLanguage();
  const t = texts[lang];
  const [showCTA, setShowCTA] = useState(false);
  const young = isYoungProfile(userAge);

  useEffect(() => { const timer = setTimeout(() => setShowCTA(true), 30_000); return () => clearTimeout(timer); }, []);

  useEffect(() => {
    const s = document.createElement("script");
    s.src = "https://scripts.converteai.net/lib/js/smartplayer-wc/v4/sdk.js";
    s.async = true;
    document.head.appendChild(s);
    const iframe = document.getElementById("ifr_690fc5f5da9cb48e0b5df28c") as HTMLIFrameElement;
    if (iframe) {
      iframe.src = "https://scripts.converteai.net/09ec79a4-c31f-44ce-ba7d-89003424c826/players/690fc5f5da9cb48e0b5df28c/v4/embed.html" + (window.location.search || "?") + "&vl=" + encodeURIComponent(window.location.href);
    }
    return () => { document.head.removeChild(s); };
  }, []);

  const testimonials = young ? t.youngTestimonials : t.matureTestimonials;
  const avatarsYoung = [avatarRafael, avatarCamila];
  const avatarsMature = [avatarJose, avatarLucia];
  const avatars = young ? avatarsYoung : avatarsMature;

  return (
    <StepContainer>
      <StepTitle>{t.title1}<span className="text-gradient-green">{t.titleHL}</span></StepTitle>
      <p className="text-xs sm:text-sm text-muted-foreground text-center -mt-1">{young ? t.subtitleYoung : t.subtitleMature}</p>

      <div className="w-full funnel-card border-accent/30 bg-accent/5 text-center py-2.5 px-3">
        <p className="text-xs sm:text-sm text-foreground font-bold leading-snug">{young ? t.headlineYoung : t.headlineMature}</p>
      </div>

      <div className="w-full rounded-2xl overflow-hidden border border-border shadow-xl">
        <div id="ifr_690fc5f5da9cb48e0b5df28c_wrapper" style={{ margin: "0 auto", width: "100%", maxWidth: "400px" }}>
          <div style={{ position: "relative", paddingTop: "177.78%" }} id="ifr_690fc5f5da9cb48e0b5df28c_aspect">
            <iframe frameBorder="0" allowFullScreen src="about:blank" id="ifr_690fc5f5da9cb48e0b5df28c" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }} referrerPolicy="origin" />
          </div>
        </div>
      </div>

      {showCTA ? (
        <CTAButton onClick={onNext} className="animate-fade-in">{t.cta}</CTAButton>
      ) : (
        <div className="flex items-center gap-2 justify-center">
          <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
          <p className="text-sm text-muted-foreground animate-pulse">{t.watchToUnlock}</p>
        </div>
      )}

      <div className="w-full space-y-2">
        {testimonials.map((tm, i) => (
          <div key={i} className="funnel-card border-primary/25 bg-primary/5 py-2.5 px-3">
            <div className="flex items-center gap-2.5">
              <img src={avatars[i]} alt={tm.name} className="w-9 h-9 rounded-full object-cover border border-primary/30 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <p className="font-bold text-foreground text-xs">{tm.name} <span className="font-normal text-muted-foreground">• {tm.loc}</span></p>
                  <CheckCircle className="w-3 h-3 text-primary shrink-0" />
                </div>
                <p className="text-xs text-foreground/80 italic leading-snug mt-0.5">"{tm.text}"</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="w-full funnel-card border-accent/20 bg-accent/5 text-center py-2 px-3">
        <p className="text-xs sm:text-sm text-foreground font-semibold leading-snug">
          {young ? t.emotionalYoung : t.emotionalMature}
        </p>
      </div>
    </StepContainer>
  );
};

export default Step11SocialProof2;
