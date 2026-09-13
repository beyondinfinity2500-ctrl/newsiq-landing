import Link from "next/link";
import { Newspaper } from "lucide-react";
import type { ArticleWithDetails } from "@/features/news/data-access";
import { EmptyState } from "@/components/shared/empty-state";

export function RelatedNews({ articles, locale, label = "Related News" }: { articles: ArticleWithDetails[]; locale: string; label?: string }) {
  if (articles.length === 0) {
    return <EmptyState icon={<Newspaper size={20} />} title="No related news" description="There are no related stories for this article yet." />;
  }

  return (
    <div>
      <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-foreground">{label}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {articles.map((article) => (
          <Link
            key={article.id}
            href={`/${locale}/news/${article.translation.slug}`}
            className="group rounded-lg border border-border bg-card p-3 transition-all hover:border-foreground/15 hover:shadow-sm"
          >
            <div className="mb-1.5 flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground capitalize">{article.category_name ?? article.category_id}</span>
            </div>
            <h3 className="line-clamp-2 text-sm font-medium text-foreground transition-colors group-hover:text-primary">
              {article.translation.title}
            </h3>
            <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{article.translation.summary}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
