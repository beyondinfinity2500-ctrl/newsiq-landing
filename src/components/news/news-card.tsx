import Link from "next/link";
import { Clock, MapPin, TrendingUp } from "lucide-react";
import type { ArticleWithDetails } from "@/features/news/data-access";
import { SourceBadge } from "@/components/shared/source-badge";
import { VerificationBadge, DevelopingBadge } from "@/components/shared/verification-badge";
import { ImportanceBadge } from "@/components/news/importance-badge";
import { formatRelativeTime } from "@/lib/utils";

export function NewsCard({ article, locale }: { article: ArticleWithDetails; locale: string }) {
  const isUserReport = article.source_name === "User Report";
  const isDeveloping = article.verification_status === "developing";
  const hasMarketImpact = article.financial_assets.length > 0;

  return (
    <article className="group rounded-xl border border-border bg-card p-4 transition-all hover:border-foreground/15 hover:shadow-md">
      <div className="flex gap-4">
        {article.cover_image_url && (
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={article.cover_image_url} alt="" className="h-full w-full object-cover" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <ImportanceBadge importance={article.importance} />
            {isDeveloping ? (
              <DevelopingBadge />
            ) : (
              <VerificationBadge status={article.verification_status} />
            )}
            {article.country && (
              <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
                <MapPin size={11} aria-hidden="true" />
                {article.country}
              </span>
            )}
          </div>

          <Link href={`/${locale}/news/${article.translation.slug}`} className="block">
            <h3 className="line-clamp-2 text-base font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
              {article.translation.title}
            </h3>
          </Link>

          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {article.translation.summary}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
            <SourceBadge name={article.source_name} reliability={article.source_reliability} isUserReport={isUserReport} />
            <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
              <Clock size={11} aria-hidden="true" />
              {formatRelativeTime(article.published_at, locale)}
            </span>
            {hasMarketImpact && (
              <span className="inline-flex items-center gap-0.5 text-xs font-medium text-info">
                <TrendingUp size={11} aria-hidden="true" />
                Market Impact
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
