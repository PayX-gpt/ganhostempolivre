import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import UpsellLayout from "./UpsellLayout";
import UpsellMultiplicador from "./UpsellMultiplicador";
import { getLeadName, captureKirvanoToken, navigateToUpsell } from "@/lib/upsellData";
import { usePagePresence } from "@/hooks/usePagePresence";
import { saveFunnelEvent } from "@/lib/metricsClient";

const Upsell2Page = () => {
  captureKirvanoToken();

  const name = getLeadName();
  const navigate = useNavigate();

  usePagePresence("/upsell2");

  useEffect(() => {
    const qs = window.location.search;
    window.history.pushState(null, "", `/upsell2${qs}`);
    const onPop = () => window.history.pushState(null, "", `/upsell2${qs}`);
    window.addEventListener("popstate", onPop);
    saveFunnelEvent("upsell_step_view", { page_id: "/upsell2", name });
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const goNext = () => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    navigateToUpsell(navigate, "/upsell3");
  };

  return (
    <UpsellLayout progress={85}>
      <UpsellMultiplicador name={name} onNext={goNext} onDecline={goNext} />
    </UpsellLayout>
  );
};

export default Upsell2Page;
