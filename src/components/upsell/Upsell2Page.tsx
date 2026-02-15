import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import UpsellLayout from "./UpsellLayout";
import UpsellMultiplicador from "./UpsellMultiplicador";
import { getLeadName } from "@/lib/upsellData";
import { usePagePresence } from "@/hooks/usePagePresence";
import { saveFunnelEvent } from "@/lib/metricsClient";

const Upsell2Page = () => {
  const name = getLeadName();
  const navigate = useNavigate();

  usePagePresence("/upsell2");

  useEffect(() => {
    window.history.pushState(null, "", "/upsell2");
    const onPop = () => window.history.pushState(null, "", "/upsell2");
    window.addEventListener("popstate", onPop);
    saveFunnelEvent("upsell_step_view", { page_id: "/upsell2", name });
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const goNext = () => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    navigate("/upsell3");
  };

  return (
    <UpsellLayout progress={85}>
      <UpsellMultiplicador name={name} onNext={goNext} onDecline={goNext} />
    </UpsellLayout>
  );
};

export default Upsell2Page;
