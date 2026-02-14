import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getTrackingData } from "@/lib/trackingDataLayer";

const PRESENCE_CHANNEL = "funnel-presence";

const isDevSession = (): boolean => {
  const url = window.location.href;
  const hostname = window.location.hostname;
  if (url.includes('__lovable_token=')) return true;
  if (hostname.includes('lovableproject.com')) return true;
  if (hostname.includes('lovable.app') && hostname.includes('preview')) return true;
  if (hostname.includes('preview--')) return true;
  if (hostname.includes('-preview--')) return true;
  if (hostname.endsWith('.lovable.app') && hostname.includes('--')) return true;
  if (hostname === 'localhost' || hostname === '127.0.0.1') return true;
  return false;
};

const getOrCreateSessionId = (): string => {
  let sessionId = sessionStorage.getItem("presence_session_id");
  if (!sessionId) {
    const trackingData = getTrackingData();
    sessionId = trackingData.session_id || `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem("presence_session_id", sessionId);
  }
  return sessionId;
};

export const usePagePresence = (pageId: string): void => {
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!pageId || isDevSession()) return;

    const sessionId = getOrCreateSessionId();

    const channel = supabase.channel(PRESENCE_CHANNEL, {
      config: { presence: { key: sessionId } },
    });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({
          session_id: sessionId,
          page_id: pageId,
          joined_at: new Date().toISOString(),
          user_agent: navigator.userAgent.substring(0, 100),
        });
      }
    });

    channelRef.current = channel;

    // Audit log
    const trackingData = getTrackingData();
    supabase.from("funnel_audit_logs").insert([{
      session_id: sessionId,
      event_type: "page_loaded",
      page_id: pageId,
      user_agent: navigator.userAgent,
      metadata: {
        url: window.location.href,
        referrer: document.referrer || null,
        utm_source: trackingData.utm_source || null,
        utm_medium: trackingData.utm_medium || null,
        utm_campaign: trackingData.utm_campaign || null,
        is_production: true,
      },
    }]).then(() => {});

    return () => {
      if (channelRef.current) {
        channelRef.current.untrack();
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [pageId]);
};
