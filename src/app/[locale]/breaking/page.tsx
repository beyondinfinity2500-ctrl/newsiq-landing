import { getTranslations } from "next-intl/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getBreakingArticles } from "@/features/news/data-access";
import { BreakingBanner } from "@/components/news/breaking-banner";
import { NewsFeed } from "@/components/news/news-feed";

export const dynamic = "force-dynamic";

export default async function BreakingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations("home");
  const supabase = await createSupabaseServerClient();
  const articles = await getBreakingArticles(supabase, locale, 20);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
      <h1 className="mb-6 text-2xl font-bold text-foreground">{t("breakingLabel")}</h1>
      {articles.length > 0 && <BreakingBanner articles={articles} locale={locale} label={t("breakingLabel")} />}
      <div className="mt-6">
        {articles.length > 0 ? (
          <NewsFeed articles={articles} locale={locale} />
        ) : (
          <p className="text-sm text-muted-foreground">No breaking news at this time.</p>
        )}
      </div>
    </div>
  );
}
