import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, TrendingUp, Check, Lock, Zap,
  BarChart3, RefreshCw, ArrowRight, Bot,
  Loader2, Play, AlertTriangle, CircleDot,
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
    <div className="px-3 py-2.5">
      <div className="flex items-center gap-2 mb-2">
        <Loader2 className={`w-3.5 h-3.5 text-[hsl(280,70%,70%)] ${paused ? "" : "animate-spin"}`} />
        <span className="text-[12px] font-semibold text-[hsl(280,70%,70%)]">
          {paused ? "Monitorando próxima janela..." : "Analisando risco do mercado..."}
        </span>
      </div>
      <div className="w-full h-2 bg-[hsl(260,22%,15%)] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-75 bg-gradient-to-r from-[hsl(280,70%,55%)] to-[hsl(260,70%,60%)]"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

// ── Simulator ──
type SimOp = {
  hora: string; par: string; preco: string;
  lucro: number; tipo: "win"; conta: "real" | "demo";
  savedAmount?: number;
};

// Força alternância: nunca mais de 2 reais seguidos sem um demo
const nextConta = (history: SimOp[]): "real" | "demo" => {
  const last2 = history.slice(-2);
  const allReal = last2.length === 2 && last2.every(o => o.conta === "real");
  if (allReal) return "demo"; // força demo após 2 reais seguidos
  return Math.random() < 0.42 ? "demo" : "real"; // 42% de chance de demo
};

const TradeSimulator = () => {
  const [history, setHistory] = useState<SimOp[]>([]);
  const [balance, setBalance] = useState(1_247.38);
  const [sessionProfit, setSessionProfit] = useState(0);
  const [wins, setWins] = useState(0);
  const [savedCount, setSavedCount] = useState(0);
  const [totalSavedR$, setTotalSavedR$] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [safetyStatus, setSafetyStatus] = useState<"real" | "demo" | "risk">("real");
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertAmount, setAlertAmount] = useState(0);
  const historyRef = useRef<HTMLDivElement>(null);
  const opRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const historySnapshot = useRef<SimOp[]>([]);

  const runOp = useCallback(() => {
    const conta = nextConta(historySnapshot.current);

    if (conta === "demo") {
      // Fase 1: mostra RISCO por 800ms antes
      setSafetyStatus("risk");
      setTimeout(() => {
        setSafetyStatus("demo");

        const savedAmount = parseFloat((12 + Math.random() * 48).toFixed(2));
        const parIdx = Math.floor(Math.random() * pares.length);
        const hora = new Date().toLocaleTimeString("pt-BR").slice(0, 8);
        const op: SimOp = {
          hora, par: pares[parIdx], preco: precos[parIdx],
          lucro: -savedAmount, tipo: "win", conta: "demo", savedAmount,
        };

        historySnapshot.current = [...historySnapshot.current.slice(-13), op];
        setHistory(prev => [...prev.slice(-13), op]);
        setSavedCount(prev => prev + 1);
        setTotalSavedR$(prev => parseFloat((prev + savedAmount).toFixed(2)));
        setAlertAmount(savedAmount);
        setAlertVisible(true);
        setTimeout(() => setAlertVisible(false), 2800);
        setTimeout(() => {
          setSafetyStatus("real");
          opRef.current = setTimeout(() => setIsAnalyzing(true), 500);
        }, 1400);
      }, 800);
    } else {
      setSafetyStatus("real");
      const lucro = parseFloat((8 + Math.random() * 36).toFixed(2));
      const parIdx = Math.floor(Math.random() * pares.length);
      const hora = new Date().toLocaleTimeString("pt-BR").slice(0, 8);
      const op: SimOp = { hora, par: pares[parIdx], preco: precos[parIdx], lucro, tipo: "win", conta: "real" };

      historySnapshot.current = [...historySnapshot.current.slice(-13), op];
      setHistory(prev => [...prev.slice(-13), op]);
      setSessionProfit(prev => parseFloat((prev + lucro).toFixed(2)));
      setBalance(prev => parseFloat((prev + lucro).toFixed(2)));
      setWins(prev => prev + 1);
      opRef.current = setTimeout(() => setIsAnalyzing(true), 500 + Math.random() * 400);
    }
  }, []);

  const handleAnalysisDone = useCallback(() => {
    setIsAnalyzing(false);
    opRef.current = setTimeout(runOp, 180);
  }, [runOp]);

  useEffect(() => () => { if (opRef.current) clearTimeout(opRef.current); }, []);
  useEffect(() => {
    if (historyRef.current) historyRef.current.scrollTop = historyRef.current.scrollHeight;
  }, [history]);

  return (
    <div className={`w-full rounded-2xl overflow-hidden shadow-2xl ${plat.bg} ${plat.border} border relative`}>

      {/* ── ALERTA SAFETY PRO (overlay) ── */}
      <AnimatePresence>
        {alertVisible && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="absolute top-0 left-0 right-0 z-20 flex items-center gap-3 px-4 py-3"
            style={{
              background: "linear-gradient(90deg, rgba(250,204,21,0.18), rgba(250,204,21,0.08))",
              borderBottom: "2px solid rgba(250,204,21,0.5)",
            }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "rgba(250,204,21,0.2)", border: "1.5px solid rgba(250,204,21,0.5)" }}
            >
              <ShieldCheck className="w-4 h-4" style={{ color: "#FACC15" }} />
            </div>
            <div>
              <p className="text-[12px] font-extrabold" style={{ color: "#FACC15" }}>
                Safety Pro bloqueou esta operação
              </p>
              <p className="text-[11px] font-semibold" style={{ color: "#E2E8F0" }}>
                R$ {alertAmount.toFixed(2)} de perda evitados — capital real intacto
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Top bar ── */}
      <div className={`bg-[hsl(260,28%,10%)] px-3 py-2.5 flex items-center justify-between ${plat.border} border-b`}>
        <div className="flex items-center gap-2">
          <Play className="w-3.5 h-3.5 text-[hsl(280,70%,65%)]" fill="currentColor" />
          <span className="text-[12px] font-bold text-white tracking-wide">
            <span className="text-[hsl(280,70%,70%)]">ALFA HÍBRIDA</span> · IA ao vivo
          </span>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={safetyStatus}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold"
            style={{
              background:
                safetyStatus === "risk" ? "rgba(239,68,68,0.25)" :
                safetyStatus === "demo" ? "rgba(250,204,21,0.2)" :
                "rgba(22,163,74,0.15)",
              border:
                safetyStatus === "risk" ? "1.5px solid rgba(239,68,68,0.6)" :
                safetyStatus === "demo" ? "1.5px solid rgba(250,204,21,0.55)" :
                "1.5px solid rgba(22,163,74,0.45)",
              color:
                safetyStatus === "risk" ? "#EF4444" :
                safetyStatus === "demo" ? "#FACC15" :
                "#22C55E",
            }}
          >
            {safetyStatus === "risk" ? (
              <><AlertTriangle className="w-3 h-3" /> RISCO DETECTADO</>
            ) : safetyStatus === "demo" ? (
              <><ShieldCheck className="w-3 h-3" /> BLOQUEADO · demo</>
            ) : (
              <><CircleDot className="w-3 h-3" /> REAL · operando</>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Stats row ── */}
      <div className="px-3 py-2.5 grid grid-cols-3 gap-2">
        <div className={`${plat.card} rounded-xl p-2.5 ${plat.border} border`}>
          <p className="text-[10px] font-medium text-[hsl(260,15%,55%)] mb-1">Saldo real</p>
          <p className="text-[14px] font-extrabold text-white leading-none">
            R$ {balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className={`${plat.card} rounded-xl p-2.5 ${plat.border} border`}>
          <p className="text-[10px] font-medium text-[hsl(260,15%,55%)] mb-1">Lucro real</p>
          <p className="text-[14px] font-extrabold leading-none" style={{ color: "#22C55E" }}>
            +R$ {sessionProfit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className={`${plat.card} rounded-xl p-2.5 ${plat.border} border`} style={{ borderColor: "rgba(250,204,21,0.3)" }}>
          <p className="text-[10px] font-medium mb-1" style={{ color: "#FACC15" }}>Perdas salvas</p>
          <p className="text-[14px] font-extrabold leading-none" style={{ color: "#FACC15" }}>
            R$ {totalSavedR$.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* ── Robot status bar ── */}
      <div className={`px-3 py-2 flex items-center justify-between ${plat.border} border-t border-b ${plat.secondary}`}>
        <div className="flex items-center gap-2">
          <Bot className="w-3.5 h-3.5 text-[hsl(280,70%,70%)]" />
          <span className="text-[11px] font-bold text-white">EASY 2.0</span>
          <span className="text-[10px] font-semibold" style={{ color: "#FACC15" }}>+ Safety Pro</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[hsl(152,60%,45%)] animate-pulse" />
          <span className="text-[10px] font-semibold text-[hsl(152,60%,50%)]">Robô ativo</span>
        </div>
      </div>

      {/* ── Analyzing bar ── */}
      <AnalyzingBar key={isAnalyzing ? "a" : "i"} onDone={handleAnalysisDone} paused={!isAnalyzing} />

      {/* ── History ── */}
      <div className={`${plat.border} border-t`}>
        {/* Header */}
        <div className={`px-3 py-2 flex items-center justify-between ${plat.border} border-b ${plat.secondary}`}>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-white">Operações</span>
            <span className="text-[11px] font-bold" style={{ color: "#22C55E" }}>{wins} ganhos</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" style={{ color: "#FACC15" }} />
            <span className="text-[11px] font-semibold" style={{ color: "#FACC15" }}>{savedCount} bloqueadas</span>
          </div>
        </div>

        {/* Column headers */}
        <div className={`px-3 py-2 grid ${plat.border} border-b`} style={{ gridTemplateColumns: "52px 1fr 64px 80px" }}>
          {["Hora", "Par", "Conta", "Resultado"].map(h => (
            <span key={h} className="text-[10px] font-bold text-[hsl(260,15%,55%)] last:text-right">{h}</span>
          ))}
        </div>

        {/* Rows */}
        <div ref={historyRef} className="max-h-[160px] overflow-y-auto" style={{ scrollBehavior: "smooth" }}>
          {history.length === 0 && (
            <div className="py-7 text-center">
              <p className="text-[11px] text-[hsl(260,15%,45%)]">Aguardando primeira operação...</p>
            </div>
          )}
          {history.map((op, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              className={`px-3 py-2 grid border-b`}
              style={{
                gridTemplateColumns: "52px 1fr 64px 80px",
                borderColor: op.conta === "demo" ? "rgba(250,204,21,0.2)" : "rgba(255,255,255,0.05)",
                background: op.conta === "demo" ? "rgba(250,204,21,0.05)" : "transparent",
              }}
            >
              <span className="text-[10px] text-[hsl(260,15%,50%)] font-mono">{op.hora}</span>
              <span className="text-[10px] font-bold text-white">{op.par}</span>
              <span
                className="text-[10px] font-bold flex items-center gap-0.5"
                style={{ color: op.conta === "demo" ? "#FACC15" : "#94A3B8" }}
              >
                {op.conta === "demo"
                  ? <><ShieldCheck className="w-3 h-3 shrink-0" /> Demo</>
                  : "Real"}
              </span>
              <span
                className="text-[10px] font-extrabold text-right"
                style={{ color: op.conta === "demo" ? "#FACC15" : "#22C55E" }}
              >
                {op.conta === "demo"
                  ? `🛡 R$${op.savedAmount?.toFixed(2)} salvo`
                  : `+R$${op.lucro.toFixed(2)}`}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Legend ── */}
      <div className={`px-3 py-2.5 flex items-center justify-between ${plat.border} border-t`} style={{ background: "rgba(15,23,42,0.95)" }}>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ background: "#22C55E" }} />
          <span className="text-[11px] font-semibold" style={{ color: "#CBD5E1" }}>Verde = lucro real creditado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ background: "#FACC15" }} />
          <span className="text-[11px] font-semibold" style={{ color: "#CBD5E1" }}>Amarelo = perda bloqueada</span>
        </div>
      </div>
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
  mensal: [
    "Safety Pro ativo por 1 mês",
    "Proteção automática em tempo real",
    "Relatório diário de operações salvas",
    "Integra com o robô EASY 2.0",
  ],
  anual: [
    "Safety Pro ativo por 12 meses",
    "Proteção automática em tempo real",
    "Relatório diário de operações salvas",
    "Integra com o robô EASY 2.0",
    "Multiplicador de lucro 20x incluso",
    "Suporte prioritário via WhatsApp",
  ],
  vitalicio: [
    "Safety Pro vitalício — para sempre",
    "Proteção automática em tempo real",
    "Relatório diário de operações salvas",
    "Integra com o robô EASY 2.0",
    "Multiplicador de lucro 20x incluso",
    "Suporte prioritário via WhatsApp",
    "Todas as atualizações futuras incluídas",
  ],
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
    <div className="flex flex-col gap-7 pt-4">

      {/* ── HERO ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-5 text-[12px] font-bold uppercase tracking-widest"
          style={{ background: "rgba(250,204,21,0.1)", border: "1px solid rgba(250,204,21,0.25)", color: "#FACC15" }}
        >
          <ShieldCheck className="w-4 h-4" />
          Módulo de Proteção de Capital
        </div>

        <h1 className="text-[26px] font-extrabold leading-tight mb-4" style={{ color: "#F8FAFC" }}>
          {firstName ? `${firstName}, o robô` : "O robô"} já está operando.
          <br />
          <span style={{ color: "#FACC15" }}>Mas e quando o mercado vira?</span>
        </h1>

        <p className="text-[15px] leading-relaxed mb-5" style={{ color: "#CBD5E1" }}>
          Todo sistema de IA pode encontrar momentos difíceis no mercado. Sem proteção,{" "}
          <strong style={{ color: "#F8FAFC" }}>uma única operação ruim pode apagar dias de lucro</strong>.
        </p>

        <div
          className="inline-flex items-center gap-2.5 px-5 py-3 rounded-xl"
          style={{ background: "rgba(250,204,21,0.07)", border: "1px solid rgba(250,204,21,0.2)" }}
        >
          <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: "#FACC15" }} />
          <span className="text-[13px]" style={{ color: "#E2E8F0" }}>
            <span className="font-bold" style={{ color: "#FACC15" }}>{protectedOps.toLocaleString("pt-BR")}</span>{" "}
            operações protegidas hoje
          </span>
        </div>
      </motion.div>

      {/* ── HOW IT WORKS — passo a passo ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl overflow-hidden"
        style={{ border: "1px solid rgba(255,255,255,0.1)" }}
      >
        <div className="px-5 py-3.5" style={{ background: "rgba(15,23,42,0.98)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-[13px] font-bold uppercase tracking-wide" style={{ color: "#94A3B8" }}>
            Como o Safety Pro funciona — passo a passo
          </p>
        </div>

        <div className="px-5 py-5 flex flex-col gap-0" style={{ background: "#0A1120" }}>
          {[
            {
              num: "1",
              icon: BarChart3,
              color: "#60A5FA",
              title: "O robô analisa cada oportunidade antes de entrar",
              desc: "O EASY 2.0 encontra uma entrada. O Safety Pro verifica o risco daquele cenário em menos de 1 segundo.",
            },
            {
              num: "2",
              icon: AlertTriangle,
              color: "#FACC15",
              title: "Risco alto? A operação vai para a conta DEMO",
              desc: "O Safety Pro detecta o perigo e executa a operação em demo automaticamente. Seu dinheiro real não é tocado — você não precisa fazer nada.",
            },
            {
              num: "3",
              icon: TrendingUp,
              color: "#22C55E",
              title: "Cenário favorável? Opera na conta REAL e lucra",
              desc: "Quando o mercado está positivo, o robô opera normalmente na conta real — e com o Multiplicador, os ganhos chegam até 20x maiores.",
            },
          ].map((step, i, arr) => (
            <div key={step.num} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-extrabold text-[14px]"
                  style={{ background: `${step.color}20`, border: `2px solid ${step.color}50`, color: step.color }}
                >
                  {step.num}
                </div>
                {i < arr.length - 1 && (
                  <div className="w-[2px] flex-1 my-1.5" style={{ background: "rgba(255,255,255,0.08)" }} />
                )}
              </div>
              <div className="pb-6">
                <div className="flex items-center gap-2 mb-1.5">
                  <step.icon className="w-4 h-4 shrink-0" style={{ color: step.color }} />
                  <p className="text-[14px] font-bold" style={{ color: "#F1F5F9" }}>{step.title}</p>
                </div>
                <p className="text-[13px] leading-relaxed" style={{ color: "#94A3B8" }}>{step.desc}</p>
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
          <div className="w-2 h-2 rounded-full bg-[hsl(152,60%,45%)] animate-pulse" />
          <p className="text-[12px] font-bold uppercase tracking-wide" style={{ color: "#94A3B8" }}>
            Veja o Safety Pro funcionando em tempo real:
          </p>
        </div>
        <TradeSimulator />
        {/* Legenda explicativa — visível e clara */}
        <div
          className="mt-3 rounded-xl px-4 py-3"
          style={{ background: "rgba(250,204,21,0.06)", border: "1px solid rgba(250,204,21,0.18)" }}
        >
          <p className="text-[13px] leading-relaxed font-medium" style={{ color: "#E2E8F0" }}>
            <span style={{ color: "#FACC15", fontWeight: 700 }}>Amarelo = operação protegida.</span>{" "}
            Quando o Safety Pro detecta risco, a operação vai para a conta demo — e o seu dinheiro real{" "}
            <span style={{ color: "#F8FAFC", fontWeight: 700 }}>fica intacto</span>.
          </p>
        </div>
      </motion.div>

      {/* ── VIDEO ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <p className="text-[13px] font-bold uppercase tracking-wide mb-3" style={{ color: "#94A3B8" }}>
          Ricardo explica como funciona na prática:
        </p>
        <div
          className="relative rounded-2xl overflow-hidden flex items-center justify-center cursor-pointer"
          style={{
            background: "linear-gradient(135deg, #0F172A, #1E293B)",
            border: "1px solid rgba(250,204,21,0.2)",
            aspectRatio: "16/9",
          }}
          onClick={() => setShowVideo(true)}
        >
          {!showVideo ? (
            <div className="flex flex-col items-center gap-3">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-18 h-18 w-[72px] h-[72px] rounded-full flex items-center justify-center"
                style={{ background: "rgba(250,204,21,0.15)", border: "2px solid rgba(250,204,21,0.4)" }}
              >
                <Play className="w-8 h-8 ml-1" style={{ color: "#FACC15" }} />
              </motion.div>
              <p className="text-[13px] font-medium" style={{ color: "#CBD5E1" }}>Toque para assistir</p>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center p-6">
              <p className="text-[14px] text-center" style={{ color: "#64748B" }}>[Cole aqui o embed do vídeo do Ricardo]</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── O QUE VOCÊ PERDE SEM ISSO ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22 }}
        className="rounded-2xl p-5"
        style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.22)" }}
      >
        <div className="flex items-center gap-2.5 mb-4">
          <AlertTriangle className="w-5 h-5 shrink-0" style={{ color: "#EF4444" }} />
          <p className="text-[15px] font-bold" style={{ color: "#F8FAFC" }}>
            O que acontece sem o Safety Pro:
          </p>
        </div>
        <div className="flex flex-col gap-3">
          {[
            "O robô entra em operações de risco sem nenhuma proteção",
            "Uma sequência negativa pode apagar semanas de lucro",
            "Você só descobre a perda quando já aconteceu",
            "O emocional bate e você desliga o robô na hora errada — perdendo os ganhos futuros",
          ].map((item) => (
            <div key={item} className="flex items-start gap-3">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: "rgba(239,68,68,0.18)", border: "1px solid rgba(239,68,68,0.3)" }}
              >
                <span className="text-[11px] font-bold" style={{ color: "#EF4444" }}>✕</span>
              </div>
              <p className="text-[13px] leading-relaxed" style={{ color: "#CBD5E1" }}>{item}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── SOCIAL PROOF ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="flex flex-col gap-4"
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
            text: "\"Eu tinha medo de deixar o robô operar sozinho. Desde que ativei o Safety Pro, durmo tranquila. Sei que ele nunca vai arriscar meu dinheiro sem o cenário estar favorável.\"",
          },
        ].map((t) => (
          <div
            key={t.name}
            className="rounded-2xl p-4 flex items-start gap-3.5"
            style={{ background: "rgba(30,41,59,0.7)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <img
              src={t.avatar}
              alt={t.name}
              className="w-12 h-12 rounded-full object-cover shrink-0"
              style={{ border: "2px solid rgba(34,197,94,0.3)" }}
            />
            <div>
              <p className="text-[14px] font-bold mb-1.5" style={{ color: "#F1F5F9" }}>{t.name}</p>
              <p className="text-[13px] italic leading-relaxed" style={{ color: "#CBD5E1" }}>{t.text}</p>
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
          className="rounded-xl px-5 py-4 flex items-start gap-3"
          style={{ background: "rgba(250,204,21,0.07)", border: "1px solid rgba(250,204,21,0.25)" }}
        >
          <Zap className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#FACC15" }} />
          <p className="text-[14px] leading-relaxed" style={{ color: "#E2E8F0" }}>
            <strong style={{ color: "#FACC15" }}>{firstName}</strong>, com o Multiplicador que você já tem ativo, o Safety Pro age como um escudo: os lucros crescem mais rápido{" "}
            <strong style={{ color: "#F8FAFC" }}>e as perdas simplesmente não chegam ao seu saldo real</strong>.
          </p>
        </motion.div>
      )}

      {/* ── PLAN SELECTOR ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <p className="text-[14px] text-center font-semibold mb-4" style={{ color: "#CBD5E1" }}>
          Escolha por quanto tempo quer sua proteção ativa:
        </p>

        {/* Tabs */}
        <div
          className="flex rounded-2xl p-1.5 gap-1.5 mb-5"
          style={{ background: "#0F172A", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          {plans.map((plan) => {
            const isActive = selectedPlan === plan.id;
            return (
              <motion.button
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                whileTap={{ scale: 0.96 }}
                className="flex-1 py-3.5 rounded-xl text-center relative cursor-pointer"
                style={{
                  background: isActive ? `${plan.color}14` : "rgba(255,255,255,0.02)",
                  border: isActive ? `2px solid ${plan.color}` : "2px solid rgba(255,255,255,0.07)",
                }}
              >
                {plan.badge && (
                  <span
                    className="absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] font-bold px-2.5 py-0.5 rounded-full text-white whitespace-nowrap"
                    style={{ background: "#16A34A" }}
                  >
                    {plan.badge}
                  </span>
                )}
                <p className="text-[13px] font-bold" style={{ color: isActive ? plan.color : "#94A3B8" }}>{plan.label}</p>
                <p className="text-[11px] mt-0.5 font-medium" style={{ color: isActive ? "#E2E8F0" : "#64748B" }}>R$ {plan.price}</p>
              </motion.button>
            );
          })}
        </div>

        {/* Plan card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedPlan}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl overflow-hidden"
            style={{ border: `2px solid ${activePlan.color}40` }}
          >
            {/* Plan header */}
            <div
              className="px-5 py-4 flex items-center justify-between"
              style={{ background: `${activePlan.color}09`, borderBottom: `1px solid ${activePlan.color}25` }}
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck className="w-5 h-5" style={{ color: activePlan.color }} />
                  <h3 className="text-[17px] font-bold" style={{ color: "#F8FAFC" }}>
                    Safety Pro {activePlan.label}
                  </h3>
                </div>
                {activePlan.installments && (
                  <p className="text-[12px] font-medium" style={{ color: "#94A3B8" }}>{activePlan.installments}</p>
                )}
              </div>
              <div className="text-right">
                <span className="text-[28px] font-extrabold" style={{ color: "#F8FAFC" }}>R$ {activePlan.price}</span>
                <p className="text-[11px] font-medium" style={{ color: "#64748B" }}>único</p>
              </div>
            </div>

            {/* Features */}
            <div className="px-5 py-5" style={{ background: "#0F172A" }}>
              <div className="flex flex-col gap-3 mb-6">
                {features[activePlan.id].map((f) => (
                  <div key={f} className="flex items-center gap-3">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: `${activePlan.color}18`, border: `1px solid ${activePlan.color}35` }}
                    >
                      <Check className="w-3.5 h-3.5" style={{ color: activePlan.color }} />
                    </div>
                    <span className="text-[14px]" style={{ color: "#E2E8F0" }}>{f}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <button
                onClick={handleBuy}
                disabled={loading}
                className="w-full py-[18px] rounded-xl text-[16px] font-bold transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
                style={{
                  background: "linear-gradient(135deg, #FACC15, #EAB308)",
                  color: "#020617",
                  boxShadow: "0 0 28px rgba(250,204,21,0.25), 0 4px 16px rgba(0,0,0,0.35)",
                }}
              >
                {loading ? "Processando..." : <>ATIVAR SAFETY PRO — R$ {activePlan.price} <ArrowRight className="w-4 h-4" /></>}
              </button>

              {/* Trust badges */}
              <div className="flex items-center justify-center gap-6 mt-4">
                {([
                  [Lock, "100% seguro"],
                  [ShieldCheck, "Garantia 30 dias"],
                  [RefreshCw, "Ativação imediata"],
                ] as const).map(([Icon, label]) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5" style={{ color: "#64748B" }} />
                    <span className="text-[11px] font-medium" style={{ color: "#64748B" }}>{label}</span>
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
        className="text-[13px] underline cursor-pointer bg-transparent border-none mx-auto py-2 pb-8 block"
        style={{ color: "#64748B" }}
      >
        Não, prefiro continuar sem proteção de capital.
      </button>
    </div>
  );
};

export default UpsellSafetyPro;
