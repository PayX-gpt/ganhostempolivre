import { ReactNode, useMemo } from "react";
import GhostPage from "./GhostPage";

interface Props {
  children: ReactNode;
}

/**
 * Anti-clone guard. Only users who completed the quiz (quizAnswers in sessionStorage)
 * OR arrived via Kirvano redirect (kirvano_upsell token) can see the real offer.
 * Everyone else sees the "Vagas Encerradas" ghost page.
 */
const FunnelGuard = ({ children }: Props) => {
  const isAuthorized = useMemo(() => {
    // Level 1: Quiz completion token
    try {
      const quizRaw = sessionStorage.getItem("quizAnswers");
      if (quizRaw) {
        const parsed = JSON.parse(quizRaw);
        // Must have at least a name or some quiz data
        if (parsed && (parsed.name || parsed.age || parsed.incomeGoal)) {
          return true;
        }
      }
    } catch {}

    // Level 2: Kirvano redirect token (user came from checkout)
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("kirvano_upsell")) return true;
      if (params.get("__lovable_token")) return true;
      if (sessionStorage.getItem("kirvano_upsell_token")) return true;
    } catch {}

    // Level 3: Lead data from the quiz flow
    try {
      const leadData = localStorage.getItem("upsell_lead_data");
      if (leadData) {
        const parsed = JSON.parse(leadData);
        if (parsed && parsed.name && parsed.name !== "Visitante") return true;
      }
    } catch {}

    // Level 4: Tracking data with valid session (user came from ad)
    try {
      const trackingRaw = localStorage.getItem("tracking_data_layer");
      if (trackingRaw) {
        const td = JSON.parse(trackingRaw);
        // Must have UTM source (came from ad) or have funnel events (interacted with quiz)
        if (td.funnel_events && td.funnel_events.length > 0) return true;
        if (td.utm_source && td.landing_page === "/") return true;
      }
    } catch {}

    return false;
  }, []);

  if (!isAuthorized) {
    return <GhostPage />;
  }

  return <>{children}</>;
};

export default FunnelGuard;
