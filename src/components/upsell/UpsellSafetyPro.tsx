import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, TrendingUp, Check, Lock, Zap,
  BarChart3, RefreshCw, ArrowRight, Bot,
  Loader2, AlertTriangle, CircleDot,
} from "lucide-react";
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
    const duration = 2500 + Math.random() * 1500;
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
        const now = new Date();
        const op: SimOp = {
          hora: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
          par: pares[parIdx],
          preco: precos[parIdx],
          lucro: savedAmount,
          tipo: "win",
          conta: "demo",
          savedAmount,
        };
        setHistory(h => [op, ...h].slice(0, 12));
        historySnapshot.current = [op, ...historySnapshot.current].slice(0, 12);
        setSavedCount(c => c + 1);
        setTotalSavedR$(t => parseFloat((t + savedAmount).toFixed(2)));
        setAlertAmount(savedAmount);
        setAlertVisible(true);
        setTimeout(() => setAlertVisible(false), 3000);
        setTimeout(() => {
          setSafetyStatus("real");
          setIsAnalyzing(true);
          opRef.current = setTimeout(runOp, 6000 + Math.random() * 4000);
        }, 2200);
      }, 800);
    } else {
      const profit = parseFloat((8 + Math.random() * 42).toFixed(2));
      const parIdx = Math.floor(Math.random() * pares.length);
      const now = new Date();
      const op: SimOp = {
        hora: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
        par: pares[parIdx],
        preco: precos[parIdx],
        lucro: profit,
        tipo: "win",
        conta: "real",
      };
      setHistory(h => [op, ...h].slice(0, 12));
      historySnapshot.current = [op, ...historySnapshot.current].slice(0, 12);
      setBalance(b => parseFloat((b + profit).toFixed(2)));
      setSessionProfit(p => parseFloat((p + profit).toFixed(2)));
      setWins(w => w + 1);
      setSafetyStatus("real");
      setIsAnalyzing(true);
      opRef.current = setTimeout(runOp, 6000 + Math.random() * 4000);
    }
  }, []);

  const handleAnalysisDone = useCallback(() => {
    setIsAnalyzing(false);
    opRef.current = setTimeout(runOp, 400);
  }, [runOp]);

  useEffect(() => {
    return () => { if (opRef.current) clearTimeout(opRef.current); };
  }, []);

  // Não usar scrollTop para não interferir no scroll da página

  return (
    <div
      className={`rounded-2xl overflow-hidden ${plat.border} border`}
      style={{ background: "hsl(260,30%,8%)" }}
    >
      {/* Header */}
      <div
        className="px-3 py-2.5 flex items-center justify-between"
        style={{ background: "hsl(260,25%,11%)", borderBottom: "1px solid hsl(270,30%,20%)" }}
      >
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-[hsl(280,70%,70%)]" />
          <span className="text-[13px] font-bold text-[hsl(280,70%,80%)]">Safety Pro · Ativo</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[11px] text-[hsl(280,40%,70%)]">AO VIVO</span>
        </div>
      </div>

      {/* Alert overlay — posição absoluta para não deslocar o layout */}
      <div className="relative h-0 overflow-visible z-10">
        <AnimatePresence>
          {alertVisible && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute left-3 right-3 top-2 rounded-xl px-3 py-2 flex items-center gap-2"
              style={{ background: "rgba(250,204,21,0.92)", backdropFilter: "blur(4px)", boxShadow: "0 4px 16px rgba(0,0,0,0.3)" }}
            >
              <ShieldCheck className="w-4 h-4 shrink-0" style={{ color: "#0F172A" }} />
              <p className="text-[12px] font-bold" style={{ color: "#0F172A" }}>
                🛡️ Safety Pro bloqueou — R${alertAmount.toFixed(2)} de perda evitados!
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-0" style={{ borderBottom: "1px solid hsl(270,30%,18%)" }}>
        {[
          { label: "Saldo", value: `R$${balance.toFixed(2)}`, color: "#22C55E" },
          { label: "Lucro sessão", value: `+R$${sessionProfit.toFixed(2)}`, color: "#22C55E" },
          { label: "Salvo hoje", value: `R$${totalSavedR$.toFixed(2)}`, color: "#FACC15" },
        ].map((s, i) => (
          <div
            key={i}
            className="flex flex-col items-center py-2.5"
            style={{ borderRight: i < 2 ? "1px solid hsl(270,30%,18%)" : "none" }}
          >
            <span className="text-[10px] text-[hsl(280,30%,60%)] mb-0.5">{s.label}</span>
            <span className="text-[13px] font-bold tabular-nums" style={{ color: s.color, minWidth: "80px", textAlign: "center" }}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Safety status */}
      <div
        className="px-3 py-2 flex items-center justify-between"
        style={{ background: "hsl(260,28%,10%)", borderBottom: "1px solid hsl(270,30%,18%)" }}
      >
        <span className="text-[11px] text-[hsl(280,30%,60%)]">Status Safety Pro:</span>
        <AnimatePresence mode="wait">
          <motion.div
            key={safetyStatus}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold"
            style={
              safetyStatus === "risk"
                ? { background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.5)", color: "#FCA5A5" }
                : safetyStatus === "demo"
                ? { background: "rgba(250,204,21,0.15)", border: "1px solid rgba(250,204,21,0.4)", color: "#FEF08A" }
                : { background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.4)", color: "#86EFAC" }
            }
          >
            {safetyStatus === "risk" ? (
              <><AlertTriangle className="w-3 h-3" /> RISCO — BLOQUEANDO</>
            ) : safetyStatus === "demo" ? (
              <><ShieldCheck className="w-3 h-3" /> DEMO · protegido</>
            ) : (
              <><CircleDot className="w-3 h-3" /> REAL · operando</>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Analyzing bar */}
      {isAnalyzing && (
        <AnalyzingBar
          onDone={handleAnalysisDone}
          paused={safetyStatus === "demo" || safetyStatus === "risk"}
        />
      )}

      {/* History */}
      <div ref={historyRef} className="flex flex-col gap-0 max-h-[220px] overflow-y-auto" style={{ overflowAnchor: "none" }}>
        {history.length === 0 && (
          <div className="px-3 py-4 text-center">
            <p className="text-[12px] text-[hsl(280,30%,55%)]">Aguardando primeira operação...</p>
          </div>
        )}
        {history.map((op, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-between px-3 py-2.5"
            style={{
              borderBottom: "1px solid hsl(270,30%,15%)",
              background: op.conta === "demo" ? "rgba(250,204,21,0.04)" : "transparent",
            }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[10px] text-[hsl(280,30%,50%)] shrink-0">{op.hora}</span>
              <span className="text-[12px] font-semibold text-[hsl(280,60%,75%)] truncate">{op.par}</span>
              {op.conta === "demo" && (
                <span
                  className="text-[9px] font-bold rounded px-1 py-0.5 shrink-0"
                  style={{ background: "rgba(250,204,21,0.15)", color: "#FACC15" }}
                >
                  DEMO
                </span>
              )}
            </div>
            <span
              className="text-[12px] font-bold tabular-nums shrink-0"
              style={{ color: op.conta === "demo" ? "#FACC15" : "#22C55E" }}
            >
              {op.conta === "demo"
                ? `Salvo R$${op.lucro.toFixed(2)}`
                : `+R$${op.lucro.toFixed(2)}`}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Legend */}
      <div
        className="px-3 py-2.5 mt-1 mx-3 mb-3 rounded-xl"
        style={{ background: "rgba(250,204,21,0.06)", border: "1px solid rgba(250,204,21,0.18)" }}
      >
        <p className="text-[12px] leading-relaxed font-medium" style={{ color: "#E2E8F0" }}>
          <span style={{ color: "#FACC15", fontWeight: 700 }}>🟡 Amarelo = operação protegida.</span>{" "}
          Quando o Safety Pro detecta risco, a operação vai para a conta demo — e o seu dinheiro real fica intacto.
        </p>
      </div>
    </div>
  );
};

// ── Plans ──
const plans = [
  {
    id: "mensal",
    label: "Mensal",
    price: 97,
    per: "/mês",
    highlight: false,
    badge: null,
    checkoutUrl: "https://pay.kirvano.com/c7f4277f-ad68-4952-92ba-8e2ea9bea47f",
    features: ["Safety Pro ativo 24h", "Proteção em tempo real", "Suporte prioritário"],
  },
  {
    id: "anual",
    label: "Anual",
    price: 197,
    per: "/ano",
    highlight: true,
    badge: "MAIS POPULAR",
    checkoutUrl: "https://pay.kirvano.com/0a54e723-14b9-4835-a20d-07a2289b4fc8",
    features: ["Safety Pro ativo 24h", "Proteção em tempo real", "Suporte VIP", "Economia de R$367/ano"],
  },
  {
    id: "vitalicio",
    label: "Vitalício",
    price: 397,
    per: " único",
    highlight: false,
    badge: "MELHOR VALOR",
    checkoutUrl: "https://pay.kirvano.com/c15f93e0-982e-47cd-ade1-b24791b79fab",
    features: ["Safety Pro ativo para sempre", "Proteção em tempo real", "Suporte VIP vitalício", "Nunca paga de novo"],
  },
];

// ── Expert video (vturb) ──
const ExpertVideo = () => {
  useEffect(() => {
    // Inject script first (only once)
    if (!document.getElementById("vturb-script-safety")) {
      const s = document.createElement("script");
      s.id = "vturb-script-safety";
      s.src = "https://scripts.converteai.net/09ec79a4-c31f-44ce-ba7d-89003424c826/players/690e73433ad3bcc011d96455/v4/player.js";
      s.async = true;
      document.head.appendChild(s);
    }
  }, []);

  return (
    <div className="w-full" style={{ maxWidth: 400, margin: "0 auto" }}>
      {/* @ts-ignore custom web component */}
      <vturb-smartplayer
        id="vid-690e73433ad3bcc011d96455"
        style={{ display: "block", margin: "0 auto", width: "100%", maxWidth: "400px" }}
      />
    </div>
  );
};

// ── Main ──
const UpsellSafetyPro = ({ name, onNext, onDecline }: Props) => {
  const firstName = name !== "Visitante" ? name : "";
  const [selectedPlan, setSelectedPlan] = useState("anual");
  const [loading, setLoading] = useState(false);
  const protectedOps = useLiveCounter(12847);

  const activePlan = plans.find(p => p.id === selectedPlan)!;

  const handleBuy = async () => {
    setLoading(true);
    saveFunnelEvent("upsell_buy_click", { page_id: "/upsell5", product: `safety_pro_${activePlan.id}`, price: activePlan.price });
    logAuditEvent({ eventType: "upsell_oneclick_buy", pageId: "/upsell5", metadata: { product: `safety_pro_${activePlan.id}`, price: activePlan.price } });
    const qs = buildTrackingQueryString();
    const base = activePlan.checkoutUrl;
    const url = base.includes("?") ? `${base}&${qs}` : `${base}?${qs}`;
    setTimeout(() => { window.location.href = url; }, 400);
  };

  return (
    <div className="flex flex-col gap-7 pt-4">

      {/* ── HERO ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col gap-5"
      >
        {/* Urgência no topo */}
        <div
          className="flex items-center justify-center gap-2 rounded-xl px-4 py-2"
          style={{ background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.25)" }}
        >
          <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#FCA5A5" }}>
            ⚠️ Atenção — leia antes de fechar essa página
          </span>
        </div>

        {/* Headline principal */}
        <div className="flex flex-col gap-3 text-center">
          <p className="text-[13px] font-bold uppercase tracking-widest" style={{ color: "#FACC15" }}>
            O robô já está operando para você.
          </p>
          <h1 className="text-[26px] sm:text-[30px] font-extrabold leading-tight" style={{ color: "#F8FAFC" }}>
            Mas e quando o mercado virar contra você —{" "}
            <span style={{ color: "#F87171" }}>quem vai proteger</span>{" "}
            o que você acabou de construir?
          </h1>
          <p className="text-[16px] leading-relaxed" style={{ color: "#CBD5E1" }}>
            Sem proteção, <strong style={{ color: "#FBBF24" }}>uma única operação ruim</strong> pode apagar dias inteiros de lucro.{" "}
            Isso acontece com quem não tem o escudo certo — e acontece sem avisar.
          </p>
        </div>

        {/* Bloco dor vs solução */}
        <div className="flex flex-col gap-3">
          {/* Sem proteção */}
          <div
            className="rounded-2xl p-4 flex flex-col gap-3"
            style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.18)" }}
          >
            <p className="text-[13px] font-bold" style={{ color: "#FCA5A5" }}>Sem proteção, é assim que acontece:</p>
            {[
              { icon: "✅", text: "Segunda: +R$ 87 — ótimo dia.", dim: false },
              { icon: "✅", text: "Terça: +R$ 63 — tudo certo.", dim: false },
              { icon: "📉", text: "Quarta: mercado vira. −R$ 210 em 4 minutos.", dim: false },
              { icon: "😶", text: "O lucro de 3 dias: apagado em uma tarde.", dim: true },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-[14px] shrink-0">{item.icon}</span>
                <p className="text-[14px] leading-snug" style={{ color: item.dim ? "#F87171" : "#E2E8F0", fontWeight: item.dim ? 700 : 400 }}>
                  {item.text}
                </p>
              </div>
            ))}
          </div>

          {/* Com Safety Pro */}
          <div
            className="rounded-2xl p-4 flex flex-col gap-3"
            style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.20)" }}
          >
            <p className="text-[13px] font-bold" style={{ color: "#86EFAC" }}>Com o Safety Pro ativado, a mesma semana:</p>
            {[
              { icon: "✅", text: "Segunda: +R$ 87 — lucro real.", highlight: false },
              { icon: "✅", text: "Terça: +R$ 63 — lucro real.", highlight: false },
              { icon: "🛡️", text: "Quarta: Safety Pro detecta o risco e bloqueia.", highlight: true },
              { icon: "💰", text: "Lucros intactos. Capital protegido. Você nem soube.", highlight: true },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-[14px] shrink-0">{item.icon}</span>
                <p className="text-[14px] leading-snug" style={{ color: item.highlight ? "#86EFAC" : "#E2E8F0", fontWeight: item.highlight ? 700 : 400 }}>
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Contador de operações protegidas */}
        <div className="flex flex-col items-center gap-1 py-2">
          <div className="flex items-baseline gap-2">
            <span className="text-[40px] font-extrabold tabular-nums" style={{ color: "#22C55E" }}>
              {protectedOps.toLocaleString("pt-BR")}
            </span>
          </div>
          <span className="text-[14px] font-medium" style={{ color: "#94A3B8" }}>
            operações protegidas hoje pelo Safety Pro
          </span>
        </div>
      </motion.div>

      {/* ── VIDEO DO EXPERT ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="flex flex-col gap-3"
      >
        <div className="text-center px-1">
          <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "#FACC15" }}>
            O criador do sistema explica
          </p>
          <h2 className="text-[20px] font-extrabold leading-snug" style={{ color: "#F8FAFC" }}>
            Como o Safety Pro{" "}
            <span style={{ color: "#22C55E" }}>protege seu dinheiro</span>{" "}
            enquanto o robô lucra para você — sem que você precise fazer nada
          </h2>
        </div>
        <ExpertVideo />
      </motion.div>

      {/* ── HOW IT WORKS ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl overflow-hidden"
        style={{ border: "1px solid rgba(250,204,21,0.2)" }}
      >
        <div
          className="px-4 py-3"
          style={{ background: "rgba(250,204,21,0.08)" }}
        >
          <p className="text-[13px] font-bold uppercase tracking-wide text-center" style={{ color: "#FACC15" }}>
            Como o Safety Pro funciona
          </p>
        </div>
        <div className="flex flex-col divide-y divide-white/5">
          {[
            {
              num: "1",
              title: "Monitora o mercado 24 horas",
              desc: "O sistema analisa cada operação antes de executar, verificando padrões de risco em tempo real.",
              icon: BarChart3,
            },
            {
              num: "2",
              title: "Detecta o perigo antes de acontecer",
              desc: "Quando identifica condição adversa, intercepta a operação em milissegundos.",
              icon: AlertTriangle,
            },
            {
              num: "3",
              title: "Desvia para conta demo automaticamente",
              desc: "A operação perigosa vai para a conta demo. Seu dinheiro real fica 100% protegido.",
              icon: ShieldCheck,
            },
            {
              num: "4",
              title: "Você nem percebe — e seu saldo cresce",
              desc: "O robô continua operando normalmente. Você só vê os lucros entrando.",
              icon: TrendingUp,
            },
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3 px-4 py-4" style={{ background: "hsl(260,28%,10%)" }}>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[13px] font-bold"
                style={{ background: "rgba(250,204,21,0.15)", color: "#FACC15" }}
              >
                {step.num}
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-[14px] font-bold" style={{ color: "#F8FAFC" }}>{step.title}</p>
                <p className="text-[13px] leading-relaxed" style={{ color: "#94A3B8" }}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── SIMULADOR AO VIVO ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <div className="text-center mb-3">
          <p className="text-[13px] font-bold uppercase tracking-wide mb-1" style={{ color: "#94A3B8" }}>
            Veja funcionando ao vivo
          </p>
          <p className="text-[16px] font-extrabold" style={{ color: "#F8FAFC" }}>
            Simulador em tempo real — observe o Safety Pro em ação
          </p>
        </div>
        <TradeSimulator />
      </motion.div>

      {/* ── O QUE VOCÊ PERDE SEM ISSO ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22 }}
        className="rounded-2xl p-5"
        style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.22)" }}
      >
        <p className="text-[15px] font-extrabold mb-4 text-center" style={{ color: "#FCA5A5" }}>
          O que acontece sem o Safety Pro:
        </p>
        <div className="flex flex-col gap-3">
          {[
            "Uma operação ruim pode apagar semanas de lucro em minutos",
            "Você fica refém do humor do mercado — sem controle nenhum",
            "O robô opera, mas sem escudo, qualquer turbu­lência chega até você",
            "Quem tem Safety Pro protege o que construiu. Quem não tem... reza",
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="text-[16px] shrink-0">❌</span>
              <p className="text-[14px] leading-snug" style={{ color: "#E2E8F0" }}>{item}</p>
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
            name: "Antônio S., 54 anos",
            city: "Campo Grande, MS",
            text: "Estava com medo de perder o que ganhei. Desde que ativei o Safety Pro, nunca mais tive aquela angústia. O robô opera, o escudo protege e eu durmo tranquilo.",
          },
          {
            avatar: avatarMaria,
            name: "Maria T., 61 anos",
            city: "Fortaleza, CE",
            text: "Numa semana de mercado ruim, todo mundo perdeu. Eu não perdi nada. Meu saldo continuou crescendo. Isso não tem preço.",
          },
        ].map((t, i) => (
          <div
            key={i}
            className="rounded-2xl p-4 flex flex-col gap-3"
            style={{ background: "hsl(260,25%,12%)", border: "1px solid hsl(270,30%,20%)" }}
          >
            <div className="flex items-center gap-3">
              <img src={t.avatar} alt={t.name} className="w-12 h-12 rounded-full object-cover shrink-0" style={{ border: "2px solid rgba(250,204,21,0.3)" }} />
              <div>
                <p className="text-[14px] font-bold" style={{ color: "#F8FAFC" }}>{t.name}</p>
                <p className="text-[12px]" style={{ color: "#64748B" }}>{t.city} · Aluno verificado ✓</p>
              </div>
            </div>
            <p className="text-[14px] leading-relaxed italic" style={{ color: "#CBD5E1" }}>"{t.text}"</p>
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
          style={{ background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.2)" }}
        >
          <Zap className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#22C55E" }} />
          <p className="text-[14px] leading-relaxed" style={{ color: "#CBD5E1" }}>
            <strong style={{ color: "#F8FAFC" }}>{firstName}</strong>, o robô já está trabalhando por você.{" "}
            Com o Safety Pro, o sistema completo entra em modo de máxima proteção —{" "}
            <strong style={{ color: "#F8FAFC" }}>e as perdas simplesmente não chegam ao seu saldo real</strong>.
          </p>
        </motion.div>
      )}

      {/* ── PLANOS ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <p className="text-[14px] text-center font-semibold mb-4" style={{ color: "#CBD5E1" }}>
          Escolha como ativar seu escudo:
        </p>

        {/* Plan tabs */}
        <div className="flex gap-2 mb-4">
          {plans.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedPlan(p.id)}
              className="flex-1 rounded-xl py-2.5 text-[13px] font-bold transition-all relative"
              style={
                selectedPlan === p.id
                  ? { background: "rgba(250,204,21,0.18)", border: "2px solid rgba(250,204,21,0.6)", color: "#FACC15" }
                  : { background: "hsl(260,25%,12%)", border: "2px solid hsl(270,30%,20%)", color: "#94A3B8" }
              }
            >
              {p.badge && (
                <span
                  className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[9px] font-bold rounded-full px-2 py-0.5 whitespace-nowrap"
                  style={{ background: "#FACC15", color: "#0F172A" }}
                >
                  {p.badge}
                </span>
              )}
              {p.label}
            </button>
          ))}
        </div>

        {/* Plan card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedPlan}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl p-5 flex flex-col gap-4"
            style={{
              background: activePlan.highlight ? "rgba(250,204,21,0.06)" : "hsl(260,25%,12%)",
              border: activePlan.highlight ? "2px solid rgba(250,204,21,0.35)" : "1px solid hsl(270,30%,20%)",
            }}
          >
            <div className="flex items-baseline gap-1 justify-center">
              <span className="text-[15px] font-semibold" style={{ color: "#94A3B8" }}>R$</span>
              <span className="text-[48px] font-extrabold leading-none" style={{ color: "#F8FAFC" }}>
                {activePlan.price}
              </span>
              <span className="text-[14px] font-medium" style={{ color: "#94A3B8" }}>{activePlan.per}</span>
            </div>

            <div className="flex flex-col gap-2">
              {activePlan.features.map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" style={{ color: "#22C55E" }} />
                  <span className="text-[13px]" style={{ color: "#CBD5E1" }}>{f}</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleBuy}
              disabled={loading}
              className="w-full rounded-2xl py-[18px] text-[16px] font-extrabold transition-all flex items-center justify-center gap-2"
              style={{
                background: loading ? "rgba(250,204,21,0.3)" : "linear-gradient(135deg, #FACC15, #F59E0B)",
                color: "#0F172A",
                boxShadow: loading ? "none" : "0 8px 24px rgba(250,204,21,0.35)",
              }}
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Processando...</>
              ) : (
                <><ShieldCheck className="w-5 h-5" /> ATIVAR SAFETY PRO AGORA <ArrowRight className="w-4 h-4" /></>
              )}
            </button>

            <div className="flex items-center justify-center gap-4">
              {([
                [Lock, "100% seguro"],
                [ShieldCheck, "Garantia 30 dias"],
                [RefreshCw, "Ativação imediata"],
              ] as const).map(([Icon, label]) => (
                <div key={label} className="flex items-center gap-1">
                  <Icon className="w-3.5 h-3.5" style={{ color: "#64748B" }} />
                  <span className="text-[11px]" style={{ color: "#64748B" }}>{label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* ── SKIP ── */}
      <div className="text-center pb-4">
        <button
          onClick={onDecline}
          className="text-[12px] underline underline-offset-2"
          style={{ color: "#475569" }}
        >
          Não, prefiro operar sem proteção e assumir o risco
        </button>
      </div>

    </div>
  );
};

export default UpsellSafetyPro;
