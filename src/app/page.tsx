import { getTranslations } from "next-intl/server";
import { setRequestLocale } from "next-intl/server";
import { headers } from "next/headers";
import { siteConfig, type SiteLocale } from "@/config/site";
import { AppHeader } from "@/components/layout/app-header";
import { AppFooter } from "@/components/layout/app-footer";
import { BreakingBanner } from "@/components/news/breaking-banner";
import { NewsFeed } from "@/components/news/news-feed";
import { TrendingList } from "@/components/news/trending-list";
import { AdSlot } from "@/components/shared/ad-slot";
import { homepageBreaking, homepageFeed, homepageTrending } from "@/lib/homepage-content";

/**
 * Root home page. Serves the default locale's home without requiring a
 * locale prefix in the URL. The locale is chosen by the user (or
 * default if none is set) — never forced.
 *
 * Temporary seed: the breaking / feed / trending lists are populated
 * from a static 3-story seed (`src/lib/homepage-content.ts`) instead of
 * Supabase while the full editorial pipeline is developed. The data-access
 * layer and Supabase integration remain intact and are not modified.
 */
export default async function RootHomePage() {
  const headerStore = await headers();
  const requested = headerStore.get("x-next-intl-locale") ?? siteConfig.defaultLocale;
  const locale = (siteConfig.locales as readonly string[]).includes(requested)
    ? (requested as SiteLocale)
    : (siteConfig.defaultLocale as SiteLocale);

  setRequestLocale(locale);
  const t = await getTranslations("home");

  return (
    <div lang={locale} dir={locale === "ar" || locale === "fa" ? "rtl" : "ltr"} className="min-h-screen bg-background text-foreground">
      <AppHeader locale={locale} />
      <main className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
        {homepageBreaking.length > 0 && (
          <div className="mb-6">
            <BreakingBanner articles={homepageBreaking} locale={locale} label={t("breakingLabel")} />
          </div>
        )}

        <div className="mb-6 flex justify-center">
          <AdSlot placement="header" />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div>
            <h1 className="mb-4 text-xl font-bold text-foreground">{t("latestNews")}</h1>
            {homepageFeed.length > 0 ? (
              <NewsFeed articles={homepageFeed} locale={locale} />
            ) : (
              <p className="text-sm text-muted-foreground">No articles available.</p>
            )}

            <div className="my-6 flex justify-center">
              <AdSlot placement="feed" />
            </div>
          </div>

          <aside className="space-y-6">
            <TrendingList articles={homepageTrending} locale={locale} label={t("trendingLabel")} />
            <div className="flex justify-center">
              <AdSlot placement="sidebar" />
            </div>
          </aside>
        </div>
      </main>
      <AppFooter locale={locale} />
    </div>
  );
}
