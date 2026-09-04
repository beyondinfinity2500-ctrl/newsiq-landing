import { getTranslations } from "next-intl/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { searchPublishedArticles, getPublishedArticles } from "@/features/news/data-access";
import { NewsFeed } from "@/components/news/news-feed";
import { EmptyState } from "@/components/shared/empty-state";
import { SearchX } from "lucide-react";

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale } = await params;
  const { q } = await searchParams;
  const t = await getTranslations("search");
  const supabase = await createSupabaseServerClient();

  const query = (q ?? "").trim();
  const articles = query.length >= 2
    ? await searchPublishedArticles(supabase, query, { locale, limit: 20 })
    : await getPublishedArticles(supabase, { locale, limit: 6 });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 lg:px-6">
      <h1 className="mb-6 text-2xl font-bold text-foreground">{t("title")}</h1>

      <form method="get" className="relative mb-6">
        <input
          name="q"
          type="search"
          defaultValue={query}
          placeholder={t("placeholder")}
          className="w-full rounded-xl border border-input bg-background px-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label={t("title")}
          autoFocus
        />
      </form>

      <div className="mb-6 flex flex-wrap gap-2">
        {["all", "news", "people", "companies", "countries", "markets"].map((filter) => (
          <button
            key={filter}
            type="button"
            className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
          >
            {t(`filter.${filter}`)}
          </button>
        ))}
      </div>

      {query.length >= 2 && (
        <p className="mb-4 text-xs text-muted-foreground">
          {t("resultsFor", { count: articles.length, query })}
        </p>
      )}

      {articles.length > 0 ? (
        <NewsFeed articles={articles} locale={locale} />
      ) : (
        <EmptyState
          icon={<SearchX size={20} />}
          title={t("emptyTitle")}
          description={query.length >= 2 ? t("emptyDescription") : t("emptyDescription")}
        />
      )}
    </div>
  );
}
