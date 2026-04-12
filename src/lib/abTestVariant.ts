import { supabase } from "@/integrations/supabase/client";
import { getTrackingData } from "./trackingDataLayer";

export type QuizVariant = "A" | "B" | "C" | "D" | "E";

const VARIANT_KEY = "quiz_variant";
const ALL_VARIANTS: QuizVariant[] = ["A", "B", "C", "D", "E"];

/**
 * Active variants for the current test.
 * Change this array to control traffic split (equal weight).
 */
const ACTIVE_VARIANTS: QuizVariant[] = ["A", "E"];

/**
 * Get or assign a variant for the current visitor.
 * Persists in localStorage so returning visitors see the same variant.
 */
export function getOrAssignVariant(): QuizVariant {
  const stored = localStorage.getItem(VARIANT_KEY);
  // If stored variant is still active, keep it
  if (stored && ACTIVE_VARIANTS.includes(stored as QuizVariant)) {
    return stored as QuizVariant;
  }
  // Re-assign to an active variant (handles old B/D users too)
  const variant = ACTIVE_VARIANTS[Math.floor(Math.random() * ACTIVE_VARIANTS.length)];
  localStorage.setItem(VARIANT_KEY, variant);
  return variant;
}

/**
 * Save variant to session_attribution so the dashboard can query it.
 */
export async function saveVariantToAttribution(variant: QuizVariant): Promise<void> {
  try {
    const td = getTrackingData();
    const sessionId = td.session_id;
    if (!sessionId || sessionId === "unknown") return;

    await supabase
      .from("session_attribution")
      .update({ quiz_variant: variant } as any)
      .eq("session_id", sessionId);
  } catch {
    // Silent — don't block the funnel
  }
}

/**
 * Force 100% traffic to a specific variant (when a winner is declared).
 */
export function declareWinner(variant: QuizVariant): void {
  localStorage.setItem("quiz_variant_winner", variant);
}

/**
 * Check if a winner has been declared. If so, override the assignment.
 */
export function getEffectiveVariant(): QuizVariant {
  const winner = localStorage.getItem("quiz_variant_winner");
  if (winner && ACTIVE_VARIANTS.includes(winner as QuizVariant)) {
    return winner as QuizVariant;
  }
  return getOrAssignVariant();
}
