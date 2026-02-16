import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import UpsellLayout from "./UpsellLayout";
import UpsellMultiplicador from "./UpsellMultiplicador";
import KirvanoOneClick from "./KirvanoOneClick";
import { getLeadName, captureKirvanoToken, navigateToUpsell, buildUpsellURL } from "@/lib/upsellData";
import { usePagePresence } from "@/hooks/usePagePresence";
import { saveFunnelEvent } from "@/lib/metricsClient";

const Upsell2Page = () => {
  // CRITICAL: capture token BEFORE buildUpsellURL runs
  captureKirvanoToken();

  const name = getLeadName();
  const navigate = useNavigate();

  usePagePresence("/upsell2");

  useEffect(() => {
    // Preserve query params (kirvano token) in URL for Kirvano script to read
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

  // Token is already in sessionStorage from captureKirvanoToken above
  const upsell3URL = buildUpsellURL("https://ganhostempolivre.lovable.app/upsell3");

  const offerMap = useMemo(() => ({
    "btn-prata": {
      offer: "b61b6335-9325-4ecb-9b87-8214d948e90e",
      nextPageURL: upsell3URL,
      refusePageURL: upsell3URL,
    },
    "btn-ouro": {
      offer: "2f8e1d23-b71c-4c4b-9da1-672a6ca75c9b",
      nextPageURL: upsell3URL,
      refusePageURL: upsell3URL,
    },
    "btn-diamante": {
      offer: "e7d1995f-9b55-47d0-a1c4-762b07721162",
      nextPageURL: upsell3URL,
      refusePageURL: upsell3URL,
    },
  }), [upsell3URL]);

  return (
    <UpsellLayout progress={85}>
      <KirvanoOneClick offerMap={offerMap} />
      <UpsellMultiplicador name={name} onNext={goNext} onDecline={goNext} />
    </UpsellLayout>
  );
};

export default Upsell2Page;
