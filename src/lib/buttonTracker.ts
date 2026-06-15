/**
 * Global click tracker.
 * Captures every click on <button>, <a>, [role="button"] and [data-track]
 * and stores a `button_click` event in funnel_events.
 *
 * Goal: know exactly where each lead clicked across the whole funnel.
 */
import { saveFunnelEventReliable } from "./metricsClient";

const IGNORED_ROUTE_PREFIXES = ["/live", "/dashboard", "/admin"];

const lastFired = new Map<string, number>();
const THROTTLE_MS = 300;

const getRoute = (): string => {
  try {
    return window.location.pathname || "/";
  } catch {
    return "/";
  }
};

const getQuizStep = (): string | null => {
  const m = getRoute().match(/\/step-(\d+)/);
  return m ? `step-${m[1]}` : null;
};

const cleanText = (el: HTMLElement): string => {
  // innerText respects visibility; fallback to textContent
  const raw = (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim();
  return raw.slice(0, 80);
};

const resolveTrackable = (target: EventTarget | null): HTMLElement | null => {
  if (!(target instanceof Element)) return null;
  const el = target.closest<HTMLElement>(
    'button, a, [role="button"], [data-track], input[type="submit"], input[type="button"]'
  );
  if (!el) return null;
  if (el.getAttribute("data-track-skip-auto") === "true") return null;
  if (el.getAttribute("aria-hidden") === "true") return null;
  return el;
};

let initialized = false;

export const initButtonTracker = (): void => {
  if (initialized || typeof document === "undefined") return;
  initialized = true;

  document.addEventListener(
    "click",
    (event) => {
      try {
        const route = getRoute();
        if (IGNORED_ROUTE_PREFIXES.some((p) => route.startsWith(p))) return;

        const el = resolveTrackable(event.target);
        if (!el) return;

        const trackId =
          el.getAttribute("data-track") ||
          el.getAttribute("data-testid") ||
          el.id ||
          null;

        const label = cleanText(el) || el.getAttribute("aria-label") || "(sem texto)";
        const tag = el.tagName.toLowerCase();
        const href = (el as HTMLAnchorElement).href || null;

        // Throttle key: prefer trackId, else label+route
        const throttleKey = `${route}::${trackId || label}`;
        const now = Date.now();
        const last = lastFired.get(throttleKey) || 0;
        if (now - last < THROTTLE_MS) return;
        lastFired.set(throttleKey, now);

        // Position among siblings of same tag in the page (helps disambiguate)
        let position: number | null = null;
        try {
          const all = Array.from(document.querySelectorAll(tag));
          position = all.indexOf(el);
        } catch {
          /* ignore */
        }

        saveFunnelEventReliable("button_click", {
          track_id: trackId,
          label,
          route,
          step: getQuizStep(),
          tag,
          href,
          position,
          variant: el.getAttribute("data-variant") || null,
        });
      } catch {
        // never break user flow
      }
    },
    { capture: true, passive: true }
  );
};
