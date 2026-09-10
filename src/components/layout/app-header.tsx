'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { NiqMascot } from '@/components/brand/NiqMascot'

const languages = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'zh', name: 'Chinese', native: '中文' },
  { code: 'es', name: 'Spanish', native: 'Español' },
  { code: 'fr', name: 'French', native: 'Français' },
  { code: 'de', name: 'German', native: 'Deutsch' },
  { code: 'ja', name: 'Japanese', native: '日本語' },
  { code: 'ko', name: 'Korean', native: '한국어' },
  { code: 'tr', name: 'Turkish', native: 'Türkçe' },
  { code: 'ar', name: 'Arabic', native: 'العربية' },
  { code: 'pt-br', name: 'Portuguese', native: 'Português' },
  { code: 'id', name: 'Indonesian', native: 'Bahasa Indonesia' },
  { code: 'ms', name: 'Malay', native: 'Bahasa Melayu' },
  { code: 'fa', name: 'Persian', native: 'فارسی' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'ru', name: 'Russian', native: 'Русский' },
] as const

export function AppHeader() {
  const [open, setOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const [live, setLive] = useState(true)
  const langRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        setLangOpen(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    if (!langOpen) return
    const handleClick = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [langOpen])

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background shadow-[0_8px_24px_hsl(var(--background)/.45)]">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 lg:px-8">
        <Link href="/" title="Global news intelligence" className="flex shrink-0 items-center gap-3" aria-label="Global news intelligence — NEWSiQ home">
          <NiqMascot size={32} />
          <span className="font-mono text-sm font-bold tracking-[0.28em]">NEWS<span className="text-primary">iQ</span></span>
        </Link>

        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-0 md:flex" aria-label="Primary navigation">
          <Link href="/" className="rounded-md px-1.5 py-2 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">Home</Link>
          <Link href="/about" className="rounded-md px-1.5 py-2 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">About</Link>
          <span className="inline-flex items-center gap-0.5">
            <button type="button" onClick={() => setLive((value) => !value)} className="live-toggle" aria-pressed={live} aria-label={`${live ? 'Disable' : 'Enable'} live market data`}>
              <span className={`live-dot ${live ? '' : 'live-dot-off'}`} />
              {live ? 'Live' : 'Paused'}
            </button>
            <Link href="/live" className="rounded-md px-1.5 py-2 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">Live Feed</Link>
            <Link href="/markets" className="rounded-md px-1.5 py-2 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">Markets</Link>
          </span>
          {['Geopolitics', 'Technology'].map((item) => (
            <Link key={item} href="#feed" className="rounded-md px-1.5 py-2 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">{item}</Link>
          ))}
          <Link href="/terms" className="rounded-md px-1.5 py-2 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">Terms</Link>
          <Link href="/subscribe" className="rounded-md bg-primary px-3 py-2 text-xs font-bold text-primary-foreground transition-transform hover:-translate-y-0.5">Subscribe</Link>
        </nav>

        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground lg:flex">
            <span className="live-dot" />
            Live global feed
          </span>

          {/* Language switcher */}
          <div ref={langRef} className="relative hidden sm:block">
            <button
              type="button"
              onClick={() => setLangOpen((v) => !v)}
              className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-expanded={langOpen}
              aria-haspopup="listbox"
              aria-label="Select language"
            >
              <svg aria-hidden="true" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="9" />
                <path d="M3 12h18M12 3c2.4 2.5 3.5 5.5 3.5 9S14.4 18.5 12 21c-2.4-2.5-3.5-5.5-3.5-9S9.6 5.5 12 3Z" />
              </svg>
              EN
              <svg aria-hidden="true" className={`h-3 w-3 transition-transform ${langOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
              </svg>
            </button>
            {langOpen && (
              <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-xl border border-border bg-background shadow-xl" role="listbox" aria-label="Languages">
                <div className="max-h-80 overflow-y-auto p-1.5">
                  {languages.map((lang) => (
                    <Link
                      key={lang.code}
                      href={`/${lang.code}`}
                      onClick={() => setLangOpen(false)}
                      className="flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-secondary"
                      role="option"
                      aria-selected={lang.code === 'en'}
                    >
                      <span className="text-foreground">{lang.native}</span>
                      <span className="text-[10px] text-muted-foreground">{lang.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Link href="/subscribe" className="hidden rounded-md bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground transition-transform hover:-translate-y-0.5 sm:inline-flex">Unlock analysis</Link>
          <button type="button" className="menu-button md:hidden" aria-expanded={open} aria-controls="mobile-navigation" aria-label={open ? 'Close navigation menu' : 'Open navigation menu'} onClick={() => setOpen((value) => !value)}>
            <span /><span /><span />
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-navigation" className="border-t border-border/70 px-4 py-3 md:hidden" aria-label="Mobile navigation">
          <div className="grid gap-1">
            <button type="button" onClick={() => setLive((value) => !value)} className="live-toggle justify-start px-3 py-3" aria-pressed={live}>
              <span className={`live-dot ${live ? '' : 'live-dot-off'}`} />
              {live ? 'Live updates on' : 'Live updates paused'}
            </button>
            <Link href="/live" onClick={() => setOpen(false)} className="rounded-md px-3 py-3 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground">Live feed</Link>
            {['About', 'Terms', 'Markets', 'Geopolitics', 'Technology', 'Subscribe'].map((item) => (
              <Link
                key={item}
                href={item === 'Subscribe' ? '/subscribe' : item === 'About' ? '/about' : item === 'Terms' ? '/terms' : item === 'Markets' ? '/markets' : '#feed'}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-3 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                {item}
              </Link>
            ))}
            {/* Mobile language links */}
            <div className="mt-2 border-t border-border pt-2">
              <p className="px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Languages</p>
              <div className="flex flex-wrap gap-1.5 px-3 pt-1">
                {languages.map((lang) => (
                  <Link
                    key={lang.code}
                    href={`/${lang.code}`}
                    onClick={() => setOpen(false)}
                    className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    {lang.native}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </nav>
      )}
    </header>
  )
}
