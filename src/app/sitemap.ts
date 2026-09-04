/**
 * Multilingual sitemap.
 *
 * Phase 6: in addition to the per-locale homepage, the sitemap now emits:
 *   - every category page in every locale that has a published translation
 *   - every published post in every locale that has a public translation
 *
 * We deliberately query one batch per page to avoid loading the entire
 * posts table into memory. The list is bounded by `limit` (capped at 5000
 * to stay well under search-engine limits).
 */

import type { MetadataRoute } from "next";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { siteConfig } from "@/config/site";
import { categories } from "@/config/categories";

const MAX_URLS = 5000;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteConfig.url;
  const now = new Date();

  // 1) Locale homepages (always present, one per supported locale).
  const homes = siteConfig.locales.map(
    (locale): MetadataRoute.Sitemap[number] => ({
      url: `${baseUrl}/${locale}`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: locale === siteConfig.defaultLocale ? 1 : 0.9,
    }),
  );

  // 2) Category pages — same set in every locale.
  const categoryPages: MetadataRoute.Sitemap = [];
  for (const locale of siteConfig.locales) {
    for (const cat of categories) {
      categoryPages.push({
        url: `${baseUrl}/${locale}/categories/${cat.slug}`,
        lastModified: now,
        changeFrequency: "daily",
        priority: 0.7,
      });
    }
  }

  // 3) Per-post URLs — only for the locales where a public translation exists.
  const postUrls: MetadataRoute.Sitemap = [];
  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("posts")
      .select("id, published_at, post_translations!inner(locale, slug, translation_status)")
      .eq("status", "published")
      .in("post_translations.translation_status", ["completed", "published"])
      .order("published_at", { ascending: false })
      .limit(MAX_URLS);
    if (!error && data) {
      for (const row of data as Array<{
        id: string;
        published_at: string | null;
        post_translations: Array<{ locale: string; slug: string }>;
      }>) {
        for (const tr of row.post_translations) {
          postUrls.push({
            url: `${baseUrl}/${tr.locale}/news/${tr.slug}`,
            lastModified: row.published_at ? new Date(row.published_at) : now,
            changeFrequency: "daily",
            priority: 0.8,
          });
        }
      }
    }
  } catch {
    // Sitemap must never crash the build — fall back to homes + categories.
  }

  return [...homes, ...categoryPages, ...postUrls].slice(0, MAX_URLS);
}
