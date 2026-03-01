import { useState, useEffect, useCallback } from "react";
import { StepContainer, StepTitle, StepSubtitle, CTAButton } from "./QuizUI";
import avatarAntonio from "@/assets/avatar-antonio.jpg";
import avatarClaudia from "@/assets/avatar-claudia.jpg";
import avatarCarlos from "@/assets/avatar-carlos.jpg";
import avatarMaria from "@/assets/avatar-maria.jpg";
import avatarRafael from "@/assets/avatar-rafael.jpg";
import avatarCamila from "@/assets/avatar-camila.jpg";
import avatarPedro from "@/assets/avatar-pedro.jpg";
import avatarAmanda from "@/assets/avatar-amanda.jpg";
import { isYoungProfile } from "@/lib/agePersonalization";
import { useLanguage, type Language } from "@/lib/i18n";

interface StepWhatsAppProps {
  onNext: () => void;
  userAge?: string;
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

const ui = {
  pt: {
    title1: "Veja o que nossos alunos estão dizendo ",
    titleHL: "agora mesmo",
    subtitle: "Prints direto do grupo de alunos no WhatsApp:",
    today: "HOJE",
    inputPlaceholder: "Mensagem",
    prev: "Anterior",
    next: "Próximo",
    cta: "CONTINUAR",
    online: "online",
    lastSeen: "visto por último às",
  },
  en: {
    title1: "See what our students are saying ",
    titleHL: "right now",
    subtitle: "Screenshots straight from our student WhatsApp group:",
    today: "TODAY",
    inputPlaceholder: "Message",
    prev: "Previous",
    next: "Next",
    cta: "CONTINUE",
    online: "online",
    lastSeen: "last seen at",
  },
  es: {
    title1: "Mirá lo que nuestros alumnos están diciendo ",
    titleHL: "ahora mismo",
    subtitle: "Capturas directo del grupo de alumnos en WhatsApp:",
    today: "HOY",
    inputPlaceholder: "Mensaje",
    prev: "Anterior",
    next: "Siguiente",
    cta: "CONTINUAR",
    online: "en línea",
    lastSeen: "últ. vez a las",
  },
};

const matureChatsI18n: Record<Language, WhatsAppChat[]> = {
  pt: [
    {
      name: "Antônio Ferreira",
      avatar: avatarAntonio,
      status: "online",
      messages: [
        { text: "Boa noite pessoal, passando pra dar meu depoimento", time: "21:34" },
        { text: "Fiz a primeira operação hoje seguindo o passo a passo que o suporte mandou", time: "21:34" },
        { text: "Resultado do dia: R$127,00 líquido na conta", time: "21:35" },
        { text: "Minha esposa viu o comprovante e ficou sem acreditar", time: "21:35" },
        { text: "Tenho 48 anos e achava que não ia conseguir. Obrigado de verdade", time: "21:36" },
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
        { text: "Nunca imaginei conseguir isso com 44 anos e sem experiência nenhuma", time: "08:04" },
        { text: "Recomendo pra qualquer pessoa que tenha medo de começar", time: "08:05" },
        { text: "Vale muito mais do que o valor que paguei pra entrar", time: "08:05" },
        { text: "Resultado incrível Maria!! Inspiração total!", time: "08:07", sent: true },
      ],
    },
  ],
  en: [
    {
      name: "Anthony Ferreira",
      avatar: avatarAntonio,
      status: "online",
      messages: [
        { text: "Good evening everyone, just here to share my experience", time: "21:34" },
        { text: "I did my first operation today following the step-by-step the support team sent me", time: "21:34" },
        { text: "Today's result: $127.00 net in my account", time: "21:35" },
        { text: "My wife saw the receipt and couldn't believe it", time: "21:35" },
        { text: "I'm 48 years old and thought I couldn't do it. Thank you so much", time: "21:36" },
        { text: "Congratulations Anthony!! You deserve it, keep going!", time: "21:37", sent: true },
      ],
    },
    {
      name: "Claudia Nascimento",
      avatar: avatarClaudia,
      status: "online",
      messages: [
        { text: "Guys I need to share this with you", time: "14:12" },
        { text: "I managed to pay ALL my overdue bills this month", time: "14:12" },
        { text: "For the first time in 3 years I don't owe anything to anyone", time: "14:13" },
        { text: "Electricity, water, credit card, everything paid off", time: "14:13" },
        { text: "I can only be grateful. This method changed my life", time: "14:14" },
        { text: "So beautiful Claudia! You're an inspiration to all of us!", time: "14:15", sent: true },
      ],
    },
    {
      name: "Carlos Mendonça",
      avatar: avatarCarlos,
      status: "last seen at 19:42",
      messages: [
        { text: "I have to admit I was really scared to start", time: "19:20" },
        { text: "I've lost money online twice before with false promises", time: "19:20" },
        { text: "But here the support helped me at every step, never left me lost", time: "19:21" },
        { text: "Today I make an average of $200 per day just using my phone", time: "19:22" },
        { text: "My wife saw it and wanted to start too. She's already making $80 per day", time: "19:22" },
        { text: "So proud of you Carlos! You two are an example for the whole group!", time: "19:25", sent: true },
      ],
    },
    {
      name: "Maria José Santos",
      avatar: avatarMaria,
      status: "online",
      messages: [
        { text: "Good morning group", time: "08:03" },
        { text: "I've completed 1 month using the platform and came to give my feedback", time: "08:03" },
        { text: "Monthly result: $4,230.00 in extra income", time: "08:04" },
        { text: "Never imagined achieving this at 44 with zero experience", time: "08:04" },
        { text: "I recommend it to anyone who's afraid to start", time: "08:05" },
        { text: "It's worth way more than what I paid to join", time: "08:05" },
        { text: "Incredible result Maria!! Total inspiration!", time: "08:07", sent: true },
      ],
    },
  ],
  es: [
    {
      name: "Antonio Ferreira",
      avatar: avatarAntonio,
      status: "en línea",
      messages: [
        { text: "Buenas noches a todos, paso a contar mi experiencia", time: "21:34" },
        { text: "Hice mi primera operación hoy siguiendo el paso a paso que me mandó el soporte", time: "21:34" },
        { text: "Resultado del día: $127,00 netos en la cuenta", time: "21:35" },
        { text: "Mi esposa vio el comprobante y no lo podía creer", time: "21:35" },
        { text: "Tengo 48 años y pensaba que no iba a poder. Gracias de verdad", time: "21:36" },
        { text: "¡Felicidades Antonio!! Te lo merecés, seguí firme!", time: "21:37", sent: true },
      ],
    },
    {
      name: "Claudia Nascimento",
      avatar: avatarClaudia,
      status: "en línea",
      messages: [
        { text: "Gente necesito compartir esto con ustedes", time: "14:12" },
        { text: "Logré pagar TODAS las cuentas atrasadas este mes", time: "14:12" },
        { text: "Por primera vez en 3 años no le debo nada a nadie", time: "14:13" },
        { text: "Luz, agua, tarjeta de crédito, todo pago", time: "14:13" },
        { text: "Solo tengo que agradecer. Este método me cambió la vida", time: "14:14" },
        { text: "¡Qué lindo Claudia! Sos una inspiración para todos!", time: "14:15", sent: true },
      ],
    },
    {
      name: "Carlos Mendonça",
      avatar: avatarCarlos,
      status: "últ. vez a las 19:42",
      messages: [
        { text: "Confieso que tenía mucho miedo de empezar", time: "19:20" },
        { text: "Ya perdí plata en internet 2 veces antes con promesas falsas", time: "19:20" },
        { text: "Pero acá el soporte me ayudó en cada etapa, sin dejarme perdido", time: "19:21" },
        { text: "Hoy hago en promedio $200 por día solo usando el celular", time: "19:22" },
        { text: "Mi esposa lo vio y también quiso empezar. Ya está sacando $80 por día", time: "19:22" },
        { text: "¡Qué orgullo Carlos! Ustedes dos son ejemplo para todo el grupo!", time: "19:25", sent: true },
      ],
    },
    {
      name: "María José Santos",
      avatar: avatarMaria,
      status: "en línea",
      messages: [
        { text: "Buen día grupo", time: "08:03" },
        { text: "Completé 1 mes usando la plataforma y vine a dar mi feedback", time: "08:03" },
        { text: "Resultado del mes: $4.230,00 de ingreso extra", time: "08:04" },
        { text: "Nunca imaginé lograr esto con 44 años y sin experiencia ninguna", time: "08:04" },
        { text: "Lo recomiendo a cualquier persona que tenga miedo de empezar", time: "08:05" },
        { text: "Vale mucho más de lo que pagué para entrar", time: "08:05" },
        { text: "¡Resultado increíble María!! Inspiración total!", time: "08:07", sent: true },
      ],
    },
  ],
};

const youngChatsI18n: Record<Language, WhatsAppChat[]> = {
  pt: [
    {
      name: "Rafael Souza",
      avatar: avatarRafael,
      status: "online",
      messages: [
        { text: "Pessoal, vim compartilhar meu resultado da semana", time: "20:14" },
        { text: "Comecei segunda-feira e já fechei a semana com R$620 de lucro", time: "20:14" },
        { text: "Dedico uns 20 minutos por dia, geralmente à noite depois do trabalho", time: "20:15" },
        { text: "Tenho 28 anos e sempre quis ter uma renda extra consistente", time: "20:15" },
        { text: "O sistema realmente funciona. Não é promessa, é resultado", time: "20:16" },
        { text: "Parabéns Rafael! Resultado muito sólido pra primeira semana!", time: "20:17", sent: true },
      ],
    },
    {
      name: "Juliana Martins",
      avatar: avatarCamila,
      status: "online",
      messages: [
        { text: "Gente, preciso contar uma coisa", time: "15:32" },
        { text: "Consegui juntar o suficiente pra dar entrada no meu apartamento", time: "15:32" },
        { text: "Em 3 meses acumulei mais de R$9.000 de renda extra", time: "15:33" },
        { text: "Continuo no meu emprego e uso isso como complemento", time: "15:33" },
        { text: "Com 25 anos, nunca imaginei que seria possível", time: "15:34" },
        { text: "Que conquista Juliana! Exemplo de disciplina e foco!", time: "15:35", sent: true },
      ],
    },
    {
      name: "Pedro Henrique",
      avatar: avatarPedro,
      status: "visto por último às 22:10",
      messages: [
        { text: "Confesso que pesquisei muito antes de entrar", time: "22:01" },
        { text: "Já tinha visto muita coisa na internet que não funcionava", time: "22:01" },
        { text: "Mas aqui o suporte respondeu todas as minhas dúvidas antes mesmo de eu começar", time: "22:02" },
        { text: "Hoje tiro em média R$150 por dia dedicando 15 minutos", time: "22:03" },
        { text: "Tenho 31 anos e finalmente sinto que estou construindo algo sólido", time: "22:03" },
        { text: "Seu relato é muito importante Pedro! Continue firme!", time: "22:05", sent: true },
      ],
    },
    {
      name: "Amanda Costa",
      avatar: avatarAmanda,
      status: "online",
      messages: [
        { text: "Bom dia pessoal!", time: "09:12" },
        { text: "1 mês completo e vim compartilhar: R$3.850 de renda extra", time: "09:12" },
        { text: "Uso no horário de almoço e um pouco antes de dormir", time: "09:13" },
        { text: "Com 24 anos, era a pessoa mais cética do grupo kk", time: "09:13" },
        { text: "Mas os números não mentem. Recomendo para quem está em dúvida", time: "09:14" },
        { text: "Amanda, resultado incrível! Obrigado por compartilhar!", time: "09:16", sent: true },
      ],
    },
  ],
  en: [
    {
      name: "Rafael Souza",
      avatar: avatarRafael,
      status: "online",
      messages: [
        { text: "Hey everyone, came to share my weekly results", time: "20:14" },
        { text: "Started on Monday and already closed the week with $620 in profit", time: "20:14" },
        { text: "I dedicate about 20 minutes a day, usually at night after work", time: "20:15" },
        { text: "I'm 28 and always wanted a consistent side income", time: "20:15" },
        { text: "The system really works. It's not a promise, it's results", time: "20:16" },
        { text: "Congrats Rafael! Very solid result for your first week!", time: "20:17", sent: true },
      ],
    },
    {
      name: "Juliana Martins",
      avatar: avatarCamila,
      status: "online",
      messages: [
        { text: "Guys, I need to tell you something", time: "15:32" },
        { text: "I saved enough for the down payment on my apartment", time: "15:32" },
        { text: "In 3 months I accumulated over $9,000 in extra income", time: "15:33" },
        { text: "I still keep my job and use this as a supplement", time: "15:33" },
        { text: "At 25, I never imagined this would be possible", time: "15:34" },
        { text: "What an achievement Juliana! Example of discipline and focus!", time: "15:35", sent: true },
      ],
    },
    {
      name: "Pedro Henrique",
      avatar: avatarPedro,
      status: "last seen at 22:10",
      messages: [
        { text: "I have to admit I did a lot of research before joining", time: "22:01" },
        { text: "I'd seen a lot of stuff online that didn't work", time: "22:01" },
        { text: "But here the support answered all my questions before I even started", time: "22:02" },
        { text: "Today I make an average of $150 per day dedicating 15 minutes", time: "22:03" },
        { text: "I'm 31 and finally feel like I'm building something solid", time: "22:03" },
        { text: "Your story matters a lot Pedro! Keep going strong!", time: "22:05", sent: true },
      ],
    },
    {
      name: "Amanda Costa",
      avatar: avatarAmanda,
      status: "online",
      messages: [
        { text: "Good morning everyone!", time: "09:12" },
        { text: "1 full month and here to share: $3,850 in extra income", time: "09:12" },
        { text: "I use it during lunch break and a bit before bed", time: "09:13" },
        { text: "At 24, I was the most skeptical person in the group lol", time: "09:13" },
        { text: "But numbers don't lie. I recommend it to anyone who's in doubt", time: "09:14" },
        { text: "Amanda, incredible result! Thank you for sharing!", time: "09:16", sent: true },
      ],
    },
  ],
  es: [
    {
      name: "Rafael Souza",
      avatar: avatarRafael,
      status: "en línea",
      messages: [
        { text: "Hola a todos, vine a compartir mi resultado de la semana", time: "20:14" },
        { text: "Empecé el lunes y ya cerré la semana con $620 de ganancia", time: "20:14" },
        { text: "Dedico unos 20 minutos por día, generalmente a la noche después del trabajo", time: "20:15" },
        { text: "Tengo 28 años y siempre quise tener un ingreso extra consistente", time: "20:15" },
        { text: "El sistema realmente funciona. No es promesa, son resultados", time: "20:16" },
        { text: "¡Felicidades Rafael! Resultado muy sólido para tu primera semana!", time: "20:17", sent: true },
      ],
    },
    {
      name: "Juliana Martins",
      avatar: avatarCamila,
      status: "en línea",
      messages: [
        { text: "Gente, necesito contarles algo", time: "15:32" },
        { text: "Logré juntar lo suficiente para la entrada de mi departamento", time: "15:32" },
        { text: "En 3 meses acumulé más de $9.000 de ingreso extra", time: "15:33" },
        { text: "Sigo en mi trabajo y uso esto como complemento", time: "15:33" },
        { text: "Con 25 años, nunca imaginé que sería posible", time: "15:34" },
        { text: "¡Qué logro Juliana! Ejemplo de disciplina y enfoque!", time: "15:35", sent: true },
      ],
    },
    {
      name: "Pedro Henrique",
      avatar: avatarPedro,
      status: "últ. vez a las 22:10",
      messages: [
        { text: "Confieso que investigué mucho antes de entrar", time: "22:01" },
        { text: "Ya había visto muchas cosas en internet que no funcionaban", time: "22:01" },
        { text: "Pero acá el soporte respondió todas mis dudas antes de empezar", time: "22:02" },
        { text: "Hoy saco en promedio $150 por día dedicando 15 minutos", time: "22:03" },
        { text: "Tengo 31 años y finalmente siento que estoy construyendo algo sólido", time: "22:03" },
        { text: "¡Tu relato es muy importante Pedro! Seguí firme!", time: "22:05", sent: true },
      ],
    },
    {
      name: "Amanda Costa",
      avatar: avatarAmanda,
      status: "en línea",
      messages: [
        { text: "¡Buen día a todos!", time: "09:12" },
        { text: "1 mes completo y vine a compartir: $3.850 de ingreso extra", time: "09:12" },
        { text: "Lo uso en el horario de almuerzo y un poco antes de dormir", time: "09:13" },
        { text: "Con 24 años, era la persona más escéptica del grupo jaja", time: "09:13" },
        { text: "Pero los números no mienten. Lo recomiendo a quien tenga dudas", time: "09:14" },
        { text: "¡Amanda, resultado increíble! Gracias por compartir!", time: "09:16", sent: true },
      ],
    },
  ],
};

const WhatsAppBubble = ({ msg }: { msg: WhatsAppMessage }) => (
  <div className={`flex ${msg.sent ? "justify-end" : "justify-start"} mb-[6px]`}>
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

const WhatsAppScreen = ({ chat, todayLabel, inputPlaceholder }: { chat: WhatsAppChat; todayLabel: string; inputPlaceholder: string }) => (
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
      <img src={chat.avatar} alt={chat.name} className="w-[34px] h-[34px] rounded-full object-cover" />
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
          {todayLabel}
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
        <span className="text-[#8696a0] text-[15px] flex-1">{inputPlaceholder}</span>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="#8696a0"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" fill="none" stroke="#8696a0" strokeWidth="2" strokeLinecap="round"/></svg>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="#8696a0"><path d="M12 15c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v7c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 15 6.7 12H5c0 3.41 2.72 6.23 6 6.72V22h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/></svg>
      </div>
      <div className="w-[42px] h-[42px] rounded-full bg-[#00a884] flex items-center justify-center">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/></svg>
      </div>
    </div>
  </div>
);

const StepWhatsAppProof = ({ onNext, userAge }: StepWhatsAppProps) => {
  const { lang } = useLanguage();
  const t = ui[lang];
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const young = isYoungProfile(userAge);
  const chats = young ? youngChatsI18n[lang] : matureChatsI18n[lang];

  const goNext = useCallback(() => {
    setCurrent((p) => (p + 1) % chats.length);
  }, [chats.length]);

  useEffect(() => {
    if (paused) return;
    const interval = setInterval(goNext, 2000);
    return () => clearInterval(interval);
  }, [paused, goNext]);

  return (
    <StepContainer>
      <StepTitle>
        {t.title1}<span className="text-gradient-green">{t.titleHL}</span>
      </StepTitle>
      <StepSubtitle>{t.subtitle}</StepSubtitle>

      {/* Carousel */}
      <div className="w-full overflow-hidden relative">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {chats.map((chat, i) => (
            <div key={i} className="w-full shrink-0 px-1">
              <WhatsAppScreen chat={chat} todayLabel={t.today} inputPlaceholder={t.inputPlaceholder} />
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
          {t.prev}
        </button>
        <button
          onClick={() => { setCurrent((p) => (p + 1) % chats.length); setPaused(true); }}
          className="flex-1 py-3 rounded-xl bg-secondary text-foreground font-semibold text-sm cursor-pointer"
        >
          {t.next}
        </button>
      </div>

      <CTAButton onClick={onNext} className="mt-2">{t.cta}</CTAButton>
    </StepContainer>
  );
};

export default StepWhatsAppProof;
