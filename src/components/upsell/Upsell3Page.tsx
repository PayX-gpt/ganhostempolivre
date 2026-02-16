import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import UpsellLayout from "./UpsellLayout";
import UpsellBlindagem from "./UpsellBlindagem";
import { getLeadName, captureKirvanoToken, navigateToUpsell } from "@/lib/upsellData";
import { usePagePresence } from "@/hooks/usePagePresence";
import { saveFunnelEvent } from "@/lib/metricsClient";

const Upsell3Page = () => {
  captureKirvanoToken();

  const name = getLeadName();
  const navigate = useNavigate();

  usePagePresence("/upsell3");

  useEffect(() => {
    const qs = window.location.search;
    window.history.pushState(null, "", `/upsell3${qs}`);
    const onPop = () => window.history.pushState(null, "", `/upsell3${qs}`);
    window.addEventListener("popstate", onPop);
    saveFunnelEvent("upsell_step_view", { page_id: "/upsell3", name });
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const goNext = () => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    navigateToUpsell(navigate, "/upsell4");
  };

  return (
    <UpsellLayout progress={95}>
      <UpsellBlindagem name={name} onNext={goNext} onDecline={goNext} />
    </UpsellLayout>
  );
};

export default Upsell3Page;
