import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import UpsellLayout from "./UpsellLayout";
import UpsellMultiplicador from "./UpsellMultiplicador";
import KirvanoOneClick from "./KirvanoOneClick";
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

  const offerMap = useMemo(() => ({
    "btn-prata": {
      offer: "b61b6335-9325-4ecb-9b87-8214d948e90e",
      nextPageURL: "https://ganhostempolivre.lovable.app/upsell3",
      refusePageURL: "https://ganhostempolivre.lovable.app/upsell3",
    },
    "btn-ouro": {
      offer: "2f8e1d23-b71c-4c4b-9da1-672a6ca75c9b",
      nextPageURL: "https://ganhostempolivre.lovable.app/upsell3",
      refusePageURL: "https://ganhostempolivre.lovable.app/upsell3",
    },
    "btn-diamante": {
      offer: "e7d1995f-9b55-47d0-a1c4-762b07721162",
      nextPageURL: "https://ganhostempolivre.lovable.app/upsell3",
      refusePageURL: "https://ganhostempolivre.lovable.app/upsell3",
    },
  }), []);

  return (
    <UpsellLayout progress={85}>
      <KirvanoOneClick offerMap={offerMap} />
      <UpsellMultiplicador name={name} onNext={goNext} onDecline={goNext} />
    </UpsellLayout>
  );
};

export default Upsell2Page;
