/**
 * Quiz Version A/B Test
 * V1 = Original (17 steps)
 * V2 = Optimized (14 steps: removes step-10, step-11, step-12 + improved answers)
 * Traffic split is configurable via localStorage.
 */

import { getABConfig, saveABConfig } from "./abConfigServer";

export type QuizVersion = "V1" | "V2";

const VERSION_KEY = "quiz_version";

/**
 * % de tráfego para V2 (0-100) — agora vem do config SERVER-SIDE (painel /live),
 * valendo para TODOS os visitantes.
 */
export function getV2Split(): number {
  const val = getABConfig().version_v2_split;
  if (typeof val === "number" && val >= 0 && val <= 100) return val;
  return 50;
}

/**
 * Define o % de V2 (0-100) no servidor — vale para todos. Retorna sucesso.
 */
export function setV2Split(pct: number): Promise<boolean> {
  return saveABConfig({ version_v2_split: Math.max(0, Math.min(100, Math.round(pct))) });
}

/**
 * Teste ativo? (server-side). Vencedor declarado encerra o teste.
 */
export function isTestActive(): boolean {
  const cfg = getABConfig();
  if (cfg.version_winner === "V1" || cfg.version_winner === "V2") return false;
  return cfg.version_test_active !== false;
}

/**
 * Liga/desliga o teste no servidor — vale para todos. Retorna sucesso.
 */
export function setTestActive(active: boolean): Promise<boolean> {
  return saveABConfig({ version_test_active: active });
}

/**
 * Declara vencedor no servidor: todo o tráfego passa a ver essa versão.
 */
export function declareVersionWinner(version: QuizVersion): Promise<boolean> {
  return saveABConfig({ version_winner: version });
}

/**
 * Limpa o vencedor no servidor, reativando o teste.
 */
export function clearVersionWinner(): Promise<boolean> {
  return saveABConfig({ version_winner: null });
}

/**
 * Vencedor declarado (server), se houver.
 */
export function getDeclaredWinner(): QuizVersion | null {
  const w = getABConfig().version_winner;
  if (w === "V1" || w === "V2") return w;
  return null;
}

/**
 * Get or assign quiz version for the current visitor.
 * Respects: winner > test inactive (default V1) > split percentage.
 */
export function getOrAssignQuizVersion(): QuizVersion {
  // If winner declared, always return winner
  const winner = getDeclaredWinner();
  if (winner) {
    localStorage.setItem(VERSION_KEY, winner);
    return winner;
  }

  // If test inactive, default to V1
  if (!isTestActive()) {
    const stored = localStorage.getItem(VERSION_KEY);
    if (stored === "V1" || stored === "V2") return stored;
    localStorage.setItem(VERSION_KEY, "V1");
    return "V1";
  }

  // If already assigned, keep it
  const stored = localStorage.getItem(VERSION_KEY);
  if (stored === "V1" || stored === "V2") return stored;

  // Assign based on split percentage
  const v2Pct = getV2Split();
  const version: QuizVersion = Math.random() * 100 < v2Pct ? "V2" : "V1";
  localStorage.setItem(VERSION_KEY, version);
  return version;
}

/**
 * Force a specific version (for URL override: ?quiz_version=V2)
 */
export function forceQuizVersion(version: QuizVersion): void {
  localStorage.setItem(VERSION_KEY, version);
}

/**
 * Get effective quiz version, checking URL override first.
 */
export function getEffectiveQuizVersion(): QuizVersion {
  const urlVersion = new URLSearchParams(window.location.search).get("quiz_version")?.toUpperCase();
  if (urlVersion === "V1" || urlVersion === "V2") {
    forceQuizVersion(urlVersion);
    return urlVersion;
  }
  return getOrAssignQuizVersion();
}

/**
 * Steps to skip in V2 (0-indexed step numbers mapped to slugs)
 */
export const V2_SKIPPED_STEPS = ["step-10", "step-11", "step-12"] as const;

/**
 * Check if a step should be skipped in V2
 */
export function shouldSkipStep(stepSlug: string, version: QuizVersion): boolean {
  if (version === "V1") return false;
  return (V2_SKIPPED_STEPS as readonly string[]).includes(stepSlug);
}

/**
 * Save quiz_version to session_attribution
 */
export async function saveQuizVersionToAttribution(version: QuizVersion): Promise<void> {
  try {
    const sessionId = sessionStorage.getItem("session_id") || localStorage.getItem("session_id");
    if (!sessionId) return;

    const { supabase } = await import("@/integrations/supabase/client");
    await supabase
      .from("session_attribution")
      .update({ quiz_version: version } as any)
      .eq("session_id", sessionId);
  } catch {
    // Silent
  }
}
