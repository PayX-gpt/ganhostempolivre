import {} from "react";
import { useParams } from "react-router-dom";

const PLAN_URLS: Record<string, string> = {
  starter: "https://pay.kirvano.com/4630333d-d5d1-4591-b767-2151f77c6b13",
  essencial: "https://pay.kirvano.com/a404a378-2a59-4efd-86a8-dc57363c054c",
  profissional: "https://pay.kirvano.com/b9bbad45-8e94-40c0-b910-73e814b03c8c",
  vip: "https://pay.kirvano.com/4feda4e1-966a-400c-9b34-a68e9ca0fbb1",
  "essencial-es": "https://pay.mycheckoutt.com/019d72d9-839a-72f0-8f3b-ef9ad1681d33",
};

const UTM_KEYS = [
  "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term",
  "fbclid", "gclid", "ttclid", "src", "sck",
];

const buildCheckoutUrl = (plan: string | undefined): string | null => {
  const baseUrl = PLAN_URLS[(plan || "").toLowerCase()];
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

  // Redirect immediately on first render — no useEffect delay
  const redirectUrl = buildCheckoutUrl(plan);
  if (redirectUrl) {
    window.location.replace(redirectUrl);
  } else {
    window.location.replace("/step-1");
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#0f1117",
      color: "#fff",
      fontFamily: "system-ui, sans-serif",
    }}>
      <p style={{ fontSize: 18, opacity: 0.7 }}>Redirecionando para o checkout...</p>
    </div>
  );
};

export default GoCheckout;
