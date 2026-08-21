'use client'

import { useState } from 'react'
import { NewsCard } from '../../components/news/NewsCard'
import { SiteFooter } from '../../components/site/SiteFooter'
import { SiteHeader } from '../../components/site/SiteHeader'
import { newsItems } from '../../lib/news/data'

export default function LivePage() {
  const [liked, setLiked] = useState<string[]>([])
  const [saved, setSaved] = useState<string[]>([])

  const toggle = (value: string[], setValue: (next: string[]) => void, id: string) => {
    setValue(value.includes(id) ? value.filter((item) => item !== id) : [...value, id])
  }

  return <div className="min-h-screen bg-background text-foreground"><SiteHeader /><main className="relative z-10 mx-auto max-w-4xl px-5 py-10 lg:px-8 lg:py-16"><div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.18em] text-primary"><span className="live-dot" />Live global feed</div><h1 className="mt-4 text-balance text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">The world, as it moves.</h1><p className="mt-5 max-w-2xl text-pretty leading-7 text-muted-foreground">Follow the latest context from our global desk, with regional perspectives and market-impact signals in one live stream.</p><section id="feed" className="mt-10 divide-y divide-border/70 overflow-hidden rounded-xl border border-border bg-card/30" aria-label="Live news feed">{newsItems.map((news) => <NewsCard key={news.id} news={news} liked={liked.includes(news.id)} saved={saved.includes(news.id)} onLike={() => toggle(liked, setLiked, news.id)} onSave={() => toggle(saved, setSaved, news.id)} onShare={() => navigator.clipboard?.writeText(news.headline)} />)}</section></main><SiteFooter /></div>
}

export const dynamic = 'force-static'
