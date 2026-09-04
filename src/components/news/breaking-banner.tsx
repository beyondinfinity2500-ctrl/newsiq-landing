import Link from "next/link";
import { Flame } from "lucide-react";
import type { ArticleWithDetails } from "@/features/news/data-access";
import { formatRelativeTime } from "@/lib/utils";

export function BreakingBanner({ articles, locale, label = "Breaking" }: { articles: ArticleWithDetails[]; locale: string; label?: string }) {
  if (articles.length === 0) return null;

  return (
    <div className="rounded-xl border border-destructive/20 bg-destructive/5">
      <div className="flex items-stretch">
        <div className="flex items-center gap-1.5 border-e border-destructive/20 bg-destructive/10 px-3 py-2">
          <Flame size={14} className="text-destructive" aria-hidden="true" />
          <span className="text-xs font-bold uppercase tracking-wider text-destructive">{label}</span>
        </div>
        <div className="flex-1 overflow-x-auto">
          <div className="flex items-center gap-4 px-4 py-2">
            {articles.map((article) => (
              <Link
                key={article.id}
                href={`/${locale}/news/${article.translation.slug}`}
                className="whitespace-nowrap text-sm font-medium text-foreground transition-colors hover:text-destructive"
              >
                {article.translation.title}
                <span className="ms-2 text-xs text-muted-foreground">{formatRelativeTime(article.published_at, locale)}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
