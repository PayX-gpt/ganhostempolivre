import { useState, useEffect, useRef, useCallback } from "react";
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
  "Maria de Fortaleza (CE): potencial R$112/dia — há 3 min",
  "José de Juazeiro do Norte (CE): R$94/dia — há 5 min",
  "Aparecida de Cuiabá (MT): R$156/dia — agora",
  "Raimundo de Teresina (PI): R$87/dia — há 2 min",
  "Solange de Campina Grande (PB): R$203/dia — há 7 min",
  "Antônio de Feira de Santana (BA): R$134/dia — há 4 min",
  "Conceição de Gov. Valadares (MG): R$91/dia — agora",
  "Pedro de Mossoró (RN): R$178/dia — há 6 min",
];

const TESTIMONIALS = [
  {
    initials: "MA",
    color: "#8e44ad",
    name: "Marlene Aparecida S., 61 anos",
    location: "Patos de Minas, MG",
    role: "Aposentada",
    badge: "R$412 nos primeiros 3 dias",
    text: "Achei que era golpe, igual tudo na internet. Fiz o teste numa quarta à noite, lá pelas 22h. Na quinta de tarde, R$87 na conta. Mostrei pro meu marido e ele quis fazer também. Na semana seguinte: mais R$203. Com 61 anos eu achei que minha vida de trabalho tinha acabado.",
  },
  {
    initials: "SR",
    color: "#2980b9",
    name: "Severino Raimundo O., 57 anos",
    location: "Caruaru, PE",
    role: "Ex-vendedor",
    badge: "R$1.847 em 2 semanas",
    text: "Perdi emprego com 57 anos. Ninguém me chamava pra entrevista — você sabe como é. Fiz o quiz sem acreditar muito. A IA calculou R$260 por dia pro meu perfil. Segunda semana: R$1.847 acumulados. Minha esposa parou de reclamar do dinheiro. Pode confiar.",
  },
  {
    initials: "TC",
    color: "#27ae60",
    name: "Teresinha Conceição M., 64 anos",
    location: "Vitória da Conquista, BA",
    role: "Aposentada",
    badge: "R$2.800/mês complementados",
    text: "Tenho 64 anos e só uso celular pra WhatsApp e YouTube. Minha neta me ajudou a fazer o teste. A IA disse R$140 por dia. Hoje ganho R$95 a R$180 todo dia útil. Uso pra pagar o remédio do meu marido sem precisar pedir pra ninguém.",
  },
];

const FAQ_ITEMS = [
  {
    q: '"Sou muito velho para isso..."',
    a: "Teresinha tem 64. Marlene tem 61. Estão ganhando mais do que quando trabalhavam. A IA foi especialmente treinada para pessoas acima de 50.",
  },
  {
    q: '"Não entendo de tecnologia..."',
    a: "Se você chegou até essa página e está lendo isso, você já sabe o suficiente. São 7 perguntas de múltipla escolha. Nada para digitar.",
  },
  {
    q: '"Deve ter algum custo escondido..."',
    a: "O teste é 100% gratuito. Você não dá cartão. Não assina nada. Não existe cobrança em nenhuma etapa.",
  },
  {
    q: '"E se não funcionar pra mim?"',
    a: "Em 36.860 testes, o quiz nunca disse que alguém não tinha potencial. O pior cenário: você sai sabendo o que tem.",
  },
  {
    q: '"Parece golpe da internet..."',
    a: '68% dos 36.860 que fizeram pensaram exatamente isso antes de tentar. Você não perde nada. Não dá dado financeiro. Não assina nada.',
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
        Sem cadastro &bull;{" "}
        <CheckCircle className="inline w-3.5 h-3.5 mr-1" style={{ color: "#27ae60" }} />
        Resultado em 2 minutos
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

const Avatar = ({ initials, color }: { initials: string; color: string }) => (
  <div
    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0"
    style={{ background: color }}
  >
    {initials}
  </div>
);

const TikTokStep1Landing = ({ onNext }: Props) => {
  const [counter, setCounter] = useState(36860);
  const [timerSeconds, setTimerSeconds] = useState(18 * 60);
  const [slotsRemaining] = useState(() => Math.floor(Math.random() * 13) + 42);
  const [activeToast, setActiveToast] = useState<number | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const toastTimeout = useRef<ReturnType<typeof setTimeout>>();

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
          <span className="font-semibold">{counter.toLocaleString("pt-BR")}</span> pessoas descobriram seu potencial hoje
        </span>
        <span className="text-[13px] sm:text-[14px] text-white flex items-center gap-1 shrink-0 ml-2">
          <Zap className="w-3.5 h-3.5" style={{ color: "#f1c40f" }} /> Sistema aberto agora
        </span>
      </div>

      {/* Spacer for sticky bar */}
      <div style={{ height: 44 }} />

      {/* SECTION 1 — PRE-HEADLINE */}
      <div className="w-full py-3 px-4 text-center" style={{ background: "#c0392b" }}>
        <p className="text-[14px] sm:text-[15px] font-bold text-white leading-snug max-w-lg mx-auto">
          <AlertCircle className="inline w-4 h-4 mr-1 -mt-0.5" />
          Análise disponível para o seu CEP agora — se fechar essa página, seu perfil personalizado é perdido
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
            #1 Ferramenta de Renda Extra para +50 no Brasil — Verificado por {counter.toLocaleString("pt-BR")} brasileiros
          </span>
        </div>

        {/* Headline */}
        <h1
          className="text-[28px] sm:text-[36px] md:text-[44px] font-extrabold leading-[1.25] text-center mb-6"
          style={{ color: "#1a1a1a" }}
        >
          Sua aposentadoria paga todas as contas no fim do mês?
          <br className="hidden sm:block" />
          <span className="block mt-3 text-[24px] sm:text-[30px] md:text-[36px] font-bold" style={{ color: "#333" }}>
            Se não — você precisa ver o que {counter.toLocaleString("pt-BR")} brasileiros acima de 50 anos descobriram com esse quiz de IA.
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg sm:text-xl text-center mb-8 leading-relaxed max-w-xl mx-auto" style={{ color: "#444" }}>
          A maioria das pessoas acima de 50 anos não sabe que tem um potencial de renda que nunca foi calculado.
          Responda 7 perguntas e a IA mostra o seu número — mesmo que você nunca tenha mexido com tecnologia.
        </p>

        {/* Social proof box */}
        <div
          className="rounded-lg p-5 mb-8 max-w-xl mx-auto"
          style={{ background: "#f0f7ff", borderLeft: "4px solid #2980b9" }}
        >
          {[
            "14.200 aposentados pelo INSS já fizeram o teste",
            "8.400 donas de casa já descobriram seu potencial",
            "9.100 trabalhadores de 50 a 65 anos já analisaram seu perfil",
            "Resultado médio calculado pela IA: R$127 por dia",
            "Funciona em qualquer celular Android ou iPhone",
          ].map((t, i) => (
            <div key={i} className="flex items-start gap-2.5 mb-2 last:mb-0">
              <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#27ae60" }} />
              <span className="text-[16px] sm:text-lg font-medium" style={{ color: "#1a1a1a" }}>{t}</span>
            </div>
          ))}
        </div>

        {/* CTA #1 */}
        <CtaButton text="VER QUANTO A IA CALCULA PRA MIM →" onClick={onNext} />

        {/* Testimonial Marlene */}
        <div className="mt-10 max-w-xl mx-auto rounded-xl p-5 sm:p-6" style={{ background: "#fff", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
          <div className="flex items-center gap-3 mb-3">
            <Avatar initials="MA" color="#8e44ad" />
            <div>
              <Stars />
              <p className="text-sm font-semibold mt-1" style={{ color: "#1a1a1a" }}>Marlene Aparecida S., 61 anos — Patos de Minas, MG</p>
            </div>
          </div>
          <p className="italic text-[15px] sm:text-[16px] leading-relaxed mb-3" style={{ color: "#333" }}>
            "Achei que era mais uma lorota da internet. Minha filha me obrigou a tentar. Quase fechei a página três vezes.
            Em 2 minutos a IA disse que eu podia ganhar R$190 por dia. Ri da cara dela. Três dias depois tinha R$412 no Nubank.
            Com 61 anos eu achei que minha vida de trabalho tinha acabado."
          </p>
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-bold"
            style={{ background: "#e8f5e9", color: "#2e7d32" }}
          >
            <CheckCircle className="w-3.5 h-3.5" /> R$412 nos primeiros 3 dias
          </span>
        </div>
      </section>

      {/* SECTION 3 — FUTURE PACING */}
      <section className="w-full px-4 sm:px-6 py-12 sm:py-14" style={{ background: "#fafafa" }}>
        <div className="max-w-2xl mx-auto">
          <h2 className="text-[22px] sm:text-[24px] font-bold text-center mb-8" style={{ color: "#1a1a1a" }}>
            Dois caminhos. Você escolhe qual.
          </h2>
          <div className="grid sm:grid-cols-2 gap-5 mb-8">
            {/* Without */}
            <div className="rounded-xl p-6" style={{ background: "#fff5f5", borderTop: "4px solid #e74c3c" }}>
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-6 h-6" style={{ color: "#e74c3c" }} />
                <span className="text-lg font-bold" style={{ color: "#c0392b" }}>Sem o quiz</span>
              </div>
              <p className="text-[16px] sm:text-lg leading-relaxed" style={{ color: "#555" }}>
                Daqui a 2 anos, a aposentadoria vai ser a mesma. Os remédios, não. Você vai continuar calculando se fecha o mês.
                Continuar dizendo "não posso agora" para os netos. Continuar dependendo de alguém.
              </p>
            </div>
            {/* With */}
            <div className="rounded-xl p-6" style={{ background: "#f0fff4", borderTop: "4px solid #27ae60" }}>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-6 h-6" style={{ color: "#27ae60" }} />
                <span className="text-lg font-bold" style={{ color: "#1e8449" }}>Com o quiz</span>
              </div>
              <p className="text-[16px] sm:text-lg leading-relaxed" style={{ color: "#555" }}>
                Acordar na terça, tomar seu café, abrir o celular por 20 minutos e ver R$47 calculados para você.
                Sem sair de casa. Sem chefe. Sem se explicar. No fim do mês: R$800 a R$1.200 a mais na conta.
                Para o remédio. Para o neto. Para a sua paz.
              </p>
            </div>
          </div>
          <CtaButton text="QUERO DESCOBRIR MEU POTENCIAL AGORA →" onClick={onNext} />
        </div>
      </section>

      {/* SECTION 4 — 5 BULLETS */}
      <section className="w-full px-4 sm:px-6 py-12 sm:py-14" style={{ background: "#ffffff" }}>
        <div className="max-w-2xl mx-auto">
          <h2 className="text-[22px] sm:text-[24px] font-bold text-center mb-8" style={{ color: "#1a1a1a" }}>
            O que a IA calcula para você
          </h2>
          <div className="flex flex-col gap-5 mb-8">
            {[
              {
                Icon: DollarSign,
                iconColor: "#27ae60",
                title: "SEU POTENCIAL EXATO EM 2 MINUTOS",
                desc: "A IA calcula entre R$87 e R$430 por dia baseado no SEU perfil. Não é estimativa genérica. É análise real da sua situação.",
              },
              {
                Icon: Smartphone,
                iconColor: "#2980b9",
                title: "FUNCIONA NO CELULAR QUE VOCÊ JÁ TEM",
                desc: "Sem comprar nada, sem instalar programa complicado. Se você manda mensagem no WhatsApp, você consegue usar.",
              },
              {
                Icon: Clock,
                iconColor: "#e67e22",
                title: "PRIMEIROS RESULTADOS EM MENOS DE 24 HORAS",
                desc: "Cláudia, MG: R$87 na conta no dia seguinte. Severino, Caruaru (PE): R$210 em 48 horas.",
              },
              {
                Icon: Shield,
                iconColor: "#8e44ad",
                title: "FUNCIONA MESMO COM MAIS DE 60 ANOS",
                desc: "A IA foi treinada especialmente para +50. Sua experiência de vida é uma VANTAGEM, não obstáculo.",
              },
              {
                Icon: Ban,
                iconColor: "#e74c3c",
                title: "CHEGA DE DEPENDER DE INSS QUE NÃO COBRE O BÁSICO",
                desc: "Enquanto o governo paga R$1.619/mês, a IA pode calcular esse valor em menos de 10 dias para o seu perfil.",
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
          <CtaButton text="CALCULAR MEU GANHO AGORA — É GRATUITO →" onClick={onNext} />
        </div>
      </section>

      {/* SECTION 5 — URGENCY */}
      <section className="w-full px-4 sm:px-6 py-12 sm:py-14" style={{ background: "#1a1a1a" }}>
        <div className="max-w-2xl mx-auto text-center">
          {/* Timer */}
          <p className="text-lg mb-3 flex items-center justify-center gap-2" style={{ color: "#ffffff" }}>
            <Clock className="w-5 h-5" style={{ color: "#f1c40f" }} />
            Sua análise personalizada ainda está disponível
          </p>
          <p className="text-[48px] sm:text-[56px] font-bold mb-2" style={{ color: "#f1c40f", fontFamily: "monospace" }}>
            {timerMin}:{timerSec}
          </p>
          <p className="text-sm mb-8" style={{ color: "#aaa" }}>
            Se fechar essa página, seu perfil é perdido e você entra na fila de espera
          </p>

          {/* Slots bar */}
          <div className="max-w-md mx-auto mb-8">
            <p className="text-[16px] mb-2 text-left" style={{ color: "#fff" }}>Análises disponíveis hoje:</p>
            <div className="w-full h-4 rounded" style={{ background: "#333" }}>
              <div className="h-4 rounded" style={{ background: "#e74c3c", width: "83%" }} />
            </div>
            <p className="text-sm mt-1.5 text-left" style={{ color: "#ccc" }}>
              Restam <strong style={{ color: "#f1c40f" }}>{slotsRemaining}</strong> análises gratuitas
            </p>
          </div>

          {/* Money calc */}
          <div
            className="rounded-lg p-5 sm:p-6 text-left max-w-md mx-auto mb-8"
            style={{ background: "#222", border: "2px solid #f1c40f" }}
          >
            <p className="text-lg mb-4" style={{ color: "#fff" }}>Se você ganhar apenas R$20/dia com o GTL:</p>
            <div className="space-y-2">
              {[
                ["R$600", "por mês"],
                ["R$7.200", "por ano"],
                ["R$36.000", "em 5 anos"],
              ].map(([val, label], i) => (
                <p key={i} className="text-lg" style={{ color: "#fff" }}>
                  → <strong style={{ color: "#f1c40f" }}>{val}</strong> {label}
                </p>
              ))}
            </div>
            <p className="text-lg mt-4 font-bold" style={{ color: "#fff" }}>
              Mas esses 5 anos começam hoje ou não começam.
            </p>
          </div>

          <CtaButton text="FAZER O TESTE ANTES QUE MINHA VAGA EXPIRE →" onClick={onNext} variant="yellow" />
        </div>
      </section>

      {/* SECTION 6 — 3 TESTIMONIALS */}
      <section className="w-full px-4 sm:px-6 py-12 sm:py-14" style={{ background: "#f8f9fa" }}>
        <div className="max-w-4xl mx-auto">
          <h2 className="text-[22px] sm:text-[24px] font-bold text-center mb-8" style={{ color: "#1a1a1a" }}>
            Veja o que aconteceu com quem fez o teste
          </h2>
          <div className="grid md:grid-cols-3 gap-5 mb-8">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="rounded-xl p-5 sm:p-6" style={{ background: "#fff", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
                <div className="flex items-center gap-3 mb-3">
                  <Avatar initials={t.initials} color={t.color} />
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
          <CtaButton text="EU QUERO FAZER O TESTE TAMBÉM →" onClick={onNext} />
        </div>
      </section>

      {/* SECTION 7 — OBJECTIONS */}
      <section className="w-full px-4 sm:px-6 py-12 sm:py-14" style={{ background: "#ffffff" }}>
        <div className="max-w-2xl mx-auto">
          <h2 className="text-[22px] sm:text-[24px] font-bold text-center mb-8" style={{ color: "#1a1a1a" }}>
            Suas dúvidas, respondidas
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
          <CtaButton text="TIREI MINHAS DÚVIDAS — QUERO FAZER O TESTE →" onClick={onNext} />
        </div>
      </section>

      {/* SECTION 8 — FINAL CTA */}
      <section
        className="w-full px-4 sm:px-6 py-16 sm:py-20 text-center"
        style={{ background: "linear-gradient(135deg, #1a1a1a 0%, #2c3e50 100%)" }}
      >
        <div className="max-w-xl mx-auto">
          <p className="text-[20px] sm:text-[22px] leading-[1.8] mb-6" style={{ color: "#fff" }}>
            Você trabalhou a vida inteira.
            <br />
            Pagou INSS por décadas.
            <br />
            O governo te devolveu uma miséria.
          </p>
          <p className="text-[18px] sm:text-[20px] font-bold leading-[1.8] mb-6" style={{ color: "#f1c40f" }}>
            A IA não te pede experiência.
            <br />
            Não te pede juventude.
            <br />
            Não te pede currículo.
          </p>
          <p className="text-[26px] sm:text-[28px] font-bold mb-8" style={{ color: "#fff" }}>
            Só te pede 2 minutos.
          </p>
          <CtaButton text="FAZER O TESTE AGORA — É 100% GRATUITO →" onClick={onNext} pulse large />
          <p className="text-sm mt-4" style={{ color: "#aaa" }}>
            <CheckCircle className="inline w-3.5 h-3.5 mr-1" style={{ color: "#27ae60" }} />
            Sem cadastro &bull;{" "}
            <CheckCircle className="inline w-3.5 h-3.5 mr-1" style={{ color: "#27ae60" }} />
            Sem cartão &bull;{" "}
            <CheckCircle className="inline w-3.5 h-3.5 mr-1" style={{ color: "#27ae60" }} />
            Resultado imediato
            <br />
            <span className="mt-1 inline-block">Sua análise ainda está disponível — não feche essa página</span>
          </p>
        </div>
      </section>

      {/* SECTION 9 — DISCLAIMER */}
      <footer className="w-full px-4 py-6 text-center" style={{ background: "#111" }}>
        <p className="text-[11px] max-w-[600px] mx-auto leading-relaxed" style={{ color: "#666" }}>
          *Os resultados apresentados são casos documentados e podem não representar o ganho típico de todos os usuários.
          O potencial calculado é baseado no perfil informado e não constitui garantia de renda. Resultados individuais
          variam conforme dedicação, perfil e condições individuais.
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

export default TikTokStep1Landing;
