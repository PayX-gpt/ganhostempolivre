import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import UpsellLayout from "./UpsellLayout";
import UpsellCirculoInterno from "./UpsellCirculoInterno";
import { getLeadName, captureKirvanoToken, navigateToUpsell } from "@/lib/upsellData";
import { usePagePresence } from "@/hooks/usePagePresence";
import { saveFunnelEvent } from "@/lib/metricsClient";

const Upsell4Page = () => {
  captureKirvanoToken();

  const name = getLeadName();
  const navigate = useNavigate();

  usePagePresence("/upsell4");

  useEffect(() => {
    const qs = window.location.search;
    window.history.pushState(null, "", `${import.meta.env.BASE_URL}upsell4${qs}`);
    const onPop = () => window.history.pushState(null, "", `${import.meta.env.BASE_URL}upsell4${qs}`);
    window.addEventListener("popstate", onPop);
    saveFunnelEvent("upsell_step_view", { page_id: "/upsell4", name });
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const goNext = () => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    navigateToUpsell(navigate, "/upsell5");
  };

  return (
    <UpsellLayout progress={96}>
      <UpsellCirculoInterno name={name} onNext={goNext} onDecline={goNext} />
    </UpsellLayout>
  );
};

export default Upsell4Page;
