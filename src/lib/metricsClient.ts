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
