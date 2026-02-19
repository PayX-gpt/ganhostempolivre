import { useEffect, useState } from "react";
import UpsellLayout from "./UpsellLayout";
import UpsellForexMentoria from "./UpsellForexMentoria";
import UpsellStep6 from "./UpsellStep6";
import { getLeadName, captureKirvanoToken } from "@/lib/upsellData";
import { usePagePresence } from "@/hooks/usePagePresence";
import { saveFunnelEvent } from "@/lib/metricsClient";
import { motion, AnimatePresence } from "framer-motion";

const Upsell6Page = () => {
  captureKirvanoToken();

  const name = getLeadName();
  const [showSuccess, setShowSuccess] = useState(false);

  usePagePresence(showSuccess ? "/upsell6-sucesso" : "/upsell6");

  useEffect(() => {
    const qs = window.location.search;
    window.history.pushState(null, "", `/upsell6${qs}`);
    const onPop = () => window.history.pushState(null, "", `/upsell6${qs}`);
    window.addEventListener("popstate", onPop);
    saveFunnelEvent("upsell_step_view", { page_id: "/upsell6", name });
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const goToSuccess = () => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    saveFunnelEvent("upsell_step_view", { page_id: "/upsell6-sucesso", name });
    setShowSuccess(true);
  };

  return (
    <UpsellLayout progress={showSuccess ? 100 : 99}>
      <AnimatePresence mode="wait">
        <motion.div
          key={showSuccess ? "success" : "circulo"}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
        >
          {!showSuccess ? (
            <UpsellForexMentoria name={name} onNext={goToSuccess} onDecline={goToSuccess} />
          ) : (
            <UpsellStep6 name={name} />
          )}
        </motion.div>
      </AnimatePresence>
    </UpsellLayout>
  );
};

export default Upsell6Page;
