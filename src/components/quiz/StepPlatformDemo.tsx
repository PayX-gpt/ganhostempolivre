import { useState, useEffect, useRef, useCallback } from "react";
import { StepContainer, StepTitle, StepSubtitle, CTAButton } from "./QuizUI";
import {
  Play, Power, Bot, TrendingUp, Banknote, Bell,
  BarChart3, Lock, Loader2, Target, Clock, Trophy, Sparkles,
} from "lucide-react";

interface StepPlatformDemoProps {
  onNext: () => void;
  userName?: string;
}

/* ─── Platform color classes (pink/purple theme inline) ─── */
const plat = {
  bg: "bg-[hsl(260,30%,8%)]",
  card: "bg-[hsl(260,25%,12%)]",
  border: "border-[hsl(270,30%,22%)]",
  accent: "text-[hsl(280,70%,65%)]",
  accentBg: "bg-[hsl(280,70%,65%)]",
  accentBgSoft: "bg-[hsl(280,70%,65%,0.12)]",
  accentBorder: "border-[hsl(280,70%,65%,0.3)]",
  tabActive: "bg-[hsl(220,70%,45%)]",
  tabBorder: "border-[hsl(220,70%,45%)]",
  headerBg: "bg-[hsl(260,28%,10%)]",
  secondary: "bg-[hsl(260,22%,15%)]",
  muted: "text-[hsl(260,15%,55%)]",
  green: "text-[hsl(152,60%,42%)]",
  red: "text-[hsl(0,72%,55%)]",
};

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

/* ─── Goal Reached Popup ─── */
const GoalReachedPopup = ({ goal, profit, onContinue, userName }: {
  goal: number; profit: number; onContinue: () => void; userName?: string;
}) => {
  const firstName = userName?.split(" ")[0] || "";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 backdrop-blur-sm animate-fade-in px-4">
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
        {/* Celebration header */}
        <div className="bg-primary/10 border-b border-border px-5 py-6 text-center">
          <div className="w-16 h-16 rounded-full bg-accent/20 border-2 border-accent/40 flex items-center justify-center mx-auto mb-4 animate-bounce-subtle">
            <Trophy className="w-8 h-8 text-accent" />
          </div>
          <h3 className="font-display font-bold text-xl text-foreground">
            META BATIDA!
          </h3>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            {firstName ? `${firstName}, a` : "A"} IA atingiu sua meta de{" "}
            <span className="font-bold text-foreground">R${goal.toLocaleString("pt-BR")}</span> em apenas 2 minutos.
          </p>
        </div>

        {/* Result */}
        <div className="px-5 py-5 space-y-4">
          <div className="funnel-card text-center p-4 border-primary/30">
            <p className="text-xs text-muted-foreground mb-1">Se fosse conta real, você teria ganho:</p>
            <p className="text-3xl font-display font-bold text-foreground">
              R$<span className="text-gradient-green">{Math.max(profit, goal).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
            </p>
            <p className="text-xs text-primary mt-2 font-medium">
              Em apenas 2 minutos, no automático
            </p>
          </div>

          <div className="bg-accent/10 rounded-xl p-3 border border-accent/20">
            <p className="text-xs text-foreground leading-relaxed text-center">
              <span className="font-bold">Imagine isso todos os dias.</span> Seus alunos já fazem isso com conta real e sacam direto pro Pix.
            </p>
          </div>

          <button
            onClick={onContinue}
            className="w-full py-4 rounded-2xl font-extrabold text-base tracking-wide bg-primary text-primary-foreground funnel-glow-button hover:brightness-110 active:scale-[0.98] cursor-pointer transition-all duration-300"
          >
            <span className="flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5" />
              QUERO ACESSAR A PLATAFORMA REAL
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Config Popup ─── */
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
        <div className="bg-primary/10 border-b border-border px-5 py-4 text-center">
          <div className="w-12 h-12 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto mb-3">
            <Target className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-display font-bold text-lg text-foreground">
            {firstName ? `${firstName}, configure` : "Configure"} sua meta
          </h3>
          <p className="text-xs text-muted-foreground mt-1">A IA vai operar até bater sua meta automaticamente</p>
        </div>
        <div className="px-5 py-5 space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Banknote className="w-4 h-4 text-primary" /> Qual sua meta de ganho?
            </label>
            <input
              type="text" inputMode="numeric" placeholder="Ex: R$ 500"
              value={goal} onChange={(e) => setGoal(formatGoal(e.target.value))}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground text-lg font-bold placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
            <p className="text-[10px] text-muted-foreground">Mínimo R$10 — sem limite máximo</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-primary" /> Tempo disponível hoje?
            </label>
            <div className="grid grid-cols-2 gap-2">
              {timeOptions.map((opt) => (
                <button key={opt.value} onClick={() => setTime(opt.value)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    time === opt.value ? "border-primary bg-primary/15 text-primary" : "border-border bg-secondary text-muted-foreground hover:border-muted-foreground/40"
                  }`}
                >{opt.label}</button>
              ))}
            </div>
          </div>
          <button onClick={() => canSubmit && onSubmit(goalNum, time)} disabled={!canSubmit}
            className={`w-full py-4 rounded-2xl font-extrabold text-base tracking-wide transition-all duration-300 ${
              canSubmit ? "bg-primary text-primary-foreground funnel-glow-button hover:brightness-110 active:scale-[0.98] cursor-pointer" : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}>
            <span className="flex items-center justify-center gap-2"><Play className="w-5 h-5" fill="currentColor" /> INICIAR ROBÔ</span>
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
    const duration = 1500 + Math.random() * 1200;
    const start = Date.now();
    const interval = setInterval(() => {
      const pct = Math.min(100, ((Date.now() - start) / duration) * 100);
      setProgress(pct);
      if (pct >= 100) { clearInterval(interval); setTimeout(onDone, 200); }
    }, 40);
    return () => clearInterval(interval);
  }, [onDone]);

  return (
    <div className="w-full py-3 px-3 animate-fade-in">
      <div className="flex items-center gap-2 mb-2">
        <Loader2 className="w-3.5 h-3.5 text-[hsl(280,70%,65%)] animate-spin" />
        <span className="text-xs font-semibold text-[hsl(280,70%,65%)]">Analisando mercado...</span>
      </div>
      <div className="w-full h-2 bg-[hsl(260,22%,15%)] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-100 bg-gradient-to-r from-[hsl(280,70%,55%)] to-[hsl(260,70%,60%)]"
          style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
};

/* ─── Notification Toast ─── */
const NotificationToast = ({ text, onDone }: { text: string; onDone: () => void }) => {
  useEffect(() => { const t = setTimeout(onDone, 3500); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-xs z-50 animate-slide-up">
      <div className="bg-card border border-primary/30 rounded-xl px-4 py-3 shadow-2xl flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
          <Banknote className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-primary">Operação concluída</p>
          <p className="text-xs text-foreground mt-0.5">{text}</p>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════ */
const StepPlatformDemo = ({ onNext, userName }: StepPlatformDemoProps) => {
  const firstName = userName?.split(" ")[0] || "";

  const [showPopup, setShowPopup] = useState(false);
  const [showGoalReached, setShowGoalReached] = useState(false);
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

  const historyRef = useRef<HTMLDivElement>(null);
  const opTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const totalOpsRef = useRef(0);
  const accumulatedRef = useRef(0);
  const startTimeRef = useRef(0);

  const dismissNotification = useCallback(() => setNotification(null), []);

  const GOAL_TIME_MS = 120_000; // 2 minutes

  const handleGoalSubmit = (goalValue: number, _time: string) => {
    setGoal(goalValue);
    setShowPopup(false);
    setIsActive(true);
    setIsAnalyzing(true);
    startTimeRef.current = Date.now();
  };

  const runNextOperation = useCallback(() => {
    if (accumulatedRef.current >= goal && goal > 0) {
      setShowGoalReached(true);
      return;
    }
    setIsAnalyzing(true);
  }, [goal]);

  const handleAnalysisDone = useCallback(() => {
    setIsAnalyzing(false);

    const elapsed = Date.now() - startTimeRef.current;
    const remaining = goal - accumulatedRef.current;
    const timeLeft = Math.max(1, GOAL_TIME_MS - elapsed);
    // Each cycle ~2.5-3.5s => estimate remaining ops
    const estOpsLeft = Math.max(1, Math.floor(timeLeft / 3000));

    const isWin = Math.random() < 0.85;

    let lucro: number;
    if (isWin) {
      // Distribute remaining evenly with variance, accelerate near end
      const base = remaining / estOpsLeft;
      const variance = base * (0.5 + Math.random() * 1.0);
      lucro = Math.max(3, Math.min(remaining * 0.25, variance));
      // If very close to deadline, push harder
      if (timeLeft < 15000 && remaining > 0) {
        lucro = Math.max(lucro, remaining * 0.4);
      }
      lucro = parseFloat(lucro.toFixed(2));
    } else {
      lucro = -parseFloat((Math.random() * 12 + 2).toFixed(2));
    }

    const parIndex = Math.floor(Math.random() * pares.length);
    const hora = new Date().toLocaleTimeString("pt-BR").slice(0, 8);

    totalOpsRef.current++;
    accumulatedRef.current += lucro;

    setHistory(prev => [...prev, { hora, par: pares[parIndex], preco: precos[parIndex], lucro, tipo: isWin ? "win" : "loss" }]);
    setProfit(prev => parseFloat((prev + lucro).toFixed(2)));
    setBalance(prev => parseFloat((prev + lucro).toFixed(2)));
    if (isWin) setWins(prev => prev + 1); else setLosses(prev => prev + 1);
    if (isWin) setNotification(`+R$${lucro.toFixed(2)} em ${pares[parIndex]}`);

    if (accumulatedRef.current >= goal) {
      setTimeout(() => setShowGoalReached(true), 1200);
      return;
    }

    const delay = 600 + Math.random() * 1000;
    opTimerRef.current = setTimeout(runNextOperation, delay);
  }, [goal, runNextOperation]);

  useEffect(() => {
    if (historyRef.current) historyRef.current.scrollTop = historyRef.current.scrollHeight;
  }, [history]);

  useEffect(() => {
    return () => { if (opTimerRef.current) clearTimeout(opTimerRef.current); };
  }, []);

  const goalReached = showGoalReached;
  const progressPct = goal > 0 ? Math.min(100, Math.round((Math.max(0, profit) / goal) * 100)) : 0;

  return (
    <StepContainer>
      <StepTitle>
        {firstName ? `${firstName}, veja` : "Veja"} a plataforma <span className="text-gradient-green">funcionando ao vivo</span>
      </StepTitle>
      <StepSubtitle>
        {!isActive
          ? "Essa é a mesma plataforma que você vai receber. Aperte para iniciar o robô:"
          : goalReached
            ? "A IA atingiu seu objetivo. Imagine isso todos os dias."
            : "A IA está operando em tempo real. Acompanhe:"}
      </StepSubtitle>

      {/* ═══ PLATFORM SCREEN (Pink/Purple theme) ═══ */}
      <div className={`w-full rounded-2xl overflow-hidden shadow-2xl ${plat.bg} ${plat.border} border`}>

        {/* ── Top bar with ALFA HÍBRIDA logo ── */}
        <div className={`${plat.headerBg} px-3 sm:px-4 py-2.5 flex items-center justify-between ${plat.border} border-b`}>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 flex items-center justify-center">
              <Play className="w-3.5 h-3.5 text-[hsl(280,70%,65%)]" fill="currentColor" />
            </div>
            <span className="text-xs font-bold text-foreground tracking-wide">
              <span className={plat.accent}>ALFA</span> HÍBRIDA
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full ${plat.secondary} ${plat.border} border flex items-center justify-center`}>
              <span className="text-[10px]">🇧🇷</span>
            </div>
            <div className={`w-7 h-7 rounded-full bg-[hsl(280,60%,50%)] flex items-center justify-center`}>
              <Bell className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
        </div>

        {/* ── Account header ── */}
        <div className={`${plat.card} mx-3 sm:mx-4 mt-3 rounded-xl p-3 flex items-center gap-3 ${plat.border} border`}>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
            isActive ? "bg-[hsl(152,60%,42%,0.15)] border-[hsl(152,60%,42%,0.3)]" : "bg-[hsl(0,72%,55%,0.15)] border-[hsl(0,72%,55%,0.3)]"
          }`}>
            <Power className={`w-5 h-5 ${isActive ? plat.green : plat.red}`} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-foreground leading-tight">Conta Demo</p>
            <p className="text-[10px] text-[hsl(260,15%,55%)]">DM7829401 - USD</p>
          </div>
        </div>

        {/* ── Saldo / Lucro ── */}
        <div className="px-3 sm:px-4 py-3 flex gap-2">
          <div className={`flex-1 ${plat.card} rounded-xl p-3 ${plat.border} border`}>
            <p className="text-[10px] text-[hsl(260,15%,55%)]">Saldo</p>
            <p className="text-lg sm:text-xl font-bold text-foreground font-display leading-tight mt-0.5">
              $ {balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className={`flex-1 ${plat.card} rounded-xl p-3 ${plat.border} border`}>
            <p className="text-[10px] text-[hsl(260,15%,55%)]">Lucro/Prejuízo</p>
            <p className={`text-lg sm:text-xl font-bold font-display leading-tight mt-0.5 ${
              profit > 0 ? plat.green : profit < 0 ? plat.red : "text-foreground"
            }`}>
              {profit >= 0 ? "+" : ""}$ {profit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* ── Robot status ── */}
        <div className={`px-3 sm:px-4 py-4 text-center ${plat.border} border-t border-b`}>
          <div className="flex items-center justify-center gap-2 mb-1.5">
            <Bot className="w-4 h-4 text-[hsl(260,15%,55%)]" />
            <span className="text-xs font-bold text-foreground tracking-wide">EASY 2.0</span>
          </div>
          {!isActive ? (
            <p className="text-sm text-[hsl(260,15%,55%)] font-medium">robô parado</p>
          ) : goalReached ? (
            <p className={`text-sm font-bold ${plat.green} animate-pulse`}>META BATIDA!</p>
          ) : (
            <div className="space-y-2">
              <p className={`text-sm ${plat.accent} font-semibold`}>robô operando</p>
              {goal > 0 && (
                <div className="w-full max-w-xs mx-auto">
                  <div className="flex justify-between text-[10px] text-[hsl(260,15%,55%)] mb-1">
                    <span>Meta: R${goal.toLocaleString("pt-BR")}</span>
                    <span className={`${plat.accent} font-medium`}>{progressPct}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[hsl(260,22%,15%)] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-[hsl(280,70%,55%)] to-[hsl(260,70%,60%)]"
                      style={{ width: `${progressPct}%` }} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Analyzing bar ── */}
        {isAnalyzing && isActive && <AnalyzingBar onDone={handleAnalysisDone} />}

        {/* ── Action buttons (before start) ── */}
        {!isActive && (
          <div className="px-3 sm:px-4 py-5 flex gap-2">
            <button onClick={() => setShowPopup(true)}
              className={`flex-1 py-3 rounded-xl border ${plat.accentBorder} ${plat.accentBgSoft} ${plat.accent} font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer hover:brightness-125 active:scale-[0.98] transition-all`}>
              <Play className="w-4 h-4" fill="currentColor" /> Iniciar Robô
            </button>
            <button className={`flex-1 py-3 rounded-xl ${plat.border} border ${plat.secondary} text-[hsl(260,15%,55%)] font-semibold text-sm flex items-center justify-center gap-2 cursor-default`}>
              <Bot className="w-4 h-4" /> Selecionar Robô
            </button>
          </div>
        )}

        {/* ── History table ── */}
        <div className={`${plat.border} border-t`}>
          {/* Tabs */}
          <div className={`flex ${plat.border} border-b`}>
            <div className={`flex-1 py-2.5 text-center text-xs font-bold text-white ${plat.tabActive} border-b-2 ${plat.tabBorder}`}>
              Tabela
            </div>
            <div className="flex-1 py-2.5 text-center text-xs font-medium text-[hsl(260,15%,55%)] cursor-default">
              Gráfico
            </div>
          </div>

          {/* Table header */}
          <div className={`px-3 sm:px-4 py-2.5 flex items-center justify-between ${plat.border} border-b`}>
            <div className="flex items-center gap-2">
              <p className="text-xs font-bold text-foreground">Histórico de Operações</p>
              <span className="text-xs">
                <span className={plat.green + " font-bold"}>{wins}</span>
                <span className="text-[hsl(260,15%,55%)]"> / </span>
                <span className={plat.red + " font-bold"}>{losses}</span>
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Bell className="w-3.5 h-3.5 text-[hsl(260,15%,55%)]" />
              <span className="text-[10px] text-[hsl(260,15%,55%)] font-medium">{history.length}</span>
            </div>
          </div>

          {/* Column headers */}
          <div className={`px-3 sm:px-4 py-2 grid grid-cols-4 gap-1 ${plat.border} border-b ${plat.secondary}`}>
            <span className="text-[10px] font-semibold text-[hsl(260,15%,55%)]">Hora</span>
            <span className="text-[10px] font-semibold text-[hsl(260,15%,55%)]">Par</span>
            <span className="text-[10px] font-semibold text-[hsl(260,15%,55%)] text-right">Preço</span>
            <span className="text-[10px] font-semibold text-[hsl(260,15%,55%)] text-right">Lucro</span>
          </div>

          {/* Rows */}
          <div ref={historyRef} className="max-h-[200px] sm:max-h-[240px] overflow-y-auto" style={{ scrollBehavior: "smooth" }}>
            {history.length === 0 && (
              <div className="py-8 text-center">
                <p className="text-xs text-[hsl(260,15%,55%)]">Nenhuma operação ainda</p>
              </div>
            )}
            {history.map((op, i) => (
              <div key={i} className={`px-3 sm:px-4 py-2 grid grid-cols-4 gap-1 ${plat.border} border-b border-opacity-20 animate-fade-in`}>
                <span className="text-[10px] text-[hsl(260,15%,55%)] font-mono">{op.hora}</span>
                <span className="text-[10px] font-semibold text-foreground">{op.par}</span>
                <span className="text-[10px] text-[hsl(260,15%,55%)] text-right font-mono">{op.preco}</span>
                <span className={`text-[10px] font-bold text-right ${op.tipo === "win" ? plat.green : plat.red}`}>
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

      {/* ─── Config Popup ─── */}
      {showPopup && <GoalPopup onSubmit={handleGoalSubmit} userName={userName} />}

      {/* ─── Goal Reached Popup ─── */}
      {showGoalReached && (
        <GoalReachedPopup goal={goal} profit={profit} onContinue={onNext} userName={userName} />
      )}

      {/* ─── Notification Toast ─── */}
      {notification && <NotificationToast text={notification} onDone={dismissNotification} />}
    </StepContainer>
  );
};

export default StepPlatformDemo;
