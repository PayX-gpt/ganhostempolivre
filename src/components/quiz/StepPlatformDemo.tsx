import { useState, useEffect, useRef, useCallback } from "react";
import { StepContainer, StepTitle, StepSubtitle, CTAButton } from "./QuizUI";
import { Banknote, DollarSign, BarChart3, Lock, Loader2, TrendingUp, Play, Zap, ArrowUpRight } from "lucide-react";

interface StepPlatformDemoProps {
  onNext: () => void;
  userName?: string;
}

/* ─── Operation Data ─── */
const operacoes = [
  { par: "EUR/USD", tipo: "COMPRA", lucro: 47.20, duracao: "2min 14s" },
  { par: "BTC/USD", tipo: "COMPRA", lucro: 82.50, duracao: "3min 05s" },
  { par: "GBP/JPY", tipo: "VENDA", lucro: 35.80, duracao: "1min 48s" },
  { par: "USD/CAD", tipo: "COMPRA", lucro: 63.10, duracao: "2min 33s" },
  { par: "ETH/USD", tipo: "COMPRA", lucro: 91.40, duracao: "4min 12s" },
  { par: "AUD/USD", tipo: "VENDA", lucro: 28.60, duracao: "1min 22s" },
  { par: "XAU/USD", tipo: "COMPRA", lucro: 115.30, duracao: "3min 55s" },
  { par: "EUR/GBP", tipo: "VENDA", lucro: 42.90, duracao: "2min 08s" },
  { par: "USD/JPY", tipo: "COMPRA", lucro: 56.70, duracao: "2min 41s" },
  { par: "BTC/USD", tipo: "COMPRA", lucro: 128.00, duracao: "5min 10s" },
  { par: "SOL/USD", tipo: "COMPRA", lucro: 73.20, duracao: "3min 18s" },
  { par: "GBP/USD", tipo: "VENDA", lucro: 39.50, duracao: "1min 56s" },
];

const saqueNotificacoes = [
  "Pix recebido: R$729,22 via Nubank",
  "Saque efetuado: R$1.382,00 via Itaú",
  "Transferência: R$2.015,77 via Mercado Pago",
  "Pix automático: R$937,50 via C6 Bank",
  "Saque confirmado: R$1.080,00 via Bradesco",
];

/* ─── Operation Row ─── */
const OperationRow = ({ par, tipo, lucro, duracao, status }: {
  par: string; tipo: string; lucro: number; duracao: string; status: "running" | "done";
}) => (
  <div className="py-2 border-b border-border/20 last:border-0 animate-fade-in">
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className={`w-2 h-2 rounded-full shrink-0 ${status === "running" ? "bg-accent animate-pulse" : "bg-primary"}`} />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-foreground">{par}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${tipo === "COMPRA" ? "bg-primary/15 text-primary" : "bg-accent/15 text-accent"}`}>
              {tipo}
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground">{duracao}</span>
        </div>
      </div>
      <div className="text-right shrink-0">
        {status === "running" ? (
          <span className="text-xs text-accent font-semibold animate-pulse">Analisando...</span>
        ) : (
          <div className="flex items-center gap-0.5">
            <ArrowUpRight className="w-3 h-3 text-primary" />
            <span className="text-sm font-bold text-primary">+R${lucro.toFixed(2)}</span>
          </div>
        )}
      </div>
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
          <Banknote className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-primary">Transação confirmada</p>
          <p className="text-xs text-foreground mt-0.5">{text}</p>
        </div>
      </div>
    </div>
  );
};

/* ─── Animated Chart ─── */
const LiveChart = ({ active }: { active: boolean }) => {
  const [bars, setBars] = useState([20, 15, 18, 12, 22, 16, 20, 14, 25, 18, 22, 15]);

  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => {
      setBars(prev => prev.map((b, i) => {
        const growth = Math.min(95, b + Math.floor(Math.random() * 8) + 2);
        return growth;
      }));
    }, 1200);
    return () => clearInterval(interval);
  }, [active]);

  return (
    <div className="flex items-end gap-[3px] sm:gap-1 h-14 sm:h-16 w-full justify-center">
      {bars.map((h, i) => (
        <div
          key={i}
          className={`flex-1 max-w-3 rounded-t-sm transition-all duration-1000 ${active ? "progress-bar-fill" : "bg-muted-foreground/20"}`}
          style={{
            height: `${active ? h : 15}%`,
            opacity: active ? 0.5 + (h / 200) : 0.3,
          }}
        />
      ))}
    </div>
  );
};

/* ─── Main Component ─── */
const StepPlatformDemo = ({ onNext, userName }: StepPlatformDemoProps) => {
  const firstName = userName?.split(" ")[0] || "";
  const [isActive, setIsActive] = useState(false);
  const [balance, setBalance] = useState(0);
  const [todayProfit, setTodayProfit] = useState(0);
  const [completedOps, setCompletedOps] = useState<Array<typeof operacoes[0] & { status: "running" | "done" }>>([]);
  const [currentOp, setCurrentOp] = useState<(typeof operacoes[0] & { status: "running" | "done" }) | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [showCTA, setShowCTA] = useState(false);
  const [opCount, setOpCount] = useState(0);
  const feedRef = useRef<HTMLDivElement>(null);
  const opIndexRef = useRef(0);

  const dismissNotification = useCallback(() => setNotification(null), []);

  // Start the simulation
  const handlePlay = () => {
    setIsActive(true);
  };

  // Run operations when active
  useEffect(() => {
    if (!isActive) return;

    const runOperation = () => {
      const op = operacoes[opIndexRef.current % operacoes.length];
      opIndexRef.current++;

      // Show "running" state
      setCurrentOp({ ...op, status: "running" });

      // After 1.5-2.5s, complete the operation
      const completeTime = 1500 + Math.random() * 1000;
      setTimeout(() => {
        const completedOp = { ...op, status: "done" as const };
        setCurrentOp(null);
        setCompletedOps(prev => [...prev.slice(-7), completedOp]);
        setBalance(prev => prev + op.lucro);
        setTodayProfit(prev => prev + op.lucro);
        setOpCount(prev => prev + 1);
      }, completeTime);
    };

    // First operation immediately
    runOperation();

    // Then every 3-4 seconds
    const interval = setInterval(runOperation, 3000 + Math.random() * 1000);

    return () => clearInterval(interval);
  }, [isActive]);

  // Show CTA after enough operations
  useEffect(() => {
    if (opCount >= 4 && !showCTA) {
      setShowCTA(true);
    }
  }, [opCount, showCTA]);

  // Notification toasts when active
  useEffect(() => {
    if (!isActive) return;
    const timeout = setTimeout(() => {
      setNotification(saqueNotificacoes[0]);
    }, 8000);
    const interval = setInterval(() => {
      const saque = saqueNotificacoes[Math.floor(Math.random() * saqueNotificacoes.length)];
      setNotification(saque);
    }, 14000);
    return () => { clearTimeout(timeout); clearInterval(interval); };
  }, [isActive]);

  // Auto-scroll feed
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [completedOps, currentOp]);

  return (
    <StepContainer>
      <StepTitle>
        {firstName ? `${firstName}, veja` : "Veja"} a plataforma <span className="text-gradient-green">funcionando ao vivo</span>
      </StepTitle>
      <StepSubtitle>
        {isActive
          ? "A IA está operando em tempo real. Acompanhe os lucros entrando:"
          : "Essa é a mesma plataforma que você vai receber. Aperte o play e veja a IA operar por você:"}
      </StepSubtitle>

      {/* ═══ PLATFORM SCREEN ═══ */}
      <div className="w-full rounded-2xl border border-border overflow-hidden bg-card shadow-2xl">
        {/* App bar */}
        <div className="bg-secondary px-3 sm:px-4 py-2.5 flex items-center justify-between border-b border-border">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isActive ? "bg-primary animate-pulse" : "bg-muted-foreground/40"}`} />
            <span className="text-xs font-bold text-foreground">Alfa Híbrida</span>
            {isActive && <span className="text-[10px] text-primary font-medium">• Operando</span>}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground">{isActive ? "Automático" : "Pausado"}</span>
            <div className={`w-8 h-4 rounded-full relative transition-colors ${isActive ? "bg-primary/30" : "bg-muted"}`}>
              <div className={`w-3.5 h-3.5 rounded-full shadow-sm absolute top-0.5 transition-all ${isActive ? "bg-primary right-0.5" : "bg-muted-foreground/50 left-0.5"}`} />
            </div>
          </div>
        </div>

        {/* Balance */}
        <div className="px-3 sm:px-4 py-3 sm:py-4 text-center bg-primary/5 border-b border-border">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Saldo disponível para saque</p>
          <p className="text-2xl sm:text-3xl font-bold text-foreground mt-1 font-display">
            R$ <span className={isActive ? "text-gradient-green" : "text-muted-foreground"}>
              {balance.toFixed(2).replace(".", ",")}
            </span>
          </p>
          {isActive && todayProfit > 0 && (
            <div className="flex items-center justify-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3 text-primary" />
              <span className="text-xs text-primary font-medium">+R${todayProfit.toFixed(2).replace(".", ",")} hoje</span>
            </div>
          )}
        </div>

        {/* Chart */}
        <div className="px-3 sm:px-4 py-3 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold text-foreground">Performance</span>
            </div>
            {isActive && (
              <span className="text-[10px] text-primary font-medium bg-primary/10 px-2 py-0.5 rounded-full">
                AO VIVO
              </span>
            )}
          </div>
          <LiveChart active={isActive} />
        </div>

        {/* ─── PLAY BUTTON (before activation) ─── */}
        {!isActive && (
          <div className="px-3 sm:px-4 py-8 flex flex-col items-center gap-4">
            <button
              onClick={handlePlay}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center cursor-pointer hover:bg-primary/30 hover:border-primary/60 active:scale-95 transition-all duration-300 funnel-glow-button"
            >
              <Play className="w-12 h-12 sm:w-14 sm:h-14 text-primary ml-1.5" fill="currentColor" />
            </button>
            <div className="text-center space-y-1">
              <p className="text-sm font-bold text-foreground">Toque para ativar a IA</p>
              <p className="text-xs text-muted-foreground">Veja como ela opera e gera lucro automaticamente</p>
            </div>
          </div>
        )}

        {/* ─── OPERATIONS FEED (after activation) ─── */}
        {isActive && (
          <div className="px-3 sm:px-4 py-2">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-foreground">Operações da IA</p>
              <div className="flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-accent" />
                <span className="text-[10px] text-foreground font-medium">{opCount} concluídas</span>
              </div>
            </div>
            <div
              ref={feedRef}
              className="max-h-[220px] sm:max-h-[260px] overflow-y-auto"
              style={{ scrollBehavior: "smooth" }}
            >
              {completedOps.map((op, i) => (
                <OperationRow key={`done-${i}`} {...op} />
              ))}
              {currentOp && <OperationRow {...currentOp} />}
            </div>
          </div>
        )}

        {/* Quick actions */}
        {isActive && (
          <div className="px-3 sm:px-4 py-2.5 border-t border-border flex gap-2">
            <div className="flex-1 bg-primary/10 rounded-xl py-2.5 text-center cursor-default">
              <span className="text-xs font-semibold text-primary flex items-center justify-center gap-1">
                <Banknote className="w-3.5 h-3.5" /> Sacar via Pix
              </span>
            </div>
            <div className="flex-1 bg-secondary rounded-xl py-2.5 text-center cursor-default">
              <span className="text-xs font-semibold text-foreground flex items-center justify-center gap-1">
                <BarChart3 className="w-3.5 h-3.5" /> Relatório
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ─── Trust line ─── */}
      <div className="w-full funnel-card border-accent/20 bg-accent/5 text-center p-3">
        <div className="flex items-center justify-center gap-2">
          <Lock className="w-4 h-4 text-primary shrink-0" />
          <p className="text-xs sm:text-sm text-foreground font-medium leading-relaxed">
            Plataforma <strong>100% automática</strong>. Basta ativar e acompanhar os resultados no seu celular.
          </p>
        </div>
      </div>

      {/* ─── CTA ─── */}
      {showCTA ? (
        <CTAButton onClick={onNext} className="animate-fade-in">
          QUERO GARANTIR MINHA VAGA →
        </CTAButton>
      ) : isActive ? (
        <div className="flex items-center gap-2 justify-center">
          <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
          <p className="text-sm text-muted-foreground animate-pulse">
            Observe a IA operando por você...
          </p>
        </div>
      ) : null}

      {/* ─── Notification Toast ─── */}
      {notification && (
        <NotificationToast text={notification} onDone={dismissNotification} />
      )}
    </StepContainer>
  );
};

export default StepPlatformDemo;
