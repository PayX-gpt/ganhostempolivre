import { useState, useEffect, useRef } from "react";
import { StepContainer, StepTitle, StepSubtitle, CTAButton } from "./QuizUI";
import { BarChart3, CheckCircle, Loader2 } from "lucide-react";
import avatarRegina from "@/assets/avatar-regina.jpg";
import avatarRafael from "@/assets/avatar-rafael.jpg";
import { isYoungProfile } from "@/lib/agePersonalization";
import { useLanguage, type Language } from "@/lib/i18n";

interface Step3Props {
  onNext: () => void;
  userAge?: string;
  pandaVideoId?: string;
}

const texts = {
  pt: {
    title1: "36.000 brasileiros.",
    title2: " R$50 a R$300 por dia. Veja quem já tá fazendo.",
    subtitleYoung: "Veja o depoimento de quem deu o primeiro passo — e hoje tem uma fonte de renda consistente:",
    subtitleMature: "Veja o depoimento de quem estava na mesma situação que você — e hoje vive com tranquilidade financeira:",
    cta: "CONTINUAR MEU TESTE →",
    watchToUnlock: "Assista o depoimento para continuar...",
    youngName: "Lucas Oliveira, 27 anos",
    youngLoc: "São Paulo, SP",
    matureName: "Dona Márcia, 52 anos",
    matureLoc: "Goiânia, GO",
    verified: "Aluno verificado",
    youngTestimonial: "\"Eu trabalhava o dia inteiro e no fim do mês nunca sobrava nada. Comecei usando no tempo livre, sem largar nada. Hoje complemento minha renda com R$160 por dia e finalmente consigo planejar meu futuro com tranquilidade.\"",
    matureTestimonial: "\"Eu tinha vergonha de pedir dinheiro emprestado todo mês. Minha aposentadoria não cobria nem as contas básicas. Comecei com medo, mas o passo a passo me deu segurança. Hoje tiro R$180 por dia e não dependo mais de ninguém.\"",
    statYoung: <>< strong>Dado real:</strong> Nossos alunos entre 18 e 35 anos são os que mais rápido atingem os primeiros resultados — em média, na primeira semana.</>,
    statMature: <><strong>Dado real:</strong> 73% dos nossos alunos acima de 40 anos conseguiram seus primeiros resultados na primeira semana.</>,
  },
  en: {
    title1: "36,000 people.",
    title2: " $50 to $300 per day. See who's already doing it.",
    subtitleYoung: "Watch the story of someone who took the first step — and now has a consistent income source:",
    subtitleMature: "Watch the story of someone who was in the same situation as you — and now lives with financial peace of mind:",
    cta: "CONTINUE MY TEST →",
    watchToUnlock: "Watch the testimonial to continue...",
    youngName: "Lucas Oliveira, 27",
    youngLoc: "São Paulo, Brazil",
    matureName: "Mrs. Márcia, 52",
    matureLoc: "Goiânia, Brazil",
    verified: "Verified student",
    youngTestimonial: "\"I used to work all day and at the end of the month there was never anything left. I started using it in my free time without quitting anything. Today I supplement my income with $160 per day and can finally plan my future with peace of mind.\"",
    matureTestimonial: "\"I was embarrassed to borrow money every month. My pension didn't even cover basic bills. I started out scared, but the step-by-step process gave me confidence. Today I earn $180 per day and don't depend on anyone anymore.\"",
    statYoung: <><strong>Real data:</strong> Our students aged 18 to 35 are the fastest to achieve their first results — on average, within the first week.</>,
    statMature: <><strong>Real data:</strong> 73% of our students over 40 achieved their first results within the first week.</>,
  },
  es: {
    title1: "36.000 personas.",
    title2: " $50 a $300 por día. Mirá quién ya lo está haciendo.",
    subtitleYoung: "Mirá el testimonio de alguien que dio el primer paso — y hoy tiene una fuente de ingreso estable:",
    subtitleMature: "Mirá el testimonio de alguien que estaba en tu misma situación — y hoy vive con tranquilidad financiera:",
    cta: "CONTINUAR MI TEST →",
    watchToUnlock: "Mirá el testimonio para continuar...",
    youngName: "Lucas Oliveira, 27 años",
    youngLoc: "São Paulo, Brasil",
    matureName: "Doña Márcia, 52 años",
    matureLoc: "Goiânia, Brasil",
    verified: "Alumno verificado",
    youngTestimonial: "\"Trabajaba todo el día y a fin de mes nunca me sobraba nada. Empecé a usarlo en mi tiempo libre, sin dejar nada. Hoy complemento mis ingresos con $160 por día y finalmente puedo planificar mi futuro con tranquilidad.\"",
    matureTestimonial: "\"Me daba vergüenza pedir plata prestada todos los meses. Mi jubilación no cubría ni las cuentas básicas. Empecé con miedo, pero el paso a paso me dio seguridad. Hoy saco $180 por día y no dependo de nadie más.\"",
    statYoung: <><strong>Dato real:</strong> Nuestros alumnos de 18 a 35 años son los que más rápido alcanzan los primeros resultados — en promedio, en la primera semana.</>,
    statMature: <><strong>Dato real:</strong> El 73% de nuestros alumnos mayores de 40 años lograron sus primeros resultados en la primera semana.</>,
  },
};

const Step3SocialProof = ({ onNext, userAge, pandaVideoId }: Step3Props) => {
  const { lang } = useLanguage();
  const t = texts[lang];
  const [showCTA, setShowCTA] = useState(false);
  const videoRef = useRef<HTMLDivElement>(null);
  const young = isYoungProfile(userAge);

  useEffect(() => { const timer = setTimeout(() => setShowCTA(true), 5000); return () => clearTimeout(timer); }, []);
  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, []);

  // Panda Video - no script needed

  return (
    <StepContainer>
      <StepTitle>
        <span className="text-gradient-green">{t.title1}</span>{t.title2}
      </StepTitle>
      <StepSubtitle>{young ? t.subtitleYoung : t.subtitleMature}</StepSubtitle>

      <div className="w-full rounded-2xl overflow-hidden border border-border scroll-mt-24" ref={videoRef}>
        <div style={{ position: "relative", paddingTop: "56.25%" }}>
          <iframe
            id={`panda-${pandaVideoId || "ec4b550c-ac32-42c4-b4ea-40a7a2c28d35"}`}
            src={`https://player-vz-350772d9-cdc.tv.pandavideo.com.br/embed/?v=${pandaVideoId || "ec4b550c-ac32-42c4-b4ea-40a7a2c28d35"}`}
            style={{ border: "none", position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
            allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture"
            allowFullScreen
          />
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

      <div className="w-full funnel-card border-primary/25 bg-primary/5 py-2.5 px-3">
        <div className="flex items-center gap-2.5 mb-2">
          <img src={young ? avatarRafael : avatarRegina} alt={young ? t.youngName : t.matureName} className="w-10 h-10 rounded-full object-cover border-2 border-primary/30 shrink-0" />
          <div className="min-w-0">
            <p className="font-bold text-foreground text-[13px] sm:text-base">{young ? t.youngName : t.matureName}</p>
            <div className="flex items-center gap-1">
              <span className="text-[11px] sm:text-sm text-muted-foreground">{young ? t.youngLoc : t.matureLoc} • {t.verified}</span>
              <CheckCircle className="w-3 h-3 text-primary" />
            </div>
          </div>
        </div>
        <p className="text-[13px] sm:text-base text-foreground/90 italic leading-relaxed">
          {young ? t.youngTestimonial : t.matureTestimonial}
        </p>
      </div>

      <div className="w-full funnel-card border-accent/20 bg-accent/5 text-center py-2 px-3">
        <div className="flex items-center justify-center gap-1.5">
          <BarChart3 className="w-3.5 h-3.5 text-accent shrink-0" />
          <p className="text-[12px] sm:text-sm text-foreground/80 leading-relaxed">
            {young ? t.statYoung : t.statMature}
          </p>
        </div>
      </div>
    </StepContainer>
  );
};

export default Step3SocialProof;
