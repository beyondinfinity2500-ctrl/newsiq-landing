'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { formatRelativeTime } from '@/lib/utils'
import type { ArticleWithDetails } from '@/features/news/data-access'
import { FEED_IMAGE_SIZES } from '@/lib/image/variants'

function GlobeIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.4 2.5 3.5 5.5 3.5 9S14.4 18.5 12 21c-2.4-2.5-3.5-5.5-3.5-9S9.6 5.5 12 3Z" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  )
}

type NewsFilter = 'Live feed' | 'Markets' | 'Geopolitics' | 'Technology'

const newsFilters: NewsFilter[] = ['Live feed', 'Markets', 'Geopolitics', 'Technology']

/* ── Premium Market Ticker ───────────────────────────────── */

interface MarketTickerItem {
  symbol: string
  label: string
  decimals: number
  prefix: string
}

const TICKER_ASSETS: MarketTickerItem[] = [
  { symbol: 'GOLD', label: 'Gold', decimals: 2, prefix: '$' },
  { symbol: 'BTC', label: 'Bitcoin', decimals: 0, prefix: '$' },
  { symbol: 'WTI', label: 'Oil', decimals: 2, prefix: '$' },
  { symbol: 'SPX', label: 'S&P 500', decimals: 2, prefix: '' },
  { symbol: 'EURUSD', label: 'EUR/USD', decimals: 4, prefix: '' },
]

function formatTickerPrice(price: number, decimals: number, prefix: string): string {
  if (prefix === '$') {
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`
  }
  return price.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

function MarketStrip() {
  const [quotes, setQuotes] = useState<Record<string, { price: number; changePercent: number }>>({})
  const pathname = usePathname()
  const locale = pathname?.split('/')?.[1] || 'en'
  const marketsHref = `/${locale}/markets`

  useEffect(() => {
    const symbols = TICKER_ASSETS.map((a) => a.symbol).join(',')
    fetch(`/api/markets?symbols=${symbols}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && data.quotes) {
          const map: Record<string, { price: number; changePercent: number }> = {}
          for (const q of data.quotes) {
            if ('price' in q) {
              map[q.symbol] = { price: q.price, changePercent: q.changePercent }
            }
          }
          setQuotes(map)
        }
      })
      .catch(() => {})
  }, [])

  type TickerDirection = 'up' | 'down' | 'unchanged' | null

  const items: (MarketTickerItem & { price?: number; direction: TickerDirection })[] = TICKER_ASSETS.map((asset) => {
    const q = quotes[asset.symbol]
    const direction: TickerDirection = q ? (q.changePercent > 0 ? 'up' : q.changePercent < 0 ? 'down' : 'unchanged') : null
    return { ...asset, price: q?.price, direction }
  })

  function itemAriaLabel(item: { label: string; price?: number; direction: 'up' | 'down' | 'unchanged' | null; prefix: string; decimals: number }): string {
    if (item.price == null) return `${item.label}, price unavailable`
    const formatted = formatTickerPrice(item.price, item.decimals, item.prefix)
    const dir = item.direction === 'up' ? ', higher than previous reference'
      : item.direction === 'down' ? ', lower than previous reference'
      : ''
    return `${item.label}, current price ${formatted}${dir}`
  }

  const tickerContent = (
    <div className="flex shrink-0 items-center gap-5 whitespace-nowrap" aria-hidden="true">
      {items.map((item, i) => (
        <span key={item.symbol} className="flex shrink-0 items-center gap-1.5">
          <span className="font-mono text-[9px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
            {item.label}
          </span>
          {item.price != null ? (
            <span
              className="font-mono text-[11px] font-semibold"
              style={{
                color: item.direction === 'up'
                  ? 'hsl(142 71% 45%)'
                  : item.direction === 'down'
                    ? 'hsl(0 72% 51%)'
                    : undefined,
              }}
            >
              {formatTickerPrice(item.price, item.decimals, item.prefix)}
            </span>
          ) : (
            <span className="font-mono text-[11px] text-muted-foreground/40">--</span>
          )}
          {i < items.length - 1 && <span className="ml-3.5 h-3 w-px bg-border/40" aria-hidden="true" />}
        </span>
      ))}
    </div>
  )

  const fullAriaLabel = items
    .map((item) => itemAriaLabel(item))
    .join('. ')

  return (
    <div className="border-b border-border/60 bg-card/30">
      <a
        href={marketsHref}
        aria-label={`View live markets. ${fullAriaLabel}`}
        className="mx-auto block max-w-7xl px-5 sm:px-8 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {/* Mobile: marquee — single horizontal track, duplicated for seamless loop */}
        <div className="overflow-hidden sm:hidden">
          <div className="flex whitespace-nowrap" style={{ animation: 'ticker-scroll 28s linear infinite' }}>
            {tickerContent}
            {tickerContent}
          </div>
        </div>
        {/* Desktop: static */}
        <div className="hidden sm:flex">
          {tickerContent}
        </div>
      </a>
    </div>
  )
}

/* ── News Card ─────────────────────────────────────────────── */

function NewsCard({
  article,
  locale,
  imagePriority,
  liked,
  saved,
  onLike,
  onSave,
  onShare,
}: {
  article: ArticleWithDetails
  locale: string
  imagePriority: boolean
  liked: boolean
  saved: boolean
  onLike: () => void
  onSave: () => void
  onShare: () => void
}) {
  const hasImage = !!article.cover_image_url
  const isBreaking = article.importance === 'breaking'
  const hasLocalVersion = article.translation.locale !== locale

  return (
    <article className="group px-5 py-6 transition-colors hover:bg-card/30 sm:px-8">
      {/* Metadata row */}
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/60">
        <span className="text-primary">{article.country ?? 'Global'}</span>
        <span>·</span>
        <span>{article.category_name ?? article.category_id}</span>
        <span>·</span>
        <span>{formatRelativeTime(article.published_at, locale)}</span>
        {isBreaking && (
          <span className="rounded bg-red-500/5 px-2 py-0.5 text-[10px] font-semibold text-red-300">
            Breaking
          </span>
        )}
      </div>

      {/* Headline */}
      <h2 className="mt-4 text-xl font-semibold leading-snug tracking-[-0.02em] transition-colors group-hover:text-primary">
        <Link
          href={`/${locale}/news/${article.translation.slug}`}
          className="transition-colors hover:text-primary"
        >
          {article.translation.title}
        </Link>
      </h2>

      {/* Summary */}
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {article.translation.summary}
      </p>

      {/* Editorial Image — semantic <img> via Next Image; AVIF/WebP negotiation,
          responsive sizes, LCP-priority on the first card, lazy below the fold */}
      {hasImage && (
        <div className="mt-4 overflow-hidden rounded-lg border border-white/5 bg-card/40">
          <Image
            src={article.cover_image_url!}
            alt={article.translation.title}
            width={640}
            height={360}
            className="h-auto w-full object-cover"
            sizes={FEED_IMAGE_SIZES}
            priority={imagePriority}
          />
        </div>
      )}

      {/* Localized Content Preview */}
      {hasLocalVersion && (
        <div className="mt-5 rounded-md border border-border/50 bg-secondary/40 p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-primary">
              <GlobeIcon />
              {article.translation.locale.toUpperCase()}
            </span>
            <span className="text-[10px] text-muted-foreground">Local version</span>
          </div>
          <p className="mt-3 text-sm font-medium leading-6 text-foreground/90">
            {article.translation.title}
          </p>
        </div>
      )}

      {/* AI Market Context — Free value, always readable */}
      <div className="mt-5 rounded-md border border-border/50 bg-card/50 p-4">
        <div className="flex items-center justify-between gap-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-primary">
            AI market context
          </span>
        </div>
        <p className="mt-3 text-sm leading-6 text-foreground/85">
          {article.financial_assets.length > 0
            ? `Potential implications for: ${article.financial_assets.join(', ')}.`
            : 'Market impact analysis will be available soon.'}
        </p>
        {article.entities.length > 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            Key entities: {article.entities.join(' · ')}
          </p>
        )}
        {article.country && (
          <p className="mt-1 text-xs text-muted-foreground">
            Region: {article.country}
          </p>
        )}
      </div>

      {/* AI Market Impact — premium locked teaser. Heavy, intentional blur with a
        bottom fade; template preview lines only (never the real analysis), and
        hidden from screen readers so nothing leaks through assistive tech. */}
      <LockedMarketImpact article={article} locale={locale} />

      {/* Action bar */}
      <div className="mt-4 flex items-center justify-between border-t border-border/70 pt-4 text-[11px] text-muted-foreground">
        <span>{article.source_name}</span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onLike}
            aria-label={liked ? 'Unlike story' : 'Like story'}
            className={liked ? 'text-primary' : 'hover:text-primary'}
          >
            ♥ {liked ? 'Liked' : 'Like'}
          </button>
          <button
            type="button"
            onClick={onSave}
            aria-label={saved ? 'Unsave story' : 'Save story'}
            className={saved ? 'text-primary' : 'hover:text-primary'}
          >
            ▱ {saved ? 'Saved' : 'Save'}
          </button>
          <button
            type="button"
            onClick={onShare}
            aria-label="Share story"
            className="hover:text-primary"
          >
            ↗ Share
          </button>
        </div>
      </div>
    </article>
  )
}

/* ── Locked AI Market Impact (premium blur) ────────────────── */

function labelizeAsset(asset: string): string {
  return asset
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function LockedMarketImpact({ article, locale }: { article: ArticleWithDetails; locale: string }) {
  const assets = article.financial_assets
  const entities = article.entities

  // Template preview lines derived from article metadata — deliberately
  // generic so nothing of the real analysis can be reconstructed.
  const blurLines = useMemo(() => {
    if (assets.length === 0) {
      return [
        'Cross-asset impact assessment is being prepared for this event.',
        'Direction, magnitude and time horizon will appear here once ready.',
      ]
    }
    const lines: string[] = []
    const primary = labelizeAsset(assets[0])
    lines.push(`${primary} is the most direct exposure to this event.`)
    if (assets.length > 1) {
      const secondary = labelizeAsset(assets[1])
      lines.push(`Short-term pricing pressure may extend into ${secondary.toLowerCase()} as positioning adjusts.`)
    }
    if (assets.length > 2) {
      const third = labelizeAsset(assets[2])
      lines.push(`${third} typically responds with a 1–3 session lag to developments of this type.`)
    }
    if (entities.length > 0) {
      lines.push(`Watch for confirmation from ${entities[0]} before reassessing exposure.`)
    }
    return lines.slice(0, 4)
  }, [assets, entities])

  return (
    <section className="relative mt-4 overflow-hidden rounded-lg border border-primary/10 bg-card/60 p-4">
      <div className="flex items-center justify-between gap-4">
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-primary">
          AI market impact
        </span>
        <span className="font-mono text-[10px] text-muted-foreground">
          Confidence {article.source_reliability}%
        </span>
      </div>

      {/* Blurred analysis preview — intentionally unreadable */}
      <div aria-hidden="true" className="pointer-events-none relative mt-3 select-none">
        <div className="space-y-2.5">
          {blurLines.map((line, i) => (
            <p key={i} className="text-sm leading-6 text-foreground/60 blur-[7px]">
              {line}
            </p>
          ))}
          <p className="text-sm leading-6 text-foreground/35 blur-[9px]">
            Full breakdown: affected assets, direction, magnitude, key risks and time horizon.
          </p>
        </div>
        {/* Elegant fade toward the bottom — signals intentional lock, not broken UI */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card to-transparent" />
      </div>

      {/* Lock CTA */}
      <div className="relative mt-2 flex flex-col items-center gap-1.5 pb-1 text-center">
        <Link
          href={`/${locale}/subscribe`}
          className="inline-flex items-center gap-2 rounded-md border border-primary/20 bg-primary/5 px-3.5 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <LockIcon />
          Unlock full analysis
        </Link>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          1 AI Analysis Credit
        </span>
      </div>
    </section>
  )
}

/* ── Main Homepage ─────────────────────────────────────────── */

export default function HomeClient({ locale, initialArticles = [] }: { locale: string; initialArticles?: ArticleWithDetails[] }) {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [signupMessage, setSignupMessage] = useState('')
  const [filter, setFilter] = useState<NewsFilter>('Live feed')
  const [liked, setLiked] = useState<string[]>([])
  const [saved, setSaved] = useState<string[]>([])

  const homepageFeed = initialArticles
  const breakingItems = useMemo(() => homepageFeed.filter((a) => a.importance === 'breaking'), [homepageFeed])
  const trendingItems = useMemo(() => homepageFeed.filter((a) => a.importance === 'high'), [homepageFeed])

  const visibleNews = useMemo(() => {
    if (filter === 'Live feed') return homepageFeed
    return homepageFeed.filter((item) => {
      const cat = (item.category_slug ?? item.category_id)?.toLowerCase()
      if (filter === 'Markets') return cat === 'markets' || cat === 'finance'
      if (filter === 'Geopolitics') return cat === 'geopolitics' || cat === 'politics'
      if (filter === 'Technology') return cat === 'technology' || cat === 'crypto'
      return true
    })
  }, [filter, homepageFeed])

  const toggle = (setter: React.Dispatch<React.SetStateAction<string[]>>, id: string) =>
    setter((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    )

  const share = (headline: string, summary: string) => {
    if (navigator.share) {
      navigator.share({ title: headline, text: summary }).catch(() => undefined)
    } else {
      navigator.clipboard?.writeText(headline)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = email.trim()
    if (!value || !value.includes('@')) {
      setSignupMessage('Enter a valid email address.')
      return
    }
    setSubmitted(true)
    setSignupMessage('You are on the early-access list for this preview.')
  }

  return (
    <div id="top" className="min-h-screen bg-background text-foreground">
      <div className="page-grid" aria-hidden="true" />

      {/* Compact Market Strip */}
      <MarketStrip />

      <div className="relative z-10 mx-auto grid max-w-7xl lg:grid-cols-[210px_minmax(0,680px)_280px]">
        {/* Left sidebar — category filters */}
        <aside className="hidden border-r border-border/60 px-4 py-8 lg:block">
          <nav className="sticky top-24 space-y-2" aria-label="News categories">
            {newsFilters.map((item) => (
              <button
                key={item}
                onClick={() => setFilter(item)}
                className={`flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  filter === item ? 'bg-secondary font-semibold' : 'text-muted-foreground hover:bg-secondary'
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${filter === item ? 'bg-primary' : 'bg-border'}`} />
                {item}
              </button>
            ))}
          </nav>
        </aside>

        {/* Center — news feed */}
        <section id="feed" className="min-w-0 border-x border-border/60">
          <div className="border-b border-border/60 px-5 py-7 sm:px-8">
            {/* Newsletter form */}
            <div className="mb-6 rounded-lg border border-primary/20 bg-primary/[0.04] p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">NEWSiQ briefing</p>
              <h2 className="mt-2 text-base font-semibold">Get the next global market briefing</h2>
              <form className="mt-3 flex flex-col gap-2 sm:flex-row" onSubmit={handleSubmit}>
                <label htmlFor="newsletter-email" className="sr-only">Email address for newsletter</label>
                <input
                  id="newsletter-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="min-w-0 flex-1 rounded-md border border-border/60 bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  required
                />
                <button
                  type="submit"
                  className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Join newsletter
                </button>
              </form>
              {signupMessage && (
                <p className="mt-2 text-xs text-muted-foreground" role="status">
                  {signupMessage}
                </p>
              )}
            </div>

            {/* Live indicator */}
            <div className="flex items-center gap-2">
              <span className="live-dot" />
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">Live global feed · Short news / 24h</p>
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">What is moving now</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Fast, verified updates from around the world, with the context you need to understand what matters.
            </p>

            {/* Mobile category filters */}
            <div className="mt-5 flex gap-2 overflow-x-auto lg:hidden">
              {newsFilters.map((item) => (
                <button
                  key={item}
                  onClick={() => setFilter(item)}
                  className={`whitespace-nowrap rounded-full border px-3 py-2 text-xs ${
                    filter === item
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border/60 text-muted-foreground'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* News cards — first card's image is the LCP candidate */}
          <div className="divide-y divide-border/60">
            {visibleNews.map((article, index) => (
              <NewsCard
                key={article.id}
                article={article}
                locale={locale}
                imagePriority={index === 0}
                liked={liked.includes(article.id)}
                saved={saved.includes(article.id)}
                onLike={() => toggle(setLiked, article.id)}
                onSave={() => toggle(setSaved, article.id)}
                onShare={() => share(article.translation.title, article.translation.summary ?? '')}
              />
            ))}
          </div>
        </section>

        {/* Right sidebar */}
        <aside className="hidden border-l border-border/60 px-5 py-8 xl:block">
          <div className="sticky top-24 space-y-5">
            {/* Breaking news */}
            {breakingItems.length > 0 && (
              <div className="rounded-md border border-border/50 bg-card/60 p-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">Breaking</p>
                <div className="mt-3 space-y-3">
                  {breakingItems.slice(0, 3).map((article) => (
                    <Link
                      key={article.id}
                      href={`/${locale}/news/${article.translation.slug}`}
                      className="block text-sm font-medium leading-snug text-foreground transition-colors hover:text-primary"
                    >
                      {article.translation.title}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Trending */}
            {trendingItems.length > 0 && (
              <div className="rounded-md border border-border/50 bg-card/60 p-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">Trending</p>
                <div className="mt-3 space-y-3">
                  {trendingItems.slice(0, 5).map((article, i) => (
                    <Link
                      key={article.id}
                      href={`/${locale}/news/${article.translation.slug}`}
                      className="block text-sm font-medium leading-snug text-foreground transition-colors hover:text-primary"
                    >
                      <span className="mr-2 text-muted-foreground">{i + 1}.</span>
                      {article.translation.title}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Subscribe CTA */}
            <div id="subscribe" className="rounded-md border border-primary/20 bg-primary/[0.05] p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">Pro intelligence</p>
              <h2 className="mt-3 text-lg font-semibold">Go beyond the headline</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Unlock complete AI impact analysis, market links and historical context.
              </p>
              <form onSubmit={handleSubmit} className="mt-5 space-y-3">
                <label className="sr-only" htmlFor="subscribe-email">Email address</label>
                <input
                  id="subscribe-email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Your email address"
                  className="h-10 w-full rounded-md border border-border/60 bg-background px-3 text-xs outline-none focus:border-primary"
                />
                <button className="h-10 w-full rounded-md bg-primary text-xs font-bold text-primary-foreground">
                  {submitted ? 'You are on the list' : 'Join the waitlist'}
                </button>
              </form>
              <p className="mt-3 text-[10px] leading-5 text-muted-foreground">
                AI analysis is informational only and is not financial advice.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
