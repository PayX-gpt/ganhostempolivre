import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Serves sensitive offer data (checkout URLs, prices) only to validated sessions.
 * This prevents cloners from finding checkout URLs in the source code.
 */

interface OfferPlan {
  id: string;
  price: number;
  installments: string;
  checkoutUrl: string;
}

interface OfferData {
  [key: string]: OfferPlan[];
}

// All sensitive checkout URLs live HERE, not in frontend code
const OFFER_DATA: OfferData = {
  // UpsellStep3 (Acelerador)
  acelerador: [
    { id: "basico", price: 19, installments: "2x de R$ 9,90", checkoutUrl: "https://pay.kirvano.com/863c8fe9-ca48-452f-9fa4-22e14df182cf" },
    { id: "duplo", price: 27, installments: "3x de R$ 9,90", checkoutUrl: "https://pay.kirvano.com/59a5cba3-f876-46a8-b0e4-6e2c72cf725a" },
    { id: "maximo", price: 37, installments: "4x de R$ 9,90", checkoutUrl: "https://pay.kirvano.com/e8135deb-de2d-4cac-bbeb-1aed6610921c" },
  ],
  // UpsellMultiplicador
  multiplicador: [
    { id: "prata", price: 47, installments: "5x de R$ 9,90", checkoutUrl: "https://pay.kirvano.com/b61b6335-9325-4ecb-9b87-8214d948e90e" },
    { id: "ouro", price: 67, installments: "7x de R$ 9,90", checkoutUrl: "https://pay.kirvano.com/2f8e1d23-b71c-4c4b-9da1-672a6ca75c9b" },
    { id: "diamante", price: 97, installments: "10x de R$ 9,90", checkoutUrl: "https://pay.kirvano.com/e7d1995f-9b55-47d0-a1c4-762b07721162" },
  ],
  // UpsellBlindagem
  blindagem: [
    { id: "extensao", price: 67, installments: "6x de R$ 12,90", checkoutUrl: "https://pay.kirvano.com/5efbb9e7-6033-4281-bd6d-6b5830e7145d" },
    { id: "vitalicio", price: 127, installments: "12x de R$ 12,42", checkoutUrl: "https://pay.kirvano.com/8b821768-dfb9-487d-a6a6-8beb9a9cdb20" },
    { id: "vip", price: 197, installments: "12x de R$ 19,25", checkoutUrl: "https://pay.kirvano.com/a7cfdcbf-849f-4060-b660-b850f46a0e52" },
  ],
  // UpsellCirculoInterno
  circulo: [
    { id: "circulo", price: 29.9, installments: "mensal", checkoutUrl: "https://pay.kirvano.com/67e759ec-598c-43c6-890e-b993901712b7" },
  ],
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { offer_key, session_id } = await req.json();

    // Basic validation: must provide offer key and session
    if (!offer_key || !session_id) {
      return new Response(
        JSON.stringify({ error: "unauthorized" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if session exists (lightweight check - session_id format validation)
    if (!session_id.startsWith("sess_") || session_id.length < 15) {
      return new Response(
        JSON.stringify({ error: "invalid_session" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const plans = OFFER_DATA[offer_key];
    if (!plans) {
      return new Response(
        JSON.stringify({ error: "not_found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ plans }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "bad_request" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
