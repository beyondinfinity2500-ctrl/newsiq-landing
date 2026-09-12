/**
 * Image source type abstraction.
 *
 * Defines the provenance of an article image. This is a type-safe enum
 * that allows the system to track where an image comes from without
 * coupling the code to a specific provider or API.
 *
 * Future implementation notes:
 * - 'manual': image uploaded manually via the admin UI (FormData → Supabase Storage → DB)
 * - 'external': image sourced from an external URL/editorial asset
 * - 'ai': AI-generated image (future feature; gated by product rules)
 *
 * This abstraction is intentionally minimal — it does not include provider
 * credentials, API configurations, or generation logic. Those concerns
 * are out of scope for this stage.
 */
export type ImageSourceType = 'manual' | 'external' | 'ai';

/**
 * Minimal metadata for an image source, stored alongside the article.
 *
 * These fields are safe to expose publicly because they only describe
 * the source provenance — they do not contain credentials, URLs that
 * bypass RLS, or sensitive configuration.
 */
export interface ImageSourceMetadata {
  /** The source type enum. */
  source: ImageSourceType;
  /** Optional human-readable description / source attribution. */
  attribution?: string;
  /** Optional caption / alt-text source reference. */
  caption?: string;
}