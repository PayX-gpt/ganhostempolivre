import { useEffect } from "react";

/**
 * Preloads Panda Video assets into <head> when a component with a Panda
 * iframe mounts. Shaves ~1-2s off the player's cold-start time because the
 * browser fetches CSS, config.json, playlist.m3u8 and warms up DNS in
 * parallel with React's render instead of waiting for the iframe to boot.
 *
 * Why this lives in a hook (and not index.html): this project is a SPA, so
 * index.html is shared by every route. Adding preload links there would
 * download Panda assets on pages that don't have a video (step-1 through
 * step-16 without VariantE, /oferta, /upsell1-4, /upsell6, /live). The hook
 * only fires on routes that actually mount a Panda iframe.
 */

const VZ_ID = "vz-350772d9-cdc";

// Deduplicates link tags across the app lifetime (survives route changes).
const injectedHrefs = new Set<string>();

function addLink(attrs: Record<string, string>) {
  if (injectedHrefs.has(attrs.href)) return;
  injectedHrefs.add(attrs.href);

  const link = document.createElement("link");
  for (const [k, v] of Object.entries(attrs)) {
    link.setAttribute(k, v);
  }
  link.dataset.pandaPreload = "1";
  document.head.appendChild(link);
}

let sharedInjected = false;
function injectSharedPreloads() {
  if (sharedInjected) return;
  sharedInjected = true;

  // Player CSS — same files for every video in this library
  addLink({ rel: "preload", href: `https://player-${VZ_ID}.tv.pandavideo.com.br/embed/css/plyr.css`, as: "style" });
  addLink({ rel: "preload", href: `https://player-${VZ_ID}.tv.pandavideo.com.br/embed/css/styles.css`, as: "style" });
  addLink({ rel: "preload", href: `https://player-${VZ_ID}.tv.pandavideo.com.br/embed/css/pb.css`, as: "style" });

  // Library-level config (shared by every video)
  addLink({ rel: "preload", href: `https://config.tv.pandavideo.com.br/${VZ_ID}/config.json`, as: "fetch", crossorigin: "" });

  // DNS warm-up for video segments CDN + player host
  addLink({ rel: "dns-prefetch", href: `https://b-${VZ_ID}.tv.pandavideo.com.br` });
  addLink({ rel: "dns-prefetch", href: `https://player-${VZ_ID}.tv.pandavideo.com.br` });
}

export function usePandaPreload(videoId: string | null | undefined) {
  useEffect(() => {
    if (!videoId) return;

    injectSharedPreloads();

    // Per-video assets
    addLink({ rel: "preload", href: `https://config.tv.pandavideo.com.br/${VZ_ID}/${videoId}.json`, as: "fetch", crossorigin: "" });
    addLink({ rel: "preload", href: `https://b-${VZ_ID}.tv.pandavideo.com.br/${videoId}/playlist.m3u8`, as: "fetch", crossorigin: "" });
    addLink({ rel: "prerender", href: `https://player-${VZ_ID}.tv.pandavideo.com.br/embed/?v=${videoId}` });
  }, [videoId]);
}
