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

export function trackMetaViewContent(params: {
  contentId?: string;
  contentName?: string;
}) {
  try {
    if (window.fbq) {
      window.fbq("track", "ViewContent", {
        content_type: "product",
        content_ids: [params.contentId || "chave_token_chatgpt"],
        content_name: params.contentName || "VSL Ganhos Tempo Livre",
      });
    }
  } catch {}
}

export function trackMetaAddToCart(params: {
  amount?: number;
  contentId?: string;
}) {
  try {
    if (window.fbq) {
      window.fbq("track", "AddToCart", {
        content_type: "product",
        content_ids: [params.contentId || "chave_token_chatgpt"],
        value: params.amount || 0,
        currency: "BRL",
      });
    }
  } catch {}
}

export function trackMetaLead() {
  try {
    if (window.fbq) {
      window.fbq("track", "Lead");
    }
  } catch {}
}

export function trackMetaCompleteRegistration() {
  try {
    if (window.fbq) {
      window.fbq("track", "CompleteRegistration");
    }
  } catch {}
}

export function setMetaAdvancedMatching(params: {
  email?: string;
  phone?: string;
}) {
  try {
    if (!window.fbq) return;
    const userData: Record<string, string> = {};
    if (params.email) userData.em = params.email.trim().toLowerCase();
    if (params.phone) {
      const clean = params.phone.replace(/\D/g, "");
      if (clean.length >= 10) userData.ph = clean;
    }
    if (Object.keys(userData).length === 0) return;
    // Re-init each pixel with user data for Advanced Matching
    const pixelIds = [
      "1247938693657822", "915957744475091", "1626600228462998",
      "952975541025077", "1595773305052852", "1347337003982438",
      "970913692438694",
    ];
    pixelIds.forEach((id) => {
      window.fbq("init", id, userData);
    });
    console.log("[Meta Pixel] ✅ Advanced Matching set:", Object.keys(userData).join(", "));
  } catch (err) {
    console.warn("[Meta Pixel] Advanced Matching error:", err);
  }
}
