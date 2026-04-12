/**
 * Quiz Version A/B Test
 * V1 = Original (17 steps)
 * V2 = Optimized (14 steps: removes step-10, step-11, step-12 + improved answers)
 * 50/50 traffic split, persisted per session.
 */

export type QuizVersion = "V1" | "V2";

const VERSION_KEY = "quiz_version";

/**
 * Get or assign quiz version for the current visitor.
 * Persists in localStorage so returning visitors keep the same version.
 */
export function getOrAssignQuizVersion(): QuizVersion {
  const stored = localStorage.getItem(VERSION_KEY);
  if (stored === "V1" || stored === "V2") return stored;

  // 50/50 split
  const version: QuizVersion = Math.random() < 0.5 ? "V1" : "V2";
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
