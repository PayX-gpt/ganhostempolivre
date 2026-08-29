import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Monitor, Smartphone, RefreshCw, ExternalLink, LayoutGrid, Columns2, Eye, X, Film } from "lucide-react";

type Ed = "A" | "B";
interface StepDef { n: number; label: string; video?: boolean; }

const STEPS_A: StepDef[] = [
  { n: 1, label: "Intro" }, { n: 2, label: "Idade" }, { n: 3, label: "Nome" },
  { n: 4, label: "Prova social" }, { n: 5, label: "Tentou online" }, { n: 6, label: "Meta renda" },
  { n: 7, label: "Obstáculo" }, { n: 8, label: "Vídeo mentor", video: true }, { n: 9, label: "Saldo" },
  { n: 10, label: "Disponib." }, { n: 11, label: "Demo" }, { n: 12, label: "WhatsApp" },
  { n: 13, label: "Contato" }, { n: 14, label: "Input contato" }, { n: 15, label: "Loading" },
  { n: 16, label: "Projeção" }, { n: 17, label: "Oferta (VSL)", video: true },
];
const STEPS_B: StepDef[] = [
  { n: 1, label: "Intro / Hook" }, { n: 2, label: "Idade" }, { n: 3, label: "Nome" },
  { n: 4, label: "Prova social" }, { n: 5, label: "Tentou online" }, { n: 6, label: "Meta renda" },
  { n: 7, label: "Obstáculo" }, { n: 8, label: "🎥 Vídeo 1 — Como funciona", video: true },
  { n: 9, label: "Saldo" }, { n: 10, label: "Disponib." },
  { n: 11, label: "🎥 Vídeo 2 — 15-30 min", video: true }, { n: 12, label: "IA Liberada / Demo" },
  { n: 13, label: "🎥 Vídeo 3 — Operar e sacar", video: true }, { n: 14, label: "WhatsApp" },
  { n: 15, label: "Contato" }, { n: 16, label: "Input contato" }, { n: 17, label: "Loading" },
  { n: 18, label: "🎥 Vídeo 4 — Como funciona", video: true }, { n: 19, label: "Oferta / Pitch", video: true },
];
const stepsOf = (e: Ed) => (e === "A" ? STEPS_A : STEPS_B);

const LANGS = ["pt", "en", "es"] as const;
type Lang = typeof LANGS[number];
const frameUrl = (e: Ed, step: number, lang: Lang) =>
  `${import.meta.env.BASE_URL}step-${step}?edition=${e}&preview=1&lang=${lang}`;

export default function Studio() {
  const [mode, setMode] = useState<"compare" | "gallery" | "vs">("gallery");
  const [galleryEd, setGalleryEd] = useState<Ed>("B");
  const [step, setStep] = useState(1);
  const [device, setDevice] = useState<"mobile" | "desktop">("mobile");
  const [lang, setLang] = useState<Lang>("pt");
  const [reloadKey, setReloadKey] = useState(0);
  const [open, setOpen] = useState<{ ed: Ed; step: number } | null>(null);

  // Fecha modal com ESC
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(null); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const w = device === "mobile" ? 390 : 1024;
  const h = device === "mobile" ? 780 : 720;

  const Toggle = ({ active, onClick, children, title }: any) => (
    <button onClick={onClick} title={title}
      className={cn("px-2 py-1 rounded-md text-xs", active ? "bg-emerald-500/20 text-emerald-400 font-bold" : "text-[#888] hover:text-white")}>{children}</button>
  );

  return (
    <div className="min-h-[100dvh] bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#0a0a0a]/95 backdrop-blur border-b border-[#2a2a2a]">
        <div className="max-w-[1500px] mx-auto px-4 py-3 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-emerald-400" />
            <h1 className="text-sm font-black">Quiz Studio</h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Modo */}
            <div className="flex bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-0.5">
              <Toggle active={mode === "gallery"} onClick={() => setMode("gallery")} title="Galeria de 1 quiz"><LayoutGrid className="w-3.5 h-3.5 inline mr-1" />Galeria</Toggle>
              <Toggle active={mode === "vs"} onClick={() => setMode("vs")} title="A vs B etapa por etapa"><Columns2 className="w-3.5 h-3.5 inline mr-1" />A vs B</Toggle>
              <Toggle active={mode === "compare"} onClick={() => setMode("compare")} title="Comparar 1 etapa em tela cheia"><Eye className="w-3.5 h-3.5 inline mr-1" />Tela cheia</Toggle>
            </div>
            {/* Edição (galeria) */}
            {mode === "gallery" && (
              <div className="flex bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-0.5">
                <Toggle active={galleryEd === "A"} onClick={() => setGalleryEd("A")}>Quiz A</Toggle>
                <Toggle active={galleryEd === "B"} onClick={() => setGalleryEd("B")}>Quiz B</Toggle>
              </div>
            )}
            {/* Idioma */}
            <div className="flex bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-0.5">
              {LANGS.map(l => <Toggle key={l} active={lang === l} onClick={() => setLang(l)}>{l.toUpperCase()}</Toggle>)}
            </div>
            {/* Device */}
            <div className="flex bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-0.5">
              <Toggle active={device === "mobile"} onClick={() => setDevice("mobile")} title="Celular"><Smartphone className="w-3.5 h-3.5" /></Toggle>
              <Toggle active={device === "desktop"} onClick={() => setDevice("desktop")} title="Desktop"><Monitor className="w-3.5 h-3.5" /></Toggle>
            </div>
            <button onClick={() => setReloadKey(k => k + 1)} className="p-1.5 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-[#888] hover:text-white"><RefreshCw className="w-3.5 h-3.5" /></button>
            <a href={`${import.meta.env.BASE_URL}live`} className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-[11px] text-[#aaa] hover:text-white"><ExternalLink className="w-3 h-3" />Métricas</a>
          </div>
        </div>
      </div>

      <div className="max-w-[1500px] mx-auto px-4 py-4">
        {mode === "gallery" ? (
          <>
            <div className="flex items-center gap-2 mb-3">
              <span className={cn("text-xs font-black px-2 py-0.5 rounded", galleryEd === "A" ? "bg-sky-500/20 text-sky-300" : "bg-violet-500/20 text-violet-300")}>QUIZ {galleryEd}</span>
              <span className="text-[11px] text-[#888]">{stepsOf(galleryEd).length} telas · clique no <Eye className="w-3 h-3 inline" /> para abrir grande</span>
            </div>
            {/* Galeria de miniaturas enfileiradas */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {stepsOf(galleryEd).map(s => (
                <div key={s.n} className="group relative rounded-xl overflow-hidden border border-[#2a2a2a] bg-[#0f1319]">
                  {/* Miniatura (iframe reduzido) */}
                  <div className="relative overflow-hidden" style={{ height: 230 }}>
                    <iframe
                      key={`thumb-${galleryEd}-${s.n}-${lang}-${reloadKey}`}
                      src={frameUrl(galleryEd, s.n, lang)}
                      title={`thumb ${s.n}`}
                      loading="lazy"
                      style={{ width: 390, height: 640, border: "none", transformOrigin: "top left", transform: "scale(0.5)", pointerEvents: "none", background: "#0f1319" }}
                    />
                    {/* Overlay clique olhinho */}
                    <button onClick={() => setOpen({ ed: galleryEd, step: s.n })}
                      className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/40 transition-colors">
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-emerald-500 text-black rounded-full p-2 shadow-lg"><Eye className="w-5 h-5" /></span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between px-2 py-1.5 border-t border-[#2a2a2a]">
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="text-[10px] text-[#666] font-bold">{s.n}</span>
                      {s.video && <Film className="w-3 h-3 text-violet-400 shrink-0" />}
                      <span className="text-[10px] text-[#bbb] truncate">{s.label}</span>
                    </div>
                    <button onClick={() => setOpen({ ed: galleryEd, step: s.n })} className="text-[#888] hover:text-emerald-400 shrink-0"><Eye className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : mode === "vs" ? (
          <>
            <div className="text-[11px] text-[#888] mb-3">Cada etapa: <span className="text-sky-300 font-bold">Quiz A</span> à esquerda, <span className="text-violet-300 font-bold">Quiz B</span> à direita — desça comparando. Clique no <Eye className="w-3 h-3 inline" /> pra abrir grande.</div>
            <div className="space-y-4">
              {Array.from({ length: Math.max(STEPS_A.length, STEPS_B.length) }, (_, i) => i + 1).map(n => {
                const a = STEPS_A.find(s => s.n === n);
                const b = STEPS_B.find(s => s.n === n);
                return (
                  <div key={n} className="rounded-xl border border-[#2a2a2a] bg-[#0f1319] p-3">
                    <div className="text-[11px] text-[#aaa] font-bold mb-2">Etapa {n}</div>
                    <div className="grid grid-cols-2 gap-3">
                      {([["A", a, true], ["B", b, false]] as const).map(([ed, sd, isA]) => (
                        <div key={ed} className="relative rounded-lg overflow-hidden border border-[#2a2a2a] bg-[#0f1319]">
                          <div className="flex items-center justify-between px-2 py-1 border-b border-[#2a2a2a] gap-1">
                            <span className={cn("text-[9px] font-black truncate", isA ? "text-sky-300" : "text-violet-300")}>{ed} · {sd ? sd.label.replace("🎥 ", "") : "—"}</span>
                            {sd && <button onClick={() => setOpen({ ed, step: n })} className="text-[#888] hover:text-emerald-400 shrink-0"><Eye className="w-3.5 h-3.5" /></button>}
                          </div>
                          <div className="relative overflow-hidden" style={{ height: 210 }}>
                            {sd ? (
                              <>
                                <iframe key={`vs-${ed}-${n}-${lang}-${reloadKey}`} src={frameUrl(ed, n, lang)} title={`${ed} ${n}`} loading="lazy"
                                  style={{ width: 390, height: 640, border: "none", transformOrigin: "top left", transform: "scale(0.5)", pointerEvents: "none", background: "#0f1319" }} />
                                <button onClick={() => setOpen({ ed, step: n })} className="absolute inset-0 hover:bg-black/30 transition-colors" />
                              </>
                            ) : <div className="flex items-center justify-center h-full text-[#555] text-[10px]">não existe no Quiz {ed}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <>
            {/* Trilha (compare) */}
            <div className="overflow-x-auto mb-3">
              <div className="flex gap-1 min-w-max">
                {stepsOf("B").map(s => (
                  <button key={s.n} onClick={() => setStep(s.n)}
                    className={cn("flex flex-col items-center px-2 py-1 rounded-lg border text-[10px] min-w-[52px]",
                      step === s.n ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300" : "bg-[#141414] border-[#2a2a2a] text-[#888] hover:text-white")}>
                    <span className="font-bold">{s.n}</span>
                    <span className="truncate max-w-[48px]">{s.label.replace("🎥 ", "")}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-6 justify-center items-start">
              {(["A", "B"] as Ed[]).map(ed => {
                const sdef = stepsOf(ed).find(s => s.n === step);
                return (
                  <div key={ed} className="flex flex-col items-center">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={cn("text-xs font-black px-2 py-0.5 rounded", ed === "A" ? "bg-sky-500/20 text-sky-300" : "bg-violet-500/20 text-violet-300")}>QUIZ {ed}</span>
                      <span className="text-[10px] text-[#666]">{sdef ? sdef.label : "— (não existe nesta edição)"}</span>
                    </div>
                    <div className="rounded-2xl overflow-hidden border border-[#2a2a2a] bg-black shadow-xl" style={{ width: w }}>
                      {sdef ? (
                        <iframe key={`${ed}-${step}-${lang}-${reloadKey}`} src={frameUrl(ed, step, lang)} title={`Quiz ${ed} step ${step}`} style={{ width: "100%", height: h, border: "none", background: "#0f1319" }} />
                      ) : (
                        <div className="flex items-center justify-center text-[#555] text-xs" style={{ height: h }}>Etapa {step} não existe no Quiz {ed}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <div className="text-center text-[10px] text-[#555] mt-4">
          Preview isolado (<code>?preview=1</code>) — não registra dados nem redireciona. Quiz A = principal (intocado). Quiz B = edição paralela editável.
        </div>
      </div>

      {/* Modal olhinho — abre a tela grande */}
      {open && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setOpen(null)}>
          <div className="relative" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <span className={cn("text-xs font-black px-2 py-0.5 rounded", open.ed === "A" ? "bg-sky-500/20 text-sky-300" : "bg-violet-500/20 text-violet-300")}>QUIZ {open.ed} — {stepsOf(open.ed).find(s => s.n === open.step)?.label}</span>
              <button onClick={() => setOpen(null)} className="text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="rounded-2xl overflow-hidden border border-[#333] bg-black shadow-2xl" style={{ width: 390 }}>
              <iframe src={frameUrl(open.ed, open.step, lang)} title="preview grande" style={{ width: 390, height: Math.min(780, window.innerHeight - 120), border: "none", background: "#0f1319" }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
