'use client'

import { useEffect, useState } from 'react'
import { NiqMascot } from '../brand/NiqMascot'
import { newsCategories } from '../../lib/news/types'

export function SiteHeader({ admin = false }: { admin?: boolean }) {
  const [open, setOpen] = useState(false)
  const [live, setLive] = useState(true)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background shadow-[0_8px_24px_hsl(var(--background)/.45)]">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 lg:px-8">
        <a href="/" title="Global news intelligence" className="flex shrink-0 items-center gap-3" aria-label="Global news intelligence — NEWSiQ home">
          <NiqMascot size={32} /><span className="font-mono text-sm font-bold tracking-[0.28em]">NEWS<span className="text-primary">iQ</span></span>
        </a>
        {!admin && <nav className="hidden min-w-0 flex-1 items-center justify-center gap-0 md:flex" aria-label="Primary navigation"><a href="/" className="rounded-md px-1.5 py-2 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">Home</a><a href="/about" className="rounded-md px-1.5 py-2 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">About</a><span className="inline-flex items-center gap-0.5"><button type="button" onClick={() => setLive((value) => !value)} className="live-toggle" aria-pressed={live} aria-label={`${live ? 'Disable' : 'Enable'} live market data`}><span className={`live-dot ${live ? '' : 'live-dot-off'}`} />{live ? 'Live' : 'Paused'}</button><a href="/live" className="rounded-md px-1.5 py-2 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">Live Feed</a><a href="/markets" className="rounded-md px-1.5 py-2 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">Markets</a></span>{newsCategories.filter((item) => item !== 'Markets' && item !== 'Live feed').map((item) => <a key={item} href="#feed" className="rounded-md px-1.5 py-2 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">{item}</a>)}<a href="/terms" className="rounded-md px-1.5 py-2 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">Terms</a><a href="/subscribe" className="rounded-md bg-primary px-3 py-2 text-xs font-bold text-primary-foreground transition-transform hover:-translate-y-0.5">Subscribe</a>
        </nav>}
        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground lg:flex"><span className="live-dot" />Live global feed</span>
          {!admin && <a href="/subscribe" className="hidden rounded-md bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground transition-transform hover:-translate-y-0.5 sm:inline-flex">Unlock analysis</a>}
          <button type="button" className="menu-button md:hidden" aria-expanded={open} aria-controls="mobile-navigation" aria-label={open ? 'Close navigation menu' : 'Open navigation menu'} onClick={() => setOpen((value) => !value)}><span /><span /><span /></button>
        </div>
      </div>
      {open && <nav id="mobile-navigation" className="border-t border-border/70 px-4 py-3 md:hidden" aria-label="Mobile navigation">
        <div className="grid gap-1">{!admin && <><button type="button" onClick={() => setLive((value) => !value)} className="live-toggle justify-start px-3 py-3" aria-pressed={live}><span className={`live-dot ${live ? '' : 'live-dot-off'}`} />{live ? 'Live updates on' : 'Live updates paused'}</button><a href="/live" onClick={() => setOpen(false)} className="rounded-md px-3 py-3 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground">Live feed</a></>}{(admin ? ['Back to live feed'] : ['About', 'Terms', ...newsCategories, 'Subscribe']).map((item) => <a key={item} href={admin ? '/' : item === 'Subscribe' ? '/subscribe' : item === 'About' ? '/about' : item === 'Terms' ? '/terms' : item === 'Markets' ? '/markets' : '#feed'} onClick={() => setOpen(false)} className="rounded-md px-3 py-3 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground">{item}</a>)}</div>
      </nav>}
    </header>
  )
}

