import { supabase } from "@/integrations/supabase/client";

export interface OfferPlan {
  id: string;
  price: number;
  installments: string;
  checkoutUrl: string;
}

/**
 * Fetches sensitive offer data (prices, checkout URLs) from the backend.
 * This ensures checkout URLs are never exposed in the frontend source code.
 */
export const fetchOfferData = async (offerKey: string): Promise<OfferPlan[] | null> => {
  try {
    // Get session_id from tracking data
    let sessionId = "";
    try {
      const td = localStorage.getItem("tracking_data_layer");
      if (td) sessionId = JSON.parse(td).session_id || "";
    } catch {}

    if (!sessionId) return null;

    const { data, error } = await supabase.functions.invoke("offer-data", {
      body: { offer_key: offerKey, session_id: sessionId },
    });

    if (error || !data?.plans) return null;
    return data.plans as OfferPlan[];
  } catch {
    return null;
  }
};
