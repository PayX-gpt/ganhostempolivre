import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getTrackingData } from "@/lib/trackingDataLayer";
import { getLeadName } from "@/lib/upsellData";

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

// Singleton channel — never destroyed during the session
let sharedChannel: ReturnType<typeof supabase.channel> | null = null;
let sharedSessionId: string | null = null;
let subscribedStatus: "pending" | "subscribed" = "pending";
let pendingPageId: string | null = null;

const resetSharedChannel = () => {
  sharedChannel = null;
  sharedSessionId = null;
  subscribedStatus = "pending";
};

const buildPresencePayload = (sessionId: string, pageId: string) => ({
  session_id: sessionId,
  page_id: pageId,
  lead_name: getLeadName(),
  traffic_source: detectTrafficSource(),
  joined_at: new Date().toISOString(),
});

const trackOnChannel = async (
  channel: ReturnType<typeof supabase.channel>,
  sessionId: string,
  pageId: string,
): Promise<void> => {
  try {
    await channel.track(buildPresencePayload(sessionId, pageId));
  } catch {
    pendingPageId = pageId;
    resetSharedChannel();
  }
};

const getOrCreateChannel = (sessionId: string): ReturnType<typeof supabase.channel> => {
  if (sharedChannel) return sharedChannel;

  sharedSessionId = sessionId;
  sharedChannel = supabase.channel(PRESENCE_CHANNEL, {
    config: { presence: { key: sessionId } },
  });

  sharedChannel.subscribe((status) => {
    if (status === "SUBSCRIBED") {
      subscribedStatus = "subscribed";
      // Track pending page if any
      if (pendingPageId) {
        void trackOnChannel(sharedChannel!, sessionId, pendingPageId);
        pendingPageId = null;
      }
      return;
    }

    if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
      resetSharedChannel();
    }
  });

  return sharedChannel;
};

const detectTrafficSource = (): string => {
  try {
    const data = getTrackingData();
    if (data.ttclid || (data.utm_source && data.utm_source.toLowerCase().includes("tiktok"))) return "tiktok";
    if (data.fbclid || data.fbp || data.fbc || (data.utm_source && (data.utm_source.toLowerCase().includes("facebook") || data.utm_source.toLowerCase().includes("fb") || data.utm_source.toLowerCase().includes("instagram") || data.utm_source.toLowerCase().includes("meta")))) return "meta";
    if (data.gclid || (data.utm_source && data.utm_source.toLowerCase().includes("google"))) return "google";
    if (data.utm_source) return data.utm_source.toLowerCase();
  } catch {}
  return "organic";
};

const trackPresence = (pageId: string) => {
  const currentPath = window.location.pathname.toLowerCase();
  if (currentPath.includes('/live') || currentPath.includes('/admin')) {
    console.log('[Presence] SKIP /live or /admin', pageId);
    return;
  }
  if (isDevSession()) {
    console.log('[Presence] SKIP isDevSession', window.location.hostname);
    return;
  }

  const sessionId = getOrCreateSessionId();
  const channel = getOrCreateChannel(sessionId);

  if (subscribedStatus === "subscribed") {
    void trackOnChannel(channel, sessionId, pageId);
  } else {
    pendingPageId = pageId;
  }
};

export const usePagePresence = (pageId: string): void => {
  const lastPageRef = useRef<string | null>(null);
  const lastNameRef = useRef<string>("Visitante");

  useEffect(() => {
    if (!pageId || isDevSession()) return;
    const currentPath = window.location.pathname.toLowerCase();
    if (currentPath.includes('/live') || currentPath.includes('/admin')) return;

    const sessionId = getOrCreateSessionId();
    const isNewPage = lastPageRef.current !== pageId;
    lastPageRef.current = pageId;

    // Track presence on page change
    if (isNewPage) {
      trackPresence(pageId);
    }

    // Audit log (fire and forget) — only on page change
    if (isNewPage) {
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
    }

    // Listen for instant name update event (fired by QuizFunnel when user submits name)
    const handleNameEvent = () => {
      const currentName = getLeadName();
      if (currentName && currentName !== "Visitante") {
        lastNameRef.current = currentName;
        trackPresence(pageId);
      }
    };
    window.addEventListener("quiz_name_updated", handleNameEvent);

    // Poll every 2s as fallback (catches other name sources)
    const interval = setInterval(() => {
      const currentName = getLeadName();
      if (currentName !== "Visitante" && currentName !== lastNameRef.current) {
        lastNameRef.current = currentName;
        trackPresence(pageId);
      }
    }, 2000);

    // Heartbeat keeps realtime presence alive on longer steps and recovers after brief socket hiccups
    const heartbeat = setInterval(() => {
      trackPresence(pageId);
    }, 15000);

    return () => {
      clearInterval(interval);
      clearInterval(heartbeat);
      window.removeEventListener("quiz_name_updated", handleNameEvent);
    };
  }, [pageId]);

  // Cleanup only on full unmount (tab close)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (sharedChannel) {
        sharedChannel.untrack();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);
};
