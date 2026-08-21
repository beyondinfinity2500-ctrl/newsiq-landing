"use client"

import { useState } from "react"
import { SiteFooter } from "../../components/site/SiteFooter"
import { SiteHeader } from "../../components/site/SiteHeader"

const features = [
  "Unlimited full AI market-impact analysis",
  "Every story in English plus its local language",
  "Market, geopolitics, disaster and technology coverage",
  "Save and revisit your intelligence archive",
]

export default function SubscribePage() {
  const [annual, setAnnual] = useState(true)

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="page-grid" aria-hidden="true" />
      <SiteHeader />
      <section className="relative z-10 mx-auto max-w-6xl px-5 py-16 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">NEWSiQ / Membership</p>
          <h1 className="mt-3 text-balance text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">See the signal behind the headline.</h1>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-sm leading-6 text-muted-foreground sm:text-base">Unlock the context layer that connects breaking events to markets, supply chains and global risk.</p>
        </div>

        <div className="mx-auto mt-10 flex w-fit items-center gap-1 rounded-full border border-border bg-card p-1 text-xs">
          <button type="button" onClick={() => setAnnual(false)} className={`rounded-full px-4 py-2 transition-colors ${!annual ? "bg-secondary text-foreground" : "text-muted-foreground"}`}>Monthly</button>
          <button type="button" onClick={() => setAnnual(true)} className={`rounded-full px-4 py-2 transition-colors ${annual ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>Annual <span className="ml-1 text-[10px] opacity-80">Save 17%</span></button>
        </div>

        <div className="mx-auto mt-8 grid max-w-4xl gap-5 md:grid-cols-2">
          <article className="rounded-xl border border-border bg-card/70 p-6 sm:p-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Free / Explorer</p>
            <h2 className="mt-4 text-2xl font-semibold tracking-[-0.03em]">Stay informed.</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">A focused stream of the most important short news updates.</p>
            <p className="mt-7 text-4xl font-semibold tracking-[-0.05em]">$0 <span className="text-sm font-normal text-muted-foreground">forever</span></p>
            <ul className="mt-7 grid gap-3 text-sm text-muted-foreground">{["Live short-news feed", "Two-language story format", "Selected AI analysis previews"].map((item) => <li key={item} className="flex gap-2"><span className="text-primary">✓</span>{item}</li>)}</ul>
            <a href="/#feed" className="mt-8 block rounded-md border border-border px-4 py-3 text-center text-xs font-semibold transition-colors hover:border-primary hover:text-primary">Continue with free</a>
          </article>

          <article className="relative overflow-hidden rounded-xl border border-primary/70 bg-primary/[0.06] p-6 shadow-[0_20px_70px_hsl(var(--primary)/.12)] sm:p-8">
            <span className="absolute right-5 top-5 rounded-full bg-primary px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-primary-foreground">Most useful</span>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">Pro / Intelligence</p>
            <h2 className="mt-4 text-2xl font-semibold tracking-[-0.03em]">Understand the impact.</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Full AI analysis for people who need more than the headline.</p>
            <p className="mt-7 text-4xl font-semibold tracking-[-0.05em]">{annual ? "$99" : "$9.99"} <span className="text-sm font-normal text-muted-foreground">{annual ? "/ year" : "/ month"}</span></p>
            <p className="mt-2 text-xs text-primary">{annual ? "Equivalent to $8.25/month" : "Cancel anytime"}</p>
            <ul className="mt-7 grid gap-3 text-sm text-foreground">{features.map((item) => <li key={item} className="flex gap-2"><span className="text-primary">✓</span>{item}</li>)}</ul>
            <button type="button" className="mt-8 w-full rounded-md bg-primary px-4 py-3 text-xs font-bold text-primary-foreground transition-transform hover:-translate-y-0.5">Choose Pro</button>
            <p className="mt-3 text-center text-[11px] text-muted-foreground">Preview only — payments will be connected later.</p>
          </article>
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}
