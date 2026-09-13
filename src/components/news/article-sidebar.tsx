"use client";

import Link from "next/link";
import { BarChart3, TrendingUp, Clock } from "lucide-react";
import type { ArticleWithDetails } from "@/features/news/data-access";
import type { MarketImpactResult } from "@/lib/ai/types";
import { formatRelativeTime } from "@/lib/utils";

interface ArticleSidebarProps {
  related: ArticleWithDetails[];
  marketImpact: MarketImpactResult | null;
  locale: string;
}

export function ArticleSidebar({ related, marketImpact, locale }: ArticleSidebarProps) {
  return (
    <aside className="space-y-5">
      {marketImpact && <MarketSnapshot impact={marketImpact} />}
      {related.length > 0 && <RelatedCompact articles={related} locale={locale} />}
    </aside>
  );
}

function MarketSnapshot({ impact }: { impact: MarketImpactResult }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <BarChart3 size={14} className="text-info" aria-hidden="true" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Market Snapshot</h3>
      </div>

      <div className="mb-3 flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground">Sentiment</span>
        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
          impact.overallSentiment === "bullish" ? "bg-success/15 text-success"
            : impact.overallSentiment === "bearish" ? "bg-destructive/15 text-destructive"
              : "bg-muted text-muted-foreground"
        }`}>
          {impact.overallSentiment}
        </span>
        <span className="text-[10px] text-muted-foreground">
          {impact.confidence.toFixed(0)}% conf.
        </span>
      </div>

      {impact.affectedAssets.length > 0 && (
        <div className="space-y-1.5">
          {impact.affectedAssets.slice(0, 5).map((a) => (
            <div key={a.asset} className="flex items-center justify-between text-xs">
              <span className="font-medium text-foreground">{a.asset}</span>
              <div className="flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${
                  a.direction === "positive" ? "bg-success" : a.direction === "negative" ? "bg-destructive" : "bg-muted-foreground"
                }`} />
                <span className="text-[10px] text-muted-foreground capitalize">{a.impactLevel}</span>
              </div>
            </div>
          ))}
          {impact.affectedAssets.length > 5 && (
            <p className="text-[10px] text-muted-foreground">+{impact.affectedAssets.length - 5} more</p>
          )}
        </div>
      )}
    </div>
  );
}

function RelatedCompact({ articles, locale }: { articles: ArticleWithDetails[]; locale: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <TrendingUp size={14} className="text-info" aria-hidden="true" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Related</h3>
      </div>
      <div className="space-y-3">
        {articles.slice(0, 4).map((article) => (
          <Link
            key={article.id}
            href={`/${locale}/news/${article.translation.slug}`}
            className="group block"
          >
            <h4 className="line-clamp-2 text-xs font-medium text-foreground transition-colors group-hover:text-primary">
              {article.translation.title}
            </h4>
            <div className="mt-1 flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <Clock size={9} aria-hidden="true" />
              <span>{formatRelativeTime(article.published_at, locale)}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
