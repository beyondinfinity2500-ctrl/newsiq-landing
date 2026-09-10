import { getTranslations } from "next-intl/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getTrendingArticles } from "@/features/news/data-access";
import { TrendingList } from "@/components/news/trending-list";
import { NewsFeed } from "@/components/news/news-feed";

export const dynamic = "force-dynamic";

export default async function TrendingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations("trending");
  const supabase = await createSupabaseServerClient();
  const articles = await getTrendingArticles(supabase, locale, 20);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
      <h1 className="mb-6 text-2xl font-bold text-foreground">{t("title")}</h1>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {articles.length > 0 ? (
          <NewsFeed articles={articles} locale={locale} />
        ) : (
          <p className="text-sm text-muted-foreground">No trending articles right now.</p>
        )}
        <aside>
          <TrendingList articles={articles} locale={locale} label={t("title")} />
        </aside>
      </div>
    </div>
  );
}
