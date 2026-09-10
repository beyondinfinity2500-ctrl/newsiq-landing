'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
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

const GlobeIcon = () => (
  <svg aria-hidden="true" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.4 2.5 3.5 5.5 3.5 9S14.4 18.5 12 21c-2.4-2.5-3.5-5.5-3.5-9S9.6 5.5 12 3Z" />
  </svg>
)

const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg aria-hidden="true" className={`h-2.5 w-2.5 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
  </svg>
)

const LanguageDropdown = ({ setLangOpen }: { setLangOpen: (v: boolean) => void }) => (
  <div className="absolute right-0 top-full z-[100] mt-1 w-52 rounded-xl border border-border bg-background shadow-xl" role="listbox" aria-label="Languages">
    <div className="max-h-72 overflow-y-auto p-1.5">
      {languages.map((lang) => (
        <Link
          key={lang.code}
          href={`/${lang.code}`}
          onClick={() => setLangOpen(false)}
          className="flex items-center justify-between rounded-lg px-3 py-1.5 text-sm transition-colors hover:bg-secondary"
          role="option"
        >
          <span className="text-foreground">{lang.native}</span>
          <span className="text-[10px] text-muted-foreground">{lang.name}</span>
        </Link>
      ))}
    </div>
  </div>
)

export function AppHeader() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const [live, setLive] = useState(true)
  const langRef = useRef<HTMLDivElement>(null)
  const mobileRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const locale = pathname.split('/')[1] || 'en'

  const closeAll = useCallback(() => { setMobileOpen(false); setLangOpen(false) }, [])

  useEffect(() => { closeAll() }, [pathname, closeAll])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeAll() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [closeAll])

  useEffect(() => {
    if (!langOpen) return
    const onClick = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [langOpen])

  useEffect(() => {
    if (!mobileOpen) return
    const onClick = (e: MouseEvent) => {
      if (mobileRef.current && !mobileRef.current.contains(e.target as Node)) setMobileOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [mobileOpen])

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-md shadow-[0_1px_3px_hsl(var(--background)/.6)]">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 lg:px-8">

        {/* ── Logo ── */}
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="NEWSiQ home">
          <NiqMascot size={28} />
          <span className="font-mono text-sm font-bold tracking-[0.22em]">NEWS<span className="text-primary">iQ</span></span>
        </Link>

        {/* ── Desktop nav ── */}
        <nav className="ml-6 hidden items-center gap-0 md:flex" aria-label="Primary navigation">
          <Link href={`/${locale}`} className="rounded-md px-2 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">Home</Link>
          <Link href={`/${locale}/about`} className="rounded-md px-2 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">About</Link>

          <span className="inline-flex items-center gap-0">
            <button type="button" onClick={() => setLive(v => !v)} className="live-toggle" aria-pressed={live} aria-label={live ? 'Pause live updates' : 'Resume live updates'}>
              <span className={`live-dot ${live ? '' : 'live-dot-off'}`} />
              {live ? 'Live' : 'Paused'}
            </button>
            <Link href={`/${locale}/trending`} className="rounded-md px-2 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">Trending</Link>
            <Link href={`/${locale}/markets`} className="rounded-md px-2 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">Markets</Link>
          </span>

          <Link href={`/${locale}/terms`} className="rounded-md px-2 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">Terms</Link>

          <Link href={`/${locale}/subscribe`} className="ml-1.5 shrink-0 rounded-md bg-primary px-3.5 py-1.5 text-[11px] font-bold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-[0_0_16px_hsl(var(--primary)/.3)]">Subscribe</Link>
        </nav>

        {/* ── Right side ── */}
        <div className="flex items-center gap-2">
          {/* Language dropdown — all screens */}
          <div ref={langRef} className="relative">
            <button
              type="button"
              onClick={() => setLangOpen(v => !v)}
              className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-expanded={langOpen}
              aria-haspopup="listbox"
              aria-label="Select language"
            >
              <GlobeIcon />
              <span className="hidden sm:inline">EN</span>
              <ChevronIcon open={langOpen} />
            </button>
            {langOpen && <LanguageDropdown setLangOpen={setLangOpen} />}
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            className="menu-button md:hidden"
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMobileOpen(v => !v)}
          >
            <span /><span /><span />
          </button>
        </div>
      </div>

      {/* ── Mobile nav ── */}
      {mobileOpen && (
        <nav ref={mobileRef} id="mobile-navigation" className="border-t border-border/70 bg-background px-4 py-3 md:hidden" aria-label="Mobile navigation">
          <div className="grid gap-0.5">
            <button type="button" onClick={() => setLive(v => !v)} className="live-toggle justify-start px-3 py-2.5" aria-pressed={live}>
              <span className={`live-dot ${live ? '' : 'live-dot-off'}`} />
              {live ? 'Live updates on' : 'Live updates paused'}
            </button>
            <Link href={`/${locale}`} onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-2.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground">Home</Link>
            <Link href={`/${locale}/about`} onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-2.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground">About</Link>
            <Link href={`/${locale}/trending`} onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-2.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground">Trending</Link>
            <Link href={`/${locale}/markets`} onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-2.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground">Markets</Link>
            <Link href={`/${locale}/terms`} onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-2.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground">Terms</Link>
            <Link href={`/${locale}/subscribe`} onClick={() => setMobileOpen(false)} className="mt-1 rounded-md bg-primary px-3 py-2.5 text-center text-sm font-bold text-primary-foreground">Subscribe</Link>
          </div>
        </nav>
      )}
    </header>
  )
}
