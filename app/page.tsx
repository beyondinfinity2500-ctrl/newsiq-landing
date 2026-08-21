'use client'

import { FormEvent, useState } from 'react'
import JsonLd from '../components/JsonLd'

const signalCards = [
  { label: 'Global coverage', value: '142', suffix: 'markets', tone: 'blue' },
  { label: 'Signal latency', value: '< 90', suffix: 'seconds', tone: 'cyan' },
  { label: 'Source validation', value: '98.4', suffix: '% confidence', tone: 'green' },
]

const topics = ['Geopolitics', 'Commodities', 'Currencies', 'Technology']

export default function Home() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (email.trim()) setSubmitted(true)
  }

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <JsonLd />
      <div className="page-grid" aria-hidden="true" />

      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between border-b border-border/70 px-5 py-5 lg:px-8">
        <a href="#top" className="flex items-center gap-3" aria-label="NEWSiQ home">
          <span className="brand-mark">N</span>
          <span className="font-mono text-sm font-bold tracking-[0.28em] text-foreground">NEWS<span className="text-primary">iQ</span></span>
        </a>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex" aria-label="Main navigation">
          <a href="#signals" className="transition-colors hover:text-foreground">Signals</a>
          <a href="#method" className="transition-colors hover:text-foreground">Our method</a>
          <a href="#access" className="transition-colors hover:text-foreground">Early access</a>
        </nav>
        <button className="rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:border-primary hover:text-primary">EN / فارسی</button>
      </header>

      <section id="top" className="relative z-10 mx-auto grid max-w-7xl gap-12 px-5 pb-20 pt-20 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:px-8 lg:pb-28 lg:pt-28">
        <div>
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
            <span className="live-dot" /> Intelligence before consensus
          </div>
          <h1 className="max-w-4xl text-balance text-5xl font-semibold leading-[1.02] tracking-[-0.06em] text-foreground sm:text-7xl lg:text-8xl">
            See the signal<br /><span className="text-primary">before the noise.</span>
          </h1>
          <p className="mt-7 max-w-xl text-pretty text-lg leading-8 text-muted-foreground sm:text-xl">
            NEWSiQ turns the world&apos;s smallest, earliest stories into clear signals for the markets that matter.
          </p>
          <form id="access" onSubmit={handleSubmit} className="mt-9 flex max-w-lg flex-col gap-3 sm:flex-row">
            <label className="sr-only" htmlFor="email">Professional email address</label>
            <input id="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Your professional email" className="h-13 flex-1 rounded-lg border border-border bg-card px-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary" />
            <button type="submit" className="h-13 rounded-lg bg-primary px-6 text-sm font-bold text-primary-foreground transition-transform hover:-translate-y-0.5">{submitted ? 'You are on the list' : 'Request early access'}</button>
          </form>
          <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Private beta · No noise · Built for curious minds</p>
        </div>

        <div className="signal-panel relative mx-auto w-full max-w-md" aria-label="Live intelligence preview">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Live intelligence / 09:42 UTC</span>
            <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_12px_hsl(var(--primary))]" />
          </div>
          <div className="p-5">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">Signal 00481</p><h2 className="mt-2 text-xl font-semibold leading-snug">Copper supply routes shift as regional tensions rise</h2></div>
              <span className="rounded border border-amber-400/30 bg-amber-400/10 px-2 py-1 font-mono text-[10px] text-amber-300">HIGH</span>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">Early reports indicate a potential disruption across three key transit corridors. Our models are monitoring downstream pressure on industrial metals and FX.</p>
            <div className="mt-6 flex flex-wrap gap-2">{topics.slice(0, 3).map((topic) => <span key={topic} className="rounded-full bg-secondary px-3 py-1 font-mono text-[10px] text-muted-foreground">#{topic}</span>)}</div>
            <div className="mt-7 grid grid-cols-2 gap-3 border-t border-border pt-5"><div><p className="font-mono text-[10px] uppercase text-muted-foreground">Potential impact</p><p className="mt-1 text-sm font-semibold text-amber-300">Mixed / short term</p></div><div><p className="font-mono text-[10px] uppercase text-muted-foreground">Confidence</p><p className="mt-1 text-sm font-semibold text-primary">87.2%</p></div></div>
          </div>
        </div>
      </section>

      <section id="signals" className="relative z-10 mx-auto max-w-7xl border-t border-border/70 px-5 py-12 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-3">{signalCards.map((card) => <div key={card.label} className="stat-card"><p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{card.label}</p><p className={`mt-3 text-4xl font-semibold tracking-[-0.05em] ${card.tone === 'blue' ? 'text-blue' : card.tone === 'cyan' ? 'text-cyan' : 'text-green'}`}>{card.value}<span className="ml-2 text-sm font-normal tracking-normal text-muted-foreground">{card.suffix}</span></p></div>)}</div>
      </section>

      <section id="method" className="relative z-10 mx-auto grid max-w-7xl gap-10 border-t border-border/70 px-5 py-16 lg:grid-cols-[0.7fr_1.3fr] lg:px-8 lg:py-24">
        <div><p className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">The NEWSiQ method</p><h2 className="mt-4 max-w-md text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">The world moves in micro-signals.</h2></div>
        <div className="grid gap-4 sm:grid-cols-3"><article className="method-card"><span className="font-mono text-xs text-primary">01</span><h3 className="mt-10 font-semibold">Detect</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">Find the small stories forming before they become headlines.</p></article><article className="method-card"><span className="font-mono text-xs text-primary">02</span><h3 className="mt-10 font-semibold">Contextualize</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">Connect events to countries, entities, assets and history.</p></article><article className="method-card"><span className="font-mono text-xs text-primary">03</span><h3 className="mt-10 font-semibold">Understand</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">See what may matter next—without the noise or advice.</p></article></div>
      </section>

      <footer className="relative z-10 mx-auto max-w-7xl border-t border-border px-5 py-8 text-xs text-muted-foreground lg:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <span className="font-mono tracking-[0.15em]">NEWSiQ.TOP</span>
          <span>Independent intelligence for a moving world · © 2026</span>
        </div>
        <div className="mt-7 flex flex-col gap-3 border-t border-border/70 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Payment methods</span>
          <div className="flex flex-wrap items-center gap-2" aria-label="Accepted payment methods">
            <span className="payment-mark"><img src="https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons/paypal/default.svg" alt="PayPal" /></span>
            <span className="payment-mark"><img src="https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons/visa/default.svg" alt="Visa" /></span>
            <span className="payment-mark"><img src="https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons/mastercard/default.svg" alt="Mastercard" /></span>
            <span className="payment-mark"><img src="https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons/apple-pay/default.svg" alt="Apple Pay" /></span>
            <span className="payment-mark"><img src="https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons/google-pay/default.svg" alt="Google Pay" /></span>
          </div>
        </div>
      </footer>
    </main>
  )
}

