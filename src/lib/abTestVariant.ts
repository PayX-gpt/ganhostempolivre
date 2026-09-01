import { supabase } from "@/integrations/supabase/client";
import { getTrackingData } from "./trackingDataLayer";
import { getABConfig, saveABConfig } from "./abConfigServer";

export type QuizVariant = "A" | "B" | "C" | "D" | "E";

const VARIANT_KEY = "quiz_variant";
const ALL_VARIANTS: QuizVariant[] = ["A", "B", "C", "D", "E"];

/**
 * Variantes ativas do teste — agora vêm do config SERVER-SIDE (painel /live),
 * valendo para TODOS os visitantes. Fallback para ["A","C"] se vier vazio.
 */
function getActiveVariants(): QuizVariant[] {
  const fromCfg = (getABConfig().variant_active_variants || [])
    .filter((v): v is QuizVariant => (ALL_VARIANTS as string[]).includes(v));
  return fromCfg.length > 0 ? fromCfg : ["A"];
}

/**
 * Get or assign a variant for the current visitor.
 * Persists in localStorage so returning visitors see the same variant.
 */
export function getOrAssignVariant(): QuizVariant {
  const active = getActiveVariants();
  const stored = localStorage.getItem(VARIANT_KEY);
  // If stored variant is still active, keep it
  if (stored && active.includes(stored as QuizVariant)) {
    return stored as QuizVariant;
  }
  // Re-assign to an active variant (handles old/removed variant users too)
  const variant = active[Math.floor(Math.random() * active.length)];
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
 * Declara vencedor SERVER-SIDE: 100% do tráfego (todos os visitantes) passa a
 * ver essa variante. Retorna se salvou. Passe null para limpar o vencedor.
 */
export async function declareWinner(variant: QuizVariant | null): Promise<boolean> {
  return saveABConfig({ variant_winner: variant });
}

/**
 * Variante efetiva: se há vencedor declarado (server) usa ele; senão atribui.
 */
export function getEffectiveVariant(): QuizVariant {
  const winner = getABConfig().variant_winner;
  if (winner && (ALL_VARIANTS as string[]).includes(winner)) {
    return winner as QuizVariant;
  }
  return getOrAssignVariant();
}
