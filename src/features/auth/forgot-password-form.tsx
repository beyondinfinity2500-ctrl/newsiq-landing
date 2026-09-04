"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { forgotPasswordAction } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export function ForgotPasswordForm({ locale }: { locale: string }) {
  const t = useTranslations("auth");
  const searchParams = useSearchParams();
  const sent = searchParams.get("message") === "sent";

  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      try {
        await forgotPasswordAction(formData);
        return {};
      } catch (err) {
        return { error: err instanceof Error ? err.message : "Request failed" };
      }
    },
    null,
  );

  if (sent) {
    return (
      <div className="mx-auto w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("checkYourEmail")}</h1>
          <p className="text-sm text-muted-foreground">{t("resetLinkSent")}</p>
        </div>
        <div className="text-center">
          <a href={`/${locale}/login`} className="text-sm font-medium text-primary hover:underline">
            {t("backToLogin")}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-sm space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("forgotPasswordTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("forgotPasswordSubtitle")}</p>
      </div>

      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">{t("email")}</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required disabled={isPending} />
        </div>

        {state?.error && (
          <div className="rounded-lg border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">
            {state.error}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? <Loader2 className="size-4 animate-spin" /> : t("sendResetLink")}
        </Button>
      </form>

      <div className="text-center text-sm">
        <a href={`/${locale}/login`} className="font-medium text-primary hover:underline">
          {t("backToLogin")}
        </a>
      </div>
    </div>
  );
}
