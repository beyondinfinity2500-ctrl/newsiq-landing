import { notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getArticleBySlug, getRelatedArticles, getMarketImpact } from "@/features/news/data-access";
import { SourceBadge } from "@/components/shared/source-badge";
import { VerificationBadge, DevelopingBadge } from "@/components/shared/verification-badge";
import { ImportanceBadge } from "@/components/news/importance-badge";
import { EngagementBar } from "@/components/shared/engagement-bar";
import { RelatedNews } from "@/components/news/related-news";
import { MarketImpactCard } from "@/components/market/market-impact-card";
import { AdSlot } from "@/components/shared/ad-slot";
import { formatRelativeTime } from "@/lib/utils";
import { ChevronRight, Clock, MapPin } from "lucide-react";
import type { MarketImpactResult } from "@/lib/ai/types";

export default async function ArticlePage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const t = await getTranslations("article");
  const supabase = await createSupabaseServerClient();

  let article;
  try {
    article = await getArticleBySlug(supabase, slug, locale);
  } catch {
    notFound();
  }

  const related = await getRelatedArticles(supabase, article.id, locale, 4);
  const impactResult = await getMarketImpact(supabase, article.id);
  const marketImpact = impactResult as unknown as MarketImpactResult | null;
  const isUserReport = article.source_name === "User Report";
  const isDeveloping = article.verification_status === "developing";

  return (
    <article className="mx-auto max-w-2xl px-4 py-6 lg:px-6">
      <nav className="mb-6 flex items-center gap-1 text-xs text-muted-foreground" aria-label="Breadcrumb">
        <Link href={`/${locale}`} className="hover:text-foreground">{t("home")}</Link>
        <ChevronRight size={12} aria-hidden="true" />
        <Link href={`/${locale}/categories/${article.category_id}`} className="capitalize hover:text-foreground">{article.category_id}</Link>
        <ChevronRight size={12} aria-hidden="true" />
        <span className="truncate text-foreground">{article.translation.title}</span>
      </nav>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-info">{article.category_id}</span>
        <ImportanceBadge importance={article.importance} />
        {isDeveloping ? <DevelopingBadge label={t("developing")} /> : <VerificationBadge status={article.verification_status} />}
      </div>

      <h1 className="text-2xl font-bold leading-tight text-foreground sm:text-3xl">{article.translation.title}</h1>

      <p className="mt-3 text-base leading-relaxed text-muted-foreground">{article.translation.summary}</p>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-border py-3">
        <SourceBadge name={article.source_name} reliability={article.source_reliability} isUserReport={isUserReport} />
        {article.country && (
          <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
            <MapPin size={11} aria-hidden="true" />
            {article.country}
          </span>
        )}
        <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
          <Clock size={11} aria-hidden="true" />
          {formatRelativeTime(article.published_at, locale)}
        </span>
      </div>

      {isUserReport && (
        <div className="mt-4 rounded-lg border border-warning/30 bg-warning/5 px-4 py-3">
          <p className="text-sm font-medium text-warning">{t("eyewitnessNotice")}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t("eyewitnessDescription")}</p>
        </div>
      )}

      <div className="mt-6 aspect-video w-full rounded-xl bg-muted" />

      <div className="mt-6 prose prose-sm max-w-none text-foreground">
        <p className="leading-relaxed">{article.translation.content}</p>
      </div>

      {article.hashtags.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {article.hashtags.map((tag) => (
            <span key={tag} className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">#{tag}</span>
          ))}
        </div>
      )}

      <div className="mt-6 border-y border-border py-3">
        <EngagementBar articleId={article.id} locale={locale} />
      </div>

      <div className="my-8 flex justify-center">
        <AdSlot placement="article" />
      </div>

      {marketImpact && (
        <>
          <MarketImpactCard analysis={marketImpact} isPro={false} label={t("marketImpact")} />
          <div className="my-8 flex justify-center">
            <AdSlot placement="between-sections" />
          </div>
        </>
      )}

      <div className="mt-8">
        <RelatedNews articles={related} locale={locale} label={t("related")} />
      </div>
    </article>
  );
}
