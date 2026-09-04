/**
 * Translation service boundary (Phase 6 — interface only, no AI yet).
 *
 * Phase 7 will plug concrete adapters (OpenAI, Anthropic, on-device, etc.)
 * behind this interface. By keeping it as a narrow contract now we ensure
 * that:
 *   - React components never call an AI provider directly
 *   - Browser bundles never include provider SDKs
 *   - Server actions can swap implementations without touching call sites
 *
 * The translation record already exists in `post_translations`. Translators
 * receive an existing `original` translation, produce a candidate, and
 * persist it as a new row in `pending` or `review_required` status. The
 * editorial workflow promotes it to `completed` (Phase 5 already does this
 * via `upsertTranslationAction`).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, PostTranslation } from "@/lib/supabase/types";
import { logger } from "@/lib/logger";
import { siteConfig, type SiteLocale } from "@/config/site";

type DbClient = SupabaseClient<Database>;

export type TranslationStatus = PostTranslation["translation_status"] | "processing" | "review_required" | "failed";

export interface TranslateRequest {
  postId: string;
  sourceLocale: SiteLocale;
  targetLocale: SiteLocale;
  /** Optional override; defaults to the post's `original` translation. */
  sourceTranslationId?: string;
}

export interface TranslateResult {
  ok: true;
  translationId: string;
  status: TranslationStatus;
}

export interface TranslateError {
  ok: false;
  error: string;
}

/**
 * Provider-neutral contract. Phase 7 will implement this with a real
 * adapter; Phase 6 ships a no-op adapter that records a `review_required`
 * row so editorial flows can pick it up.
 */
export interface TranslationProvider {
  readonly name: string;
  translate(request: TranslateRequest): Promise<TranslateResult | TranslateError>;
}

/**
 * No-op provider used in Phase 6. It always returns `review_required` —
 * useful for staging environments, for testing the editorial workflow, and
 * for forcing human review before any automated translation is allowed.
 */
export const noopTranslationProvider: TranslationProvider = {
  name: "noop",
  async translate(request) {
    logger.info("translation.noop.review_required", { ...request });
    return { ok: false, error: "Automated translation is not enabled in this environment. Marked for human review." };
  },
};

let activeProvider: TranslationProvider = noopTranslationProvider;

export function setTranslationProvider(provider: TranslationProvider): void {
  activeProvider = provider;
}

export function getTranslationProvider(): TranslationProvider {
  return activeProvider;
}

/**
 * Convenience wrapper used by Server Actions in Phase 7+. Looks up the
 * source translation, invokes the active provider, and (on success) writes
 * the resulting row to `post_translations` with the correct status.
 *
 * The `client` MUST be a service-role client — never the anon client.
 */
export async function requestTranslation(
  client: DbClient,
  request: TranslateRequest,
): Promise<TranslateResult | TranslateError> {
  if (!(siteConfig.locales as readonly string[]).includes(request.targetLocale)) {
    return { ok: false, error: `Unsupported target locale: ${request.targetLocale}` };
  }

  const provider = getTranslationProvider();
  const result = await provider.translate(request);

  if (!result.ok) return result;

  logger.info("translation.requested", {
    provider: provider.name,
    postId: request.postId,
    target: request.targetLocale,
    status: result.status,
  });

  return result;
}
