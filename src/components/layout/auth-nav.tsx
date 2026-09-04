"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAuth } from "@/features/auth/auth-context";
import { signOutAction } from "@/features/auth/actions";
import { Loader2, User, LogOut, Settings } from "lucide-react";

export function AuthNav({ locale }: { locale: string }) {
  const t = useTranslations("auth");
  const { user, profile, loading } = useAuth();
  const isEditor = profile?.role && ["editor", "admin", "super_admin"].includes(profile.role);

  if (loading) {
    return <Loader2 className="size-4 animate-spin text-muted-foreground" />;
  }

  if (user) {
    return (
      <div className="flex items-center gap-2 border-s border-border ps-2">
        <Link
          href={`/${locale}/profile`}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {profile?.avatar_url ? (
            <span
              role="img"
              aria-label=""
              className="size-6 rounded-full bg-cover bg-center"
              style={{ backgroundImage: `url(${profile.avatar_url})` }}
            />
          ) : (
            <User className="size-4" />
          )}
          <span className="hidden sm:inline">
            {profile?.display_name ?? user.email?.split("@")[0] ?? t("profileTitle")}
          </span>
        </Link>
        {isEditor && (
          <Link
            href={`/${locale}/admin/sources`}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={t("admin")}
          >
            <Settings className="size-4" />
          </Link>
        )}
        <form action={signOutAction}>
          <button
            type="submit"
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={t("signOut")}
          >
            <LogOut className="size-4" />
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="hidden items-center gap-2 border-s border-border ps-2 sm:flex">
      <Link
        href={`/${locale}/login`}
        className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        {t("signIn")}
      </Link>
      <Link
        href={`/${locale}/signup`}
        className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        {t("signUp")}
      </Link>
    </div>
  );
}
