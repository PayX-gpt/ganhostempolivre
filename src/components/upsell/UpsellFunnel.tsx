import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import UpsellLayout from "./UpsellLayout";
import UpsellStep1 from "./UpsellStep1";
import UpsellStep2 from "./UpsellStep2";
import UpsellStep3 from "./UpsellStep3";
import UpsellStep4 from "./UpsellStep4";
import UpsellStep5 from "./UpsellStep5";
import UpsellMultiplicador from "./UpsellMultiplicador";
import UpsellBlindagem from "./UpsellBlindagem";
import UpsellCirculoInterno from "./UpsellCirculoInterno";
import UpsellStep6 from "./UpsellStep6";
import { getLeadName } from "@/lib/upsellData";
import { usePagePresence } from "@/hooks/usePagePresence";
import { saveFunnelEvent } from "@/lib/metricsClient";

// Steps: 1-Confirm, 2-Analysis, 3-Accelerator Plans, 4-Checkout, 5-Downsell,
//        6-Multiplicador, 7-Blindagem, 8-Círculo Interno, 9-Success
const progressMap: Record<number, number> = {
  1: 10, 2: 25, 3: 50, 4: 65, 5: 65,
  6: 75, 7: 85, 8: 95, 9: 100,
};

const UPSELL_PAGE_IDS: Record<number, string> = {
  1: "/upsell-confirmacao",
  2: "/upsell-analise",
  3: "/upsell-planos",
  4: "/upsell-checkout",
  5: "/upsell-downsell",
  6: "/upsell-multiplicador",
  7: "/upsell-blindagem",
  8: "/upsell-circulo",
  9: "/upsell-sucesso",
};

const UpsellFunnel = () => {
  const [step, setStep] = useState(1);
  const name = getLeadName();

  usePagePresence(UPSELL_PAGE_IDS[step] || "/upsell1");

  useEffect(() => {
    window.history.pushState(null, "", "/upsell1");
    const onPop = () => window.history.pushState(null, "", "/upsell1");
    window.addEventListener("popstate", onPop);
    saveFunnelEvent("upsell_step_view", { step: 1, page_id: UPSELL_PAGE_IDS[1], name });
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const goTo = useCallback((s: number) => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    saveFunnelEvent("upsell_step_view", { step: s, page_id: UPSELL_PAGE_IDS[s], name });
    setStep(s);
  }, [name]);

  return (
    <UpsellLayout progress={progressMap[step] || 10}>
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
        >
          {step === 1 && <UpsellStep1 name={name} onNext={() => goTo(2)} />}
          {step === 2 && <UpsellStep2 onNext={() => goTo(3)} />}
          {step === 3 && <UpsellStep3 name={name} onNext={() => goTo(4)} onDecline={() => goTo(5)} />}
          {step === 4 && <UpsellStep4 name={name} onNext={() => goTo(6)} onDecline={() => goTo(5)} />}
          {step === 5 && <UpsellStep5 name={name} onBuy={() => goTo(6)} onDecline={() => goTo(6)} />}
          {step === 6 && <UpsellMultiplicador name={name} onNext={() => goTo(7)} onDecline={() => goTo(7)} />}
          {step === 7 && <UpsellBlindagem name={name} onNext={() => goTo(8)} onDecline={() => goTo(8)} />}
          {step === 8 && <UpsellCirculoInterno name={name} onNext={() => goTo(9)} onDecline={() => goTo(9)} />}
          {step === 9 && <UpsellStep6 name={name} />}
        </motion.div>
      </AnimatePresence>
    </UpsellLayout>
  );
};

export default UpsellFunnel;
