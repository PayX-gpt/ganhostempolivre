import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { getTrackingData } from "./trackingDataLayer";

export const saveFunnelEvent = async (
  eventName: string,
  eventData: Record<string, unknown> = {}
): Promise<void> => {
  try {
    const trackingData = getTrackingData();
    await supabase.from("funnel_events").insert([{
      session_id: trackingData.session_id || "unknown",
      event_name: eventName,
      event_data: JSON.parse(JSON.stringify(eventData)) as Json,
      page_url: window.location.href,
      user_agent: navigator.userAgent,
    }]);
  } catch (error) {
    console.warn("[Metrics] Failed to save event:", error);
  }
};

/**
 * Reliable event saving using fetch with keepalive: true.
 * Use for critical events fired just before page navigation (e.g., checkout_click).
 * This ensures the request completes even if the page unloads.
 */
export const saveFunnelEventReliable = (
  eventName: string,
  eventData: Record<string, unknown> = {}
): void => {
  try {
    const trackingData = getTrackingData();
    const payload = {
      session_id: trackingData.session_id || "unknown",
      event_name: eventName,
      event_data: JSON.parse(JSON.stringify(eventData)),
      page_url: window.location.href,
      user_agent: navigator.userAgent,
    };
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    if (projectId && anonKey) {
      const url = `https://${projectId}.supabase.co/rest/v1/funnel_events`;
      fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": anonKey,
          "Authorization": `Bearer ${anonKey}`,
          "Prefer": "return=minimal",
        },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Silent fail — don't block user flow
  }
};

export const saveRedirectMetric = async (
  fromPage: string, toPage: string, redirectDurationMs: number
): Promise<void> => {
  try {
    const trackingData = getTrackingData();
    await supabase.from("redirect_metrics").insert([{
      session_id: trackingData.session_id || "unknown",
      from_page: fromPage,
      to_page: toPage,
      redirect_duration_ms: redirectDurationMs,
    }]);
  } catch (error) {
    console.warn("[Metrics] Failed to save redirect metric:", error);
  }
};
