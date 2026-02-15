import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Reads the user's first name from quiz sessionStorage data.
 */
export const getLeadName = (): string => {
  try {
    const raw = sessionStorage.getItem("quizAnswers");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.name && parsed.name.trim()) return parsed.name.trim().split(" ")[0];
    }
  } catch {}
  try {
    const raw = localStorage.getItem("upsell_lead_data");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.name && parsed.name !== "Visitante") return parsed.name.trim().split(" ")[0];
    }
  } catch {}
  return "Visitante";
};

/**
 * Reads the price the lead paid from quiz data or localStorage.
 */
export const getLeadPricePaid = (): number => {
  try {
    const raw = sessionStorage.getItem("quizAnswers");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.accountBalance) {
        const map: Record<string, number> = {
          "menos100": 37, "100-500": 47, "500-2000": 66, "2000-10000": 97, "10000+": 147,
        };
        return map[parsed.accountBalance] || 37;
      }
    }
  } catch {}
  return 37;
};

/**
 * Gets the session_id for matching purchases
 */
export const getSessionId = (): string => {
  try {
    const td = localStorage.getItem("tracking_data_layer");
    if (td) return JSON.parse(td).session_id || "";
  } catch {}
  return "";
};

export interface UpsellChoice {
  accelerator: "basico" | "duplo" | "maximo" | null;
  guide: boolean;
  price: number;
}

export interface UpsellExtras {
  multiplicador?: { plan: string; price: number } | null;
  blindagem?: { price: number } | null;
  circulo?: { price: number } | null;
}

const UPSELL_CHOICE_KEY = "upsell_choice";
const UPSELL_EXTRAS_KEY = "upsell_extras";

export const saveUpsellChoice = (choice: UpsellChoice) => {
  localStorage.setItem(UPSELL_CHOICE_KEY, JSON.stringify(choice));
};

export const getUpsellChoice = (): UpsellChoice => {
  try {
    const stored = localStorage.getItem(UPSELL_CHOICE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { accelerator: null, guide: false, price: 0 };
};

export const saveUpsellExtras = (key: keyof UpsellExtras, value: Record<string, unknown>) => {
  const current = getUpsellExtras();
  (current as Record<string, unknown>)[key] = value;
  localStorage.setItem(UPSELL_EXTRAS_KEY, JSON.stringify(current));
};

export const getUpsellExtras = (): UpsellExtras => {
  try {
    const stored = localStorage.getItem(UPSELL_EXTRAS_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return {};
};

/**
 * Hook: listens for purchase confirmation via Supabase Realtime.
 * When a SALE_APPROVED event is detected for any matching session/email,
 * it triggers the callback immediately.
 */
export const usePurchaseDetection = (onPurchaseDetected: () => void) => {
  const [detected, setDetected] = useState(false);

  useEffect(() => {
    const sessionId = getSessionId();

    // Listen for inserts and updates on purchase_tracking
    const channel = supabase
      .channel("upsell-purchase-watch")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "purchase_tracking",
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          if (row && row.status === "approved") {
            // Match by session or just any approved purchase
            if (!sessionId || row.session_id === sessionId || !row.session_id) {
              setDetected(true);
              onPurchaseDetected();
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onPurchaseDetected]);

  return detected;
};
