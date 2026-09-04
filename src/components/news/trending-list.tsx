import Link from "next/link";
import { TrendingUp, Eye, Share2, MessageCircle } from "lucide-react";
import type { ArticleWithDetails } from "@/features/news/data-access";
import { formatRelativeTime } from "@/lib/utils";

export function TrendingList({ articles, locale, label = "Trending" }: { articles: ArticleWithDetails[]; locale: string; label?: string }) {
  if (articles.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-4 flex items-center gap-2">
        <TrendingUp size={16} className="text-info" aria-hidden="true" />
        <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">{label}</h2>
      </div>
      <ol className="space-y-3">
        {articles.map((article, index) => (
          <li key={article.id} className="flex gap-3">
            <span className="text-lg font-bold text-muted-foreground/40" aria-hidden="true">{index + 1}</span>
            <div className="min-w-0 flex-1">
              <Link href={`/${locale}/news/${article.translation.slug}`} className="line-clamp-2 text-sm font-medium text-foreground transition-colors hover:text-primary">
                {article.translation.title}
              </Link>
              <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-0.5"><Eye size={11} aria-hidden="true" />—</span>
                <span className="inline-flex items-center gap-0.5"><Share2 size={11} aria-hidden="true" />—</span>
                <span className="inline-flex items-center gap-0.5"><MessageCircle size={11} aria-hidden="true" />—</span>
                <span>{formatRelativeTime(article.published_at, locale)}</span>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
