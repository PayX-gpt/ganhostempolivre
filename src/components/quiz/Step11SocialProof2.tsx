import { useCallback, useEffect, useRef, useState } from "react";
import { StepContainer, StepTitle } from "./QuizUI";
import { CheckCircle, Users, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import avatarJose from "@/assets/avatar-jose.jpg";
import avatarLucia from "@/assets/avatar-lucia.jpg";
import avatarRafael from "@/assets/avatar-rafael.jpg";
import avatarCamila from "@/assets/avatar-camila.jpg";
import { isYoungProfile } from "@/lib/agePersonalization";
import { useLanguage, type Language } from "@/lib/i18n";
import { saveFunnelEventReliable } from "@/lib/metricsClient";
import { sendCAPIInitiateCheckout, sendCAPIEvent } from "@/lib/facebookCAPI";
import { trackTikTokInitiateCheckout } from "@/lib/tiktokPixel";
import { trackMetaInitiateCheckout, trackMetaViewContent, trackMetaAddToCart } from "@/lib/metaPixel";
import { buildTrackingQueryString } from "@/lib/trackingDataLayer";
import { usePandaPreload } from "@/lib/usePandaPreload";

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

const CUSTOM_CTA_UNLOCK_SECONDS = 8 * 60 + 20;
const DEFAULT_PANDA_BUTTON_ID = "13bd9202-db00-4418-b590-7e294239fe77";

interface PandaPlayerInstance {
  currentTime?: number | string | (() => number | string);
  getCurrentTime?: () => number | string;
  loadButtonInTime?: (options: { fetchApi?: boolean }) => void;
  onEvent?: (handler: (event: unknown) => void) => void;
}

type PandaWindow = Window & typeof globalThis & {
  pandascripttag?: Array<() => void> & { push: (...callbacks: Array<() => void>) => number };
  PandaPlayer?: new (elementId: string, options: { onReady?: () => void }) => PandaPlayerInstance;
};

const parsePandaPayload = (payload: unknown): unknown => {
  if (typeof payload !== "string") return payload;
  try { return JSON.parse(payload) as unknown; } catch { return payload; }
};

const asPandaRecord = (value: unknown): Record<string, unknown> | null => (
  typeof value === "object" && value !== null ? value as Record<string, unknown> : null
);

const normalizePandaSeconds = (value: unknown): number | null => {
  if (typeof value === "string" && value.includes(":")) {
    const parts = value.split(":").map((part) => Number(part));
    if (parts.every(Number.isFinite)) {
      return parts.reduce((total, part) => total * 60 + part, 0);
    }
  }

  const numericValue = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numericValue) || numericValue < 0) return null;
  return numericValue > 10_000 ? numericValue / 1000 : numericValue;
};

const readPandaVideoSeconds = (payload: unknown): number | null => {
  const data = parsePandaPayload(payload);
  const record = asPandaRecord(data);
  if (!record) return normalizePandaSeconds(data);
  const dataRecord = asPandaRecord(record.data);
  const eventRecord = asPandaRecord(record.event);

  const candidates = [
    record.currentTime,
    record.current_time,
    record.time,
    record.seconds,
    record.playedSeconds,
    record.video_time,
    record.videoTime,
    dataRecord?.currentTime,
    dataRecord?.current_time,
    dataRecord?.time,
    dataRecord?.seconds,
    eventRecord?.currentTime,
    eventRecord?.current_time,
  ];

  for (const candidate of candidates) {
    const seconds = normalizePandaSeconds(candidate);
    if (seconds !== null) return seconds;
  }

  return null;
};

const getPandaEventName = (payload: unknown): string => {
  const record = asPandaRecord(parsePandaPayload(payload));
  const raw = record?.message || record?.type || record?.event || record?.eventName || record?.name || record?.message_type || record?.action || "";
  return typeof raw === "string" ? raw : "";
};

const isPandaButtonShownEvent = (payload: unknown): boolean => {
  const msg = getPandaEventName(payload).toLowerCase();
  return ["panda_buttonshow", "panda_buttonshown", "panda_loadbutton", "panda_showbutton", "buttonshow", "buttonshown"].includes(msg);
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

const Step11SocialProof2 = ({ onNext, userAge, pandaVideoId, pandaButtonId: customButtonId, videoAspectRatio = "9:16" }: Step11Props) => {
  const { lang } = useLanguage();
  const t = texts[lang];
  const young = isYoungProfile(userAge);
  const pandaBtnRef = useRef<HTMLDivElement>(null);
  const customCtaRef = useRef<HTMLButtonElement>(null);
  const pandaPlayerRef = useRef<PandaPlayerInstance | null>(null);
  const [showCustomCta, setShowCustomCta] = useState(false);
  const ctaShownLoggedRef = useRef(false);
  const maxVideoSecondsRef = useRef(0);
  const offerAmount = getCurrentOfferAmount();

  // Logs which path revealed the CTA + saves to /live dashboard
  const revealCustomCta = useCallback((source: "panda_button_shown" | "panda_api" | "panda_postmessage" | "panda_timeupdate" | "panda_poll" | "page_timer", videoSeconds?: number) => {
    setShowCustomCta((prev) => {
      if (prev) return prev;
      if (!ctaShownLoggedRef.current) {
        ctaShownLoggedRef.current = true;
        console.log(`[Step17] 🟡 Custom CTA shown via ${source} at ${Math.round(videoSeconds ?? maxVideoSecondsRef.current)}s video time / ${(performance.now() / 1000).toFixed(1)}s page time`);
        try {
          saveFunnelEventReliable("custom_cta_shown", {
            context: "step17_custom_cta_845_video_time",
            source,
            video_time_s: Math.round(videoSeconds ?? maxVideoSecondsRef.current),
            unlock_video_time_s: CUSTOM_CTA_UNLOCK_SECONDS,
            page_time_s: Math.round(performance.now() / 1000),
          });
        } catch (error) {
          console.warn("[Step17] Failed to save CTA shown event:", error);
        }
        trackMetaAddToCart({ amount: offerAmount });
        sendCAPIEvent("AddToCart", { amount: offerAmount });
      }
      return true;
    });
  }, [offerAmount]);

  const icFiredRef = useRef(false);
  const customCtaFiredRef = useRef(false);

  const updateVideoProgress = useCallback((seconds: number | null, source: "panda_api" | "panda_postmessage" | "panda_timeupdate" | "panda_poll") => {
    if (seconds === null) return;
    maxVideoSecondsRef.current = Math.max(maxVideoSecondsRef.current, seconds);
    if (seconds >= CUSTOM_CTA_UNLOCK_SECONDS) {
      revealCustomCta(source, seconds);
    }
  }, [revealCustomCta]);

  // Vacancy counter (urgency) — decreases slowly to feel real
  const [vacancies, setVacancies] = useState(() => 17 + Math.floor(Math.random() * 4));
  useEffect(() => {
    const interval = window.setInterval(() => {
      setVacancies((v) => (v > 5 ? v - 1 : v));
    }, 45_000 + Math.random() * 30_000);
    return () => window.clearInterval(interval);
  }, []);

  // Fallback: garante que o CTA apareça após 8:20 mesmo se a API do Panda falhar
  useEffect(() => {
    const fallback = window.setTimeout(() => {
      revealCustomCta("page_timer", CUSTOM_CTA_UNLOCK_SECONDS);
    }, CUSTOM_CTA_UNLOCK_SECONDS * 1000);
    return () => window.clearTimeout(fallback);
  }, [revealCustomCta]);

  // Social proof toasts — Brazilian/local names buying during VSL
  useEffect(() => {
    const buyers = lang === "es"
      ? [
          { n: "María, 52", l: "Buenos Aires" }, { n: "Roberto, 47", l: "Córdoba" },
          { n: "Lucía, 58", l: "Rosario" }, { n: "Carlos, 63", l: "Mendoza" },
          { n: "Patricia, 49", l: "La Plata" }, { n: "Jorge, 55", l: "Salta" },
        ]
      : lang === "en"
      ? [
          { n: "Mary, 52", l: "TX" }, { n: "Robert, 47", l: "FL" },
          { n: "Linda, 58", l: "CA" }, { n: "James, 63", l: "NY" },
          { n: "Patricia, 49", l: "OH" }, { n: "George, 55", l: "GA" },
        ]
      : [
          { n: "Maria de Fátima, 52", l: "MG" }, { n: "Antônio Carlos, 47", l: "SP" },
          { n: "Cláudia, 58", l: "RJ" }, { n: "José Roberto, 63", l: "BA" },
          { n: "Rosângela, 49", l: "PR" }, { n: "Sebastião, 55", l: "GO" },
          { n: "Marlene, 61", l: "RS" }, { n: "Paulo Henrique, 44", l: "PE" },
        ];
    const verb = lang === "es" ? "acaba de garantizar el acceso" : lang === "en" ? "just secured the access" : "acabou de garantir o acesso";
    let i = 0;
    let timer: number;
    const schedule = () => {
      const delay = 35_000 + Math.random() * 20_000;
      timer = window.setTimeout(() => {
        const b = buyers[i % buyers.length];
        i++;
        toast(`${b.n} — ${b.l}`, { description: verb, duration: 4500 });
        schedule();
      }, delay);
    };
    schedule();
    return () => window.clearTimeout(timer);
  }, [lang]);


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
          context: "custom_cta_step17_845",
          product: "chave_token_chatgpt",
          amount: offerAmount,
          video_time_s: Math.round(maxVideoSecondsRef.current),
          unlock_video_time_s: CUSTOM_CTA_UNLOCK_SECONDS,
          dest_url: url.toString(),
        });
        sendCAPIInitiateCheckout({ amount: offerAmount });
        trackTikTokInitiateCheckout({ amount: offerAmount });
        trackMetaInitiateCheckout({ amount: offerAmount });
        icFiredRef.current = true;
      }
      window.location.href = url.toString();
    } catch (err) {
      console.warn("[Step17] Custom CTA error:", err);
    }
  };

  const videoId = pandaVideoId || "daa037ca-64f0-4637-97dc-c0278d1f6df6";
  const pandaButtonId = customButtonId || DEFAULT_PANDA_BUTTON_ID;
  const aspectPadding = videoAspectRatio === "16:9" ? "56.25%" : "177.77777777777777%";

  usePandaPreload(videoId);

  // Inject Panda API script for external button + PANDA_CONTEXT listener
  useEffect(() => {
    trackMetaViewContent({});
    sendCAPIEvent("ViewContent");
    let pollTimer: number | undefined;

    if (!document.querySelector('script[src^="https://player.pandavideo.com.br/api.v2.js"]')) {
      const s = document.createElement('script');
      s.src = 'https://player.pandavideo.com.br/api.v2.js';
      s.async = true;
      document.head.appendChild(s);
    }
    const pandaWindow = window as PandaWindow;
    pandaWindow.pandascripttag = pandaWindow.pandascripttag || [];
    pandaWindow.pandascripttag.push(function () {
      if (!pandaWindow.PandaPlayer) return;
      const p = new pandaWindow.PandaPlayer(`panda-${videoId}`, {
        onReady() {
          pandaPlayerRef.current = p;
          p.loadButtonInTime?.({ fetchApi: true });
          pollTimer = window.setInterval(() => {
            const rawTime = typeof p.getCurrentTime === "function"
              ? p.getCurrentTime()
              : typeof p.currentTime === "function"
              ? p.currentTime()
              : p.currentTime;
            updateVideoProgress(normalizePandaSeconds(rawTime), "panda_poll");
          }, 1000);
          p.onEvent?.(function (e: unknown) {
            if (!e) return;
            updateVideoProgress(readPandaVideoSeconds(e), "panda_timeupdate");
            if (isPandaButtonShownEvent(e) && maxVideoSecondsRef.current >= CUSTOM_CTA_UNLOCK_SECONDS) {
              revealCustomCta("panda_button_shown", maxVideoSecondsRef.current);
            }
          });
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

    return () => {
      if (pollTimer) window.clearInterval(pollTimer);
      pandaPlayerRef.current = null;
      window.removeEventListener('message', handlePandaReady);
    };
  }, [videoId, offerAmount, revealCustomCta, updateVideoProgress]);

  // Listen for Panda Video CTA click — only fires on REAL button click
  // Panda sends postMessage with type "buttonClick" or "smartplayer_cta_click"
  // when user clicks the in-video CTA button. Generic player messages are ignored.
  useEffect(() => {
    const handlePandaMessage = (event: MessageEvent) => {
      const d = event.data;
      if (!d || typeof d !== "object") return;

      updateVideoProgress(readPandaVideoSeconds(d), "panda_postmessage");
      if (isPandaButtonShownEvent(d) && maxVideoSecondsRef.current >= CUSTOM_CTA_UNLOCK_SECONDS) {
        revealCustomCta("panda_postmessage", maxVideoSecondsRef.current);
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
          window.location.href = url.toString();
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
      saveFunnelEventReliable("checkout_click", { context: "panda_cta_step17", product: "chave_token_chatgpt", amount: offerAmount, video_time_s: Math.round(maxVideoSecondsRef.current), dest_url: destUrl });
      sendCAPIInitiateCheckout({ amount: offerAmount });
      trackTikTokInitiateCheckout({ amount: offerAmount });
      trackMetaInitiateCheckout({ amount: offerAmount });
    };

    // IC só dispara em clique real no CTA (botão ou Panda postMessage).
    // Removido fallback de visibilitychange/pagehide — padrão de mercado
    // exige clique explícito + redirecionamento ao checkout para InitiateCheckout.
    window.addEventListener("message", handlePandaMessage);
    return () => {
      window.removeEventListener("message", handlePandaMessage);
    };
  }, [videoId, offerAmount, revealCustomCta, updateVideoProgress]);

  const testimonials = young ? t.youngTestimonials : t.matureTestimonials;
  const avatarsYoung = [avatarRafael, avatarCamila];
  const avatarsMature = [avatarJose, avatarLucia];
  const avatars = young ? avatarsYoung : avatarsMature;

  return (
    <StepContainer>
      {/* Urgency bar — vacancy counter + guarantee */}
      <div className="w-full flex items-center justify-between gap-2 rounded-xl border border-accent/30 bg-accent/10 px-3 py-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <Users className="w-3.5 h-3.5 text-accent shrink-0" />
          <span className="text-[11px] sm:text-xs font-bold text-foreground truncate">
            {lang === "es" ? `Quedan ${vacancies} vacantes hoy` : lang === "en" ? `${vacancies} spots left today` : `Restam ${vacancies} vagas hoje`}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <ShieldCheck className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px] sm:text-[11px] font-semibold text-foreground/80">
            {lang === "es" ? "Garantía 30d" : lang === "en" ? "30-day guarantee" : "Garantia 30 dias"}
          </span>
        </div>
      </div>

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
      <div id={pandaButtonId} ref={pandaBtnRef} className="hidden" aria-hidden="true" />

      {/* Custom CTA — appears after 8:45 (525s) of real Panda video time */}
      {showCustomCta && (
        <button
          ref={customCtaRef}
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
