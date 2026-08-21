import type { NewsItem } from '../../lib/news/types'

type NewsCardProps = {
  news: NewsItem
  liked: boolean
  saved: boolean
  onLike: () => void
  onSave: () => void
  onShare: () => void
}

function LockIcon() { return <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg> }
function GlobeIcon() { return <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.4 2.5 3.5 5.5 3.5 9S14.4 18.5 12 21c-2.4-2.5-3.5-5.5-3.5-9S9.6 5.5 12 3Z"/></svg> }

export function NewsCard({ news, liked, saved, onLike, onSave, onShare }: NewsCardProps) {
  return <article className="px-5 py-7 transition-colors hover:bg-card/40 sm:px-8">
    <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground"><span className="text-primary">{news.region}</span><span>·</span><span>{news.category}</span><span>·</span><span>{news.time}</span>{news.breaking && <span className="ml-auto rounded bg-red-400/10 px-2 py-1 text-red-300">Breaking</span>}</div>
    <h2 className="mt-4 text-xl font-semibold leading-snug tracking-[-0.02em]">{news.headline}</h2>
    <p className="mt-2 text-sm leading-6 text-muted-foreground">{news.summary}</p>
    <div className="mt-5 rounded-md border border-border bg-secondary/60 p-4"><div className="flex items-center justify-between gap-3"><span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-primary"><GlobeIcon/> {news.localLabel}</span><span className="text-[10px] text-muted-foreground">Local version</span></div><p className="mt-3 text-sm font-medium leading-6 text-foreground/90">{news.localHeadline}</p></div>
    <div className={`mt-5 rounded-md border p-4 ${news.locked ? 'border-primary/30 bg-primary/[0.06]' : 'border-border bg-card/50'}`}><div className="flex items-center justify-between gap-4"><span className="font-mono text-[10px] uppercase tracking-[0.15em] text-primary">AI market impact</span><span className="font-mono text-[10px] text-muted-foreground">Confidence {news.confidence}</span></div><p className={`mt-3 text-sm leading-6 ${news.locked ? 'text-muted-foreground blur-[3px] select-none' : 'text-foreground/85'}`}>{news.impact}</p>{news.locked && <a href="#subscribe" className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-primary hover:underline"><LockIcon/> Subscribe to unlock full analysis</a>}</div>
    <div className="mt-4 flex items-center justify-between border-t border-border/70 pt-4 text-[11px] text-muted-foreground"><span>{news.source}</span><div className="flex items-center gap-3"><button type="button" onClick={onLike} aria-label={liked ? 'Unlike story' : 'Like story'} className={liked ? 'text-primary' : 'hover:text-primary'}>♥ {liked ? 'Liked' : 'Like'}</button><button type="button" onClick={onSave} aria-label={saved ? 'Unsave story' : 'Save story'} className={saved ? 'text-primary' : 'hover:text-primary'}>▱ {saved ? 'Saved' : 'Save'}</button><button type="button" onClick={onShare} aria-label="Share story" className="hover:text-primary">↗ Share</button></div></div>
  </article>
}
