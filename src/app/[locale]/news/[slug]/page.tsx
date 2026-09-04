import { notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getArticleBySlug,
  getRelatedArticles,
  getMarketImpact,
  getAvailableTranslations,
  getLatestAnalysis,
} from "@/features/news/data-access";
import { articleMetadata, localizedUrl } from "@/lib/seo/metadata";
import { newsArticleJsonLd } from "@/lib/seo/structured-data";
import { siteConfig, type SiteLocale } from "@/config/site";
import { SourceBadge } from "@/components/shared/source-badge";
import { VerificationBadge, DevelopingBadge } from "@/components/shared/verification-badge";
import { ImportanceBadge } from "@/components/news/importance-badge";
import { EngagementBar } from "@/components/shared/engagement-bar";
import { RelatedNews } from "@/components/news/related-news";
import { MarketImpactCard } from "@/components/market/market-impact-card";
import { AdSlot } from "@/components/shared/ad-slot";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { AiAnalysisSection, type AiAnalysisPayload } from "@/components/ai/ai-analysis-section";
import { formatRelativeTime } from "@/lib/utils";
import { ChevronRight, Clock, MapPin, Languages } from "lucide-react";
import type { MarketImpactResult } from "@/lib/ai/types";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const supabase = await createSupabaseServerClient();

  // Best-effort fetch for metadata — fall back to a generic title if the
  // article is not available in this locale (the page itself will 404).
  try {
    const article = await getArticleBySlug(supabase, slug, locale);
    const translations = await getAvailableTranslations(supabase, article.id);
    const available = translations.map((t) => t.locale);
    return articleMetadata({
      locale: locale as SiteLocale,
      title: article.translation.seo_title ?? article.translation.title,
      description: article.translation.seo_description ?? article.translation.summary ?? "",
      path: `news/${article.translation.slug}`,
      image: article.cover_image_url ?? article.translation.og_image_url ?? undefined,
      availableLocales: available,
    });
  } catch {
    return articleMetadata({
      locale: locale as SiteLocale,
      title: "News",
      description: siteConfig.description,
      path: `news/${slug}`,
    });
  }
}

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

  const [related, impactResult, availableTranslations, aiAnalysis] = await Promise.all([
    getRelatedArticles(supabase, article.id, article.resolved_locale, 4),
    getMarketImpact(supabase, article.id),
    getAvailableTranslations(supabase, article.id),
    getLatestAnalysis(supabase, article.id),
  ]);
  const marketImpact = impactResult as unknown as MarketImpactResult | null;
  const isUserReport = article.source_name === "User Report";
  const isDeveloping = article.verification_status === "developing";

  // Structured data: NewsArticle, anchored to the resolved (displayed) locale.
  const canonicalUrl = localizedUrl(locale as SiteLocale, `news/${article.translation.slug}`);
  const jsonLd = newsArticleJsonLd({
    headline: article.translation.title,
    description: article.translation.summary ?? article.translation.title,
    url: canonicalUrl,
    datePublished: article.published_at ?? article.created_at,
    image: article.cover_image_url ?? article.translation.og_image_url ?? undefined,
  });

  return (
    <article className="mx-auto max-w-2xl px-4 py-6 lg:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

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

      {article.is_fallback && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-info/30 bg-info/5 px-4 py-3 text-sm text-info">
          <Languages className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>
            {t("fallbackNotice", {
              from: article.resolved_locale.toUpperCase(),
              to: locale.toUpperCase(),
            })}
          </span>
        </div>
      )}

      {availableTranslations.length > 1 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">{t("availableIn")}:</span>
          {availableTranslations.map((tr) => (
            <Link
              key={tr.locale}
              href={`/${tr.locale}/news/${tr.slug}`}
              className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${tr.locale === locale ? "border-foreground bg-foreground text-background" : "border-border bg-card text-muted-foreground hover:bg-muted"}`}
            >
              {tr.locale.toUpperCase()}
            </Link>
          ))}
        </div>
      )}

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
        <div className="ms-auto">
          <LanguageSwitcher currentLocale={locale as SiteLocale} />
        </div>
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

      {aiAnalysis && <AiAnalysisSection analysis={aiAnalysis as unknown as AiAnalysisPayload} />}

      <div className="mt-8">
        <RelatedNews articles={related} locale={locale} label={t("related")} />
      </div>
    </article>
  );
}
