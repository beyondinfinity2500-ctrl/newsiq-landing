"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { resetPasswordAction } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export function ResetPasswordForm(_: { locale: string }) {
  const t = useTranslations("auth");
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      try {
        await resetPasswordAction(formData);
        return {};
      } catch (err) {
        return { error: err instanceof Error ? err.message : "Reset failed" };
      }
    },
    null,
  );

  return (
    <div className="mx-auto w-full max-w-sm space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("resetPasswordTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("resetPasswordSubtitle")}</p>
      </div>

      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">{t("newPassword")}</Label>
          <Input id="password" name="password" type="password" autoComplete="new-password" required disabled={isPending} />
          <p className="text-xs text-muted-foreground">{t("passwordHint")}</p>
        </div>

        {state?.error && (
          <div className="rounded-lg border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">
            {state.error}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? <Loader2 className="size-4 animate-spin" /> : t("resetPassword")}
        </Button>
      </form>
    </div>
  );
}
