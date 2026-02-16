import { ReactNode, useMemo, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { initializeTrackingDataLayer } from "@/lib/trackingDataLayer";
import SafePage from "../SafePage";

interface Props {
  children: ReactNode;
}

/**
 * Anti-clone guard for the quiz.
 * Logs blocked attempts to funnel_events for monitoring.
 */
const QuizGuard = ({ children }: Props) => {
  const isAuthorized = useMemo(() => {
    try { initializeTrackingDataLayer(); } catch {}

    // Check 1: Ad-related params in current URL
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("utm_source")) return true;
      if (params.get("fbclid")) return true;
      if (params.get("gclid")) return true;
      if (params.get("src")) return true;
      if (params.get("sck")) return true;
      if (params.get("xcod")) return true;
    } catch {}

    // Check 2: Previously stored tracking data
    try {
      const stored = localStorage.getItem("tracking_data_layer");
      if (stored) {
        const td = JSON.parse(stored);
        if (td.utm_source || td.fbclid || td.gclid || td.src || td.sck) return true;
      }
    } catch {}

    // Check 3: Session-level tracking
    try {
      const session = sessionStorage.getItem("tracking_session");
      if (session) {
        const sd = JSON.parse(session);
        if (sd.utm_source || sd.fbclid || sd.gclid || sd.src || sd.sck) return true;
      }
    } catch {}

    // Check 4: Quiz already in progress
    try {
      const quizAnswers = sessionStorage.getItem("quiz_answers");
      if (quizAnswers) {
        const parsed = JSON.parse(quizAnswers);
        if (parsed && Object.keys(parsed).length > 0) return true;
      }
    } catch {}

    // Check 5: Referrer from known ad platforms
    try {
      const ref = document.referrer.toLowerCase();
      if (ref.includes("facebook.com") || ref.includes("fb.com") ||
          ref.includes("instagram.com") || ref.includes("l.facebook.com") ||
          ref.includes("lm.facebook.com") || ref.includes("google.com") ||
          ref.includes("googleads") || ref.includes("tiktok.com") ||
          ref.includes("youtube.com")) {
        return true;
      }
    } catch {}

    // Check 6: Facebook cookie exists
    try {
      if (document.cookie.includes("_fbp=") || document.cookie.includes("_fbc=")) {
        return true;
      }
    } catch {}

    return false;
  }, []);

  // Log blocked attempt to DB for monitoring
  useEffect(() => {
    if (isAuthorized) return;
    try {
      const sessionId = (() => {
        try {
          const td = localStorage.getItem("tracking_data_layer");
          if (td) return JSON.parse(td).session_id;
        } catch {}
        return `blocked-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      })();

      supabase.from("funnel_events").insert([{
        session_id: sessionId,
        event_name: "clone_attempt_blocked",
        event_data: {
          url: window.location.href,
          referrer: document.referrer || "direct",
          user_agent: navigator.userAgent,
          screen: `${screen.width}x${screen.height}`,
          language: navigator.language,
          timestamp: new Date().toISOString(),
        },
        page_url: window.location.href,
        user_agent: navigator.userAgent,
      }]).then(() => {});
    } catch {}
  }, [isAuthorized]);

  if (!isAuthorized) {
    return <SafePage />;
  }

  return <>{children}</>;
};

export default QuizGuard;
