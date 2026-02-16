import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import UpsellLayout from "./UpsellLayout";
import UpsellBlindagem from "./UpsellBlindagem";
import KirvanoOneClick from "./KirvanoOneClick";
import { getLeadName, captureKirvanoToken, navigateToUpsell, buildUpsellURL } from "@/lib/upsellData";
import { usePagePresence } from "@/hooks/usePagePresence";
import { saveFunnelEvent } from "@/lib/metricsClient";

const Upsell3Page = () => {
  // CRITICAL: capture token BEFORE buildUpsellURL runs
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

  // Token is already in sessionStorage from captureKirvanoToken above
  const upsell4URL = buildUpsellURL("https://ganhostempolivre.lovable.app/upsell4");

  return (
    <UpsellLayout progress={95}>
      <KirvanoOneClick
        offer="a7cfdcbf-849f-4060-b660-b850f46a0e52"
        nextPageURL={upsell4URL}
        refusePageURL={upsell4URL}
      />
      <UpsellBlindagem name={name} onNext={goNext} onDecline={goNext} />
    </UpsellLayout>
  );
};

export default Upsell3Page;
