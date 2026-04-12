/**
 * Quiz Version A/B Test
 * V1 = Original (17 steps)
 * V2 = Optimized (14 steps: removes step-10, step-11, step-12 + improved answers)
 * Traffic split is configurable via localStorage.
 */

export type QuizVersion = "V1" | "V2";

const VERSION_KEY = "quiz_version";
const SPLIT_KEY = "quiz_version_split"; // 0-100, percentage going to V2
const TEST_ACTIVE_KEY = "quiz_version_test_active"; // "true" or "false"
const WINNER_KEY = "quiz_version_winner"; // "V1" or "V2" when declared

/**
 * Get the current V2 traffic percentage (0-100). Default: 50.
 */
export function getV2Split(): number {
  const stored = localStorage.getItem(SPLIT_KEY);
  if (stored !== null) {
    const val = parseInt(stored, 10);
    if (!isNaN(val) && val >= 0 && val <= 100) return val;
  }
  return 50;
}

/**
 * Set the V2 traffic percentage (0-100).
 */
export function setV2Split(pct: number): void {
  localStorage.setItem(SPLIT_KEY, String(Math.max(0, Math.min(100, Math.round(pct)))));
}

/**
 * Check if the test is active.
 */
export function isTestActive(): boolean {
  const winner = localStorage.getItem(WINNER_KEY);
  if (winner === "V1" || winner === "V2") return false; // winner declared, test over
  const stored = localStorage.getItem(TEST_ACTIVE_KEY);
  if (stored === "false") return false;
  return true; // default active
}

/**
 * Activate or deactivate the test.
 */
export function setTestActive(active: boolean): void {
  localStorage.setItem(TEST_ACTIVE_KEY, active ? "true" : "false");
}

/**
 * Declare a winner version. All traffic goes to winner.
 */
export function declareVersionWinner(version: QuizVersion): void {
  localStorage.setItem(WINNER_KEY, version);
}

/**
 * Clear winner declaration to re-enable testing.
 */
export function clearVersionWinner(): void {
  localStorage.removeItem(WINNER_KEY);
}

/**
 * Get the declared winner, if any.
 */
export function getDeclaredWinner(): QuizVersion | null {
  const w = localStorage.getItem(WINNER_KEY);
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
