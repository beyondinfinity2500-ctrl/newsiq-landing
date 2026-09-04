"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { Source } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Save } from "lucide-react";

interface SourceFormProps {
  locale: string;
  source?: Source;
  mode: "create" | "edit";
}

export function SourceForm({ locale, source, mode }: SourceFormProps) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: source?.name ?? "",
    domain: source?.domain ?? "",
    url: source?.url ?? "",
    country: source?.country ?? "",
    language: source?.language ?? "en",
    source_type: source?.source_type ?? "media",
    credibility_score: source?.credibility_score ?? 50,
    verification_status: source?.verification_status ?? "unverified",
    is_active: source?.is_active ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const payload = {
          ...form,
          domain: form.domain || null,
          url: form.url || null,
          country: form.country || null,
        };
        const url = mode === "create" ? "/api/admin/sources" : `/api/admin/sources/${source!.id}`;
        const method = mode === "create" ? "POST" : "PATCH";
        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "Request failed");
        }
        router.push(`/${locale}/admin/sources`);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">{t("sources.name")}</Label>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="domain">{t("sources.domain")}</Label>
          <Input
            id="domain"
            value={form.domain}
            onChange={(e) => setForm({ ...form, domain: e.target.value })}
            placeholder="example.com"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="url">{t("sources.url")}</Label>
          <Input
            id="url"
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            placeholder="https://example.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="country">{t("sources.country")}</Label>
          <Input
            id="country"
            value={form.country}
            onChange={(e) => setForm({ ...form, country: e.target.value })}
            placeholder="US"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="language">{t("sources.language")}</Label>
          <Input
            id="language"
            value={form.language}
            onChange={(e) => setForm({ ...form, language: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="source_type">{t("sources.type")}</Label>
          <Select
            value={form.source_type}
            onValueChange={(v) => setForm({ ...form, source_type: v ?? "media" })}
          >
            <SelectTrigger id="source_type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="agency">{t("sources.types.agency")}</SelectItem>
              <SelectItem value="media">{t("sources.types.media")}</SelectItem>
              <SelectItem value="social">{t("sources.types.social")}</SelectItem>
              <SelectItem value="official">{t("sources.types.official")}</SelectItem>
              <SelectItem value="community">{t("sources.types.community")}</SelectItem>
              <SelectItem value="other">{t("sources.types.other")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="credibility_score">{t("sources.credibility")}</Label>
          <div className="flex items-center gap-3">
            <Input
              id="credibility_score"
              type="number"
              min={0}
              max={100}
              value={form.credibility_score}
              onChange={(e) =>
                setForm({ ...form, credibility_score: parseInt(e.target.value) || 0 })
              }
              className="w-24"
            />
            <div className="h-2 flex-1 rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-primary transition-all"
                style={{ width: `${form.credibility_score}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="verification_status">{t("sources.verification")}</Label>
          <Select
            value={form.verification_status}
            onValueChange={(v) => setForm({ ...form, verification_status: v ?? "unverified" })}
          >
            <SelectTrigger id="verification_status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unverified">{t("sources.verificationStatus.unverified")}</SelectItem>
              <SelectItem value="under_review">{t("sources.verificationStatus.under_review")}</SelectItem>
              <SelectItem value="verified">{t("sources.verificationStatus.verified")}</SelectItem>
              <SelectItem value="rejected">{t("sources.verificationStatus.rejected")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="is_active">{t("sources.active")}</Label>
          <Select
            value={form.is_active ? "true" : "false"}
            onValueChange={(v) => setForm({ ...form, is_active: v === "true" })}
          >
            <SelectTrigger id="is_active">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">{t("sources.activeTrue")}</SelectItem>
              <SelectItem value="false">{t("sources.activeFalse")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          {mode === "create" ? t("sources.create") : t("sources.save")}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/${locale}/admin/sources`)}
        >
          {t("sources.cancel")}
        </Button>
      </div>
    </form>
  );
}
