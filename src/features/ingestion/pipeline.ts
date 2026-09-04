/**
 * News ingestion pipeline (Phase 5).
 *
 * Architecture (intentionally additive — never replaces existing modules):
 *
 *   Source Adapter (RSS/Atom/etc.)
 *        ↓
 *   Normalizer   (raw feed → NormalizedArticle)
 *        ↓
 *   Deduplicator (source+external_id, canonical URL, content hash)
 *        ↓
 *   Validator    (Zod shape; reject malformed items)
 *        ↓
 *   Post Repository (creates post in `pending_review` status)
 *        ↓
 *   Supabase
 *
 * Design rules:
 * - All ingestion runs SERVER-SIDE only. The browser cannot insert posts or
 *   modify source credibility.
 * - Fetched items always start in `pending_review` — no auto-publish.
 * - Duplicate detection runs BEFORE any insert; the dedup layer returns a
 *   structured result, never throws on a duplicate.
 * - The pipeline is provider-neutral: new adapters plug in without changing
 *   the normalizer or post repository.
 */

import { createHash } from "node:crypto";
import { env } from "@/config/env";
import { logger } from "@/lib/logger";
import { z } from "zod";
import type { Database } from "@/lib/supabase/types";
import type { SupabaseClient } from "@supabase/supabase-js";

type DbClient = SupabaseClient<Database>;

// =============================================================================
// Normalized article (the canonical internal shape every adapter must produce)
// =============================================================================

export const NormalizedArticleSchema = z.object({
  external_id: z.string().min(1).max(512),
  source_id: z.string().uuid(),
  canonical_url: z
    .string()
    .url()
    .max(2048)
    .optional()
    .nullable(),
  title: z.string().min(1).max(500),
  summary: z.string().max(2000).optional().nullable(),
  content: z.string().max(50_000).optional().nullable(),
  author: z.string().max(200).optional().nullable(),
  published_at: z.string().datetime().optional().nullable(),
  language: z.string().min(2).max(8),
  country: z.string().length(2).optional().nullable(),
  category: z.string().max(100).optional().nullable(),
  image_url: z.string().url().optional().nullable(),
  fetched_at: z.string().datetime(),
});

export type NormalizedArticle = z.infer<typeof NormalizedArticleSchema>;

// =============================================================================
// Deduplication
// =============================================================================

/** Stable fingerprint of the article body — used to catch re-syndication. */
export function contentFingerprint(title: string, url: string | null | undefined): string {
  const normalizedTitle = title
    .toLowerCase()
    .replace(/[\s\p{P}]+/gu, " ")
    .trim();
  return createHash("sha256")
    .update(`${normalizedTitle}\n${url ?? ""}`)
    .digest("hex")
    .slice(0, 32);
}

/** Normalize a URL for dedup: strip utm_* and trailing slash. */
export function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    for (const key of Array.from(u.searchParams.keys())) {
      if (key.toLowerCase().startsWith("utm_")) {
        u.searchParams.delete(key);
      }
    }
    u.hash = "";
    if (u.pathname.endsWith("/") && u.pathname.length > 1) {
      u.pathname = u.pathname.replace(/\/+$/, "");
    }
    return u.toString();
  } catch {
    return url;
  }
}

export type DedupMatch =
  | { kind: "new" }
  | { kind: "duplicate"; reason: "external_id" | "canonical_url" | "fingerprint" | "url_normalized" };

/**
 * Check whether an incoming article has already been ingested.
 *
 * Signals (first match wins, in priority order):
 *   1. same source_id + external_id
 *   2. same canonical_url (or normalized canonical_url) on any post
 *   3. same content fingerprint (sha256 of title+url) on same source
 *
 * Fingerprint is intentionally scoped to a single source so the same wire
 * story published by two outlets is not collapsed into one DB record.
 */
export async function findDuplicate(
  client: DbClient,
  article: NormalizedArticle,
): Promise<DedupMatch> {
  // Signal 1: source + external_id (the strongest, source-scoped identity).
  const byExternal = await client
    .from("posts")
    .select("id")
    .eq("source_id", article.source_id)
    .eq("external_id", article.external_id)
    .maybeSingle();
  if (!byExternal.error && byExternal.data) {
    return { kind: "duplicate", reason: "external_id" };
  }

  // Signal 2: canonical_url.
  if (article.canonical_url) {
    const normalized = normalizeUrl(article.canonical_url);
    const byUrl = await client
      .from("posts")
      .select("id")
      .or(`canonical_url.eq.${article.canonical_url},canonical_url.eq.${normalized}`)
      .maybeSingle();
    if (!byUrl.error && byUrl.data) {
      return { kind: "duplicate", reason: "canonical_url" };
    }
  }

  // Signal 3: content fingerprint within the same source.
  const fp = contentFingerprint(article.title, article.canonical_url ?? null);
  const byFp = await client
    .from("posts")
    .select("id, title, canonical_url")
    .eq("source_id", article.source_id)
    .limit(50);
  if (byFp.error) {
    // If fingerprint lookup fails we still proceed and let the insert decide —
    // never let a dedup miss crash the pipeline.
    logger.warn("ingest.dedup.fingerprint_lookup_failed", {
      sourceId: article.source_id,
      reason: byFp.error.message,
    });
  } else {
    for (const row of (byFp.data ?? []) as Array<{ id: string; title: string; canonical_url: string | null }>) {
      if (contentFingerprint(row.title, row.canonical_url) === fp) {
        return { kind: "duplicate", reason: "fingerprint" };
      }
    }
  }

  return { kind: "new" };
}

// =============================================================================
// Persistence
// =============================================================================

export type IngestionOutcome =
  | { kind: "created"; postId: string }
  | { kind: "duplicate"; reason: "external_id" | "canonical_url" | "fingerprint" | "url_normalized" }
  | { kind: "rejected"; reason: string };

/**
 * Persist one normalized article in `pending_review` status. Editors must
 * explicitly promote it to `published`; this layer never auto-publishes.
 */
export async function persistPendingArticle(
  client: DbClient,
  article: NormalizedArticle,
): Promise<IngestionOutcome> {
  const dedup = await findDuplicate(client, article);
  if (dedup.kind === "duplicate") {
    return { kind: "duplicate", reason: dedup.reason };
  }

  const { data, error } = await client
    .from("posts")
    .insert({
      source_id: article.source_id,
      external_id: article.external_id,
      canonical_url: article.canonical_url ?? null,
      original_locale: article.language,
      original_language: article.language,
      country_code: article.country ?? null,
      status: "pending_review",
      importance: "medium",
      verification_status: "unverified",
      published_at: null,
      fetched_at: article.fetched_at,
      content: article.content ?? null,
      image_url: article.image_url ?? null,
    } as never)
    .select("id")
    .single();

  if (error || !data) {
    return { kind: "rejected", reason: error?.message ?? "Insert returned no row" };
  }
  return { kind: "created", postId: (data as { id: string }).id };
}

// =============================================================================
// RSS / Atom adapter
// =============================================================================

/**
 * Minimal RSS 2.0 / Atom 1.0 adapter. Intentionally does NOT depend on an
 * XML library to keep the bundle small and the boundary clear. It produces a
 * stream of raw `FeedItem`s that the normalizer will then validate.
 */

export interface FeedItem {
  externalId: string;
  title: string;
  url: string | null;
  summary: string | null;
  content: string | null;
  author: string | null;
  publishedAt: string | null;
  language: string | null;
  imageUrl: string | null;
}

function tagValue(xml: string, tag: string): string | null {
  // Match <tag>...</tag> or <tag .../>. Case-insensitive, attribute-tolerant.
  const re = new RegExp(
    `<\\s*${tag}[^>]*>([\\s\\S]*?)<\\s*/\\s*${tag}\\s*>`,
    "i",
  );
  const m = re.exec(xml);
  return m ? m[1].trim() : null;
}

function attrValue(xml: string, tag: string, attr: string): string | null {
  const re = new RegExp(`<\\s*${tag}[^>]*\\b${attr}="([^"]*)"`, "i");
  const m = re.exec(xml);
  return m ? m[1] : null;
}

function parseDate(s: string | null): string | null {
  if (!s) return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

/** Parse a single RSS 2.0 <item> or Atom <entry> block. */
export function parseFeedItem(raw: string, isAtom: boolean): FeedItem | null {
  if (isAtom) {
    const id = tagValue(raw, "id") ?? tagValue(raw, "link");
    const title = tagValue(raw, "title");
    if (!id || !title) return null;
    const href = attrValue(raw, "link", "href");
    const summary = tagValue(raw, "summary") ?? tagValue(raw, "content");
    const authorEl = tagValue(raw, "author") ?? tagValue(raw, "name");
    const updated = tagValue(raw, "updated") ?? tagValue(raw, "published");
    return {
      externalId: id,
      title,
      url: href,
      summary: summary?.slice(0, 2000) ?? null,
      content: summary ?? null,
      author: authorEl,
      publishedAt: parseDate(updated),
      language: null,
      imageUrl: null,
    };
  }

  // RSS 2.0
  const title = tagValue(raw, "title");
  const link = tagValue(raw, "link");
  const guid = tagValue(raw, "guid") ?? link;
  if (!title || !guid) return null;
  return {
    externalId: guid,
    title,
    url: link,
    summary: tagValue(raw, "description"),
    content: tagValue(raw, "content:encoded") ?? tagValue(raw, "description"),
    author: tagValue(raw, "author") ?? tagValue(raw, "dc:creator"),
    publishedAt: parseDate(tagValue(raw, "pubDate")),
    language: null,
    imageUrl:
      attrValue(raw, "enclosure", "url") ??
      attrValue(raw, "media:thumbnail", "url") ??
      attrValue(raw, "media:content", "url"),
  };
}

export interface FetchedFeed {
  items: FeedItem[];
  detectedLanguage: string | null;
}

export async function fetchFeed(feedUrl: string, options: { timeoutMs?: number } = {}): Promise<FetchedFeed> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 10_000);
  try {
    const res = await fetch(feedUrl, {
      signal: controller.signal,
      headers: { "user-agent": "NewsIQ/1.0 (+https://newsiq.top)" },
    });
    if (!res.ok) {
      throw new Error(`Feed responded ${res.status} ${res.statusText}`);
    }
    const xml = await res.text();
    const isAtom = /<feed[\s>]/i.test(xml) && !/<rss[\s>]/i.test(xml);
    const itemTag = isAtom ? "entry" : "item";
    const re = new RegExp(`<\\s*${itemTag}\\b[\\s\\S]*?<\\s*/\\s*${itemTag}\\s*>`, "gi");
    const blocks = xml.match(re) ?? [];
    const items: FeedItem[] = [];
    for (const block of blocks) {
      const item = parseFeedItem(block, isAtom);
      if (item) items.push(item);
    }
    const detectedLanguage = attrValue(xml, isAtom ? "feed" : "rss", "xml:lang");
    return { items, detectedLanguage };
  } finally {
    clearTimeout(timeout);
  }
}

/** Convert one feed item into the normalized shape the rest of the pipeline expects. */
export function normalizeFeedItem(
  item: FeedItem,
  source: { id: string; default_language?: string | null; country_code?: string | null },
  now: string = new Date().toISOString(),
): NormalizedArticle | { error: string } {
  const candidate: NormalizedArticle = {
    external_id: item.externalId,
    source_id: source.id,
    canonical_url: item.url,
    title: item.title,
    summary: item.summary,
    content: item.content,
    author: item.author,
    published_at: item.publishedAt,
    language: item.language ?? source.default_language ?? "en",
    country: source.country_code ?? null,
    category: null,
    image_url: item.imageUrl,
    fetched_at: now,
  };
  const parsed = NormalizedArticleSchema.safeParse(candidate);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid article" };
  }
  return parsed.data;
}

// =============================================================================
// Ingestion run (the public surface for a cron trigger)
// =============================================================================

export interface IngestionRunReport {
  sourceId: string;
  sourceName: string;
  startedAt: string;
  completedAt: string;
  fetchedCount: number;
  createdCount: number;
  duplicateCount: number;
  rejectedCount: number;
  errorCount: number;
  errors: Array<{ externalId?: string; message: string }>;
}

/** Result of a single article in a run. */
type ArticleRunResult =
  | { kind: "created"; externalId: string }
  | { kind: "duplicate"; externalId: string; reason: string }
  | { kind: "rejected"; externalId: string; reason: string };

/**
 * Ingest one source: fetch → normalize → dedup → persist.
 * Returns a structured report suitable for logging or returning to a cron caller.
 */
export async function ingestSource(
  client: DbClient,
  source: { id: string; name: string; feed_url: string | null; default_language?: string | null; country_code?: string | null },
): Promise<IngestionRunReport> {
  const startedAt = new Date().toISOString();
  const report: IngestionRunReport = {
    sourceId: source.id,
    sourceName: source.name,
    startedAt,
    completedAt: startedAt,
    fetchedCount: 0,
    createdCount: 0,
    duplicateCount: 0,
    rejectedCount: 0,
    errorCount: 0,
    errors: [],
  };

  if (!source.feed_url) {
    report.errorCount = 1;
    report.errors.push({ message: "Source has no feed_url configured" });
    report.completedAt = new Date().toISOString();
    logger.warn("ingest.source.skipped", { sourceId: source.id, reason: "no_feed_url" });
    return report;
  }

  let feed: FetchedFeed;
  try {
    feed = await fetchFeed(source.feed_url);
  } catch (err) {
    report.errorCount = 1;
    report.errors.push({ message: err instanceof Error ? err.message : "Unknown fetch error" });
    report.completedAt = new Date().toISOString();
    logger.error("ingest.source.fetch_failed", {
      sourceId: source.id,
      sourceName: source.name,
      reason: report.errors[0]?.message,
    });
    return report;
  }

  report.fetchedCount = feed.items.length;

  // Process serially to avoid hammering the DB. For very large feeds this can
  // be parallelized later behind a bounded queue.
  for (const item of feed.items) {
    const normalized = normalizeFeedItem(item, source);
    if ("error" in normalized) {
      report.rejectedCount += 1;
      report.errors.push({ externalId: item.externalId, message: normalized.error });
      continue;
    }
    try {
      const outcome = await persistPendingArticle(client, normalized);
      switch (outcome.kind) {
        case "created":
          report.createdCount += 1;
          break;
        case "duplicate":
          report.duplicateCount += 1;
          break;
        case "rejected":
          report.rejectedCount += 1;
          report.errors.push({ externalId: item.externalId, message: outcome.reason });
          break;
      }
    } catch (err) {
      report.errorCount += 1;
      report.errors.push({
        externalId: item.externalId,
        message: err instanceof Error ? err.message : "Unknown persist error",
      });
    }
  }

  report.completedAt = new Date().toISOString();
  logger.info("ingest.source.completed", {
    sourceId: source.id,
    sourceName: source.name,
    fetched: report.fetchedCount,
    created: report.createdCount,
    duplicates: report.duplicateCount,
    rejected: report.rejectedCount,
    errors: report.errorCount,
  });
  return report;
}

/**
 * Ingest every active source that has a feed_url. Designed to be called by
 * Vercel Cron or an external scheduler; not intended for browser invocation.
 */
export async function ingestAllActiveSources(client: DbClient): Promise<IngestionRunReport[]> {
  const { data, error } = await client
    .from("sources")
    .select("id, name, feed_url, default_language, country_code")
    .eq("is_active", true)
    .not("feed_url", "is", null);
  if (error) {
    logger.error("ingest.list_sources_failed", { reason: error.message });
    return [];
  }
  const sources = (data ?? []) as Array<{
    id: string;
    name: string;
    feed_url: string | null;
    default_language: string | null;
    country_code: string | null;
  }>;
  const reports: IngestionRunReport[] = [];
  for (const source of sources) {
    if (!source.feed_url) continue;
    // eslint-disable-next-line no-await-in-loop
    const r = await ingestSource(client, source);
    reports.push(r);
  }
  return reports;
}

/** Sanity check: bail out if the env is missing (called from the cron route). */
export function assertServerEnvironment(): void {
  if (!env.supabase.serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for ingestion.");
  }
}
