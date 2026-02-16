import { ReactNode, useMemo } from "react";
import GhostPage from "../upsell/GhostPage";

interface Props {
  children: ReactNode;
}

/**
 * Anti-clone guard for the quiz itself.
 * Only users arriving from an ad (with utm_source) can see the real quiz.
 * Everyone else sees the "Vagas Encerradas" ghost page.
 */
const QuizGuard = ({ children }: Props) => {
  const isAuthorized = useMemo(() => {
    // Check 1: utm_source in current URL (first visit from ad)
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("utm_source")) return true;
    } catch {}

    // Check 2: Previously stored tracking data (user already entered via ad)
    try {
      const stored = localStorage.getItem("tracking_data_layer");
      if (stored) {
        const td = JSON.parse(stored);
        if (td.utm_source) return true;
      }
    } catch {}

    // Check 3: Session-level tracking (navigation within the quiz)
    try {
      const session = sessionStorage.getItem("tracking_session");
      if (session) {
        const sd = JSON.parse(session);
        if (sd.utm_source) return true;
      }
    } catch {}

    // Check 4: Quiz already in progress (user is navigating between steps)
    try {
      const quizAnswers = sessionStorage.getItem("quiz_answers");
      if (quizAnswers) {
        const parsed = JSON.parse(quizAnswers);
        if (parsed && Object.keys(parsed).length > 0) return true;
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
