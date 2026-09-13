import { notFound } from "next/navigation";
import Image from "next/image";
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
import { HERO_IMAGE_SIZES } from "@/lib/image/variants";
import { ChevronRight, Clock, MapPin, Languages, TrendingUp, Lock, BarChart3 } from "lucide-react";
import { ArticleSidebar } from "@/components/news/article-sidebar";
import type { MarketImpactResult, MarketImpactAsset } from "@/lib/ai/types";
import { isProUser } from "@/lib/security/authorization";

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

/**
 * Normalize the raw database result into a MarketImpactResult or return null
 * if the shape is incomplete. Prevents crashes from malformed/stale data.
 */
function normalizeMarketImpact(raw: Record<string, unknown> | null): MarketImpactResult | null {
  if (!raw || typeof raw !== "object") return null;
  const sentiment = raw.overallSentiment;
  const assets = raw.affectedAssets;
  if (
    typeof sentiment !== "string" ||
    !Array.isArray(assets) ||
    typeof raw.confidence !== "number" ||
    typeof raw.analysis !== "string"
  ) {
    return null;
  }
  const validSentiments = ["bullish", "bearish", "neutral"] as const;
  if (!(validSentiments as readonly string[]).includes(sentiment)) return null;
  const validAssets: MarketImpactAsset[] = assets
    .filter(
      (a): a is MarketImpactAsset =>
        typeof a === "object" &&
        a !== null &&
        typeof (a as MarketImpactAsset).asset === "string" &&
        typeof (a as MarketImpactAsset).direction === "string" &&
        typeof (a as MarketImpactAsset).impactLevel === "string" &&
        typeof (a as MarketImpactAsset).reasoning === "string",
    );
  if (validAssets.length === 0) return null;
  return {
    overallSentiment: sentiment as MarketImpactResult["overallSentiment"],
    affectedAssets: validAssets,
    confidence: raw.confidence as number,
    analysis: raw.analysis as string,
  };
}

/**
 * Normalize the raw database analysis result into an AiAnalysisPayload or
 * return null if the shape is incomplete. The AI analysis section requires
 * at minimum: summary, why_it_matters, economic_impact, affected_assets,
 * affected_sectors, geographic_impact, key_entities, time_horizon, confidence,
 * risks, opportunities, uncertainty.
 */
function normalizeAiAnalysis(raw: Record<string, unknown> | null): AiAnalysisPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (
    typeof r.summary !== "string" ||
    typeof r.why_it_matters !== "string" ||
    typeof r.economic_impact !== "string" ||
    !Array.isArray(r.affected_assets) ||
    !Array.isArray(r.affected_sectors) ||
    !Array.isArray(r.geographic_impact) ||
    !Array.isArray(r.key_entities) ||
    typeof r.time_horizon !== "string" ||
    typeof r.confidence !== "string" ||
    !Array.isArray(r.risks) ||
    !Array.isArray(r.opportunities) ||
    !r.uncertainty ||
    typeof (r.uncertainty as Record<string, unknown>).reason !== "string"
  ) {
    return null;
  }
  return r as unknown as AiAnalysisPayload;
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
  const marketImpact = normalizeMarketImpact(impactResult);
  const normalizedAiAnalysis = normalizeAiAnalysis(aiAnalysis);
  const userIsPro = await isProUser(supabase);
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
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav className="mb-6 flex items-center gap-1 text-xs text-muted-foreground" aria-label="Breadcrumb">
        <Link href={`/${locale}`} className="hover:text-foreground">{t("home")}</Link>
        <ChevronRight size={12} aria-hidden="true" />
        {article.category_name && (
          <>
            <Link href={`/${locale}/categories/${article.category_slug ?? article.category_id}`} className="capitalize hover:text-foreground">{article.category_name}</Link>
            <ChevronRight size={12} aria-hidden="true" />
          </>
        )}
        <span className="truncate text-foreground">{article.translation.title}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
        {/* ── Main content column ── */}
        <article className="min-w-0">

      <div className="mb-3 flex flex-wrap items-center gap-2">
        {article.category_name && (
          <span className="text-xs font-semibold uppercase tracking-wider text-info">{article.category_name}</span>
        )}
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

      {/* Editorial hero — real image when available (LCP: priority, no lazy),
          otherwise a restrained placeholder. Responsive variants via sizes. */}
      {article.cover_image_url || article.translation.og_image_url ? (
        <Image
          src={(article.cover_image_url ?? article.translation.og_image_url)!}
          alt={article.translation.title}
          width={1280}
          height={720}
          priority
          sizes={HERO_IMAGE_SIZES}
          className="mt-6 aspect-video w-full rounded-xl object-cover"
        />
      ) : (
        <div className="mt-6 aspect-video w-full rounded-xl bg-muted" />
      )}

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
          {!userIsPro && (
            <div className="mt-8 rounded-xl border border-info/20 bg-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 size={16} className="text-info" aria-hidden="true" />
                <h2 className="text-sm font-bold text-foreground">{t("marketContext")}</h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  <Lock size={9} aria-hidden="true" /> Free
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-xs text-muted-foreground">{t("overallSentiment")}:</span>
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  marketImpact.overallSentiment === "bullish" ? "bg-success/15 text-success"
                    : marketImpact.overallSentiment === "bearish" ? "bg-destructive/15 text-destructive"
                      : "bg-muted text-muted-foreground"
                }`}>
                  {marketImpact.overallSentiment}
                </span>
              </div>
              {marketImpact.affectedAssets.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {marketImpact.affectedAssets.map((a) => (
                    <span key={a.asset} className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/30 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {a.asset}
                      <span className={`inline-block h-1.5 w-1.5 rounded-full ${
                        a.direction === "positive" ? "bg-success" : a.direction === "negative" ? "bg-destructive" : "bg-muted-foreground"
                      }`} />
                    </span>
                  ))}
                </div>
              )}
              <Link
                href={`/${locale}/subscribe`}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                {t("unlockFullAnalysis")} <TrendingUp size={12} aria-hidden="true" />
              </Link>
            </div>
          )}

          {/* ONE premium section: AiAnalysisSection (canonical) or MarketImpactCard (fallback) */}
          {normalizedAiAnalysis ? (
            <AiAnalysisSection analysis={normalizedAiAnalysis} isPro={userIsPro} label={t("marketImpact")} />
          ) : (
            <MarketImpactCard analysis={marketImpact} isPro={userIsPro} label={t("marketImpact")} />
          )}

          <div className="my-8 flex justify-center">
            <AdSlot placement="between-sections" />
          </div>
        </>
      )}

      {!marketImpact && (
        <div className="my-8 rounded-xl border border-border bg-card p-5 text-center">
          <BarChart3 size={20} className="mx-auto mb-2 text-muted-foreground/40" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">{t("analysisNotAvailable")}</p>
        </div>
      )}

        </article>

        {/* ── Sidebar (desktop only) ── */}
        <div className="hidden lg:block">
          <div className="sticky top-20">
            <ArticleSidebar related={related} marketImpact={marketImpact} locale={locale} />
          </div>
        </div>
      </div>

      {/* ── Mobile-only related news (below grid) ── */}
      <div className="mt-8 lg:hidden">
        <RelatedNews articles={related} locale={locale} label={t("related")} />
      </div>
    </div>
  );
}
