"use client";

/**
 * Translations Manager (Editorial Workflow phase).
 *
 * Lists every translation row for a post and lets editors create / edit /
 * delete per-locale translations. The canonical post is preserved
 * regardless of which translation is being edited.
 *
 * Authoring note: we keep this as a client component for live status
 * updates, but every write still goes through the existing Server
 * Actions (upsertTranslationAction) or a direct Supabase call. The
 * editor cannot bypass RLS.
 */

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Trash2, Plus, Check, Pencil, X, Globe2 } from "lucide-react";
import { siteConfig, type SiteLocale } from "@/config/site";
import { localeNames } from "@/config/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import type { PostTranslation } from "@/lib/supabase/types";

const TRANSLATION_STATUSES = ["draft", "reviewed", "published"] as const;
type TranslationStatus = (typeof TRANSLATION_STATUSES)[number];

interface TranslationsManagerProps {
  postId: string;
  locale: string;
  translations: PostTranslation[];
}

interface EditState {
  locale: SiteLocale;
  title: string;
  summary: string;
  content: string;
  slug: string;
  seoTitle: string;
  seoDescription: string;
  translationStatus: TranslationStatus;
}

function emptyEdit(locale: SiteLocale): EditState {
  return {
    locale,
    title: "",
    summary: "",
    content: "",
    slug: "",
    seoTitle: "",
    seoDescription: "",
    translationStatus: "draft",
  };
}

export function TranslationsManager({ postId, locale, translations }: TranslationsManagerProps) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [editing, setEditing] = useState<EditState | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const presentLocales = new Set(translations.map((tr) => tr.locale));
  const missingLocales = siteConfig.locales.filter((l) => !presentLocales.has(l));

  const startCreate = (l: SiteLocale) => {
    setError(null);
    setEditing(emptyEdit(l));
  };

  const startEdit = (tr: PostTranslation) => {
    setError(null);
    setEditing({
      locale: tr.locale as SiteLocale,
      title: tr.title,
      summary: tr.summary ?? "",
      content: tr.content ?? "",
      slug: tr.slug,
      seoTitle: tr.seo_title ?? "",
      seoDescription: tr.seo_description ?? "",
      translationStatus: (tr.translation_status as TranslationStatus) ?? "draft",
    });
  };

  const cancel = () => {
    setEditing(null);
    setError(null);
  };

  const save = () => {
    if (!editing) return;
    setError(null);
    if (!editing.title.trim() || !editing.slug.trim() || !editing.content.trim()) {
      setError(t("posts.translations.errors.required"));
      return;
    }
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/posts/${postId}/translations`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            post_id: postId,
            locale: editing.locale,
            title: editing.title,
            summary: editing.summary || null,
            content: editing.content,
            slug: editing.slug,
            seo_title: editing.seoTitle || null,
            seo_description: editing.seoDescription || null,
            translation_status: editing.translationStatus,
            is_original: false,
          }),
        });
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(text || "Failed to save translation");
        }
        setEditing(null);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save translation");
      }
    });
  };

  const remove = (tr: PostTranslation) => {
    if (!confirm(t("posts.translations.confirmDelete"))) return;
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/posts/${postId}/translations?locale=${tr.locale}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(text || "Failed to delete translation");
        }
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete translation");
      }
    });
  };

  return (
    <section className="rounded-xl border border-border bg-card p-5" aria-label={t("posts.translations.title")}>
      <header className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
          <Globe2 className="size-4 text-info" aria-hidden="true" />
          {t("posts.translations.title")}
        </h2>
      </header>

      {error && (
        <div className="mb-3 rounded-lg border border-error/30 bg-error/5 px-3 py-2 text-sm text-error">
          {error}
        </div>
      )}

      <div className="mb-5 overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-start">{t("posts.translations.locale")}</th>
              <th className="px-3 py-2 text-start">{t("posts.translations.title")}</th>
              <th className="px-3 py-2 text-start">{t("posts.translations.slug")}</th>
              <th className="px-3 py-2 text-start">{t("posts.translations.status")}</th>
              <th className="px-3 py-2 text-end">{t("posts.translations.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {translations.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-4 text-center text-sm text-muted-foreground">
                  {t("posts.translations.empty")}
                </td>
              </tr>
            ) : (
              translations.map((tr) => (
                <tr key={tr.id} className="border-t border-border">
                  <td className="px-3 py-2">
                    <span dir={(tr.locale === "ar" || tr.locale === "fa") ? "rtl" : "ltr"} className="text-sm font-medium text-foreground">
                      {localeNames[tr.locale as SiteLocale] ?? tr.locale}
                    </span>
                    {tr.is_original && (
                      <span className="ms-2 rounded-full bg-info/15 px-2 py-0.5 text-xs text-info">
                        {t("posts.translations.original")}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-foreground">{tr.title}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">/{tr.slug}</td>
                  <td className="px-3 py-2 text-xs capitalize text-muted-foreground">{tr.translation_status}</td>
                  <td className="px-3 py-2 text-end">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => startEdit(tr)}
                        aria-label={t("posts.translations.edit")}
                        className="size-8"
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(tr)}
                        aria-label={t("posts.translations.delete")}
                        className="size-8 text-destructive"
                        disabled={pending}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editing ? (
        <div className="mb-5 rounded-lg border border-info/30 bg-info/5 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">
              {t("posts.translations.editing", { locale: localeNames[editing.locale] ?? editing.locale })}
            </h3>
            <div className="flex items-center gap-1">
              <Button type="button" variant="ghost" size="icon" onClick={cancel} className="size-8" aria-label="Cancel">
                <X className="size-3.5" />
              </Button>
              <Button type="button" onClick={save} disabled={pending} size="sm">
                {pending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                {t("posts.save")}
              </Button>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="tr-title">{t("posts.translations.title")}</Label>
              <Input id="tr-title" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} disabled={pending} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tr-slug">{t("posts.translations.slug")}</Label>
              <Input id="tr-slug" value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} disabled={pending} dir="ltr" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tr-status">{t("posts.translations.status")}</Label>
              <select
                id="tr-status"
                value={editing.translationStatus}
                onChange={(e) => setEditing({ ...editing, translationStatus: e.target.value as TranslationStatus })}
                disabled={pending}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {TRANSLATION_STATUSES.map((s) => (
                  <option key={s} value={s}>{t(`posts.translation${s.charAt(0).toUpperCase()}${s.slice(1)}` as never)}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="tr-summary">{t("posts.summary")}</Label>
              <Textarea id="tr-summary" rows={2} value={editing.summary} onChange={(e) => setEditing({ ...editing, summary: e.target.value })} disabled={pending} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="tr-content">{t("posts.content")}</Label>
              <Textarea id="tr-content" rows={6} value={editing.content} onChange={(e) => setEditing({ ...editing, content: e.target.value })} disabled={pending} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tr-seo-title">{t("posts.seoTitle")}</Label>
              <Input id="tr-seo-title" value={editing.seoTitle} onChange={(e) => setEditing({ ...editing, seoTitle: e.target.value })} disabled={pending} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tr-seo-desc">{t("posts.seoDescription")}</Label>
              <Input id="tr-seo-desc" value={editing.seoDescription} onChange={(e) => setEditing({ ...editing, seoDescription: e.target.value })} disabled={pending} />
            </div>
          </div>
        </div>
      ) : null}

      {missingLocales.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("posts.translations.addNew")}
          </p>
          <div className="flex flex-wrap gap-2">
            {missingLocales.map((l) => (
              <Button
                key={l}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => startCreate(l)}
                disabled={pending}
              >
                <Plus className="size-3.5" />
                <span dir={(l === "ar" || l === "fa") ? "rtl" : "ltr"}>{localeNames[l]}</span>
              </Button>
            ))}
          </div>
        </div>
      )}

      <p className="mt-4 text-xs text-muted-foreground">
        {t("posts.translations.footerNote")}
      </p>
    </section>
  );
}
