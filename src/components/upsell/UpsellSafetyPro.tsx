import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, TrendingUp, Check, Lock, Zap,
  BarChart3, RefreshCw, ArrowRight, Bot,
  Banknote, Loader2, Play, AlertTriangle, CircleDot,
} from "lucide-react";
import { saveUpsellExtras } from "@/lib/upsellData";
import { saveFunnelEvent } from "@/lib/metricsClient";
import { logAuditEvent } from "@/hooks/useAuditLog";
import { buildTrackingQueryString } from "@/lib/trackingDataLayer";
import avatarAntonio from "@/assets/avatar-antonio.jpg";
import avatarMaria from "@/assets/avatar-maria.jpg";

interface Props {
  name: string;
  onNext: () => void;
  onDecline: () => void;
}

// ── Live counter ──
const useLiveCounter = (start: number) => {
  const [count, setCount] = useState(start);
  useEffect(() => {
    const t = setInterval(() => setCount(c => c + Math.floor(Math.random() * 3 + 1)), 5000);
    return () => clearInterval(t);
  }, []);
  return count;
};

// ── Platform tokens ──
const plat = {
  bg: "bg-[hsl(260,30%,8%)]",
  card: "bg-[hsl(260,25%,12%)]",
  border: "border-[hsl(270,30%,22%)]",
  secondary: "bg-[hsl(260,22%,15%)]",
  green: "text-[hsl(152,60%,42%)]",
  red: "text-[hsl(0,72%,55%)]",
};

const pares = ["EUR/USD", "GBP/USD", "USD/JPY", "BTC/USD", "XAU/USD", "AUD/USD"];
const precos = ["1.08432", "1.26781", "149.320", "67,241.00", "2,341.80", "0.65123"];

// ── Analyzing bar ──
const AnalyzingBar = ({ onDone, paused }: { onDone: () => void; paused?: boolean }) => {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (paused) { setProgress(0); return; }
    const duration = 1100 + Math.random() * 900;
    const start = Date.now();
    const iv = setInterval(() => {
      const pct = Math.min(100, ((Date.now() - start) / duration) * 100);
      setProgress(pct);
      if (pct >= 100) { clearInterval(iv); setTimeout(onDone, 140); }
    }, 30);
    return () => clearInterval(iv);
  }, [onDone, paused]);
  return (
    <div className="px-3 py-2">
      <div className="flex items-center gap-2 mb-1.5">
        <Loader2 className={`w-3 h-3 text-[hsl(280,70%,65%)] ${paused ? "" : "animate-spin"}`} />
        <span className="text-[10px] font-semibold text-[hsl(280,70%,65%)]">
          {paused ? "Monitorando próxima janela..." : "Analisando risco do mercado..."}
        </span>
      </div>
      <div className="w-full h-1.5 bg-[hsl(260,22%,15%)] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-75 bg-gradient-to-r from-[hsl(280,70%,55%)] to-[hsl(260,70%,60%)]"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

// ── Op toast ──
const OpToast = ({ text, color, onDone }: { text: string; color: string; onDone: () => void }) => {
  useEffect(() => { const t = setTimeout(onDone, 3200); return () => clearTimeout(t); }, [onDone]);
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      className="fixed bottom-4 left-4 right-4 z-50"
    >
      <div
        className="rounded-xl px-3 py-2.5 shadow-2xl flex items-center gap-2.5"
        style={{ background: "#0F172A", border: `1px solid ${color}40` }}
      >
        <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: `${color}20` }}>
          <Banknote className="w-3.5 h-3.5" style={{ color }} />
        </div>
        <p className="text-[12px] font-semibold" style={{ color: "#E2E8F0" }}>{text}</p>
      </div>
    </motion.div>
  );
};

// ── Simulator ──
type SimOp = {
  hora: string; par: string; preco: string;
  lucro: number; tipo: "win" | "loss"; conta: "real" | "demo";
};

const TradeSimulator = () => {
  const [history, setHistory] = useState<SimOp[]>([]);
  const [balance, setBalance] = useState(1_247.38);
  const [sessionProfit, setSessionProfit] = useState(0);
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [notification, setNotification] = useState<{ text: string; color: string } | null>(null);
  const [safetyStatus, setSafetyStatus] = useState<"real" | "demo" | "risk">("real");
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  const historyRef = useRef<HTMLDivElement>(null);
  const opRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissNotif = useCallback(() => setNotification(null), []);

  const runOp = useCallback(() => {
    const isRisk = Math.random() < 0.25; // 1 in 4 → Safety Pro kicks in
    const conta: "real" | "demo" = isRisk ? "demo" : "real";

    if (isRisk) {
      setSafetyStatus("risk");
      setTimeout(() => setSafetyStatus("demo"), 600);
    } else {
      setSafetyStatus("real");
    }

    const isWin = conta === "real" ? Math.random() < 0.85 : Math.random() < 0.45;
    const lucro = isWin
      ? parseFloat((9 + Math.random() * 34).toFixed(2))
      : parseFloat((-(5 + Math.random() * 18)).toFixed(2));

    const parIdx = Math.floor(Math.random() * pares.length);
    const hora = new Date().toLocaleTimeString("pt-BR").slice(0, 8);
    const op: SimOp = { hora, par: pares[parIdx], preco: precos[parIdx], lucro, tipo: isWin ? "win" : "loss", conta };

    setHistory(prev => [...prev.slice(-14), op]);

    if (conta === "real") {
      setSessionProfit(prev => parseFloat((prev + lucro).toFixed(2)));
      setBalance(prev => parseFloat((prev + lucro).toFixed(2)));
      if (isWin) {
        setWins(prev => prev + 1);
        setNotification({ text: `✅ +R$${lucro.toFixed(2)} creditado em ${pares[parIdx]}`, color: "#22C55E" });
      } else {
        setLosses(prev => prev + 1);
      }
    } else {
      // Demo: show what WOULD have been lost
      const saved = Math.abs(lucro);
      setLastSaved(saved);
      setNotification({ text: `🛡 Safety Pro: risco alto detectado → operado em demo. R$${saved.toFixed(2)} protegidos.`, color: "#FACC15" });
    }

    opRef.current = setTimeout(() => setIsAnalyzing(true), 600 + Math.random() * 600);
  }, []);

  const handleAnalysisDone = useCallback(() => {
    setIsAnalyzing(false);
    opRef.current = setTimeout(runOp, 200);
  }, [runOp]);

  useEffect(() => () => { if (opRef.current) clearTimeout(opRef.current); }, []);
  useEffect(() => {
    if (historyRef.current) historyRef.current.scrollTop = historyRef.current.scrollHeight;
  }, [history]);

  const totalDemoOps = history.filter(h => h.conta === "demo").length;

  return (
    <div className={`w-full rounded-2xl overflow-hidden shadow-2xl ${plat.bg} ${plat.border} border`}>
      {/* Top bar */}
      <div className={`bg-[hsl(260,28%,10%)] px-3 py-2 flex items-center justify-between ${plat.border} border-b`}>
        <div className="flex items-center gap-1.5">
          <Play className="w-3 h-3 text-[hsl(280,70%,65%)]" fill="currentColor" />
          <span className="text-[11px] font-bold text-white tracking-wide">
            <span className="text-[hsl(280,70%,65%)]">ALFA HÍBRIDA</span> · IA ao vivo
          </span>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={safetyStatus}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold"
            style={{
              background:
                safetyStatus === "risk" ? "rgba(239,68,68,0.2)" :
                safetyStatus === "demo" ? "rgba(250,204,21,0.15)" :
                "rgba(22,163,74,0.15)",
              border:
                safetyStatus === "risk" ? "1px solid rgba(239,68,68,0.5)" :
                safetyStatus === "demo" ? "1px solid rgba(250,204,21,0.4)" :
                "1px solid rgba(22,163,74,0.4)",
              color:
                safetyStatus === "risk" ? "#EF4444" :
                safetyStatus === "demo" ? "#FACC15" :
                "#22C55E",
            }}
          >
            {safetyStatus === "risk" ? (
              <><AlertTriangle className="w-2.5 h-2.5" /> RISCO DETECTADO</>
            ) : safetyStatus === "demo" ? (
              <><ShieldCheck className="w-2.5 h-2.5" /> CONTA DEMO (capital salvo)</>
            ) : (
              <><CircleDot className="w-2.5 h-2.5" /> CONTA REAL (operando)</>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Balance row */}
      <div className="px-3 py-2 flex gap-1.5">
        <div className={`flex-1 ${plat.card} rounded-lg p-2 ${plat.border} border`}>
          <p className="text-[9px] text-[hsl(260,15%,50%)]">Saldo real</p>
          <p className="text-[14px] font-bold text-white leading-tight">
            R$ {balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className={`flex-1 ${plat.card} rounded-lg p-2 ${plat.border} border`}>
          <p className="text-[9px] text-[hsl(260,15%,50%)]">Lucro da sessão</p>
          <p className={`text-[14px] font-bold leading-tight ${sessionProfit >= 0 ? plat.green : plat.red}`}>
            {sessionProfit >= 0 ? "+" : ""}R$ {sessionProfit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className={`flex-1 ${plat.card} rounded-lg p-2 ${plat.border} border`}>
          <p className="text-[9px] text-[hsl(260,15%,50%)]">Proteções ativas</p>
          <p className="text-[14px] font-bold text-[hsl(45,90%,65%)] leading-tight">{totalDemoOps}</p>
        </div>
      </div>

      {/* Robot status */}
      <div className={`px-3 py-1.5 flex items-center justify-between ${plat.border} border-t border-b ${plat.secondary}`}>
        <div className="flex items-center gap-1.5">
          <Bot className="w-3 h-3 text-[hsl(280,70%,65%)]" />
          <span className="text-[10px] font-bold text-white">EASY 2.0</span>
          <span className="text-[9px] text-[hsl(280,70%,65%)] font-semibold">+ Safety Pro</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-[hsl(152,60%,42%)] animate-pulse" />
          <span className="text-[9px] text-[hsl(152,60%,42%)] font-semibold">Robô ativo</span>
        </div>
      </div>

      {/* Analyzing bar */}
      <AnalyzingBar key={isAnalyzing ? "a" : "i"} onDone={handleAnalysisDone} paused={!isAnalyzing} />

      {/* History */}
      <div className={`${plat.border} border-t`}>
        <div className={`px-3 py-1.5 flex items-center justify-between ${plat.border} border-b ${plat.secondary}`}>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-white">Operações</span>
            <span className="text-[9px] text-[hsl(152,60%,42%)] font-bold">{wins}✓</span>
            <span className="text-[9px] text-[hsl(0,72%,55%)] font-bold">{losses}✗</span>
          </div>
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-[hsl(280,70%,65%)]" />
            <span className="text-[9px] text-[hsl(280,70%,65%)]">{totalDemoOps} proteções</span>
          </div>
        </div>

        {/* Column headers */}
        <div className={`px-3 py-1 grid gap-1 ${plat.border} border-b`} style={{ gridTemplateColumns: "52px 1fr 1fr 60px" }}>
          {["Hora", "Par", "Conta", "Resultado"].map(h => (
            <span key={h} className="text-[9px] font-semibold text-[hsl(260,15%,45%)] last:text-right">{h}</span>
          ))}
        </div>

        <div ref={historyRef} className="max-h-[138px] overflow-y-auto" style={{ scrollBehavior: "smooth" }}>
          {history.length === 0 && (
            <div className="py-6 text-center">
              <p className="text-[10px] text-[hsl(260,15%,38%)]">Aguardando primeira operação...</p>
            </div>
          )}
          {history.map((op, i) => (
            <AnimatePresence key={i}>
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className={`px-3 py-1.5 grid gap-1 ${plat.border} border-b border-opacity-20`}
                style={{ gridTemplateColumns: "52px 1fr 1fr 60px" }}
              >
                <span className="text-[9px] text-[hsl(260,15%,38%)] font-mono">{op.hora}</span>
                <span className="text-[9px] font-semibold text-white">{op.par}</span>
                <span
                  className="text-[9px] font-bold flex items-center gap-0.5"
                  style={{ color: op.conta === "demo" ? "#FACC15" : "#64748B" }}
                >
                  {op.conta === "demo" ? (
                    <><ShieldCheck className="w-2.5 h-2.5" /> Demo</>
                  ) : "Real"}
                </span>
                <span
                  className="text-[9px] font-bold text-right"
                  style={{
                    color: op.conta === "demo" ? "#FACC15" :
                           op.tipo === "win" ? "#22C55E" : "#EF4444"
                  }}
                >
                  {op.conta === "demo"
                    ? `🛡 salvo`
                    : `${op.lucro >= 0 ? "+" : ""}R$${op.lucro.toFixed(2)}`}
                </span>
              </motion.div>
            </AnimatePresence>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className={`px-3 py-2 flex items-center justify-between ${plat.border} border-t ${plat.secondary}`}>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[hsl(152,60%,42%)]" />
          <span className="text-[9px] text-[hsl(260,15%,45%)]">Real = lucro creditado</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ background: "#FACC15" }} />
          <span className="text-[9px] text-[hsl(260,15%,45%)]">Demo = capital protegido</span>
        </div>
      </div>

      <AnimatePresence>
        {notification && (
          <OpToast key={notification.text} text={notification.text} color={notification.color} onDone={dismissNotif} />
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Plans ──
const plans = [
  {
    id: "mensal",
    label: "Mensal",
    price: 37,
    installments: null,
    color: "#64748B",
    badge: null,
    checkoutUrl: "https://pay.kirvano.com/SAFETY-MENSAL-PLACEHOLDER",
  },
  {
    id: "anual",
    label: "Anual",
    price: 97,
    installments: "12x de R$ 9,50",
    color: "#22C55E",
    badge: "MAIS POPULAR",
    checkoutUrl: "https://pay.kirvano.com/SAFETY-ANUAL-PLACEHOLDER",
  },
  {
    id: "vitalicio",
    label: "Vitalício",
    price: 147,
    installments: "12x de R$ 14,37",
    color: "#FACC15",
    badge: null,
    checkoutUrl: "https://pay.kirvano.com/SAFETY-VITALICIO-PLACEHOLDER",
  },
];

const features: Record<string, string[]> = {
  mensal: ["Safety Pro ativo por 1 mês", "Proteção automática conta demo→real", "Relatório diário de proteções", "Integra com robô EASY 2.0"],
  anual: ["Safety Pro por 12 meses", "Proteção automática conta demo→real", "Relatório diário de proteções", "Integra com robô EASY 2.0", "Multiplicador de lucro 20x incluso", "Suporte prioritário WhatsApp"],
  vitalicio: ["Safety Pro vitalício (para sempre)", "Proteção automática conta demo→real", "Relatório diário de proteções", "Integra com robô EASY 2.0", "Multiplicador de lucro 20x incluso", "Suporte prioritário WhatsApp", "Todas as atualizações futuras"],
};

// ── Main ──
const UpsellSafetyPro = ({ name, onNext, onDecline }: Props) => {
  const firstName = name !== "Visitante" ? name : "";
  const [selectedPlan, setSelectedPlan] = useState("anual");
  const [loading, setLoading] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const protectedOps = useLiveCounter(12847);

  const activePlan = plans.find(p => p.id === selectedPlan)!;

  const handleBuy = () => {
    setLoading(true);
    saveUpsellExtras("safety_pro" as any, { price: activePlan.price, plan: activePlan.id });
    saveFunnelEvent("upsell_oneclick_buy", { page: "/upsell5", product: `safety_pro_${activePlan.id}`, price: activePlan.price });
    logAuditEvent({ eventType: "upsell_oneclick_buy", pageId: "/upsell5", metadata: { product: `safety_pro_${activePlan.id}`, price: activePlan.price } });
    const utmQs = buildTrackingQueryString();
    const sep = activePlan.checkoutUrl.includes("?") ? "&" : "?";
    const fullUrl = utmQs ? `${activePlan.checkoutUrl}${sep}${utmQs.slice(1)}` : activePlan.checkoutUrl;
    window.open(fullUrl, "_blank");
    setTimeout(() => setLoading(false), 3000);
  };

  return (
    <div className="flex flex-col gap-6 pt-4">

      {/* ── HERO ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-4 text-[11px] font-bold uppercase tracking-widest"
          style={{ background: "rgba(250,204,21,0.08)", border: "1px solid rgba(250,204,21,0.2)", color: "#FACC15" }}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Módulo de Proteção de Capital
        </div>

        <h1 className="text-[24px] font-extrabold leading-tight mb-3" style={{ color: "#F8FAFC" }}>
          {firstName ? `${firstName}, o robô` : "O robô"} já está operando.
          <br />
          <span style={{ color: "#FACC15" }}>Mas e quando o mercado vira?</span>
        </h1>

        <p className="text-[14px] leading-relaxed mb-5" style={{ color: "#94A3B8" }}>
          Todo sistema de IA — por mais preciso que seja — pode ser pego em um momento ruim de mercado. Sem proteção, <strong style={{ color: "#F8FAFC" }}>uma operação negativa apaga dias de lucro</strong>.
        </p>

        {/* Counter */}
        <div
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl"
          style={{ background: "rgba(250,204,21,0.05)", border: "1px solid rgba(250,204,21,0.15)" }}
        >
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#FACC15" }} />
          <span className="text-[12px]" style={{ color: "#E2E8F0" }}>
            <span className="font-bold" style={{ color: "#FACC15" }}>{protectedOps.toLocaleString("pt-BR")}</span> operações protegidas hoje
          </span>
        </div>
      </motion.div>

      {/* ── DIDACTIC EXPLAINER ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl overflow-hidden"
        style={{ border: "1px solid rgba(255,255,255,0.07)" }}
      >
        {/* Header */}
        <div className="px-4 py-3" style={{ background: "rgba(15,23,42,0.95)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-[12px] font-bold uppercase tracking-wide" style={{ color: "#64748B" }}>
            Como o Safety Pro funciona — passo a passo
          </p>
        </div>

        {/* Steps */}
        <div className="px-4 py-4 flex flex-col gap-0" style={{ background: "#0A1120" }}>
          {[
            {
              num: "1",
              icon: BarChart3,
              color: "#60A5FA",
              title: "Robô analisa cada oportunidade antes de entrar",
              desc: "O EASY 2.0 identifica uma entrada e avisa o Safety Pro. O Safety Pro analisa o risco daquele cenário em menos de 1 segundo.",
            },
            {
              num: "2",
              icon: AlertTriangle,
              color: "#FACC15",
              title: "Risco alto detectado → vai pra DEMO automaticamente",
              desc: "Se o Safety Pro detectar risco elevado, a operação é executada na conta demo. Seu dinheiro real não é tocado. Você não precisa fazer nada — acontece sozinho.",
            },
            {
              num: "3",
              icon: TrendingUp,
              color: "#22C55E",
              title: "Cenário positivo → volta pra conta REAL e lucra",
              desc: "Quando o mercado está favorável, o robô opera na conta real normalmente — e com o Multiplicador ativo, os ganhos chegam até 20x maiores.",
            },
          ].map((step, i, arr) => (
            <div key={step.num} className="flex gap-3">
              {/* Line + dot */}
              <div className="flex flex-col items-center">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-[12px]"
                  style={{ background: `${step.color}18`, border: `1.5px solid ${step.color}40`, color: step.color }}
                >
                  {step.num}
                </div>
                {i < arr.length - 1 && (
                  <div className="w-[1.5px] flex-1 my-1" style={{ background: "rgba(255,255,255,0.07)" }} />
                )}
              </div>
              {/* Content */}
              <div className={`pb-5 ${i === arr.length - 1 ? "" : ""}`}>
                <div className="flex items-center gap-2 mb-1">
                  <step.icon className="w-3.5 h-3.5" style={{ color: step.color }} />
                  <p className="text-[13px] font-bold" style={{ color: "#F1F5F9" }}>{step.title}</p>
                </div>
                <p className="text-[12px] leading-relaxed" style={{ color: "#64748B" }}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── SIMULATOR ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-1.5 rounded-full bg-[hsl(152,60%,42%)] animate-pulse" />
          <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: "#64748B" }}>
            Simulação ao vivo — veja o Safety Pro em ação:
          </p>
        </div>
        <TradeSimulator />
        <p className="text-[10px] mt-2 text-center" style={{ color: "#475569" }}>
          As linhas em amarelo (Demo) são operações que <strong style={{ color: "#F8FAFC" }}>teriam causado perda</strong> — mas o capital real ficou protegido.
        </p>
      </motion.div>

      {/* ── VIDEO ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <p className="text-[11px] font-bold uppercase tracking-wide mb-2.5" style={{ color: "#64748B" }}>
          Ricardo explica como funciona na prática:
        </p>
        <div
          className="relative rounded-2xl overflow-hidden flex items-center justify-center cursor-pointer"
          style={{
            background: "linear-gradient(135deg, #0F172A, #1E293B)",
            border: "1px solid rgba(250,204,21,0.15)",
            aspectRatio: "16/9",
          }}
          onClick={() => setShowVideo(true)}
        >
          {!showVideo ? (
            <div className="flex flex-col items-center gap-3">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: "rgba(250,204,21,0.15)", border: "2px solid rgba(250,204,21,0.35)" }}
              >
                <Play className="w-7 h-7 ml-1" style={{ color: "#FACC15" }} />
              </motion.div>
              <p className="text-[12px]" style={{ color: "#94A3B8" }}>Toque para assistir</p>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center p-6">
              {/* ↓ Substituir pelo embed real do vídeo */}
              <p className="text-[13px] text-center" style={{ color: "#64748B" }}>[Cole aqui o embed do vídeo do Ricardo]</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── O QUE VOCÊ PERDE SEM ISSO ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22 }}
        className="rounded-2xl p-4"
        style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.18)" }}
      >
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4" style={{ color: "#EF4444" }} />
          <p className="text-[13px] font-bold" style={{ color: "#F1F5F9" }}>
            O que acontece sem o Safety Pro:
          </p>
        </div>
        <div className="flex flex-col gap-2">
          {[
            "O robô entra em operações de risco sem aviso nenhum",
            "Uma sequência negativa pode zerar semanas de lucro",
            "Você só descobre a perda quando já aconteceu",
            "Sem proteção, o emocional bate — e você desliga o robô na hora errada",
          ].map((item) => (
            <div key={item} className="flex items-start gap-2">
              <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: "rgba(239,68,68,0.15)" }}>
                <span className="text-[9px] font-bold" style={{ color: "#EF4444" }}>✗</span>
              </div>
              <p className="text-[12px] leading-relaxed" style={{ color: "#94A3B8" }}>{item}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── SOCIAL PROOF ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="flex flex-col gap-3"
      >
        {[
          {
            avatar: avatarAntonio,
            name: "Antônio R., 61 anos",
            text: "\"O mercado virou de repente em fevereiro. Sem o Safety Pro, teria perdido R$ 1.200. A IA foi pra demo sozinha. Não perdi nada — e ainda fechei o dia no verde.\"",
          },
          {
            avatar: avatarMaria,
            name: "Maria C., 54 anos",
            text: "\"Eu tinha medo de deixar o robô operar sozinho. Desde que ativei o Safety Pro, durmo tranquila. Sei que ele nunca vai arriscar meu dinheiro de verdade sem cenário favorável.\"",
          },
        ].map((t) => (
          <div
            key={t.name}
            className="rounded-2xl p-4 flex items-start gap-3"
            style={{ background: "rgba(30,41,59,0.6)", border: "1px solid rgba(255,255,255,0.05)" }}
          >
            <img
              src={t.avatar}
              alt={t.name}
              className="w-10 h-10 rounded-full object-cover shrink-0"
              style={{ border: "2px solid rgba(34,197,94,0.25)" }}
            />
            <div>
              <p className="text-[13px] font-semibold mb-1" style={{ color: "#E2E8F0" }}>{t.name}</p>
              <p className="text-[12px] italic leading-relaxed" style={{ color: "#94A3B8" }}>{t.text}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* ── SYNERGY ── */}
      {firstName && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
          className="rounded-xl px-4 py-3 flex items-start gap-2.5"
          style={{ background: "rgba(250,204,21,0.05)", border: "1px solid rgba(250,204,21,0.2)" }}
        >
          <Zap className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#FACC15" }} />
          <p className="text-[13px] leading-relaxed" style={{ color: "#CBD5E1" }}>
            <strong style={{ color: "#FACC15" }}>{firstName}</strong>, com o Multiplicador que você já tem ativo, o Safety Pro age como um escudo: os lucros crescem mais rápido e as perdas <strong style={{ color: "#F8FAFC" }}>simplesmente não chegam ao seu saldo real</strong>.
          </p>
        </motion.div>
      )}

      {/* ── PLAN SELECTOR ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <p className="text-[12px] text-center font-semibold mb-3" style={{ color: "#94A3B8" }}>
          Escolha por quanto tempo quer sua proteção ativa:
        </p>
        <div
          className="flex rounded-2xl p-1.5 gap-1 mb-4"
          style={{ background: "#0F172A", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          {plans.map((plan) => {
            const isActive = selectedPlan === plan.id;
            return (
              <motion.button
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                whileTap={{ scale: 0.96 }}
                className="flex-1 py-3 rounded-xl text-center relative cursor-pointer"
                style={{
                  background: isActive ? `${plan.color}12` : "rgba(255,255,255,0.02)",
                  border: isActive ? `1.5px solid ${plan.color}` : "1.5px solid rgba(255,255,255,0.07)",
                }}
              >
                {plan.badge && (
                  <span
                    className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[8px] font-bold px-2 py-0.5 rounded-full text-white whitespace-nowrap"
                    style={{ background: "#16A34A" }}
                  >
                    {plan.badge}
                  </span>
                )}
                <p className="text-[12px] font-bold" style={{ color: isActive ? plan.color : "#94A3B8" }}>{plan.label}</p>
                <p className="text-[10px] mt-0.5" style={{ color: isActive ? "#CBD5E1" : "#64748B" }}>R$ {plan.price}</p>
              </motion.button>
            );
          })}
        </div>

        {/* Plan detail */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedPlan}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl overflow-hidden"
            style={{ border: `1.5px solid ${activePlan.color}33` }}
          >
            <div
              className="px-5 py-4 flex items-center justify-between"
              style={{ background: `${activePlan.color}08` }}
            >
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <ShieldCheck className="w-4 h-4" style={{ color: activePlan.color }} />
                  <h3 className="text-[16px] font-bold" style={{ color: "#F8FAFC" }}>Safety Pro {activePlan.label}</h3>
                </div>
                {activePlan.installments && (
                  <p className="text-[11px]" style={{ color: "#64748B" }}>{activePlan.installments}</p>
                )}
              </div>
              <div className="text-right">
                <span className="text-[26px] font-extrabold" style={{ color: "#F8FAFC" }}>R$ {activePlan.price}</span>
                <p className="text-[10px]" style={{ color: "#64748B" }}>único</p>
              </div>
            </div>

            <div className="px-5 py-4" style={{ background: "#0F172A" }}>
              <div className="flex flex-col gap-2 mb-5">
                {features[activePlan.id].map((f) => (
                  <div key={f} className="flex items-center gap-2.5">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: `${activePlan.color}15` }}
                    >
                      <Check className="w-3 h-3" style={{ color: activePlan.color }} />
                    </div>
                    <span className="text-[13px]" style={{ color: "#E2E8F0" }}>{f}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={handleBuy}
                disabled={loading}
                className="w-full py-[17px] rounded-xl text-[15px] font-bold transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
                style={{
                  background: "linear-gradient(135deg, #FACC15, #EAB308)",
                  color: "#020617",
                  boxShadow: "0 0 24px rgba(250,204,21,0.22), 0 4px 12px rgba(0,0,0,0.3)",
                }}
              >
                {loading ? "Processando..." : <>ATIVAR SAFETY PRO — R$ {activePlan.price} <ArrowRight className="w-4 h-4" /></>}
              </button>

              <div className="flex items-center justify-center gap-5 mt-3">
                {([
                  [Lock, "100% seguro"],
                  [ShieldCheck, "Garantia 30 dias"],
                  [RefreshCw, "Ativação imediata"],
                ] as const).map(([Icon, label]) => (
                  <div key={label} className="flex items-center gap-1">
                    <Icon className="w-3.5 h-3.5" style={{ color: "#475569" }} />
                    <span className="text-[10px]" style={{ color: "#475569" }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* ── SKIP ── */}
      <button
        onClick={() => {
          saveFunnelEvent("upsell_oneclick_decline", { page: "/upsell5" });
          logAuditEvent({ eventType: "upsell_oneclick_decline", pageId: "/upsell5" });
          onDecline();
        }}
        className="text-[12px] underline cursor-pointer bg-transparent border-none mx-auto py-2 pb-8"
        style={{ color: "#475569" }}
      >
        Não, prefiro continuar sem proteção de capital.
      </button>
    </div>
  );
};

export default UpsellSafetyPro;
