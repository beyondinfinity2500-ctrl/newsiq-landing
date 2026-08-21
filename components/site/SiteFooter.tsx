const paymentBrands = [
  { name: 'PayPal', className: 'payment-paypal' },
  { name: 'VISA', className: 'payment-visa' },
  { name: 'mastercard', className: 'payment-mastercard' },
  { name: 'stripe', className: 'payment-stripe' },
  { name: 'Apple Pay', className: 'payment-apple' },
  { name: 'Google Pay', className: 'payment-google' },
]

const marketSymbols = [
  { mark: '₿', label: 'Bitcoin', className: 'market-symbol-bitcoin' },
  { mark: 'Au', label: 'Gold' },
  { mark: 'Ag', label: 'Silver' },
  { mark: 'EQ', label: 'Equities' },
  { mark: 'OIL', label: 'Oil' },
  { mark: 'FX', label: 'Foreign exchange' },
]

export function SiteFooter() {
  return <footer className="relative z-10 mx-auto max-w-7xl border-t border-border px-5 py-8 text-xs text-muted-foreground lg:px-8"><div className="flex flex-col gap-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex flex-col gap-1"><a href="https://newsiq.top" title="Global news intelligence" className="w-fit font-mono tracking-[0.15em] transition-colors hover:text-foreground">NEWSiQ.TOP</a><span>Independent intelligence for a moving world · © 2026</span></div><nav className="flex gap-4" aria-label="Footer navigation"><a href="/about" className="hover:text-foreground">About</a><a href="/terms" className="hover:text-foreground">Terms</a><a href="/subscribe" className="hover:text-foreground">Subscribe</a></nav></div><div className="border-t border-border/70 pt-5"><p className="mb-3 font-mono text-[10px] uppercase tracking-[0.16em]">Market symbols</p><div className="flex flex-wrap gap-2" aria-label="Market categories"><span className="sr-only">Indicative market categories, not live quotes:</span>{marketSymbols.map(({ mark, label, className }) => <a href="/markets" className={`market-symbol ${className ?? ''}`} key={label} title={`View ${label} market data`} aria-label={`View ${label} market data`}><span aria-hidden="true">{mark}</span><span>{label}</span></a>)}</div></div><div className="border-t border-border/70 pt-5" aria-label="Payment methods"><p className="mb-3 font-mono text-[10px] uppercase tracking-[0.16em]">Payment methods</p><div className="flex flex-wrap gap-2">{paymentBrands.map(({ name, className }) => <a href="/subscribe" className={`payment-mark ${className}`} key={name} title={`Subscribe with ${name}`} aria-label={`Subscribe with ${name}`}>{name}</a>)}</div></div></div></footer>
}
