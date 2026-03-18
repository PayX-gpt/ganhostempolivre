import { getTrackingData } from "./trackingDataLayer";

let icSent = false;

/**
 * Sends InitiateCheckout to Facebook CAPI — fires only ONCE per session.
 * Called on first checkout button click.
 */
export async function sendCAPIInitiateCheckout(params: {
  email?: string;
  phone?: string;
  amount?: number;
  plan?: string;
}): Promise<void> {
  if (icSent) return; // Already sent this session
  icSent = true; // Mark immediately to prevent double-fire

  try {
    const tracking = getTrackingData();
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    if (!projectId) return;

    const url = `https://${projectId}.supabase.co/functions/v1/facebook-capi-ic`;

    const body = {
      event_name: "InitiateCheckout",
      email: params.email || null,
      phone: params.phone || null,
      session_id: tracking.session_id,
      fbclid: tracking.fbclid,
      fbp: tracking.fbp,
      fbc: tracking.fbc,
      amount: params.amount || null,
      plan: params.plan || null,
    };

    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const result = await resp.json();
    console.log("[CAPI-IC]", result.sent ? "✅ Sent" : "⏭️ Skipped", result.reason || "");
  } catch (err) {
    console.warn("[CAPI-IC] Error:", err);
    // Don't block checkout flow
  }
}
