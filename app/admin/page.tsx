'use client'

import { FormEvent, useState } from 'react'
import { SiteFooter } from '../../components/site/SiteFooter'
import { SiteHeader } from '../../components/site/SiteHeader'

export default function AdminPublisher() {
  const [published, setPublished] = useState(false)
  const [access, setAccess] = useState<'Free' | 'Subscriber-only'>('Free')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPublished(true)
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="page-grid" aria-hidden="true" />
      <SiteHeader admin />
      <div className="relative z-10 mx-auto grid max-w-7xl gap-8 px-4 py-8 lg:grid-cols-[minmax(0,680px)_320px] lg:px-8 lg:py-12">
        <section>
          <div className="mb-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">Editorial console / New post</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">Publish a short news update</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">Create one verified update in English and its local-language version. The public feed remains admin-only.</p>
          </div>
          <form onSubmit={handleSubmit} className="signal-panel space-y-6 p-5 sm:p-8">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="space-y-2"><span className="field-label">Region</span><input required placeholder="Indonesia" className="field-input" /></label>
              <label className="space-y-2"><span className="field-label">Category</span><select className="field-input"><option>World</option><option>Markets</option><option>Geopolitics</option><option>Technology</option><option>Disaster</option></select></label>
            </div>
            <label className="block space-y-2"><span className="field-label">Local language</span><input required placeholder="Bahasa Indonesia / 日本語 / Deutsch" className="field-input" /></label>
            <label className="block space-y-2"><span className="field-label">English headline</span><input required placeholder="Strong earthquake strikes eastern Indonesia" className="field-input text-base" /></label>
            <label className="block space-y-2"><span className="field-label">Local headline</span><input placeholder="Optional local-language headline" className="field-input text-base" /></label>
            <label className="block space-y-2"><span className="field-label">Short summary</span><textarea required rows={4} placeholder="What happened, where and why it matters..." className="field-input resize-y leading-6" /></label>
            <label className="block space-y-2"><span className="field-label">AI impact note</span><textarea rows={3} placeholder="Potential disruption to regional logistics and supply routes" className="field-input resize-y leading-6" /></label>
            <div className="border-t border-border pt-5"><span className="field-label">Access level</span><div className="mt-3 grid gap-3 sm:grid-cols-2">{(['Free', 'Subscriber-only'] as const).map((item) => <button type="button" key={item} onClick={() => setAccess(item)} className={`rounded-md border p-3 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${access === item ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-secondary'}`}><span className="block font-semibold">{item}</span><span className="mt-1 block text-xs opacity-75">{item === 'Free' ? 'Visible to everyone' : 'Full analysis requires Pro'}</span></button>)}</div></div>
            <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between"><span className="text-xs text-muted-foreground">Preview only — no post will be saved yet.</span><button type="submit" className="rounded-md bg-primary px-5 py-3 text-xs font-bold text-primary-foreground">{published ? 'Preview ready' : 'Generate preview'}</button></div>
          </form>
        </section>
        <aside className="space-y-5"><div className="rounded-md border border-border bg-card/70 p-5"><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">Workflow</p><div className="mt-5 space-y-4 text-sm">{['Draft the update', 'Add local version', 'Set access level', 'Review before publish'].map((step, index) => <div key={step} className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-primary/40 font-mono text-[10px] text-primary">0{index + 1}</span><span className="pt-1 text-muted-foreground">{step}</span></div>)}</div></div><div className="rounded-md border border-primary/30 bg-primary/[0.07] p-5"><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">Editorial rule</p><p className="mt-3 text-sm leading-6 text-muted-foreground">Every update should be concise, source-aware and clearly separated from analysis. AI notes are informational, not financial advice.</p></div></aside>
      </div>
      <SiteFooter />
    </main>
  )
}
