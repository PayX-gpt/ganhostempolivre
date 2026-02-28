import { ReactNode } from "react";
import { motion } from "framer-motion";
import { LanguageSelector } from "@/lib/i18n";

interface UpsellLayoutProps {
  children: ReactNode;
  progress: number;
}

const UpsellLayout = ({ children, progress }: UpsellLayoutProps) => {
  return (
    <div className="min-h-screen" style={{ background: "#020617", fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3.5 backdrop-blur-sm" style={{ background: "rgba(2,6,23,0.95)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <span style={{ fontSize: 13, letterSpacing: 3, fontWeight: 600, color: "rgba(248,250,252,0.9)" }}>
          <span style={{ color: "#16A34A", fontWeight: 700 }}>G</span>ANHOS COM TEMPO LIVRE
        </span>
        <LanguageSelector />
      </header>

      {/* Progress bar */}
      <div className="fixed top-[49px] left-0 right-0 z-50 h-[3px]" style={{ background: "rgba(255,255,255,0.04)" }}>
        <motion.div
          className="h-full rounded-r-full"
          style={{ background: "linear-gradient(90deg, #16A34A, #22C55E)" }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>

      {/* Content */}
      <main className="pt-16 pb-16 px-5 mx-auto" style={{ maxWidth: 440 }}>
        {children}
      </main>
    </div>
  );
};

export default UpsellLayout;
