import { useState } from "react";
import { StepContainer, StepTitle, StepSubtitle, CTAButton } from "./QuizUI";

interface StepWhatsAppProps {
  onNext: () => void;
}

interface WhatsAppMessage {
  text: string;
  time: string;
  sent?: boolean;
  emoji?: boolean;
}

interface WhatsAppChat {
  name: string;
  avatar: string;
  status: string;
  messages: WhatsAppMessage[];
}

const chats: WhatsAppChat[] = [
  {
    name: "Seu Antônio 👴",
    avatar: "👨‍🦳",
    status: "online",
    messages: [
      { text: "Boa noite pessoal! Só passando pra agradecer 🙏", time: "21:34" },
      { text: "Fiz minha primeira operação hoje seguindo o passo a passo", time: "21:34" },
      { text: "Resultado: R$127,00 no primeiro dia!! 🤑", time: "21:35" },
      { text: "Minha esposa não acreditou kkkk", time: "21:35" },
      { text: "Vocês mudaram minha vida. Obrigado do fundo do coração ❤️", time: "21:36" },
      { text: "Parabéns Antônio!! 👏👏 Merece demais!!", time: "21:37", sent: true },
    ],
  },
  {
    name: "Dona Cláudia 🌸",
    avatar: "👩‍🦳",
    status: "online",
    messages: [
      { text: "Gente eu to chorando aqui 😭😭", time: "14:12" },
      { text: "Consegui pagar TODAS as contas atrasadas esse mês", time: "14:12" },
      { text: "Pela primeira vez em 3 anos não devo NADA", time: "14:13" },
      { text: "A luz, a água, o cartão... tudo em dia", time: "14:13" },
      { text: "Obrigada do fundo do coração ❤️ Deus abençoe vocês", time: "14:14" },
      { text: "Que lindo Cláudia!! 🥹 Você é exemplo pra todos nós!", time: "14:15", sent: true },
    ],
  },
  {
    name: "Carlos Aposentado 🧓",
    avatar: "👨‍🦳",
    status: "visto por último às 19:42",
    messages: [
      { text: "Confesso que tinha MUITO medo de começar", time: "19:20" },
      { text: "Já perdi dinheiro na internet 2 vezes antes 😞", time: "19:20" },
      { text: "Mas dessa vez o suporte me ajudou em CADA passo", time: "19:21" },
      { text: "Hoje faço R$200 por dia tranquilo, só com o celular 📱", time: "19:22" },
      { text: "Minha esposa também começou e já tá tirando R$80/dia 💪", time: "19:22" },
      { text: "Que orgulho Carlos!! O casal mais inspirador do grupo! 🏆", time: "19:25", sent: true },
    ],
  },
  {
    name: "Maria José 💛",
    avatar: "👩",
    status: "online",
    messages: [
      { text: "Bom dia grupo! ☀️", time: "08:03" },
      { text: "1 mês usando a plataforma e vim dar o feedback", time: "08:03" },
      { text: "Resultado do mês: R$4.230,00 de renda extra!! 📊", time: "08:04" },
      { text: "Nunca imaginei isso com 55 anos", time: "08:04" },
      { text: "Recomendo pra todo mundo que tem medo de começar", time: "08:05" },
      { text: "Vale MUITO mais que os R$66 que paguei 🙌", time: "08:05" },
      { text: "Resultado incrível Maria!! 🔥🔥", time: "08:07", sent: true },
    ],
  },
];

const WhatsAppBubble = ({ msg }: { msg: WhatsAppMessage }) => (
  <div className={`flex ${msg.sent ? "justify-end" : "justify-start"} mb-1.5`}>
    <div
      className={`max-w-[85%] px-3 py-2 rounded-lg text-sm leading-relaxed relative ${
        msg.sent
          ? "bg-[#005c4b] text-white rounded-tr-none"
          : "bg-[#202c33] text-[#e9edef] rounded-tl-none"
      }`}
    >
      <span>{msg.text}</span>
      <span className="text-[10px] text-[#8696a0] ml-2 float-right mt-1 leading-none">
        {msg.time}
        {msg.sent && <span className="ml-0.5 text-[#53bdeb]">✓✓</span>}
      </span>
    </div>
  </div>
);

const WhatsAppScreen = ({ chat }: { chat: WhatsAppChat }) => (
  <div className="w-full rounded-2xl overflow-hidden border border-border shadow-xl shrink-0 snap-center">
    {/* WhatsApp Header */}
    <div className="bg-[#202c33] px-3 py-2.5 flex items-center gap-3 border-b border-[#2a3942]">
      <div className="w-2 h-2 rounded-full bg-[#8696a0]" />
      <div className="w-9 h-9 rounded-full bg-[#2a3942] flex items-center justify-center text-lg">
        {chat.avatar}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[#e9edef] font-medium text-sm truncate">{chat.name}</p>
        <p className="text-[#8696a0] text-[11px]">{chat.status}</p>
      </div>
      <div className="flex gap-4 text-[#aebac1]">
        <span className="text-sm">📹</span>
        <span className="text-sm">📞</span>
        <span className="text-sm">⋮</span>
      </div>
    </div>

    {/* Chat body */}
    <div
      className="px-3 py-3 space-y-0.5 min-h-[280px]"
      style={{
        backgroundColor: "#0b141a",
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23111b21' fill-opacity='0.6'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }}
    >
      {/* Date chip */}
      <div className="flex justify-center mb-3">
        <span className="bg-[#182229] text-[#8696a0] text-[11px] px-3 py-1 rounded-lg shadow-sm">
          HOJE
        </span>
      </div>
      {chat.messages.map((msg, i) => (
        <WhatsAppBubble key={i} msg={msg} />
      ))}
    </div>

    {/* Input bar */}
    <div className="bg-[#202c33] px-2 py-2 flex items-center gap-2 border-t border-[#2a3942]">
      <span className="text-[#8696a0] text-lg">😊</span>
      <span className="text-[#8696a0] text-lg">📎</span>
      <div className="flex-1 bg-[#2a3942] rounded-full px-4 py-2">
        <span className="text-[#8696a0] text-sm">Mensagem</span>
      </div>
      <span className="text-[#8696a0] text-lg">🎤</span>
    </div>
  </div>
);

const StepWhatsAppProof = ({ onNext }: StepWhatsAppProps) => {
  const [current, setCurrent] = useState(0);

  return (
    <StepContainer>
      <StepTitle>
        Veja o que nossos alunos estão dizendo <span className="text-gradient-green">agora mesmo</span>
      </StepTitle>
      <StepSubtitle>
        Prints reais do nosso grupo de alunos no WhatsApp:
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
            onClick={() => setCurrent(i)}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
              i === current ? "bg-primary w-6" : "bg-muted-foreground/30"
            }`}
          />
        ))}
      </div>

      {/* Swipe hint */}
      <p className="text-xs text-muted-foreground text-center">
        👆 Toque nos pontos para ver mais depoimentos
      </p>

      {/* Arrow buttons */}
      <div className="flex gap-3 w-full">
        <button
          onClick={() => setCurrent((p) => Math.max(0, p - 1))}
          disabled={current === 0}
          className="flex-1 py-3 rounded-xl bg-secondary text-foreground font-semibold text-sm disabled:opacity-30 cursor-pointer"
        >
          ← Anterior
        </button>
        <button
          onClick={() => setCurrent((p) => Math.min(chats.length - 1, p + 1))}
          disabled={current === chats.length - 1}
          className="flex-1 py-3 rounded-xl bg-secondary text-foreground font-semibold text-sm disabled:opacity-30 cursor-pointer"
        >
          Próximo →
        </button>
      </div>

      <CTAButton onClick={onNext} className="mt-2">
        CONTINUAR →
      </CTAButton>
    </StepContainer>
  );
};

export default StepWhatsAppProof;
