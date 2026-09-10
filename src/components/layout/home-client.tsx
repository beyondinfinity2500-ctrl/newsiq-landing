'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { homepageBreaking, homepageFeed, homepageTrending } from '@/lib/homepage-content'
import { formatRelativeTime } from '@/lib/utils'

function GlobeIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.4 2.5 3.5 5.5 3.5 9S14.4 18.5 12 21c-2.4-2.5-3.5-5.5-3.5-9S9.6 5.5 12 3Z" />
    </svg>
  )
}

type NewsFilter = 'Live feed' | 'Markets' | 'Geopolitics' | 'Technology'

const newsFilters: NewsFilter[] = ['Live feed', 'Markets', 'Geopolitics', 'Technology']

export default function HomeClient({ locale }: { locale: string }) {
  const [mounted, setMounted] = useState(false)
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [signupMessage, setSignupMessage] = useState('')
  const [filter, setFilter] = useState<NewsFilter>('Live feed')
  const [liked, setLiked] = useState<string[]>([])
  const [saved, setSaved] = useState<string[]>([])

  useEffect(() => {
    setMounted(true)
  }, [])

  const breakingItems = homepageBreaking
  const trendingItems = homepageTrending

  const visibleNews = useMemo(() => {
    if (filter === 'Live feed') return homepageFeed
    return homepageFeed.filter((item) => {
      const cat = item.category_id?.toLowerCase()
      if (filter === 'Markets') return cat === 'markets' || cat === 'finance'
      if (filter === 'Geopolitics') return cat === 'geopolitics' || cat === 'politics'
      if (filter === 'Technology') return cat === 'technology' || cat === 'crypto'
      return true
    })
  }, [filter])

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

  if (!mounted) return null

  return (
    <main id="top" className="min-h-screen bg-background text-foreground">
      <div className="page-grid" aria-hidden="true" />

      <div className="relative z-10 mx-auto grid max-w-7xl lg:grid-cols-[210px_minmax(0,680px)_280px]">
        {/* Left sidebar - category filters */}
        <aside className="hidden border-r border-border/70 px-4 py-8 lg:block">
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

        {/* Center - news feed */}
        <section id="feed" className="min-w-0 border-x border-border/70">
          <div className="border-b border-border/70 px-5 py-7 sm:px-8">
            {/* Newsletter form */}
            <div className="mb-6 rounded-lg border border-primary/30 bg-primary/5 p-4">
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
                  className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
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
                      : 'border-border text-muted-foreground'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* News cards */}
          <div className="divide-y divide-border/70">
            {visibleNews.map((article) => (
              <article key={article.id} className="px-5 py-7 transition-colors hover:bg-card/40 sm:px-8">
                <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  <span className="text-primary">{article.country ?? 'Global'}</span>
                  <span>·</span>
                  <span>{article.category_id}</span>
                  <span>·</span>
                  <span>{formatRelativeTime(article.published_at, locale)}</span>
                  {article.importance === 'breaking' && (
                    <span className="ml-auto rounded bg-red-400/10 px-2 py-1 text-red-300">Breaking</span>
                  )}
                </div>

                <h2 className="mt-4 text-xl font-semibold leading-snug tracking-[-0.02em]">
                  {article.translation.title}
                </h2>

                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {article.translation.summary}
                </p>

                {/* Local version */}
                {article.translation.locale !== locale && (
                  <div className="mt-5 rounded-md border border-border bg-secondary/60 p-4">
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

                {/* AI Market Impact */}
                <div className="mt-5 rounded-md border border-primary/30 bg-primary/[0.06] p-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-primary">AI market context</span>
                    {article.importance === 'breaking' && (
                      <span className="rounded bg-red-400/10 px-2 py-0.5 font-mono text-[10px] text-red-300">Breaking</span>
                    )}
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

                {/* Footer */}
                <div className="mt-4 flex items-center justify-between border-t border-border/70 pt-4 text-[11px] text-muted-foreground">
                  <span>{article.source_name}</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => toggle(setLiked, article.id)}
                      aria-label={liked.includes(article.id) ? 'Unlike story' : 'Like story'}
                      className={liked.includes(article.id) ? 'text-primary' : 'hover:text-primary'}
                    >
                      ♥ {liked.includes(article.id) ? 'Liked' : 'Like'}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggle(setSaved, article.id)}
                      aria-label={saved.includes(article.id) ? 'Unsave story' : 'Save story'}
                      className={saved.includes(article.id) ? 'text-primary' : 'hover:text-primary'}
                    >
                      ▱ {saved.includes(article.id) ? 'Saved' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={() => share(article.translation.title, article.translation.summary ?? '')}
                      aria-label="Share story"
                      className="hover:text-primary"
                    >
                      ↗ Share
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Right sidebar */}
        <aside className="hidden border-l border-border/70 px-5 py-8 xl:block">
          <div className="sticky top-24 space-y-5">
            {/* Breaking news */}
            {breakingItems.length > 0 && (
              <div className="rounded-md border border-border bg-card/70 p-5">
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
              <div className="rounded-md border border-border bg-card/70 p-5">
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
            <div id="subscribe" className="rounded-md border border-primary/30 bg-primary/[0.07] p-5">
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
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-xs outline-none focus:border-primary"
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
    </main>
  )
}
