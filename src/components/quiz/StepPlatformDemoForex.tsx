import { useState, useEffect, useRef, useCallback } from "react";
import { StepContainer, StepTitle, StepSubtitle, CTAButton } from "./QuizUI";
import { useLanguage, type Language } from "@/lib/i18n";
import { ShieldCheck, Users, Activity, TrendingUp, ArrowUpRight, ArrowDownRight, CheckCircle2, Lock, Zap } from "lucide-react";

/**
 * QUIZ B — Demo "Sala de Operações ao Vivo do Guardião" (copy trade / Forex).
 * Substitui a demo gamificada do Quiz A APENAS no Quiz B. Mostra o Guardião
 * operando vários mercados (ouro, prata, EUR/USD...), abrindo e fechando entradas
 * sozinho, e milhares de pessoas copiando a MESMA operação e lucrando em tempo real.
 * A pessoa não lê gráfico, não precisa de experiência — o Guardião faz tudo.
 * Tudo é simulação client-side (setInterval), sem rede.
 */

interface Props { onNext: () => void; userName?: string; }

const CUR: Record<Language, { sym: string; scale: number }> = {
  pt: { sym: "R$", scale: 1 },
  en: { sym: "$", scale: 0.2 },
  es: { sym: "$", scale: 0.2 },
};

const texts = {
  pt: {
    title1: (n: string) => (n ? `${n}, o ` : "O "),
    titleHL: "Guardião",
    title2: " está operando agora — ao vivo",
    subIdle: "Ative o Guardião e veja, em tempo real, ele entrando e saindo sozinho em vários mercados. Você não precisa ler gráfico nem ter experiência.",
    subActive: "O Guardião está operando sozinho. As mesmas entradas caem pra todo mundo ao mesmo tempo — inclusive pra você.",
    activate: "ATIVAR O GUARDIÃO",
    live: "AO VIVO",
    copying: "pessoas copiando agora",
    profitToday: "Lucro de hoje",
    focalNote: "O Guardião entra e sai sozinho. Você só acompanha.",
    aiControl: "IA no controle",
    entry: "ENTRADA",
    exit: "SAÍDA",
    buy: "compra",
    sell: "venda",
    peopleWon: (c: string) => `${c} pessoas pegaram esta operação`,
    ifInside: "Se você estivesse dentro AGORA, teria pego exatamente estas mesmas entradas — e lucrado junto, no mesmo instante.",
    badges: ["Sem ler gráfico", "Sem experiência", "O Guardião faz tudo"],
    feedTitle: "Operações ao vivo",
    cta: "QUERO O GUARDIÃO OPERANDO PRA MIM →",
    skip: "Já entendi. Continuar →",
    marketsLbl: "Operando em vários mercados ao mesmo tempo",
  },
  en: {
    title1: (n: string) => (n ? `${n}, the ` : "The "),
    titleHL: "Guardian",
    title2: " is trading right now — live",
    subIdle: "Activate the Guardian and watch it enter and exit on its own across several markets, in real time. No chart reading, no experience needed.",
    subActive: "The Guardian is trading on its own. The same entries hit everyone at once — including you.",
    activate: "ACTIVATE THE GUARDIAN",
    live: "LIVE",
    copying: "people copying right now",
    profitToday: "Today's profit",
    focalNote: "The Guardian enters and exits on its own. You just watch.",
    aiControl: "AI in control",
    entry: "ENTRY",
    exit: "EXIT",
    buy: "buy",
    sell: "sell",
    peopleWon: (c: string) => `${c} people took this trade`,
    ifInside: "If you were inside RIGHT NOW, you'd have taken these exact entries — and profited too, at the same instant.",
    badges: ["No chart reading", "No experience", "The Guardian does it all"],
    feedTitle: "Live trades",
    cta: "I WANT THE GUARDIAN TRADING FOR ME →",
    skip: "Got it. Continue →",
    marketsLbl: "Trading several markets at the same time",
  },
  es: {
    title1: (n: string) => (n ? `${n}, el ` : "El "),
    titleHL: "Guardián",
    title2: " está operando ahora — en vivo",
    subIdle: "Activá el Guardián y velo entrar y salir solo en varios mercados, en tiempo real. Sin leer gráficos ni experiencia.",
    subActive: "El Guardián está operando solo. Las mismas entradas les llegan a todos a la vez — incluido vos.",
    activate: "ACTIVAR EL GUARDIÁN",
    live: "EN VIVO",
    copying: "personas copiando ahora",
    profitToday: "Ganancia de hoy",
    focalNote: "El Guardián entra y sale solo. Vos solo acompañás.",
    aiControl: "IA en control",
    entry: "ENTRADA",
    exit: "SALIDA",
    buy: "compra",
    sell: "venta",
    peopleWon: (c: string) => `${c} personas tomaron esta operación`,
    ifInside: "Si estuvieras adentro AHORA, habrías tomado exactamente estas entradas — y ganado también, en el mismo instante.",
    badges: ["Sin leer gráficos", "Sin experiencia", "El Guardián hace todo"],
    feedTitle: "Operaciones en vivo",
    cta: "QUIERO EL GUARDIÁN OPERANDO PARA MÍ →",
    skip: "Ya entendí. Continuar →",
    marketsLbl: "Operando varios mercados al mismo tiempo",
  },
} as const;

// Mercados mostrados (ouro, prata, pares de moeda).
const MARKETS = [
  { key: "XAUUSD", pair: "XAU/USD", name: { pt: "Ouro", en: "Gold", es: "Oro" }, base: 2385, color: "#F5B942" },
  { key: "XAGUSD", pair: "XAG/USD", name: { pt: "Prata", en: "Silver", es: "Plata" }, base: 29.8, color: "#B8C0C8" },
  { key: "EURUSD", pair: "EUR/USD", name: { pt: "Euro", en: "Euro", es: "Euro" }, base: 1.086, color: "#4C8DFF" },
  { key: "GBPUSD", pair: "GBP/USD", name: { pt: "Libra", en: "Pound", es: "Libra" }, base: 1.271, color: "#8B5CF6" },
  { key: "USDJPY", pair: "USD/JPY", name: { pt: "Iene", en: "Yen", es: "Yen" }, base: 156.4, color: "#22C55E" },
] as const;

type Op = { id: number; mkt: number; side: "buy" | "sell"; status: "open" | "closed"; pnl: number; copiers: number };

const rnd = (a: number, b: number) => a + Math.random() * (b - a);

const StepPlatformDemoForex = ({ onNext, userName }: Props) => {
  const { lang, locale } = useLanguage();
  const t = texts[lang];
  const cur = CUR[lang];
  const firstName = userName?.split(" ")[0] || "";

  const [running, setRunning] = useState(false);
  const [profit, setProfit] = useState(0);
  const [copiers, setCopiers] = useState(5782);
  const [ops, setOps] = useState<Op[]>([]);
  const [showCTA, setShowCTA] = useState(false);
  const [focal, setFocal] = useState(0); // índice do mercado no gráfico principal
  const [chart, setChart] = useState<number[]>(() => Array.from({ length: 34 }, (_, i) => 50 + Math.sin(i / 3) * 6));
  const [entryAt, setEntryAt] = useState<number | null>(null); // posição aberta no gráfico
  const [lastExit, setLastExit] = useState<{ x: number; y: number; pnl: number } | null>(null);
  const [tickers, setTickers] = useState(() => MARKETS.map((m) => ({ price: m.base, up: true, spark: Array.from({ length: 12 }, () => rnd(40, 60)) })));

  const opId = useRef(1);
  const tickN = useRef(0);
  const posTicks = useRef(0);

  const money = useCallback((n: number) => `${cur.sym}${n.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, [cur.sym, locale]);
  const intCount = useCallback((n: number) => Math.round(n).toLocaleString(locale), [locale]);

  const start = () => {
    if (running) return;
    setRunning(true);
  };

  // Loop principal de simulação
  useEffect(() => {
    if (!running) return;
    const iv = window.setInterval(() => {
      tickN.current += 1;

      // Contador de "pessoas copiando" — sobe com leve oscilação
      setCopiers((c) => Math.max(5200, c + Math.round(rnd(-6, 22))));

      // Tickers dos mercados (preços + sparkline)
      setTickers((prev) => prev.map((tk, i) => {
        const drift = rnd(-1, 1.25) * (MARKETS[i].base * 0.0006);
        const price = Math.max(0.0001, tk.price + drift);
        const spark = [...tk.spark.slice(1), Math.max(20, Math.min(80, tk.spark[tk.spark.length - 1] + rnd(-9, 10)))];
        return { price, up: drift >= 0, spark };
      }));

      // Gráfico principal: anda pra frente; se tem posição aberta, viés de alta
      setChart((prev) => {
        const last = prev[prev.length - 1];
        const bias = entryAt !== null ? rnd(0.4, 2.6) : rnd(-1.4, 1.6);
        const next = Math.max(18, Math.min(82, last + bias));
        return [...prev.slice(1), next];
      });

      // Abertura/fechamento de operações (copy trade)
      setOps((prev) => {
        const open = prev.find((o) => o.status === "open");
        // Fecha a posição aberta depois de 3-4 ticks (sempre no positivo — copy trade vencedor)
        if (open && posTicks.current >= 3) {
          posTicks.current = 0;
          const pnl = +(rnd(6, 34) * cur.scale).toFixed(2);
          const gained = prev.map((o) => (o.id === open.id ? { ...o, status: "closed" as const, pnl } : o));
          setProfit((p) => +(p + pnl).toFixed(2));
          setLastExit({ x: 33, y: chartRef.current, pnl });
          setEntryAt(null);
          return gained.slice(-6);
        }
        if (open) { posTicks.current += 1; return prev; }
        // Abre nova operação
        const mkt = Math.floor(rnd(0, MARKETS.length));
        setFocal(mkt);
        setEntryAt(33);
        posTicks.current = 0;
        const op: Op = { id: opId.current++, mkt, side: Math.random() > 0.35 ? "buy" : "sell", status: "open", pnl: 0, copiers: Math.round(rnd(3800, 6400)) };
        return [...prev, op].slice(-6);
      });
    }, 950);
    return () => window.clearInterval(iv);
  }, [running, entryAt, cur.scale]);

  // ref pra pegar o último y do gráfico dentro do setOps sem recriar o loop
  const chartRef = useRef(50);
  useEffect(() => { chartRef.current = chart[chart.length - 1]; }, [chart]);

  // Revela o CTA após alguns segundos operando
  useEffect(() => {
    if (!running) return;
    const to = window.setTimeout(() => setShowCTA(true), 9000);
    return () => window.clearTimeout(to);
  }, [running]);

  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, []);

  // Polyline do gráfico principal
  const W = 320, H = 120;
  const chartPts = chart.map((y, i) => `${(i / (chart.length - 1)) * W},${H - (y / 100) * H}`).join(" ");
  const areaPts = `0,${H} ${chartPts} ${W},${H}`;
  const focalMkt = MARKETS[focal];
  const entryX = entryAt !== null ? (entryAt / (chart.length - 1)) * W : null;
  const entryY = entryAt !== null ? H - (chart[entryAt] / 100) * H : null;

  return (
    <StepContainer>
      <StepTitle>
        {t.title1(firstName)}<span className="text-gradient-green">{t.titleHL}</span>{t.title2}
      </StepTitle>
      <StepSubtitle>{running ? t.subActive : t.subIdle}</StepSubtitle>

      {/* Barra de status ao vivo */}
      <div className="w-full flex items-center justify-between gap-2 mt-1">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/30">
          <span className="relative flex h-2 w-2">
            <span className={`absolute inline-flex h-full w-full rounded-full bg-red-500 ${running ? "animate-ping opacity-75" : "opacity-0"}`} />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
          <span className="text-[11px] font-bold text-red-500 tracking-wide">{t.live}</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Users className="w-3.5 h-3.5 text-primary" />
          <span className="text-[12px] sm:text-sm"><strong className="text-foreground tabular-nums">{intCount(copiers)}</strong> {t.copying}</span>
        </div>
      </div>

      {/* Ticker de vários mercados */}
      <div className="w-full">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1"><Activity className="w-3 h-3 text-primary" />{t.marketsLbl}</p>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {MARKETS.map((m, i) => {
            const tk = tickers[i];
            const spk = tk.spark.map((y, j) => `${(j / (tk.spark.length - 1)) * 44},${20 - (y / 100) * 20}`).join(" ");
            return (
              <div key={m.key} className={`shrink-0 w-[104px] rounded-xl border p-2 bg-card/60 ${i === focal && running ? "border-primary/60" : "border-border"}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold" style={{ color: m.color }}>{m.pair}</span>
                  {tk.up ? <ArrowUpRight className="w-3 h-3 text-green-500" /> : <ArrowDownRight className="w-3 h-3 text-red-400" />}
                </div>
                <div className="text-[11px] font-semibold text-foreground tabular-nums">{tk.price.toLocaleString(locale, { maximumFractionDigits: m.base < 10 ? 4 : 2 })}</div>
                <svg viewBox="0 0 44 20" className="w-full h-4 mt-0.5" preserveAspectRatio="none">
                  <polyline points={spk} fill="none" stroke={tk.up ? "#22C55E" : "#F87171"} strokeWidth="1.5" />
                </svg>
              </div>
            );
          })}
        </div>
      </div>

      {!running ? (
        <div className="w-full mt-1">
          <CTAButton onClick={start} className="animate-bounce-subtle">
            <span className="flex items-center justify-center gap-2"><Zap className="w-5 h-5" />{t.activate}</span>
          </CTAButton>
        </div>
      ) : (
        <>
          {/* Lucro de hoje */}
          <div className="w-full funnel-card border-primary/30 bg-primary/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-primary" /></div>
              <span className="text-sm text-muted-foreground">{t.profitToday}</span>
            </div>
            <span className="text-2xl font-extrabold text-primary tabular-nums">{money(profit)}</span>
          </div>

          {/* Gráfico principal do mercado em foco */}
          <div className="w-full rounded-2xl border border-border bg-card/60 p-3 relative overflow-hidden">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[12px] font-bold" style={{ color: focalMkt.color }}>{focalMkt.pair} · {focalMkt.name[lang]}</span>
              <span className="flex items-center gap-1 text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full"><Lock className="w-3 h-3" />{t.aiControl}</span>
            </div>
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[120px]" preserveAspectRatio="none">
              <defs>
                <linearGradient id="fx-area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22C55E" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#22C55E" stopOpacity="0" />
                </linearGradient>
              </defs>
              <polygon points={areaPts} fill="url(#fx-area)" />
              <polyline points={chartPts} fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
              {entryX !== null && entryY !== null && (
                <>
                  <line x1={entryX} y1={0} x2={entryX} y2={H} stroke="#22C55E" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
                  <circle cx={entryX} cy={entryY} r="4" fill="#22C55E" stroke="#fff" strokeWidth="1.5" />
                </>
              )}
            </svg>
            <p className="text-[11px] text-muted-foreground text-center mt-1 flex items-center justify-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-primary" />{t.focalNote}</p>
          </div>

          {/* Feed de operações ao vivo (copy trade) */}
          <div className="w-full">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">{t.feedTitle}</p>
            <div className="w-full space-y-1.5">
              {[...ops].reverse().map((o) => {
                const m = MARKETS[o.mkt];
                const closed = o.status === "closed";
                return (
                  <div key={o.id} className={`flex items-center justify-between rounded-xl border px-3 py-2 animate-fade-in ${closed ? "border-primary/30 bg-primary/5" : "border-border bg-card/60"}`}>
                    <div className="flex items-center gap-2 min-w-0">
                      {closed ? <CheckCircle2 className="w-4 h-4 text-primary shrink-0" /> : <span className="relative flex h-2.5 w-2.5 shrink-0"><span className="absolute inline-flex h-full w-full rounded-full bg-green-500 animate-ping opacity-75" /><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" /></span>}
                      <div className="min-w-0">
                        <p className="text-[12px] font-semibold text-foreground truncate">
                          <span style={{ color: m.color }}>{m.pair}</span> · {o.side === "buy" ? t.buy : t.sell}
                          <span className={`ml-1.5 text-[10px] font-bold ${closed ? "text-primary" : "text-green-500"}`}>{closed ? t.exit : t.entry}</span>
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">{t.peopleWon(intCount(o.copiers))}</p>
                      </div>
                    </div>
                    {closed && <span className="text-[13px] font-extrabold text-primary tabular-nums shrink-0">+{money(o.pnl)}</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* "Se você estivesse dentro agora" */}
          <div className="w-full funnel-card border-primary/20 bg-primary/5">
            <p className="text-[13px] sm:text-sm text-foreground/90 text-center leading-relaxed">
              <strong className="text-primary">{t.ifInside}</strong>
            </p>
          </div>

          {/* Reforço: zero experiência */}
          <div className="w-full flex flex-wrap gap-2 justify-center">
            {t.badges.map((b) => (
              <span key={b} className="flex items-center gap-1 text-[11px] font-semibold text-foreground/80 bg-muted/60 border border-border rounded-full px-2.5 py-1">
                <CheckCircle2 className="w-3 h-3 text-primary" />{b}
              </span>
            ))}
          </div>

          <div className={`w-full ${showCTA ? "animate-fade-in" : "opacity-0 pointer-events-none"}`}>
            <CTAButton onClick={onNext}>{t.cta}</CTAButton>
            <button onClick={onNext} className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4 cursor-pointer py-2 mt-1">{t.skip}</button>
          </div>
        </>
      )}
    </StepContainer>
  );
};

export default StepPlatformDemoForex;
