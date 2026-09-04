"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Settings } from "lucide-react";
import { mainNav } from "@/config/navigation";
import { categories } from "@/config/categories";
import type { SiteLocale } from "@/config/site";
import { useTranslations } from "next-intl";
import { useAuth } from "@/features/auth/auth-context";
import { isEditorOrAbove } from "@/lib/security/authorization";

export function MobileNav({ locale }: { locale: SiteLocale }) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("nav");
  const tAuth = useTranslations("auth");
  const { profile } = useAuth();
  const isEditor = isEditorOrAbove(profile?.role);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Open menu"
        aria-expanded={open}
      >
        <Menu size={20} aria-hidden="true" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-background" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <div className="flex h-16 items-center justify-between border-b border-border px-4">
            <span className="text-lg font-bold text-foreground">News<span className="text-info">IQ</span></span>
            <button onClick={() => setOpen(false)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted" aria-label="Close menu">
              <X size={20} aria-hidden="true" />
            </button>
          </div>

          <nav className="flex flex-col gap-1 p-4" aria-label="Mobile navigation">
            {mainNav.map((item) => (
              <Link
                key={item.key}
                href={`/${locale}${item.href === "/" ? "" : item.href}`}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-base font-medium text-foreground transition-colors hover:bg-muted"
              >
                {t(item.labelKey.split(".")[1])}
              </Link>
            ))}

            <div className="mt-2 border-t border-border pt-2">
              <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("categories")}</p>
              {categories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/${locale}/categories/${cat.slug}`}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {t(`category.${cat.slug}`)}
                </Link>
              ))}
            </div>

            {isEditor && (
              <Link
                href={`/${locale}/admin/sources`}
                onClick={() => setOpen(false)}
                className="mt-2 flex items-center gap-2 rounded-lg px-3 py-2.5 text-base font-medium text-foreground transition-colors hover:bg-muted"
              >
                <Settings className="size-4" />
                {tAuth("admin")}
              </Link>
            )}

            <div className="mt-4 flex gap-2 border-t border-border pt-4">
              <Link href={`/${locale}/login`} onClick={() => setOpen(false)} className="flex-1 rounded-lg border border-border px-3 py-2.5 text-center text-sm font-medium text-foreground hover:bg-muted">
                {t("signin")}
              </Link>
              <Link href={`/${locale}/signup`} onClick={() => setOpen(false)} className="flex-1 rounded-lg bg-primary px-3 py-2.5 text-center text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                {t("signup")}
              </Link>
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
