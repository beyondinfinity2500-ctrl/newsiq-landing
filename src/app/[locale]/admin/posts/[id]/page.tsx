import { getTranslations } from "next-intl/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireEditor } from "@/lib/security/authorization";
import { getPostById } from "@/features/editorial/data-access";
import { getActiveSources } from "@/features/sources/data-access";
import {
  publishPostAction,
  unpublishPostAction,
  submitForReviewAction,
  archivePostAction,
} from "@/features/editorial/actions";
import { regenerateAnalysisAction } from "@/features/ai/actions";
import { ArticleEditor } from "@/features/editorial/article-editor";
import { TranslationsManager } from "@/features/editorial/translations-manager";
import { Sparkles, Send, Archive, X, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

export default async function EditPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ message?: string }>;
}) {
  const { locale, id } = await params;
  const { message } = await searchParams;
  const t = await getTranslations("admin");
  const supabase = await createSupabaseServerClient();

  await requireEditor(supabase);

  let post;
  try {
    post = await getPostById(supabase, id);
  } catch {
    notFound();
  }

  const { data: catData } = await supabase
    .from("categories")
    .select("id, slug, name")
    .eq("is_active", true)
    .order("sort_order");
  const categories = (catData ?? []) as { id: string; slug: string; name: string }[];
  const sources = await getActiveSources(supabase).then((s) => s.map((src) => ({ id: src.id, name: src.name })));

  const status = post.status;
  const flash = message ? (t(`posts.flash.${message}` as never) as string) : null;
  const originalTr = post.translations.find((tr) => tr.is_original) ?? post.translations[0];

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 lg:px-6">
      <Link href={`/${locale}/admin/posts`} className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="size-4" />
        {t("posts.back")}
      </Link>

      {flash && (
        <div className="mb-4 rounded-lg border border-success/30 bg-success/5 px-4 py-2 text-sm text-success">
          {flash}
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("posts.editPost")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {originalTr?.title ?? t("posts.untitled")} ·{" "}
            <span className="font-medium capitalize text-foreground">
              {t(`posts.status${status.charAt(0).toUpperCase()}${status.slice(1)}` as never)}
            </span>
          </p>
        </div>

        {/* Lifecycle action bar */}
        <div className="flex flex-wrap items-center gap-2">
          {(status === "draft" || status === "rejected") && (
            <form action={submitForReviewAction}>
              <input type="hidden" name="postId" value={post.id} />
              <Button type="submit" variant="default" size="sm">
                <Send className="size-4" />
                {t("posts.submitForReview")}
              </Button>
            </form>
          )}

          {(status === "approved" || status === "pending_review") && (
            <form action={publishPostAction}>
              <input type="hidden" name="postId" value={post.id} />
              <Button type="submit" variant="default" size="sm">
                <Send className="size-4" />
                {t("posts.publish")}
              </Button>
            </form>
          )}

          {status === "published" && (
            <>
              <Link href={`/${locale}/news/${originalTr?.slug ?? post.slug}`} target="_blank">
                <Button type="button" variant="outline" size="sm">
                  <Eye className="size-4" />
                  {t("posts.viewLive")}
                </Button>
              </Link>
              <form action={unpublishPostAction}>
                <input type="hidden" name="postId" value={post.id} />
                <Button type="submit" variant="outline" size="sm">
                  <X className="size-4" />
                  {t("posts.unpublish")}
                </Button>
              </form>
            </>
          )}

          {status !== "archived" && status !== "published" && (
            <form action={archivePostAction}>
              <input type="hidden" name="postId" value={post.id} />
              <Button type="submit" variant="ghost" size="sm" className="text-warning">
                <Archive className="size-4" />
                {t("posts.archive")}
              </Button>
            </form>
          )}

          <form action={regenerateAnalysisAction}>
            <input type="hidden" name="postId" value={post.id} />
            <Button type="submit" variant="outline" size="sm">
              <Sparkles className="size-4" />
              {t("posts.regenerateAnalysis")}
            </Button>
          </form>
        </div>
      </div>

      <div className="space-y-6">
        <ArticleEditor
          locale={locale}
          post={post}
          translations={post.translations}
          categories={categories}
          sources={sources}
        />

        <TranslationsManager
          postId={post.id}
          locale={locale}
          translations={post.translations}
        />
      </div>
    </div>
  );
}
