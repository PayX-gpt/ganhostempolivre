import { ReactNode, useMemo } from "react";
import GhostPage from "../upsell/GhostPage";
import { initializeTrackingDataLayer } from "@/lib/trackingDataLayer";

interface Props {
  children: ReactNode;
}

/**
 * Anti-clone guard for the quiz.
 * Allows access if ANY of these conditions is true:
 * 1. URL has utm_source, fbclid, gclid, src, or sck (ad traffic)
 * 2. Stored tracking data has utm_source, fbclid, or gclid (previously entered via ad)
 * 3. Quiz already in progress (user navigating between steps)
 * 4. Referrer is from known ad platforms (Facebook in-app browser sometimes strips params)
 *
 * This ensures ZERO false positives for legitimate buyers.
 */
const QuizGuard = ({ children }: Props) => {
  const isAuthorized = useMemo(() => {
    // Ensure tracking data is initialized BEFORE we check
    // This captures UTMs from URL into localStorage immediately
    try {
      initializeTrackingDataLayer();
    } catch {}

    // Check 1: Ad-related params in current URL
    // Facebook Ads may strip utm_source but keep fbclid
    // Google Ads may strip utm_source but keep gclid
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("utm_source")) return true;
      if (params.get("fbclid")) return true;
      if (params.get("gclid")) return true;
      if (params.get("src")) return true;
      if (params.get("sck")) return true;
      if (params.get("xcod")) return true;
    } catch {}

    // Check 2: Previously stored tracking data (user already entered via ad)
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

    // Check 4: Quiz already in progress (navigating between steps)
    try {
      const quizAnswers = sessionStorage.getItem("quiz_answers");
      if (quizAnswers) {
        const parsed = JSON.parse(quizAnswers);
        if (parsed && Object.keys(parsed).length > 0) return true;
      }
    } catch {}

    // Check 5: Referrer from known ad platforms
    // Facebook in-app browser sometimes strips ALL params
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

    // Check 6: Facebook cookie exists (user came from FB ad previously)
    try {
      if (document.cookie.includes("_fbp=") || document.cookie.includes("_fbc=")) {
        return true;
      }
    } catch {}

    return false;
  }, []);

  if (!isAuthorized) {
    return <GhostPage />;
  }

  return <>{children}</>;
};

export default QuizGuard;
