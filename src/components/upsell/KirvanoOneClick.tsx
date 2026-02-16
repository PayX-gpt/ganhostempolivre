import { useEffect, useRef } from "react";

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
  }
}

/**
 * Injects the Kirvano one-click upsell script into the page.
 * 
 * Single offer mode: sets window.offer once.
 * Multi offer mode (offerMap): uses mousedown listeners on buttons
 * to set window.offer dynamically BEFORE the Kirvano script's click handler fires.
 */
const KirvanoOneClick = ({ offer, nextPageURL, refusePageURL, offerMap }: Props) => {
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const listenersRef = useRef<Array<{ el: Element; handler: () => void }>>([]);

  useEffect(() => {
    // Set global variables for single offer mode
    if (offer) {
      window.offer = offer;
    }
    if (nextPageURL !== undefined) {
      window.nextPageURL = nextPageURL;
    }
    if (refusePageURL !== undefined) {
      window.refusePageURL = refusePageURL;
    }

    // For multi-offer mode, attach mousedown listeners to set the correct offer
    // mousedown fires before click, so Kirvano's click handler will read the right offer
    if (offerMap) {
      const setupListeners = () => {
        // Clean up previous listeners
        listenersRef.current.forEach(({ el, handler }) => {
          el.removeEventListener("mousedown", handler);
          el.removeEventListener("touchstart", handler);
        });
        listenersRef.current = [];

        Object.entries(offerMap).forEach(([buttonId, entry]) => {
          const el = document.getElementById(buttonId);
          if (el) {
            const handler = () => {
              window.offer = entry.offer;
              if (entry.nextPageURL !== undefined) window.nextPageURL = entry.nextPageURL;
              if (entry.refusePageURL !== undefined) window.refusePageURL = entry.refusePageURL;
            };
            el.addEventListener("mousedown", handler, { passive: true });
            el.addEventListener("touchstart", handler, { passive: true });
            listenersRef.current.push({ el, handler });
          }
        });
      };

      // Wait for buttons to render, then set up listeners
      const raf = requestAnimationFrame(() => {
        setTimeout(setupListeners, 100);
      });

      // Inject script AFTER listeners are set up
      const scriptTimer = setTimeout(() => {
        // Remove old script if it exists
        if (scriptRef.current) {
          try { document.body.removeChild(scriptRef.current); } catch {}
        }

        const script = document.createElement("script");
        // Cache-bust to ensure re-execution on SPA navigation
        script.src = `https://snippets.kirvano.com/upsell.min.js?t=${Date.now()}`;
        script.async = true;
        document.body.appendChild(script);
        scriptRef.current = script;
      }, 200);

      return () => {
        cancelAnimationFrame(raf);
        clearTimeout(scriptTimer);
        listenersRef.current.forEach(({ el, handler }) => {
          el.removeEventListener("mousedown", handler);
          el.removeEventListener("touchstart", handler);
        });
        listenersRef.current = [];
        if (scriptRef.current) {
          try { document.body.removeChild(scriptRef.current); } catch {}
          scriptRef.current = null;
        }
        delete window.offer;
        delete window.nextPageURL;
        delete window.refusePageURL;
      };
    }

    // Single offer mode: inject script with slight delay for DOM readiness
    const timer = setTimeout(() => {
      if (scriptRef.current) {
        try { document.body.removeChild(scriptRef.current); } catch {}
      }

      const script = document.createElement("script");
      script.src = `https://snippets.kirvano.com/upsell.min.js?t=${Date.now()}`;
      script.async = true;
      document.body.appendChild(script);
      scriptRef.current = script;
    }, 150);

    return () => {
      clearTimeout(timer);
      if (scriptRef.current) {
        try { document.body.removeChild(scriptRef.current); } catch {}
        scriptRef.current = null;
      }
      delete window.offer;
      delete window.nextPageURL;
      delete window.refusePageURL;
    };
  }, [offer, nextPageURL, refusePageURL, offerMap]);

  return null;
};

export default KirvanoOneClick;
