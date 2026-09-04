"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { Source } from "@/lib/supabase/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, ToggleLeft, ToggleRight, ExternalLink, Pencil } from "lucide-react";

interface SourceRowProps {
  source: Source;
  locale: string;
  postCount?: number;
}

const verificationColors: Record<string, string> = {
  unverified: "bg-muted text-muted-foreground",
  under_review: "bg-warning/15 text-warning",
  verified: "bg-success/15 text-success",
  rejected: "bg-destructive/15 text-destructive",
};

export function SourceRow({ source, locale, postCount }: SourceRowProps) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      await fetch(`/api/admin/sources/${source.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !source.is_active }),
      });
      router.refresh();
    });
  };

  const handleDelete = () => {
    if (!confirm(t("sources.confirmDelete"))) return;
    startTransition(async () => {
      await fetch(`/api/admin/sources/${source.id}`, { method: "DELETE" });
      router.refresh();
    });
  };

  return (
    <tr className="border-b border-border transition-colors hover:bg-muted/30">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground">{source.name}</span>
          {source.url && (
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="size-3.5" />
            </a>
          )}
        </div>
        {source.domain && (
          <span className="text-xs text-muted-foreground">{source.domain}</span>
        )}
      </td>
      <td className="px-4 py-3">
        <Badge variant="secondary" className="capitalize">
          {t(`sources.types.${source.source_type}`)}
        </Badge>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">
            {source.credibility_score}
          </span>
          <div className="h-1.5 w-16 rounded-full bg-muted">
            <div
              className="h-1.5 rounded-full bg-primary"
              style={{ width: `${source.credibility_score}%` }}
            />
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${verificationColors[source.verification_status] ?? ""}`}>
          {t(`sources.verificationStatus.${source.verification_status}`)}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {postCount !== undefined ? postCount : "—"}
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center gap-1 text-xs font-medium ${
            source.is_active ? "text-success" : "text-muted-foreground"
          }`}
        >
          {source.is_active ? t("sources.activeTrue") : t("sources.activeFalse")}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => router.push(`/${locale}/admin/sources/${source.id}`)}
            aria-label={t("sources.edit")}
          >
            <Pencil className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={handleToggle}
            disabled={pending}
            aria-label={t("sources.toggle")}
          >
            {source.is_active ? (
              <ToggleRight className="size-4 text-success" />
            ) : (
              <ToggleLeft className="size-4 text-muted-foreground" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-destructive hover:text-destructive"
            onClick={handleDelete}
            disabled={pending}
            aria-label={t("sources.delete")}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </td>
    </tr>
  );
}
