/**
 * SEO utilities.
 *
 * Phase 6 changes:
 *   - `articleMetadata` now accepts `availableLocales` (the locales for which
 *     a real translation exists) and emits hreflang links ONLY for those,
 *     plus an `x-default` pointing to the default locale.
 *   - `localizedUrl` is unchanged.
 *   - `siteHreflangEntry` helper for callers that need the structured map.
 */

import type { Metadata } from "next";
import { siteConfig, type SiteLocale } from "@/config/site";

export function localizedUrl(locale: SiteLocale, path = ""): string {
  const cleanPath = path.replace(/^\//, "");
  return `${siteConfig.url}/${locale}${cleanPath ? `/${cleanPath}` : ""}`;
}

/**
 * Build a `languages` map (hreflang) from the list of locales that actually
 * have a published translation. `x-default` always points to the default
 * locale so search engines know which variant to prefer for unspecified
 * audiences.
 */
export function siteHreflangEntry(
  path: string,
  availableLocales: readonly string[],
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const locale of availableLocales) {
    out[locale] = localizedUrl(locale as SiteLocale, path);
  }
  // x-default only when default locale is among the available ones;
  // otherwise we still point it to the default-locale URL (the safe choice).
  out["x-default"] = localizedUrl(siteConfig.defaultLocale, path);
  return out;
}

export function articleMetadata({
  locale,
  title,
  description,
  path,
  image,
  availableLocales,
  type = "article",
}: {
  locale: SiteLocale;
  title: string;
  description: string;
  path: string;
  image?: string;
  /** Locales for which a published translation exists. Falls back to the single requested locale. */
  availableLocales?: readonly string[];
  type?: "article" | "website";
}): Metadata {
  const url = localizedUrl(locale, path);
  const available = availableLocales && availableLocales.length > 0
    ? Array.from(new Set([...availableLocales, siteConfig.defaultLocale]))
    : [siteConfig.defaultLocale, locale];
  const languages = siteHreflangEntry(path, available);

  return {
    title,
    description,
    alternates: { canonical: url, languages },
    openGraph: {
      type,
      title,
      description,
      url,
      locale: bcp47(locale),
      images: image ? [{ url: image }] : undefined,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

/** Map an internal locale code to a BCP-47 tag for OG / Twitter metadata. */
function bcp47(locale: string): string {
  const map: Record<string, string> = {
    en: "en_US",
    zh: "zh_CN",
    es: "es_ES",
    fr: "fr_FR",
    de: "de_DE",
    ja: "ja_JP",
    ko: "ko_KR",
    tr: "tr_TR",
    ar: "ar_SA",
    "pt-br": "pt_BR",
    id: "id_ID",
    ms: "ms_MY",
    fa: "fa_IR",
    hi: "hi_IN",
    ru: "ru_RU",
  };
  return map[locale] ?? locale;
}
