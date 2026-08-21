const paymentBrands = ['paypal', 'visa', 'mastercard', 'apple-pay', 'google-pay']

export function SiteFooter() {
  return <footer className="relative z-10 mx-auto max-w-7xl border-t border-border px-5 py-8 text-xs text-muted-foreground lg:px-8"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><span className="font-mono tracking-[0.15em]">NEWSiQ.TOP</span><span>Independent intelligence for a moving world · © 2026</span></div><div className="mt-7 flex flex-wrap items-center gap-2 border-t border-border/70 pt-5"><span className="mr-3 font-mono text-[10px] uppercase tracking-[0.16em]">Payment methods</span>{paymentBrands.map((brand) => <span className="payment-mark" key={brand}><img src={`https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons/${brand}/default.svg`} alt={brand.replace('-', ' ')} /></span>)}</div></footer>
}
