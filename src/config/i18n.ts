import { siteConfig, type SiteLocale } from "./site";

/**
 * Maps our internal locale codes to ICU/CLDR locale codes used by next-intl
 * and the browser's Intl API.
 */
export const localeToBcp47: Record<SiteLocale, string> = {
  en: "en-US",
  zh: "zh-CN",
  es: "es-ES",
  fr: "fr-FR",
  de: "de-DE",
  ja: "ja-JP",
  ko: "ko-KR",
  tr: "tr-TR",
  ar: "ar-SA",
  "pt-br": "pt-br",
  id: "id-ID",
  ms: "ms-MY",
  fa: "fa-IR",
  hi: "hi-IN",
  ru: "ru-RU",
};

/** Human-readable language names in that language (for language switchers). */
export const localeNames: Record<SiteLocale, string> = {
  en: "English",
  zh: "中文",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  ja: "日本語",
  ko: "한국어",
  tr: "Türkçe",
  ar: "العربية",
  "pt-br": "Português (Brasil)",
  id: "Bahasa Indonesia",
  ms: "Bahasa Melayu",
  fa: "فارسی",
  hi: "हिन्दी",
  ru: "Русский",
};

export const locales = siteConfig.locales;
export const defaultLocale = siteConfig.defaultLocale;
export type Locale = SiteLocale;
