import Step13Offer from "@/components/quiz/Step13Offer";

/**
 * Rota de PREVIEW da antiga página de oferta / pré-checkout (Step13Offer),
 * que hoje está desativada no funil. Serve só para VISUALIZAR como estava.
 * Rota isolada e removível — não faz parte do funil.
 */
export default function PreviewOfertaAntiga() {
  return (
    <div className="min-h-[100dvh] bg-background">
      <div className="bg-amber-500/10 border-b border-amber-500/30 text-center py-1.5 text-[11px] text-amber-300">
        PRÉVIA — página de oferta antiga (Step13Offer), desativada no funil. Só para visualização.
      </div>
      <Step13Offer />
    </div>
  );
}
