import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { mainNav } from "@/config/navigation";
import { categories } from "@/config/categories";
import type { SiteLocale } from "@/config/site";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { AuthNav } from "./auth-nav";
import { MobileNav } from "./mobile-nav";
import { SearchButton } from "./search-button";

export async function AppHeader({ locale }: { locale: SiteLocale }) {
  const t = await getTranslations("nav");

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 lg:px-6">
        {/* Logo */}
        <Link href={`/${locale}`} className="flex shrink-0 items-center gap-2" aria-label="NewsIQ home">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-sm font-black tracking-tighter text-background">N</span>
          <span className="hidden text-lg font-bold tracking-tight text-foreground sm:inline">News<span className="text-info">IQ</span></span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-0.5 md:flex" aria-label="Primary navigation">
          {mainNav.map((item) => (
            <Link
              key={item.key}
              href={`/${locale}${item.href === "/" ? "" : item.href}`}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {t(item.labelKey.split(".")[1])}
            </Link>
          ))}

          {/* Categories dropdown */}
          <div className="group relative">
            <button className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-haspopup="true">
              {t("categories")}
            </button>
            <div className="invisible absolute start-0 top-full z-50 w-56 rounded-xl border border-border bg-popover p-1 opacity-0 shadow-xl transition-all group-hover:visible group-hover:opacity-100">
              {categories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/${locale}/categories/${cat.slug}`}
                  className="block rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {t(`category.${cat.slug}`)}
                </Link>
              ))}
            </div>
          </div>
        </nav>

        {/* Right side */}
        <div className="ms-auto flex items-center gap-1">
          <SearchButton locale={locale} />
          <LanguageSwitcher currentLocale={locale} />
          <ThemeToggle />

          {/* Auth */}
          <AuthNav locale={locale} />

          {/* Mobile nav */}
          <MobileNav locale={locale} />
        </div>
      </div>
    </header>
  );
}
