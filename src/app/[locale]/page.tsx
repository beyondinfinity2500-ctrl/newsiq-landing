import { getTranslations } from "next-intl/server";
import { homepageFeed, homepageBreaking, homepageTrending } from "@/lib/homepage-content";
import { BreakingBanner } from "@/components/news/breaking-banner";
import { NewsFeed } from "@/components/news/news-feed";
import { TrendingList } from "@/components/news/trending-list";
import { AdSlot } from "@/components/shared/ad-slot";

export default async function LocaleHomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations("home");

  const breaking = homepageBreaking;
  const trending = homepageTrending;
  const feed = homepageFeed;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
      {breaking.length > 0 && (
        <div className="mb-6">
          <BreakingBanner articles={breaking} locale={locale} label={t("breakingLabel")} />
        </div>
      )}

      <div className="mb-6 flex justify-center">
        <AdSlot placement="header" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          <h1 className="mb-4 text-xl font-bold text-foreground">{t("latestNews")}</h1>
          {feed.length > 0 ? (
            <NewsFeed articles={feed} locale={locale} />
          ) : (
            <p className="text-sm text-muted-foreground">No articles available.</p>
          )}

          <div className="my-6 flex justify-center">
            <AdSlot placement="feed" />
          </div>
        </div>

        <aside className="space-y-6">
          <TrendingList articles={trending} locale={locale} label={t("trendingLabel")} />

          <div className="flex justify-center">
            <AdSlot placement="sidebar" />
          </div>
        </aside>
      </div>
    </div>
  );
}
