/**
 * Meta Pixel browser-side event helper.
 * Fires standard events (InitiateCheckout, Purchase) via fbq.
 * Deduplicates IC per session.
 */

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

let icFired = false;

export function trackMetaInitiateCheckout(params: {
  amount?: number;
  contentId?: string;
}) {
  if (icFired) return;
  icFired = true;
  try {
    if (window.fbq) {
      window.fbq("track", "InitiateCheckout", {
        content_type: "product",
        content_ids: [params.contentId || "chave_token_chatgpt"],
        value: params.amount || 0,
        currency: "BRL",
      });
      console.log("[Meta Pixel] ✅ InitiateCheckout fired");
    }
  } catch (err) {
    console.warn("[Meta Pixel] IC error:", err);
  }
}

export function trackMetaPurchase(params: {
  amount?: number;
  contentId?: string;
}) {
  try {
    if (window.fbq) {
      window.fbq("track", "Purchase", {
        content_type: "product",
        content_ids: [params.contentId || "chave_token_chatgpt"],
        value: params.amount || 0,
        currency: "BRL",
      });
      console.log("[Meta Pixel] ✅ Purchase fired");
    }
  } catch (err) {
    console.warn("[Meta Pixel] Purchase error:", err);
  }
}
