import { useState, useEffect, useRef, useCallback } from "react";
import { StepContainer, StepTitle, StepSubtitle, CTAButton } from "./QuizUI";
import {
  Play, Power, Bot, TrendingUp, Banknote, Bell,
  BarChart3, Lock, Loader2, Target, Clock, Trophy, Sparkles,
  ArrowRight, Wallet, Zap, Eye, MousePointer,
} from "lucide-react";

interface StepPlatformDemoProps {
  onNext: () => void;
  userName?: string;
}

/* ─── Platform color classes (pink/purple theme) ─── */
const plat = {
  bg: "bg-[hsl(260,30%,8%)]",
  card: "bg-[hsl(260,25%,12%)]",
  border: "border-[hsl(270,30%,22%)]",
  accent: "text-[hsl(280,70%,65%)]",
  accentBgSoft: "bg-[hsl(280,70%,65%,0.12)]",
  accentBorder: "border-[hsl(280,70%,65%,0.3)]",
  tabActive: "bg-[hsl(220,70%,45%)]",
  tabBorder: "border-[hsl(220,70%,45%)]",
  headerBg: "bg-[hsl(260,28%,10%)]",
  secondary: "bg-[hsl(260,22%,15%)]",
  green: "text-[hsl(152,60%,42%)]",
  red: "text-[hsl(0,72%,55%)]",
};

const pares = ["EUR/USD","GBP/USD","USD/JPY","BTC/USD","ETH/USD","AUD/USD","XAU/USD","USD/CAD","GBP/JPY","SOL/USD","EUR/GBP","NZD/USD","USD/CHF"];
const precos = ["1.08432","1.26781","149.320","67,241.00","3,412.50","0.65123","2,341.80","1.36540","188.410","148.22","0.85612","0.61234","0.87654"];

/* ─── Tutorial tips (timed for 1 min window) ─── */
const tutorialTips = [
  { icon: Eye, text: "A IA identificou uma oportunidade e entrou automaticamente. Você não fez nada!" },
  { icon: Zap, text: "Cada operação dura segundos. Na conta real, o lucro já estaria disponível para saque." },
  { icon: TrendingUp, text: "Olha o saldo subindo! Na conta real, você sacaria via Pix agora mesmo." },
  { icon: Wallet, text: "Nossos alunos sacam entre R$100 e R$300 por dia. Em conta real, direto pro banco." },
  { icon: MousePointer, text: "Perceba: zero cliques. A IA faz tudo sozinha o dia inteiro." },
];
const tipDelays = [3000, 10000, 20000, 32000, 45000];

/* ─── Tutorial Tip (compact) ─── */
const TutorialTip = ({ icon: Icon, text }: { icon: React.ElementType; text: string }) => (
  <div className="w-full animate-fade-in">
    <div className={`${plat.card} ${plat.border} border rounded-lg px-2.5 py-2 flex items-start gap-2`}>
      <div className="w-6 h-6 rounded-md bg-[hsl(280,70%,65%,0.15)] flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-3 h-3 text-[hsl(280,70%,65%)]" />
      </div>
      <p className="text-[11px] text-foreground leading-snug flex-1">{text}</p>
    </div>
  </div>
);

/* ─── Goal Reached Popup ─── */
const GoalReachedPopup = ({ goal, profit, onContinue, userName }: {
  goal: number; profit: number; onContinue: () => void; userName?: string;
}) => {
  const firstName = userName?.split(" ")[0] || "";
  const displayProfit = Math.max(profit, goal);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[hsl(260,30%,4%,0.9)] backdrop-blur-sm animate-fade-in px-4">
      <div className={`w-full max-w-sm ${plat.card} ${plat.border} border rounded-2xl shadow-2xl overflow-hidden animate-scale-in max-h-[90vh] overflow-y-auto`}>
        <div className="bg-[hsl(280,70%,65%,0.1)] border-b border-[hsl(270,30%,22%)] px-4 py-5 text-center">
          <div className="w-14 h-14 rounded-full bg-[hsl(280,70%,65%,0.2)] border-2 border-[hsl(280,70%,65%,0.4)] flex items-center justify-center mx-auto mb-3 animate-bounce-subtle">
            <Trophy className="w-7 h-7 text-[hsl(280,70%,65%)]" />
          </div>
          <h3 className="font-display font-bold text-lg text-foreground">META BATIDA!</h3>
          <p className="text-sm text-[hsl(260,15%,65%)] mt-1.5 leading-relaxed">
            {firstName ? `${firstName}, a` : "A"} IA bateu sua meta de{" "}
            <span className="font-bold text-foreground">R${goal.toLocaleString("pt-BR")}</span> em apenas 1 minuto.
          </p>
        </div>
        <div className="px-4 py-4 space-y-3">
          <div className={`${plat.bg} rounded-xl p-3 text-center border ${plat.accentBorder}`}>
            <p className="text-[11px] text-[hsl(260,15%,55%)] mb-1">Se estivesse na conta real, você teria ganho:</p>
            <p className="text-2xl font-display font-bold text-foreground mt-1">
              R$ <span className="text-[hsl(280,70%,65%)]">{displayProfit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
            </p>
            <p className="text-[11px] text-[hsl(280,70%,65%)] mt-1.5 font-medium">E poderia sacar agora mesmo via Pix</p>
          </div>
          <div className="bg-[hsl(280,70%,65%,0.08)] rounded-xl p-2.5 border border-[hsl(280,70%,65%,0.2)]">
            <p className="text-[11px] text-foreground leading-relaxed text-center">
              <span className="font-bold">Isso foi só uma demonstração.</span> Na conta real, o dinheiro cai direto na sua conta.
              Nossos alunos fazem isso <span className="font-bold text-[hsl(280,70%,65%)]">todos os dias</span>.
            </p>
          </div>
          <div className={`${plat.bg} rounded-xl p-2.5 border ${plat.border} space-y-1.5`}>
            <p className="text-[11px] font-bold text-foreground text-center">Com acesso real, você teria:</p>
            {["Saques ilimitados via Pix ou qualquer banco","Robô operando 24h sem parar","Suporte exclusivo no WhatsApp","Lucros reais caindo na sua conta"].map((item, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded-full bg-[hsl(280,70%,65%,0.2)] flex items-center justify-center shrink-0">
                  <ArrowRight className="w-2 h-2 text-[hsl(280,70%,65%)]" />
                </div>
                <span className="text-[10px] text-[hsl(260,15%,65%)]">{item}</span>
              </div>
            ))}
          </div>
          <button onClick={onContinue}
            className="w-full py-3.5 rounded-2xl font-extrabold text-sm tracking-wide text-white cursor-pointer hover:brightness-110 active:scale-[0.98] transition-all duration-300 bg-gradient-to-r from-[hsl(280,70%,55%)] to-[hsl(260,60%,55%)]"
            style={{ boxShadow: `0 0 25px hsl(280 70% 65% / 0.3), 0 0 50px hsl(280 70% 65% / 0.15)` }}>
            <span className="flex items-center justify-center gap-2"><Sparkles className="w-4 h-4" /> QUERO A CONTA REAL AGORA</span>
          </button>
          <p className="text-[10px] text-[hsl(260,15%,45%)] text-center">Enquanto você espera, outros já estão lucrando.</p>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[hsl(260,30%,4%,0.9)] backdrop-blur-sm animate-fade-in px-4">
      <div className={`w-full max-w-sm ${plat.card} ${plat.border} border rounded-2xl shadow-2xl overflow-hidden animate-scale-in`}>
        <div className="bg-[hsl(280,70%,65%,0.1)] border-b border-[hsl(270,30%,22%)] px-4 py-3.5 text-center">
          <div className="w-11 h-11 rounded-full bg-[hsl(280,70%,65%,0.2)] border border-[hsl(280,70%,65%,0.3)] flex items-center justify-center mx-auto mb-2">
            <Target className="w-5 h-5 text-[hsl(280,70%,65%)]" />
          </div>
          <h3 className="font-display font-bold text-base text-foreground">{firstName ? `${firstName}, configure` : "Configure"} sua meta</h3>
          <p className="text-[11px] text-[hsl(260,15%,55%)] mt-1">A IA vai operar até bater automaticamente</p>
        </div>
        <div className="px-4 py-4 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Banknote className="w-3.5 h-3.5 text-[hsl(280,70%,65%)]" /> Meta de ganho
            </label>
            <input type="text" inputMode="numeric" placeholder="Ex: R$ 500" value={goal}
              onChange={(e) => setGoal(formatGoal(e.target.value))}
              className="w-full bg-[hsl(260,22%,15%)] border border-[hsl(270,30%,22%)] rounded-xl px-3 py-2.5 text-foreground text-lg font-bold placeholder:text-[hsl(260,15%,40%)] focus:outline-none focus:ring-2 focus:ring-[hsl(280,70%,65%,0.5)] transition-all" />
            <p className="text-[10px] text-[hsl(260,15%,55%)]">Mínimo R$10</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[hsl(280,70%,65%)]" /> Tempo disponível
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {timeOptions.map((opt) => (
                <button key={opt.value} onClick={() => setTime(opt.value)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    time === opt.value
                      ? "border-[hsl(280,70%,65%)] bg-[hsl(280,70%,65%,0.15)] text-[hsl(280,70%,65%)]"
                      : "border-[hsl(270,30%,22%)] bg-[hsl(260,22%,15%)] text-[hsl(260,15%,55%)]"
                  }`}>{opt.label}</button>
              ))}
            </div>
          </div>
          <button onClick={() => canSubmit && onSubmit(goalNum, time)} disabled={!canSubmit}
            className={`w-full py-3.5 rounded-2xl font-extrabold text-sm tracking-wide transition-all duration-300 ${
              canSubmit ? "text-white cursor-pointer hover:brightness-110 active:scale-[0.98] bg-gradient-to-r from-[hsl(280,70%,55%)] to-[hsl(260,60%,55%)]" : "bg-[hsl(260,22%,18%)] text-[hsl(260,15%,40%)] cursor-not-allowed"
            }`}
            style={canSubmit ? { boxShadow: `0 0 25px hsl(280 70% 65% / 0.3)` } : {}}>
            <span className="flex items-center justify-center gap-2"><Play className="w-4 h-4" fill="currentColor" /> INICIAR ROBÔ</span>
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Analyzing Bar (faster) ─── */
const AnalyzingBar = ({ onDone }: { onDone: () => void }) => {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const duration = 1000 + Math.random() * 800; // 1-1.8s (faster)
    const start = Date.now();
    const interval = setInterval(() => {
      const pct = Math.min(100, ((Date.now() - start) / duration) * 100);
      setProgress(pct);
      if (pct >= 100) { clearInterval(interval); setTimeout(onDone, 150); }
    }, 30);
    return () => clearInterval(interval);
  }, [onDone]);

  return (
    <div className="w-full py-2 px-3 animate-fade-in">
      <div className="flex items-center gap-2 mb-1.5">
        <Loader2 className="w-3 h-3 text-[hsl(280,70%,65%)] animate-spin" />
        <span className="text-[11px] font-semibold text-[hsl(280,70%,65%)]">Analisando mercado...</span>
      </div>
      <div className="w-full h-1.5 bg-[hsl(260,22%,15%)] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-75 bg-gradient-to-r from-[hsl(280,70%,55%)] to-[hsl(260,70%,60%)]"
          style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
};

/* ─── Notification Toast ─── */
const NotificationToast = ({ text, onDone }: { text: string; onDone: () => void }) => {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-xs z-50 animate-slide-up">
      <div className={`${plat.card} border border-[hsl(280,70%,65%,0.3)] rounded-xl px-3 py-2.5 shadow-2xl flex items-center gap-2.5`}>
        <div className="w-7 h-7 rounded-full bg-[hsl(280,70%,65%,0.2)] flex items-center justify-center shrink-0">
          <Banknote className="w-3.5 h-3.5 text-[hsl(280,70%,65%)]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold text-[hsl(280,70%,65%)]">Operação concluída</p>
          <p className="text-[11px] text-foreground">{text}</p>
        </div>
      </div>
    </div>
  );
};

/* ═══ MAIN ═══ */
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
  const [currentTipIndex, setCurrentTipIndex] = useState(-1);

  const historyRef = useRef<HTMLDivElement>(null);
  const opTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tipTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const totalOpsRef = useRef(0);
  const accumulatedRef = useRef(0);
  const startTimeRef = useRef(0);

  const dismissNotification = useCallback(() => setNotification(null), []);

  const GOAL_TIME_MS = 60_000; // 1 minute

  const handleGoalSubmit = (goalValue: number, _time: string) => {
    setGoal(goalValue);
    setShowPopup(false);
    setIsActive(true);
    setIsAnalyzing(true);
    startTimeRef.current = Date.now();
  };

  // Tutorial tips
  useEffect(() => {
    if (!isActive) return;
    tipDelays.forEach((delay, index) => {
      const timer = setTimeout(() => setCurrentTipIndex(index), delay);
      tipTimersRef.current.push(timer);
    });
    return () => tipTimersRef.current.forEach(t => clearTimeout(t));
  }, [isActive]);

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
    const estOpsLeft = Math.max(1, Math.floor(timeLeft / 2000));

    const isWin = Math.random() < 0.88;
    let lucro: number;
    if (isWin) {
      const base = remaining / estOpsLeft;
      const variance = base * (0.5 + Math.random() * 1.0);
      lucro = Math.max(3, Math.min(remaining * 0.3, variance));
      if (timeLeft < 10000 && remaining > 0) lucro = Math.max(lucro, remaining * 0.5);
      lucro = parseFloat(lucro.toFixed(2));
    } else {
      lucro = -parseFloat((Math.random() * 8 + 1).toFixed(2));
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
      setTimeout(() => setShowGoalReached(true), 800);
      return;
    }

    const delay = 400 + Math.random() * 700; // faster cycles
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

      {/* ═══ PLATFORM SCREEN ═══ */}
      <div className={`w-full rounded-2xl overflow-hidden shadow-2xl ${plat.bg} ${plat.border} border`}>

        {/* Top bar */}
        <div className={`${plat.headerBg} px-2.5 py-2 flex items-center justify-between ${plat.border} border-b`}>
          <div className="flex items-center gap-1.5">
            <Play className="w-3 h-3 text-[hsl(280,70%,65%)]" fill="currentColor" />
            <span className="text-[11px] font-bold text-foreground tracking-wide">
              <span className={plat.accent}>ALFA</span> HÍBRIDA
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`w-6 h-6 rounded-full ${plat.secondary} ${plat.border} border flex items-center justify-center`}>
              <span className="text-[9px]">🇧🇷</span>
            </div>
            <div className="w-6 h-6 rounded-full bg-[hsl(280,60%,50%)] flex items-center justify-center">
              <Bell className="w-3 h-3 text-white" />
            </div>
          </div>
        </div>

        {/* Account */}
        <div className={`${plat.card} mx-2.5 mt-2 rounded-lg p-2 flex items-center gap-2.5 ${plat.border} border`}>
          <div className={`w-8 h-8 rounded-md flex items-center justify-center border ${
            isActive ? "bg-[hsl(152,60%,42%,0.15)] border-[hsl(152,60%,42%,0.3)]" : "bg-[hsl(0,72%,55%,0.15)] border-[hsl(0,72%,55%,0.3)]"
          }`}>
            <Power className={`w-4 h-4 ${isActive ? plat.green : plat.red}`} />
          </div>
          <div>
            <p className="text-xs font-bold text-foreground leading-tight">Conta Demo</p>
            <p className="text-[9px] text-[hsl(260,15%,55%)]">DM7829401 - USD</p>
          </div>
        </div>

        {/* Saldo / Lucro */}
        <div className="px-2.5 py-2 flex gap-1.5">
          <div className={`flex-1 ${plat.card} rounded-lg p-2 ${plat.border} border`}>
            <p className="text-[9px] text-[hsl(260,15%,55%)]">Saldo</p>
            <p className="text-base font-bold text-foreground font-display leading-tight mt-0.5">
              $ {balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className={`flex-1 ${plat.card} rounded-lg p-2 ${plat.border} border`}>
            <p className="text-[9px] text-[hsl(260,15%,55%)]">Lucro/Prejuízo</p>
            <p className={`text-base font-bold font-display leading-tight mt-0.5 ${
              profit > 0 ? plat.green : profit < 0 ? plat.red : "text-foreground"
            }`}>
              {profit >= 0 ? "+" : ""}$ {profit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Robot status */}
        <div className={`px-2.5 py-3 text-center ${plat.border} border-t border-b`}>
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Bot className="w-3.5 h-3.5 text-[hsl(260,15%,55%)]" />
            <span className="text-[11px] font-bold text-foreground tracking-wide">EASY 2.0</span>
          </div>
          {!isActive ? (
            <p className="text-xs text-[hsl(260,15%,55%)]">robô parado</p>
          ) : goalReached ? (
            <p className={`text-xs font-bold ${plat.accent} animate-pulse`}>META BATIDA!</p>
          ) : (
            <div className="space-y-1.5">
              <p className={`text-xs ${plat.accent} font-semibold`}>robô operando</p>
              {goal > 0 && (
                <div className="w-full max-w-[200px] mx-auto">
                  <div className="flex justify-between text-[9px] text-[hsl(260,15%,55%)] mb-0.5">
                    <span>Meta: R${goal.toLocaleString("pt-BR")}</span>
                    <span className={`${plat.accent} font-medium`}>{progressPct}%</span>
                  </div>
                  <div className="w-full h-1 bg-[hsl(260,22%,15%)] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-[hsl(280,70%,55%)] to-[hsl(260,70%,60%)]"
                      style={{ width: `${progressPct}%` }} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Analyzing bar */}
        {isAnalyzing && isActive && <AnalyzingBar onDone={handleAnalysisDone} />}

        {/* Play button with animation (before start) */}
        {!isActive && (
          <div className="px-2.5 py-4 flex gap-1.5">
            <button onClick={() => setShowPopup(true)}
              className={`flex-1 py-2.5 rounded-xl border ${plat.accentBorder} ${plat.accentBgSoft} ${plat.accent} font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer hover:brightness-125 active:scale-[0.98] transition-all relative overflow-hidden`}>
              {/* Pulse ring animation */}
              <span className="absolute inset-0 rounded-xl animate-ping bg-[hsl(280,70%,65%,0.1)]" style={{ animationDuration: '2s' }} />
              <Play className="w-3.5 h-3.5 relative z-10" fill="currentColor" />
              <span className="relative z-10">Iniciar Robô</span>
            </button>
            <button className={`flex-1 py-2.5 rounded-xl ${plat.border} border ${plat.secondary} text-[hsl(260,15%,55%)] font-semibold text-xs flex items-center justify-center gap-1.5 cursor-default`}>
              <Bot className="w-3.5 h-3.5" /> Selecionar Robô
            </button>
          </div>
        )}

        {/* History table */}
        <div className={`${plat.border} border-t`}>
          <div className={`flex ${plat.border} border-b`}>
            <div className={`flex-1 py-2 text-center text-[11px] font-bold text-white ${plat.tabActive} border-b-2 ${plat.tabBorder}`}>Tabela</div>
            <div className="flex-1 py-2 text-center text-[11px] font-medium text-[hsl(260,15%,55%)] cursor-default">Gráfico</div>
          </div>

          <div className={`px-2.5 py-2 flex items-center justify-between ${plat.border} border-b`}>
            <div className="flex items-center gap-1.5">
              <p className="text-[11px] font-bold text-foreground">Histórico</p>
              <span className="text-[11px]">
                <span className={plat.green + " font-bold"}>{wins}</span>
                <span className="text-[hsl(260,15%,55%)]">/</span>
                <span className={plat.red + " font-bold"}>{losses}</span>
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Bell className="w-3 h-3 text-[hsl(260,15%,55%)]" />
              <span className="text-[9px] text-[hsl(260,15%,55%)]">{history.length}</span>
            </div>
          </div>

          <div className={`px-2.5 py-1.5 grid grid-cols-4 gap-1 ${plat.border} border-b ${plat.secondary}`}>
            <span className="text-[9px] font-semibold text-[hsl(260,15%,55%)]">Hora</span>
            <span className="text-[9px] font-semibold text-[hsl(260,15%,55%)]">Par</span>
            <span className="text-[9px] font-semibold text-[hsl(260,15%,55%)] text-right">Preço</span>
            <span className="text-[9px] font-semibold text-[hsl(260,15%,55%)] text-right">Lucro</span>
          </div>

          <div ref={historyRef} className="max-h-[140px] sm:max-h-[200px] overflow-y-auto" style={{ scrollBehavior: "smooth" }}>
            {history.length === 0 && (
              <div className="py-6 text-center">
                <p className="text-[11px] text-[hsl(260,15%,55%)]">Nenhuma operação ainda</p>
              </div>
            )}
            {history.map((op, i) => (
              <div key={i} className={`px-2.5 py-1.5 grid grid-cols-4 gap-1 ${plat.border} border-b border-opacity-20 animate-fade-in`}>
                <span className="text-[9px] text-[hsl(260,15%,55%)] font-mono">{op.hora}</span>
                <span className="text-[9px] font-semibold text-foreground">{op.par}</span>
                <span className="text-[9px] text-[hsl(260,15%,55%)] text-right font-mono">{op.preco}</span>
                <span className={`text-[9px] font-bold text-right ${op.tipo === "win" ? plat.green : plat.red}`}>
                  {op.lucro >= 0 ? "+" : ""}${op.lucro.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ TUTORIAL TIP (BELOW platform, visible on scroll) ═══ */}
      {isActive && !goalReached && currentTipIndex >= 0 && (
        <TutorialTip
          key={currentTipIndex}
          icon={tutorialTips[currentTipIndex].icon}
          text={tutorialTips[currentTipIndex].text}
        />
      )}

      {/* Trust line */}
      <div className="w-full funnel-card border-accent/20 bg-accent/5 text-center p-2.5">
        <div className="flex items-center justify-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-primary shrink-0" />
          <p className="text-[11px] text-foreground font-medium leading-snug">
            Plataforma <strong>100% automática</strong>. Basta ativar e acompanhar no celular.
          </p>
        </div>
      </div>

      {showPopup && <GoalPopup onSubmit={handleGoalSubmit} userName={userName} />}
      {showGoalReached && <GoalReachedPopup goal={goal} profit={profit} onContinue={onNext} userName={userName} />}
      {notification && <NotificationToast text={notification} onDone={dismissNotification} />}
    </StepContainer>
  );
};

export default StepPlatformDemo;
