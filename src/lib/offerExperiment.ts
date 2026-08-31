/**
 * Teste A/B da OFERTA (step-17): VSL atual vs VSL de R$147.
 * Controlado pelo config server-side (ab_config): offer147_active + offer147_split.
 * PADRÃO = DESLIGADO → todo mundo vê a oferta atual. Só entra tráfego na variação
 * R$147 quando o painel ligar (offer147_active=true e split>0), ou quando você mandar.
 * Isolado no Quiz A.
 */
import { getABConfig } from "./abConfigServer";

export type OfferVariant = "current" | "v147";
const KEY = "offer_exp";

// Variação R$147 (VSL + checkout próprios).
export const OFFER_V147 = {
  videoId: "fa8e8d92-ad93-4c46-b171-7b1e971e2b83",   // VSL R$147 (Panda)
  checkoutUrl: "https://pay.hub.la/oxsxH9492nd0rwyqIwUh", // checkout R$147 (Hubla)
  amount: 147,
  aspect: "9:16" as const,                            // mesmo formato do VSL atual (pega a tela toda)
  unlockSeconds: 8 * 60 + 20,                         // 8:20 (ajustável se o pitch for outro tempo)
};

export function getOfferVariant(): OfferVariant {
  const cfg = getABConfig();
  if (cfg.offer147_winner === "current" || cfg.offer147_winner === "v147") {
    return cfg.offer147_winner as OfferVariant;
  }
  try {
    const s = localStorage.getItem(KEY);
    if (s === "current" || s === "v147") return s;
  } catch { /* ignore */ }
  // Teste desligado ou sem split → oferta atual (comportamento de hoje).
  if (!cfg.offer147_active || cfg.offer147_split <= 0) return "current";
  const r = Math.random() * 100;
  const v: OfferVariant = r < cfg.offer147_split ? "v147" : "current";
  try { localStorage.setItem(KEY, v); } catch { /* ignore */ }
  return v;
}
