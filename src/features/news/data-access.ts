/**
 * News data-access layer — the ONLY module that touches posts/post_translations.
 *
 * Phase 6 additions:
 *   - `getArticleBySlug` now respects `translation_status` (only completed
 *     translations are exposed publicly; pending/failed/process fall back).
 *   - Returns `is_fallback: boolean` so the UI can show a banner indicating
 *     that the user is reading a translation, not the original.
 *   - Adds `getAvailableTranslations(slug)` so the article page can emit
 *     correct hreflang tags (only locales that actually have a published
 *     translation).
 *   - Adds `searchPublishedArticles` for a basic multilingual LIKE query
 *     over title / summary / content of completed translations.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Post, PostTranslation, Source } from "@/lib/supabase/types";
import { NotFoundError } from "@/lib/errors";
import { siteConfig } from "@/config/site";

type DbClient = SupabaseClient<Database>;

export interface ArticleWithDetails extends Post {
  translation: PostTranslation;
  source_name: string;
  source_reliability: number;
  /** True when the displayed translation is the fallback (e.g. user asked `fa` but only `en` exists). */
  is_fallback: boolean;
  /** Locale of the translation that was actually returned. */
  resolved_locale: string;
}

const PUBLIC_TRANSLATION_STATUSES = ["completed", "published"] as const;

function isPublicTranslation(status: string | null | undefined): boolean {
  if (!status) return false;
  return (PUBLIC_TRANSLATION_STATUSES as readonly string[]).includes(status);
}

function mapRow(row: Record<string, unknown>, resolvedLocale: string, isFallback: boolean): ArticleWithDetails {
  const translations = row.post_translations as unknown as PostTranslation[];
  const source = row.source as unknown as Source | null;
  const { post_translations: _pt, source: _s, ...postFields } = row;
  return {
    ...(postFields as unknown as Post),
    translation: translations[0],
    source_name: source?.name ?? "User Report",
    source_reliability: source?.credibility_score ?? 0,
    is_fallback: isFallback,
    resolved_locale: resolvedLocale,
  } as ArticleWithDetails;
}

const selectFields = "*, post_translations!inner(*), source:source_id(*)";

export async function getPublishedArticles(
  client: DbClient,
  options: { locale?: string; category?: string; limit?: number } = {},
): Promise<ArticleWithDetails[]> {
  const { locale = "en", category, limit = 20 } = options;
  let q = client
    .from("posts")
    .select(selectFields)
    .eq("status", "published")
    .eq("post_translations.locale", locale)
    .in("post_translations.translation_status", [...PUBLIC_TRANSLATION_STATUSES])
    .order("published_at", { ascending: false })
    .limit(limit);
  if (category) q = q.eq("category_id", category);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map((r) => mapRow(r as Record<string, unknown>, locale, false));
}

export async function getArticleBySlug(
  client: DbClient,
  slug: string,
  locale: string,
): Promise<ArticleWithDetails> {
  // 1) Find the post_id behind this slug regardless of locale.
  const { data: tr } = await client
    .from("post_translations")
    .select("post_id, locale, translation_status, slug")
    .eq("slug", slug)
    .maybeSingle();
  const translation = tr as Pick<PostTranslation, "post_id" | "locale" | "translation_status" | "slug"> | null;
  if (!translation) throw new NotFoundError(`No article found for slug "${slug}"`);

  // 2) Try the requested locale first (must be public status).
  const tryLoad = async (loc: string): Promise<{ data: Record<string, unknown> | null; resolved: string; isFallback: boolean }> => {
    const { data, error } = await client
      .from("posts")
      .select(selectFields)
      .eq("id", translation.post_id)
      .eq("post_translations.locale", loc)
      .in("post_translations.translation_status", [...PUBLIC_TRANSLATION_STATUSES])
      .eq("status", "published")
      .maybeSingle();
    if (error) return { data: null, resolved: loc, isFallback: loc !== locale };
    return { data: (data ?? null) as Record<string, unknown> | null, resolved: loc, isFallback: loc !== locale };
  };

  const requested = await tryLoad(locale);
  if (requested.data) {
    return mapRow(requested.data, requested.resolved, requested.isFallback);
  }

  // 3) Try the default fallback locale (`en`).
  if (locale !== siteConfig.defaultLocale) {
    const fallback = await tryLoad(siteConfig.defaultLocale);
    if (fallback.data) {
      return mapRow(fallback.data, fallback.resolved, true);
    }
  }

  // 4) Try the original article's locale (whatever language the editor wrote it in).
  const original = await tryLoad(translation.locale);
  if (original.data) {
    return mapRow(original.data, original.resolved, true);
  }

  throw new NotFoundError("Article not found");
}

export async function getBreakingArticles(
  client: DbClient,
  locale = "en",
  limit = 10,
): Promise<ArticleWithDetails[]> {
  const { data, error } = await client
    .from("posts")
    .select(selectFields)
    .eq("status", "published")
    .eq("importance", "breaking")
    .eq("post_translations.locale", locale)
    .in("post_translations.translation_status", [...PUBLIC_TRANSLATION_STATUSES])
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((r) => mapRow(r as Record<string, unknown>, locale, false));
}

export async function getTrendingArticles(
  client: DbClient,
  locale = "en",
  limit = 10,
): Promise<ArticleWithDetails[]> {
  const { data, error } = await client
    .from("posts")
    .select(selectFields)
    .eq("status", "published")
    .eq("post_translations.locale", locale)
    .in("post_translations.translation_status", [...PUBLIC_TRANSLATION_STATUSES])
    .in("importance", ["breaking", "high"])
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((r) => mapRow(r as Record<string, unknown>, locale, false));
}

export async function getRelatedArticles(
  client: DbClient,
  postId: string,
  locale = "en",
  limit = 4,
): Promise<ArticleWithDetails[]> {
  const { data: rawPost } = await client
    .from("posts")
    .select("category_id, hashtags")
    .eq("id", postId)
    .maybeSingle();
  const post = rawPost as Pick<Post, "category_id" | "hashtags"> | null;
  if (!post) return [];

  const { data, error } = await client
    .from("posts")
    .select(selectFields)
    .eq("status", "published")
    .eq("post_translations.locale", locale)
    .in("post_translations.translation_status", [...PUBLIC_TRANSLATION_STATUSES])
    .neq("id", postId)
    .or(`category_id.eq.${post.category_id},hashtags.cs.{${post.hashtags.join(",")}}`)
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []).map((r) => mapRow(r as Record<string, unknown>, locale, false));
}

export async function getMarketImpact(
  client: DbClient,
  postId: string,
): Promise<Record<string, unknown> | null> {
  const { data: aiData, error: aiError } = await client
    .from("ai_analyses")
    .select("result")
    .eq("post_id", postId)
    .eq("analysis_type", "market_impact")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!aiError && aiData) {
    return (aiData as unknown as { result: Record<string, unknown> }).result;
  }

  const { data: maData, error: maError } = await client
    .from("market_analyses")
    .select("*")
    .eq("post_id", postId)
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (maError || !maData) return null;
  return maData as unknown as Record<string, unknown>;
}

/**
 * Return the locales (and their slugs) for which a public translation of
 * this post exists. Used to emit accurate hreflang tags.
 */
export async function getAvailableTranslations(
  client: DbClient,
  postId: string,
): Promise<Array<{ locale: string; slug: string }>> {
  const { data, error } = await client
    .from("post_translations")
    .select("locale, slug, translation_status")
    .eq("post_id", postId)
    .in("translation_status", [...PUBLIC_TRANSLATION_STATUSES]);
  if (error) return [];
  return ((data ?? []) as Array<{ locale: string; slug: string; translation_status: string }>)
    .map((r) => ({ locale: r.locale, slug: r.slug }));
}

/**
 * Return the latest completed AI analysis for an article, or null.
 * Public readers only ever see `status = 'completed'` rows. Failed and
 * review_required rows are kept server-side for editorial inspection but
 * never reach the public page.
 */
export async function getLatestAnalysis(
  client: DbClient,
  postId: string,
): Promise<Record<string, unknown> | null> {
  const { data, error } = await client
    .from("ai_analyses")
    .select("result, analysis_version, model, created_at")
    .eq("post_id", postId)
    .eq("analysis_type", "news_analyzer")
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as { result: Record<string, unknown>; analysis_version: string; model: string | null; created_at: string };
  return { ...row.result, _meta: { version: row.analysis_version, model: row.model, generated_at: row.created_at } };
}

/**
 * Basic multilingual search: ILIKE on title/summary/content of the
 * requested locale's completed translations. No embeddings, no semantic
 * search — that lands in a later phase.
 */
export async function searchPublishedArticles(
  client: DbClient,
  query: string,
  options: { locale?: string; limit?: number } = {},
): Promise<ArticleWithDetails[]> {
  const { locale = "en", limit = 20 } = options;
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];
  // Escape PostgREST special chars and wrap in %...% for ILIKE.
  const safe = trimmed.replace(/[%,_]/g, (m) => `\\${m}`);
  const pattern = `%${safe}%`;
  const { data, error } = await client
    .from("posts")
    .select(selectFields)
    .eq("status", "published")
    .eq("post_translations.locale", locale)
    .in("post_translations.translation_status", [...PUBLIC_TRANSLATION_STATUSES])
    .or(`title.ilike.${pattern},summary.ilike.${pattern},content.ilike.${pattern}`)
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []).map((r) => mapRow(r as Record<string, unknown>, locale, false));
}
