/**
 * Multilingual sitemap (app/sitemap.ts).
 *
 * Emits, in priority order:
 *   1. Per-locale homepages (15 locales).
 *   2. Per-locale static pages (about, contact, terms, privacy, cookies,
 *      editorial-policy, source-policy, careers, advertising, markets,
 *      subscribe).
 *   3. Per-locale category pages.
 *   4. Per-post URLs for every locale with a public translation.
 *
 * Each entry includes `alternates.languages` so search engines can pair
 * translations without re-fetching the HTML. The XML namespace required for
 * `xhtml:link` is declared on the document by Next.js automatically when
 * `alternates` is set.
 *
 * The sitemap is bounded to MAX_URLS entries to stay within the limits of
 * every major search engine (Google, Bing, Yandex all cap at 50k URLs
 * per file).
 */

import type { MetadataRoute } from "next";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { siteConfig } from "@/config/site";
import { categories } from "@/config/categories";

const MAX_URLS = 5000;

export const dynamic = "force-dynamic";

/** Static informational pages that should appear in every locale. */
const STATIC_PATHS = [
  "about",
  "contact",
  "careers",
  "advertising",
  "terms",
  "privacy",
  "cookies",
  "editorial-policy",
  "source-policy",
  "markets",
  "subscribe",
  "breaking",
  "trending",
  "categories",
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteConfig.url;
  const now = new Date();

  // 1) Root home (no locale prefix).
  const rootHome: MetadataRoute.Sitemap[number] = {
    url: `${baseUrl}`,
    lastModified: now,
    changeFrequency: "hourly",
    priority: 1,
    alternates: { languages: { "x-default": `${baseUrl}` } },
  };

  // 2) Locale homepages.
  const homes: MetadataRoute.Sitemap = siteConfig.locales.map((locale) => ({
    url: `${baseUrl}/${locale}`,
    lastModified: now,
    changeFrequency: "hourly",
    priority: locale === siteConfig.defaultLocale ? 0.95 : 0.9,
    alternates: { languages: buildLanguages("") },
  }));

  // 2) Static informational pages per locale.
  const staticPages: MetadataRoute.Sitemap = [];
  for (const locale of siteConfig.locales) {
    for (const path of STATIC_PATHS) {
      staticPages.push({
        url: `${baseUrl}/${locale}/${path}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.6,
        alternates: { languages: buildLanguages(path) },
      });
    }
  }

  // 3) Category pages — one URL per (locale, category) pair.
  const categoryPages: MetadataRoute.Sitemap = [];
  for (const locale of siteConfig.locales) {
    for (const cat of categories) {
      categoryPages.push({
        url: `${baseUrl}/${locale}/categories/${cat.slug}`,
        lastModified: now,
        changeFrequency: "daily",
        priority: 0.7,
        alternates: { languages: buildLanguages(`categories/${cat.slug}`) },
      });
    }
  }

  // 4) Per-post URLs for locales that have a public translation.
  const postUrls: MetadataRoute.Sitemap = [];
  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("posts")
      .select("id, published_at, cover_image_url, post_translations!inner(locale, slug, translation_status)")
      .eq("status", "published")
      .in("post_translations.translation_status", ["published"])
      .order("published_at", { ascending: false })
      .limit(MAX_URLS);
    if (!error && data) {
      for (const row of data as Array<{
        id: string;
        published_at: string | null;
        cover_image_url: string | null;
        post_translations: Array<{ locale: string; slug: string }>;
      }>) {
        const path = `news/${row.post_translations[0]?.slug ?? row.id}`;
        const languages = buildLanguages(path, row.post_translations.map((t) => t.locale));
        for (const tr of row.post_translations) {
          postUrls.push({
            url: `${baseUrl}/${tr.locale}/${path}`,
            lastModified: row.published_at ? new Date(row.published_at) : now,
            changeFrequency: "daily",
            priority: 0.8,
            images: row.cover_image_url ? [row.cover_image_url] : undefined,
            alternates: { languages },
          });
        }
      }
    }
  } catch {
    // Sitemap must never crash the build.
  }

  return [rootHome, ...homes, ...staticPages, ...categoryPages, ...postUrls].slice(0, MAX_URLS);
}

/**
 * Build the hreflang map (`alternates.languages`) for a given path.
 * `availableLocales` is used by article pages to limit hreflang to the
 * locales that actually have a translation. For shared pages (home, category,
 * static) we pass nothing and the helper advertises every supported locale.
 */
function buildLanguages(path: string, availableLocales?: readonly string[]): Record<string, string> {
  const locales = availableLocales && availableLocales.length > 0
    ? availableLocales
    : siteConfig.locales;
  const out: Record<string, string> = {};
  for (const locale of locales) {
    out[locale] = `${siteConfig.url}/${locale}${path ? `/${path}` : ""}`;
  }
  out["x-default"] = `${siteConfig.url}/${siteConfig.defaultLocale}${path ? `/${path}` : ""}`;
  return out;
}
