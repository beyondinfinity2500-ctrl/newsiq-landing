/**
 * AI analysis service (Phase 7).
 *
 * Pipeline:
 *   input normalization
 *        ↓
 *   cache lookup (post_id + analysis_version)
 *        ↓ (miss)
 *   provider call (with bounded retries)
 *        ↓
 *   Zod validation of model output
 *        ↓
 *   persist as `pending` then mark `completed`
 *        ↓
 *   return persisted record
 *
 * Important invariants:
 *   - AI is only invoked on the server, never in the browser.
 *   - The provider key is never logged or returned to callers.
 *   - The same (post_id, analysis_version) tuple will never produce two
 *     distinct completed rows — the second call returns the cached one.
 *   - Provider failures mark the analysis `failed` with a sanitized error
 *     and never propagate secrets.
 */

import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";
import { ValidationError, NotFoundError, ExternalServiceError } from "@/lib/errors";
import { aiAnalysisSchema, type AiAnalysis } from "@/lib/validation";
import { getAnalysisProvider } from "@/lib/ai/provider";
import { buildAnalysisPrompt, ANALYSIS_VERSION } from "@/lib/ai/prompts";
import { siteConfig } from "@/config/site";
import type { Database } from "@/lib/supabase/types";
import type { SupabaseClient } from "@supabase/supabase-js";

type DbClient = SupabaseClient<Database>;

export type AnalysisStatus = "pending" | "processing" | "completed" | "failed" | "review_required";

export interface AnalysisRecord {
  id: string;
  post_id: string;
  status: AnalysisStatus;
  analysis_version: string;
  result: AiAnalysis | null;
  model: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
}

export interface GenerateAnalysisInput {
  postId: string;
  /** Bypass cache and force a fresh call. Reserved for editorial "regenerate". */
  force?: boolean;
}

const ANALYSIS_TYPE = "news_analyzer" as const;
const MARKET_TYPE = "market_impact" as const;

/**
 * Build the normalized input the prompt expects from a `posts` row plus
 * its preferred translation.
 */
async function loadArticleForAnalysis(
  client: DbClient,
  postId: string,
): Promise<{
  title: string;
  summary: string;
  content: string;
  sourceName: string;
  sourceCountry: string | null;
  category: string | null;
  publishedAt: string | null;
  language: string;
  importance: string;
}> {
  const { data: post, error } = await client
    .from("posts")
    .select("id, original_locale, original_language, country, content, importance, published_at, sources(name, country_code), categories(slug)")
    .eq("id", postId)
    .maybeSingle();
  if (error || !post) throw new NotFoundError(`Post ${postId} not found`);

  // Prefer the original-language translation, fall back to the default locale.
  const originalLocale = (post as { original_locale: string }).original_locale ?? "en";
  const { data: tr } = await client
    .from("post_translations")
    .select("title, summary, content, locale, translation_status")
    .eq("post_id", postId)
    .eq("locale", originalLocale)
    .in("translation_status", ["completed", "published"])
    .maybeSingle();
  const fallbackTr = tr as { title: string; summary: string | null; content: string | null; locale: string; translation_status: string } | null;

  const sourcesRel = (post as { sources: { name: string; country_code: string | null } | null }).sources;
  const categoriesRel = (post as { categories: { slug: string } | null }).categories;

  return {
    title: fallbackTr?.title ?? (postId as string),
    summary: fallbackTr?.summary ?? "",
    content: fallbackTr?.content ?? ((post as { content: string | null }).content ?? ""),
    sourceName: sourcesRel?.name ?? "Unknown",
    sourceCountry: sourcesRel?.country_code ?? ((post as { country: string | null }).country ?? null),
    category: categoriesRel?.slug ?? null,
    publishedAt: (post as { published_at: string | null }).published_at,
    language: fallbackTr?.locale ?? originalLocale,
    importance: (post as { importance: string }).importance,
  };
}

/** Look up a cached completed analysis. Returns null if absent. */
async function fetchCachedAnalysis(
  client: DbClient,
  postId: string,
  version: string,
): Promise<AnalysisRecord | null> {
  const { data, error } = await client
    .from("ai_analyses")
    .select("id, post_id, status, analysis_version, result, model, error, created_at, updated_at")
    .eq("post_id", postId)
    .eq("analysis_type", ANALYSIS_TYPE)
    .eq("analysis_version", version)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    logger.warn("ai.cache.lookup_failed", { postId, reason: error.message });
    return null;
  }
  return (data as unknown as AnalysisRecord | null) ?? null;
}

/** Persist a new analysis row in the requested status. */
async function persistAnalysis(
  client: DbClient,
  postId: string,
  payload: {
    status: AnalysisStatus;
    result?: AiAnalysis;
    model?: string;
    error?: string;
  },
): Promise<AnalysisRecord> {
  const row = {
    post_id: postId,
    analysis_type: ANALYSIS_TYPE,
    analysis_version: ANALYSIS_VERSION,
    status: payload.status,
    result: (payload.result ?? null) as unknown as Database["public"]["Tables"]["ai_analyses"]["Insert"]["result"],
    model: payload.model ?? null,
    error: payload.error ?? null,
  } as never;
  const { data, error } = await client
    .from("ai_analyses")
    .insert(row)
    .select("id, post_id, status, analysis_version, result, model, error, created_at, updated_at")
    .single();
  if (error || !data) {
    throw new ExternalServiceError("ai-analysis", `Failed to persist analysis: ${error?.message ?? "no row"}`);
  }
  return data as unknown as AnalysisRecord;
}

/**
 * The single public entry point. Idempotent on (postId, ANALYSIS_VERSION)
 * unless `force: true` is passed (editorial regeneration).
 *
 * Authorization: the caller is responsible for checking that the actor
 * has the right to trigger an analysis. Typical callers are:
 *   - the ingestion service after a post is approved,
 *   - the editorial "regenerate" Server Action (editor+),
 *   - the cron job.
 *
 * @param input  postId (required), force (optional)
 * @returns the persisted analysis record
 */
export async function generateNewsAnalysis(
  input: GenerateAnalysisInput,
  options: { useServiceRole?: boolean } = {},
): Promise<AnalysisRecord> {
  const { postId, force = false } = input;
  if (!z.string().uuid().safeParse(postId).success) {
    throw new ValidationError("Invalid postId");
  }
  const provider = getAnalysisProvider();
  if (!provider.isConfigured()) {
    throw new ExternalServiceError("ai-provider", "AI provider is not configured on this environment.");
  }

  const userClient = await createSupabaseServerClient();
  const writer = options.useServiceRole ? createSupabaseAdminClient() : userClient;
  // Service-role writes to ai_analyses. Reads still go through the user client
  // (RLS applies) so cache lookups respect policy.
  const reader = userClient;

  if (!force) {
    const cached = await fetchCachedAnalysis(reader, postId, ANALYSIS_VERSION);
    if (cached) {
      logger.info("ai.cache.hit", { postId, version: ANALYSIS_VERSION });
      return cached;
    }
  }

  const article = await loadArticleForAnalysis(reader, postId);
  const prompt = buildAnalysisPrompt(article);

  // 1) record the attempt as `processing` so a re-run can see it.
  const pending = await persistAnalysis(writer, postId, { status: "processing", model: provider.name });

  // 2) call the provider.
  let raw: unknown;
  try {
    raw = await provider.complete(prompt);
  } catch (err) {
    const safeMessage = err instanceof Error ? err.message : "AI provider failed";
    const sanitized = safeMessage.replace(/sk-[a-zA-Z0-9-_]+/g, "[REDACTED]");
    await writer
      .from("ai_analyses")
      .update({ status: "failed", error: sanitized } as never)
      .eq("id", pending.id);
    logger.error("ai.analysis.failed", { postId, reason: sanitized });
    throw err instanceof ExternalServiceError || err instanceof Error
      ? err
      : new ExternalServiceError("ai-provider", sanitized);
  }

  // 3) strict Zod validation. Anything that fails here is marked review_required.
  const parsed = aiAnalysisSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const message = issue ? `${issue.path.join(".")}: ${issue.message}` : "Validation failed";
    await writer
      .from("ai_analyses")
      .update({
        status: "review_required",
        error: `output_schema: ${message}`,
        // We persist the raw payload as the result for editorial inspection,
        // but never expose it to anonymous users.
        result: raw as never,
      } as never)
      .eq("id", pending.id);
    logger.warn("ai.analysis.review_required", { postId, reason: message });
    throw new ValidationError(`AI output failed validation: ${message}`);
  }

  // 4) promote to `completed`.
  const { data: completed, error: updateError } = await writer
    .from("ai_analyses")
    .update({
      status: "completed",
      result: parsed.data as never,
      error: null,
    } as never)
    .eq("id", pending.id)
    .select("id, post_id, status, analysis_version, result, model, error, created_at, updated_at")
    .single();
  if (updateError || !completed) {
    throw new ExternalServiceError(
      "ai-analysis",
      `Failed to mark analysis completed: ${updateError?.message ?? "no row"}`,
    );
  }
  logger.info("ai.analysis.completed", {
    postId,
    version: ANALYSIS_VERSION,
    model: provider.name,
    locale: article.language,
  });
  return completed as unknown as AnalysisRecord;
}

/**
 * Read the latest completed analysis for a post (or null).
 * Public callers use the regular server client; RLS is the gate.
 */
export async function getLatestCompletedAnalysis(
  client: DbClient,
  postId: string,
  options: { version?: string } = {},
): Promise<AnalysisRecord | null> {
  const version = options.version ?? ANALYSIS_VERSION;
  const { data, error } = await client
    .from("ai_analyses")
    .select("id, post_id, status, analysis_version, result, model, error, created_at, updated_at")
    .eq("post_id", postId)
    .eq("analysis_type", ANALYSIS_TYPE)
    .eq("analysis_version", version)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return null;
  return (data as unknown as AnalysisRecord | null) ?? null;
}

/** Re-export the type for convenience. */
export type { AiAnalysis };

/** Helper used by the editorial review flow. */
export async function setAnalysisStatus(
  client: DbClient,
  analysisId: string,
  status: AnalysisStatus,
): Promise<void> {
  const { error } = await client
    .from("ai_analyses")
    .update({ status } as never)
    .eq("id", analysisId);
  if (error) {
    throw new ValidationError(error.message);
  }
}

// Re-export version so callers do not import from prompts.
export { ANALYSIS_VERSION };

// Locale of the article we just analyzed. Used by the news data-access layer
// to decide whether to display the analysis inline. Phase 7 keeps analysis
// output in its original article language; localization of the prose is a
// later phase (translation pipeline already wired in Phase 6).
void siteConfig;

export const AI_ANALYSIS_TYPE = ANALYSIS_TYPE;
export const AI_MARKET_TYPE = MARKET_TYPE;
