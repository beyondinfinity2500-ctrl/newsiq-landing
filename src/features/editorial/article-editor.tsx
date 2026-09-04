"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { Post, PostTranslation, PostStatus, VerificationStatus, ImportanceLevel, ContentType } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Save, Send } from "lucide-react";

interface ArticleEditorProps {
  locale: string;
  post?: Post;
  translations?: PostTranslation[];
  categories: { id: string; slug: string; name: string }[];
  sources: { id: string; name: string }[];
}

export function ArticleEditor({ locale, post, translations, categories, sources }: ArticleEditorProps) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const originalTranslation = translations?.find((tr) => tr.is_original) ?? translations?.[0];

  const [postForm, setPostForm] = useState({
    slug: post?.slug ?? "",
    category_id: post?.category_id ?? "",
    source_id: post?.source_id ?? "",
    country: post?.country ?? "",
    status: (post?.status ?? "draft") as PostStatus,
    verification_status: (post?.verification_status ?? "unverified") as VerificationStatus,
    importance: (post?.importance ?? "medium") as ImportanceLevel,
    content_type: (post?.content_type ?? "news") as ContentType,
    cover_image_url: post?.cover_image_url ?? "",
    source_url: post?.source_url ?? "",
    original_locale: post?.original_locale ?? locale,
    hashtags: (post?.hashtags ?? []).join(", "),
    financial_assets: (post?.financial_assets ?? []).join(", "),
    entities: (post?.entities ?? []).join(", "),
  });

  const [trForm, setTrForm] = useState({
    title: originalTranslation?.title ?? "",
    summary: originalTranslation?.summary ?? "",
    content: originalTranslation?.content ?? "",
    slug: originalTranslation?.slug ?? post?.slug ?? "",
    seo_title: originalTranslation?.seo_title ?? "",
    seo_description: originalTranslation?.seo_description ?? "",
    translation_status: (originalTranslation?.translation_status ?? "draft") as string,
  });

  const isEdit = !!post;

  /**
   * Save the post in its current lifecycle state (or "draft" when creating).
   * We never directly publish from the form — publication requires going
   * through the explicit publish flow on the post detail page so that the
   * pre-publish business rules (status check, translation presence, etc.)
   * run server-side via `publishPostAction`.
   */
  const handleSave = (action: "draft" | "submit_for_review") => {
    setError(null);
    startTransition(async () => {
      try {
        const postPayload = {
          ...postForm,
          hashtags: postForm.hashtags.split(",").map((s) => s.trim()).filter(Boolean),
          financial_assets: postForm.financial_assets.split(",").map((s) => s.trim()).filter(Boolean),
          entities: postForm.entities.split(",").map((s) => s.trim()).filter(Boolean),
          category_id: postForm.category_id || null,
          source_id: postForm.source_id || null,
          country: postForm.country || null,
        };

        let postId = post?.id;
        if (isEdit && postId) {
          await fetch(`/api/admin/posts/${postId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(postPayload),
          });
        } else {
          // Always create as a draft. Submission is a separate explicit step.
          const res = await fetch("/api/admin/posts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...postPayload, status: "draft" }),
          });
          const created = await res.json();
          postId = created.id;
        }

        if (postId && trForm.title) {
          await fetch(`/api/admin/posts/${postId}/translations`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...trForm,
              locale: postForm.original_locale,
              is_original: true,
              translation_status: action === "submit_for_review" ? "reviewed" : trForm.translation_status,
            }),
          });
        }

        // If the editor asked to submit for review, do it via the Server
        // Action (which enforces the post-must-have-translation rule).
        if (action === "submit_for_review" && postId) {
          const fd = new FormData();
          fd.set("postId", postId);
          const res = await fetch("/api/admin/posts/submit", {
            method: "POST",
            body: fd,
          });
          if (!res.ok && res.status !== 303) {
            const text = await res.text().catch(() => "");
            throw new Error(text || "Failed to submit for review");
          }
        }

        router.push(`/${locale}/admin/posts`);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      }
    });
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Post metadata */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {t("posts.metadata")}
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="slug">{t("posts.slug")}</Label>
            <Input id="slug" value={postForm.slug} onChange={(e) => setPostForm({ ...postForm, slug: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="original_locale">{t("posts.originalLocale")}</Label>
            <Input id="original_locale" value={postForm.original_locale} onChange={(e) => setPostForm({ ...postForm, original_locale: e.target.value })} />
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="category_id">{t("posts.category")}</Label>
            <Select value={postForm.category_id} onValueChange={(v) => setPostForm({ ...postForm, category_id: v ?? "" })}>
              <SelectTrigger id="category_id"><SelectValue placeholder={t("posts.selectCategory")} /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="source_id">{t("posts.source")}</Label>
            <Select value={postForm.source_id} onValueChange={(v) => setPostForm({ ...postForm, source_id: v ?? "" })}>
              <SelectTrigger id="source_id"><SelectValue placeholder={t("posts.selectSource")} /></SelectTrigger>
              <SelectContent>
                {sources.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="status">{t("posts.status")}</Label>
            <Select value={postForm.status} onValueChange={(v) => setPostForm({ ...postForm, status: (v ?? "draft") as PostStatus })}>
              <SelectTrigger id="status"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">{t("posts.statusDraft")}</SelectItem>
                <SelectItem value="published">{t("posts.statusPublished")}</SelectItem>
                <SelectItem value="archived">{t("posts.statusArchived")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="importance">{t("posts.importance")}</Label>
            <Select value={postForm.importance} onValueChange={(v) => setPostForm({ ...postForm, importance: (v ?? "medium") as ImportanceLevel })}>
              <SelectTrigger id="importance"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">{t("posts.importanceLow")}</SelectItem>
                <SelectItem value="medium">{t("posts.importanceMedium")}</SelectItem>
                <SelectItem value="high">{t("posts.importanceHigh")}</SelectItem>
                <SelectItem value="breaking">{t("posts.importanceBreaking")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="verification_status">{t("posts.verification")}</Label>
            <Select value={postForm.verification_status} onValueChange={(v) => setPostForm({ ...postForm, verification_status: (v ?? "unverified") as VerificationStatus })}>
              <SelectTrigger id="verification_status"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="unverified">{t("posts.verificationUnverified")}</SelectItem>
                <SelectItem value="verified">{t("posts.verificationVerified")}</SelectItem>
                <SelectItem value="developing">{t("posts.verificationDeveloping")}</SelectItem>
                <SelectItem value="likely">{t("posts.verificationLikely")}</SelectItem>
                <SelectItem value="disputed">{t("posts.verificationDisputed")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="content_type">{t("posts.contentType")}</Label>
            <Select value={postForm.content_type} onValueChange={(v) => setPostForm({ ...postForm, content_type: (v ?? "news") as ContentType })}>
              <SelectTrigger id="content_type"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="news">{t("posts.contentTypeNews")}</SelectItem>
                <SelectItem value="breaking">{t("posts.contentTypeBreaking")}</SelectItem>
                <SelectItem value="developing">{t("posts.contentTypeDeveloping")}</SelectItem>
                <SelectItem value="eyewitness">{t("posts.contentTypeEyewitness")}</SelectItem>
                <SelectItem value="analysis">{t("posts.contentTypeAnalysis")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">{t("posts.country")}</Label>
            <Input id="country" value={postForm.country} onChange={(e) => setPostForm({ ...postForm, country: e.target.value })} placeholder="US" />
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="cover_image_url">{t("posts.coverImage")}</Label>
            <Input id="cover_image_url" value={postForm.cover_image_url} onChange={(e) => setPostForm({ ...postForm, cover_image_url: e.target.value })} placeholder="https://..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="source_url">{t("posts.sourceUrl")}</Label>
            <Input id="source_url" value={postForm.source_url} onChange={(e) => setPostForm({ ...postForm, source_url: e.target.value })} placeholder="https://..." />
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="hashtags">{t("posts.hashtags")}</Label>
            <Input id="hashtags" value={postForm.hashtags} onChange={(e) => setPostForm({ ...postForm, hashtags: e.target.value })} placeholder="tag1, tag2" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="entities">{t("posts.entities")}</Label>
            <Input id="entities" value={postForm.entities} onChange={(e) => setPostForm({ ...postForm, entities: e.target.value })} placeholder="entity1, entity2" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="financial_assets">{t("posts.financialAssets")}</Label>
            <Input id="financial_assets" value={postForm.financial_assets} onChange={(e) => setPostForm({ ...postForm, financial_assets: e.target.value })} placeholder="BTC, AAPL" />
          </div>
        </div>
      </div>

      {/* Translation editor */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {t("posts.translation")} — {postForm.original_locale}
        </h2>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tr_title">{t("posts.title")}</Label>
            <Input id="tr_title" value={trForm.title} onChange={(e) => setTrForm({ ...trForm, title: e.target.value })} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tr_summary">{t("posts.summary")}</Label>
            <Textarea id="tr_summary" value={trForm.summary} onChange={(e) => setTrForm({ ...trForm, summary: e.target.value })} rows={3} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tr_content">{t("posts.content")}</Label>
            <Textarea id="tr_content" value={trForm.content} onChange={(e) => setTrForm({ ...trForm, content: e.target.value })} rows={12} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tr_slug">{t("posts.translationSlug")}</Label>
              <Input id="tr_slug" value={trForm.slug} onChange={(e) => setTrForm({ ...trForm, slug: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tr_status">{t("posts.translationStatus")}</Label>
              <Select value={trForm.translation_status} onValueChange={(v) => setTrForm({ ...trForm, translation_status: v ?? "draft" })}>
                <SelectTrigger id="tr_status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">{t("posts.translationDraft")}</SelectItem>
                  <SelectItem value="reviewed">{t("posts.translationReviewed")}</SelectItem>
                  <SelectItem value="published">{t("posts.translationPublished")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tr_seo_title">{t("posts.seoTitle")}</Label>
              <Input id="tr_seo_title" value={trForm.seo_title} onChange={(e) => setTrForm({ ...trForm, seo_title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tr_seo_description">{t("posts.seoDescription")}</Label>
              <Input id="tr_seo_description" value={trForm.seo_description} onChange={(e) => setTrForm({ ...trForm, seo_description: e.target.value })} />
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={() => handleSave("draft")} disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {t("posts.saveDraft")}
        </Button>
        {(!isEdit || post?.status === "draft" || post?.status === "rejected") && (
          <Button type="button" variant="default" onClick={() => handleSave("submit_for_review")} disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            {t("posts.submitForReview")}
          </Button>
        )}
        <Button type="button" variant="outline" onClick={() => router.push(`/${locale}/admin/posts`)}>
          {t("posts.cancel")}
        </Button>
        <p className="ms-auto text-xs text-muted-foreground">
          {t("posts.publishHint")}
        </p>
      </div>
    </div>
  );
}
