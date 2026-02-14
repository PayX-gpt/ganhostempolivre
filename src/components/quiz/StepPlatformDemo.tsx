import { useState, useEffect, useRef, useCallback } from "react";
import { StepContainer, StepTitle, StepSubtitle, CTAButton } from "./QuizUI";

interface StepPlatformDemoProps {
  onNext: () => void;
  userName?: string;
}

/* ─── Data ─── */
const feedbacks = [
  { nome: "Amanda R.", cidade: "SP", valor: "R$2.193", msg: "Nunca pensei que ia funcionar tão rápido!" },
  { nome: "Carlos M.", cidade: "RJ", valor: "R$318", msg: "Saquei pro Nubank em 10 min." },
  { nome: "Julia A.", cidade: "PR", valor: "R$4.105", msg: "Só dou play e deixo rodando." },
  { nome: "Leonardo S.", cidade: "DF", valor: "R$1.020", msg: "Fiz 2 saques em 3 dias." },
  { nome: "Bruna T.", cidade: "MG", valor: "R$3.340", msg: "Meu marido não acreditou até cair o Pix." },
  { nome: "Thiago L.", cidade: "CE", valor: "R$5.020", msg: "Essa IA é surreal. Obrigado!" },
  { nome: "Fernanda G.", cidade: "BA", valor: "R$1.870", msg: "Comecei ontem e já tive resultado." },
  { nome: "Ricardo P.", cidade: "RS", valor: "R$2.560", msg: "Simples demais. Até minha mãe usa." },
  { nome: "Patrícia L.", cidade: "GO", valor: "R$980", msg: "Primeiro saque em menos de 24h." },
  { nome: "Marcos V.", cidade: "PE", valor: "R$3.710", msg: "Melhor decisão que tomei esse ano." },
];

const saqueNotificacoes = [
  "Pix recebido: R$729,22 via Nubank",
  "Saque efetuado: R$1.382,00 via Itaú",
  "Transferência: R$2.015,77 via Mercado Pago",
  "Pix automático: R$937,50 via C6 Bank",
  "Saque confirmado: R$1.080,00 via Bradesco",
  "Pix recebido: R$456,30 via PicPay",
  "Saque efetuado: R$2.200,00 via Inter",
];

/* ─── Feed Line Component ─── */
const FeedLine = ({ nome, cidade, msg, valor, hora }: {
  nome: string; cidade: string; msg: string; valor: string; hora: string;
}) => (
  <div className="py-2.5 border-b border-border/30 last:border-0 animate-fade-in">
    <div className="flex items-start justify-between gap-2">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-muted-foreground/60">{hora}</span>
          <span className="text-xs font-semibold text-foreground">{nome}</span>
          <span className="text-xs text-muted-foreground">({cidade})</span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{msg}</p>
      </div>
      <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">
        +{valor}
      </span>
    </div>
  </div>
);

/* ─── Notification Toast ─── */
const NotificationToast = ({ text, onDone }: { text: string; onDone: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onDone, 4000);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-xs z-50 animate-slide-up">
      <div className="bg-card border border-primary/30 rounded-xl px-4 py-3 shadow-2xl flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
          <span className="text-sm">💸</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-primary">Transação confirmada</p>
          <p className="text-xs text-foreground mt-0.5">{text}</p>
        </div>
      </div>
    </div>
  );
};

/* ─── Stat Card ─── */
const StatCard = ({ icon, label, value, pulse }: {
  icon: string; label: string; value: string; pulse?: boolean;
}) => (
  <div className="funnel-card p-3 sm:p-4 flex-1 min-w-0 text-center space-y-1">
    <span className="text-xl sm:text-2xl">{icon}</span>
    <p className={`text-lg sm:text-xl font-bold text-foreground leading-tight ${pulse ? "animate-pulse" : ""}`}>
      {value}
    </p>
    <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight">{label}</p>
  </div>
);

/* ─── Simulated Chart Bars ─── */
const MiniChart = () => {
  const bars = [35, 52, 44, 68, 58, 72, 65, 80, 74, 88, 82, 95];
  return (
    <div className="flex items-end gap-[3px] sm:gap-1 h-12 sm:h-16 w-full justify-center">
      {bars.map((h, i) => (
        <div
          key={i}
          className="flex-1 max-w-3 rounded-t-sm progress-bar-fill transition-all duration-1000"
          style={{
            height: `${h}%`,
            opacity: 0.5 + (h / 200),
            animationDelay: `${i * 100}ms`,
          }}
        />
      ))}
    </div>
  );
};

/* ─── Main Component ─── */
const StepPlatformDemo = ({ onNext, userName }: StepPlatformDemoProps) => {
  const firstName = userName?.split(" ")[0] || "";
  const [onlineCount, setOnlineCount] = useState(3821);
  const [totalSaque, setTotalSaque] = useState(1942330);
  const [feedItems, setFeedItems] = useState<Array<typeof feedbacks[0] & { hora: string }>>([]);
  const [notification, setNotification] = useState<string | null>(null);
  const [showCTA, setShowCTA] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);
  const feedIndexRef = useRef(0);

  // Show CTA after 8 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowCTA(true), 8000);
    return () => clearTimeout(timer);
  }, []);

  // Online counter
  useEffect(() => {
    const interval = setInterval(() => {
      setOnlineCount((prev) => prev + Math.floor(Math.random() * 3) + 1);
    }, 2600);
    return () => clearInterval(interval);
  }, []);

  // Total saque counter
  useEffect(() => {
    const interval = setInterval(() => {
      setTotalSaque((prev) => prev + Math.floor(Math.random() * 400) + 20);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Feed items
  useEffect(() => {
    // Add initial items
    const now = new Date();
    const initial = feedbacks.slice(0, 3).map((f, i) => ({
      ...f,
      hora: new Date(now.getTime() - (3 - i) * 60000).toLocaleTimeString("pt-BR").slice(0, 5),
    }));
    setFeedItems(initial);
    feedIndexRef.current = 3;

    const interval = setInterval(() => {
      const f = feedbacks[feedIndexRef.current % feedbacks.length];
      const hora = new Date().toLocaleTimeString("pt-BR").slice(0, 5);
      setFeedItems((prev) => [...prev.slice(-8), { ...f, hora }]);
      feedIndexRef.current++;
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll feed
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [feedItems]);

  // Notification toasts
  useEffect(() => {
    const interval = setInterval(() => {
      const saque = saqueNotificacoes[Math.floor(Math.random() * saqueNotificacoes.length)];
      setNotification(saque);
    }, 9000);
    // First notification after 5s
    const firstTimeout = setTimeout(() => {
      setNotification(saqueNotificacoes[0]);
    }, 5000);
    return () => {
      clearInterval(interval);
      clearTimeout(firstTimeout);
    };
  }, []);

  const dismissNotification = useCallback(() => setNotification(null), []);

  return (
    <StepContainer>
      <StepTitle>
        {firstName ? `${firstName}, veja` : "Veja"} a plataforma <span className="text-gradient-green">funcionando ao vivo</span>
      </StepTitle>
      <StepSubtitle>
        Enquanto você está aqui, milhares de pessoas já estão lucrando. Veja em tempo real:
      </StepSubtitle>

      {/* ─── Stats Row ─── */}
      <div className="w-full flex gap-2 sm:gap-3">
        <StatCard
          icon="🟢"
          label="Lucrando agora"
          value={onlineCount.toLocaleString("pt-BR")}
          pulse
        />
        <StatCard
          icon="💰"
          label="Sacado em 24h"
          value={`R$${(totalSaque / 1000).toFixed(0)}mil`}
        />
      </div>

      {/* ─── Mini Chart ─── */}
      <div className="w-full funnel-card p-3 sm:p-4 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-foreground">📊 Lucros do dia (tempo real)</p>
          <span className="text-[10px] text-primary font-medium bg-primary/10 px-2 py-0.5 rounded-full">
            AO VIVO
          </span>
        </div>
        <MiniChart />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>06:00</span>
          <span>09:00</span>
          <span>12:00</span>
          <span>15:00</span>
          <span>Agora</span>
        </div>
      </div>

      {/* ─── Simulated Platform Screen ─── */}
      <div className="w-full rounded-2xl border border-border overflow-hidden bg-card shadow-2xl">
        {/* App bar */}
        <div className="bg-secondary px-3 sm:px-4 py-2.5 flex items-center justify-between border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-bold text-foreground">Alfa Híbrida</span>
            <span className="text-[10px] text-primary">• Online</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground">Automático</span>
            <div className="w-8 h-4 rounded-full bg-primary/30 relative">
              <div className="w-3.5 h-3.5 rounded-full bg-primary absolute right-0.5 top-0.5 shadow-sm" />
            </div>
          </div>
        </div>

        {/* Balance header */}
        <div className="px-3 sm:px-4 py-3 sm:py-4 text-center bg-primary/5 border-b border-border">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Saldo disponível para saque</p>
          <p className="text-2xl sm:text-3xl font-bold text-foreground mt-1 font-display">
            R$ <span className="text-gradient-green">1.247</span>,80
          </p>
          <div className="flex items-center justify-center gap-1 mt-1">
            <span className="text-xs text-primary">▲ +R$312,50 hoje</span>
          </div>
        </div>

        {/* Quick actions */}
        <div className="px-3 sm:px-4 py-2.5 flex gap-2 border-b border-border">
          <div className="flex-1 bg-primary/10 rounded-xl py-2 text-center cursor-default">
            <span className="text-xs font-semibold text-primary">💸 Sacar via Pix</span>
          </div>
          <div className="flex-1 bg-secondary rounded-xl py-2 text-center cursor-default">
            <span className="text-xs font-semibold text-foreground">📊 Relatório</span>
          </div>
        </div>

        {/* Live feed */}
        <div className="px-3 sm:px-4 py-2">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-foreground">Operações ao vivo</p>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] text-primary font-medium">LIVE</span>
            </div>
          </div>
          <div
            ref={feedRef}
            className="max-h-[180px] sm:max-h-[220px] overflow-y-auto scrollbar-thin"
            style={{ scrollBehavior: "smooth" }}
          >
            {feedItems.map((item, i) => (
              <FeedLine key={`${item.nome}-${i}`} {...item} />
            ))}
          </div>
        </div>
      </div>

      {/* ─── Trust line ─── */}
      <div className="w-full funnel-card border-accent/20 bg-accent/5 text-center p-3">
        <p className="text-xs sm:text-sm text-foreground font-medium leading-relaxed">
          🔒 Plataforma <strong>100% automática</strong>. Basta ativar e acompanhar os resultados no seu celular.
          Sem experiência necessária.
        </p>
      </div>

      {/* ─── CTA ─── */}
      {showCTA ? (
        <CTAButton onClick={onNext} className="animate-fade-in">
          ENTENDI, QUERO CONTINUAR →
        </CTAButton>
      ) : (
        <div className="text-center space-y-2">
          <div className="w-8 h-8 rounded-full border-[3px] border-primary/30 border-t-primary animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground animate-pulse">
            Observe a plataforma funcionando...
          </p>
        </div>
      )}

      {/* ─── Notification Toast ─── */}
      {notification && (
        <NotificationToast text={notification} onDone={dismissNotification} />
      )}
    </StepContainer>
  );
};

export default StepPlatformDemo;
