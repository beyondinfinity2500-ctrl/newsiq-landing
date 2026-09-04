import type { ArticleWithDetails } from "@/features/news/data-access";
import { NewsCard } from "./news-card";

export function NewsFeed({ articles, locale }: { articles: ArticleWithDetails[]; locale: string }) {
  if (articles.length === 0) return null;
  return (
    <div className="space-y-3">
      {articles.map((article) => (
        <NewsCard key={article.id} article={article} locale={locale} />
      ))}
    </div>
  );
}
