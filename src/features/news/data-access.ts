/**
 * News data-access layer — the ONLY module that touches posts/post_translations.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Post, PostTranslation, Source } from "@/lib/supabase/types";
import { NotFoundError } from "@/lib/errors";

type DbClient = SupabaseClient<Database>;

export interface ArticleWithDetails extends Post {
  translation: PostTranslation;
  source_name: string;
  source_reliability: number;
}

function mapRow(row: Record<string, unknown>): ArticleWithDetails {
  const translations = row.post_translations as unknown as PostTranslation[];
  const source = row.source as unknown as Source | null;
  const { post_translations: _pt, source: _s, ...postFields } = row;
  return {
    ...(postFields as unknown as Post),
    translation: translations[0],
    source_name: source?.name ?? "User Report",
    source_reliability: source?.credibility_score ?? 0,
  };
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
    .order("published_at", { ascending: false })
    .limit(limit);
  if (category) q = q.eq("category_id", category);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map((r) => mapRow(r as Record<string, unknown>));
}

export async function getArticleBySlug(
  client: DbClient,
  slug: string,
  locale: string,
): Promise<ArticleWithDetails> {
  const { data: tr } = await client
    .from("post_translations")
    .select("post_id")
    .eq("slug", slug)
    .maybeSingle();
  const translation = tr as Pick<PostTranslation, "post_id"> | null;
  if (!translation) throw new NotFoundError(`No article found for slug "${slug}"`);

  const { data, error } = await client
    .from("posts")
    .select(selectFields)
    .eq("id", translation.post_id)
    .eq("post_translations.locale", locale)
    .maybeSingle();

  if (error || !data) {
    const { data: dataEn } = await client
      .from("posts")
      .select(selectFields)
      .eq("id", translation.post_id)
      .eq("post_translations.locale", "en")
      .maybeSingle();
    if (!dataEn) throw new NotFoundError("Article not found");
    return mapRow(dataEn as Record<string, unknown>);
  }
  return mapRow(data as Record<string, unknown>);
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
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((r) => mapRow(r as Record<string, unknown>));
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
    .in("importance", ["breaking", "high"])
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((r) => mapRow(r as Record<string, unknown>));
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
    .neq("id", postId)
    .or(`category_id.eq.${post.category_id},hashtags.cs.{${post.hashtags.join(",")}}`)
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []).map((r) => mapRow(r as Record<string, unknown>));
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
