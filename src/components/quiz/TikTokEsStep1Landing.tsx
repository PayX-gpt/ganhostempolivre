import { useState, useEffect, useRef, useCallback } from "react";
import testimonialMarlene from "@/assets/testimonial-marlene.jpg";
import testimonialSeverino from "@/assets/testimonial-severino.jpg";
import testimonialTeresinha from "@/assets/testimonial-teresinha.jpg";
import {
  CheckCircle,
  Star,
  DollarSign,
  Smartphone,
  Clock,
  Shield,
  Ban,
  Zap,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Radio,
} from "lucide-react";

interface Props {
  onNext: () => void;
}

const NOTIFICATIONS = [
  "María de Ciudad de México (CDMX): potencial $112/día — hace 3 min",
  "José de Guadalajara (JAL): $94/día — hace 5 min",
  "Carmen de Bogotá (COL): $156/día — ahora",
  "Roberto de Lima (PER): $87/día — hace 2 min",
  "Soledad de Buenos Aires (ARG): $203/día — hace 7 min",
  "Antonio de Medellín (COL): $134/día — hace 4 min",
  "Consuelo de Santiago (CHL): $91/día — ahora",
  "Pedro de Monterrey (NL): $178/día — hace 6 min",
];

const TESTIMONIALS = [
  {
    photo: testimonialMarlene,
    name: "Carmen Lucía S., 61 años",
    location: "Puebla, México",
    role: "Jubilada",
    badge: "$412 en los primeros 3 días",
    text: "Pensé que era una estafa más de internet. Mi hija me obligó a intentarlo. Casi cerré la página tres veces. En 2 minutos la IA dijo que podía ganar $190 por día. Me reí en su cara. Tres días después tenía $412 en la cuenta. Con 61 años pensé que mi vida laboral se había terminado.",
  },
  {
    photo: testimonialSeverino,
    name: "Roberto Enrique O., 57 años",
    location: "Medellín, Colombia",
    role: "Ex-vendedor",
    badge: "$1.847 en 2 semanas",
    text: "Perdí el empleo a los 57 años. Nadie me llamaba a entrevistas — vos sabés cómo es. Hice el quiz sin creer mucho. La IA calculó $260 por día para mi perfil. Segunda semana: $1.847 acumulados. Mi esposa dejó de quejarse por la plata. Podés confiar.",
  },
  {
    photo: testimonialTeresinha,
    name: "María del Carmen M., 64 años",
    location: "Valencia, España",
    role: "Jubilada",
    badge: "$2.800/mes complementados",
    text: "Tengo 64 años y solo uso el celular para WhatsApp y YouTube. Mi nieta me ayudó a hacer el test. La IA dijo $140 por día. Hoy gano entre $95 y $180 cada día hábil. Lo uso para pagar los remedios de mi marido sin pedirle a nadie.",
  },
];

const FAQ_ITEMS = [
  {
    q: '"Soy muy viejo para esto..."',
    a: "Teresinha tiene 64. Marlene tiene 61. Están ganando más que cuando trabajaban. La IA fue entrenada especialmente para personas mayores de 50.",
  },
  {
    q: '"No entiendo de tecnología..."',
    a: "Si llegaste hasta esta página y estás leyendo esto, ya sabés lo suficiente. Son 7 preguntas de opción múltiple. Nada para escribir.",
  },
  {
    q: '"Seguro que hay algún costo escondido..."',
    a: "El test es 100% gratuito. No pedimos tarjeta. No firmás nada. No hay cobro en ninguna etapa.",
  },
  {
    q: '"¿Y si no funciona para mí?"',
    a: "En 36.860 tests, el quiz nunca dijo que alguien no tuviera potencial. El peor escenario: te vas sabiendo lo que tenés.",
  },
  {
    q: '"Parece estafa de internet..."',
    a: 'El 68% de los 36.860 que lo hicieron pensaron exactamente lo mismo antes de intentar. No perdés nada. No das datos financieros. No firmás nada.',
  },
];

const CtaButton = ({
  text,
  onClick,
  variant = "red",
  pulse = false,
  large = false,
}: {
  text: string;
  onClick: () => void;
  variant?: "red" | "yellow";
  pulse?: boolean;
  large?: boolean;
}) => (
  <div className="w-full flex flex-col items-center gap-2">
    <button
      onClick={onClick}
      className={`w-full max-w-[480px] font-bold rounded-lg transition-all cursor-pointer ${
        large ? "min-h-[72px] text-[20px] sm:text-[22px]" : "min-h-[56px] sm:min-h-[64px] text-[18px] sm:text-[20px]"
      } ${
        variant === "yellow"
          ? "text-[#1a1a1a]"
          : "text-white"
      } ${pulse ? "animate-[ctaPulse_2s_ease-in-out_infinite]" : ""}`}
      style={{
        background: variant === "yellow" ? "#f1c40f" : "#e74c3c",
        boxShadow:
          variant === "yellow"
            ? "0 8px 30px rgba(241,196,15,0.4)"
            : "0 8px 30px rgba(231,76,60,0.5)",
      }}
    >
      {text}
    </button>
    {variant === "red" && (
      <p className="text-[13px]" style={{ color: "#888" }}>
        <CheckCircle className="inline w-3.5 h-3.5 mr-1" style={{ color: "#27ae60" }} />
        Gratuito &bull;{" "}
        <CheckCircle className="inline w-3.5 h-3.5 mr-1" style={{ color: "#27ae60" }} />
        Sin registro &bull;{" "}
        <CheckCircle className="inline w-3.5 h-3.5 mr-1" style={{ color: "#27ae60" }} />
        Resultado en 2 minutos
      </p>
    )}
  </div>
);

const Stars = () => (
  <div className="flex gap-0.5">
    {[...Array(5)].map((_, i) => (
      <Star key={i} className="w-4 h-4 fill-[#f1c40f]" style={{ color: "#f1c40f" }} />
    ))}
  </div>
);

const Avatar = ({ photo }: { photo: string }) => (
  <img
    src={photo}
    alt="Testimonio"
    className="w-12 h-12 rounded-full object-cover shrink-0"
    loading="lazy"
    width={48}
    height={48}
  />
);

const TikTokEsStep1Landing = ({ onNext }: Props) => {
  const [counter, setCounter] = useState(36860);
  const [timerSeconds, setTimerSeconds] = useState(18 * 60);
  const [slotsRemaining] = useState(() => Math.floor(Math.random() * 13) + 42);
  const [activeToast, setActiveToast] = useState<number | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const toastTimeout = useRef<ReturnType<typeof setTimeout>>();
  const [userRegion, setUserRegion] = useState("tu región");

  // Fetch user location from IP
  useEffect(() => {
    fetch("https://ipapi.co/json/")
      .then((r) => r.json())
      .then((data) => {
        if (data?.region) setUserRegion(data.region);
      })
      .catch(() => {});
  }, []);

  // Counter +1 every 28s
  useEffect(() => {
    const id = setInterval(() => setCounter((c) => c + 1), 28000);
    return () => clearInterval(id);
  }, []);

  // Timer countdown
  useEffect(() => {
    const id = setInterval(() => {
      setTimerSeconds((s) => (s <= 0 ? 18 * 60 : s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // Social proof toasts
  useEffect(() => {
    const schedule = () => {
      const delay = (Math.random() * 20 + 35) * 1000;
      toastTimeout.current = setTimeout(() => {
        const idx = Math.floor(Math.random() * NOTIFICATIONS.length);
        setActiveToast(idx);
        setToastVisible(true);
        setTimeout(() => {
          setToastVisible(false);
          setTimeout(() => setActiveToast(null), 300);
        }, 4000);
        schedule();
      }, delay);
    };
    schedule();
    return () => clearTimeout(toastTimeout.current);
  }, []);

  const timerMin = String(Math.floor(timerSeconds / 60)).padStart(2, "0");
  const timerSec = String(timerSeconds % 60).padStart(2, "0");

  const toggleFaq = useCallback((i: number) => {
    setOpenFaq((prev) => (prev === i ? null : i));
  }, []);

  return (
    <div className="w-full" style={{ background: "#ffffff", color: "#1a1a1a" }}>
      {/* CSS for pulse animation */}
      <style>{`
        @keyframes ctaPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); }
        }
        @keyframes slideInLeft {
          from { transform: translateX(-120%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutLeft {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(-120%); opacity: 0; }
        }
      `}</style>

      {/* SECTION 0 — STICKY BAR */}
      <div
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-3 sm:px-4"
        style={{ background: "#1a1a1a", height: 44 }}
      >
        <span className="text-[13px] sm:text-[14px] text-white flex items-center gap-1.5 truncate">
          <Radio className="w-3.5 h-3.5" style={{ color: "#27ae60" }} />
          <span className="font-semibold">{counter.toLocaleString("es-ES")}</span> personas descubrieron su potencial hoy
        </span>
        <span className="text-[13px] sm:text-[14px] text-white flex items-center gap-1 shrink-0 ml-2">
          <Zap className="w-3.5 h-3.5" style={{ color: "#f1c40f" }} /> Sistema abierto ahora
        </span>
      </div>

      {/* Spacer for sticky bar */}
      <div style={{ height: 44 }} />

      {/* SECTION 1 — PRE-HEADLINE */}
      <div className="w-full py-3 px-4 text-center" style={{ background: "#c0392b" }}>
        <p className="text-[14px] sm:text-[15px] font-bold text-white leading-snug max-w-lg mx-auto">
          <AlertCircle className="inline w-4 h-4 mr-1 -mt-0.5" />
          Análisis disponible para {userRegion} ahora — si cerrás esta página, tu perfil personalizado se pierde
        </p>
      </div>

      {/* SECTION 2 — HERO */}
      <section className="w-full px-4 sm:px-6 py-10 sm:py-14 max-w-2xl mx-auto">
        {/* Badge */}
        <div className="flex justify-center mb-6">
          <span
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] sm:text-[14px] font-bold"
            style={{ background: "#fff3cd", border: "1.5px solid #f0a500", color: "#7d4e00" }}
          >
            <Star className="w-4 h-4 fill-[#f0a500]" style={{ color: "#f0a500" }} />
            #1 Herramienta de Ingreso Extra para +50 — Verificado por {counter.toLocaleString("es-ES")} personas
          </span>
        </div>

        {/* Headline */}
        <h1
          className="text-[28px] sm:text-[36px] md:text-[44px] font-extrabold leading-[1.25] text-center mb-6"
          style={{ color: "#1a1a1a" }}
        >
          ¿Tu jubilación alcanza para cubrir todas las cuentas a fin de mes?
          <br className="hidden sm:block" />
          <span className="block mt-3 text-[24px] sm:text-[30px] md:text-[36px] font-bold" style={{ color: "#333" }}>
            Si no — necesitás ver lo que {counter.toLocaleString("es-ES")} personas mayores de 50 descubrieron con este quiz de IA.
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg sm:text-xl text-center mb-8 leading-relaxed max-w-xl mx-auto" style={{ color: "#444" }}>
          La mayoría de las personas mayores de 50 no sabe que tiene un potencial de ingreso que nunca fue calculado.
          Respondé 7 preguntas y la IA te muestra tu número — aunque nunca hayas tocado tecnología.
        </p>

        {/* Social proof box */}
        <div
          className="rounded-lg p-5 mb-8 max-w-xl mx-auto"
          style={{ background: "#f0f7ff", borderLeft: "4px solid #2980b9" }}
        >
          {[
            "14.200 jubilados ya hicieron el test",
            "8.400 amas de casa ya descubrieron su potencial",
            "9.100 trabajadores de 50 a 65 años ya analizaron su perfil",
            "Resultado promedio calculado por la IA: $127 por día",
            "Funciona en cualquier celular Android o iPhone",
          ].map((t, i) => (
            <div key={i} className="flex items-start gap-2.5 mb-2 last:mb-0">
              <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#27ae60" }} />
              <span className="text-[16px] sm:text-lg font-medium" style={{ color: "#1a1a1a" }}>{t}</span>
            </div>
          ))}
        </div>

        {/* CTA #1 */}
        <CtaButton text="VER CUÁNTO CALCULA LA IA PARA MÍ →" onClick={onNext} />

        {/* Testimonial Marlene */}
        <div className="mt-10 max-w-xl mx-auto rounded-xl p-5 sm:p-6" style={{ background: "#fff", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
          <div className="flex items-center gap-3 mb-3">
            <Avatar photo={testimonialMarlene} />
            <div>
              <Stars />
              <p className="text-sm font-semibold mt-1" style={{ color: "#1a1a1a" }}>Carmen Lucía S., 61 años — Puebla, México</p>
            </div>
          </div>
          <p className="italic text-[15px] sm:text-[16px] leading-relaxed mb-3" style={{ color: "#333" }}>
            "Pensé que era otra mentira de internet. Mi hija me obligó a intentarlo. Casi cerré la página tres veces.
            En 2 minutos la IA dijo que podía ganar $190 por día. Me reí en su cara. Tres días después tenía $412 en la cuenta.
            Con 61 años pensé que mi vida laboral se había terminado."
          </p>
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-bold"
            style={{ background: "#e8f5e9", color: "#2e7d32" }}
          >
            <CheckCircle className="w-3.5 h-3.5" /> $412 en los primeros 3 días
          </span>
        </div>
      </section>

      {/* SECTION 3 — FUTURE PACING */}
      <section className="w-full px-4 sm:px-6 py-12 sm:py-14" style={{ background: "#fafafa" }}>
        <div className="max-w-2xl mx-auto">
          <h2 className="text-[22px] sm:text-[24px] font-bold text-center mb-8" style={{ color: "#1a1a1a" }}>
            Dos caminos. Vos elegís cuál.
          </h2>
          <div className="grid sm:grid-cols-2 gap-5 mb-8">
            {/* Without */}
            <div className="rounded-xl p-6" style={{ background: "#fff5f5", borderTop: "4px solid #e74c3c" }}>
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-6 h-6" style={{ color: "#e74c3c" }} />
                <span className="text-lg font-bold" style={{ color: "#c0392b" }}>Sin el quiz</span>
              </div>
              <p className="text-[16px] sm:text-lg leading-relaxed" style={{ color: "#555" }}>
                Dentro de 2 años, la jubilación va a ser la misma. Los remedios, no. Vas a seguir calculando si llegás a fin de mes.
                Seguir diciendo "ahora no puedo" a los nietos. Seguir dependiendo de alguien.
              </p>
            </div>
            {/* With */}
            <div className="rounded-xl p-6" style={{ background: "#f0fff4", borderTop: "4px solid #27ae60" }}>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-6 h-6" style={{ color: "#27ae60" }} />
                <span className="text-lg font-bold" style={{ color: "#1e8449" }}>Con el quiz</span>
              </div>
              <p className="text-[16px] sm:text-lg leading-relaxed" style={{ color: "#555" }}>
                Despertarte un martes, tomar tu café, abrir el celular 20 minutos y ver $47 calculados para vos.
                Sin salir de casa. Sin jefe. Sin dar explicaciones. A fin de mes: $800 a $1.200 más en la cuenta.
                Para los remedios. Para los nietos. Para tu tranquilidad.
              </p>
            </div>
          </div>
          <CtaButton text="QUIERO DESCUBRIR MI POTENCIAL AHORA →" onClick={onNext} />
        </div>
      </section>

      {/* SECTION 4 — 5 BULLETS */}
      <section className="w-full px-4 sm:px-6 py-12 sm:py-14" style={{ background: "#ffffff" }}>
        <div className="max-w-2xl mx-auto">
          <h2 className="text-[22px] sm:text-[24px] font-bold text-center mb-8" style={{ color: "#1a1a1a" }}>
            Lo que la IA calcula para vos
          </h2>
          <div className="flex flex-col gap-5 mb-8">
            {[
              {
                Icon: DollarSign,
                iconColor: "#27ae60",
                title: "TU POTENCIAL EXACTO EN 2 MINUTOS",
                desc: "La IA calcula entre $87 y $430 por día basado en TU perfil. No es una estimación genérica. Es un análisis real de tu situación.",
              },
              {
                Icon: Smartphone,
                iconColor: "#2980b9",
                title: "FUNCIONA EN EL CELULAR QUE YA TENÉS",
                desc: "Sin comprar nada, sin instalar programas complicados. Si mandás mensajes por WhatsApp, podés usarlo.",
              },
              {
                Icon: Clock,
                iconColor: "#e67e22",
                title: "PRIMEROS RESULTADOS EN MENOS DE 24 HORAS",
                desc: "Gloria, Guadalajara (MX): $87 en la cuenta al día siguiente. Roberto, Medellín (CO): $210 en 48 horas.",
              },
              {
                Icon: Shield,
                iconColor: "#8e44ad",
                title: "FUNCIONA INCLUSO CON MÁS DE 60 AÑOS",
                desc: "La IA fue entrenada especialmente para +50. Tu experiencia de vida es una VENTAJA, no un obstáculo.",
              },
              {
                Icon: Ban,
                iconColor: "#e74c3c",
                title: "BASTA DE DEPENDER DE UNA JUBILACIÓN QUE NO ALCANZA",
                desc: "Mientras el gobierno te paga una miseria al mes, la IA puede calcular ese monto en menos de 10 días para tu perfil.",
              },
            ].map(({ Icon, iconColor, title, desc }, i) => (
              <div
                key={i}
                className="flex items-start gap-4 p-5 rounded-xl"
                style={{ background: "#f8f9fa" }}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: `${iconColor}15` }}
                >
                  <Icon className="w-6 h-6" style={{ color: iconColor }} />
                </div>
                <div>
                  <h3 className="text-[16px] sm:text-lg font-bold mb-1" style={{ color: "#1a1a1a" }}>{title}</h3>
                  <p className="text-[15px] sm:text-[16px] leading-relaxed" style={{ color: "#555" }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <CtaButton text="CALCULAR MI GANANCIA AHORA — ES GRATUITO →" onClick={onNext} />
        </div>
      </section>

      {/* SECTION 5 — URGENCY */}
      <section className="w-full px-4 sm:px-6 py-12 sm:py-14" style={{ background: "#1a1a1a" }}>
        <div className="max-w-2xl mx-auto text-center">
          {/* Timer */}
          <p className="text-lg mb-3 flex items-center justify-center gap-2" style={{ color: "#ffffff" }}>
            <Clock className="w-5 h-5" style={{ color: "#f1c40f" }} />
            Tu análisis personalizado todavía está disponible
          </p>
          <p className="text-[48px] sm:text-[56px] font-bold mb-2" style={{ color: "#f1c40f", fontFamily: "monospace" }}>
            {timerMin}:{timerSec}
          </p>
          <p className="text-sm mb-8" style={{ color: "#aaa" }}>
            Si cerrás esta página, tu perfil se pierde y entrás en lista de espera
          </p>

          {/* Slots bar */}
          <div className="max-w-md mx-auto mb-8">
            <p className="text-[16px] mb-2 text-left" style={{ color: "#fff" }}>Análisis disponibles hoy:</p>
            <div className="w-full h-4 rounded" style={{ background: "#333" }}>
              <div className="h-4 rounded" style={{ background: "#e74c3c", width: "83%" }} />
            </div>
            <p className="text-sm mt-1.5 text-left" style={{ color: "#ccc" }}>
              Quedan <strong style={{ color: "#f1c40f" }}>{slotsRemaining}</strong> análisis gratuitos
            </p>
          </div>

          {/* Money calc */}
          <div
            className="rounded-lg p-5 sm:p-6 text-left max-w-md mx-auto mb-8"
            style={{ background: "#222", border: "2px solid #f1c40f" }}
          >
            <p className="text-lg mb-4" style={{ color: "#fff" }}>Si ganás apenas $20/día con el GTL:</p>
            <div className="space-y-2">
              {[
                ["$600", "por mes"],
                ["$7.200", "por año"],
                ["$36.000", "en 5 años"],
              ].map(([val, label], i) => (
                <p key={i} className="text-lg" style={{ color: "#fff" }}>
                  → <strong style={{ color: "#f1c40f" }}>{val}</strong> {label}
                </p>
              ))}
            </div>
            <p className="text-lg mt-4 font-bold" style={{ color: "#fff" }}>
              Pero esos 5 años empiezan hoy o no empiezan.
            </p>
          </div>

          <CtaButton text="HACER EL TEST ANTES DE QUE MI CUPO EXPIRE →" onClick={onNext} variant="yellow" />
        </div>
      </section>

      {/* SECTION 6 — 3 TESTIMONIALS */}
      <section className="w-full px-4 sm:px-6 py-12 sm:py-14" style={{ background: "#f8f9fa" }}>
        <div className="max-w-4xl mx-auto">
          <h2 className="text-[22px] sm:text-[24px] font-bold text-center mb-8" style={{ color: "#1a1a1a" }}>
            Mirá lo que pasó con quienes hicieron el test
          </h2>
          <div className="grid md:grid-cols-3 gap-5 mb-8">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="rounded-xl p-5 sm:p-6" style={{ background: "#fff", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
                <div className="flex items-center gap-3 mb-3">
                  <Avatar photo={t.photo} />
                  <Stars />
                </div>
                <p className="italic text-[15px] leading-relaxed mb-3" style={{ color: "#333" }}>"{t.text}"</p>
                <p className="text-sm font-semibold mb-1" style={{ color: "#1a1a1a" }}>{t.name}</p>
                <p className="text-[13px] mb-3" style={{ color: "#777" }}>
                  {t.location} | {t.role}
                </p>
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold"
                  style={{ background: "#e8f5e9", color: "#2e7d32" }}
                >
                  <CheckCircle className="w-3.5 h-3.5" /> {t.badge}
                </span>
              </div>
            ))}
          </div>
          <CtaButton text="YO TAMBIÉN QUIERO HACER EL TEST →" onClick={onNext} />
        </div>
      </section>

      {/* SECTION 7 — OBJECTIONS */}
      <section className="w-full px-4 sm:px-6 py-12 sm:py-14" style={{ background: "#ffffff" }}>
        <div className="max-w-2xl mx-auto">
          <h2 className="text-[22px] sm:text-[24px] font-bold text-center mb-8" style={{ color: "#1a1a1a" }}>
            Tus dudas, respondidas
          </h2>
          <div className="flex flex-col gap-3 mb-8">
            {FAQ_ITEMS.map((item, i) => (
              <div
                key={i}
                className="rounded-xl overflow-hidden"
                style={{ background: "#f8f9fa", border: "1px solid #e0e0e0" }}
              >
                <button
                  className="w-full flex items-center justify-between p-5 text-left cursor-pointer"
                  onClick={() => toggleFaq(i)}
                >
                  <span className="text-[16px] sm:text-lg font-semibold flex items-center gap-2" style={{ color: "#1a1a1a" }}>
                    <AlertCircle className="w-5 h-5 shrink-0" style={{ color: "#e74c3c" }} />
                    {item.q}
                  </span>
                  {openFaq === i ? (
                    <ChevronUp className="w-5 h-5 shrink-0" style={{ color: "#888" }} />
                  ) : (
                    <ChevronDown className="w-5 h-5 shrink-0" style={{ color: "#888" }} />
                  )}
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#27ae60" }} />
                    <p className="text-[15px] sm:text-[16px] leading-relaxed" style={{ color: "#555" }}>{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
          <CtaButton text="RESOLVÍ MIS DUDAS — QUIERO HACER EL TEST →" onClick={onNext} />
        </div>
      </section>

      {/* SECTION 8 — FINAL CTA */}
      <section
        className="w-full px-4 sm:px-6 py-16 sm:py-20 text-center"
        style={{ background: "linear-gradient(135deg, #1a1a1a 0%, #2c3e50 100%)" }}
      >
        <div className="max-w-xl mx-auto">
          <p className="text-[20px] sm:text-[22px] leading-[1.8] mb-6" style={{ color: "#fff" }}>
            Trabajaste toda la vida.
            <br />
            Aportaste durante décadas.
            <br />
            El gobierno te devolvió una miseria.
          </p>
          <p className="text-[18px] sm:text-[20px] font-bold leading-[1.8] mb-6" style={{ color: "#f1c40f" }}>
            La IA no te pide experiencia.
            <br />
            No te pide juventud.
            <br />
            No te pide currículum.
          </p>
          <p className="text-[26px] sm:text-[28px] font-bold mb-8" style={{ color: "#fff" }}>
            Solo te pide 2 minutos.
          </p>
          <CtaButton text="HACER EL TEST AHORA — ES 100% GRATUITO →" onClick={onNext} pulse large />
          <p className="text-sm mt-4" style={{ color: "#aaa" }}>
            <CheckCircle className="inline w-3.5 h-3.5 mr-1" style={{ color: "#27ae60" }} />
            Sin registro &bull;{" "}
            <CheckCircle className="inline w-3.5 h-3.5 mr-1" style={{ color: "#27ae60" }} />
            Sin tarjeta &bull;{" "}
            <CheckCircle className="inline w-3.5 h-3.5 mr-1" style={{ color: "#27ae60" }} />
            Resultado inmediato
            <br />
            <span className="mt-1 inline-block">Tu análisis todavía está disponible — no cierres esta página</span>
          </p>
        </div>
      </section>

      {/* SECTION 9 — DISCLAIMER */}
      <footer className="w-full px-4 py-6 text-center" style={{ background: "#111" }}>
        <p className="text-[11px] max-w-[600px] mx-auto leading-relaxed" style={{ color: "#666" }}>
          *Los resultados presentados son casos documentados y pueden no representar la ganancia típica de todos los usuarios.
          El potencial calculado se basa en el perfil informado y no constituye garantía de ingresos. Los resultados individuales
          varían según dedicación, perfil y condiciones personales.
        </p>
      </footer>

      {/* FLOATING SOCIAL PROOF TOAST */}
      {activeToast !== null && (
        <div
          className="fixed bottom-6 left-4 z-50 hidden min-[400px]:block"
          style={{
            animation: toastVisible ? "slideInLeft 0.3s ease-out" : "slideOutLeft 0.3s ease-in",
          }}
        >
          <div
            className="rounded-lg px-4 py-3 text-[13px] max-w-[280px] flex items-start gap-2"
            style={{ background: "#fff", boxShadow: "0 4px 20px rgba(0,0,0,0.15)", color: "#333" }}
          >
            <Radio className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#27ae60" }} />
            {NOTIFICATIONS[activeToast]}
          </div>
        </div>
      )}
    </div>
  );
};

export default TikTokEsStep1Landing;
