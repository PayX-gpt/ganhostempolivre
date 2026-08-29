import { useEffect, useRef, useState } from "react";
import { StepContainer } from "./QuizUI";

/**
 * Etapa de VÍDEO (ConverteAI / vturb smartplayer) com BOTÃO temporizado embaixo.
 *
 * O botão aparece após `revealSeconds` (tempo do vídeo), de forma à prova de
 * falha (timer de página + reavaliação no foco/visibilidade — igual ao step-17).
 * Em modo preview do Studio (?preview=1) o botão aparece rápido (2s) pra você
 * conferir a tela inteira sem esperar o vídeo todo.
 */
const VTURB_ACCOUNT = "b0e4939b-cc77-4e2a-b44e-cdd7250cf729";

interface Props {
  playerId: string;
  headline?: React.ReactNode;
  subheadline?: React.ReactNode;
  buttonText: string;
  revealSeconds: number;
  onClick: () => void;
  /** Texto pequeno abaixo do botão (opcional). */
  note?: string;
}

const isPreview = () => {
  try { return new URLSearchParams(window.location.search).get("preview") === "1"; }
  catch { return false; }
};

export default function VturbVideoStep({ playerId, headline, subheadline, buttonText, revealSeconds, onClick, note }: Props) {
  const [revealed, setRevealed] = useState(false);
  const mountedAt = useRef(Date.now());
  const containerRef = useRef<HTMLDivElement>(null);

  // Injeta o smartplayer (element + script), 1x por player.
  useEffect(() => {
    const host = containerRef.current;
    if (!host) return;
    host.innerHTML = `<vturb-smartplayer id="vid-${playerId}" style="display:block;margin:0 auto;width:100%;max-width:400px;border-radius:16px;overflow:hidden;"></vturb-smartplayer>`;
    const src = `https://scripts.converteai.net/${VTURB_ACCOUNT}/players/${playerId}/v4/player.js`;
    if (!document.querySelector(`script[src="${src}"]`)) {
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      document.head.appendChild(s);
    }
    return () => { if (host) host.innerHTML = ""; };
  }, [playerId]);

  // Revela o botão no tempo certo — garantido (não depende do player responder).
  useEffect(() => {
    const target = isPreview() ? 2 : Math.max(1, revealSeconds);
    const check = () => {
      if ((Date.now() - mountedAt.current) / 1000 >= target) setRevealed(true);
    };
    const t = window.setTimeout(() => setRevealed(true), target * 1000);
    const iv = window.setInterval(check, 1000);
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", check);
    return () => {
      window.clearTimeout(t);
      window.clearInterval(iv);
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", check);
    };
  }, [revealSeconds]);

  return (
    <StepContainer>
      {headline && <h2 className="text-center text-lg sm:text-2xl font-display font-black text-foreground leading-tight px-2">{headline}</h2>}
      {subheadline && <p className="text-center text-[13px] sm:text-base text-muted-foreground -mt-1 px-2">{subheadline}</p>}

      <div ref={containerRef} className="w-full flex justify-center my-2" />

      {revealed ? (
        <button
          onClick={onClick}
          className="w-full max-w-md mx-auto py-4 px-6 rounded-xl font-extrabold text-[15px] sm:text-xl text-black uppercase tracking-wide animate-fade-in transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
          style={{ background: "linear-gradient(135deg, #FFD600 0%, #FFB300 100%)", boxShadow: "0 4px 20px rgba(255,214,0,0.4)" }}
        >
          {buttonText}
        </button>
      ) : (
        <div className="w-full max-w-md mx-auto py-4 px-6 rounded-xl bg-secondary/40 text-center text-muted-foreground text-sm font-semibold animate-pulse">
          Aguarde o vídeo…
        </div>
      )}
      {note && <p className="text-center text-[11px] text-muted-foreground">{note}</p>}
    </StepContainer>
  );
}
