"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Check, Globe2 } from "lucide-react";
import { localeNames } from "@/config/i18n";
import { siteConfig, type SiteLocale } from "@/config/site";

export function LanguageSwitcher({ currentLocale }: { currentLocale: SiteLocale }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function switchTo(locale: string) {
    const segments = pathname.split("/");
    segments[1] = locale;
    startTransition(() => router.push(segments.join("/")));
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Change language"
        aria-expanded={open}
      >
        <Globe2 size={16} aria-hidden="true" />
        <span className="hidden sm:inline">{localeNames[currentLocale]}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute end-0 z-50 mt-2 max-h-80 w-48 overflow-y-auto rounded-xl border border-border bg-popover p-1 shadow-xl" role="listbox">
            {siteConfig.locales.map((locale) => (
              <button
                key={locale}
                onClick={() => switchTo(locale)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted ${locale === currentLocale ? "font-semibold text-foreground" : "text-muted-foreground"} ${isPending ? "opacity-50" : ""}`}
                role="option"
                aria-selected={locale === currentLocale}
              >
                <span dir={locale === "ar" || locale === "fa" ? "rtl" : "ltr"}>{localeNames[locale]}</span>
                {locale === currentLocale && <Check size={14} aria-hidden="true" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
