import { useEffect } from "react";

interface OfferMapEntry {
  offer: string;
  nextPageURL: string | null;
  refusePageURL: string | null;
}

interface Props {
  /** Single offer ID (for pages with one buy button) */
  offer?: string;
  /** Next page URL after accept */
  nextPageURL?: string | null;
  /** Next page URL after refuse */
  refusePageURL?: string | null;
  /** Multiple offers mapped by button ID (for pages with multiple buy buttons) */
  offerMap?: Record<string, OfferMapEntry>;
}

declare global {
  interface Window {
    offer?: string;
    nextPageURL?: string | null;
    refusePageURL?: string | null;
    offerMap?: Record<string, OfferMapEntry>;
  }
}

/**
 * Injects the Kirvano one-click upsell script into the page.
 * Supports both single offer mode and multiple offers (offerMap).
 */
const KirvanoOneClick = ({ offer, nextPageURL, refusePageURL, offerMap }: Props) => {
  useEffect(() => {
    // Set global variables that the Kirvano script reads
    if (offerMap) {
      window.offerMap = offerMap;
    }
    if (offer) {
      window.offer = offer;
    }
    if (nextPageURL !== undefined) {
      window.nextPageURL = nextPageURL;
    }
    if (refusePageURL !== undefined) {
      window.refusePageURL = refusePageURL;
    }

    const script = document.createElement("script");
    script.src = "https://snippets.kirvano.com/upsell.min.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      try { document.body.removeChild(script); } catch {}
      delete window.offer;
      delete window.nextPageURL;
      delete window.refusePageURL;
      delete window.offerMap;
    };
  }, [offer, nextPageURL, refusePageURL, offerMap]);

  return null;
};

export default KirvanoOneClick;
