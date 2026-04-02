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
 * IMPORTANT: This component is designed to be stable across re-renders.
 * It uses JSON serialization to detect actual data changes and avoid
 * constantly tearing down and re-injecting the Kirvano script.
 */
const KirvanoOneClick = ({ offer, nextPageURL, refusePageURL, offerMap }: Props) => {
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const listenersRef = useRef<Array<{ el: Element; handler: () => void }>>([]);
  // Track serialized version to detect real changes
  const prevDataRef = useRef<string>("");

  useEffect(() => {
    // Serialize current props to detect actual changes
    const currentData = JSON.stringify({ offer, nextPageURL, refusePageURL, offerMap });
    const isFirstRun = prevDataRef.current === "";
    const dataChanged = prevDataRef.current !== currentData;

    if (!isFirstRun && !dataChanged) {
      // No real change, skip re-initialization
      return;
    }
    prevDataRef.current = currentData;

    // Clean up previous listeners (but NOT the script unless data actually changed)
    listenersRef.current.forEach(({ el, handler }) => {
      el.removeEventListener("mousedown", handler);
      el.removeEventListener("touchstart", handler);
    });
    listenersRef.current = [];

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
    if (offerMap) {
      const setupListeners = () => {
        // Clean up any stale listeners
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

      // Also set up a MutationObserver to catch dynamically rendered buttons
      const observer = new MutationObserver(() => {
        setupListeners();
      });
      observer.observe(document.body, { childList: true, subtree: true });

      // Stop observing after 2 seconds to avoid performance issues
      const observerTimeout = setTimeout(() => observer.disconnect(), 2000);

      // Inject script only if not already loaded
      const scriptTimer = setTimeout(() => {
        if (scriptRef.current) {
          // Script already loaded, don't re-inject
          return;
        }

        const script = document.createElement("script");
        script.src = `https://snippets.kirvano.com/upsell.min.js?t=${Date.now()}`;
        script.async = true;
        document.body.appendChild(script);
        scriptRef.current = script;
      }, 200);

      return () => {
        cancelAnimationFrame(raf);
        clearTimeout(scriptTimer);
        clearTimeout(observerTimeout);
        observer.disconnect();
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

    // Single offer mode: inject script only once
    const timer = setTimeout(() => {
      if (scriptRef.current) {
        return;
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
  }); // No dependency array - runs every render but uses ref to skip no-ops

  return null;
};

export default KirvanoOneClick;
