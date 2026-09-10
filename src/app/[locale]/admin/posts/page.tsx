import { getTranslations } from "next-intl/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireEditor } from "@/lib/security/authorization";
import { getAllPosts } from "@/features/editorial/data-access";
import { getActiveSources } from "@/features/sources/data-access";
import {
  publishPostAction,
  unpublishPostAction,
  reviewPostAction,
} from "@/features/editorial/actions";
import Link from "next/link";
import { Plus, Pencil, Eye, Send, X, Check, FileText, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

const statusStyles: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  pending_review: "bg-warning/15 text-warning",
  approved: "bg-info/15 text-info",
  published: "bg-success/15 text-success",
  rejected: "bg-destructive/15 text-destructive",
  archived: "bg-muted text-muted-foreground",
};

function statusBadgeKey(status: string): string {
  const map: Record<string, string> = {
    draft: "statusDraft",
    pending_review: "statusPending",
    approved: "statusApproved",
    published: "statusPublished",
    rejected: "statusRejected",
    archived: "statusArchived",
  };
  return map[status] ?? "statusDraft";
}

export default async function AdminPostsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string; message?: string }>;
}) {
  const { locale } = await params;
  const { status, message } = await searchParams;
  const t = await getTranslations("admin");
  const supabase = await createSupabaseServerClient();

  await requireEditor(supabase);

  const posts = await getAllPosts(supabase, { status, limit: 50 });

  // Bump the types so we can use the Server Actions in <form action={...}>.
  const publish = publishPostAction;
  const unpublish = unpublishPostAction;
  const review = reviewPostAction;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("posts.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("posts.subtitle")}</p>
        </div>
        <Link href={`/${locale}/admin/posts/new`}>
          <Button>
            <Plus className="size-4" />
            {t("posts.addNew")}
          </Button>
        </Link>
      </div>

      {message && (
        <div className="mb-4 rounded-lg border border-success/30 bg-success/5 px-4 py-2 text-sm text-success">
          {t(`posts.flash.${message}` as never) ?? message}
        </div>
      )}

      {/* Status filter */}
      <div className="mb-4 flex flex-wrap gap-2">
        <Link href={`/${locale}/admin/posts`}>
          <Button variant={!status ? "default" : "outline"} size="sm">{t("posts.all")}</Button>
        </Link>
        <Link href={`/${locale}/admin/posts?status=pending_review`}>
          <Button variant={status === "pending_review" ? "default" : "outline"} size="sm">{t("posts.statusPending")}</Button>
        </Link>
        <Link href={`/${locale}/admin/posts?status=draft`}>
          <Button variant={status === "draft" ? "default" : "outline"} size="sm">{t("posts.statusDraft")}</Button>
        </Link>
        <Link href={`/${locale}/admin/posts?status=approved`}>
          <Button variant={status === "approved" ? "default" : "outline"} size="sm">{t("posts.statusApproved")}</Button>
        </Link>
        <Link href={`/${locale}/admin/posts?status=published`}>
          <Button variant={status === "published" ? "default" : "outline"} size="sm">{t("posts.statusPublished")}</Button>
        </Link>
        <Link href={`/${locale}/admin/posts?status=rejected`}>
          <Button variant={status === "rejected" ? "default" : "outline"} size="sm">{t("posts.statusRejected")}</Button>
        </Link>
        <Link href={`/${locale}/admin/posts?status=archived`}>
          <Button variant={status === "archived" ? "default" : "outline"} size="sm">{t("posts.statusArchived")}</Button>
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <FileText className="mx-auto mb-3 size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{t("posts.empty")}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("posts.title")}</th>
                <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("posts.status")}</th>
                <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("posts.importance")}</th>
                <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("posts.translations")}</th>
                <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("posts.date")}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => {
                const originalTr = post.translations.find((tr) => tr.is_original) ?? post.translations[0];
                return (
                  <tr key={post.id} className="border-b border-border transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <span className="font-medium text-foreground">{originalTr?.title ?? post.title}</span>
                      <span className="block text-xs text-muted-foreground">/{post.slug}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[post.status] ?? ""}`}>
                        {t(`posts.${statusBadgeKey(post.status)}` as never)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="capitalize">{post.importance}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {post.translations.length} ({post.translations.map((tr) => tr.locale).join(", ")})
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {new Date(post.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {post.status === "published" && (
                          <Link href={`/${locale}/news/${originalTr?.slug ?? post.slug}`} target="_blank">
                            <Button variant="ghost" size="icon" className="size-8" aria-label={t("posts.view")}>
                              <Eye className="size-3.5" />
                            </Button>
                          </Link>
                        )}
                        <Link href={`/${locale}/admin/posts/${post.id}`}>
                          <Button variant="ghost" size="icon" className="size-8" aria-label={t("posts.edit")}>
                            <Pencil className="size-3.5" />
                          </Button>
                        </Link>

                        {post.status === "pending_review" && (
                          <>
                            <form action={review}>
                              <input type="hidden" name="postId" value={post.id} />
                              <input type="hidden" name="decision" value="approve" />
                              <Button type="submit" variant="ghost" size="icon" className="size-8 text-success" aria-label={t("posts.approve")}>
                                <Check className="size-3.5" />
                              </Button>
                            </form>
                            <form action={review}>
                              <input type="hidden" name="postId" value={post.id} />
                              <input type="hidden" name="decision" value="reject" />
                              <Button type="submit" variant="ghost" size="icon" className="size-8 text-destructive" aria-label={t("posts.reject")}>
                                <X className="size-3.5" />
                              </Button>
                            </form>
                          </>
                        )}

                        {post.status === "approved" && (
                          <form action={publish}>
                            <input type="hidden" name="postId" value={post.id} />
                            <Button type="submit" variant="ghost" size="icon" className="size-8 text-success" aria-label={t("posts.publish")}>
                              <Send className="size-3.5" />
                            </Button>
                          </form>
                        )}

                        {post.status === "published" && (
                          <form action={unpublish}>
                            <input type="hidden" name="postId" value={post.id} />
                            <Button type="submit" variant="ghost" size="icon" className="size-8 text-warning" aria-label={t("posts.unpublish")}>
                              <Archive className="size-3.5" />
                            </Button>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
