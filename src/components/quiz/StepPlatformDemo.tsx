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
  accentHsl: "hsl(280,70%,65%)",
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

/* ─── Tutorial tips that appear during operation ─── */
const tutorialTips = [
  { icon: Eye, text: "Veja! A IA acabou de identificar uma oportunidade e entrou automaticamente.", delay: 4000 },
  { icon: Zap, text: "Cada operação dura segundos. Você não precisa fazer nada — só acompanhar.", delay: 12000 },
  { icon: TrendingUp, text: "Olha o saldo subindo! Na conta real, esse valor já estaria disponível para saque via Pix.", delay: 22000 },
  { icon: Wallet, text: "Na conta real, você pode sacar a qualquer momento direto pro seu banco ou Pix.", delay: 35000 },
  { icon: MousePointer, text: "Perceba: você não clicou em nada. A IA faz tudo sozinha. Imagina isso rodando o dia inteiro...", delay: 50000 },
  { icon: Banknote, text: "Nossos alunos fazem isso diariamente e sacam entre R$100 e R$300 por dia. Em conta real.", delay: 65000 },
];

/* ─── Tutorial Tip Component ─── */
const TutorialTip = ({ icon: Icon, text }: { icon: React.ElementType; text: string }) => (
  <div className="w-full animate-fade-in">
    <div className={`${plat.card} ${plat.border} border rounded-xl px-3 py-2.5 flex items-start gap-2.5`}>
      <div className="w-7 h-7 rounded-lg bg-[hsl(280,70%,65%,0.15)] flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-3.5 h-3.5 text-[hsl(280,70%,65%)]" />
      </div>
      <p className="text-xs text-foreground leading-relaxed flex-1">{text}</p>
    </div>
  </div>
);

/* ─── Goal Reached Popup (PURPLE theme, no green) ─── */
const GoalReachedPopup = ({ goal, profit, onContinue, userName }: {
  goal: number; profit: number; onContinue: () => void; userName?: string;
}) => {
  const firstName = userName?.split(" ")[0] || "";
  const displayProfit = Math.max(profit, goal);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[hsl(260,30%,4%,0.9)] backdrop-blur-sm animate-fade-in px-4">
      <div className={`w-full max-w-sm ${plat.card} ${plat.border} border rounded-2xl shadow-2xl overflow-hidden animate-scale-in`}>
        {/* Header */}
        <div className="bg-[hsl(280,70%,65%,0.1)] border-b border-[hsl(270,30%,22%)] px-5 py-6 text-center">
          <div className="w-16 h-16 rounded-full bg-[hsl(280,70%,65%,0.2)] border-2 border-[hsl(280,70%,65%,0.4)] flex items-center justify-center mx-auto mb-4 animate-bounce-subtle">
            <Trophy className="w-8 h-8 text-[hsl(280,70%,65%)]" />
          </div>
          <h3 className="font-display font-bold text-xl text-foreground">
            META BATIDA!
          </h3>
          <p className="text-sm text-[hsl(260,15%,65%)] mt-2 leading-relaxed">
            {firstName ? `${firstName}, a` : "A"} IA bateu sua meta de{" "}
            <span className="font-bold text-foreground">R${goal.toLocaleString("pt-BR")}</span> em apenas 2 minutos.
          </p>
        </div>

        {/* Body */}
        <div className="px-5 py-5 space-y-4">
          {/* Value box */}
          <div className={`${plat.bg} rounded-xl p-4 text-center border ${plat.accentBorder}`}>
            <p className="text-xs text-[hsl(260,15%,55%)] mb-1">Se estivesse na conta real com acesso à plataforma, você teria ganho:</p>
            <p className="text-3xl font-display font-bold text-foreground mt-2">
              R$ <span className="text-[hsl(280,70%,65%)]">{displayProfit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
            </p>
            <p className="text-xs text-[hsl(280,70%,65%)] mt-2 font-medium">
              E poderia sacar agora mesmo via Pix
            </p>
          </div>

          {/* Urgency block */}
          <div className="bg-[hsl(280,70%,65%,0.08)] rounded-xl p-3 border border-[hsl(280,70%,65%,0.2)]">
            <p className="text-xs text-foreground leading-relaxed text-center">
              <span className="font-bold">Isso foi apenas uma demonstração.</span> Na conta real, o dinheiro cai direto na sua conta bancária. 
              Nossos alunos fazem isso <span className="font-bold text-[hsl(280,70%,65%)]">todos os dias</span> e sacam entre R$100 e R$300.
            </p>
          </div>

          {/* What you're missing */}
          <div className={`${plat.bg} rounded-xl p-3 border ${plat.border} space-y-2`}>
            <p className="text-xs font-bold text-foreground text-center">Com acesso real, você teria:</p>
            <div className="space-y-1.5">
              {[
                "Saques ilimitados via Pix, Nubank, ou qualquer banco",
                "Robô operando 24h por dia sem parar",
                "Suporte exclusivo no WhatsApp",
                "Lucros reais caindo na sua conta",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-[hsl(280,70%,65%,0.2)] flex items-center justify-center shrink-0">
                    <ArrowRight className="w-2.5 h-2.5 text-[hsl(280,70%,65%)]" />
                  </div>
                  <span className="text-[11px] text-[hsl(260,15%,65%)]">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={onContinue}
            className="w-full py-4 rounded-2xl font-extrabold text-base tracking-wide text-white cursor-pointer hover:brightness-110 active:scale-[0.98] transition-all duration-300 bg-gradient-to-r from-[hsl(280,70%,55%)] to-[hsl(260,60%,55%)]"
            style={{ boxShadow: `0 0 25px hsl(280 70% 65% / 0.3), 0 0 50px hsl(280 70% 65% / 0.15)` }}
          >
            <span className="flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5" />
              QUERO A CONTA REAL AGORA
            </span>
          </button>
          <p className="text-[10px] text-[hsl(260,15%,45%)] text-center">
            Enquanto você espera, outros já estão lucrando com conta real.
          </p>
        </div>
      </div>
    </div>
  );
};

/* ─── Config Popup (PURPLE theme) ─── */
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
        <div className="bg-[hsl(280,70%,65%,0.1)] border-b border-[hsl(270,30%,22%)] px-5 py-4 text-center">
          <div className="w-12 h-12 rounded-full bg-[hsl(280,70%,65%,0.2)] border border-[hsl(280,70%,65%,0.3)] flex items-center justify-center mx-auto mb-3">
            <Target className="w-6 h-6 text-[hsl(280,70%,65%)]" />
          </div>
          <h3 className="font-display font-bold text-lg text-foreground">
            {firstName ? `${firstName}, configure` : "Configure"} sua meta
          </h3>
          <p className="text-xs text-[hsl(260,15%,55%)] mt-1">A IA vai operar até bater sua meta automaticamente</p>
        </div>
        <div className="px-5 py-5 space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Banknote className="w-4 h-4 text-[hsl(280,70%,65%)]" /> Qual sua meta de ganho?
            </label>
            <input
              type="text" inputMode="numeric" placeholder="Ex: R$ 500"
              value={goal} onChange={(e) => setGoal(formatGoal(e.target.value))}
              className="w-full bg-[hsl(260,22%,15%)] border border-[hsl(270,30%,22%)] rounded-xl px-4 py-3 text-foreground text-lg font-bold placeholder:text-[hsl(260,15%,40%)] focus:outline-none focus:ring-2 focus:ring-[hsl(280,70%,65%,0.5)] transition-all"
            />
            <p className="text-[10px] text-[hsl(260,15%,55%)]">Mínimo R$10 — sem limite máximo</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[hsl(280,70%,65%)]" /> Tempo disponível hoje?
            </label>
            <div className="grid grid-cols-2 gap-2">
              {timeOptions.map((opt) => (
                <button key={opt.value} onClick={() => setTime(opt.value)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    time === opt.value
                      ? "border-[hsl(280,70%,65%)] bg-[hsl(280,70%,65%,0.15)] text-[hsl(280,70%,65%)]"
                      : "border-[hsl(270,30%,22%)] bg-[hsl(260,22%,15%)] text-[hsl(260,15%,55%)] hover:border-[hsl(260,15%,40%)]"
                  }`}
                >{opt.label}</button>
              ))}
            </div>
          </div>
          <button onClick={() => canSubmit && onSubmit(goalNum, time)} disabled={!canSubmit}
            className={`w-full py-4 rounded-2xl font-extrabold text-base tracking-wide transition-all duration-300 ${
              canSubmit
                ? "text-white cursor-pointer hover:brightness-110 active:scale-[0.98] bg-gradient-to-r from-[hsl(280,70%,55%)] to-[hsl(260,60%,55%)]"
                : "bg-[hsl(260,22%,18%)] text-[hsl(260,15%,40%)] cursor-not-allowed"
            }`}
            style={canSubmit ? { boxShadow: `0 0 25px hsl(280 70% 65% / 0.3), 0 0 50px hsl(280 70% 65% / 0.15)` } : {}}>
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

/* ─── Notification Toast (purple themed) ─── */
const NotificationToast = ({ text, onDone }: { text: string; onDone: () => void }) => {
  useEffect(() => { const t = setTimeout(onDone, 3500); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-xs z-50 animate-slide-up">
      <div className={`${plat.card} border border-[hsl(280,70%,65%,0.3)] rounded-xl px-4 py-3 shadow-2xl flex items-center gap-3`}>
        <div className="w-8 h-8 rounded-full bg-[hsl(280,70%,65%,0.2)] flex items-center justify-center shrink-0">
          <Banknote className="w-4 h-4 text-[hsl(280,70%,65%)]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-[hsl(280,70%,65%)]">Operação concluída</p>
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
  const [visibleTips, setVisibleTips] = useState<number[]>([]);

  const historyRef = useRef<HTMLDivElement>(null);
  const opTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tipTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
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

  // Schedule tutorial tips when active
  useEffect(() => {
    if (!isActive) return;
    tutorialTips.forEach((tip, index) => {
      const timer = setTimeout(() => {
        setVisibleTips(prev => [...prev.slice(-1), index]); // Show only latest tip
      }, tip.delay);
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
    const estOpsLeft = Math.max(1, Math.floor(timeLeft / 3000));

    const isWin = Math.random() < 0.85;

    let lucro: number;
    if (isWin) {
      const base = remaining / estOpsLeft;
      const variance = base * (0.5 + Math.random() * 1.0);
      lucro = Math.max(3, Math.min(remaining * 0.25, variance));
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
  const currentTipIndex = visibleTips.length > 0 ? visibleTips[visibleTips.length - 1] : -1;

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

      {/* ═══ TUTORIAL TIP (appears above platform) ═══ */}
      {isActive && !goalReached && currentTipIndex >= 0 && (
        <TutorialTip
          key={currentTipIndex}
          icon={tutorialTips[currentTipIndex].icon}
          text={tutorialTips[currentTipIndex].text}
        />
      )}

      {/* ═══ PLATFORM SCREEN (Pink/Purple theme) ═══ */}
      <div className={`w-full rounded-2xl overflow-hidden shadow-2xl ${plat.bg} ${plat.border} border`}>

        {/* ── Top bar ── */}
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
            <div className="w-7 h-7 rounded-full bg-[hsl(280,60%,50%)] flex items-center justify-center">
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
            <p className={`text-sm font-bold ${plat.accent} animate-pulse`}>META BATIDA!</p>
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
          <div className={`flex ${plat.border} border-b`}>
            <div className={`flex-1 py-2.5 text-center text-xs font-bold text-white ${plat.tabActive} border-b-2 ${plat.tabBorder}`}>
              Tabela
            </div>
            <div className="flex-1 py-2.5 text-center text-xs font-medium text-[hsl(260,15%,55%)] cursor-default">
              Gráfico
            </div>
          </div>

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

          <div className={`px-3 sm:px-4 py-2 grid grid-cols-4 gap-1 ${plat.border} border-b ${plat.secondary}`}>
            <span className="text-[10px] font-semibold text-[hsl(260,15%,55%)]">Hora</span>
            <span className="text-[10px] font-semibold text-[hsl(260,15%,55%)]">Par</span>
            <span className="text-[10px] font-semibold text-[hsl(260,15%,55%)] text-right">Preço</span>
            <span className="text-[10px] font-semibold text-[hsl(260,15%,55%)] text-right">Lucro</span>
          </div>

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
