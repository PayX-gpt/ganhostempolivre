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
import { usePandaPreload } from "@/lib/usePandaPreload";
import { useLanguage, type Language } from "@/lib/i18n";
import avatarAntonio from "@/assets/avatar-antonio.jpg";
import avatarMaria from "@/assets/avatar-maria.jpg";

interface Props { name: string; onNext: () => void; onDecline: () => void; }

// Símbolo de moeda p/ os valores do simulador (demo — troca só o símbolo).
const SYM: Record<Language, string> = { pt: "R$", en: "$", es: "$" };

// Strings do simulador por idioma.
const SIM = {
  pt: { active: "Safety Pro · Ativo", live: "AO VIVO", blocked: (a: string) => `🛡️ Safety Pro bloqueou — ${a} de perda evitados!`,
    balance: "Saldo", sessionProfit: "Lucro sessão", savedToday: "Salvo hoje", statusLabel: "Status Safety Pro:",
    risk: "RISCO — BLOQUEANDO", demo: "DEMO · protegido", real: "REAL · operando",
    waiting: "Aguardando primeira operação...", saved: "Salvo", monitoring: "Monitorando próxima janela...", analyzing: "Analisando risco do mercado...",
    legendBold: "🟡 Amarelo = operação protegida.", legend: " Quando o Safety Pro detecta risco, a operação vai para a conta demo — e o seu dinheiro real fica intacto." },
  en: { active: "Safety Pro · Active", live: "LIVE", blocked: (a: string) => `🛡️ Safety Pro blocked — ${a} in losses avoided!`,
    balance: "Balance", sessionProfit: "Session profit", savedToday: "Saved today", statusLabel: "Safety Pro status:",
    risk: "RISK — BLOCKING", demo: "DEMO · protected", real: "REAL · trading",
    waiting: "Waiting for first trade...", saved: "Saved", monitoring: "Monitoring next window...", analyzing: "Analyzing market risk...",
    legendBold: "🟡 Yellow = protected trade.", legend: " When Safety Pro detects risk, the trade goes to the demo account — and your real money stays untouched." },
  es: { active: "Safety Pro · Activo", live: "EN VIVO", blocked: (a: string) => `🛡️ Safety Pro bloqueó — ${a} de pérdida evitados!`,
    balance: "Saldo", sessionProfit: "Ganancia sesión", savedToday: "Ahorrado hoy", statusLabel: "Estado Safety Pro:",
    risk: "RIESGO — BLOQUEANDO", demo: "DEMO · protegido", real: "REAL · operando",
    waiting: "Esperando la primera operación...", saved: "Ahorrado", monitoring: "Monitoreando próxima ventana...", analyzing: "Analizando riesgo del mercado...",
    legendBold: "🟡 Amarillo = operación protegida.", legend: " Cuando Safety Pro detecta riesgo, la operación va a la cuenta demo — y tu dinero real queda intacto." },
};

const TEXTS = {
  pt: {
    urgency: "⚠️ Atenção — leia antes de fechar essa página",
    kicker: "O robô já está operando para você.",
    h1a: "Mas e quando o mercado virar contra você — ", h1red: "quem vai proteger", h1b: " o que você acabou de construir?",
    subA: "Sem proteção, ", subBold: "uma única operação ruim", subB: " pode apagar dias inteiros de lucro. Isso acontece com quem não tem o escudo certo — e acontece sem avisar.",
    withoutTitle: "Sem proteção, é assim que acontece:",
    without: [
      { icon: "✅", text: "Segunda: +R$ 87 — ótimo dia.", dim: false },
      { icon: "✅", text: "Terça: +R$ 63 — tudo certo.", dim: false },
      { icon: "📉", text: "Quarta: mercado vira. −R$ 210 em 4 minutos.", dim: false },
      { icon: "😶", text: "O lucro de 3 dias: apagado em uma tarde.", dim: true },
    ],
    withTitle: "Com o Safety Pro ativado, a mesma semana:",
    with: [
      { icon: "✅", text: "Segunda: +R$ 87 — lucro real.", hl: false },
      { icon: "✅", text: "Terça: +R$ 63 — lucro real.", hl: false },
      { icon: "🛡️", text: "Quarta: Safety Pro detecta o risco e bloqueia.", hl: true },
      { icon: "💰", text: "Lucros intactos. Capital protegido. Você nem soube.", hl: true },
    ],
    counter: "operações protegidas hoje pelo Safety Pro",
    expertKicker: "O criador do sistema explica",
    expertH2a: "Como o Safety Pro ", expertH2green: "protege seu dinheiro", expertH2b: " enquanto o robô lucra para você — sem que você precise fazer nada",
    howTitle: "Como o Safety Pro funciona",
    how: [
      { num: "1", title: "Monitora o mercado 24 horas", desc: "O sistema analisa cada operação antes de executar, verificando padrões de risco em tempo real." },
      { num: "2", title: "Detecta o perigo antes de acontecer", desc: "Quando identifica condição adversa, intercepta a operação em milissegundos." },
      { num: "3", title: "Desvia para conta demo automaticamente", desc: "A operação perigosa vai para a conta demo. Seu dinheiro real fica 100% protegido." },
      { num: "4", title: "Você nem percebe — e seu saldo cresce", desc: "O robô continua operando normalmente. Você só vê os lucros entrando." },
    ],
    simKicker: "Veja funcionando ao vivo", simTitle: "Simulador em tempo real — observe o Safety Pro em ação",
    loseTitle: "O que acontece sem o Safety Pro:",
    lose: [
      "Uma operação ruim pode apagar semanas de lucro em minutos",
      "Você fica refém do humor do mercado — sem controle nenhum",
      "O robô opera, mas sem escudo, qualquer turbulência chega até você",
      "Quem tem Safety Pro protege o que construiu. Quem não tem... reza",
    ],
    proof: [
      { name: "Antônio S., 54 anos", city: "Campo Grande, MS", verified: "Aluno verificado ✓", text: "Estava com medo de perder o que ganhei. Desde que ativei o Safety Pro, nunca mais tive aquela angústia. O robô opera, o escudo protege e eu durmo tranquilo." },
      { name: "Maria T., 61 anos", city: "Fortaleza, CE", verified: "Aluno verificado ✓", text: "Numa semana de mercado ruim, todo mundo perdeu. Eu não perdi nada. Meu saldo continuou crescendo. Isso não tem preço." },
    ],
    synA: ", o robô já está trabalhando por você. Com o Safety Pro, o sistema completo entra em modo de máxima proteção — ", synBold: "e as perdas simplesmente não chegam ao seu saldo real", synC: ".",
    plansTitle: "Escolha como ativar seu escudo:",
    processing: "Processando...", cta: "ATIVAR SAFETY PRO AGORA",
    trust: ["100% seguro", "Garantia 30 dias", "Ativação imediata"],
    decline: "Não, prefiro operar sem proteção e assumir o risco",
    priceSymbol: "R$",
    plans: {
      mensal: { label: "Mensal", amount: "97", per: "/mês", badge: null, features: ["Safety Pro ativo 24h", "Proteção em tempo real", "Suporte prioritário"] },
      anual: { label: "Anual", amount: "197", per: "/ano", badge: "MAIS POPULAR", features: ["Safety Pro ativo 24h", "Proteção em tempo real", "Suporte VIP", "Economia de R$367/ano"] },
      vitalicio: { label: "Vitalício", amount: "397", per: " único", badge: "MELHOR VALOR", features: ["Safety Pro ativo para sempre", "Proteção em tempo real", "Suporte VIP vitalício", "Nunca paga de novo"] },
    },
  },
  en: {
    urgency: "⚠️ Wait — read this before closing this page",
    kicker: "The bot is already trading for you.",
    h1a: "But when the market turns against you — ", h1red: "who protects", h1b: " what you just built?",
    subA: "Without protection, ", subBold: "a single bad trade", subB: " can wipe out entire days of profit. It happens to people without the right shield — and it happens with no warning.",
    withoutTitle: "Without protection, here's how it goes:",
    without: [
      { icon: "✅", text: "Monday: +$87 — great day.", dim: false },
      { icon: "✅", text: "Tuesday: +$63 — all good.", dim: false },
      { icon: "📉", text: "Wednesday: the market turns. −$210 in 4 minutes.", dim: false },
      { icon: "😶", text: "3 days of profit: gone in one afternoon.", dim: true },
    ],
    withTitle: "With Safety Pro on, the same week:",
    with: [
      { icon: "✅", text: "Monday: +$87 — real profit.", hl: false },
      { icon: "✅", text: "Tuesday: +$63 — real profit.", hl: false },
      { icon: "🛡️", text: "Wednesday: Safety Pro detects the risk and blocks it.", hl: true },
      { icon: "💰", text: "Profits intact. Capital protected. You never even knew.", hl: true },
    ],
    counter: "trades protected today by Safety Pro",
    expertKicker: "The system's creator explains",
    expertH2a: "How Safety Pro ", expertH2green: "protects your money", expertH2b: " while the bot profits for you — without you having to do a thing",
    howTitle: "How Safety Pro works",
    how: [
      { num: "1", title: "Monitors the market 24 hours", desc: "The system analyzes every trade before executing, checking risk patterns in real time." },
      { num: "2", title: "Spots danger before it happens", desc: "When it identifies adverse conditions, it intercepts the trade in milliseconds." },
      { num: "3", title: "Diverts to a demo account automatically", desc: "The dangerous trade goes to the demo account. Your real money stays 100% protected." },
      { num: "4", title: "You don't even notice — and your balance grows", desc: "The bot keeps trading normally. You just see the profits coming in." },
    ],
    simKicker: "See it working live", simTitle: "Real-time simulator — watch Safety Pro in action",
    loseTitle: "What happens without Safety Pro:",
    lose: [
      "One bad trade can wipe out weeks of profit in minutes",
      "You're at the mercy of the market's mood — with no control",
      "The bot trades, but with no shield, any turbulence reaches you",
      "People with Safety Pro protect what they built. Those without... pray",
    ],
    proof: [
      { name: "Antônio S., 54", city: "Campo Grande, BR", verified: "Verified member ✓", text: "I was scared of losing what I'd earned. Since I turned on Safety Pro, that anxiety is gone. The bot trades, the shield protects, and I sleep easy." },
      { name: "Maria T., 61", city: "Fortaleza, BR", verified: "Verified member ✓", text: "In a bad market week, everyone lost. I lost nothing. My balance kept growing. That's priceless." },
    ],
    synA: ", the bot is already working for you. With Safety Pro, the whole system goes into maximum-protection mode — ", synBold: "and losses simply never reach your real balance", synC: ".",
    plansTitle: "Choose how to activate your shield:",
    processing: "Processing...", cta: "ACTIVATE SAFETY PRO NOW",
    trust: ["100% secure", "30-day guarantee", "Instant activation"],
    decline: "No, I'd rather trade without protection and take the risk",
    priceSymbol: "$",
    plans: {
      mensal: { label: "Monthly", amount: "19", per: "/mo", badge: null, features: ["Safety Pro active 24/7", "Real-time protection", "Priority support"] },
      anual: { label: "Yearly", amount: "39", per: "/yr", badge: "MOST POPULAR", features: ["Safety Pro active 24/7", "Real-time protection", "VIP support", "Save $73/year"] },
      vitalicio: { label: "Lifetime", amount: "79", per: " once", badge: "BEST VALUE", features: ["Safety Pro active forever", "Real-time protection", "Lifetime VIP support", "Never pay again"] },
    },
  },
  es: {
    urgency: "⚠️ Atención — lee antes de cerrar esta página",
    kicker: "El robot ya está operando para ti.",
    h1a: "Pero cuando el mercado se vuelva en tu contra — ", h1red: "¿quién va a proteger", h1b: " lo que acabas de construir?",
    subA: "Sin protección, ", subBold: "una sola operación mala", subB: " puede borrar días enteros de ganancia. Le pasa a quien no tiene el escudo correcto — y pasa sin avisar.",
    withoutTitle: "Sin protección, así es como pasa:",
    without: [
      { icon: "✅", text: "Lunes: +$87 — gran día.", dim: false },
      { icon: "✅", text: "Martes: +$63 — todo bien.", dim: false },
      { icon: "📉", text: "Miércoles: el mercado se vuelve. −$210 en 4 minutos.", dim: false },
      { icon: "😶", text: "La ganancia de 3 días: borrada en una tarde.", dim: true },
    ],
    withTitle: "Con Safety Pro activado, la misma semana:",
    with: [
      { icon: "✅", text: "Lunes: +$87 — ganancia real.", hl: false },
      { icon: "✅", text: "Martes: +$63 — ganancia real.", hl: false },
      { icon: "🛡️", text: "Miércoles: Safety Pro detecta el riesgo y lo bloquea.", hl: true },
      { icon: "💰", text: "Ganancias intactas. Capital protegido. Ni te enteraste.", hl: true },
    ],
    counter: "operaciones protegidas hoy por Safety Pro",
    expertKicker: "El creador del sistema lo explica",
    expertH2a: "Cómo Safety Pro ", expertH2green: "protege tu dinero", expertH2b: " mientras el robot gana para ti — sin que tengas que hacer nada",
    howTitle: "Cómo funciona Safety Pro",
    how: [
      { num: "1", title: "Monitorea el mercado 24 horas", desc: "El sistema analiza cada operación antes de ejecutar, verificando patrones de riesgo en tiempo real." },
      { num: "2", title: "Detecta el peligro antes de que pase", desc: "Cuando identifica una condición adversa, intercepta la operación en milisegundos." },
      { num: "3", title: "Desvía a cuenta demo automáticamente", desc: "La operación peligrosa va a la cuenta demo. Tu dinero real queda 100% protegido." },
      { num: "4", title: "Ni te das cuenta — y tu saldo crece", desc: "El robot sigue operando normalmente. Tú solo ves las ganancias entrando." },
    ],
    simKicker: "Míralo funcionando en vivo", simTitle: "Simulador en tiempo real — observa a Safety Pro en acción",
    loseTitle: "Lo que pasa sin Safety Pro:",
    lose: [
      "Una operación mala puede borrar semanas de ganancia en minutos",
      "Quedas a merced del humor del mercado — sin ningún control",
      "El robot opera, pero sin escudo, cualquier turbulencia llega hasta ti",
      "Quien tiene Safety Pro protege lo que construyó. Quien no... reza",
    ],
    proof: [
      { name: "Antônio S., 54 años", city: "Campo Grande, BR", verified: "Miembro verificado ✓", text: "Tenía miedo de perder lo que gané. Desde que activé Safety Pro, esa angustia desapareció. El robot opera, el escudo protege y yo duermo tranquilo." },
      { name: "Maria T., 61 años", city: "Fortaleza, BR", verified: "Miembro verificado ✓", text: "En una semana de mercado malo, todos perdieron. Yo no perdí nada. Mi saldo siguió creciendo. Eso no tiene precio." },
    ],
    synA: ", el robot ya está trabajando por ti. Con Safety Pro, el sistema completo entra en modo de máxima protección — ", synBold: "y las pérdidas simplemente no llegan a tu saldo real", synC: ".",
    plansTitle: "Elige cómo activar tu escudo:",
    processing: "Procesando...", cta: "ACTIVAR SAFETY PRO AHORA",
    trust: ["100% seguro", "Garantía 30 días", "Activación inmediata"],
    decline: "No, prefiero operar sin protección y asumir el riesgo",
    priceSymbol: "$",
    plans: {
      mensal: { label: "Mensual", amount: "19", per: "/mes", badge: null, features: ["Safety Pro activo 24h", "Protección en tiempo real", "Soporte prioritario"] },
      anual: { label: "Anual", amount: "39", per: "/año", badge: "MÁS POPULAR", features: ["Safety Pro activo 24h", "Protección en tiempo real", "Soporte VIP", "Ahorro de $73/año"] },
      vitalicio: { label: "Vitalicio", amount: "79", per: " único", badge: "MEJOR VALOR", features: ["Safety Pro activo para siempre", "Protección en tiempo real", "Soporte VIP vitalicio", "Nunca pagas de nuevo"] },
    },
  },
};

const useLiveCounter = (start: number) => {
  const [count, setCount] = useState(start);
  useEffect(() => {
    const t = setInterval(() => setCount(c => c + Math.floor(Math.random() * 3 + 1)), 5000);
    return () => clearInterval(t);
  }, []);
  return count;
};

const plat = { border: "border-[hsl(270,30%,22%)]" };
const pares = ["EUR/USD", "GBP/USD", "USD/JPY", "BTC/USD", "XAU/USD", "AUD/USD"];
const precos = ["1.08432", "1.26781", "149.320", "67,241.00", "2,341.80", "0.65123"];

const AnalyzingBar = ({ onDone, paused, st }: { onDone: () => void; paused?: boolean; st: typeof SIM.pt }) => {
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
        <span className="text-[12px] font-semibold text-[hsl(280,70%,70%)]">{paused ? st.monitoring : st.analyzing}</span>
      </div>
      <div className="w-full h-2 bg-[hsl(260,22%,15%)] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-75 bg-gradient-to-r from-[hsl(280,70%,55%)] to-[hsl(260,70%,60%)]" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
};

type SimOp = { hora: string; par: string; preco: string; lucro: number; tipo: "win"; conta: "real" | "demo"; savedAmount?: number; };

const nextConta = (history: SimOp[]): "real" | "demo" => {
  const last2 = history.slice(-2);
  const allReal = last2.length === 2 && last2.every(o => o.conta === "real");
  if (allReal) return "demo";
  return Math.random() < 0.42 ? "demo" : "real";
};

const TradeSimulator = ({ st, sym }: { st: typeof SIM.pt; sym: string }) => {
  const [history, setHistory] = useState<SimOp[]>([]);
  const [balance, setBalance] = useState(1_247.38);
  const [sessionProfit, setSessionProfit] = useState(0);
  const [totalSaved, setTotalSaved] = useState(0);
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
      setSafetyStatus("risk");
      setTimeout(() => {
        setSafetyStatus("demo");
        const savedAmount = parseFloat((12 + Math.random() * 48).toFixed(2));
        const parIdx = Math.floor(Math.random() * pares.length);
        const now = new Date();
        const op: SimOp = { hora: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`, par: pares[parIdx], preco: precos[parIdx], lucro: savedAmount, tipo: "win", conta: "demo", savedAmount };
        setHistory(h => [op, ...h].slice(0, 12));
        historySnapshot.current = [op, ...historySnapshot.current].slice(0, 12);
        setTotalSaved(t => parseFloat((t + savedAmount).toFixed(2)));
        setAlertAmount(savedAmount);
        setAlertVisible(true);
        setTimeout(() => setAlertVisible(false), 3000);
        setTimeout(() => { setSafetyStatus("real"); setIsAnalyzing(true); opRef.current = setTimeout(runOp, 6000 + Math.random() * 4000); }, 2200);
      }, 800);
    } else {
      const profit = parseFloat((8 + Math.random() * 42).toFixed(2));
      const parIdx = Math.floor(Math.random() * pares.length);
      const now = new Date();
      const op: SimOp = { hora: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`, par: pares[parIdx], preco: precos[parIdx], lucro: profit, tipo: "win", conta: "real" };
      setHistory(h => [op, ...h].slice(0, 12));
      historySnapshot.current = [op, ...historySnapshot.current].slice(0, 12);
      setBalance(b => parseFloat((b + profit).toFixed(2)));
      setSessionProfit(p => parseFloat((p + profit).toFixed(2)));
      setSafetyStatus("real");
      setIsAnalyzing(true);
      opRef.current = setTimeout(runOp, 6000 + Math.random() * 4000);
    }
  }, []);

  const handleAnalysisDone = useCallback(() => { setIsAnalyzing(false); opRef.current = setTimeout(runOp, 400); }, [runOp]);
  useEffect(() => () => { if (opRef.current) clearTimeout(opRef.current); }, []);

  return (
    <div className={`rounded-2xl overflow-hidden ${plat.border} border`} style={{ background: "hsl(260,30%,8%)" }}>
      <div className="px-3 py-2.5 flex items-center justify-between" style={{ background: "hsl(260,25%,11%)", borderBottom: "1px solid hsl(270,30%,20%)" }}>
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-[hsl(280,70%,70%)]" />
          <span className="text-[13px] font-bold text-[hsl(280,70%,80%)]">{st.active}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[11px] text-[hsl(280,40%,70%)]">{st.live}</span>
        </div>
      </div>

      <div className="relative h-0 overflow-visible z-10">
        <AnimatePresence>
          {alertVisible && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}
              className="absolute left-3 right-3 top-2 rounded-xl px-3 py-2 flex items-center gap-2" style={{ background: "rgba(250,204,21,0.92)", backdropFilter: "blur(4px)", boxShadow: "0 4px 16px rgba(0,0,0,0.3)" }}>
              <ShieldCheck className="w-4 h-4 shrink-0" style={{ color: "#0F172A" }} />
              <p className="text-[12px] font-bold" style={{ color: "#0F172A" }}>{st.blocked(`${sym}${alertAmount.toFixed(2)}`)}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-3 gap-0" style={{ borderBottom: "1px solid hsl(270,30%,18%)" }}>
        {[
          { label: st.balance, value: `${sym}${balance.toFixed(2)}`, color: "#22C55E" },
          { label: st.sessionProfit, value: `+${sym}${sessionProfit.toFixed(2)}`, color: "#22C55E" },
          { label: st.savedToday, value: `${sym}${totalSaved.toFixed(2)}`, color: "#FACC15" },
        ].map((s, i) => (
          <div key={i} className="flex flex-col items-center py-2.5" style={{ borderRight: i < 2 ? "1px solid hsl(270,30%,18%)" : "none" }}>
            <span className="text-[10px] text-[hsl(280,30%,60%)] mb-0.5">{s.label}</span>
            <span className="text-[13px] font-bold tabular-nums" style={{ color: s.color, minWidth: "80px", textAlign: "center" }}>{s.value}</span>
          </div>
        ))}
      </div>

      <div className="px-3 py-2 flex items-center justify-between" style={{ background: "hsl(260,28%,10%)", borderBottom: "1px solid hsl(270,30%,18%)" }}>
        <span className="text-[11px] text-[hsl(280,30%,60%)]">{st.statusLabel}</span>
        <AnimatePresence mode="wait">
          <motion.div key={safetyStatus} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }} transition={{ duration: 0.15 }}
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold"
            style={safetyStatus === "risk" ? { background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.5)", color: "#FCA5A5" } : safetyStatus === "demo" ? { background: "rgba(250,204,21,0.15)", border: "1px solid rgba(250,204,21,0.4)", color: "#FEF08A" } : { background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.4)", color: "#86EFAC" }}>
            {safetyStatus === "risk" ? (<><AlertTriangle className="w-3 h-3" /> {st.risk}</>) : safetyStatus === "demo" ? (<><ShieldCheck className="w-3 h-3" /> {st.demo}</>) : (<><CircleDot className="w-3 h-3" /> {st.real}</>)}
          </motion.div>
        </AnimatePresence>
      </div>

      {isAnalyzing && <AnalyzingBar onDone={handleAnalysisDone} paused={safetyStatus === "demo" || safetyStatus === "risk"} st={st} />}

      <div ref={historyRef} className="flex flex-col gap-0 max-h-[220px] overflow-y-auto" style={{ overflowAnchor: "none" }}>
        {history.length === 0 && (<div className="px-3 py-4 text-center"><p className="text-[12px] text-[hsl(280,30%,55%)]">{st.waiting}</p></div>)}
        {history.map((op, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}
            className="flex items-center justify-between px-3 py-2.5" style={{ borderBottom: "1px solid hsl(270,30%,15%)", background: op.conta === "demo" ? "rgba(250,204,21,0.04)" : "transparent" }}>
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[10px] text-[hsl(280,30%,50%)] shrink-0">{op.hora}</span>
              <span className="text-[12px] font-semibold text-[hsl(280,60%,75%)] truncate">{op.par}</span>
              {op.conta === "demo" && (<span className="text-[9px] font-bold rounded px-1 py-0.5 shrink-0" style={{ background: "rgba(250,204,21,0.15)", color: "#FACC15" }}>DEMO</span>)}
            </div>
            <span className="text-[12px] font-bold tabular-nums shrink-0" style={{ color: op.conta === "demo" ? "#FACC15" : "#22C55E" }}>
              {op.conta === "demo" ? `${st.saved} ${sym}${op.lucro.toFixed(2)}` : `+${sym}${op.lucro.toFixed(2)}`}
            </span>
          </motion.div>
        ))}
      </div>

      <div className="px-3 py-2.5 mt-1 mx-3 mb-3 rounded-xl" style={{ background: "rgba(250,204,21,0.06)", border: "1px solid rgba(250,204,21,0.18)" }}>
        <p className="text-[12px] leading-relaxed font-medium" style={{ color: "#E2E8F0" }}>
          <span style={{ color: "#FACC15", fontWeight: 700 }}>{st.legendBold}</span>{st.legend}
        </p>
      </div>
    </div>
  );
};

const BASE_PLANS = [
  { id: "mensal", price: 97, highlight: false, checkoutUrl: "https://pay.hub.la/snr9hpLgYO4mUlD5eQjt/upsell" },
  { id: "anual", price: 197, highlight: true, checkoutUrl: "https://pay.hub.la/n0ycNCoMRg6eVlEHAdEo/upsell" },
  { id: "vitalicio", price: 397, highlight: false, checkoutUrl: "https://pay.hub.la/rswZ4yFYfNwBR869Q7rV/upsell" },
];

const ExpertVideo = () => (
  <div className="w-full" style={{ maxWidth: 400, margin: "0 auto" }}>
    <div style={{ position: "relative", paddingTop: "177.77777777777777%" }}>
      <iframe id="panda-10c7a9a9-2f9e-4bee-8a47-43cb05709fdb"
        src="https://player-vz-350772d9-cdc.tv.pandavideo.com.br/embed/?v=10c7a9a9-2f9e-4bee-8a47-43cb05709fdb"
        style={{ border: "none", position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
        allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture" allowFullScreen />
    </div>
  </div>
);

const UpsellSafetyPro = ({ name, onNext, onDecline }: Props) => {
  const { lang, locale } = useLanguage();
  const t = TEXTS[lang];
  const st = SIM[lang];
  const sym = SYM[lang];
  const firstName = name !== "Visitante" ? name : "";
  const [selectedPlan, setSelectedPlan] = useState("anual");
  const [loading, setLoading] = useState(false);
  const protectedOps = useLiveCounter(12847);

  usePandaPreload("10c7a9a9-2f9e-4bee-8a47-43cb05709fdb");

  const plans = BASE_PLANS.map(b => ({ ...b, ...(t.plans as any)[b.id] }));
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

      {/* HERO */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex flex-col gap-5">
        <div className="flex items-center justify-center gap-2 rounded-xl px-4 py-2" style={{ background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.25)" }}>
          <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#FCA5A5" }}>{t.urgency}</span>
        </div>

        <div className="flex flex-col gap-3 text-center">
          <p className="text-[13px] font-bold uppercase tracking-widest" style={{ color: "#FACC15" }}>{t.kicker}</p>
          <h1 className="text-[26px] sm:text-[30px] font-extrabold leading-tight" style={{ color: "#F8FAFC" }}>
            {t.h1a}<span style={{ color: "#F87171" }}>{t.h1red}</span>{t.h1b}
          </h1>
          <p className="text-[16px] leading-relaxed" style={{ color: "#CBD5E1" }}>
            {t.subA}<strong style={{ color: "#FBBF24" }}>{t.subBold}</strong>{t.subB}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="rounded-2xl p-4 flex flex-col gap-3" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.18)" }}>
            <p className="text-[13px] font-bold" style={{ color: "#FCA5A5" }}>{t.withoutTitle}</p>
            {t.without.map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-[14px] shrink-0">{item.icon}</span>
                <p className="text-[14px] leading-snug" style={{ color: item.dim ? "#F87171" : "#E2E8F0", fontWeight: item.dim ? 700 : 400 }}>{item.text}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl p-4 flex flex-col gap-3" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.20)" }}>
            <p className="text-[13px] font-bold" style={{ color: "#86EFAC" }}>{t.withTitle}</p>
            {t.with.map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-[14px] shrink-0">{item.icon}</span>
                <p className="text-[14px] leading-snug" style={{ color: item.hl ? "#86EFAC" : "#E2E8F0", fontWeight: item.hl ? 700 : 400 }}>{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center gap-1 py-2">
          <div className="flex items-baseline gap-2">
            <span className="text-[40px] font-extrabold tabular-nums" style={{ color: "#22C55E" }}>{protectedOps.toLocaleString(locale)}</span>
          </div>
          <span className="text-[14px] font-medium" style={{ color: "#94A3B8" }}>{t.counter}</span>
        </div>
      </motion.div>

      {/* EXPERT VIDEO */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="flex flex-col gap-3">
        <div className="text-center px-1">
          <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "#FACC15" }}>{t.expertKicker}</p>
          <h2 className="text-[20px] font-extrabold leading-snug" style={{ color: "#F8FAFC" }}>
            {t.expertH2a}<span style={{ color: "#22C55E" }}>{t.expertH2green}</span>{t.expertH2b}
          </h2>
        </div>
        <ExpertVideo />
      </motion.div>

      {/* HOW IT WORKS */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(250,204,21,0.2)" }}>
        <div className="px-4 py-3" style={{ background: "rgba(250,204,21,0.08)" }}>
          <p className="text-[13px] font-bold uppercase tracking-wide text-center" style={{ color: "#FACC15" }}>{t.howTitle}</p>
        </div>
        <div className="flex flex-col divide-y divide-white/5">
          {t.how.map((step, i) => {
            const Icon = [BarChart3, AlertTriangle, ShieldCheck, TrendingUp][i];
            return (
              <div key={i} className="flex items-start gap-3 px-4 py-4" style={{ background: "hsl(260,28%,10%)" }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[13px] font-bold" style={{ background: "rgba(250,204,21,0.15)", color: "#FACC15" }}>{step.num}</div>
                <div className="flex flex-col gap-1">
                  <p className="text-[14px] font-bold" style={{ color: "#F8FAFC" }}>{step.title}</p>
                  <p className="text-[13px] leading-relaxed" style={{ color: "#94A3B8" }}>{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* SIMULATOR */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <div className="text-center mb-3">
          <p className="text-[13px] font-bold uppercase tracking-wide mb-1" style={{ color: "#94A3B8" }}>{t.simKicker}</p>
          <p className="text-[16px] font-extrabold" style={{ color: "#F8FAFC" }}>{t.simTitle}</p>
        </div>
        <TradeSimulator st={st} sym={sym} />
      </motion.div>

      {/* WHAT YOU LOSE */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }} className="rounded-2xl p-5" style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.22)" }}>
        <p className="text-[15px] font-extrabold mb-4 text-center" style={{ color: "#FCA5A5" }}>{t.loseTitle}</p>
        <div className="flex flex-col gap-3">
          {t.lose.map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="text-[16px] shrink-0">❌</span>
              <p className="text-[14px] leading-snug" style={{ color: "#E2E8F0" }}>{item}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* SOCIAL PROOF */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="flex flex-col gap-4">
        {[{ avatar: avatarAntonio, ...t.proof[0] }, { avatar: avatarMaria, ...t.proof[1] }].map((p, i) => (
          <div key={i} className="rounded-2xl p-4 flex flex-col gap-3" style={{ background: "hsl(260,25%,12%)", border: "1px solid hsl(270,30%,20%)" }}>
            <div className="flex items-center gap-3">
              <img src={p.avatar} alt={p.name} className="w-12 h-12 rounded-full object-cover shrink-0" style={{ border: "2px solid rgba(250,204,21,0.3)" }} />
              <div>
                <p className="text-[14px] font-bold" style={{ color: "#F8FAFC" }}>{p.name}</p>
                <p className="text-[12px]" style={{ color: "#64748B" }}>{p.city} · {p.verified}</p>
              </div>
            </div>
            <p className="text-[14px] leading-relaxed italic" style={{ color: "#CBD5E1" }}>"{p.text}"</p>
          </div>
        ))}
      </motion.div>

      {/* SYNERGY */}
      {firstName && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }} className="rounded-xl px-5 py-4 flex items-start gap-3" style={{ background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.2)" }}>
          <Zap className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#22C55E" }} />
          <p className="text-[14px] leading-relaxed" style={{ color: "#CBD5E1" }}>
            <strong style={{ color: "#F8FAFC" }}>{firstName}</strong>{t.synA}<strong style={{ color: "#F8FAFC" }}>{t.synBold}</strong>{t.synC}
          </p>
        </motion.div>
      )}

      {/* PLANS */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <p className="text-[14px] text-center font-semibold mb-4" style={{ color: "#CBD5E1" }}>{t.plansTitle}</p>

        <div className="flex gap-2 mb-4">
          {plans.map(p => (
            <button key={p.id} onClick={() => setSelectedPlan(p.id)} className="flex-1 rounded-xl py-2.5 text-[13px] font-bold transition-all relative"
              style={selectedPlan === p.id ? { background: "rgba(250,204,21,0.18)", border: "2px solid rgba(250,204,21,0.6)", color: "#FACC15" } : { background: "hsl(260,25%,12%)", border: "2px solid hsl(270,30%,20%)", color: "#94A3B8" }}>
              {p.badge && (<span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[9px] font-bold rounded-full px-2 py-0.5 whitespace-nowrap" style={{ background: "#FACC15", color: "#0F172A" }}>{p.badge}</span>)}
              {p.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={selectedPlan} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}
            className="rounded-2xl p-5 flex flex-col gap-4" style={{ background: activePlan.highlight ? "rgba(250,204,21,0.06)" : "hsl(260,25%,12%)", border: activePlan.highlight ? "2px solid rgba(250,204,21,0.35)" : "1px solid hsl(270,30%,20%)" }}>
            <div className="flex items-baseline gap-1 justify-center">
              <span className="text-[15px] font-semibold" style={{ color: "#94A3B8" }}>{t.priceSymbol}</span>
              <span className="text-[48px] font-extrabold leading-none" style={{ color: "#F8FAFC" }}>{activePlan.amount}</span>
              <span className="text-[14px] font-medium" style={{ color: "#94A3B8" }}>{activePlan.per}</span>
            </div>

            <div className="flex flex-col gap-2">
              {activePlan.features.map((f: string, i: number) => (
                <div key={i} className="flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" style={{ color: "#22C55E" }} />
                  <span className="text-[13px]" style={{ color: "#CBD5E1" }}>{f}</span>
                </div>
              ))}
            </div>

            <button onClick={handleBuy} disabled={loading} className="w-full rounded-2xl py-[18px] text-[16px] font-extrabold transition-all flex items-center justify-center gap-2"
              style={{ background: loading ? "rgba(250,204,21,0.3)" : "linear-gradient(135deg, #FACC15, #F59E0B)", color: "#0F172A", boxShadow: loading ? "none" : "0 8px 24px rgba(250,204,21,0.35)" }}>
              {loading ? (<><Loader2 className="w-5 h-5 animate-spin" /> {t.processing}</>) : (<><ShieldCheck className="w-5 h-5" /> {t.cta} <ArrowRight className="w-4 h-4" /></>)}
            </button>

            <div className="flex items-center justify-center gap-4">
              {([[Lock, t.trust[0]], [ShieldCheck, t.trust[1]], [RefreshCw, t.trust[2]]] as const).map(([Icon, label]) => (
                <div key={label} className="flex items-center gap-1">
                  <Icon className="w-3.5 h-3.5" style={{ color: "#64748B" }} />
                  <span className="text-[11px]" style={{ color: "#64748B" }}>{label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* SKIP */}
      <div className="text-center pb-4">
        <button onClick={onDecline} className="text-[12px] underline underline-offset-2" style={{ color: "#475569" }}>{t.decline}</button>
      </div>

    </div>
  );
};

export default UpsellSafetyPro;
