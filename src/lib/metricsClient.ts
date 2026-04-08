import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { getTrackingData } from "./trackingDataLayer";

/** Read early-captured UTMs from localStorage */
const getLeadUTM = (): Record<string, string> => {
  try {
    return JSON.parse(localStorage.getItem('lead_utm') || '{}');
  } catch { return {}; }
};

const buildEnrichedEventData = (
  eventData: Record<string, unknown>,
  trackingData: ReturnType<typeof getTrackingData>
) => {
  const utmData = getLeadUTM();
  const current = eventData as Record<string, unknown>;

  return {
    ...eventData,
    utm_source: current.utm_source ?? utmData.utm_source ?? trackingData.utm_source ?? null,
    utm_medium: current.utm_medium ?? utmData.utm_medium ?? trackingData.utm_medium ?? null,
    utm_campaign: current.utm_campaign ?? utmData.utm_campaign ?? trackingData.utm_campaign ?? null,
    utm_content: current.utm_content ?? utmData.utm_content ?? trackingData.utm_content ?? null,
    utm_term: current.utm_term ?? utmData.utm_term ?? trackingData.utm_term ?? null,
    fbclid: current.fbclid ?? utmData.fbclid ?? trackingData.fbclid ?? null,
    ttclid: current.ttclid ?? utmData.ttclid ?? trackingData.ttclid ?? null,
    referrer: current.referrer ?? utmData.referrer ?? utmData.referrer_detected ?? trackingData.referrer ?? null,
    landing_url: current.landing_url ?? utmData.landing_url ?? null,
  };
};

export const saveFunnelEvent = async (
  eventName: string,
  eventData: Record<string, unknown> = {}
): Promise<void> => {
  try {
    const trackingData = getTrackingData();
    const enrichedData = buildEnrichedEventData(eventData, trackingData);

    await supabase.from("funnel_events").insert([{
      session_id: trackingData.session_id || "unknown",
      event_name: eventName,
      event_data: JSON.parse(JSON.stringify(enrichedData)) as Json,
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
    const enrichedData = buildEnrichedEventData(eventData, trackingData);
    const payload = {
      session_id: trackingData.session_id || "unknown",
      event_name: eventName,
      event_data: JSON.parse(JSON.stringify(enrichedData)),
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
