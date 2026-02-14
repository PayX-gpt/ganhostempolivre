import { useState, useEffect, useCallback } from "react";
import { StepContainer, StepTitle, StepSubtitle, CTAButton } from "./QuizUI";
import avatarAntonio from "@/assets/avatar-antonio.jpg";
import avatarClaudia from "@/assets/avatar-claudia.jpg";
import avatarCarlos from "@/assets/avatar-carlos.jpg";
import avatarMaria from "@/assets/avatar-maria.jpg";

interface StepWhatsAppProps {
  onNext: () => void;
}

interface WhatsAppMessage {
  text: string;
  time: string;
  sent?: boolean;
}

interface WhatsAppChat {
  name: string;
  avatar: string;
  status: string;
  messages: WhatsAppMessage[];
}

const chats: WhatsAppChat[] = [
  {
    name: "Antônio Ferreira",
    avatar: avatarAntonio,
    status: "online",
    messages: [
      { text: "Boa noite pessoal, passando pra dar meu depoimento", time: "21:34" },
      { text: "Fiz a primeira operação hoje seguindo o passo a passo que o suporte mandou", time: "21:34" },
      { text: "Resultado do dia: R$127,00 líquido na conta", time: "21:35" },
      { text: "Minha esposa viu o comprovante e ficou sem acreditar", time: "21:35" },
      { text: "Tenho 62 anos e achava que não ia conseguir. Obrigado de verdade", time: "21:36" },
      { text: "Parabéns Antônio!! Merece muito, continue firme!", time: "21:37", sent: true },
    ],
  },
  {
    name: "Cláudia Nascimento",
    avatar: avatarClaudia,
    status: "online",
    messages: [
      { text: "Gente preciso compartilhar isso com vocês", time: "14:12" },
      { text: "Consegui pagar TODAS as contas atrasadas esse mês", time: "14:12" },
      { text: "Pela primeira vez em 3 anos não devo nada pra ninguém", time: "14:13" },
      { text: "Luz, água, cartão de crédito, tudo quitado", time: "14:13" },
      { text: "Só tenho a agradecer. Esse método mudou minha vida", time: "14:14" },
      { text: "Que lindo Cláudia! Você é inspiração pra todos nós!", time: "14:15", sent: true },
    ],
  },
  {
    name: "Carlos Mendonça",
    avatar: avatarCarlos,
    status: "visto por último às 19:42",
    messages: [
      { text: "Confesso que tinha muito medo de começar", time: "19:20" },
      { text: "Já perdi dinheiro na internet 2 vezes antes com promessas falsas", time: "19:20" },
      { text: "Mas aqui o suporte me ajudou em cada etapa, sem me deixar perdido", time: "19:21" },
      { text: "Hoje faço em média R$200 por dia só usando o celular", time: "19:22" },
      { text: "Minha esposa viu e também quis começar. Já está tirando R$80 por dia", time: "19:22" },
      { text: "Que orgulho Carlos! Vocês dois são exemplo pra todo o grupo!", time: "19:25", sent: true },
    ],
  },
  {
    name: "Maria José Santos",
    avatar: avatarMaria,
    status: "online",
    messages: [
      { text: "Bom dia grupo", time: "08:03" },
      { text: "Completei 1 mês usando a plataforma e vim dar meu feedback", time: "08:03" },
      { text: "Resultado do mês: R$4.230,00 de renda extra", time: "08:04" },
      { text: "Nunca imaginei conseguir isso com 55 anos e sem experiência nenhuma", time: "08:04" },
      { text: "Recomendo pra qualquer pessoa que tenha medo de começar", time: "08:05" },
      { text: "Vale muito mais do que o valor que paguei pra entrar", time: "08:05" },
      { text: "Resultado incrível Maria!! Inspiração total!", time: "08:07", sent: true },
    ],
  },
];

const WhatsAppBubble = ({ msg }: { msg: WhatsAppMessage }) => (
  <div className={`flex ${msg.sent ? "justify-end" : "justify-start"} mb-[3px]`}>
    <div
      className={`max-w-[85%] sm:max-w-[82%] px-[9px] py-[6px] text-[13.5px] sm:text-[14.2px] leading-[18px] sm:leading-[19px] relative ${
        msg.sent
          ? "bg-[#005c4b] text-[#e9edef] rounded-[7.5px] rounded-tr-none"
          : "bg-[#202c33] text-[#e9edef] rounded-[7.5px] rounded-tl-none"
      }`}
    >
      <span>{msg.text}</span>
      <span className="text-[11px] text-[#ffffff99] ml-[8px] float-right mt-[3px] leading-[16px] flex items-center gap-[2px]">
        {msg.time}
        {msg.sent && (
          <svg width="16" height="11" viewBox="0 0 16 11" className="ml-[1px]">
            <path d="M11.071.653a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178l-6.19 7.636-2.011-2.095a.463.463 0 0 0-.336-.153.457.457 0 0 0-.344.153.52.52 0 0 0 0 .72l2.356 2.459a.464.464 0 0 0 .341.161h.044a.462.462 0 0 0 .34-.178l6.535-8.058a.515.515 0 0 0-.05-.72z" fill="#53bdeb"/>
            <path d="M15.071.653a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178l-6.19 7.636-1.2-1.25-.313.39 1.467 1.532a.464.464 0 0 0 .341.161h.044a.462.462 0 0 0 .34-.178l6.535-8.058a.515.515 0 0 0-.05-.72z" fill="#53bdeb"/>
          </svg>
        )}
      </span>
    </div>
  </div>
);

const WhatsAppScreen = ({ chat }: { chat: WhatsAppChat }) => (
  <div className="w-full rounded-xl overflow-hidden shadow-2xl shrink-0 snap-center" style={{ backgroundColor: "#111b21" }}>
    {/* Status bar */}
    <div className="bg-[#1f2c34] px-4 pt-[6px] pb-0 flex items-center justify-between text-[#aebac1] text-[12px]">
      <span>9:41</span>
      <div className="flex items-center gap-1">
        <svg width="16" height="12" viewBox="0 0 16 12" fill="#aebac1"><rect x="0" y="8" width="3" height="4" rx="0.5"/><rect x="4" y="5" width="3" height="7" rx="0.5"/><rect x="8" y="2" width="3" height="10" rx="0.5"/><rect x="12" y="0" width="3" height="12" rx="0.5" fillOpacity="0.3"/></svg>
        <svg width="15" height="12" viewBox="0 0 15 12" fill="#aebac1"><path d="M7.5 3C5.57 3 3.82 3.78 2.53 5.06L1 3.53 1 8h4.47L3.95 6.47C4.96 5.45 6.17 4.8 7.5 4.8s2.54.65 3.55 1.67L9.53 8H14V3.53L12.47 5.06C11.18 3.78 9.43 3 7.5 3z"/></svg>
        <svg width="25" height="12" viewBox="0 0 25 12" fill="#aebac1"><rect x="0" y="1" width="21" height="10" rx="2" stroke="#aebac1" strokeWidth="1" fill="none"/><rect x="2" y="3" width="15" height="6" rx="1" fill="#aebac1"/><rect x="22" y="4" width="3" height="4" rx="1"/></svg>
      </div>
    </div>

    {/* WhatsApp Header */}
    <div className="bg-[#1f2c34] px-2 py-[6px] flex items-center gap-[10px]">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="#aebac1"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" transform="rotate(180 12 12)"/></svg>
      <img 
        src={chat.avatar} 
        alt={chat.name} 
        className="w-[34px] h-[34px] rounded-full object-cover"
      />
      <div className="flex-1 min-w-0">
        <p className="text-[#e9edef] font-normal text-[16px] leading-[20px] truncate">{chat.name}</p>
        <p className="text-[#8696a0] text-[13px] leading-[16px]">{chat.status}</p>
      </div>
      <div className="flex items-center gap-[20px] text-[#aebac1]">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#aebac1"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#aebac1"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#aebac1"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
      </div>
    </div>

    {/* Chat body */}
    <div
      className="px-[10px] sm:px-[12px] py-[8px] space-y-0 min-h-[240px] sm:min-h-[260px]"
      style={{
        backgroundColor: "#0b141a",
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='400' height='400' viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23111b21' fill-opacity='0.4'%3E%3Cpath d='M20 20h4v4h-4zM60 20h4v4h-4zM100 20h4v4h-4zM140 60h4v4h-4zM180 40h4v4h-4zM220 80h4v4h-4zM260 20h4v4h-4zM300 60h4v4h-4zM340 40h4v4h-4zM380 80h4v4h-4zM40 100h4v4h-4zM80 140h4v4h-4zM120 100h4v4h-4zM160 140h4v4h-4zM200 120h4v4h-4zM240 160h4v4h-4zM280 100h4v4h-4zM320 140h4v4h-4zM360 120h4v4h-4zM20 180h4v4h-4zM60 220h4v4h-4zM100 200h4v4h-4zM140 240h4v4h-4zM180 180h4v4h-4zM220 220h4v4h-4zM260 200h4v4h-4zM300 240h4v4h-4zM340 180h4v4h-4zM380 220h4v4h-4zM40 260h4v4h-4zM80 300h4v4h-4zM120 280h4v4h-4zM160 320h4v4h-4zM200 260h4v4h-4zM240 300h4v4h-4zM280 280h4v4h-4zM320 320h4v4h-4zM360 260h4v4h-4zM20 340h4v4h-4zM60 380h4v4h-4zM100 360h4v4h-4zM140 380h4v4h-4zM180 340h4v4h-4zM220 380h4v4h-4zM260 360h4v4h-4zM300 380h4v4h-4zM340 340h4v4h-4zM380 380h4v4h-4z'/%3E%3C/g%3E%3C/svg%3E")`,
      }}
    >
      {/* Date chip */}
      <div className="flex justify-center mb-[8px]">
        <span className="bg-[#182229] text-[#8696a0] text-[12.5px] px-[12px] py-[5px] rounded-[7.5px] shadow-sm font-normal">
          HOJE
        </span>
      </div>
      {chat.messages.map((msg, i) => (
        <WhatsAppBubble key={i} msg={msg} />
      ))}
    </div>

    {/* Input bar */}
    <div className="bg-[#1f2c34] px-[6px] py-[5px] flex items-center gap-[6px]">
      <div className="flex-1 bg-[#2a3942] rounded-full px-[12px] py-[9px] flex items-center gap-[10px]">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="#8696a0"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/></svg>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="#8696a0"><path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18z" fill="none" stroke="#8696a0" strokeWidth="2"/></svg>
        <span className="text-[#8696a0] text-[15px] flex-1">Mensagem</span>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="#8696a0"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" fill="none" stroke="#8696a0" strokeWidth="2" strokeLinecap="round"/></svg>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="#8696a0"><path d="M12 15c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v7c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 15 6.7 12H5c0 3.41 2.72 6.23 6 6.72V22h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/></svg>
      </div>
      <div className="w-[42px] h-[42px] rounded-full bg-[#00a884] flex items-center justify-center">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/></svg>
      </div>
    </div>
  </div>
);

const StepWhatsAppProof = ({ onNext }: StepWhatsAppProps) => {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => {
    setCurrent((p) => (p + 1) % chats.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    const interval = setInterval(next, 2000);
    return () => clearInterval(interval);
  }, [paused, next]);

  return (
    <StepContainer>
      <StepTitle>
        Veja o que nossos alunos estão dizendo <span className="text-gradient-green">agora mesmo</span>
      </StepTitle>
      <StepSubtitle>
        Conversas reais do nosso grupo de alunos no WhatsApp:
      </StepSubtitle>

      {/* Carousel */}
      <div className="w-full overflow-hidden relative">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {chats.map((chat, i) => (
            <div key={i} className="w-full shrink-0 px-1">
              <WhatsAppScreen chat={chat} />
            </div>
          ))}
        </div>
      </div>

      {/* Dots navigation */}
      <div className="flex items-center justify-center gap-2 mt-2">
        {chats.map((_, i) => (
          <button
            key={i}
            onClick={() => { setCurrent(i); setPaused(true); }}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
              i === current ? "bg-primary w-6" : "bg-muted-foreground/30"
            }`}
          />
        ))}
      </div>

      {/* Arrow buttons */}
      <div className="flex gap-3 w-full">
        <button
          onClick={() => { setCurrent((p) => (p - 1 + chats.length) % chats.length); setPaused(true); }}
          className="flex-1 py-3 rounded-xl bg-secondary text-foreground font-semibold text-sm cursor-pointer"
        >
          Anterior
        </button>
        <button
          onClick={() => { setCurrent((p) => (p + 1) % chats.length); setPaused(true); }}
          className="flex-1 py-3 rounded-xl bg-secondary text-foreground font-semibold text-sm cursor-pointer"
        >
          Próximo
        </button>
      </div>

      <CTAButton onClick={onNext} className="mt-2">
        CONTINUAR
      </CTAButton>
    </StepContainer>
  );
};

export default StepWhatsAppProof;
