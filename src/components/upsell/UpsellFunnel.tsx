import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import UpsellLayout from "./UpsellLayout";
import UpsellStep1 from "./UpsellStep1";
import UpsellStep2 from "./UpsellStep2";
import UpsellStep3 from "./UpsellStep3";
import UpsellStep4 from "./UpsellStep4";
import UpsellStep5 from "./UpsellStep5";
import UpsellStep6 from "./UpsellStep6";
import { initUpsellData } from "@/lib/upsellData";

const progressMap: Record<number, number> = {
  1: 10,
  2: 25,
  3: 50,
  4: 75,
  5: 75,
  6: 100,
};

const UpsellFunnel = () => {
  const [step, setStep] = useState(1);

  useEffect(() => {
    initUpsellData();
  }, []);

  // Block browser back button — restart on reload
  useEffect(() => {
    window.history.pushState(null, "", "/upsell1");
    const onPop = () => {
      window.history.pushState(null, "", "/upsell1");
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const goTo = useCallback((s: number) => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    setStep(s);
  }, []);

  return (
    <UpsellLayout progress={progressMap[step] || 10}>
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {step === 1 && <UpsellStep1 onNext={() => goTo(2)} />}
          {step === 2 && <UpsellStep2 onNext={() => goTo(3)} />}
          {step === 3 && <UpsellStep3 onNext={() => goTo(4)} onDecline={() => goTo(5)} />}
          {step === 4 && <UpsellStep4 onNext={() => goTo(6)} onDecline={() => goTo(5)} />}
          {step === 5 && <UpsellStep5 onBuy={() => goTo(6)} onDecline={() => goTo(6)} />}
          {step === 6 && <UpsellStep6 />}
        </motion.div>
      </AnimatePresence>
    </UpsellLayout>
  );
};

export default UpsellFunnel;
