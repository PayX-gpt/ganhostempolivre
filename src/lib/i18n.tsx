import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";

export type Language = "pt" | "en" | "es";
export type Currency = "BRL" | "EUR" | "USD";

interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  locale: string;
  currency: Currency;
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

/* ─── Moeda local por REGIÃO (BRL/EUR/USD) — preço adaptado, fail-safe p/ BRL ───
   Regra do preço estrangeiro: usa cotação ABAIXO da real da Hubla, então o número
   na página fica um pouco ACIMA do que a Hubla cobra no checkout (o cliente vê
   menor no checkout = sensação de vantagem). Arredonda pra .90. BRL = intacto. */
const FX_RATE: Record<Currency, number> = { BRL: 1, USD: 5.0, EUR: 5.5 };
const CUR_SYMBOL: Record<Currency, string> = { BRL: "R$", USD: "$", EUR: "€" };

/** Converte um valor base em R$ para a moeda local (número). */
export function toLocalPrice(brl: number, currency: Currency): number {
  if (currency === "BRL" || !isFinite(brl)) return brl;
  const raw = brl / (FX_RATE[currency] || 1);
  return Math.floor(raw) + 0.90; // ex.: 197/5 = 39,4 -> 39,90
}

/** Hook: moeda local por região + formatador de preço (base sempre em R$). */
export function useLocalMoney() {
  const { currency } = useLanguage();
  const sym = CUR_SYMBOL[currency] || "R$";
  const isBrl = currency === "BRL";
  /** Preço formatado na moeda local (só use quando isForeign; no BRL mantenha o markup original). */
  const price = (brl: number): string => {
    if (isBrl) return `R$${(Math.round(brl * 100) / 100).toLocaleString("pt-BR")}`;
    return `${sym}${toLocalPrice(brl, currency).toFixed(2)}`;
  };
  const value = (brl: number): number => toLocalPrice(brl, currency);
  return { currency, sym, isBrl, isForeign: !isBrl, price, value };
}

/* ─────────────────────────────────────────────────────────────────────────
   Detecção de idioma "à prova de erros" — padrão dos grandes sistemas.

   Cascata de sinais (o primeiro que resolver, vence):
     1. Parâmetro na URL (?lang= / ?lng= / ?locale= / ?hl=) — intenção explícita,
        ideal pra campanhas ("anúncio EUA → link ?lang=en"). Fica travado (salvo).
     2. Escolha manual salva (o usuário clicou numa bandeira antes).
     3. Cache da geolocalização (detectada 1x) — abre INSTANTÂNEO nas próximas
        visitas, sem nova requisição e sem piscar.
     4. Idioma do navegador (lista completa e ordenada, ciente de região).
     5. Inglês (fallback global — tráfego internacional).

   Depois do primeiro paint, SÓ na 1ª visita e sem escolha manual, refina por IP
   com timeout curto e provedores reserva (se um cair, tenta o próximo). Tudo
   embrulhado em try/catch: nunca trava, nunca quebra a tela.
   ───────────────────────────────────────────────────────────────────────── */

const SUPPORTED: readonly Language[] = ["pt", "en", "es"];
const isLang = (v: unknown): v is Language => typeof v === "string" && (SUPPORTED as readonly string[]).includes(v);

const PT_COUNTRIES = new Set(["BR", "PT", "AO", "MZ", "CV", "GW", "TL", "ST"]);
const ES_COUNTRIES = new Set(["ES", "MX", "AR", "CO", "CL", "PE", "VE", "EC", "GT", "CU", "BO", "DO", "HN", "PY", "SV", "NI", "CR", "PA", "UY", "GQ"]);
// Qualquer outro país → inglês.

function countryToLang(cc?: string | null): Language | null {
  if (!cc) return null;
  const c = String(cc).toUpperCase();
  if (PT_COUNTRIES.has(c)) return "pt";
  if (ES_COUNTRIES.has(c)) return "es";
  return "en";
}

function langFromNavigator(): Language | null {
  try {
    const list = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language]).filter(Boolean);
    for (const l of list) {
      const s = String(l).toLowerCase();
      if (s.startsWith("pt")) return "pt";
      if (s.startsWith("es")) return "es";
      if (s.startsWith("en")) return "en";
    }
  } catch { /* ignore */ }
  return null;
}

function urlLangParam(): Language | null {
  try {
    const u = new URLSearchParams(window.location.search);
    const raw = (u.get("lang") || u.get("lng") || u.get("locale") || u.get("hl") || "").toLowerCase().slice(0, 2);
    if (isLang(raw)) return raw;
  } catch { /* ignore */ }
  return null;
}

function detectLanguage(): Language {
  const fromUrl = urlLangParam();
  if (fromUrl) return fromUrl;
  try { const s = localStorage.getItem("app_lang"); if (isLang(s)) return s; } catch { /* ignore */ }
  try { const g = localStorage.getItem("app_lang_geo"); if (isLang(g)) return g; } catch { /* ignore */ }
  const nav = langFromNavigator();
  if (nav) return nav;
  return "en";
}

/** Descobre o país por IP com timeout curto e provedores reserva. */
async function detectCountryByIp(signal: AbortSignal): Promise<Language | null> {
  const providers: Array<() => Promise<string | undefined | null>> = [
    async () => { const r = await fetch("https://ipapi.co/json/", { signal }); const d = await r.json(); return d?.country_code; },
    async () => { const r = await fetch("https://ipwho.is/", { signal }); const d = await r.json(); return d?.country_code; },
    async () => { const r = await fetch("https://www.cloudflare.com/cdn-cgi/trace", { signal }); const t = await r.text(); return (t.match(/loc=([A-Z]{2})/) || [])[1]; },
  ];
  for (const p of providers) {
    try {
      const lg = countryToLang(await p());
      if (lg) return lg;
    } catch { /* tenta o próximo provedor */ }
  }
  return null;
}

const I18nContext = createContext<I18nContextType>({
  lang: "pt",
  setLang: () => {},
  locale: "pt-BR",
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => detectLanguage());

  const setLang = useCallback((newLang: Language) => {
    if (!isLang(newLang)) return;
    setLangState(newLang);
    try { localStorage.setItem("app_lang", newLang); } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    // 1) Param na URL = intenção explícita → trava (salva) e não geolocaliza.
    const fromUrl = urlLangParam();
    if (fromUrl) { try { localStorage.setItem("app_lang", fromUrl); } catch { /* ignore */ } return; }
    // 2) Escolha manual já existe → respeita.
    try { if (localStorage.getItem("app_lang")) return; } catch { return; }
    // 3) Já geolocalizou uma vez → instantâneo, sem nova requisição nem flash.
    try { if (localStorage.getItem("app_lang_geo")) return; } catch { return; }

    // 4) Primeira visita sem escolha: refina por IP (não bloqueia a tela).
    let cancelled = false;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    detectCountryByIp(controller.signal)
      .then((geoLang) => {
        if (cancelled || !geoLang) return;
        try { localStorage.setItem("app_lang_geo", geoLang); } catch { /* ignore */ }
        setLangState(geoLang); // geo NÃO marca como escolha manual (fica em app_lang_geo)
      })
      .catch(() => { /* silencioso — mantém o idioma do navegador */ })
      .finally(() => clearTimeout(timer));

    return () => { cancelled = true; clearTimeout(timer); controller.abort(); };
  }, []);

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
