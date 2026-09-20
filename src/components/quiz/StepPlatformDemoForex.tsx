import { useState, useEffect, useRef, useCallback } from "react";
import { StepContainer, StepTitle, StepSubtitle } from "./QuizUI";
import { useLanguage, type Language } from "@/lib/i18n";
import {
  Loader2, Trophy, Sparkles, CheckCircle2,
  Users, Bookmark, Share2, ShieldCheck, TrendingUp, Lock,
} from "lucide-react";

/**
 * QUIZ B — Demo do Guardião (copy trade / Forex) no VISUAL do card de trader:
 * Tela 1 = card de perfil do Guardião. Toca "Investir" → ativa DIRETO (sem tela de
 * meta, baixa fricção) → Tela 2 = painel ao vivo NO MESMO padrão do card (branco,
 * laranja, teal): operações entrando/saindo, saldo subindo, "copiando agora", meta
 * batida. Tudo client-side, sem rede. Quiz A segue com StepPlatformDemo.tsx (intocado).
 */

interface Props { onNext: () => void; userName?: string; }

// Paleta do Guardião (mesma do card).
const C = { orange: "#E8552E", teal: "#12A594", red: "#E5484D" };

const CUR: Record<Language, { sym: string; scale: number; goal: number }> = {
  pt: { sym: "R$", scale: 1, goal: 500 },
  en: { sym: "$", scale: 0.2, goal: 100 },
  es: { sym: "$", scale: 0.2, goal: 100 },
};

const pares = ["XAU/USD","XAG/USD","EUR/USD","GBP/USD","USD/JPY","AUD/USD","USD/CAD","USD/CHF","EUR/GBP","GBP/JPY","NZD/USD","EUR/JPY"];
const precos = ["2,385.40","29.87","1.08432","1.26781","149.320","0.65123","1.36540","0.87654","0.85612","188.410","0.61234","162.240"];
const TICKER = [
  { sym: "XAU/USD", label: { pt: "Ouro", en: "Gold", es: "Oro" }, base: 2385.40, dec: 2 },
  { sym: "XAG/USD", label: { pt: "Prata", en: "Silver", es: "Plata" }, base: 29.87, dec: 2 },
  { sym: "EUR/USD", base: 1.08432, dec: 5 },
  { sym: "GBP/USD", base: 1.26781, dec: 5 },
  { sym: "USD/JPY", base: 149.320, dec: 3 },
  { sym: "USD/CAD", base: 1.36540, dec: 4 },
  { sym: "AUD/USD", base: 0.65123, dec: 5 },
] as { sym: string; label?: Record<Language, string>; base: number; dec: number }[];

const TX = {
  pt: {
    title1: (n: string) => (n ? `${n}, essa` : "Essa"), titleMid: " é a plataforma do ", titleBold: "Guardião", titleEnd: " — operando no câmbio",
    subProfile: "Este é o Guardião operando no câmbio agora. Toque em Investir pra ativar e ver os resultados caindo pra você em tempo real.",
    subActive: "O Guardião está operando sozinho no câmbio. As mesmas entradas caem pra todo mundo — inclusive pra você.",
    subDone: "Viu como é simples? Agora imagine isso caindo na sua conta todos os dias.",
    live: "operando ao vivo", copyingNow: "copiando agora",
    profitToday: "Lucro de hoje", balance: "Seu saldo", metaLbl: "Meta",
    feedTitle: "Operações ao vivo", entry: "ENTRADA", exit: "SAÍDA", buy: "compra", sell: "venda",
    took: (c: string) => `${c} copiaram junto`,
    analyzing: "Analisando o câmbio...", waiting: "Aguardando próxima operação...",
    badges: ["Sem ler gráfico", "Sem experiência", "O Guardião faz tudo"],
    continueFast: "Já entendi — continuar →", continueSkip: "Continuar sem testar →",
    grTitle: "META BATIDA!", grSubA: (n: string) => (n ? `${n}, o Guardião bateu sua meta de ` : "O Guardião bateu sua meta de "), grSubC: " em 1 minuto.",
    grIfReal: "Na conta real, você teria ganho:", grWithdraw: "e poderia sacar agora mesmo",
    grItems: ["As mesmas entradas caindo pra você", "Guardião operando 24h no câmbio", "Saques ilimitados pra qualquer banco", "Suporte no WhatsApp"],
    grCta: "QUERO O GUARDIÃO OPERANDO PRA MIM", grWaiting: "Enquanto você espera, outros já estão lucrando.",
    invest: "Investir",
    notifWin: (amt: string, par: string, c: string) => `+R$${amt} em ${par} · ${c} copiaram`,
  },
  en: {
    title1: (n: string) => (n ? `${n}, this` : "This"), titleMid: " is the ", titleBold: "Guardian", titleEnd: " platform — trading currencies",
    subProfile: "This is the Guardian trading currencies right now. Tap Invest to activate and watch the results land for you in real time.",
    subActive: "The Guardian is trading currencies on its own. The same entries hit everyone — including you.",
    subDone: "See how simple it is? Now picture this landing in your account every day.",
    live: "trading live", copyingNow: "copying now",
    profitToday: "Today's profit", balance: "Your balance", metaLbl: "Goal",
    feedTitle: "Live trades", entry: "ENTRY", exit: "EXIT", buy: "buy", sell: "sell",
    took: (c: string) => `${c} copied along`,
    analyzing: "Analyzing the market...", waiting: "Waiting for the next trade...",
    badges: ["No chart reading", "No experience", "The Guardian does it all"],
    continueFast: "Got it — continue →", continueSkip: "Continue without testing →",
    grTitle: "GOAL REACHED!", grSubA: (n: string) => (n ? `${n}, the Guardian hit your goal of ` : "The Guardian hit your goal of "), grSubC: " in 1 minute.",
    grIfReal: "On a real account, you would have earned:", grWithdraw: "and could withdraw right now",
    grItems: ["The same entries landing for you", "Guardian trading currencies 24/7", "Unlimited withdrawals to any bank", "WhatsApp support"],
    grCta: "I WANT THE GUARDIAN TRADING FOR ME", grWaiting: "While you wait, others are already profiting.",
    invest: "Invest",
    notifWin: (amt: string, par: string, c: string) => `+$${amt} on ${par} · ${c} copied`,
  },
  es: {
    title1: (n: string) => (n ? `${n}, esta` : "Esta"), titleMid: " es la plataforma del ", titleBold: "Guardián", titleEnd: " — operando divisas",
    subProfile: "Este es el Guardián operando divisas ahora. Toca Invertir para activar y ver los resultados caer para ti en tiempo real.",
    subActive: "El Guardián está operando divisas solo. Las mismas entradas les llegan a todos — incluido tú.",
    subDone: "¿Viste qué simple es? Ahora imagina esto cayendo en tu cuenta todos los días.",
    live: "operando en vivo", copyingNow: "copiando ahora",
    profitToday: "Ganancia de hoy", balance: "Tu saldo", metaLbl: "Meta",
    feedTitle: "Operaciones en vivo", entry: "ENTRADA", exit: "SALIDA", buy: "compra", sell: "venta",
    took: (c: string) => `${c} copiaron`,
    analyzing: "Analizando el mercado...", waiting: "Esperando la próxima operación...",
    badges: ["Sin leer gráficos", "Sin experiencia", "El Guardián hace todo"],
    continueFast: "Ya entendí — continuar →", continueSkip: "Continuar sin probar →",
    grTitle: "¡META ALCANZADA!", grSubA: (n: string) => (n ? `${n}, el Guardián alcanzó tu meta de ` : "El Guardián alcanzó tu meta de "), grSubC: " en 1 minuto.",
    grIfReal: "En cuenta real, habrías ganado:", grWithdraw: "y podrías retirar ahora mismo",
    grItems: ["Las mismas entradas cayendo para ti", "Guardián operando divisas 24h", "Retiros ilimitados a cualquier banco", "Soporte en WhatsApp"],
    grCta: "QUIERO EL GUARDIÁN OPERANDO PARA MÍ", grWaiting: "Mientras esperas, otros ya están ganando.",
    invest: "Invertir",
    notifWin: (amt: string, par: string, c: string) => `+$${amt} en ${par} · ${c} copiaron`,
  },
};
type Tx = typeof TX.pt;

// Ticker de cotações rolando (claro, no padrão do card).
const MarketTicker = ({ lang, locale }: { lang: Language; locale: string }) => {
  const [q, setQ] = useState(() => TICKER.map(() => ({ price: 0, pct: Math.random() * 1.4 - 0.6 })));
  useEffect(() => {
    setQ(TICKER.map((m) => ({ price: m.base, pct: Math.random() * 1.4 - 0.6 })));
    const iv = setInterval(() => setQ((prev) => prev.map((it, i) => {
      const base = it.price || TICKER[i].base;
      const np = base * (1 + (Math.random() * 2 - 1) * 0.0013);
      return { price: np, pct: ((np - TICKER[i].base) / TICKER[i].base) * 100 };
    })), 1300);
    return () => clearInterval(iv);
  }, []);
  const row = TICKER.map((m, i) => {
    const it = q[i]; const up = it.pct >= 0;
    return (
      <span key={m.sym} className="inline-flex items-center gap-1.5 px-3 border-r border-neutral-100">
        {m.label && <span className="text-[9px] font-semibold" style={{ color: "#C9902B" }}>{m.label[lang]}</span>}
        <span className="text-[10px] font-bold text-neutral-700">{m.sym}</span>
        <span className="text-[10px] font-mono text-neutral-500 tabular-nums">{(it.price || m.base).toLocaleString(locale, { minimumFractionDigits: m.dec, maximumFractionDigits: m.dec })}</span>
        <span className="text-[9px] font-bold tabular-nums" style={{ color: up ? C.teal : C.red }}>{up ? "▲" : "▼"}{Math.abs(it.pct).toFixed(2)}%</span>
      </span>
    );
  });
  return (
    <div className="relative overflow-hidden bg-neutral-50 border-y border-neutral-100 py-1.5">
      <div className="flex w-max whitespace-nowrap" style={{ animation: "gtl-ticker 30s linear infinite" }}>
        <div className="flex">{row}</div><div className="flex" aria-hidden>{row}</div>
      </div>
      <style>{`@keyframes gtl-ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}`}</style>
    </div>
  );
};

// Tela 1 — card de perfil do Guardião.
const GuardiaoProfileCard = ({ lang, locale, onInvestir, investidores, ranking, chart, investLabel }: {
  lang: Language; locale: string; onInvestir: () => void; investidores: number; ranking: number; chart: number[]; investLabel: string;
}) => {
  const PC = {
    pt: { title: "O Guardião", live: "AO VIVO • operando agora", retVar: "Retorno (variação)", retVarDate: "de 2026.08.16", retTotal: "Retorno (total)", saqueMax: "Saque máximo", saldo: "Saldo", patrimonio: "Patrimônio", taxa: "Taxa de desempenho", investidores: "Investidores" },
    en: { title: "The Guardian", live: "LIVE • trading now", retVar: "Return (variation)", retVarDate: "since 2026.08.16", retTotal: "Return (total)", saqueMax: "Max drawdown", saldo: "Balance", patrimonio: "Equity", taxa: "Performance fee", investidores: "Investors" },
    es: { title: "El Guardián", live: "EN VIVO • operando ahora", retVar: "Retorno (variación)", retVarDate: "desde 2026.08.16", retTotal: "Retorno (total)", saqueMax: "Retiro máximo", saldo: "Saldo", patrimonio: "Patrimonio", taxa: "Tasa de desempeño", investidores: "Inversores" },
  }[lang];
  const W = 320, H = 96;
  const pts = chart.map((y, i) => `${(i / (chart.length - 1)) * W},${H - (y / 100) * H}`).join(" ");
  const area = `0,${H} ${pts} ${W},${H}`;
  const lastY = H - (chart[chart.length - 1] / 100) * H;
  const Stat = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
    <div><p className="text-[11px] text-neutral-400 leading-tight">{label}</p><p className="text-[17px] font-bold text-neutral-800 leading-tight mt-0.5">{value}</p>{sub && <p className="text-[10px] text-neutral-400 mt-0.5">{sub}</p>}</div>
  );
  return (
    <div className="w-full rounded-[26px] bg-white text-neutral-900 shadow-2xl overflow-hidden border border-black/5">
      <div className="px-4 pt-4 pb-1 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-black flex items-center justify-center"><ShieldCheck className="w-8 h-8" style={{ color: "#E8863B" }} /></div>
            <span className="absolute -top-1.5 -left-1.5 text-[15px] leading-none">🇧🇷</span>
            <span className="absolute -bottom-2 left-1 text-[10px] font-bold bg-neutral-100 text-neutral-500 px-1.5 py-0.5 rounded-full shadow-sm">#{ranking}</span>
          </div>
          <div>
            <p className="text-[19px] font-semibold text-neutral-800 leading-tight">{PC.title}</p>
            <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold" style={{ color: C.red }}>
              <span className="relative flex h-1.5 w-1.5"><span className="absolute inline-flex h-full w-full rounded-full animate-ping opacity-75" style={{ background: C.red }} /><span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: C.red }} /></span>
              {PC.live}
            </span>
          </div>
        </div>
        <div className="w-9 h-9 rounded-xl border border-neutral-200 flex items-center justify-center"><Bookmark className="w-5 h-5" style={{ color: "#C9A24B" }} /></div>
      </div>
      <div className="px-1 pt-2 bg-gradient-to-b from-neutral-50 to-white">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[96px]" preserveAspectRatio="none">
          <defs><linearGradient id="pc-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.teal} stopOpacity="0.18" /><stop offset="100%" stopColor={C.teal} stopOpacity="0" /></linearGradient></defs>
          <polygon points={area} fill="url(#pc-area)" />
          <polyline points={pts} fill="none" stroke={C.teal} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          <circle cx={W} cy={lastY} r="3" fill={C.teal}><animate attributeName="r" values="3;5;3" dur="1.1s" repeatCount="indefinite" /></circle>
        </svg>
      </div>
      <div className="px-4 py-3 grid grid-cols-2 gap-x-6 gap-y-3">
        <Stat label={PC.retVar} value="69.2%" sub={PC.retVarDate} />
        <Stat label={PC.retTotal} value="267%" />
        <Stat label={PC.saqueMax} value="2.33%" />
        <Stat label={PC.saldo} value="US$ 802,24" />
        <Stat label={PC.patrimonio} value="US$ 802,24" />
        <Stat label={PC.taxa} value="10%" />
        <Stat label={PC.investidores} value={investidores.toLocaleString(locale)} />
      </div>
      <div className="px-4 pb-4 flex items-center gap-2">
        <div className="w-11 h-11 rounded-xl border border-neutral-200 flex items-center justify-center shrink-0"><Bookmark className="w-5 h-5" style={{ color: "#C9A24B" }} /></div>
        <div className="w-11 h-11 rounded-xl border border-neutral-200 flex items-center justify-center shrink-0"><Share2 className="w-5 h-5" style={{ color: C.orange }} /></div>
        <button onClick={onInvestir} className="flex-1 py-3 rounded-2xl text-white font-bold text-base cursor-pointer hover:brightness-105 active:scale-[0.98] transition-all" style={{ background: C.orange, boxShadow: "0 8px 20px rgba(232,85,46,0.35)" }}>{investLabel}</button>
      </div>
    </div>
  );
};

// Popup "meta batida" — no padrão claro do card.
const GoalReachedPopup = ({ goal, profit, onContinue, userName, t, locale, sym }: { goal: number; profit: number; onContinue: () => void; userName?: string; t: Tx; locale: string; sym: string }) => {
  const firstName = userName?.split(" ")[0] || "";
  const disp = Math.max(profit, goal);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in px-4">
      <div className="w-full max-w-sm bg-white rounded-[26px] shadow-2xl overflow-hidden animate-scale-in max-h-[92vh] overflow-y-auto">
        <div className="px-5 py-5 text-center" style={{ background: "rgba(18,165,148,0.08)" }}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 animate-bounce-subtle" style={{ background: "rgba(18,165,148,0.15)" }}><Trophy className="w-7 h-7" style={{ color: C.teal }} /></div>
          <h3 className="font-display font-bold text-lg text-neutral-800">{t.grTitle}</h3>
          <p className="text-sm text-neutral-500 mt-1.5 leading-relaxed">{t.grSubA(firstName)}<span className="font-bold text-neutral-800">{sym}{goal.toLocaleString(locale)}</span>{t.grSubC}</p>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div className="rounded-2xl p-3 text-center border" style={{ borderColor: "rgba(18,165,148,0.3)", background: "rgba(18,165,148,0.05)" }}>
            <p className="text-[11px] text-neutral-500 mb-1">{t.grIfReal}</p>
            <p className="text-3xl font-display font-extrabold mt-1" style={{ color: C.teal }}>{sym} {disp.toLocaleString(locale, { minimumFractionDigits: 2 })}</p>
            <p className="text-[11px] mt-1.5 font-medium" style={{ color: C.teal }}>{t.grWithdraw}</p>
          </div>
          <div className="rounded-2xl p-3 border border-neutral-100 bg-neutral-50 space-y-1.5">
            {t.grItems.map((item, i) => (
              <div key={i} className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: C.teal }} /><span className="text-[11px] text-neutral-600">{item}</span></div>
            ))}
          </div>
          <button onClick={onContinue} className="w-full py-3.5 rounded-2xl font-extrabold text-sm tracking-wide text-white cursor-pointer hover:brightness-105 active:scale-[0.98] transition-all" style={{ background: C.orange, boxShadow: "0 8px 22px rgba(232,85,46,0.35)" }}>
            <span className="flex items-center justify-center gap-2"><Sparkles className="w-4 h-4" /> {t.grCta}</span>
          </button>
          <p className="text-[10px] text-neutral-400 text-center">{t.grWaiting}</p>
        </div>
      </div>
    </div>
  );
};

const StepPlatformDemoForex = ({ onNext, userName }: Props) => {
  const { lang, locale } = useLanguage();
  const t = TX[lang];
  const cur = CUR[lang];
  const firstName = userName?.split(" ")[0] || "";

  const [isActive, setIsActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showGoalReached, setShowGoalReached] = useState(false);
  const [goal, setGoal] = useState(0);
  const [balance, setBalance] = useState(362.72);
  const [profit, setProfit] = useState(0);
  const [copiers, setCopiers] = useState(5782);
  const [investidores, setInvestidores] = useState(168);
  const [ranking, setRanking] = useState(46);
  const [profChart, setProfChart] = useState<number[]>(() => Array.from({ length: 46 }, (_, i) => 48 + Math.sin(i / 3.5) * 6 + (i > 34 ? (Math.random() - 0.5) * 26 : (Math.random() - 0.5) * 6)));
  const [history, setHistory] = useState<Array<{ id: number; par: string; side: "buy" | "sell"; lucro: number; took: number; status: "open" | "closed"; }>>([]);
  const [notification, setNotification] = useState<string | null>(null);

  const opTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const accumulatedRef = useRef(0);
  const startTimeRef = useRef(0);
  const opId = useRef(1);
  const GOAL_TIME_MS = 15_000;

  // Investir → ativa DIRETO (sem tela de meta): baixa fricção.
  const handleInvestir = () => {
    if (isActive) return;
    setGoal(cur.goal); setIsActive(true); setIsAnalyzing(true); startTimeRef.current = Date.now();
  };

  // Tela 1 viva: investidores/ranking/gráfico.
  useEffect(() => {
    if (isActive) return;
    const iv = setInterval(() => {
      setInvestidores((v) => v + (Math.random() < 0.55 ? 1 : 0) + (Math.random() < 0.15 ? 1 : 0));
      setRanking((r) => (Math.random() < 0.14 && r > 11 ? r - 1 : r));
      setProfChart((prev) => { const last = prev[prev.length - 1]; const next = Math.max(16, Math.min(90, last + (Math.random() - 0.42) * 16)); return [...prev.slice(1), next]; });
    }, 1100);
    return () => clearInterval(iv);
  }, [isActive]);

  // "copiando agora" sobe durante as operações.
  useEffect(() => {
    if (!isActive || showGoalReached) return;
    const iv = setInterval(() => setCopiers((c) => c + Math.round(1 + Math.random() * 18)), 1100);
    return () => clearInterval(iv);
  }, [isActive, showGoalReached]);

  const runNext = useCallback(() => { if (accumulatedRef.current >= goal && goal > 0) { setShowGoalReached(true); return; } setIsAnalyzing(true); }, [goal]);

  const onAnalysisDone = useCallback(() => {
    setIsAnalyzing(false);
    const elapsed = Date.now() - startTimeRef.current;
    const remaining = goal - accumulatedRef.current;
    const timeLeft = Math.max(1, GOAL_TIME_MS - elapsed);
    const estOpsLeft = Math.max(1, Math.floor(timeLeft / 1600));
    const isWin = Math.random() < 0.88;
    let lucro: number;
    if (isWin) {
      const base = remaining / estOpsLeft;
      lucro = Math.max(3, Math.min(remaining * 0.3, base * (0.5 + Math.random())));
      if (timeLeft < 8000 && remaining > 0) lucro = Math.max(lucro, remaining * 0.5);
      lucro = parseFloat(lucro.toFixed(2));
    } else { lucro = -parseFloat((Math.random() * 8 + 1).toFixed(2)); }
    const idx = Math.floor(Math.random() * pares.length);
    const took = Math.round(3800 + Math.random() * 2600);
    accumulatedRef.current += lucro;
    setHistory((prev) => [...prev.slice(-5), { id: opId.current++, par: pares[idx], side: Math.random() > 0.35 ? "buy" : "sell", lucro, took, status: "closed" }]);
    setProfit((p) => parseFloat((p + lucro).toFixed(2)));
    setBalance((b) => parseFloat((b + lucro).toFixed(2)));
    if (isWin) setNotification(t.notifWin(lucro.toFixed(2), pares[idx], took.toLocaleString(locale)));
    if (accumulatedRef.current >= goal) { setTimeout(() => setShowGoalReached(true), 700); return; }
    opTimerRef.current = setTimeout(runNext, 150 + Math.random() * 250);
  }, [goal, runNext, t, locale]);

  useEffect(() => () => { if (opTimerRef.current) clearTimeout(opTimerRef.current); }, []);
  useEffect(() => { if (!notification) return; const to = setTimeout(() => setNotification(null), 2600); return () => clearTimeout(to); }, [notification]);

  const goalReached = showGoalReached;
  const money = (n: number) => `${cur.sym} ${n.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const progressPct = goal > 0 ? Math.min(100, Math.round((Math.max(0, profit) / goal) * 100)) : 0;

  return (
    <StepContainer>
      <StepTitle>{t.title1(firstName)}{t.titleMid}<span className="text-gradient-green">{t.titleBold}</span>{t.titleEnd}</StepTitle>
      <StepSubtitle>{!isActive ? t.subProfile : goalReached ? t.subDone : t.subActive}</StepSubtitle>

      {!isActive ? (
        <GuardiaoProfileCard lang={lang} locale={locale} onInvestir={handleInvestir} investidores={investidores} ranking={ranking} chart={profChart} investLabel={t.invest} />
      ) : (
        <div className="w-full rounded-[26px] bg-white text-neutral-900 shadow-2xl overflow-hidden border border-black/5">
          {/* Header */}
          <div className="px-4 pt-4 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center"><ShieldCheck className="w-6 h-6" style={{ color: "#E8863B" }} /></div>
              <div>
                <p className="text-[15px] font-semibold text-neutral-800 leading-tight">O Guardião</p>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold" style={{ color: C.teal }}>
                  <span className="relative flex h-1.5 w-1.5"><span className="absolute inline-flex h-full w-full rounded-full animate-ping opacity-75" style={{ background: C.teal }} /><span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: C.teal }} /></span>
                  {t.live}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-neutral-500">
              <Users className="w-3.5 h-3.5" style={{ color: C.orange }} />
              <span className="text-[11px]"><strong className="text-neutral-700 tabular-nums">{copiers.toLocaleString(locale)}</strong> {t.copyingNow}</span>
            </div>
          </div>

          <MarketTicker lang={lang} locale={locale} />

          {/* Lucro + saldo */}
          <div className="px-4 py-3 grid grid-cols-2 gap-3">
            <div className="rounded-2xl p-3 border" style={{ borderColor: "rgba(18,165,148,0.25)", background: "rgba(18,165,148,0.05)" }}>
              <p className="text-[10px] text-neutral-400">{t.profitToday}</p>
              <p className="text-2xl font-extrabold tabular-nums leading-tight mt-0.5" style={{ color: C.teal }}>+{money(profit)}</p>
            </div>
            <div className="rounded-2xl p-3 border border-neutral-100 bg-neutral-50">
              <p className="text-[10px] text-neutral-400">{t.balance}</p>
              <p className="text-2xl font-extrabold text-neutral-800 tabular-nums leading-tight mt-0.5">{money(balance)}</p>
            </div>
          </div>

          {/* Meta */}
          {goal > 0 && !goalReached && (
            <div className="px-4 pb-1">
              <div className="flex justify-between text-[10px] text-neutral-400 mb-1"><span>{t.metaLbl}: {cur.sym}{goal.toLocaleString(locale)}</span><span className="font-bold" style={{ color: C.orange }}>{progressPct}%</span></div>
              <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all duration-500" style={{ width: `${progressPct}%`, background: C.orange }} /></div>
            </div>
          )}

          {isActive && !goalReached && <AnalyzingBar key={isAnalyzing ? "a" : "i"} onDone={onAnalysisDone} paused={!isAnalyzing} t={t} />}

          {/* Feed de operações */}
          <div className="px-4 pt-1 pb-4">
            <p className="text-[10px] uppercase tracking-wider text-neutral-400 mb-1.5">{t.feedTitle}</p>
            <div className="space-y-1.5">
              {[...history].reverse().map((o) => (
                <div key={o.id} className="flex items-center justify-between rounded-xl border border-neutral-100 bg-neutral-50 px-3 py-2 animate-fade-in">
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: o.lucro >= 0 ? C.teal : C.red }} />
                    <div className="min-w-0">
                      <p className="text-[12px] font-semibold text-neutral-700 truncate">{o.par} · {o.side === "buy" ? t.buy : t.sell} <span className="text-[9px] font-bold" style={{ color: C.teal }}>{t.exit}</span></p>
                      <p className="text-[10px] text-neutral-400 truncate">{t.took(o.took.toLocaleString(locale))}</p>
                    </div>
                  </div>
                  <span className="text-[13px] font-extrabold tabular-nums shrink-0" style={{ color: o.lucro >= 0 ? C.teal : C.red }}>{o.lucro >= 0 ? "+" : ""}{money(o.lucro)}</span>
                </div>
              ))}
              {history.length === 0 && <p className="text-[11px] text-neutral-400 text-center py-3">{t.waiting}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Selos zero-experiência */}
      {isActive && !goalReached && (
        <div className="w-full flex flex-wrap gap-2 justify-center">
          {t.badges.map((b) => (
            <span key={b} className="flex items-center gap-1 text-[11px] font-semibold text-foreground/80 bg-muted/60 border border-border rounded-full px-2.5 py-1"><CheckCircle2 className="w-3 h-3 text-primary" />{b}</span>
          ))}
        </div>
      )}

      {/* Confiança */}
      <div className="w-full funnel-card border-accent/20 bg-accent/5 text-center p-2.5">
        <div className="flex items-center justify-center gap-1.5"><Lock className="w-3.5 h-3.5 text-primary shrink-0" /><p className="text-[11px] text-foreground font-medium leading-snug">O Guardião opera <strong>100% automático</strong>. Você só ativa sua Chave de Acesso e acompanha no celular.</p></div>
      </div>

      {isActive && !goalReached ? (
        <button onClick={onNext} className="w-full py-3 rounded-xl font-bold text-sm text-white uppercase tracking-wide animate-fade-in" style={{ background: C.orange, boxShadow: "0 4px 16px rgba(232,85,46,0.35)" }}>{t.continueFast}</button>
      ) : (
        <button onClick={onNext} className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4 cursor-pointer py-1">{t.continueSkip}</button>
      )}

      {showGoalReached && <GoalReachedPopup goal={goal} profit={profit} onContinue={onNext} userName={userName} t={t} locale={locale} sym={cur.sym} />}
      {notification && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-xs z-50 animate-slide-up">
          <div className="bg-white border rounded-xl px-3 py-2.5 shadow-2xl flex items-center gap-2.5" style={{ borderColor: "rgba(18,165,148,0.3)" }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(18,165,148,0.15)" }}><TrendingUp className="w-3.5 h-3.5" style={{ color: C.teal }} /></div>
            <p className="text-[11px] text-neutral-700">{notification}</p>
          </div>
        </div>
      )}
    </StepContainer>
  );
};

// Barra "analisando" entre operações (clara).
const AnalyzingBar = ({ onDone, paused, t }: { onDone: () => void; paused?: boolean; t: Tx }) => {
  const [p, setP] = useState(0);
  useEffect(() => {
    if (paused) { setP(0); return; }
    const dur = 300 + Math.random() * 300; const start = Date.now();
    const iv = setInterval(() => { const pct = Math.min(100, ((Date.now() - start) / dur) * 100); setP(pct); if (pct >= 100) { clearInterval(iv); setTimeout(onDone, 120); } }, 30);
    return () => clearInterval(iv);
  }, [onDone, paused]);
  return (
    <div className="px-4 py-2">
      <div className="flex items-center gap-2 mb-1.5"><Loader2 className={`w-3 h-3 ${paused ? "" : "animate-spin"}`} style={{ color: C.orange }} /><span className="text-[11px] font-semibold" style={{ color: C.orange }}>{paused ? t.waiting : t.analyzing}</span></div>
      <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all duration-75" style={{ width: `${p}%`, background: C.orange }} /></div>
    </div>
  );
};

export default StepPlatformDemoForex;
