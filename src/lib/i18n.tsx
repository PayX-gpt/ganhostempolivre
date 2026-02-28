import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";

export type Language = "pt" | "en" | "es";

interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  locale: string;
}

const LOCALE_MAP: Record<Language, string> = {
  pt: "pt-BR",
  en: "en-US",
  es: "es-ES",
};

/* ─── Currency Display (1:1 values, only symbol changes) ─── */

export function useCurrency() {
  const { lang, locale } = useLanguage();
  const isBrl = lang === "pt";
  const sym = isBrl ? "R$" : "$";

  /** Return value as-is (no conversion) */
  const toLocal = (val: number, decimals?: number): number => {
    if (decimals !== undefined) return parseFloat(val.toFixed(decimals));
    return val;
  };

  /** Format amount with correct symbol and locale */
  const format = (val: number, decimals = 0): string => {
    const display = toLocal(val, decimals);
    if (decimals > 0) {
      return `${sym}${display.toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
    }
    return `${sym}${display.toLocaleString(locale)}`;
  };

  return { sym, toLocal, format, isBrl, locale };
}

function detectLanguage(): Language {
  try {
    const stored = localStorage.getItem("app_lang");
    if (stored && ["pt", "en", "es"].includes(stored)) return stored as Language;
  } catch {}
  const navLang = (navigator.language || navigator.languages?.[0] || "").toLowerCase();
  if (navLang.startsWith("es")) return "es";
  if (navLang.startsWith("en")) return "en";
  return "pt";
}

const I18nContext = createContext<I18nContextType>({
  lang: "pt",
  setLang: () => {},
  locale: "pt-BR",
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => detectLanguage());

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang);
    try { localStorage.setItem("app_lang", newLang); } catch {}
  }, []);

  // Non-blocking IP geolocation fallback (only on first visit)
  useEffect(() => {
    try { if (localStorage.getItem("app_lang")) return; } catch { return; }
    const controller = new AbortController();
    fetch("https://ipapi.co/json/", { signal: controller.signal })
      .then(r => r.json())
      .then(data => {
        const c = data?.country_code?.toUpperCase();
        if (!c) return;
        const en = ["US","GB","AU","CA","NZ","IE","ZA","IN","PH","SG","MY","KE","NG","GH"];
        const es = ["ES","MX","AR","CO","CL","PE","VE","EC","GT","CU","BO","DO","HN","PY","SV","NI","CR","PA","UY"];
        if (en.includes(c)) setLang("en");
        else if (es.includes(c)) setLang("es");
      })
      .catch(() => {});
    return () => controller.abort();
  }, [setLang]);

  const value = useMemo(() => ({ lang, setLang, locale: LOCALE_MAP[lang] }), [lang, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useLanguage() {
  return useContext(I18nContext);
}

export function LanguageSelector({ className = "" }: { className?: string }) {
  const { lang, setLang } = useLanguage();
  const options: { code: Language; flag: string }[] = [
    { code: "pt", flag: "🇧🇷" },
    { code: "en", flag: "🇺🇸" },
    { code: "es", flag: "🇪🇸" },
  ];

  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      {options.map(({ code, flag }) => (
        <button
          key={code}
          onClick={() => setLang(code)}
          className={`px-1.5 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
            code === lang
              ? "bg-primary/20 text-primary ring-1 ring-primary/30"
              : "text-muted-foreground/50 hover:text-muted-foreground"
          }`}
          aria-label={code.toUpperCase()}
        >
          <span className="mr-0.5">{flag}</span>
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
