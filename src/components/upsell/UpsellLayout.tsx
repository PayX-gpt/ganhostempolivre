import { ReactNode, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";

interface UpsellLayoutProps {
  children: ReactNode;
  progress: number;
}

const UpsellLayout = ({ children, progress }: UpsellLayoutProps) => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [location.pathname]);

  return (
    <div className="min-h-screen" style={{ background: "#020617", fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center py-3" style={{ background: "#020617", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <span style={{ fontSize: 14, letterSpacing: 3, fontWeight: 600, color: "#fff" }}>
          <span style={{ color: "#16A34A" }}>G</span>ANHOS COM TEMPO LIVRE
        </span>
      </header>

      {/* Progress bar */}
      <div className="fixed top-[45px] left-0 right-0 z-50 h-1" style={{ background: "rgba(255,255,255,0.06)" }}>
        <motion.div
          className="h-full"
          style={{ background: "#16A34A" }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>

      {/* Content */}
      <main className="pt-14 pb-12 px-4 mx-auto" style={{ maxWidth: 480 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default UpsellLayout;
