/**
 * Quiz Edition A/B — teste de FUNIL COMPLETO (Quiz A vs Quiz B).
 *
 * Quiz A = o funil principal (o que já existe). Quiz B = uma edição paralela.
 * O split/vencedor/ativo vem do servidor (ab_config, via abConfigServer), então
 * mudar no painel vale para TODOS os visitantes.
 *
 * SEGURANÇA: o padrão é 100% Quiz A. Enquanto edition_test_active=false ou
 * edition_b_split=0, TODO visitante real cai no Quiz A (comportamento de hoje).
 * O Quiz B só recebe tráfego quando você ligar o teste e definir um split > 0.
 */
import { getABConfig } from "./abConfigServer";
import { supabase } from "@/integrations/supabase/client";

export type QuizEdition = "A" | "B";

const EDITION_KEY = "quiz_edition";

/** Lê override explícito por URL (?edition=A|B) — usado no Studio/testes. */
function urlEdition(): QuizEdition | null {
  try {
    const e = new URLSearchParams(window.location.search).get("edition")?.toUpperCase();
    if (e === "A" || e === "B") return e;
  } catch { /* ignore */ }
  return null;
}

/** Sorteia (uma vez) e trava a edição do visitante no localStorage. */
function assignEdition(): QuizEdition {
  const cfg = getABConfig();
  // Vencedor declarado manda em tudo.
  if (cfg.edition_winner === "A" || cfg.edition_winner === "B") return cfg.edition_winner;
  // Teste desligado ou sem split → sempre Quiz A (padrão seguro).
  if (!cfg.edition_test_active || cfg.edition_b_split <= 0) return "A";

  const stored = localStorage.getItem(EDITION_KEY);
  if (stored === "A" || stored === "B") return stored;

  const edition: QuizEdition = Math.random() * 100 < cfg.edition_b_split ? "B" : "A";
  try { localStorage.setItem(EDITION_KEY, edition); } catch { /* ignore */ }
  return edition;
}

/** Edição efetiva do visitante (URL override > sorteio/trava). */
export function getEffectiveEdition(): QuizEdition {
  return urlEdition() ?? assignEdition();
}

/** Salva a edição no session_attribution para o painel poder comparar A vs B. */
export async function saveEditionToAttribution(edition: QuizEdition): Promise<void> {
  try {
    const sessionId = sessionStorage.getItem("session_id") || localStorage.getItem("session_id");
    if (!sessionId) return;
    await (supabase as any).from("session_attribution")
      .update({ quiz_edition: edition })
      .eq("session_id", sessionId);
  } catch { /* silencioso — nunca bloqueia o funil */ }
}
