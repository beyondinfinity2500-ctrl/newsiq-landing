import Link from "next/link";
import type { ArticleWithDetails } from "@/features/news/data-access";
import { SourceBadge } from "@/components/shared/source-badge";
import { VerificationBadge, DevelopingBadge } from "@/components/shared/verification-badge";
import { formatRelativeTime } from "@/lib/utils";

export function NewsCard({ article, locale }: { article: ArticleWithDetails; locale: string }) {
  const isUserReport = article.source_name === "User Report";
  const isDeveloping = article.verification_status === "developing";

  return (
    <article className="group px-5 py-7 transition-colors hover:bg-card/40 sm:px-8">
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        <span className="text-primary">{article.country ?? 'Global'}</span>
        <span>·</span>
        <span>{article.category_name ?? article.category_id}</span>
        <span>·</span>
        <span>{formatRelativeTime(article.published_at, locale)}</span>
        {article.importance === 'breaking' && (
          <span className="ml-auto rounded bg-red-400/10 px-2 py-1 text-red-300">Breaking</span>
        )}
      </div>

      <Link href={`/${locale}/news/${article.translation.slug}`} className="block">
        <h2 className="mt-4 text-xl font-semibold leading-snug tracking-[-0.02em] transition-colors group-hover:text-primary">
          {article.translation.title}
        </h2>
      </Link>

      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {article.translation.summary}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border/70 pt-4 text-[11px] text-muted-foreground">
        <SourceBadge name={article.source_name} reliability={article.source_reliability} isUserReport={isUserReport} />
        {isDeveloping ? (
          <DevelopingBadge />
        ) : (
          <VerificationBadge status={article.verification_status} />
        )}
      </div>
    </article>
  );
}
