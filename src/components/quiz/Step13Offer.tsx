import { useState, useEffect, useRef } from "react";
import { Cpu, CheckCircle, BarChart3, Clock, Shield, ChevronDown } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { CTAButton, TrustBadge, VideoPlaceholder } from "./QuizUI";
import type { QuizAnswers } from "./QuizUI";
import mentorPhoto from "@/assets/mentor-photo.jpg";
import bonusStack from "@/assets/bonus-stack.jpg";
import guaranteeSeal from "@/assets/guarantee-seal.jpg";
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
const CTABlock = ({ showCTA }: { showCTA: boolean }) =>
  showCTA ? (
    <div className="w-full space-y-3">
      <CTAButton onClick={() => window.open("#", "_blank")} variant="accent" className="animate-bounce-subtle text-xl">
        GARANTIR MEU ACESSO POR R$66
      </CTAButton>
      <p className="text-xs text-muted-foreground text-center">
        Pagamento 100% seguro via cartão, Pix ou boleto
      </p>
    </div>
  ) : (
    <div className="text-center space-y-2">
      <div className="w-10 h-10 rounded-full border-[3px] border-primary/30 border-t-primary animate-spin mx-auto" />
      <p className="text-base text-muted-foreground animate-pulse">
        Assista o vídeo para liberar seu acesso...
      </p>
    </div>
  );

/* ─── Section Divider ─── */
const Divider = () => (
  <div className="w-full flex items-center gap-4 py-2">
    <div className="flex-1 h-px bg-border" />
    <span className="text-muted-foreground/40 text-lg">•</span>
    <div className="flex-1 h-px bg-border" />
  </div>
);

/* ─── Profile Analysis Card ─── */
const ProfileAnalysis = ({ answers, firstName }: { answers?: QuizAnswers; firstName: string }) => {
  const getAgeLabel = (age?: string) => {
    // Step2Age passes the full label directly
    return age || "não informada";
  };

  const getObstacleLabel = (o?: string) => {
    const map: Record<string, string> = {
      medo: "Medo de errar de novo", tempo: "Falta de tempo",
      inicio: "Não sabe por onde começar", dinheiro: "Falta de dinheiro para investir",
    };
    return map[o || ""] || "não informado";
  };

  const getGoalLabel = (g?: string) => {
    const map: Record<string, string> = {
      "50-100": "R$50 a R$100 por dia", "100-300": "R$100 a R$300 por dia",
      "300-500": "R$300 a R$500 por dia", "500+": "Mais de R$500 por dia",
    };
    return map[g || ""] || "renda extra diária";
  };

  const getDeviceLabel = (d?: string) => {
    const map: Record<string, string> = {
      celular: "Celular / Smartphone", computador: "Computador ou Notebook", ambos: "Celular e computador",
    };
    return map[d || ""] || "Celular";
  };

  const getAvailabilityLabel = (a?: string) => {
    const map: Record<string, string> = {
      menos30: "Menos de 30 minutos", "30-60": "30 minutos a 1 hora",
      "1-2h": "1 a 2 horas por dia", "2h+": "Mais de 2 horas por dia",
    };
    return map[a || ""] || "Algumas horas por dia";
  };

  const profileItems = [
    { label: "Nome", value: firstName || "Aluno(a)" },
    { label: "Faixa etária", value: getAgeLabel(answers?.age) },
    { label: "Meta de renda", value: getGoalLabel(answers?.incomeGoal) },
    { label: "Principal desafio", value: getObstacleLabel(answers?.obstacle) },
    { label: "Dispositivo", value: getDeviceLabel(answers?.device) },
    { label: "Disponibilidade", value: getAvailabilityLabel(answers?.availability) },
  ];

  return (
    <div className="w-full funnel-card border-primary/25 bg-primary/5 space-y-3 sm:space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
        </div>
        <div className="min-w-0">
          <p className="font-bold text-foreground text-base sm:text-lg">Análise do seu perfil</p>
          <p className="text-xs sm:text-sm text-primary font-medium">Compatibilidade: 97%</p>
        </div>
      </div>
      <div className="space-y-1.5 sm:space-y-2">
        {profileItems.map((item, i) => (
          <div key={i} className="flex justify-between items-start gap-2 py-1 sm:py-1.5 border-b border-border/50 last:border-0">
            <span className="text-xs sm:text-sm text-muted-foreground shrink-0">{item.label}</span>
            <span className="text-xs sm:text-sm font-semibold text-foreground text-right max-w-[55%] sm:max-w-[60%] break-words">{item.value}</span>
          </div>
        ))}
      </div>
      <div className="bg-primary/10 rounded-xl p-2.5 sm:p-3 border border-primary/20">
        <p className="text-xs sm:text-sm text-foreground leading-relaxed">
          <span className="font-bold text-primary">Resultado da análise:</span>{" "}
          {firstName ? `${firstName}, seu` : "Seu"} perfil é ideal para o método. Com base nas suas respostas, 
          estimamos que você pode alcançar {getGoalLabel(answers?.incomeGoal)} nos primeiros 30 dias.
        </p>
      </div>
    </div>
  );
};

/* ─── Bonus Card ─── */
const BonusCard = ({ number, title, value, description }: { number: number; title: string; value: string; description: string }) => (
  <div className="funnel-card border-accent/20 bg-accent/5 space-y-2">
    <div className="flex items-center justify-between">
      <span className="text-xs font-bold text-accent bg-accent/15 px-2.5 py-1 rounded-full">
        BÔNUS #{number}
      </span>
      <span className="text-xs text-muted-foreground line-through">{value}</span>
    </div>
    <p className="font-bold text-foreground text-base">{title}</p>
    <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
  </div>
);

/* ─── Testimonial Card ─── */
const TestimonialCard = ({ name, age, city, avatar, text }: { name: string; age: string; city: string; avatar: string; text: string }) => (
  <div className="funnel-card border-primary/15 space-y-3">
    <div className="flex items-center gap-3">
      <img src={avatar} alt={name} className="w-12 h-12 rounded-full object-cover border-2 border-primary/30" />
      <div>
        <p className="font-bold text-base text-foreground">{name}, {age}</p>
        <p className="text-sm text-muted-foreground">{city}</p>
      </div>
    </div>
    <p className="text-base text-foreground/85 italic leading-relaxed">"{text}"</p>
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
        <span className="text-muted-foreground text-xl shrink-0 transition-transform" style={{ transform: open ? "rotate(45deg)" : "rotate(0)" }}>+</span>
      </button>
      {open && (
        <div className="px-4 pb-4 animate-fade-in">
          <p className="text-sm text-muted-foreground leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
};

/* ─── People Like You ─── */
const PeopleLikeYou = ({ answers }: { answers?: QuizAnswers }) => {
  const getAgePeople = (age?: string) => {
     const data56 = [
       { name: "José Almeida", age: "55", result: "R$147/dia em 2 semanas", avatar: avatarAntonio },
       { name: "Cláudia Reis", age: "48", result: "R$89/dia no primeiro mês", avatar: avatarClaudia },
       { name: "Marcos Oliveira", age: "58", result: "R$210/dia após 3 semanas", avatar: avatarCarlos },
     ];
     const data46 = [
       { name: "Roberto Lima", age: "43", result: "R$180/dia em 10 dias", avatar: avatarCarlos },
       { name: "Sandra Costa", age: "40", result: "R$95/dia no primeiro mês", avatar: avatarClaudia },
       { name: "Paulo Mendes", age: "47", result: "R$230/dia após 2 semanas", avatar: avatarAntonio },
     ];
    if (age?.includes("56") || age?.includes("mais")) return data56;
    if (age?.includes("46")) return data46;
    if (age?.includes("36")) return data46;
    return data56;
  };

  const getObstacleContext = (obstacle?: string) => {
    const map: Record<string, { subtitle: string; testimonials: Record<string, string> }> = {
      medo: {
        subtitle: "passaram pela mesma desconfiança que você — e hoje vivem uma realidade diferente:",
        testimonials: {
          t1: "\"Já tinha perdido dinheiro duas vezes na internet. Quase não entrei. Mas algo me dizia pra tentar mais uma vez... e foi a melhor decisão da minha vida. Hoje pago todas as contas e ainda sobra.\"",
          t2: "\"Minha filha insistiu pra eu tentar. Eu dizia que era golpe. Entrei desconfiado, com o pé atrás. Quando caiu o primeiro Pix, eu chorei. Não de alegria — de alívio.\"",
          t3: "\"Perdi meu emprego com 52 anos. Ninguém contrata nessa idade. Tinha vergonha de pedir ajuda. Quando vi que dava pra fazer do celular, sem aparecer, sem falar com ninguém... mudou tudo.\"",
        },
      },
      tempo: {
        subtitle: "também achavam que não tinham tempo — até descobrirem que 10 minutos por dia já bastam:",
        testimonials: {
          t1: "\"Trabalho o dia inteiro e chego morto em casa. Achei que não ia dar conta. Mas faço tudo em 10 minutos antes de dormir. Minha esposa nem acredita que gera renda.\"",
          t2: "\"Sou mãe solo, cuido de dois filhos. Meu tempo livre é zero. Mas consigo operar no intervalo do almoço e já tiro o suficiente pra não depender de ninguém.\"",
          t3: "\"Aposentei mas faço bico pra complementar. Achava que ia ser mais uma coisa pra me estressar. Na verdade levo menos tempo que assistir uma novela.\"",
        },
      },
      inicio: {
        subtitle: "também se sentiam perdidos no começo — até receberem o suporte certo:",
        testimonials: {
          t1: "\"Nunca mexi com nada online. Mal sei usar WhatsApp direito. Mas o suporte me pegou pela mão, passo a passo. Hoje opero sozinho e ensino minha esposa.\"",
          t2: "\"Tinha medo de apertar o botão errado e perder tudo. O suporte respondeu cada dúvida minha com paciência. Em 3 dias eu já tava fazendo sozinha.\"",
          t3: "\"Me sentia burro por não entender as coisas de primeira. Mas aqui ninguém te julga. Te ensinam quantas vezes precisar. Hoje sou eu que ajudo os novatos do grupo.\"",
        },
      },
      dinheiro: {
        subtitle: "também pensavam que precisavam de muito dinheiro pra começar — e se surpreenderam:",
        testimonials: {
          t1: "\"Achei que precisava de milhares pra investir. Quando vi que dava pra começar com pouco e ir crescendo, entendi que era pra gente como eu.\"",
          t2: "\"Tava devendo o cartão e mal tinha pra comer. Juntei o pouco que tinha e arrisquei. No terceiro dia já tinha recuperado tudo e ainda sobrou.\"",
          t3: "\"Minha aposentadoria é um salário mínimo. Não tinha nada sobrando. Mas o retorno veio tão rápido que em uma semana já tava no positivo.\"",
        },
      },
    };
    return map[obstacle || ""] || map["medo"];
  };

  const obstacleCtx = getObstacleContext(answers?.obstacle);

  const people = getAgePeople(answers?.age);

  return (
    <div className="w-full funnel-card border-primary/15 space-y-4">
      <h3 className="font-display text-lg font-bold text-foreground text-center leading-snug">
        Pessoas com o <span className="text-gradient-green">mesmo perfil que você</span> já estão tendo resultados
      </h3>
      <p className="text-sm text-muted-foreground text-center">
        Esses alunos {obstacleCtx.subtitle}
      </p>
      <div className="space-y-3">
        {people.map((p, i) => (
          <div key={i} className="funnel-card border-primary/15 bg-secondary/30 space-y-2">
            <div className="flex items-center gap-3">
              <img src={p.avatar} alt={p.name} className="w-11 h-11 rounded-full object-cover border-2 border-primary/30 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground">{p.name}, {p.age} anos</p>
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{p.result}</span>
              </div>
            </div>
            <p className="text-sm text-foreground/85 italic leading-relaxed">
              {obstacleCtx.testimonials[`t${i + 1}` as keyof typeof obstacleCtx.testimonials]}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─── Earnings Projection ─── */
const EarningsProjection = ({ answers, firstName }: { answers?: QuizAnswers; firstName: string }) => {
  const getGoalValues = (goal?: string) => {
    const map: Record<string, { daily: number; label: string }> = {
      "50-100": { daily: 75, label: "R$50 a R$100" },
      "100-300": { daily: 200, label: "R$100 a R$300" },
      "300-500": { daily: 400, label: "R$300 a R$500" },
      "500+": { daily: 600, label: "Mais de R$500" },
    };
    return map[goal || ""] || { daily: 200, label: "R$100 a R$300" };
  };

  const { daily } = getGoalValues(answers?.incomeGoal);
  const projections = [
    { period: "Semana 1", value: Math.round(daily * 0.3), bar: 15 },
    { period: "Semana 2", value: Math.round(daily * 0.5), bar: 30 },
    { period: "Mês 1", value: Math.round(daily * 0.7 * 30), bar: 55 },
    { period: "Mês 2", value: Math.round(daily * 0.85 * 30), bar: 75 },
    { period: "Mês 3", value: Math.round(daily * 1 * 30), bar: 100 },
  ];

  return (
    <div className="w-full funnel-card border-primary/20 bg-card space-y-4">
      <h3 className="font-display text-lg font-bold text-foreground text-center leading-snug">
        {firstName ? `${firstName}, essa` : "Essa"} é sua <span className="text-gradient-green">projeção de ganhos</span>
      </h3>
      <p className="text-xs text-muted-foreground text-center">
        Baseado na sua meta e disponibilidade informada no teste:
      </p>
      <div className="space-y-3">
        {projections.map((p, i) => (
          <div key={i} className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{p.period}</span>
              <span className="text-sm font-bold text-foreground">R${p.value.toLocaleString("pt-BR")}</span>
            </div>
            <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full progress-bar-fill rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${p.bar}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="bg-accent/10 rounded-xl p-3 border border-accent/20 text-center">
        <p className="text-sm text-foreground">
          <span className="font-bold text-accent">Potencial em 90 dias:</span>{" "}
          até R${(daily * 30).toLocaleString("pt-BR")}/mês de renda extra
        </p>
      </div>
      <p className="text-[11px] text-muted-foreground/60 text-center">
        *Projeção baseada na média de resultados dos alunos com perfil semelhante. Resultados podem variar.
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
        Essa será sua <span className="text-gradient-green">mensagem de boas-vindas</span> no WhatsApp
      </h3>
      <p className="text-sm text-muted-foreground text-center">
        Assim que confirmar seu acesso, você recebe isso no seu celular:
      </p>
      <div className="rounded-xl overflow-hidden border border-border shadow-xl" style={{ backgroundColor: "#111b21" }}>
        {/* WhatsApp header */}
        <div className="bg-[#1f2c34] px-3 py-2 flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#aebac1"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" transform="rotate(180 12 12)"/></svg>
          <img src={mentorPhoto} alt="Suporte" className="w-8 h-8 rounded-full object-cover" />
          <div>
            <p className="text-[#e9edef] text-sm font-normal">Suporte Alfa Híbrida</p>
            <p className="text-[#8696a0] text-[11px]">online</p>
          </div>
        </div>
        {/* Messages */}
        <div className="px-3 py-3 space-y-1" style={{ backgroundColor: "#0b141a" }}>
          <div className="flex justify-center mb-2">
            <span className="bg-[#182229] text-[#8696a0] text-[11px] px-3 py-1 rounded-lg">HOJE</span>
          </div>
          {[
            `Olá ${name}! Seja muito bem-vindo(a) à família Alfa Híbrida!`,
            `Meu nome é Ana e vou ser sua mentora pessoal nos próximos dias.`,
            `Já liberei seu acesso completo à plataforma. Vou te mandar o link agora.`,
            `Qualquer dúvida, pode me chamar aqui a qualquer hora. Estou aqui pra te ajudar em cada passo.`,
            `Vamos juntos! Amanhã já quero ver seu primeiro resultado!`,
          ].map((text, i) => (
            <div key={i} className="flex justify-start mb-[3px]">
              <div className="max-w-[85%] bg-[#202c33] text-[#e9edef] px-[9px] py-[6px] rounded-[7.5px] rounded-tl-none text-[14px] leading-[19px]">
                <span>{text}</span>
                <span className="text-[11px] text-[#ffffff99] ml-2 float-right mt-[3px]">09:01</span>
              </div>
            </div>
          ))}
        </div>
        {/* Input */}
        <div className="bg-[#1f2c34] px-2 py-2 flex items-center gap-2">
          <div className="flex-1 bg-[#2a3942] rounded-full px-4 py-2">
            <span className="text-[#8696a0] text-sm">Mensagem</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-[#00a884] flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/></svg>
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground text-center italic">
        O suporte real estará te esperando assim que você confirmar seu acesso
      </p>
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
    // Load v1 SDK
    const s1 = document.createElement("script");
    s1.src = "https://scripts.converteai.net/lib/js/smartplayer/v1/sdk.min.js";
    s1.async = true;
    document.head.appendChild(s1);

    // Load v4 SDK
    const s4 = document.createElement("script");
    s4.src = "https://scripts.converteai.net/lib/js/smartplayer-wc/v4/sdk.js";
    s4.async = true;
    document.head.appendChild(s4);

    // Set iframe sources for v1 players
    VIDEO_TESTIMONIALS.filter(v => v.sdk === "v1").forEach(v => {
      const iframe = document.getElementById(`ifr_${v.id}`) as HTMLIFrameElement;
      if (iframe) {
        iframe.src =
          `https://scripts.converteai.net/09ec79a4-c31f-44ce-ba7d-89003424c826/players/${v.id}/embed.html` +
          (window.location.search || "?") +
          "&vl=" +
          encodeURIComponent(window.location.href);
      }
    });

    // v4 player uses onload
    const v4 = VIDEO_TESTIMONIALS.find(v => v.sdk === "v4");
    if (v4) {
      const iframe = document.getElementById(`ifr_${v4.id}`) as HTMLIFrameElement;
      if (iframe && iframe.src === "about:blank") {
        iframe.src =
          `https://scripts.converteai.net/09ec79a4-c31f-44ce-ba7d-89003424c826/players/${v4.id}/v4/embed.html` +
          (window.location.search || "?") +
          "&vl=" +
          encodeURIComponent(window.location.href);
      }
    }

    return () => {
      s1.remove();
      s4.remove();
    };
  }, []);

  return (
    <div className="w-full space-y-4">
      <h3 className="font-display text-xl font-bold text-foreground text-center">
        Depoimentos em <span className="text-gradient-green">vídeo</span>
      </h3>
      <p className="text-sm text-muted-foreground text-center">
        Assista quem já mudou de vida com o método:
      </p>
      <div className="w-full space-y-4">
        {VIDEO_TESTIMONIALS.map((v) => (
          <div key={v.id} className="w-full rounded-2xl overflow-hidden border border-border">
            <div
              id={`ifr_${v.id}_wrapper`}
              style={{ margin: "0 auto", width: "100%" }}
            >
              <div
                style={{ padding: `${v.padding} 0 0 0`, position: "relative" }}
                id={`ifr_${v.id}_aspect`}
              >
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
    </div>
  );
};

/* ─── Main Component ─── */
const Step13Offer = ({ userName, answers }: Step13Props) => {
  const [showCTA, setShowCTA] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900);

  useEffect(() => {
    const timer = setTimeout(() => setShowCTA(true), 4000);
    return () => clearTimeout(timer);
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
    { title: "Guia Rápido: Primeiro Resultado em 24h", value: "R$97", description: "Um passo a passo simplificado para você fazer sua primeira operação e ver dinheiro na conta ainda hoje." },
    { title: "Comunidade VIP no WhatsApp", value: "R$147", description: "Acesso ao grupo exclusivo com mais de 36.000 alunos que se ajudam diariamente. Tire dúvidas em tempo real." },
    { title: "Planilha de Controle Financeiro", value: "R$47", description: "Acompanhe seus ganhos diários, semanais e mensais de forma simples. Feita especialmente para quem não entende de planilha." },
    { title: "Aulas Extras: Segurança Digital para Iniciantes", value: "R$97", description: "Aprenda a se proteger de golpes online, criar senhas seguras e usar o celular com confiança total." },
    { title: "Suporte Humano por 90 Dias", value: "R$197", description: "Atendimento individualizado com nossa equipe. Sem robô, sem espera. Gente de verdade te ajudando em cada etapa." },
    { title: "Acompanhamento Personalizado do Seu Perfil", value: "R$297", description: "Com base nas suas respostas do teste, criamos um plano sob medida para sua rotina, dispositivo e meta de renda." },
  ];

  const faqs = [
    { question: "Preciso ter experiência com internet?", answer: "Não. O método foi criado especialmente para pessoas que nunca fizeram nada online. Tudo é explicado do zero, passo a passo, com vídeos simples e suporte humano para te ajudar." },
    { question: "Funciona pelo celular mesmo?", answer: "Sim, 100%. A maioria dos nossos alunos usa apenas o celular. Não precisa de computador, não precisa de internet rápida. Se você consegue usar o WhatsApp, consegue usar a plataforma." },
    { question: "Em quanto tempo vejo resultado?", answer: "Muitos alunos fazem a primeira operação e veem resultado no mesmo dia. O método foi desenhado para gerar renda no curto prazo, não em meses ou anos." },
    { question: "E se eu não gostar? Perco meu dinheiro?", answer: "De jeito nenhum. Você tem 30 dias de garantia total. Se por qualquer motivo não gostar ou achar que não é pra você, devolvemos 100% do valor. Sem perguntas, sem burocracia." },
    { question: "R$66 é o preço final? Tem alguma taxa escondida?", answer: "R$66 é o valor total. Não existe mensalidade, não existe taxa extra, não existe venda dentro da plataforma. Você paga uma vez e tem acesso completo a tudo." },
    { question: "É golpe? Já fui enganado antes na internet.", answer: "Entendemos sua desconfiança. Por isso oferecemos garantia de 30 dias, suporte humano real pelo WhatsApp, e mais de 36.000 alunos ativos. Você pode testar sem risco nenhum." },
    { question: "Preciso investir mais dinheiro depois?", answer: "Não. O método ensina a gerar renda sem investimento inicial. O único valor é o da plataforma (R$66). Depois disso, tudo o que você ganhar é lucro." },
  ];

  const testimonials = [
     { name: "Sebastião Moreira", age: "57 anos", city: "Manaus, AM", avatar: avatarJose, text: "Minha aposentadoria não cobria nem o aluguel. Vivia contando moeda no final do mês. Hoje tenho uma renda extra que me deu de volta a dignidade de viver sem pedir nada a ninguém." },
     { name: "Regina Aparecida", age: "44 anos", city: "Campinas, SP", avatar: avatarRegina, text: "Fui demitida depois de 18 anos na mesma empresa. Com dois filhos pra criar, o desespero bateu. Comecei sem acreditar e em duas semanas já tinha pagado a conta de luz que tava cortada." },
     { name: "Luciana Borges", age: "50 anos", city: "Fortaleza, CE", avatar: avatarLucia, text: "Meu marido ria de mim quando eu disse que ia ganhar dinheiro pelo celular. Hoje ele me pede pra ensinar. A gente finalmente conseguiu marcar aquela viagem que sonhava há anos." },
  ];

  return (
    <div className="animate-slide-up flex flex-col items-center w-full max-w-lg mx-auto px-4 sm:px-5 py-5 sm:py-6 gap-5 sm:gap-6">

      {/* ═══ TIMER ═══ */}
      <div className="w-full funnel-card border-destructive/30 bg-destructive/5 text-center">
        <p className="text-sm text-destructive font-bold">SUA CONDIÇÃO ESPECIAL EXPIRA EM</p>
        <p className="text-3xl font-display font-bold text-foreground mt-1">
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </p>
        <p className="text-xs text-muted-foreground mt-1">Depois disso, o valor volta para R$297,00</p>
      </div>

      {/* ═══ PROFILE ANALYSIS ═══ */}
      <ProfileAnalysis answers={answers} firstName={firstName} />

      {/* ═══ PESSOAS COMO VOCÊ ═══ */}
      <PeopleLikeYou answers={answers} />

      {/* ═══ HEADLINE ═══ */}
      <div className="text-center space-y-3">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground leading-snug">
          {firstName ? `${firstName}, tudo pronto.` : "Tudo pronto."}{" "}
          <span className="text-gradient-green">Seu plano personalizado está aqui.</span>
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          A plataforma que te guia, passo a passo, para gerar uma renda extra segura todos os dias — mesmo que você nunca tenha feito nada parecido na vida.
        </p>
      </div>

      {/* ═══ VSL VIDEO ═══ */}
      <VideoPlaceholder label="Assista para entender como funciona (4 min)" />

      {/* ═══ MENTOR QUOTE ═══ */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 w-full funnel-card border-primary/20 bg-primary/5">
        <img src={mentorPhoto} alt="Especialista" className="w-14 h-14 rounded-full object-cover border-2 border-primary/40 shrink-0" />
        <div className="text-center sm:text-left">
          <p className="text-sm sm:text-base text-foreground/90 italic leading-relaxed">
            "{firstName ? `${firstName}, se` : "Se"} você chegou até aqui, é porque realmente quer mudar sua vida financeira. Eu vou te acompanhar pessoalmente nessa jornada. Você não vai estar sozinho."
          </p>
          <p className="text-muted-foreground text-xs mt-2 not-italic font-medium">— Ricardo Almeida, criador do método</p>
        </div>
      </div>

      {/* ═══ EARNINGS PROJECTION ═══ */}
      <EarningsProjection answers={answers} firstName={firstName} />

      {/* ═══ CTA 1 ═══ */}
      <CTABlock showCTA={showCTA} />

      <Divider />

      {/* ═══ WHAT YOU GET ═══ */}
      <div className="w-full space-y-2">
        <h3 className="font-display text-xl font-bold text-foreground text-center">O que você recebe hoje:</h3>
        {[
          "Acesso completo à plataforma Alfa Híbrida",
          "Método passo a passo — do zero ao primeiro resultado",
          "Vídeo-aulas didáticas gravadas em linguagem simples",
          "Suporte humano em tempo real via WhatsApp",
          "Comunidade exclusiva com mais de 36.000 alunos",
          "Acompanhamento personalizado para o seu perfil",
        ].map((text, i) => (
          <div key={i} className="flex items-start gap-3 py-2">
            <svg className="w-5 h-5 text-primary shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <p className="text-base text-foreground leading-snug">{text}</p>
          </div>
        ))}
      </div>

      <Divider />

      {/* ═══ BONUS STACKING ═══ */}
      <div className="w-full space-y-4">
        <h3 className="font-display text-xl font-bold text-foreground text-center">
          E mais: <span className="text-accent">6 bônus exclusivos</span> para você
        </h3>
        <p className="text-sm text-muted-foreground text-center">
          Tudo isso incluso no seu acesso, sem pagar nada a mais:
        </p>

        <img src={bonusStack} alt="Pacote completo de bônus" className="w-full rounded-2xl border border-border" />

        {bonuses.map((b, i) => (
          <BonusCard key={i} number={i + 1} {...b} />
        ))}

        <div className="funnel-card border-accent/30 bg-accent/5 text-center space-y-1">
          <p className="text-sm text-muted-foreground">Valor total dos bônus:</p>
          <p className="text-xl text-muted-foreground line-through font-semibold">R$882,00</p>
          <p className="text-lg font-bold text-accent">Hoje: GRÁTIS com seu acesso</p>
        </div>
      </div>

      {/* ═══ CTA 2 ═══ */}
      <CTABlock showCTA={showCTA} />

      <Divider />

      {/* ═══ PRICE ANCHOR ═══ */}
      <div className="w-full funnel-card border-accent/30 bg-card text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Cpu className="w-5 h-5 text-primary" />
          <p className="text-sm font-semibold text-foreground">Por que existe essa taxa?</p>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed text-left">
          A nossa plataforma utiliza a inteligência artificial do <span className="font-bold text-foreground">ChatGPT</span> para funcionar. 
          Cada operação que a IA faz por você consome <span className="font-bold text-foreground">tokens</span> — e esses tokens têm um custo real que precisamos cobrir.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed text-left">
          O valor abaixo é <span className="font-bold text-foreground">apenas a taxa do token da IA</span>. 
          Nós <span className="text-primary font-bold">não ganhamos nada</span> com esse pagamento. Zero. Nenhum centavo.
        </p>
        <div className="bg-primary/10 rounded-xl p-3 border border-primary/20 text-left">
          <p className="text-sm text-foreground leading-relaxed">
            <span className="font-bold">Como ganhamos então?</span> Só depois de 30 dias, quando você já estiver lucrando, 
            cobramos apenas <span className="text-primary font-bold">2% dos seus lucros</span> na plataforma. 
            Ou seja: <span className="font-bold">só ganhamos quando você ganha.</span> Se você não lucrar, não pagamos nada.
          </p>
        </div>

        <Separator className="my-2" />

        <p className="text-sm text-muted-foreground">Taxa única do token ChatGPT:</p>
        <p className="text-5xl sm:text-6xl font-display font-bold text-foreground">
          R$<span className="text-gradient-green">66</span>
        </p>
        <p className="text-base text-muted-foreground">ou 12x de R$6,58 no cartão</p>
        <div className="bg-secondary/50 rounded-xl p-3">
          <p className="text-sm text-foreground font-medium">
            Isso dá menos de R$2,20 por dia — apenas o custo da IA trabalhando por você.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2 pt-2">
          {["Pix", "Cartão de Crédito", "Boleto"].map((m) => (
            <span key={m} className="text-xs bg-secondary px-3 py-1.5 rounded-full text-muted-foreground font-medium">{m}</span>
          ))}
        </div>
      </div>

      {/* ═══ CTA 3 ═══ */}
      <CTABlock showCTA={showCTA} />

      <Divider />

      {/* ═══ OBJECTION BREAKING ═══ */}
      <div className="w-full space-y-4">
        <h3 className="font-display text-xl font-bold text-foreground text-center">
          Eu sei o que você está pensando...
        </h3>

        {[
          {
             objection: '"Será que funciona pra mim? Já tenho mais de 40 anos..."',
             response: "A maioria dos nossos alunos tem entre 40 e 58 anos. O método foi criado pensando em quem não tem experiência com tecnologia. Se você sabe usar WhatsApp, você consegue.",
          },
          {
            objection: '"Já fui enganado antes na internet..."',
            response: "Entendemos sua desconfiança. Por isso você tem 30 dias pra testar sem risco. Se não gostar, devolvemos cada centavo. Sem perguntas.",
          },
          {
            objection: '"Não tenho dinheiro sobrando..."',
            response: "São R$66 uma única vez. Sem mensalidade, sem taxa escondida. Muitos alunos recuperam esse valor já no primeiro dia de uso.",
          },
          {
            objection: '"Tenho medo de mexer com tecnologia..."',
            response: "Nosso suporte te acompanha em cada clique. Literalmente. Você manda mensagem no WhatsApp e alguém te responde em minutos. Você nunca vai ficar perdido.",
          },
        ].map((item, i) => (
          <div key={i} className="funnel-card border-border space-y-2">
            <p className="text-base text-foreground/70 italic">{item.objection}</p>
            <p className="text-base text-foreground font-medium leading-relaxed">{item.response}</p>
          </div>
        ))}
      </div>

      <Divider />

      {/* ═══ GUARANTEE ═══ */}
      <div className="w-full funnel-card border-accent/30 bg-accent/5 space-y-4">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 text-center sm:text-left">
          <img src={guaranteeSeal} alt="Garantia 30 dias" className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 object-contain" />
          <div>
            <h3 className="font-display text-base sm:text-lg font-bold text-foreground">Garantia Incondicional de 30 Dias</h3>
            <p className="text-sm text-muted-foreground mt-1">Risco zero para você.</p>
          </div>
        </div>
        <p className="text-sm sm:text-base text-foreground/85 leading-relaxed">
          Se nos próximos 30 dias você sentir que o método não é para você, basta enviar uma mensagem e devolvemos <strong>100% do seu dinheiro</strong>. Sem perguntas, sem burocracia, sem letras miúdas. Simples assim.
        </p>
        <p className="text-sm text-primary font-semibold">
          Você literalmente não tem nada a perder.
        </p>
      </div>

      {/* ═══ CTA 4 ═══ */}
      <CTABlock showCTA={showCTA} />

      <Divider />

      {/* ═══ TESTIMONIALS ═══ */}
      <div className="w-full space-y-4">
        <h3 className="font-display text-xl font-bold text-foreground text-center">
          Pessoas reais. Resultados reais.
        </h3>
         <p className="text-sm text-muted-foreground text-center">
           Veja o que nossos alunos dizem sobre o método:
         </p>

        {testimonials.map((t, i) => (
          <TestimonialCard key={i} {...t} />
        ))}
      </div>

      <Divider />

      {/* ═══ VIDEO TESTIMONIALS ═══ */}
      <VideoTestimonialsSection />

      <Divider />

      {/* ═══ EMOTIONAL DECISION ═══ */}
      <div className="w-full funnel-card border-primary/20 bg-primary/5 space-y-4 text-center">
        <h3 className="font-display text-xl font-bold text-foreground leading-snug">
          {firstName ? `${firstName}, imagine` : "Imagine"} daqui a 30 dias...
        </h3>
        <div className="space-y-3 text-left">
          {[
            "Acordar e ver que já ganhou dinheiro antes mesmo de tomar café",
            "Pagar todas as suas contas em dia, sem apertar",
            "Ter dinheiro sobrando pra fazer algo bom pela sua família",
            "Olhar pro seu extrato bancário e sentir orgulho",
            "Não depender de ninguém financeiramente",
          ].map((text, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="text-primary text-base shrink-0 mt-0.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
              </span>
              <p className="text-base text-foreground leading-snug">{text}</p>
            </div>
          ))}
        </div>
        <p className="text-base text-muted-foreground italic pt-2">
          Tudo isso pode começar hoje. Por menos de R$2,20 por dia.
        </p>
      </div>

      {/* ═══ CTA 5 ═══ */}
      <CTABlock showCTA={showCTA} />

      <Divider />

      {/* ═══ FAQ ═══ */}
      <div className="w-full space-y-3">
        <h3 className="font-display text-xl font-bold text-foreground text-center">
          Perguntas Frequentes
        </h3>
        {faqs.map((faq, i) => (
          <FAQItem key={i} {...faq} />
        ))}
      </div>

      <Divider />

      {/* ═══ WHATSAPP WELCOME PREVIEW ═══ */}
      <WhatsAppWelcome firstName={firstName} />

      <Divider />

      {/* ═══ FINAL URGENCY ═══ */}
      <div className="w-full space-y-4 text-center">
        <div className="funnel-card border-destructive/30 bg-destructive/5 space-y-2">
          <p className="text-base font-bold text-foreground">
            Essa condição especial de R$66 é apenas para quem completou a análise agora.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Ao sair desta página, o valor volta para R$297 e os bônus são removidos. Essa é sua única chance.
          </p>
          <p className="text-2xl font-display font-bold text-foreground mt-2">
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </p>
        </div>

        {/* ═══ FINAL CTA ═══ */}
        <CTABlock showCTA={showCTA} />

        <TrustBadge>Pagamento 100% seguro · Garantia de 30 dias · Suporte em português</TrustBadge>

        <div className="flex flex-wrap justify-center gap-3 opacity-60 pt-2">
          {["Visa", "Mastercard", "Pix", "Boleto", "Elo"].map((b) => (
            <span key={b} className="text-xs text-muted-foreground bg-secondary px-3 py-1 rounded-md">{b}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Step13Offer;
