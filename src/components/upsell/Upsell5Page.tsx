import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import UpsellLayout from "./UpsellLayout";
import UpsellSafetyPro from "./UpsellSafetyPro";
import { getLeadName, captureKirvanoToken, navigateToUpsell } from "@/lib/upsellData";
import { usePagePresence } from "@/hooks/usePagePresence";
import { saveFunnelEvent } from "@/lib/metricsClient";

const Upsell5Page = () => {
  captureKirvanoToken();

  const name = getLeadName();
  const navigate = useNavigate();

  usePagePresence("/upsell5");

  useEffect(() => {
    const qs = window.location.search;
    window.history.pushState(null, "", `/upsell5${qs}`);
    const onPop = () => window.history.pushState(null, "", `/upsell5${qs}`);
    window.addEventListener("popstate", onPop);
    saveFunnelEvent("upsell_step_view", { page_id: "/upsell5", name });
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const goNext = () => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    navigateToUpsell(navigate, "/upsell6");
  };

  return (
    <UpsellLayout progress={97}>
      <UpsellSafetyPro name={name} onNext={goNext} onDecline={goNext} />
    </UpsellLayout>
  );
};

export default Upsell5Page;
