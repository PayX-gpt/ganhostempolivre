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

// ⚠️ PREENCHER quando o usuário mandar a VSL de R$147 e o link do checkout.
export const OFFER_V147 = {
  videoId: "REPLACE_VIDEO_ID_VSL_147",      // ID do vídeo Panda da VSL R$147
  checkoutUrl: "REPLACE_CHECKOUT_URL_147",  // link do checkout R$147
  amount: 147,
  unlockSeconds: 8 * 60 + 20,               // ajustar ao momento do pitch da nova VSL
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
