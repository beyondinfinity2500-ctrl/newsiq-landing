import type { MetadataRoute } from "next";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { siteConfig } from "@/config/site";

const MAX_URLS = 5000;

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = siteConfig.url;
  const now = new Date();

  // Google News Sitemap format with <news:news> tags
  const newsEntries: MetadataRoute.Sitemap = [];

  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("posts")
      .select("id, published_at, cover_image_url, post_translations!inner(locale, slug, translation_status)")
      .eq("status", "published")
      .in("post_translations.translation_status", ["completed", "published"])
      .order("published_at", { ascending: false })
      .limit(MAX_URLS);

    if (!error && data) {
      for (const row of data as Array<{
        id: string;
        published_at: string | null;
        cover_image_url: string | null;
        post_translations: Array<{ locale: string; slug: string }>;
      }>) {
        // Add each translation as a separate news entry
        for (const tr of row.post_translations) {
          // Only include if translation status is published or completed
          if (tr.translation_status === "published" || tr.translation_status === "completed") {
            newsEntries.push({
              url: `${siteConfig.url}/${tr.locale}/${`news/${tr.slug}`}`,
              lastModified: row.published_at ? new Date(row.published_at) : now,
              changeFrequency: "daily",
              priority: 0.8,
              images: row.cover_image_url ? [row.cover_image_url] : undefined,
              // Google News required fields
              news: {
                publication_name: "NewsIQ",
                publication_type: "online_news",
                title: tr.title,
                keywords: tr.seo_title || tr.title,
              },
            });
          }
        }
      }
    }
  } catch {
    // Sitemap must never crash the build.
  }

  return newsEntries;
}