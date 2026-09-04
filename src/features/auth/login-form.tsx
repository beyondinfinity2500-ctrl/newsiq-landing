"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { signInAction } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export function LoginForm({ locale }: { locale: string }) {
  const t = useTranslations("auth");
  const searchParams = useSearchParams();
  const message = searchParams.get("message");

  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      try {
        await signInAction(formData);
        return {};
      } catch (err) {
        return { error: err instanceof Error ? err.message : "Login failed" };
      }
    },
    null,
  );

  return (
    <div className="mx-auto w-full max-w-sm space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("loginTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("loginSubtitle")}</p>
      </div>

      {message === "check-email" && (
        <div className="rounded-lg border border-success/30 bg-success/5 px-4 py-3 text-sm text-success">
          {t("checkEmail")}
        </div>
      )}
      {message === "password-reset" && (
        <div className="rounded-lg border border-success/30 bg-success/5 px-4 py-3 text-sm text-success">
          {t("passwordResetSuccess")}
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">{t("email")}</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required disabled={isPending} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">{t("password")}</Label>
          <Input id="password" name="password" type="password" autoComplete="current-password" required disabled={isPending} />
        </div>

        {state?.error && (
          <div className="rounded-lg border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">
            {state.error}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? <Loader2 className="size-4 animate-spin" /> : t("signIn")}
        </Button>
      </form>

      <div className="flex items-center justify-between text-sm">
        <a href={`/${locale}/forgot-password`} className="text-muted-foreground hover:text-foreground">
          {t("forgotPassword")}
        </a>
        <a href={`/${locale}/signup`} className="font-medium text-primary hover:underline">
          {t("needAccount")}
        </a>
      </div>
    </div>
  );
}
