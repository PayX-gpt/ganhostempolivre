/**
 * A/B Config server-side (Supabase).
 *
 * Fonte ÚNICA de verdade do split/vencedor/ativo dos testes A/B, lida pelo
 * FUNIL (todos os visitantes) e escrita pelo PAINEL /live. Assim, mudar o
 * fluxo no painel vale para TODO MUNDO na hora — não só no navegador do admin.
 *
 * Estratégia à prova de falha:
 * - Cache em memória semeado do localStorage (carrega instantâneo p/ o visitante).
 * - loadABConfig() busca a versão fresca do Supabase e atualiza cache+localStorage.
 * - Se a tabela sumir / rede falhar, cai nos DEFAULTS (= comportamento antigo).
 */
import { supabase } from "@/integrations/supabase/client";

export interface ABConfig {
  variant_active_variants: string[]; // Step1 A/B: variantes ativas (peso igual)
  variant_winner: string | null;     // 'A'..'E' quando vencedor declarado
  version_v2_split: number;          // 0-100, % de tráfego para V2
  version_test_active: boolean;      // teste V1/V2 ligado?
  version_winner: string | null;     // 'V1' | 'V2' quando vencedor declarado
  edition_b_split: number;           // 0-100, % de tráfego para o Quiz B (funil completo)
  edition_c_split: number;           // 0-100, % de tráfego para o Quiz C
  edition_test_active: boolean;      // teste de EDIÇÃO (Quiz A vs B vs C) ligado?
  edition_winner: string | null;     // 'A' | 'B' | 'C' quando vencedor declarado
}

export const AB_DEFAULTS: ABConfig = {
  variant_active_variants: ["A", "C"],
  variant_winner: null,
  version_v2_split: 50,
  version_test_active: true,
  version_winner: null,
  edition_b_split: 0,        // padrão: NENHUM tráfego pro Quiz B (só o quiz principal roda)
  edition_c_split: 0,        // padrão: NENHUM tráfego pro Quiz C
  edition_test_active: false,
  edition_winner: null,
};

const CACHE_KEY = "ab_config_cache_v1";

function readLocal(): ABConfig {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) return { ...AB_DEFAULTS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...AB_DEFAULTS };
}

let cache: ABConfig = readLocal();
let loaded = false;

/** Config atual (síncrono) — usado pelos libs de assignment. */
export function getABConfig(): ABConfig {
  return cache;
}

export function isABConfigLoaded(): boolean {
  return loaded;
}

function persist(next: ABConfig) {
  cache = next;
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
}

/** Busca a config fresca do servidor. Nunca lança — cai no cache/DEFAULTS. */
export async function loadABConfig(): Promise<ABConfig> {
  try {
    // Cast para any: a tabela ab_config não está nos tipos gerados do Supabase
    // (mesmo padrão já usado no projeto para tabelas/RPCs novas).
    const { data, error } = await (supabase as any).from("ab_config")
      .select("variant_active_variants,variant_winner,version_v2_split,version_test_active,version_winner,edition_b_split,edition_c_split,edition_test_active,edition_winner")
      .eq("id", 1)
      .maybeSingle();
    if (!error && data) {
      persist({
        variant_active_variants:
          Array.isArray(data.variant_active_variants) && data.variant_active_variants.length > 0
            ? data.variant_active_variants
            : AB_DEFAULTS.variant_active_variants,
        variant_winner: data.variant_winner ?? null,
        version_v2_split:
          typeof data.version_v2_split === "number" ? data.version_v2_split : AB_DEFAULTS.version_v2_split,
        version_test_active:
          typeof data.version_test_active === "boolean" ? data.version_test_active : AB_DEFAULTS.version_test_active,
        version_winner: data.version_winner ?? null,
        edition_b_split:
          typeof data.edition_b_split === "number" ? data.edition_b_split : AB_DEFAULTS.edition_b_split,
        edition_c_split:
          typeof data.edition_c_split === "number" ? data.edition_c_split : AB_DEFAULTS.edition_c_split,
        edition_test_active:
          typeof data.edition_test_active === "boolean" ? data.edition_test_active : AB_DEFAULTS.edition_test_active,
        edition_winner: data.edition_winner ?? null,
      });
    }
  } catch { /* mantém cache */ }
  loaded = true;
  return cache;
}

/** Escreve (painel). Atualiza o servidor + cache local. Retorna sucesso. */
export async function saveABConfig(patch: Partial<ABConfig>): Promise<boolean> {
  const next = { ...cache, ...patch };
  try {
    const { error } = await (supabase as any).from("ab_config")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", 1);
    if (error) return false;
    persist(next);
    return true;
  } catch {
    return false;
  }
}
