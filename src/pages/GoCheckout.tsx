import { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { getTrackingData, saveSessionAttribution } from "@/lib/trackingDataLayer";
import { saveFunnelEventReliable } from "@/lib/metricsClient";
import { sendCAPIInitiateCheckout } from "@/lib/facebookCAPI";
import { trackMetaInitiateCheckout } from "@/lib/metaPixel";
import { trackTikTokInitiateCheckout } from "@/lib/tiktokPixel";

const PLAN_URLS: Record<string, string> = {
  starter: "https://pay.kirvano.com/4630333d-d5d1-4591-b767-2151f77c6b13",
  essencial: "https://pay.kirvano.com/a404a378-2a59-4efd-86a8-dc57363c054c",
  profissional: "https://pay.kirvano.com/b9bbad45-8e94-40c0-b910-73e814b03c8c",
  vip: "https://pay.kirvano.com/4feda4e1-966a-400c-9b34-a68e9ca0fbb1",
  "essencial-es": "https://pay.mycheckoutt.com/019d72d9-839a-72f0-8f3b-ef9ad1681d33",
};

const PLAN_AMOUNTS: Record<string, number> = {
  starter: 37,
  essencial: 47,
  profissional: 97,
  vip: 197,
  "essencial-es": 47,
};

const UTM_KEYS = [
  "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term",
  "fbclid", "gclid", "ttclid", "src", "sck",
];

const buildCheckoutUrl = (plan: string): string | null => {
  const baseUrl = PLAN_URLS[plan];
  if (!baseUrl) return null;

  let storedUtms: Record<string, string> = {};
  try {
    const raw = localStorage.getItem("lead_utm");
    if (raw) storedUtms = JSON.parse(raw);
  } catch {}

  const urlParams = new URLSearchParams(window.location.search);
  const finalParams = new URLSearchParams();

  for (const key of UTM_KEYS) {
    const value = urlParams.get(key) || storedUtms[key];
    if (value) finalParams.set(key, value);
  }

  const sessionId = sessionStorage.getItem("session_id") || localStorage.getItem("session_id");
  if (sessionId) finalParams.set("gtl_sid", sessionId);

  const cookies = document.cookie.split(";").reduce((acc, c) => {
    const [k, v] = c.trim().split("=");
    if (k && v) acc[k] = v;
    return acc;
  }, {} as Record<string, string>);
  if (cookies._fbp) finalParams.set("fbp", cookies._fbp);
  if (cookies._fbc) finalParams.set("fbc", cookies._fbc);

  const separator = baseUrl.includes("?") ? "&" : "?";
  return finalParams.toString()
    ? `${baseUrl}${separator}${finalParams.toString()}`
    : baseUrl;
};

const GoCheckout = () => {
  const { plan } = useParams<{ plan: string }>();
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;

    const planKey = (plan || "").toLowerCase();
    const baseUrl = PLAN_URLS[planKey];

    if (!baseUrl) {
      console.warn("[GoCheckout] Unknown plan:", planKey);
      window.location.replace("/");
      return;
    }

    // 🔥 CRITICAL: Build the final URL FIRST and schedule a HARD redirect immediately.
    // Everything else (pixels, CAPI, DB writes) runs in parallel and MUST NOT block
    // the redirect. If anything throws or hangs, the user still gets to Kirvano.
    let finalUrl = baseUrl;
    try {
      finalUrl = buildCheckoutUrl(planKey) || baseUrl;
    } catch (err) {
      console.warn("[GoCheckout] buildCheckoutUrl failed, using bare URL:", err);
    }

    // Hard fallback: redirect after 600ms NO MATTER WHAT
    const hardTimer = window.setTimeout(() => {
      console.log("[GoCheckout] Redirecting to:", finalUrl);
      window.location.replace(finalUrl);
    }, 600);

    // Fire-and-forget tracking — wrapped in try/catch so nothing here can block redirect.
    const amount = PLAN_AMOUNTS[planKey] || 47;
    try {
      getTrackingData();
      void saveSessionAttribution().catch(() => {});
      saveFunnelEventReliable("checkout_click", {
        context: "go_direct_checkout",
        plan: planKey,
        amount,
        product: planKey,
      });
      try { trackMetaInitiateCheckout({ amount, contentId: planKey }); } catch {}
      try { trackTikTokInitiateCheckout({ amount, contentId: planKey }); } catch {}
      void sendCAPIInitiateCheckout({ amount, plan: planKey }).catch(() => {});
    } catch (err) {
      console.warn("[GoCheckout] Tracking error (non-blocking):", err);
    }

    return () => window.clearTimeout(hardTimer);
  }, [plan]);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#0f1117",
      color: "#fff",
      fontFamily: "system-ui, sans-serif",
      flexDirection: "column",
      gap: 16,
    }}>
      <div style={{
        width: 40, height: 40, border: "3px solid #FFD600",
        borderTopColor: "transparent", borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }} />
      <p style={{ fontSize: 16, opacity: 0.8 }}>Abrindo checkout seguro...</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
};

export default GoCheckout;
