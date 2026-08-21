"use client"

import { SiteFooter } from "../../components/site/SiteFooter"
import { CheckoutButton } from "../../components/subscribe/CheckoutButton"
import { PRODUCTS } from "../../lib/products"
import { SiteHeader } from "../../components/site/SiteHeader"
import { Breadcrumbs } from "../../components/site/Breadcrumbs"

export default function SubscribePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="page-grid" aria-hidden="true" />
      <SiteHeader />
      <section className="relative z-10 mx-auto max-w-6xl px-5 py-16 sm:py-24 lg:px-8">
        <Breadcrumbs current="Subscribe" />
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">NEWSiQ / Membership</p>
          <h1 className="mt-3 text-balance text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">See the signal behind the headline.</h1>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-sm leading-6 text-muted-foreground sm:text-base">Unlock the context layer that connects breaking events to markets, supply chains and global risk.</p>
        </div>

        <div className="mx-auto mt-10 grid max-w-6xl gap-5 md:grid-cols-2 lg:grid-cols-4">
          {PRODUCTS.map((product, index) => <article className={`pricing-card relative flex flex-col rounded-xl border p-6 sm:p-7 ${index === 2 ? "pricing-card-featured border-primary/70 bg-primary/[0.06] shadow-[0_20px_70px_hsl(var(--primary)/.12)]" : "border-border bg-card/70"}`} key={product.id}>
            {index === 2 && <span className="pricing-badge absolute right-4 top-4 rounded-full bg-primary px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-primary-foreground">Recommended</span>}
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">{product.interval === "year" ? "Annual" : "Monthly"}</p>
            <h2 className="mt-4 text-xl font-semibold tracking-[-0.03em]">{product.name}</h2>
            <p className="mt-2 min-h-12 text-sm leading-6 text-muted-foreground">{product.description}</p>
            <p className="mt-7 text-4xl font-semibold tracking-[-0.05em]">${(product.priceInCents / 100).toFixed(product.priceInCents < 1000 ? 2 : 0)} <span className="text-sm font-normal text-muted-foreground">/ {product.interval}</span></p>
            <ul className="mt-7 grid flex-1 content-start gap-3 text-sm text-muted-foreground"><li className="flex gap-2"><span className="text-primary">✓</span>{product.access}</li></ul>
            <div className="mt-8"><CheckoutButton productId={product.id} label="Subscribe securely" /></div>
          </article>)}
        </div>
        <div className="payment-strip mx-auto mt-10 max-w-2xl rounded-xl border border-border/80 bg-card/60 p-4 text-center" aria-label="Accepted payment methods"><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Secure checkout</p><p className="mt-1 text-xs text-muted-foreground">Pay securely with</p><div className="mt-4 flex flex-wrap items-center justify-center gap-3"><a href="/subscribe" className="checkout-brand checkout-paypal" aria-label="Subscribe with PayPal">PayPal</a><span className="text-xs text-muted-foreground">or</span><a href="/subscribe" className="checkout-brand checkout-mastercard" aria-label="Subscribe with Mastercard">mastercard</a></div></div>
        <p className="mx-auto mt-6 max-w-2xl text-center text-xs leading-5 text-muted-foreground">Secure recurring billing is handled by Stripe. Cancel your subscription through the customer billing portal.</p>
      </section>
      <SiteFooter />
    </main>
  )
}
