import type { Language } from "@/lib/i18n";

/**
 * Moeda coerente p/ a página de oferta do front.
 * PT em R$ (meta 75–600/dia); EN/ES em US$ (÷~5, 15–120/dia).
 * O preço REAL cobrado (47 BRL) NÃO muda — só o texto exibido converte.
 */
export const S13_CUR: Record<Language, { sym: string; daily: Record<string, number> }> = {
  pt: { sym: "R$", daily: { "50-100": 75, "100-300": 200, "300-500": 400, "500+": 600 } },
  en: { sym: "$", daily: { "50-100": 15, "100-300": 40, "300-500": 80, "500+": 120 } },
  es: { sym: "$", daily: { "50-100": 15, "100-300": 40, "300-500": 80, "500+": 120 } },
};

export const s13money = (n: number, lang: Language, locale: string) =>
  lang === "pt" ? `R$${n.toLocaleString(locale)}` : `$${n.toLocaleString(locale)}`;
