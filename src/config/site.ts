/**
 * Central site configuration.
 * All site-wide constants live here — never hardcode URLs or site metadata elsewhere.
 */

export const siteConfig = {
  name: "NewsIQ",
  domain: "newsiq.top",
  url: "https://newsiq.top",
  description:
    "AI-powered global micro-news platform — breaking news, multilingual publishing, and financial market impact analysis.",
  locale: "en",
  locales: ["en", "zh", "es", "fr", "de", "ja", "ko", "tr", "ar", "pt-br", "id", "ms", "fa", "hi", "ru"] as const,
  defaultLocale: "en" as const,
} as const;

export type SiteLocale = (typeof siteConfig.locales)[number];

/** Locales that render right-to-left. */
export const RTL_LOCALES: readonly SiteLocale[] = ["ar", "fa"] as const;

/** Locales that render left-to-right. */
export const LTR_LOCALES: readonly SiteLocale[] = siteConfig.locales.filter(
  (l) => !RTL_LOCALES.includes(l),
);

export function isRTL(locale: string): boolean {
  return (RTL_LOCALES as readonly string[]).includes(locale);
}

export function textDirection(locale: string): "rtl" | "ltr" {
  return isRTL(locale) ? "rtl" : "ltr";
}
