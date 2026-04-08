/**
 * Global Tracking Data Layer
 * Centraliza todos os dados de rastreamento em window.trackingData
 */

export interface TrackingData {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  fbclid: string | null;
  gclid: string | null;
  fbp: string | null;
  fbc: string | null;
  ttclid: string | null;
  ttp: string | null;
  xcod: string | null;
  cwr: string | null;
  cname: string | null;
  domain: string | null;
  placement: string | null;
  adset: string | null;
  adname: string | null;
  site: string | null;
  xid: string | null;
  src: string | null;
  sck: string | null;
  vsl_variant: string | null;
  vsl_player_id: string | null;
  session_id: string;
  landing_page: string;
  referrer: string;
  user_agent: string;
  current_step: string;
  funnel_events: string[];
  first_visit: string;
  last_activity: string;
}

const TRACKING_PARAMS = [
  "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term",
  "fbclid", "gclid", "ttclid", "xcod", "cwr", "cname", "domain", "placement",
  "adset", "adname", "site", "xid", "src", "sck",
] as const;

declare global {
  interface Window {
    trackingData: TrackingData;
  }
}

const STORAGE_KEY = "tracking_data_layer";

type QuizVariant = "A" | "B" | "C" | "D";
const QUIZ_VARIANTS: QuizVariant[] = ["A", "B", "C", "D"];

const ensureSessionVariant = (): QuizVariant => {
  const winner = localStorage.getItem("quiz_variant_winner");
  if (winner && QUIZ_VARIANTS.includes(winner as QuizVariant)) {
    const forced = winner as QuizVariant;
    localStorage.setItem("quiz_variant", forced);
    return forced;
  }

  const stored = localStorage.getItem("quiz_variant");
  if (stored && QUIZ_VARIANTS.includes(stored as QuizVariant)) {
    return stored as QuizVariant;
  }

  const assigned = QUIZ_VARIANTS[Math.floor(Math.random() * QUIZ_VARIANTS.length)];
  localStorage.setItem("quiz_variant", assigned);
  return assigned;
};

const generateSessionId = (): string => {
  return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
};

const setCookie = (name: string, value: string, days: number = 30): void => {
  try {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
  } catch (error) {
    console.error("[TrackingDataLayer] Failed to set cookie:", error);
  }
};

const getCookie = (name: string): string | null => {
  try {
    const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
    return match ? decodeURIComponent(match[2]) : null;
  } catch {
    return null;
  }
};

const loadFromStorage = (): Partial<TrackingData> | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const data = stored ? JSON.parse(stored) : null;
    const cookieSrc = getCookie("utmify_src");
    const cookieSck = getCookie("utmify_sck");
    if (data) {
      if (cookieSrc) data.src = cookieSrc;
      if (cookieSck) data.sck = cookieSck;
    }
    return data;
  } catch {
    return null;
  }
};

const extractFacebookCookies = (): { fbp: string | null; fbc: string | null } => {
  return { fbp: getCookie("_fbp"), fbc: getCookie("_fbc") };
};

const extractTikTokCookies = (): { ttp: string | null } => {
  return { ttp: getCookie("_ttp") };
};

const saveToStorage = (data: TrackingData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    sessionStorage.setItem("tracking_session", JSON.stringify(data));
    const fbTracking = { fbp: data.fbp, fbc: data.fbc };
    localStorage.setItem("fb_tracking", JSON.stringify(fbTracking));
    if (data.src) setCookie("utmify_src", data.src);
    if (data.sck) setCookie("utmify_sck", data.sck);
    if (data.fbclid) {
      const fbcValue = data.fbc || `fb.1.${Date.now()}.${data.fbclid}`;
      setCookie("_fbc", fbcValue);
    }
  } catch (error) {
    console.error("[TrackingDataLayer] Failed to save:", error);
  }
};

const extractUrlParams = (): Record<string, string | null> => {
  const params = new URLSearchParams(window.location.search);
  const result: Record<string, string | null> = {};
  TRACKING_PARAMS.forEach((param) => {
    result[param] = params.get(param);
  });
  return result;
};

/** Read early-captured UTMs from the inline head script */
const getEarlyUtm = (): Record<string, string | null> => {
  try {
    const raw = localStorage.getItem('lead_utm');
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
};

export const initializeTrackingDataLayer = (): TrackingData => {
  const urlParams = extractUrlParams();
  const storedData = loadFromStorage();
  const fbCookies = extractFacebookCookies();
  const ttCookies = extractTikTokCookies();
  const earlyUtm = getEarlyUtm();
  const now = new Date().toISOString();
  const currentPath = window.location.pathname;

  const trackingData: TrackingData = {
    utm_source: urlParams.utm_source || storedData?.utm_source || earlyUtm.utm_source || null,
    utm_medium: urlParams.utm_medium || storedData?.utm_medium || earlyUtm.utm_medium || null,
    utm_campaign: urlParams.utm_campaign || storedData?.utm_campaign || earlyUtm.utm_campaign || null,
    utm_content: urlParams.utm_content || storedData?.utm_content || earlyUtm.utm_content || null,
    utm_term: urlParams.utm_term || storedData?.utm_term || earlyUtm.utm_term || null,
    fbclid: urlParams.fbclid || storedData?.fbclid || earlyUtm.fbclid || null,
    gclid: urlParams.gclid || storedData?.gclid || earlyUtm.gclid || null,
    fbp: fbCookies.fbp || storedData?.fbp || null,
    fbc: fbCookies.fbc || storedData?.fbc || null,
    ttclid: urlParams.ttclid || storedData?.ttclid || earlyUtm.ttclid || null,
    ttp: ttCookies.ttp || storedData?.ttp || null,
    xcod: urlParams.xcod || storedData?.xcod || null,
    cwr: urlParams.cwr || storedData?.cwr || null,
    cname: urlParams.cname || storedData?.cname || null,
    domain: urlParams.domain || storedData?.domain || null,
    placement: urlParams.placement || storedData?.placement || null,
    adset: urlParams.adset || storedData?.adset || null,
    adname: urlParams.adname || storedData?.adname || null,
    site: urlParams.site || storedData?.site || null,
    xid: urlParams.xid || storedData?.xid || null,
    src: urlParams.src || storedData?.src || null,
    sck: urlParams.sck || storedData?.sck || null,
    vsl_variant: localStorage.getItem('vsl_variant') || storedData?.vsl_variant || null,
    vsl_player_id: localStorage.getItem('vsl_player_id') || storedData?.vsl_player_id || null,
    session_id: storedData?.session_id || generateSessionId(),
    landing_page: storedData?.landing_page || currentPath,
    referrer: storedData?.referrer || document.referrer || "direct",
    user_agent: navigator.userAgent,
    current_step: currentPath,
    funnel_events: storedData?.funnel_events || [],
    first_visit: storedData?.first_visit || now,
    last_activity: now,
  };

  if (trackingData.fbclid && !trackingData.fbc) {
    trackingData.fbc = `fb.1.${Date.now()}.${trackingData.fbclid}`;
  }

  window.trackingData = trackingData;

  (window as unknown as Record<string, unknown>).__trackingParams = {
    ...trackingData,
    src: trackingData.src,
    sck: trackingData.sck,
  };

  saveToStorage(trackingData);

  if (!storedData) {
    console.log("✅ UTMs capturados:", {
      utm_source: trackingData.utm_source,
      utm_medium: trackingData.utm_medium,
      utm_campaign: trackingData.utm_campaign,
      fbclid: trackingData.fbclid,
      gclid: trackingData.gclid,
      fbp: trackingData.fbp,
      fbc: trackingData.fbc,
      session_id: trackingData.session_id,
    });
  }

  return trackingData;
};

export const updateCurrentStep = (step: string): void => {
  if (!window.trackingData) initializeTrackingDataLayer();
  window.trackingData.current_step = step;
  window.trackingData.last_activity = new Date().toISOString();
  saveToStorage(window.trackingData);
};

export const recordFunnelEvent = (eventName: string): void => {
  if (!window.trackingData) initializeTrackingDataLayer();
  if (!window.trackingData.funnel_events.includes(eventName)) {
    window.trackingData.funnel_events.push(eventName);
  }
  window.trackingData.last_activity = new Date().toISOString();
  saveToStorage(window.trackingData);
};

export const getTrackingDataForCheckout = (): Record<string, string> => {
  if (!window.trackingData) initializeTrackingDataLayer();
  const data = window.trackingData;
  const result: Record<string, string> = {};
  if (data.utm_source) result.utm_source = data.utm_source;
  if (data.utm_medium) result.utm_medium = data.utm_medium;
  if (data.utm_campaign) result.utm_campaign = data.utm_campaign;
  if (data.utm_content) result.utm_content = data.utm_content;
  if (data.utm_term) result.utm_term = data.utm_term;
  if (data.fbclid) result.fbclid = data.fbclid;
  if (data.gclid) result.gclid = data.gclid;
  if (data.ttclid) result.ttclid = data.ttclid;
  if (data.xcod) result.xcod = data.xcod;
  if (data.src) result.src = data.src;
  if (data.sck) result.sck = data.sck;
  if (data.fbp) result.fbp = data.fbp;
  if (data.fbc) result.fbc = data.fbc;
  if (data.ttp) result.ttp = data.ttp;
  if (data.vsl_variant) result.vsl_variant = data.vsl_variant;
  if (data.vsl_player_id) result.vsl_player_id = data.vsl_player_id;
  result.session_id = data.session_id;
  return result;
};

export const getTrackingDataForFacebookCAPI = (): Record<string, string | null> => {
  if (!window.trackingData) initializeTrackingDataLayer();
  const data = window.trackingData;
  return {
    fbp: data.fbp, fbc: data.fbc, fbclid: data.fbclid,
    utm_source: data.utm_source, utm_medium: data.utm_medium,
    utm_campaign: data.utm_campaign, utm_content: data.utm_content,
    utm_term: data.utm_term, session_id: data.session_id,
    landing_page: data.landing_page, referrer: data.referrer,
    user_agent: data.user_agent, first_visit: data.first_visit,
  };
};

export const buildTrackingQueryString = (): string => {
  const params = getTrackingDataForCheckout();
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) searchParams.set(key, value);
  });
  // Kirvano forwards "src" in utm.src — use it to carry session_id
  if (params.session_id) {
    searchParams.set("src", params.session_id);
    searchParams.set("gtl_sid", params.session_id);
  }
  const qs = searchParams.toString();
  return qs ? `?${qs}` : "";
};

export const ensureUrlHasTrackingParams = (): void => {
  if (!window.trackingData) initializeTrackingDataLayer();
  const data = window.trackingData;

  // Also read early-captured UTMs as ultimate fallback
  const earlyUtm: Record<string, string> = (() => {
    try { return JSON.parse(localStorage.getItem('lead_utm') || '{}'); } catch { return {}; }
  })();

  const currentParams = new URLSearchParams(window.location.search);
  let changed = false;
  const criticalParams: (keyof TrackingData)[] = [
    "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term",
    "fbclid", "gclid", "ttclid", "src", "sck",
  ];
  criticalParams.forEach((param) => {
    const value = data[param] || earlyUtm[param];
    if (value && !currentParams.has(param)) {
      currentParams.set(param, String(value));
      changed = true;
    }
  });
  if (changed) {
    const newUrl = `${window.location.pathname}?${currentParams.toString()}${window.location.hash}`;
    window.history.replaceState(null, "", newUrl);
  }
};

/**
 * Save session attribution to the database (once per session).
 * Called on funnel entry to create an independent source of truth.
 */
export const saveSessionAttribution = async (quizVariant?: QuizVariant): Promise<void> => {
  try {
    const data = getTrackingData();
    const sessionId = data.session_id;
    if (!sessionId || sessionStorage.getItem("attribution_saved")) return;

    // GUARANTEE variant is never null
    let resolvedVariant = quizVariant ?? ensureSessionVariant();
    if (!resolvedVariant || !QUIZ_VARIANTS.includes(resolvedVariant)) {
      resolvedVariant = QUIZ_VARIANTS[Math.floor(Math.random() * QUIZ_VARIANTS.length)];
      localStorage.setItem("quiz_variant", resolvedVariant);
    }

    // Also read early-captured UTMs as fallback
    const earlyUtm: Record<string, string> = (() => {
      try { return JSON.parse(localStorage.getItem('lead_utm') || '{}'); } catch { return {}; }
    })();

    const { supabase } = await import("@/integrations/supabase/client");
    const { error } = await supabase.from("session_attribution" as any).upsert([{
      session_id: sessionId,
      quiz_variant: resolvedVariant,
      utm_source: data.utm_source || earlyUtm.utm_source || null,
      utm_medium: data.utm_medium || earlyUtm.utm_medium || null,
      utm_campaign: data.utm_campaign || earlyUtm.utm_campaign || null,
      utm_content: data.utm_content || earlyUtm.utm_content || null,
      utm_term: data.utm_term || earlyUtm.utm_term || null,
      fbclid: data.fbclid || earlyUtm.fbclid || null,
      ttclid: data.ttclid || earlyUtm.ttclid || null,
      fbp: data.fbp || null,
      fbc: data.fbc || null,
      ttp: data.ttp || null,
      gclid: data.gclid || earlyUtm.gclid || null,
      referrer: data.referrer || earlyUtm.referrer || earlyUtm.referrer_detected || null,
      landing_page: data.landing_page || earlyUtm.landing_url || null,
    }] as any, { onConflict: "session_id" } as any);

    if (error) {
      console.warn("[Attribution] Upsert failed, retrying insert:", error);
      // Retry with plain insert (no upsert) as fallback
      const { error: insertError } = await supabase.from("session_attribution" as any).insert([{
        session_id: sessionId,
        quiz_variant: resolvedVariant,
        utm_source: data.utm_source || earlyUtm.utm_source || null,
        utm_medium: data.utm_medium || earlyUtm.utm_medium || null,
        utm_campaign: data.utm_campaign || earlyUtm.utm_campaign || null,
        utm_content: data.utm_content || earlyUtm.utm_content || null,
        utm_term: data.utm_term || earlyUtm.utm_term || null,
        fbclid: data.fbclid || earlyUtm.fbclid || null,
        ttclid: data.ttclid || earlyUtm.ttclid || null,
        fbp: data.fbp || null,
        fbc: data.fbc || null,
        ttp: data.ttp || null,
        gclid: data.gclid || earlyUtm.gclid || null,
        referrer: data.referrer || earlyUtm.referrer || null,
        landing_page: data.landing_page || earlyUtm.landing_url || null,
      }] as any);
      if (insertError) {
        console.error("[Attribution] Insert fallback also failed:", insertError);
        // Do NOT set flag — allow retry on next render
        return;
      }
    }

    sessionStorage.setItem("attribution_saved", "1");
    console.log("✅ Atribuição salva:", { sessionId, quiz_variant: resolvedVariant, utm_source: data.utm_source || earlyUtm.utm_source, fbclid: data.fbclid, ttclid: data.ttclid });
  } catch (e) {
    console.warn("[Attribution] Failed to save:", e);
    // Do NOT set flag on exception — allow retry
  }
};

export const getTrackingData = (): TrackingData => {
  if (!window.trackingData) return initializeTrackingDataLayer();
  if (!window.trackingData.utm_source && !window.trackingData.utm_campaign) {
    const stored = loadFromStorage();
    if (stored && (stored.utm_source || stored.utm_campaign)) {
      window.trackingData = {
        ...window.trackingData,
        utm_source: stored.utm_source || window.trackingData.utm_source,
        utm_medium: stored.utm_medium || window.trackingData.utm_medium,
        utm_campaign: stored.utm_campaign || window.trackingData.utm_campaign,
        utm_content: stored.utm_content || window.trackingData.utm_content,
        utm_term: stored.utm_term || window.trackingData.utm_term,
        fbclid: stored.fbclid || window.trackingData.fbclid,
        gclid: stored.gclid || window.trackingData.gclid,
        fbp: stored.fbp || window.trackingData.fbp,
        fbc: stored.fbc || window.trackingData.fbc,
        landing_page: stored.landing_page || window.trackingData.landing_page,
        referrer: stored.referrer || window.trackingData.referrer,
        src: stored.src || window.trackingData.src,
        sck: stored.sck || window.trackingData.sck,
        ttclid: stored.ttclid || window.trackingData.ttclid,
        ttp: stored.ttp || window.trackingData.ttp,
      };
    }
  }
  return window.trackingData;
};
