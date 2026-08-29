import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Monitor, Smartphone, RefreshCw, ExternalLink, LayoutGrid, Columns2 } from "lucide-react";

const STEPS = [
  { n: 1, label: "Intro" }, { n: 2, label: "Idade" }, { n: 3, label: "Nome" },
  { n: 4, label: "Prova social" }, { n: 5, label: "Tentou online" }, { n: 6, label: "Meta renda" },
  { n: 7, label: "Obstáculo" }, { n: 8, label: "Vídeo mentor" }, { n: 9, label: "Saldo" },
  { n: 10, label: "Disponib." }, { n: 11, label: "Demo" }, { n: 12, label: "WhatsApp" },
  { n: 13, label: "Contato" }, { n: 14, label: "Input contato" }, { n: 15, label: "Loading" },
  { n: 16, label: "Projeção" }, { n: 17, label: "Oferta (VSL)" },
];
const LANGS = ["pt", "en", "es"] as const;
type Lang = typeof LANGS[number];

const frameUrl = (edition: "A" | "B", step: number, lang: Lang) =>
  `${import.meta.env.BASE_URL}step-${step}?edition=${edition}&preview=1&lang=${lang}`;

export default function Studio() {
  const [step, setStep] = useState(1);
  const [device, setDevice] = useState<"mobile" | "desktop">("mobile");
  const [lang, setLang] = useState<Lang>("pt");
  const [mode, setMode] = useState<"side" | "grid">("side");
  const [reloadKey, setReloadKey] = useState(0);
  const [stepStats, setStepStats] = useState<Record<number, { views: number; drop: number }>>({});

  // Métricas gerais por etapa (referência rápida — do funil geral, via a RPC de diagnóstico)
  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.rpc("get_funnel_decision_diagnostics" as any, { p_days: 7 });
        const steps = (data as any)?.steps || [];
        const map: Record<number, { views: number; drop: number }> = {};
        steps.forEach((s: any, i: number) => {
          const prev = steps[i - 1];
          const drop = prev && prev.views > 0 ? ((prev.views - s.views) / prev.views) * 100 : 0;
          map[s.step_num] = { views: s.views, drop };
        });
        setStepStats(map);
      } catch { /* opcional */ }
    })();
  }, []);

  const w = device === "mobile" ? 390 : 1024;
  const h = device === "mobile" ? 780 : 720;
  const cur = stepStats[step];

  const Frame = ({ edition, color }: { edition: "A" | "B"; color: string }) => (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-2 mb-2">
        <span className={cn("text-xs font-black px-2 py-0.5 rounded", color)}>QUIZ {edition}</span>
        <span className="text-[10px] text-[#666]">{edition === "A" ? "principal (atual)" : "edição paralela"}</span>
      </div>
      <div className="rounded-2xl overflow-hidden border border-[#2a2a2a] bg-black shadow-xl" style={{ width: Math.min(w, mode === "grid" ? 999 : w) }}>
        <iframe
          key={`${edition}-${step}-${lang}-${reloadKey}`}
          src={frameUrl(edition, step, lang)}
          title={`Quiz ${edition} — step ${step}`}
          style={{ width: "100%", height: h, border: "none", background: "#0f1319" }}
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-[100dvh] bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#0a0a0a]/95 backdrop-blur border-b border-[#2a2a2a]">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-emerald-400" />
            <h1 className="text-sm font-black">Quiz Studio</h1>
            <span className="text-[11px] text-[#666]">— Quiz A vs Quiz B, etapa por etapa</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Idioma */}
            <div className="flex bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-0.5">
              {LANGS.map(l => (
                <button key={l} onClick={() => setLang(l)}
                  className={cn("px-2 py-1 rounded-md text-xs uppercase", lang === l ? "bg-emerald-500/20 text-emerald-400 font-bold" : "text-[#888]")}>{l}</button>
              ))}
            </div>
            {/* Device */}
            <div className="flex bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-0.5">
              <button onClick={() => setDevice("mobile")} className={cn("px-2 py-1 rounded-md", device === "mobile" ? "bg-emerald-500/20 text-emerald-400" : "text-[#888]")}><Smartphone className="w-3.5 h-3.5" /></button>
              <button onClick={() => setDevice("desktop")} className={cn("px-2 py-1 rounded-md", device === "desktop" ? "bg-emerald-500/20 text-emerald-400" : "text-[#888]")}><Monitor className="w-3.5 h-3.5" /></button>
            </div>
            {/* Layout */}
            <div className="flex bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-0.5">
              <button onClick={() => setMode("side")} className={cn("px-2 py-1 rounded-md", mode === "side" ? "bg-emerald-500/20 text-emerald-400" : "text-[#888]")} title="Lado a lado"><Columns2 className="w-3.5 h-3.5" /></button>
              <button onClick={() => setMode("grid")} className={cn("px-2 py-1 rounded-md", mode === "grid" ? "bg-emerald-500/20 text-emerald-400" : "text-[#888]")} title="Empilhado"><LayoutGrid className="w-3.5 h-3.5" /></button>
            </div>
            <button onClick={() => setReloadKey(k => k + 1)} className="p-1.5 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-[#888] hover:text-white"><RefreshCw className="w-3.5 h-3.5" /></button>
            <a href={`${import.meta.env.BASE_URL}live`} className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-[11px] text-[#aaa] hover:text-white"><ExternalLink className="w-3 h-3" />Métricas (/live)</a>
          </div>
        </div>

        {/* Trilha de etapas */}
        <div className="max-w-[1400px] mx-auto px-4 pb-2 overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {STEPS.map(s => {
              const st = stepStats[s.n];
              const bigDrop = st && st.drop >= 40 && s.n >= 2;
              return (
                <button key={s.n} onClick={() => setStep(s.n)}
                  className={cn("flex flex-col items-center px-2 py-1 rounded-lg border text-[10px] transition-colors min-w-[52px]",
                    step === s.n ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300" : "bg-[#141414] border-[#2a2a2a] text-[#888] hover:text-white")}>
                  <span className="font-bold">{s.n}</span>
                  <span className="truncate max-w-[48px]">{s.label}</span>
                  {st && <span className={cn("text-[8px]", bigDrop ? "text-red-400 font-bold" : "text-[#555]")}>{st.views}{s.n >= 2 && st.drop > 0 ? ` -${st.drop.toFixed(0)}%` : ""}</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Etapa atual + métrica */}
      <div className="max-w-[1400px] mx-auto px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-bold">Etapa {step} — {STEPS.find(s => s.n === step)?.label}</div>
          {cur && (
            <div className="text-[11px] text-[#888]">Funil geral (7d): <span className="text-white font-bold">{cur.views}</span> sessões{step >= 2 && cur.drop > 0 && <> · queda <span className={cn(cur.drop >= 40 ? "text-red-400" : "text-amber-400", "font-bold")}>-{cur.drop.toFixed(0)}%</span></>}</div>
          )}
        </div>

        <div className={cn(mode === "side" ? "flex flex-wrap gap-6 justify-center items-start" : "flex flex-col gap-6 items-center")}>
          <Frame edition="A" color="bg-sky-500/20 text-sky-300" />
          <Frame edition="B" color="bg-violet-500/20 text-violet-300" />
        </div>

        <div className="text-center text-[10px] text-[#555] mt-4">
          Preview isolado (<code>?preview=1</code>) — não registra dados nem redireciona. Quiz A = seu quiz principal (intocado). Quiz B começa idêntico; você me pede as mudanças e eu aplico só no B.
        </div>
      </div>
    </div>
  );
}
