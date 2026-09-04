"use server";

/**
 * Editorial Server Actions (Phase 5).
 *
 * Authorization (first line of defense — RLS is authoritative):
 *   - publish / unpublish: requireEditor
 *   - approve / reject:    requireEditor
 *   - create / edit post:  requireEditor
 *   - change role:         requireSuperAdmin (lives in src/features/auth/actions.ts)
 *
 * Ingestion only creates `pending_review` posts; promotion to `published` is
 * always an explicit human action through these actions.
 */

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ValidationError, ForbiddenError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { requireEditor } from "@/lib/security/authorization";
import {
  createPost as repoCreatePost,
  updatePost as repoUpdatePost,
  publishPost as repoPublishPost,
  unpublishPost as repoUnpublishPost,
  upsertTranslation,
  getPostById,
} from "@/features/editorial/data-access";
import {
  createPostSchema,
  createPostTranslationSchema,
} from "@/lib/validation";

async function getLocale(): Promise<string> {
  const h = await headers();
  return h.get("x-next-intl-locale") ?? "en";
}

// =============================================================================
// Post lifecycle
// =============================================================================

const publishDecisionSchema = z.object({
  postId: z.string().uuid("Invalid post id"),
});

/** Promote a `pending_review` post to `published`. Editor+ only. */
export async function publishPostAction(formData: FormData): Promise<void> {
  const locale = await getLocale();
  const { postId } = publishDecisionSchema.parse({
    postId: formData.get("postId"),
  });

  const supabase = await createSupabaseServerClient();
  const { user, role } = await requireEditor(supabase);

  const post = await getPostById(supabase, postId);
  if (post.status === "published") {
    throw new ValidationError("Post is already published.");
  }
  if (post.status === "rejected" || post.status === "archived") {
    throw new ValidationError(`Cannot publish a post with status "${post.status}".`);
  }
  if (post.translations.length === 0) {
    throw new ValidationError("Cannot publish a post without at least one translation.");
  }

  const updated = await repoPublishPost(supabase, postId);
  logger.warn("editorial.publish", {
    actorId: user.id,
    actorRole: role,
    postId: updated.id,
    fromStatus: post.status,
  });
  revalidatePath(`/${locale}/admin/posts`);
  revalidatePath(`/${locale}/news/${post.translations[0]?.slug ?? ""}`);
  redirect(`/${locale}/admin/posts?message=published`);
}

/** Move a published post back to `draft`. Editor+ only. */
export async function unpublishPostAction(formData: FormData): Promise<void> {
  const locale = await getLocale();
  const { postId } = publishDecisionSchema.parse({
    postId: formData.get("postId"),
  });

  const supabase = await createSupabaseServerClient();
  const { user, role } = await requireEditor(supabase);

  await repoUnpublishPost(supabase, postId);
  logger.warn("editorial.unpublish", { actorId: user.id, actorRole: role, postId });
  revalidatePath(`/${locale}/admin/posts`);
  redirect(`/${locale}/admin/posts?message=unpublished`);
}

const reviewDecisionSchema = z.object({
  postId: z.string().uuid(),
  decision: z.enum(["approve", "reject"]),
  reason: z.string().max(500).optional(),
});

/** Approve or reject a `pending_review` post. Editor+ only. */
export async function reviewPostAction(formData: FormData): Promise<void> {
  const locale = await getLocale();
  const { postId, decision, reason } = reviewDecisionSchema.parse({
    postId: formData.get("postId"),
    decision: formData.get("decision"),
    reason: formData.get("reason") || undefined,
  });

  const supabase = await createSupabaseServerClient();
  const { user, role } = await requireEditor(supabase);

  const post = await getPostById(supabase, postId);
  if (post.status !== "pending_review" && post.status !== "draft") {
    throw new ValidationError(`Cannot review a post with status "${post.status}".`);
  }

  const nextStatus = decision === "approve" ? "approved" : "rejected";
  const { error } = await supabase
    .from("posts")
    .update({ status: nextStatus, ...(reason ? { rejection_reason: reason } : {}) } as never)
    .eq("id", postId);
  if (error) {
    logger.error("editorial.review.failed", {
      actorId: user.id,
      actorRole: role,
      postId,
      decision,
      reason: error.message,
    });
    throw new ValidationError(error.message);
  }

  logger.warn("editorial.review", {
    actorId: user.id,
    actorRole: role,
    postId,
    decision,
    fromStatus: post.status,
  });

  revalidatePath(`/${locale}/admin/posts`);
  redirect(`/${locale}/admin/posts?message=reviewed`);
}

// =============================================================================
// Post creation & translation
// =============================================================================

export async function createPostAction(formData: FormData): Promise<void> {
  const locale = await getLocale();
  const supabase = await createSupabaseServerClient();
  const { user, role } = await requireEditor(supabase);

  const input = createPostSchema.parse({
    original_locale: formData.get("original_locale") ?? "en",
    importance: formData.get("importance") ?? "medium",
    country: formData.get("country") || null,
    continent: formData.get("continent") || null,
    category_id: formData.get("category_id") || null,
    source_url: formData.get("source_url") || null,
    source_id: formData.get("source_id") || null,
    entities: [],
    financial_assets: [],
    hashtags: [],
  });

  const post = await repoCreatePost(supabase, {
    ...input,
    status: "draft",
    importance: input.importance ?? "medium",
  } as never);

  logger.info("editorial.create_post", {
    actorId: user.id,
    actorRole: role,
    postId: post.id,
  });

  revalidatePath(`/${locale}/admin/posts`);
  redirect(`/${locale}/admin/posts/${post.id}?message=created`);
}

const upsertTranslationActionSchema = z.object({
  post_id: z.string().uuid(),
  locale: z.string().min(2).max(8),
  title: z.string().min(1).max(300),
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  summary: z.string().max(500).optional(),
  content: z.string().min(1),
  seo_title: z.string().max(300).optional(),
  seo_description: z.string().max(500).optional(),
  is_original: z.boolean().default(false),
});

export async function upsertTranslationAction(formData: FormData): Promise<void> {
  const locale = await getLocale();
  const supabase = await createSupabaseServerClient();
  const { user, role } = await requireEditor(supabase);

  const input = upsertTranslationActionSchema.parse({
    post_id: formData.get("post_id"),
    locale: formData.get("locale"),
    title: formData.get("title"),
    slug: formData.get("slug"),
    summary: formData.get("summary") || undefined,
    content: formData.get("content"),
    seo_title: formData.get("seo_title") || undefined,
    seo_description: formData.get("seo_description") || undefined,
    is_original: formData.get("is_original") === "true",
  });

  // Backwards-compat: createPostTranslationSchema is the canonical schema.
  const normalized = createPostTranslationSchema.parse(input);

  const translation = await upsertTranslation(supabase, normalized as never);
  logger.info("editorial.upsert_translation", {
    actorId: user.id,
    actorRole: role,
    postId: translation.post_id,
    locale: translation.locale,
  });

  revalidatePath(`/${locale}/admin/posts/${translation.post_id}`);
  redirect(`/${locale}/admin/posts/${translation.post_id}?message=translation-saved`);
}

// =============================================================================
// Guard: never expose a draft / rejected / pending post publicly
// =============================================================================

/**
 * The query helpers in `features/news/data-access.ts` already filter on
 * `status = 'published'` so public pages cannot leak drafts. This is a
 * second check at the action boundary: editor-side mutations cannot target
 * an already-published post without going through `unpublishPostAction` first.
 */
export async function _assertEditableStatus(status: string): Promise<void> {
  if (status === "published" || status === "archived") {
    throw new ForbiddenError(`Post in status "${status}" is not editable in this flow.`);
  }
}

// Re-export so call sites don't need to import from data-access directly.
export { repoUpdatePost as updatePostById };
