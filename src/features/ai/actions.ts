"use server";

/**
 * AI analysis editorial actions (Phase 7).
 *
 *   - regenerateAnalysisAction: editor+ forces a new analysis (bypasses
 *     cache). Uses the service-role client because the writer path needs
 *     to insert a new row regardless of RLS.
 *   - reviewAnalysisAction: editor+ approves or rejects a review_required
 *     / completed analysis. Approval promotes it to `completed`; rejection
 *     marks it `failed` so it never surfaces to readers.
 */

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";
import { ValidationError, ForbiddenError } from "@/lib/errors";
import { requireEditor } from "@/lib/security/authorization";
import {
  generateNewsAnalysis,
  setAnalysisStatus,
  ANALYSIS_VERSION,
} from "@/features/ai/analysis-service";

async function getLocale(): Promise<string> {
  const h = await headers();
  return h.get("x-next-intl-locale") ?? "en";
}

const regenerateSchema = z.object({
  postId: z.string().uuid(),
});

/** Force a fresh analysis run for a post. Editor+ only. */
export async function regenerateAnalysisAction(formData: FormData): Promise<void> {
  const locale = await getLocale();
  const { postId } = regenerateSchema.parse({ postId: formData.get("postId") });

  const supabase = await createSupabaseServerClient();
  const { user, role } = await requireEditor(supabase);

  try {
    await generateNewsAnalysis({ postId, force: true }, { useServiceRole: true });
  } catch (err) {
    logger.error("editorial.regenerate_analysis.failed", {
      actorId: user.id,
      actorRole: role,
      postId,
      reason: err instanceof Error ? err.message : "unknown",
    });
    throw err instanceof Error ? err : new ValidationError("Analysis regeneration failed.");
  }

  logger.warn("editorial.regenerate_analysis.success", {
    actorId: user.id,
    actorRole: role,
    postId,
    version: ANALYSIS_VERSION,
  });
  revalidatePath(`/${locale}/admin/posts/${postId}`);
  redirect(`/${locale}/admin/posts/${postId}?message=analysis-regenerated`);
}

const reviewAnalysisSchema = z.object({
  analysisId: z.string().uuid(),
  decision: z.enum(["approve", "reject"]),
});

/** Approve or reject an AI analysis. Editor+ only. */
export async function reviewAnalysisAction(formData: FormData): Promise<void> {
  const locale = await getLocale();
  const { analysisId, decision } = reviewAnalysisSchema.parse({
    analysisId: formData.get("analysisId"),
    decision: formData.get("decision"),
  });

  const supabase = await createSupabaseServerClient();
  const { user, role } = await requireEditor(supabase);

  const next = decision === "approve" ? "completed" : "failed";
  if (next === "failed" && role === "editor") {
    // Only admin+ can fail-out a completed analysis; editors can only
    // promote review_required → completed.
    throw new ForbiddenError("Only admin+ can reject a completed analysis.");
  }
  await setAnalysisStatus(supabase, analysisId, next);
  logger.warn("editorial.review_analysis", {
    actorId: user.id,
    actorRole: role,
    analysisId,
    decision,
  });

  revalidatePath(`/${locale}/admin/posts`);
  redirect(`/${locale}/admin/posts?message=analysis-reviewed`);
}

// Internal helper used by tests and seed scripts. Not exported as a public
// action — there is no UI hook today, and exposing it as `"use server"`
// would let any client trigger an analysis burst. We mark it intentionally
// unused so the linter does not flag it.
void createSupabaseAdminClient;
