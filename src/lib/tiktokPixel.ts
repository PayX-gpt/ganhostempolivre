/**
 * TikTok Pixel helper — browser-side events
 * Fires InitiateCheckout on checkout click (once per session)
 */

declare global {
  interface Window {
    ttq?: {
      track: (event: string, params?: Record<string, unknown>) => void;
      identify: (params: Record<string, unknown>) => void;
      page: () => void;
    };
  }
}

let icSent = false;

export function trackTikTokInitiateCheckout(params: {
  amount?: number;
  currency?: string;
  contentId?: string;
}): void {
  if (icSent) return;
  icSent = true;

  try {
    if (window.ttq) {
      window.ttq.track("InitiateCheckout", {
        content_type: "product",
        content_id: params.contentId || "chave_token_chatgpt",
        value: params.amount || 37,
        currency: params.currency || "BRL",
      });
      console.log("[TikTok Pixel] ✅ InitiateCheckout fired");
    }
  } catch (err) {
    console.warn("[TikTok Pixel] Error:", err);
  }
}

export function identifyTikTokUser(params: {
  email?: string;
  phone?: string;
}): void {
  try {
    if (window.ttq && (params.email || params.phone)) {
      const identifyData: Record<string, string> = {};
      if (params.email) identifyData.email = params.email;
      if (params.phone) identifyData.phone_number = params.phone;
      window.ttq.identify(identifyData);
    }
  } catch {}
}
