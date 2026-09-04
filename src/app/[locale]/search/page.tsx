import { getTranslations } from "next-intl/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPublishedArticles } from "@/features/news/data-access";
import { NewsFeed } from "@/components/news/news-feed";
import { EmptyState } from "@/components/shared/empty-state";
import { SearchX } from "lucide-react";

export default async function SearchPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations("search");
  const supabase = await createSupabaseServerClient();
  const articles = await getPublishedArticles(supabase, { locale, limit: 6 });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 lg:px-6">
      <h1 className="mb-6 text-2xl font-bold text-foreground">{t("title")}</h1>

      <div className="relative mb-6">
        <input
          type="search"
          placeholder={t("placeholder")}
          className="w-full rounded-xl border border-input bg-background px-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label={t("title")}
          autoFocus
        />
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {["all", "news", "people", "companies", "countries", "markets"].map((filter) => (
          <button
            key={filter}
            className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {t(`filter.${filter}`)}
          </button>
        ))}
      </div>

      {articles.length > 0 ? (
        <NewsFeed articles={articles} locale={locale} />
      ) : (
        <EmptyState
          icon={<SearchX size={20} />}
          title={t("emptyTitle")}
          description={t("emptyDescription")}
        />
      )}
    </div>
  );
}
