import { useState, useEffect, useRef, useCallback } from "react";
import { StepContainer, StepTitle, StepSubtitle, CTAButton } from "./QuizUI";
import {
  Play, Power, Bot, TrendingUp, Banknote, Bell,
  BarChart3, Lock, Loader2, X, Target, Clock,
} from "lucide-react";

interface StepPlatformDemoProps {
  onNext: () => void;
  userName?: string;
}

/* ─── Operation pairs ─── */
const pares = [
  "EUR/USD", "GBP/USD", "USD/JPY", "BTC/USD", "ETH/USD",
  "AUD/USD", "XAU/USD", "USD/CAD", "GBP/JPY", "SOL/USD",
  "EUR/GBP", "NZD/USD", "USD/CHF",
];

const precos = [
  "1.08432", "1.26781", "149.320", "67,241.00", "3,412.50",
  "0.65123", "2,341.80", "1.36540", "188.410", "148.22",
  "0.85612", "0.61234", "0.87654",
];

/* ─── Goal Popup ─── */
const GoalPopup = ({ onSubmit, userName }: { onSubmit: (goal: number, time: string) => void; userName?: string }) => {
  const [goal, setGoal] = useState("");
  const [time, setTime] = useState("");
  const firstName = userName?.split(" ")[0] || "";

  const timeOptions = [
    { label: "30 minutos", value: "30min" },
    { label: "1 hora", value: "1h" },
    { label: "2 horas", value: "2h" },
    { label: "Tempo livre", value: "livre" },
  ];

  const goalNum = parseFloat(goal.replace(/\D/g, "")) || 0;
  const canSubmit = goalNum >= 10 && time !== "";

  const formatGoal = (val: string) => {
    const nums = val.replace(/\D/g, "");
    if (!nums) return "";
    return `R$ ${parseInt(nums).toLocaleString("pt-BR")}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in px-4">
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="bg-primary/10 border-b border-border px-5 py-4 text-center">
          <div className="w-12 h-12 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto mb-3">
            <Target className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-display font-bold text-lg text-foreground">
            {firstName ? `${firstName}, configure` : "Configure"} sua meta
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            A IA vai operar até bater sua meta automaticamente
          </p>
        </div>

        {/* Body */}
        <div className="px-5 py-5 space-y-5">
          {/* Goal input */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Banknote className="w-4 h-4 text-primary" />
              Qual sua meta de ganho?
            </label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="Ex: R$ 500"
              value={goal}
              onChange={(e) => setGoal(formatGoal(e.target.value))}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground text-lg font-bold placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
            <p className="text-[10px] text-muted-foreground">Mínimo R$10 — sem limite máximo</p>
          </div>

          {/* Time selection */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-primary" />
              Tempo disponível hoje?
            </label>
            <div className="grid grid-cols-2 gap-2">
              {timeOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTime(opt.value)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    time === opt.value
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border bg-secondary text-muted-foreground hover:border-muted-foreground/40"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={() => canSubmit && onSubmit(goalNum, time)}
            disabled={!canSubmit}
            className={`w-full py-4 rounded-2xl font-extrabold text-base tracking-wide transition-all duration-300 ${
              canSubmit
                ? "bg-primary text-primary-foreground funnel-glow-button hover:brightness-110 active:scale-[0.98] cursor-pointer"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <Play className="w-5 h-5" fill="currentColor" />
              INICIAR ROBÔ
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Analyzing Bar ─── */
const AnalyzingBar = ({ onDone }: { onDone: () => void }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const duration = 2000 + Math.random() * 1500; // 2-3.5s
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, (elapsed / duration) * 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(interval);
        setTimeout(onDone, 300);
      }
    }, 50);
    return () => clearInterval(interval);
  }, [onDone]);

  return (
    <div className="w-full py-3 px-3 animate-fade-in">
      <div className="flex items-center gap-2 mb-2">
        <Loader2 className="w-3.5 h-3.5 text-accent animate-spin" />
        <span className="text-xs font-semibold text-accent">Analisando mercado...</span>
      </div>
      <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full progress-bar-fill rounded-full transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

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
          <p className="text-xs font-bold text-primary">Operação concluída ✓</p>
          <p className="text-xs text-foreground mt-0.5">{text}</p>
        </div>
      </div>
    </div>
  );
};

/* ─── Main Component ─── */
const StepPlatformDemo = ({ onNext, userName }: StepPlatformDemoProps) => {
  const firstName = userName?.split(" ")[0] || "";

  // States
  const [showPopup, setShowPopup] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [goal, setGoal] = useState(0);
  const [balance, setBalance] = useState(362.72);
  const [profit, setProfit] = useState(0);
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);
  const [history, setHistory] = useState<Array<{
    hora: string; par: string; preco: string; lucro: number; tipo: "win" | "loss";
  }>>([]);
  const [notification, setNotification] = useState<string | null>(null);
  const [goalReached, setGoalReached] = useState(false);
  const [showCTA, setShowCTA] = useState(false);

  const historyRef = useRef<HTMLDivElement>(null);
  const opTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const totalOpsRef = useRef(0);
  const accumulatedRef = useRef(0);

  const dismissNotification = useCallback(() => setNotification(null), []);

  // Handle goal submission
  const handleGoalSubmit = (goalValue: number, _time: string) => {
    setGoal(goalValue);
    setShowPopup(false);
    setIsActive(true);
    setIsAnalyzing(true);
  };

  // Run an operation cycle: analyze → complete → repeat
  const runNextOperation = useCallback(() => {
    if (accumulatedRef.current >= goal && goal > 0) {
      setGoalReached(true);
      setShowCTA(true);
      return;
    }

    setIsAnalyzing(true);
  }, [goal]);

  // When analyzing finishes, add a completed operation
  const handleAnalysisDone = useCallback(() => {
    setIsAnalyzing(false);

    const remaining = goal - accumulatedRef.current;
    // Calculate how many ops we roughly need in 3 minutes (180s)
    // Each op takes ~4-5s (2-3.5s analyzing + delay), so roughly 36-45 ops in 3min
    // We want to finish in ~3min, so distribute remaining across remaining ops
    const opsRemaining = Math.max(1, Math.ceil((180 - totalOpsRef.current * 4.5) / 4.5));

    // 85% chance of win
    const isWin = Math.random() < 0.85;

    let lucro: number;
    if (isWin) {
      // Calculate a lucro that will make us reach goal in ~3 min
      const basePerOp = remaining / Math.max(1, opsRemaining);
      const variance = basePerOp * (0.4 + Math.random() * 1.2); // 40-160% of base
      lucro = Math.max(5, Math.min(remaining * 0.15, variance));
      lucro = parseFloat(lucro.toFixed(2));
    } else {
      // Small loss
      lucro = -parseFloat((Math.random() * 15 + 3).toFixed(2));
    }

    const parIndex = Math.floor(Math.random() * pares.length);
    const hora = new Date().toLocaleTimeString("pt-BR").slice(0, 8);

    const entry = {
      hora,
      par: pares[parIndex],
      preco: precos[parIndex],
      lucro,
      tipo: (isWin ? "win" : "loss") as "win" | "loss",
    };

    totalOpsRef.current++;
    accumulatedRef.current += lucro;

    setHistory(prev => [...prev, entry]);
    setProfit(prev => parseFloat((prev + lucro).toFixed(2)));
    setBalance(prev => parseFloat((prev + lucro).toFixed(2)));
    if (isWin) setWins(prev => prev + 1);
    else setLosses(prev => prev + 1);

    if (isWin) {
      setNotification(`+R$${lucro.toFixed(2)} em ${pares[parIndex]}`);
    }

    // Check if goal reached
    if (accumulatedRef.current >= goal) {
      setTimeout(() => {
        setGoalReached(true);
        setShowCTA(true);
      }, 1500);
      return;
    }

    // Schedule next operation
    const delay = 800 + Math.random() * 1200;
    opTimerRef.current = setTimeout(runNextOperation, delay);
  }, [goal, runNextOperation]);

  // Start first operation when active
  useEffect(() => {
    if (isActive && isAnalyzing && totalOpsRef.current === 0) {
      // First analysis is already triggered
    }
  }, [isActive, isAnalyzing]);

  // Auto-scroll history
  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }
  }, [history]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (opTimerRef.current) clearTimeout(opTimerRef.current);
    };
  }, []);

  return (
    <StepContainer>
      <StepTitle>
        {firstName ? `${firstName}, veja` : "Veja"} a plataforma <span className="text-gradient-green">funcionando ao vivo</span>
      </StepTitle>
      <StepSubtitle>
        {!isActive
          ? "Essa é a mesma plataforma que você vai receber. Aperte para iniciar o robô:"
          : goalReached
            ? "🎯 Meta batida! A IA atingiu seu objetivo. Imagine isso todos os dias."
            : "A IA está operando em tempo real. Acompanhe:"}
      </StepSubtitle>

      {/* ═══ PLATFORM SCREEN ═══ */}
      <div className="w-full rounded-2xl border border-border overflow-hidden bg-card shadow-2xl">

        {/* ── Header bar ── */}
        <div className="bg-secondary/80 px-3 sm:px-4 py-2.5 flex items-center justify-between border-b border-border">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive ? "bg-primary/20 border border-primary/30" : "bg-destructive/20 border border-destructive/30"}`}>
              <Power className={`w-4 h-4 ${isActive ? "text-primary" : "text-destructive"}`} />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground leading-tight">Conta Real</p>
              <p className="text-[10px] text-muted-foreground">CR4571099 - USD</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-secondary border border-border flex items-center justify-center">
              <span className="text-[10px]">🇧🇷</span>
            </div>
            <div className="w-7 h-7 rounded-full bg-secondary border border-border flex items-center justify-center">
              <Bell className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
          </div>
        </div>

        {/* ── Saldo / Lucro boxes ── */}
        <div className="px-3 sm:px-4 py-3 flex gap-2 border-b border-border">
          <div className="flex-1 bg-secondary/60 rounded-xl p-3 border border-border">
            <p className="text-[10px] text-muted-foreground">Saldo</p>
            <p className="text-lg sm:text-xl font-bold text-foreground font-display leading-tight mt-0.5">
              $ {balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="flex-1 bg-secondary/60 rounded-xl p-3 border border-border">
            <p className="text-[10px] text-muted-foreground">Lucro/Prejuízo</p>
            <p className={`text-lg sm:text-xl font-bold font-display leading-tight mt-0.5 ${
              profit > 0 ? "text-primary" : profit < 0 ? "text-destructive" : "text-foreground"
            }`}>
              {profit >= 0 ? "+" : ""}$ {profit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* ── Robot status ── */}
        <div className="px-3 sm:px-4 py-4 text-center border-b border-border">
          <div className="flex items-center justify-center gap-2 mb-1.5">
            <Bot className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-bold text-foreground tracking-wide">EASY 2.0</span>
          </div>
          {!isActive ? (
            <p className="text-sm text-muted-foreground font-medium">robô parado</p>
          ) : goalReached ? (
            <div className="space-y-1">
              <p className="text-sm text-primary font-bold animate-pulse">🎯 META BATIDA!</p>
              <p className="text-xs text-muted-foreground">
                Meta de R${goal.toLocaleString("pt-BR")} atingida com sucesso
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-sm text-primary font-semibold">robô operando</p>
              {goal > 0 && (
                <div className="w-full max-w-xs mx-auto">
                  <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                    <span>Progresso da meta</span>
                    <span className="text-primary font-medium">
                      {Math.min(100, Math.round((Math.max(0, profit) / goal) * 100))}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full progress-bar-fill rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(100, (Math.max(0, profit) / goal) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Analyzing bar ── */}
        {isAnalyzing && isActive && (
          <AnalyzingBar onDone={handleAnalysisDone} />
        )}

        {/* ── Action buttons (before start) ── */}
        {!isActive && (
          <div className="px-3 sm:px-4 py-5 flex gap-2">
            <button
              onClick={() => setShowPopup(true)}
              className="flex-1 py-3 rounded-xl border border-primary/40 bg-primary/10 text-primary font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer hover:bg-primary/20 active:scale-[0.98] transition-all"
            >
              <Play className="w-4 h-4" fill="currentColor" /> Iniciar Robô
            </button>
            <button className="flex-1 py-3 rounded-xl border border-border bg-secondary text-muted-foreground font-semibold text-sm flex items-center justify-center gap-2 cursor-default">
              <Bot className="w-4 h-4" /> Selecionar Robô
            </button>
          </div>
        )}

        {/* ── History table ── */}
        <div className="border-t border-border">
          {/* Tabs */}
          <div className="flex border-b border-border">
            <div className="flex-1 py-2.5 text-center text-xs font-bold text-foreground bg-primary/10 border-b-2 border-primary">
              Tabela
            </div>
            <div className="flex-1 py-2.5 text-center text-xs font-medium text-muted-foreground cursor-default">
              Gráfico
            </div>
          </div>

          {/* Table header */}
          <div className="px-3 sm:px-4 py-2.5 flex items-center justify-between border-b border-border/50">
            <div className="flex items-center gap-2">
              <p className="text-xs font-bold text-foreground">Histórico de Operações</p>
              <span className="text-xs">
                <span className="text-primary font-bold">{wins}</span>
                <span className="text-muted-foreground"> / </span>
                <span className="text-destructive font-bold">{losses}</span>
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Bell className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground font-medium">{history.length}</span>
            </div>
          </div>

          {/* Column headers */}
          <div className="px-3 sm:px-4 py-2 grid grid-cols-4 gap-1 border-b border-border/30 bg-secondary/30">
            <span className="text-[10px] font-semibold text-muted-foreground">Hora</span>
            <span className="text-[10px] font-semibold text-muted-foreground">Par</span>
            <span className="text-[10px] font-semibold text-muted-foreground text-right">Preço</span>
            <span className="text-[10px] font-semibold text-muted-foreground text-right">Lucro</span>
          </div>

          {/* Rows */}
          <div
            ref={historyRef}
            className="max-h-[200px] sm:max-h-[240px] overflow-y-auto"
            style={{ scrollBehavior: "smooth" }}
          >
            {history.length === 0 && (
              <div className="py-8 text-center">
                <p className="text-xs text-muted-foreground">Nenhuma operação ainda</p>
              </div>
            )}
            {history.map((op, i) => (
              <div
                key={i}
                className="px-3 sm:px-4 py-2 grid grid-cols-4 gap-1 border-b border-border/10 animate-fade-in"
              >
                <span className="text-[10px] text-muted-foreground font-mono">{op.hora}</span>
                <span className="text-[10px] font-semibold text-foreground">{op.par}</span>
                <span className="text-[10px] text-muted-foreground text-right font-mono">{op.preco}</span>
                <span className={`text-[10px] font-bold text-right ${
                  op.tipo === "win" ? "text-primary" : "text-destructive"
                }`}>
                  {op.lucro >= 0 ? "+" : ""}${op.lucro.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
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
      {showCTA && (
        <CTAButton onClick={onNext} className="animate-fade-in">
          QUERO GARANTIR MINHA VAGA →
        </CTAButton>
      )}

      {/* ─── Goal Popup ─── */}
      {showPopup && (
        <GoalPopup onSubmit={handleGoalSubmit} userName={userName} />
      )}

      {/* ─── Notification Toast ─── */}
      {notification && (
        <NotificationToast text={notification} onDone={dismissNotification} />
      )}
    </StepContainer>
  );
};

export default StepPlatformDemo;
