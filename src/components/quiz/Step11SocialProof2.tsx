import { useEffect, useRef, useState } from "react";
import { StepContainer, StepTitle } from "./QuizUI";
import { CheckCircle } from "lucide-react";
import avatarJose from "@/assets/avatar-jose.jpg";
import avatarLucia from "@/assets/avatar-lucia.jpg";
import avatarRafael from "@/assets/avatar-rafael.jpg";
import avatarCamila from "@/assets/avatar-camila.jpg";
import { isYoungProfile } from "@/lib/agePersonalization";
import { useLanguage, type Language } from "@/lib/i18n";
import { saveFunnelEventReliable } from "@/lib/metricsClient";
import { sendCAPIInitiateCheckout } from "@/lib/facebookCAPI";
import { trackTikTokInitiateCheckout } from "@/lib/tiktokPixel";
import { trackMetaInitiateCheckout } from "@/lib/metaPixel";
import { buildTrackingQueryString } from "@/lib/trackingDataLayer";

interface Step11Props {
  onNext: () => void;
  userAge?: string;
  pandaVideoId?: string;
  pandaButtonId?: string;
  videoAspectRatio?: "9:16" | "16:9";
}

const texts = {
  pt: {
    title1: "Ótima notícia: seu perfil é ",
    titleHL: "compatível!",
    subtitleYoung: "Pessoas com o mesmo perfil que o seu já estão construindo resultados reais com nosso método.",
    subtitleMature: "Pessoas com o mesmo perfil que o seu já estão tendo resultados reais.",
    headlineYoung: <>Prepare-se! Em apenas <span className="text-accent">30 SEGUNDOS</span>, vou te mostrar como gerar de <span className="text-gradient-green">R$200 a R$1.000</span> de renda extra, dedicando apenas <span className="text-accent">10 MINUTOS DO SEU DIA</span>!</>,
    headlineMature: <>Nos próximos <span className="text-accent">30 SEGUNDOS</span> vou te explicar como ganhar com apenas <span className="text-accent">10 MIN DO SEU TEMPO LIVRE</span> de <span className="text-gradient-green">R$200 a R$1.000</span> reais!</>,
    cta: "QUERO MEU ACESSO →",
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
    headlineYoung: <>Get ready! In just <span className="text-accent">30 SECONDS</span>, I'll show you how to generate <span className="text-gradient-green">$200 to $1,000</span> in extra income, dedicating only <span className="text-accent">10 MINUTES OF YOUR DAY</span>!</>,
    headlineMature: <>In the next <span className="text-accent">30 SECONDS</span> I'll explain how to earn with just <span className="text-accent">10 MIN OF YOUR FREE TIME</span> from <span className="text-gradient-green">$200 to $1,000</span>!</>,
    cta: "GET MY ACCESS →",
    watchToUnlock: "Watch the video to continue...",
    youngTestimonials: [
      { name: "Rafael, 29", loc: "SP", text: "I started dedicating 15 minutes a day. By the third day I had already made $92. Now it's part of my monthly income." },
      { name: "Camila, 32", loc: "RJ", text: "I supplement with $140 per day and can finally invest in my future. The support is excellent." },
    ],
    matureTestimonials: [
      { name: "Antônio, 45", loc: "SP", text: "I started slowly and by the third day I had already made $87. Today I pay my bills with peace of mind." },
      { name: "Cláudia, 53", loc: "MG", text: "I supplement with $150 per day and finally sleep without worry. Support helped at every step." },
    ],
    emotionalYoung: <>You deserve <span className="text-primary font-bold">financial independence</span>. <span className="font-bold">Start building something of your own now.</span></>,
    emotionalMature: <>You deserve the <span className="text-primary font-bold">peace of mind</span> of having your bills covered. <span className="font-bold">No more living on the edge.</span></>,
  },
  es: {
    title1: "Gran noticia: tu perfil es ",
    titleHL: "¡compatible!",
    subtitleYoung: "Personas con el mismo perfil que el tuyo ya están construyendo resultados reales con nuestro método.",
    subtitleMature: "Personas con el mismo perfil que el tuyo ya están teniendo resultados reales.",
    headlineYoung: <>¡Preparate! En solo <span className="text-accent">30 SEGUNDOS</span>, te voy a mostrar cómo generar de <span className="text-gradient-green">$200 a $1.000</span> de ingreso extra, dedicando solo <span className="text-accent">10 MINUTOS DE TU DÍA</span>!</>,
    headlineMature: <>En los próximos <span className="text-accent">30 SEGUNDOS</span> te voy a explicar cómo ganar con solo <span className="text-accent">10 MIN DE TU TIEMPO LIBRE</span> de <span className="text-gradient-green">$200 a $1.000</span>!</>,
    cta: "OBTENER MI ACCESO →",
    watchToUnlock: "Mirá el video para continuar...",
    youngTestimonials: [
      { name: "Rafael, 29", loc: "SP", text: "Empecé dedicando 15 minutos por día. Al tercer día ya había ganado $92. Hoy es parte de mi ingreso mensual." },
      { name: "Camila, 32", loc: "RJ", text: "Complemento con $140 por día y finalmente puedo invertir en mi futuro. El soporte es excelente." },
    ],
    matureTestimonials: [
      { name: "Antônio, 45", loc: "SP", text: "Empecé despacio y al tercer día ya había ganado $87. Hoy pago mis cuentas con tranquilidad." },
      { name: "Cláudia, 53", loc: "MG", text: "Complemento con $150 por día y finalmente duermo sin preocupación. El soporte me ayudó en cada paso." },
    ],
    emotionalYoung: <>Merecés tener <span className="text-primary font-bold">autonomía financiera</span>. <span className="font-bold">Empezá ahora a construir algo que sea tuyo.</span></>,
    emotionalMature: <>Merecés la <span className="text-primary font-bold">tranquilidad</span> de tener las cuentas al día. <span className="font-bold">Basta de vivir al límite.</span></>,
  },
};

const Step11SocialProof2 = ({ onNext, userAge, pandaVideoId, pandaButtonId: customButtonId, videoAspectRatio = "9:16" }: Step11Props) => {
  const { lang } = useLanguage();
  const t = texts[lang];
  const young = isYoungProfile(userAge);
  const pandaBtnRef = useRef<HTMLDivElement>(null);
  const [showCustomCta, setShowCustomCta] = useState(false);
  const ctaShownLoggedRef = useRef(false);

  // Logs which path revealed the CTA + saves to /live dashboard
  const revealCustomCta = (source: "panda_api" | "panda_postmessage" | "page_timer") => {
    setShowCustomCta((prev) => {
      if (prev) return prev;
      if (!ctaShownLoggedRef.current) {
        ctaShownLoggedRef.current = true;
        console.log(`[Step17] 🟡 Custom CTA shown via ${source} at ${(performance.now() / 1000).toFixed(1)}s page time`);
        try {
          saveFunnelEventReliable("custom_cta_shown", {
            context: "step17_custom_cta_825",
            source,
            page_time_s: Math.round(performance.now() / 1000),
          });
        } catch {}
      }
      return true;
    });
  };

  const icFiredRef = useRef(false);
  const customCtaFiredRef = useRef(false);

  // Custom CTA copy per language
  const customCtaText =
    lang === "es"
      ? "QUIERO MI CLAVE DE ACCESO AHORA →"
      : lang === "en"
      ? "I WANT MY ACCESS KEY NOW →"
      : "QUERO MINHA CHAVE DE ACESSO AGORA →";

  const handleCustomCtaClick = () => {
    try {
      const url = new URL("https://pay.kirvano.com/a404a378-2a59-4efd-86a8-dc57363c054c");
      const trackingQs = buildTrackingQueryString();
      if (trackingQs) {
        const trackingParams = new URLSearchParams(trackingQs.slice(1));
        trackingParams.forEach((value, key) => {
          if (!url.searchParams.has(key)) url.searchParams.set(key, value);
        });
      }
      if (!customCtaFiredRef.current) {
        customCtaFiredRef.current = true;
        saveFunnelEventReliable("checkout_click", {
          context: "custom_cta_step17_825",
          product: "chave_token_chatgpt",
          amount: offerAmount,
          dest_url: url.toString(),
        });
        sendCAPIInitiateCheckout({ amount: offerAmount });
        trackTikTokInitiateCheckout({ amount: offerAmount });
        trackMetaInitiateCheckout({ amount: offerAmount });
        icFiredRef.current = true;
      }
      window.open(url.toString(), "_blank", "noopener");
    } catch (err) {
      console.warn("[Step17] Custom CTA error:", err);
    }
  };

  const getCurrentOfferAmount = () => {
    try {
      const rawAnswers = sessionStorage.getItem("quiz_answers");
      const answers = rawAnswers ? JSON.parse(rawAnswers) : {};
      const balance = answers?.accountBalance as string | undefined;

      if (balance === "menos100") return 37;
      if (["500-2000", "2000-10000", "10000+"].includes(balance || "")) return 66.83;
      return 47;
    } catch {
      return 47;
    }
  };

  const offerAmount = getCurrentOfferAmount();

  const videoId = pandaVideoId || "daa037ca-64f0-4637-97dc-c0278d1f6df6";
  const pandaButtonId = customButtonId || "3e462562-4d30-4dd4-b759-de8c4f18b84e";
  const aspectPadding = videoAspectRatio === "16:9" ? "56.25%" : "177.77777777777777%";

  // Inject Panda API script for external button + PANDA_CONTEXT listener
  useEffect(() => {
    if (!document.querySelector('script[src^="https://player.pandavideo.com.br/api.v2.js"]')) {
      const s = document.createElement('script');
      s.src = 'https://player.pandavideo.com.br/api.v2.js';
      s.async = true;
      document.head.appendChild(s);
    }
    (window as any).pandascripttag = (window as any).pandascripttag || [];
    (window as any).pandascripttag.push(function () {
      const p = new (window as any).PandaPlayer(`panda-${videoId}`, {
        onReady() {
          try { p.loadButtonInTime({ fetchApi: true }); } catch {}
          // Reveal custom CTA at 8:25 (505s)
          try {
            p.onEvent(function (e: any) {
              if (e && (e.message === "panda_timeupdate" || e.message === "timeupdate")) {
                const t = Number(e.currentTime ?? e.time ?? 0);
                if (t >= 505) revealCustomCta("panda_api");
              }
            });
          } catch {}
        },
      });
    });

    // Panda CONTEXT: forward page URL (with UTMs) to iframe
    const handlePandaReady = (e: MessageEvent) => {
      if (e.data && e.data.type === 'PANDA_READY' && e.source) {
        (e.source as Window).postMessage({ type: 'PANDA_CONTEXT', url: location.href }, '*');
      }
    };
    window.addEventListener('message', handlePandaReady);

    // 🛡️ Safety net: reveal CTA after 8:25 absolute page time
    // (in case Panda API/postMessage tracking ever fails)
    const safetyTimer = window.setTimeout(() => {
      revealCustomCta("page_timer");
    }, 505_000);

    return () => {
      window.removeEventListener('message', handlePandaReady);
      window.clearTimeout(safetyTimer);
    };
  }, [videoId]);

  // Listen for Panda Video CTA click — only fires on REAL button click
  // Panda sends postMessage with type "buttonClick" or "smartplayer_cta_click"
  // when user clicks the in-video CTA button. Generic player messages are ignored.
  useEffect(() => {
    const handlePandaMessage = (event: MessageEvent) => {
      const d = event.data;
      if (!d || typeof d !== "object") return;

      // Fallback: reveal custom CTA based on Panda timeupdate postMessage
      const tuMsg = d.message === "panda_timeupdate" || d.message === "timeupdate" || d.type === "timeupdate";
      if (tuMsg) {
        const t = Number(d.currentTime ?? d.time ?? 0);
        if (t >= 505) revealCustomCta("panda_postmessage");
      }

      // Panda CTA click events come in several shapes:
      // { type: "buttonClick", url } | { type: "panda:ctaClick", url }
      // { message_type: "smartplayer_cta_click", redirectUrl }
      // { action: "redirect", url }
      const isRealCtaClick =
        d.type === "buttonClick" ||
        d.type === "panda:ctaClick" ||
        d.type === "panda:buttonClick" ||
        d.message_type === "smartplayer_cta_click" ||
        (d.action === "redirect" && typeof d.url === "string");

      if (!isRealCtaClick) return;

      // Extract the destination URL Panda would navigate to.
      const destUrl: string | undefined =
        d.url || d.redirectUrl || d.href || d.target_url || d.targetUrl;

      // ✅ Append OUR UTMs to whatever URL Panda is opening. The Panda dashboard
      // button is configured with a bare Kirvano URL — without this enrichment,
      // Kirvano + Utmify receive the sale with NO campaign attribution.
      if (destUrl && /^https?:\/\//i.test(destUrl)) {
        try {
          const url = new URL(destUrl);
          const trackingQs = buildTrackingQueryString();
          if (trackingQs) {
            const trackingParams = new URLSearchParams(trackingQs.slice(1));
            trackingParams.forEach((value, key) => {
              if (!url.searchParams.has(key)) url.searchParams.set(key, value);
            });
          }
          window.open(url.toString(), "_blank", "noopener");
          console.log("[Step17] ✅ Opened Kirvano with UTMs:", url.toString());
        } catch (err) {
          console.warn("[Step17] Failed to enrich Panda CTA URL:", err);
        }
      } else {
        console.warn("[Step17] Panda CTA click had no destination URL — Kirvano will receive no UTMs. Payload:", d);
      }

      if (icFiredRef.current) return;
      icFiredRef.current = true;
      console.log("[Step17] ✅ Panda CTA click detected:", d.type || d.message_type || d.action);
      saveFunnelEventReliable("checkout_click", { context: "panda_cta_step17", product: "chave_token_chatgpt", amount: offerAmount, dest_url: destUrl });
      sendCAPIInitiateCheckout({ amount: offerAmount });
      trackTikTokInitiateCheckout({ amount: offerAmount });
      trackMetaInitiateCheckout({ amount: offerAmount });
    };

    // Only fire IC on page hide if user has been on page for 3+ minutes
    // AND has watched significant video — prevents false positives from tab-closers
    const mountedAt = Date.now();
    const handleVisibilityChange = () => {
      if (document.hidden && !icFiredRef.current) {
        const timeOnPage = Date.now() - mountedAt;
        // Only count as IC if user spent 3+ min on this step (likely engaged with VSL)
        if (timeOnPage < 180_000) return;
        icFiredRef.current = true;
        console.log("[Step17] ✅ IC fired on page hide (3min+ engaged)");
        saveFunnelEventReliable("checkout_click", { context: "panda_cta_step17_pagehide", product: "chave_token_chatgpt", amount: offerAmount });
        sendCAPIInitiateCheckout({ amount: offerAmount });
        trackTikTokInitiateCheckout({ amount: offerAmount });
        trackMetaInitiateCheckout({ amount: offerAmount });
      }
    };

    window.addEventListener("message", handlePandaMessage);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("message", handlePandaMessage);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [videoId, offerAmount]);

  const testimonials = young ? t.youngTestimonials : t.matureTestimonials;
  const avatarsYoung = [avatarRafael, avatarCamila];
  const avatarsMature = [avatarJose, avatarLucia];
  const avatars = young ? avatarsYoung : avatarsMature;

  return (
    <StepContainer>
      <StepTitle>{t.title1}<span className="text-gradient-green">{t.titleHL}</span></StepTitle>
      <p className="text-[11px] sm:text-sm text-muted-foreground text-center -mt-1">{young ? t.subtitleYoung : t.subtitleMature}</p>

      <div className="w-full funnel-card border-accent/30 bg-accent/5 text-center py-2 px-2.5">
        <p className="text-[12px] sm:text-sm text-foreground font-bold leading-snug">{young ? t.headlineYoung : t.headlineMature}</p>
      </div>

      <div className="w-full rounded-2xl border border-border shadow-xl overflow-hidden mb-4">
        <div style={{ position: "relative", paddingTop: aspectPadding }}>
          <iframe
            id={`panda-${videoId}`}
            src={`https://player-vz-350772d9-cdc.tv.pandavideo.com.br/embed/?v=${videoId}`}
            style={{ border: "none", position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
            allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>

      {/* Panda external button container */}
      <div id={pandaButtonId} className="w-full flex justify-center" />

      {/* Custom CTA — appears at 8:25 (505s) of VSL */}
      {showCustomCta && (
        <button
          onClick={handleCustomCtaClick}
          className="w-full py-4 px-6 rounded-xl font-extrabold text-[15px] sm:text-xl text-black uppercase tracking-wide animate-fade-in transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
          style={{
            background: "linear-gradient(135deg, #FFD600 0%, #FFB300 100%)",
            boxShadow: "0 4px 20px rgba(255, 214, 0, 0.4)",
          }}
        >
          {customCtaText}
        </button>
      )}

      <div className="w-full space-y-1.5">
        {testimonials.map((tm, i) => (
          <div key={i} className="funnel-card border-primary/25 bg-primary/5 py-2 px-2.5">
            <div className="flex items-center gap-2">
              <img src={avatars[i]} alt={tm.name} className="w-8 h-8 rounded-full object-cover border border-primary/30 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <p className="font-bold text-foreground text-[11px]">{tm.name} <span className="font-normal text-muted-foreground">• {tm.loc}</span></p>
                  <CheckCircle className="w-3 h-3 text-primary shrink-0" />
                </div>
                <p className="text-[11px] text-foreground/80 italic leading-snug mt-0.5">"{tm.text}"</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="w-full funnel-card border-accent/20 bg-accent/5 text-center py-1.5 px-2.5">
        <p className="text-[11px] sm:text-sm text-foreground font-semibold leading-snug">
          {young ? t.emotionalYoung : t.emotionalMature}
        </p>
      </div>
    </StepContainer>
  );
};

export default Step11SocialProof2;
