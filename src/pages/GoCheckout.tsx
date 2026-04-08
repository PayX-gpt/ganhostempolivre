import { useEffect } from "react";
import { useParams } from "react-router-dom";

const PLAN_URLS: Record<string, string> = {
  starter: "https://pay.kirvano.com/4630333d-d5d1-4591-b767-2151f77c6b13",
  essencial: "https://pay.kirvano.com/a404a378-2a59-4efd-86a8-dc57363c054c",
  profissional: "https://pay.kirvano.com/b9bbad45-8e94-40c0-b910-73e814b03c8c",
  vip: "https://pay.kirvano.com/4feda4e1-966a-400c-9b34-a68e9ca0fbb1",
};

const UTM_KEYS = [
  "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term",
  "fbclid", "gclid", "ttclid", "src", "sck",
];

const GoCheckout = () => {
  const { plan } = useParams<{ plan: string }>();

  useEffect(() => {
    const baseUrl = PLAN_URLS[(plan || "").toLowerCase()];
    if (!baseUrl) {
      window.location.replace("/step-1");
      return;
    }

    // Read UTMs from localStorage (saved by our tracking layer on step-1)
    let storedUtms: Record<string, string> = {};
    try {
      const raw = localStorage.getItem("lead_utm");
      if (raw) storedUtms = JSON.parse(raw);
    } catch {}

    // Also check current URL params (backup from Panda "Enviar parâmetros de URL")
    const urlParams = new URLSearchParams(window.location.search);

    // Merge: URL params take priority, then localStorage
    const finalParams = new URLSearchParams();

    for (const key of UTM_KEYS) {
      const value = urlParams.get(key) || storedUtms[key];
      if (value) finalParams.set(key, value);
    }

    // Add session_id
    const sessionId = sessionStorage.getItem("session_id") || localStorage.getItem("session_id");
    if (sessionId) finalParams.set("gtl_sid", sessionId);

    // Add fbp/fbc cookies
    const cookies = document.cookie.split(";").reduce((acc, c) => {
      const [k, v] = c.trim().split("=");
      if (k && v) acc[k] = v;
      return acc;
    }, {} as Record<string, string>);
    if (cookies._fbp) finalParams.set("fbp", cookies._fbp);
    if (cookies._fbc) finalParams.set("fbc", cookies._fbc);

    const separator = baseUrl.includes("?") ? "&" : "?";
    const finalUrl = finalParams.toString()
      ? `${baseUrl}${separator}${finalParams.toString()}`
      : baseUrl;

    window.location.replace(finalUrl);
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
    }}>
      <p style={{ fontSize: 18, opacity: 0.7 }}>Redirecionando para o checkout...</p>
    </div>
  );
};

export default GoCheckout;
