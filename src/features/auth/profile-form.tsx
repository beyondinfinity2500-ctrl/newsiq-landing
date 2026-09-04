"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { updateProfileAction } from "@/features/auth/actions";
import type { Profile } from "@/lib/supabase/types";
import { siteConfig } from "@/config/site";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const TIMEZONES = [
  "UTC", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "America/Sao_Paulo", "Europe/London", "Europe/Paris", "Europe/Berlin", "Europe/Moscow",
  "Africa/Cairo", "Asia/Dubai", "Asia/Tehran", "Asia/Kolkata", "Asia/Shanghai",
  "Asia/Tokyo", "Asia/Seoul", "Asia/Singapore", "Australia/Sydney", "Pacific/Auckland",
];

export function ProfileForm({ profile }: { profile: Profile; locale: string }) {
  const t = useTranslations("auth");
  const searchParams = useSearchParams();
  const saved = searchParams.get("message") === "saved";

  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      try {
        await updateProfileAction(formData);
        return {};
      } catch (err) {
        return { error: err instanceof Error ? err.message : "Update failed" };
      }
    },
    null,
  );

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("profileTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("profileSubtitle")}</p>
      </div>

      {saved && (
        <div className="rounded-lg border border-success/30 bg-success/5 px-4 py-3 text-sm text-success">
          {t("profileSaved")}
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="display_name">{t("displayName")}</Label>
          <Input
            id="display_name"
            name="display_name"
            type="text"
            defaultValue={profile.display_name ?? ""}
            disabled={isPending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="avatar_url">{t("avatarUrl")}</Label>
          <Input
            id="avatar_url"
            name="avatar_url"
            type="url"
            placeholder="https://..."
            defaultValue={profile.avatar_url ?? ""}
            disabled={isPending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="preferred_locale">{t("preferredLanguage")}</Label>
          <Select name="preferred_locale" defaultValue={profile.preferred_locale}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {siteConfig.locales.map((l) => (
                <SelectItem key={l} value={l}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="timezone">{t("timezone")}</Label>
          <Select name="timezone" defaultValue={profile.timezone}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIMEZONES.map((tz) => (
                <SelectItem key={tz} value={tz}>
                  {tz}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {state?.error && (
          <div className="rounded-lg border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">
            {state.error}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? <Loader2 className="size-4 animate-spin" /> : t("saveProfile")}
        </Button>
      </form>
    </div>
  );
}
