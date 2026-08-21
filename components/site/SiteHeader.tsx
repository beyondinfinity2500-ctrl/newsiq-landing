'use client'

import { useEffect, useState } from 'react'
import { newsCategories } from '../../lib/news/types'

export function SiteHeader({ admin = false }: { admin?: boolean }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 lg:px-8">
        <a href={admin ? '/' : '#top'} className="flex shrink-0 items-center gap-3" aria-label="NEWSiQ home">
          <span className="brand-mark">N</span><span className="font-mono text-sm font-bold tracking-[0.28em]">NEWS<span className="text-primary">iQ</span></span>
        </a>
        {!admin && <nav className="hidden items-center gap-1 md:flex" aria-label="Primary navigation">
          {newsCategories.map((item) => <a key={item} href={item === 'Markets' ? '/markets' : '#feed'} className="rounded-md px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">{item}</a>)}<a href="/about" className="rounded-md px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">About</a><a href="/terms" className="rounded-md px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">Terms</a>
        </nav>}
        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground lg:flex"><span className="live-dot" />Live global feed</span>
          {!admin && <a href="/subscribe" className="hidden rounded-md bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground transition-transform hover:-translate-y-0.5 sm:inline-flex">Unlock analysis</a>}
          <button type="button" className="menu-button md:hidden" aria-expanded={open} aria-controls="mobile-navigation" aria-label={open ? 'Close navigation menu' : 'Open navigation menu'} onClick={() => setOpen((value) => !value)}><span /><span /><span /></button>
        </div>
      </div>
      {open && <nav id="mobile-navigation" className="border-t border-border/70 px-4 py-3 md:hidden" aria-label="Mobile navigation">
        <div className="grid gap-1">{(admin ? ['Back to live feed'] : [...newsCategories, 'About', 'Terms', 'Subscribe']).map((item) => <a key={item} href={admin ? '/' : item === 'Subscribe' ? '/subscribe' : item === 'About' ? '/about' : item === 'Terms' ? '/terms' : item === 'Markets' ? '/markets' : '#feed'} onClick={() => setOpen(false)} className="rounded-md px-3 py-3 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground">{item}</a>)}</div>
      </nav>}
    </header>
  )
}

