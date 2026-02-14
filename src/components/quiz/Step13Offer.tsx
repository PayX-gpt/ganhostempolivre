import { useState, useEffect } from "react";
import { Shield, Lock, Zap, ArrowRight, Star, Users, Clock, CheckCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { CTAButton, TrustBadge, VideoPlaceholder } from "./QuizUI";
import type { QuizAnswers } from "./QuizUI";
import mentorPhoto from "@/assets/mentor-new.webp";
import bonusStack from "@/assets/bonus-stack.jpg";
import guaranteeSeal from "@/assets/guarantee-seal.jpg";
import giftBox from "@/assets/gift-box.jpg";
import chatgptLogo from "@/assets/chatgpt-logo.webp";
import feedback1 from "@/assets/feedback-1.png";
import feedback2 from "@/assets/feedback-2.jpg";
import feedback3 from "@/assets/feedback-3.jpg";
import feedback4 from "@/assets/feedback-4.jpg";
import avatarAntonio from "@/assets/avatar-antonio.jpg";
import avatarClaudia from "@/assets/avatar-claudia.jpg";
import avatarCarlos from "@/assets/avatar-carlos.jpg";
import avatarJose from "@/assets/avatar-jose.jpg";
import avatarLucia from "@/assets/avatar-lucia.jpg";
import avatarRegina from "@/assets/avatar-regina.jpg";

interface Step13Props {
  userName?: string;
  answers?: QuizAnswers;
}

/* ─── Reusable CTA Block ─── */
const CTABlock = ({ showCTA, context }: { showCTA: boolean; context?: string }) =>
  showCTA ? (
    <div className="w-full space-y-3">
      <div className="text-center space-y-1">
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">CHAVE TOKEN CHATGPT</p>
        <p className="text-3xl sm:text-4xl font-display font-bold text-foreground">
          R$<span className="text-gradient-green">66,83</span>
        </p>
        <p className="text-sm text-muted-foreground">ou 12x de R$6,64</p>
      </div>
      <CTAButton onClick={() => window.open("#", "_blank")} variant="accent" className="animate-bounce-subtle text-lg sm:text-xl tracking-wider">
        🔑 ATIVAR MINHA CHAVE TOKEN — R$66,83
      </CTAButton>
      <div className="flex items-center justify-center gap-2">
        <Lock className="w-3.5 h-3.5 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">
          {context || "Pagamento 100% seguro · Acesso imediato"}
        </p>
      </div>
    </div>
  ) : (
    <div className="text-center space-y-2 py-4">
      <div className="w-10 h-10 rounded-full border-[3px] border-primary/30 border-t-primary animate-spin mx-auto" />
      <p className="text-base text-muted-foreground animate-pulse">
        Assista o vídeo para liberar seu acesso...
      </p>
    </div>
  );

/* ─── Urgency Strip (sticky) ─── */
const UrgencyStrip = ({ minutes, seconds, show }: { minutes: number; seconds: number; show: boolean }) => {
  if (!show) return null;
  return (
    <div className="w-full rounded-2xl overflow-hidden border border-destructive/40">
      <div className="bg-destructive/15 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-destructive animate-pulse" />
          <span className="text-xs sm:text-sm font-bold text-destructive uppercase tracking-wider">Vaga reservada</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-destructive" />
          <span className="text-lg sm:text-xl font-display font-bold text-foreground tabular-nums">
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </span>
        </div>
      </div>
      <div className="bg-destructive/5 px-4 py-2">
        <p className="text-xs text-muted-foreground text-center">
          Sua condição especial de <span className="font-bold text-foreground">R$66,83</span> expira quando o timer zerar. Depois disso, volta para R$297.
        </p>
      </div>
    </div>
  );
};

/* ─── Profile Analysis Card ─── */
const ProfileAnalysis = ({ answers, firstName }: { answers?: QuizAnswers; firstName: string }) => {
  const getObstacleLabel = (o?: string) => {
    const map: Record<string, string> = {
      medo: "Medo de errar", tempo: "Falta de tempo",
      inicio: "Não sabe por onde começar", dinheiro: "Pouco capital inicial",
    };
    return map[o || ""] || "—";
  };

  const getGoalLabel = (g?: string) => {
    const map: Record<string, string> = {
      "50-100": "R$50–R$100/dia", "100-300": "R$100–R$300/dia",
      "300-500": "R$300–R$500/dia", "500+": "+R$500/dia",
    };
    return map[g || ""] || "Renda extra diária";
  };

  const getDeviceLabel = (d?: string) => {
    const map: Record<string, string> = { celular: "📱 Celular", computador: "💻 Computador", ambos: "📱💻 Ambos" };
    return map[d || ""] || "📱 Celular";
  };

  const getAvailabilityLabel = (a?: string) => {
    const map: Record<string, string> = {
      menos30: "< 30 min/dia", "30-60": "30–60 min/dia",
      "1-2h": "1–2h/dia", "2h+": "+2h/dia",
    };
    return map[a || ""] || "Flexível";
  };

  const items = [
    { label: "Meta", value: getGoalLabel(answers?.incomeGoal), highlight: true },
    { label: "Desafio", value: getObstacleLabel(answers?.obstacle) },
    { label: "Dispositivo", value: getDeviceLabel(answers?.device) },
    { label: "Tempo", value: getAvailabilityLabel(answers?.availability) },
  ];

  return (
    <div className="w-full space-y-3">
      {/* Approved badge */}
      <div className="flex items-center justify-center gap-2 py-2">
        <div className="flex items-center gap-2 bg-primary/15 border border-primary/30 rounded-full px-4 py-2">
          <CheckCircle className="w-5 h-5 text-primary" />
          <span className="text-sm font-bold text-primary">PERFIL APROVADO</span>
        </div>
      </div>

      <div className="funnel-card border-primary/30 bg-primary/5 space-y-3">
        <p className="text-sm text-muted-foreground text-center">
          {firstName ? `${firstName}, com` : "Com"} base nas suas respostas, seu perfil foi aprovado para acessar a plataforma:
        </p>
        <div className="grid grid-cols-2 gap-2">
          {items.map((item, i) => (
            <div key={i} className={`rounded-xl p-3 text-center ${item.highlight ? "bg-primary/10 border border-primary/20" : "bg-secondary/50"}`}>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{item.label}</p>
              <p className={`text-sm font-bold ${item.highlight ? "text-primary" : "text-foreground"}`}>{item.value}</p>
            </div>
          ))}
        </div>
        <div className="bg-card rounded-xl p-3 border border-border">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-accent" />
            <span className="text-xs font-bold text-accent">COMPATIBILIDADE: 97%</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Seu perfil é altamente compatível com o método. Alunos semelhantes geram em média {getGoalLabel(answers?.incomeGoal)} nos primeiros 30 dias.
          </p>
        </div>
      </div>
    </div>
  );
};

/* ─── Bonus Card ─── */
const BonusCard = ({ number, title, value, description }: { number: number; title: string; value: string; description: string }) => (
  <div className="funnel-card border-accent/20 bg-accent/5 space-y-2">
    <div className="flex items-center justify-between">
      <span className="text-xs font-bold text-accent bg-accent/15 px-2.5 py-1 rounded-full">
        🎁 BÔNUS #{number}
      </span>
      <span className="text-xs text-muted-foreground line-through">{value}</span>
    </div>
    <p className="font-bold text-foreground text-base">{title}</p>
    <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
  </div>
);

/* ─── Testimonial Card ─── */
const TestimonialCard = ({ name, age, city, avatar, text, result }: { name: string; age: string; city: string; avatar: string; text: string; result?: string }) => (
  <div className="funnel-card border-primary/15 space-y-3">
    <div className="flex items-center gap-3">
      <img src={avatar} alt={name} className="w-12 h-12 rounded-full object-cover border-2 border-primary/30" />
      <div className="flex-1">
        <p className="font-bold text-base text-foreground">{name}, {age}</p>
        <p className="text-xs text-muted-foreground">{city}</p>
      </div>
      {result && (
        <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-full shrink-0">{result}</span>
      )}
    </div>
    <p className="text-sm text-foreground/85 italic leading-relaxed">"{text}"</p>
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-accent text-accent" />)}
    </div>
  </div>
);

/* ─── FAQ Item ─── */
const FAQItem = ({ question, answer }: { question: string; answer: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left cursor-pointer hover:bg-secondary/50 transition-colors"
      >
        <span className="font-semibold text-foreground text-sm pr-4">{question}</span>
        <span className="text-muted-foreground text-xl shrink-0 transition-transform duration-200" style={{ transform: open ? "rotate(45deg)" : "rotate(0)" }}>+</span>
      </button>
      {open && (
        <div className="px-4 pb-4 animate-fade-in">
          <p className="text-sm text-muted-foreground leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
};

/* ─── People Like You (dynamic social proof) ─── */
const PeopleLikeYou = ({ answers }: { answers?: QuizAnswers }) => {
  const getObstacleContext = (obstacle?: string) => {
    const map: Record<string, { hook: string; stories: { name: string; age: string; avatar: string; text: string; result: string }[] }> = {
      medo: {
        hook: "também tinham medo de cair em golpe — até que arriscaram uma última vez:",
        stories: [
          { name: "José Almeida", age: "55", avatar: avatarAntonio, result: "R$147/dia", text: "Já tinha perdido dinheiro duas vezes. Quase não entrei. Mas quando caiu o primeiro Pix, eu chorei. Não de alegria — de alívio." },
          { name: "Cláudia Reis", age: "48", avatar: avatarClaudia, result: "R$89/dia", text: "Minha filha insistiu. Eu dizia que era golpe. Entrei desconfiada. Quando vi o resultado na primeira semana, pedi desculpas pra ela." },
          { name: "Marcos Oliveira", age: "58", avatar: avatarCarlos, result: "R$210/dia", text: "Perdi meu emprego com 52 anos. Ninguém contrata nessa idade. Quando vi que dava pra fazer do celular, sem aparecer... mudou tudo." },
        ],
      },
      tempo: {
        hook: "também achavam que não tinham tempo — até descobrirem que 10 minutos bastam:",
        stories: [
          { name: "Roberto Lima", age: "43", avatar: avatarCarlos, result: "R$180/dia", text: "Trabalho o dia inteiro. Faço tudo em 10 minutos antes de dormir. Minha esposa nem acredita que gera renda." },
          { name: "Sandra Costa", age: "40", avatar: avatarClaudia, result: "R$95/dia", text: "Sou mãe solo, dois filhos. Meu tempo livre é zero. Opero no intervalo do almoço e já não dependo de ninguém." },
          { name: "Paulo Mendes", age: "47", avatar: avatarAntonio, result: "R$230/dia", text: "Aposentei mas faço bico. Achava que ia ser mais uma coisa estressante. Levo menos tempo que assistir uma novela." },
        ],
      },
      inicio: {
        hook: "também se sentiam completamente perdidos — até receberem o suporte certo:",
        stories: [
          { name: "José Almeida", age: "55", avatar: avatarAntonio, result: "R$147/dia", text: "Nunca mexi com nada online. Mal sei usar WhatsApp. O suporte me pegou pela mão. Hoje opero sozinho." },
          { name: "Cláudia Reis", age: "48", avatar: avatarClaudia, result: "R$89/dia", text: "Tinha medo de apertar o botão errado. O suporte respondeu cada dúvida. Em 3 dias já tava fazendo sozinha." },
          { name: "Marcos Oliveira", age: "58", avatar: avatarCarlos, result: "R$210/dia", text: "Me sentia burro. Mas aqui ninguém te julga. Te ensinam quantas vezes precisar. Hoje eu ajudo os novatos." },
        ],
      },
      dinheiro: {
        hook: "também achavam que precisavam de muito dinheiro — e se surpreenderam:",
        stories: [
          { name: "Roberto Lima", age: "43", avatar: avatarCarlos, result: "R$180/dia", text: "Achei que precisava de milhares. Quando vi que dava pra começar com pouco, entendi que era pra gente como eu." },
          { name: "Sandra Costa", age: "40", avatar: avatarClaudia, result: "R$95/dia", text: "Tava devendo o cartão. Juntei o pouco que tinha e arrisquei. No terceiro dia já tinha recuperado tudo." },
          { name: "Paulo Mendes", age: "47", avatar: avatarAntonio, result: "R$230/dia", text: "Aposentadoria de um salário mínimo. Em uma semana já tava no positivo. Hoje vivo tranquilo." },
        ],
      },
    };
    return map[obstacle || ""] || map["medo"];
  };

  const ctx = getObstacleContext(answers?.obstacle);

  return (
    <div className="w-full space-y-4">
      <h3 className="font-display text-lg font-bold text-foreground text-center leading-snug">
        Pessoas com o <span className="text-gradient-green">mesmo perfil que o seu</span>
      </h3>
      <p className="text-sm text-muted-foreground text-center">
        Eles {ctx.hook}
      </p>
      <div className="space-y-3">
        {ctx.stories.map((p, i) => (
          <TestimonialCard key={i} name={p.name} age={`${p.age} anos`} city="" avatar={p.avatar} text={p.text} result={p.result} />
        ))}
      </div>
    </div>
  );
};

/* ─── Earnings Projection ─── */
const EarningsProjection = ({ answers, firstName }: { answers?: QuizAnswers; firstName: string }) => {
  const getGoalValues = (goal?: string) => {
    const map: Record<string, { daily: number }> = {
      "50-100": { daily: 75 }, "100-300": { daily: 200 },
      "300-500": { daily: 400 }, "500+": { daily: 600 },
    };
    return map[goal || ""] || { daily: 200 };
  };

  const { daily } = getGoalValues(answers?.incomeGoal);
  const projections = [
    { period: "Semana 1", value: Math.round(daily * 0.3), bar: 15, label: "Primeiros resultados" },
    { period: "Semana 2", value: Math.round(daily * 0.5), bar: 30, label: "Ganhando consistência" },
    { period: "Mês 1", value: Math.round(daily * 0.7 * 30), bar: 55, label: "Renda mensal sólida" },
    { period: "Mês 2", value: Math.round(daily * 0.85 * 30), bar: 75, label: "Crescimento acelerado" },
    { period: "Mês 3", value: Math.round(daily * 1 * 30), bar: 100, label: "Meta atingida" },
  ];

  return (
    <div className="w-full funnel-card border-primary/20 bg-card space-y-4">
      <div className="text-center">
        <p className="text-xs uppercase tracking-wider text-primary font-bold mb-1">PROJEÇÃO PERSONALIZADA</p>
        <h3 className="font-display text-lg font-bold text-foreground leading-snug">
          {firstName ? `${firstName}, ` : ""}O que esperar nos próximos 90 dias
        </h3>
      </div>
      <div className="space-y-3">
        {projections.map((p, i) => (
          <div key={i} className="space-y-1">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-sm font-semibold text-foreground">{p.period}</span>
                <span className="text-xs text-muted-foreground ml-2">— {p.label}</span>
              </div>
              <span className="text-sm font-bold text-primary tabular-nums">R${p.value.toLocaleString("pt-BR")}</span>
            </div>
            <div className="w-full h-2.5 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full progress-bar-fill rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${p.bar}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="bg-primary/10 rounded-xl p-3 border border-primary/20 text-center">
        <p className="text-sm text-foreground font-medium">
          📈 Potencial em 90 dias: até <span className="text-primary font-bold text-lg">R${(daily * 30).toLocaleString("pt-BR")}</span>/mês
        </p>
      </div>
      <p className="text-[10px] text-muted-foreground/50 text-center">
        *Projeção baseada na média de resultados de alunos com perfil semelhante. Resultados individuais podem variar.
      </p>
    </div>
  );
};

/* ─── WhatsApp Welcome Preview ─── */
const WhatsAppWelcome = ({ firstName }: { firstName: string }) => {
  const name = firstName || "Aluno(a)";
  return (
    <div className="w-full space-y-3">
      <h3 className="font-display text-lg font-bold text-foreground text-center leading-snug">
        Isso é o que vai acontecer <span className="text-gradient-green">nos próximos 5 minutos</span>
      </h3>
      <p className="text-sm text-muted-foreground text-center">
        Assim que confirmar, você recebe essa mensagem no seu celular:
      </p>
      <div className="rounded-xl overflow-hidden border border-border shadow-xl" style={{ backgroundColor: "#111b21" }}>
        <div className="bg-[#1f2c34] px-3 py-2 flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#aebac1"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" transform="rotate(180 12 12)"/></svg>
          <img src={mentorPhoto} alt="Suporte" className="w-8 h-8 rounded-full object-cover" />
          <div>
            <p className="text-[#e9edef] text-sm font-normal">Suporte Alfa Híbrida</p>
            <p className="text-[#8696a0] text-[11px]">online</p>
          </div>
        </div>
        <div className="px-3 py-3 space-y-1" style={{ backgroundColor: "#0b141a" }}>
          <div className="flex justify-center mb-2">
            <span className="bg-[#182229] text-[#8696a0] text-[11px] px-3 py-1 rounded-lg">HOJE</span>
          </div>
          {[
            `Olá ${name}! Seja muito bem-vindo(a) à família Alfa Híbrida! 🎉`,
            `Meu nome é Ana e vou ser sua mentora pessoal.`,
            `Já liberei seu acesso completo. Vou te mandar o link agora 👇`,
            `Qualquer dúvida, me chama aqui. Estou aqui pra te ajudar em cada passo.`,
            `Amanhã já quero ver seu primeiro resultado! 💰`,
          ].map((text, i) => (
            <div key={i} className="flex justify-start mb-[3px]">
              <div className="max-w-[85%] bg-[#202c33] text-[#e9edef] px-[9px] py-[6px] rounded-[7.5px] rounded-tl-none text-[14px] leading-[19px]">
                <span>{text}</span>
                <span className="text-[11px] text-[#ffffff99] ml-2 float-right mt-[3px]">09:01</span>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-[#1f2c34] px-2 py-2 flex items-center gap-2">
          <div className="flex-1 bg-[#2a3942] rounded-full px-4 py-2">
            <span className="text-[#8696a0] text-sm">Mensagem</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-[#00a884] flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/></svg>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Video Testimonials Section ─── */
const VIDEO_TESTIMONIALS = [
  { id: "6844c2bcefb07ec7d1f69f35", padding: "56.42633228840125%", sdk: "v1" },
  { id: "681528f68fced9179fa2e1c3", padding: "56.25%", sdk: "v1" },
  { id: "68152914abe4fd17b1dc4ad1", padding: "56.25%", sdk: "v1" },
  { id: "692bc7a9eb5ec5285cecf25c", padding: "56.25%", sdk: "v4" },
];

const VideoTestimonialsSection = () => {
  useEffect(() => {
    const s1 = document.createElement("script");
    s1.src = "https://scripts.converteai.net/lib/js/smartplayer/v1/sdk.min.js";
    s1.async = true;
    document.head.appendChild(s1);
    const s4 = document.createElement("script");
    s4.src = "https://scripts.converteai.net/lib/js/smartplayer-wc/v4/sdk.js";
    s4.async = true;
    document.head.appendChild(s4);

    VIDEO_TESTIMONIALS.filter(v => v.sdk === "v1").forEach(v => {
      const iframe = document.getElementById(`ifr_${v.id}`) as HTMLIFrameElement;
      if (iframe) {
        iframe.src = `https://scripts.converteai.net/09ec79a4-c31f-44ce-ba7d-89003424c826/players/${v.id}/embed.html` +
          (window.location.search || "?") + "&vl=" + encodeURIComponent(window.location.href);
      }
    });
    const v4 = VIDEO_TESTIMONIALS.find(v => v.sdk === "v4");
    if (v4) {
      const iframe = document.getElementById(`ifr_${v4.id}`) as HTMLIFrameElement;
      if (iframe && iframe.src === "about:blank") {
        iframe.src = `https://scripts.converteai.net/09ec79a4-c31f-44ce-ba7d-89003424c826/players/${v4.id}/v4/embed.html` +
          (window.location.search || "?") + "&vl=" + encodeURIComponent(window.location.href);
      }
    }
    return () => { s1.remove(); s4.remove(); };
  }, []);

  return (
    <div className="w-full space-y-4">
      {VIDEO_TESTIMONIALS.map((v) => (
        <div key={v.id} className="w-full rounded-2xl overflow-hidden border border-border">
          <div id={`ifr_${v.id}_wrapper`} style={{ margin: "0 auto", width: "100%" }}>
            <div style={{ padding: `${v.padding} 0 0 0`, position: "relative" }} id={`ifr_${v.id}_aspect`}>
              <iframe
                frameBorder="0"
                allowFullScreen
                src="about:blank"
                id={`ifr_${v.id}`}
                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
                referrerPolicy="origin"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

/* ─── Section Divider ─── */
const Divider = () => (
  <div className="w-full flex items-center gap-4 py-1">
    <div className="flex-1 h-px bg-border" />
    <span className="text-muted-foreground/30 text-lg">•</span>
    <div className="flex-1 h-px bg-border" />
  </div>
);

/* ═══════════════════════════════════════════════════════════
   MAIN OFFER PAGE
   Structured following elite direct response frameworks:
   Hook → Story → Offer → Close
   ═══════════════════════════════════════════════════════════ */
const Step13Offer = ({ userName, answers }: Step13Props) => {
  const [showCTA, setShowCTA] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900);
  const [spotsLeft] = useState(() => Math.floor(Math.random() * 4) + 3); // 3-6

  useEffect(() => {
    const timer = setTimeout(() => setShowCTA(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const s = document.createElement("script");
    s.src = "https://scripts.converteai.net/lib/js/smartplayer-wc/v4/sdk.js";
    s.async = true;
    document.head.appendChild(s);
    const iframe = document.getElementById("ifr_687c23666137406f142acebc") as HTMLIFrameElement;
    if (iframe && iframe.src === "about:blank") {
      iframe.src = "https://scripts.converteai.net/09ec79a4-c31f-44ce-ba7d-89003424c826/players/687c23666137406f142acebc/v4/embed.html" +
        (window.location.search || "?") + "&vl=" + encodeURIComponent(window.location.href);
    }
    return () => { s.remove(); };
  }, []);

  useEffect(() => {
    const countdown = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(countdown);
  }, []);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const firstName = userName?.split(" ")[0] || "";

  const bonuses = [
    { title: "Guia: Primeiro Resultado em 24h", value: "R$97", description: "Passo a passo simplificado pra você ver dinheiro na conta ainda hoje. Sem enrolação." },
    { title: "Comunidade VIP no WhatsApp", value: "R$147", description: "Grupo exclusivo com +36.000 alunos que se ajudam todos os dias. Nunca mais fique sozinho." },
    { title: "Planilha de Controle Financeiro", value: "R$47", description: "Acompanhe seus ganhos diários de forma simples. Feita pra quem nunca mexeu com planilha." },
    { title: "Aulas: Segurança Digital", value: "R$97", description: "Aprenda a se proteger de golpes online e usar o celular com confiança total." },
    { title: "Suporte Humano por 90 Dias", value: "R$197", description: "Gente de verdade te ajudando. Sem robô, sem espera. Resposta em minutos." },
    { title: "Plano Personalizado pro Seu Perfil", value: "R$297", description: "Com base nas suas respostas, criamos um plano sob medida pra sua rotina e meta." },
  ];

  const faqs = [
    { question: "Preciso ter experiência com internet?", answer: "Não. O método foi criado pra quem nunca fez nada online. Se você usa WhatsApp, você consegue. Tudo é explicado do zero com suporte humano." },
    { question: "Funciona pelo celular mesmo?", answer: "Sim, 100%. A maioria dos nossos 36.000 alunos usa apenas o celular. Não precisa de computador nem internet rápida." },
    { question: "Em quanto tempo vejo resultado?", answer: "Muitos alunos fazem a primeira operação e veem resultado no mesmo dia. O método foi feito pra gerar renda no curto prazo." },
    { question: "E se eu não gostar? Perco meu dinheiro?", answer: "Impossível. Você tem 30 dias de garantia total. Se não gostar, devolvemos cada centavo. Sem perguntas, sem burocracia." },
    { question: "R$66,83 é o preço final? Tem taxa escondida?", answer: "R$66,83 é o valor total. Não existe mensalidade, taxa extra, ou venda dentro da plataforma. Pagou uma vez, acesso completo." },
    { question: "Já fui enganado na internet. Isso é golpe?", answer: "Entendemos. Por isso: garantia de 30 dias, suporte humano real, +36.000 alunos ativos, e você pode testar sem risco nenhum." },
    { question: "Preciso investir mais dinheiro depois?", answer: "Não. O método ensina a gerar renda sem investimento. O único valor é R$66,83. Depois disso, tudo que ganhar é lucro líquido." },
  ];

  const testimonials = [
    { name: "Sebastião Moreira", age: "57 anos", city: "Manaus, AM", avatar: avatarJose, text: "Minha aposentadoria não cobria o aluguel. Vivia contando moeda. Hoje tenho uma renda extra que me devolveu a dignidade de não precisar pedir nada a ninguém.", result: "R$147/dia" },
    { name: "Regina Aparecida", age: "44 anos", city: "Campinas, SP", avatar: avatarRegina, text: "Fui demitida depois de 18 anos. Com dois filhos, o desespero bateu. Em duas semanas já tinha pagado a conta de luz que tava cortada.", result: "R$210/dia" },
    { name: "Luciana Borges", age: "50 anos", city: "Fortaleza, CE", avatar: avatarLucia, text: "Meu marido ria de mim quando disse que ia ganhar dinheiro pelo celular. Hoje ele me pede pra ensinar. Marcamos a viagem que sonhávamos há anos.", result: "R$180/dia" },
  ];

  return (
    <div className="animate-slide-up flex flex-col items-center w-full max-w-lg mx-auto px-4 sm:px-5 py-5 sm:py-6 gap-5 sm:gap-6">

      {/* ═══ 1. URGENCY TIMER ═══ */}
      <UrgencyStrip minutes={minutes} seconds={seconds} show={true} />

      {/* ═══ 2. PROFILE ANALYSIS (approved status) ═══ */}
      <ProfileAnalysis answers={answers} firstName={firstName} />

      {/* ═══ 3. HERO HEADLINE ═══ */}
      <div className="text-center space-y-3">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground leading-snug">
          {firstName ? `${firstName}, sua` : "Sua"} chave de acesso está pronta.
        </h2>
        <p className="text-base sm:text-lg text-foreground/90 leading-relaxed">
          Falta <span className="text-primary font-bold">um único passo</span> pra você começar a gerar renda extra todos os dias — direto do seu celular.
        </p>
        <p className="text-sm text-muted-foreground">
          Assista o vídeo abaixo e entenda como funciona em 4 minutos:
        </p>
      </div>

      {/* ═══ 3b. VSL VIDEO (ConverteAI) ═══ */}
      <div className="w-full rounded-2xl overflow-hidden border border-border">
        <div id="ifr_687c23666137406f142acebc_wrapper" style={{ margin: "0 auto", width: "100%" }}>
          <div style={{ position: "relative", padding: "56.25% 0 0 0" }} id="ifr_687c23666137406f142acebc_aspect">
            <iframe
              frameBorder="0"
              allowFullScreen
              src="about:blank"
              id="ifr_687c23666137406f142acebc"
              style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
              referrerPolicy="origin"
            />
          </div>
        </div>
      </div>

      {/* ═══ 3c. EXPLICAÇÃO DA TAXA (compacta) ═══ */}
      <div className="w-full text-center space-y-2">
        <p className="text-sm text-muted-foreground leading-relaxed">
          ⚠️ O valor de <span className="text-primary font-bold">R$66,83</span> é apenas a <span className="font-bold text-foreground">taxa dos tokens do ChatGPT</span> que a plataforma consome. Nós <span className="font-bold text-foreground">não ficamos com nenhum centavo</span> — só cobramos <span className="text-primary font-bold">2% dos seus lucros</span> após 30 dias.
        </p>
      </div>

      {/* ═══ 5. MENTOR CREDIBILITY ═══ */}
      <div className="flex gap-4 w-full funnel-card border-primary/20 bg-primary/5">
        <img src={mentorPhoto} alt="Ricardo" className="w-14 h-14 rounded-full object-cover border-2 border-primary/40 shrink-0" />
        <div>
          <p className="text-sm text-foreground/90 italic leading-relaxed">
            "{firstName ? `${firstName}, ` : ""}Eu sei que você já foi enganado antes. Por isso eu coloco minha cara. Se você não tiver resultado em 30 dias, eu devolvo seu dinheiro pessoalmente. Sem joguinho."
          </p>
          <p className="text-muted-foreground text-xs mt-2 not-italic font-semibold">— Ricardo Almeida • Criador do método • +36.000 alunos</p>
        </div>
      </div>

      {/* ═══ 6. CTA 1 ═══ */}
      <CTABlock showCTA={showCTA} context="Restam apenas poucas vagas hoje" />

      <Divider />

      {/* ═══ 7. SOCIAL PROOF (people like you) ═══ */}
      <PeopleLikeYou answers={answers} />

      {/* ═══ 8. EARNINGS PROJECTION ═══ */}
      <EarningsProjection answers={answers} firstName={firstName} />

      {/* ═══ 9. CTA 2 ═══ */}
      <CTABlock showCTA={showCTA} />

      <Divider />

      {/* ═══ 10. VALUE STACK — What you get ═══ */}
      <div className="w-full space-y-4">
        <div className="text-center">
          <p className="text-xs uppercase tracking-wider text-accent font-bold mb-1">ACESSO COMPLETO</p>
          <h3 className="font-display text-xl font-bold text-foreground">Tudo que você recebe hoje:</h3>
        </div>
        {[
          { text: "Acesso vitalício à plataforma Alfa Híbrida", value: "R$497" },
          { text: "Método passo a passo — do zero ao resultado", value: "R$297" },
          { text: "Vídeo-aulas em linguagem simples e direta", value: "R$197" },
          { text: "Suporte humano em tempo real via WhatsApp", value: "R$197" },
          { text: "Comunidade exclusiva com +36.000 alunos", value: "R$147" },
          { text: "Plano personalizado pro seu perfil", value: "R$297" },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0">
            <CheckCircle className="w-5 h-5 text-primary shrink-0" />
            <p className="text-sm text-foreground leading-snug flex-1">{item.text}</p>
            <span className="text-xs text-muted-foreground line-through shrink-0">{item.value}</span>
          </div>
        ))}
        <div className="text-center pt-2">
          <p className="text-sm text-muted-foreground">Valor total da plataforma:</p>
          <p className="text-lg text-muted-foreground line-through">R$1.632,00</p>
        </div>
      </div>

      <Divider />

      {/* ═══ 11. BONUS STACKING ═══ */}
      <div className="w-full space-y-4">
        <div className="text-center">
          <img src={giftBox} alt="Presente" className="w-20 h-20 object-contain mx-auto mb-2" />
          <p className="text-xs uppercase tracking-wider text-accent font-bold mb-1">BÔNUS EXCLUSIVOS</p>
          <h3 className="font-display text-xl font-bold text-foreground">
            E mais: <span className="text-accent">6 bônus</span> pra você sair na frente
          </h3>
          <p className="text-sm text-muted-foreground mt-1">Inclusos no seu acesso. Sem pagar nada a mais.</p>
        </div>

        

        {bonuses.map((b, i) => (
          <BonusCard key={i} number={i + 1} {...b} />
        ))}

        <div className="funnel-card border-accent/30 bg-accent/5 text-center space-y-1">
          <p className="text-sm text-muted-foreground">Valor total dos bônus:</p>
          <p className="text-xl text-muted-foreground line-through font-semibold">R$882,00</p>
          <p className="text-lg font-bold text-accent">🎁 Hoje: GRÁTIS com seu acesso</p>
        </div>
      </div>

      {/* ═══ 12. CTA 3 ═══ */}
      <CTABlock showCTA={showCTA} />

      <Divider />

      {/* ═══ 13. PRICE ANCHOR (why R$66) ═══ */}
      <div className="w-full space-y-5">
        <div className="text-center space-y-2">
          <h3 className="font-display text-xl font-bold text-foreground">
            Tudo isso por <span className="text-gradient-green">quanto?</span>
          </h3>
          <p className="text-sm text-muted-foreground">
            Vamos fazer as contas juntos:
          </p>
        </div>

        {/* Price comparison */}
        <div className="funnel-card border-border space-y-3">
          <div className="flex justify-between items-center py-1.5 border-b border-border/50">
            <span className="text-sm text-muted-foreground">Plataforma completa</span>
            <span className="text-sm text-muted-foreground line-through">R$1.632</span>
          </div>
          <div className="flex justify-between items-center py-1.5 border-b border-border/50">
            <span className="text-sm text-muted-foreground">6 bônus exclusivos</span>
            <span className="text-sm text-muted-foreground line-through">R$882</span>
          </div>
          <div className="flex justify-between items-center py-1.5 border-b border-border/50">
            <span className="text-sm text-muted-foreground">Suporte humano 90 dias</span>
            <span className="text-sm text-muted-foreground line-through">R$197</span>
          </div>
          <div className="flex justify-between items-center py-1.5">
            <span className="text-sm font-bold text-foreground">Valor total real</span>
            <span className="text-sm font-bold text-muted-foreground line-through">R$2.711</span>
          </div>
        </div>

        {/* AI cost explanation */}
        <div className="funnel-card border-primary/25 bg-card text-center space-y-4">
          <img src={chatgptLogo} alt="ChatGPT" className="w-10 h-10 object-contain mx-auto rounded-xl" />
          <p className="text-sm text-muted-foreground leading-relaxed text-left">
            A plataforma usa a <span className="font-bold text-foreground">inteligência artificial do ChatGPT</span> pra trabalhar por você.
            Cada operação consome <span className="font-bold text-foreground">tokens de IA</span> — e esses tokens têm custo real.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed text-left">
            O valor abaixo é <span className="font-bold text-foreground">apenas a taxa do token</span>.
            Nós <span className="text-primary font-bold">não ficamos com nenhum centavo</span> desse pagamento.
          </p>
          <div className="bg-primary/10 rounded-xl p-3 border border-primary/20 text-left">
            <p className="text-sm text-foreground leading-relaxed">
              <span className="font-bold">Como ganhamos?</span> Só depois de 30 dias, quando você já estiver lucrando,
              cobramos apenas <span className="text-primary font-bold">2% dos seus lucros</span>.
              Ou seja: <span className="font-bold">só ganhamos quando você ganha.</span>
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Você paga apenas:</p>
            <p className="text-5xl sm:text-6xl font-display font-bold text-foreground">
              R$<span className="text-gradient-green">66,83</span>
            </p>
            <p className="text-base text-muted-foreground">ou <span className="font-semibold text-foreground">12x de R$6,64</span></p>
            <div className="bg-secondary/50 rounded-xl p-3">
              <p className="text-sm text-foreground font-medium">
                Isso dá <span className="text-primary font-bold">menos de R$2,23 por dia</span> — o preço de uma bala.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-2 pt-1">
            {["Pix (desconto)", "Cartão de Crédito", "Boleto"].map((m) => (
              <span key={m} className="text-xs bg-secondary px-3 py-1.5 rounded-full text-muted-foreground font-medium">{m}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ 14. CTA 4 ═══ */}
      <CTABlock showCTA={showCTA} context="Garantia incondicional de 30 dias" />

      <Divider />

      {/* ═══ 15. GUARANTEE (risk reversal) ═══ */}
      <div className="w-full funnel-card border-accent/30 bg-accent/5 space-y-4">
        <div className="flex items-start gap-4">
          <img src={guaranteeSeal} alt="Garantia" className="w-20 h-20 shrink-0 object-contain" />
          <div>
            <h3 className="font-display text-lg font-bold text-foreground">Garantia Blindada de 30 Dias</h3>
            <p className="text-xs text-accent font-bold uppercase tracking-wider mt-1">RISCO ZERO PRA VOCÊ</p>
          </div>
        </div>
        <p className="text-sm text-foreground/85 leading-relaxed">
          {firstName ? `${firstName}, funciona` : "Funciona"} assim: você entra, testa a plataforma por 30 dias inteiros.
          Se por <strong>qualquer motivo</strong> — mesmo que seja "não gostei da cor do botão" — achar que não é pra você,
          basta mandar <strong>uma única mensagem</strong> e devolvemos <strong>100% do seu dinheiro</strong>.
          Sem perguntas. Sem burocracia. Sem letra miúda.
        </p>
        <div className="bg-card rounded-xl p-3 border border-border">
          <p className="text-sm text-primary font-bold text-center">
            ✅ Ou você lucra, ou recebe seu dinheiro de volta. Simples assim.
          </p>
        </div>
      </div>

      <Divider />

      {/* ═══ 16. OBJECTION BREAKING ═══ */}
      <div className="w-full space-y-4">
        <h3 className="font-display text-xl font-bold text-foreground text-center">
          Talvez você ainda esteja pensando...
        </h3>

        {[
          {
            objection: '"Já tenho mais de 40, 50 anos... será que funciona pra mim?"',
            response: "A maioria dos nossos alunos tem entre 40 e 58 anos. O método foi desenhado pra quem não tem experiência com tecnologia. Se você usa WhatsApp, você já tem tudo que precisa.",
          },
          {
            objection: '"Já perdi dinheiro na internet antes..."',
            response: "Exatamente por isso existe a garantia de 30 dias. Você testa sem risco. Se não gostar, devolvo cada centavo. Diferente de golpe, aqui você tem proteção total.",
          },
          {
            objection: '"Não tenho dinheiro sobrando..."',
            response: "São R$66,83 uma única vez. Muitos alunos recuperam esse valor no primeiro dia. E se não recuperar em 30 dias, você recebe tudo de volta. Risco zero.",
          },
          {
            objection: '"Tenho medo de tecnologia..."',
            response: "Nosso suporte te acompanha em cada clique. Literalmente. Manda mensagem no WhatsApp e alguém responde em minutos. Você nunca vai ficar perdido.",
          },
        ].map((item, i) => (
          <div key={i} className="funnel-card border-border space-y-2">
            <p className="text-sm text-foreground/60 italic">{item.objection}</p>
            <div className="flex gap-2">
              <ArrowRight className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="text-sm text-foreground font-medium leading-relaxed">{item.response}</p>
            </div>
          </div>
        ))}
      </div>

      <Divider />

      {/* ═══ 17. TESTIMONIALS ═══ */}
      <div className="w-full space-y-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-2">
            {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-accent text-accent" />)}
          </div>
          <h3 className="font-display text-xl font-bold text-foreground">
            +36.000 alunos. Resultados reais.
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Não acredite em mim. Acredite neles:
          </p>
        </div>
        {testimonials.map((t, i) => (
          <TestimonialCard key={i} {...t} />
        ))}
      </div>

      <Divider />

      {/* ═══ 18. VIDEO TESTIMONIALS ═══ */}
      <div className="w-full space-y-3">
        <h3 className="font-display text-lg font-bold text-foreground text-center">
          Depoimentos em <span className="text-gradient-green">vídeo</span>
        </h3>
        <p className="text-sm text-muted-foreground text-center">
          Assista quem já mudou de vida:
        </p>
        <VideoTestimonialsSection />
      </div>

      <Divider />

      {/* ═══ 19. WHATSAPP FEEDBACK SCREENSHOTS ═══ */}
      <div className="w-full space-y-3">
        <h3 className="font-display text-lg font-bold text-foreground text-center">
          Prints <span className="text-gradient-green">reais</span> do WhatsApp
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {[feedback1, feedback2, feedback3, feedback4].map((img, i) => (
            <div key={i} className="rounded-xl overflow-hidden border border-border shadow-md hover:scale-[1.02] transition-transform">
              <img src={img} alt={`Feedback ${i + 1}`} className="w-full h-auto object-cover" />
            </div>
          ))}
        </div>
      </div>

      {/* ═══ 20. CTA 5 ═══ */}
      <CTABlock showCTA={showCTA} />

      <Divider />

      {/* ═══ 21. EMOTIONAL FUTURE PACING ═══ */}
      <div className="w-full funnel-card border-primary/20 bg-primary/5 space-y-4">
        <h3 className="font-display text-xl font-bold text-foreground text-center leading-snug">
          {firstName ? `${firstName}, fecha` : "Fecha"} os olhos e imagina...
        </h3>
        <div className="space-y-3">
          {[
            { emoji: "☀️", text: "Acordar e ver que já ganhou dinheiro — antes mesmo de tomar café" },
            { emoji: "💳", text: "Pagar todas as contas em dia, sem aquele aperto no peito" },
            { emoji: "👨‍👩‍👧‍👦", text: "Dar algo bom pra sua família sem precisar pensar duas vezes" },
            { emoji: "📱", text: "Olhar pro extrato do banco e sentir orgulho do que construiu" },
            { emoji: "🔓", text: "Não depender de ninguém. Ninguém. Nunca mais." },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="text-base shrink-0 mt-0.5">{item.emoji}</span>
              <p className="text-sm text-foreground leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground text-center italic pt-2">
          Tudo isso pode começar <span className="text-primary font-bold not-italic">hoje</span>. Por menos de R$2,20 por dia.
        </p>
      </div>

      <Divider />

      {/* ═══ 22. WHATSAPP WELCOME ═══ */}
      <WhatsAppWelcome firstName={firstName} />

      <Divider />

      {/* ═══ 23. FAQ ═══ */}
      <div className="w-full space-y-3">
        <h3 className="font-display text-xl font-bold text-foreground text-center">
          Perguntas Frequentes
        </h3>
        {faqs.map((faq, i) => (
          <FAQItem key={i} {...faq} />
        ))}
      </div>

      <Divider />

      {/* ═══ 24. FINAL URGENCY + CLOSE ═══ */}
      <div className="w-full space-y-5 text-center">
        <div className="funnel-card border-destructive/30 bg-destructive/5 space-y-3">
          <div className="flex items-center justify-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-destructive animate-pulse" />
            <p className="text-sm font-bold text-destructive uppercase tracking-wider">Última chance</p>
          </div>
          <p className="text-base font-bold text-foreground leading-snug">
            Essa condição de R$66,83 é exclusiva pra quem completou a análise agora.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Ao sair desta página, o valor volta para R$297 e os bônus são removidos.
          </p>
          <p className="text-3xl font-display font-bold text-foreground">
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </p>
        </div>

        <CTABlock showCTA={showCTA} context="Garantia de 30 dias · Acesso imediato · Suporte humano" />

        <TrustBadge>Pagamento 100% seguro · Garantia de 30 dias · Suporte em português</TrustBadge>

        <div className="flex flex-wrap justify-center gap-3 opacity-60 pt-2">
          {["Visa", "Mastercard", "Pix", "Boleto", "Elo", "Amex"].map((b) => (
            <span key={b} className="text-xs text-muted-foreground bg-secondary px-3 py-1 rounded-md">{b}</span>
          ))}
        </div>

        <p className="text-xs text-muted-foreground/50 pt-4 leading-relaxed">
          Este produto não garante a obtenção de resultados. Qualquer referência ao desempenho é uma estimativa baseada em resultados médios de alunos com perfis semelhantes.
          Resultados individuais podem variar conforme dedicação e outros fatores.
        </p>
      </div>
    </div>
  );
};

export default Step13Offer;
