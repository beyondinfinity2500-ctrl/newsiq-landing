import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { Link } from "@/i18n";
import { siteConfig } from "@/config/site";
import { PRODUCTS } from "@/lib/products";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "subscribe" });
  return {
    title: t("title"),
    description: t("subtitle"),
    alternates: {
      canonical: `${siteConfig.url}/${locale}/subscribe`,
      languages: Object.fromEntries(siteConfig.locales.map((l) => [l, `${siteConfig.url}/${l}/subscribe`])),
      ...{ "x-default": `${siteConfig.url}/en/subscribe` },
    },
    robots: { index: true, follow: true },
  };
}

const PAYMENT_METHODS = [
  { name: "PayPal", className: "checkout-paypal" },
  { name: "VISA", className: "checkout-visa" },
  { name: "mastercard", className: "checkout-mastercard" },
  { name: "Stripe", className: "checkout-stripe" },
];

const FAQ_ITEMS: Array<{ q: string; a: string }> = [
  { q: "Can I cancel anytime?", a: "Yes. Monthly and yearly plans can be cancelled from your account page at any time. You keep access until the end of the current billing period." },
  { q: "Do you offer student discounts?", a: "Yes. Email press@newsiq.top with a valid academic email and we will send a discount code." },
  { q: "Is my payment information secure?", a: "Payments are processed by a third-party provider. NewsIQ never sees or stores your card number." },
  { q: "What is the difference between Free and Pro?", a: "Free shows you the news and a short AI preview. Pro unlocks the full structured breakdown: which markets, in which direction, with what strength and time horizon, plus the key risks and opportunities." },
  { q: "Do you offer team or enterprise plans?", a: "Yes. The Team plan includes API access, alerting, and custom source ingestion. Email advertising@newsiq.top for a quote." },
];

export default async function SubscribePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(siteConfig.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("subscribe");

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="page-grid" aria-hidden="true" />
      <section className="relative z-10 mx-auto max-w-6xl px-5 py-16 sm:py-24 lg:px-8">
        <Breadcrumbs current={t("title")} />
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">NEWSiQ / Membership</p>
          <h1 className="mt-3 text-balance text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">{t("title")}</h1>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-sm leading-6 text-muted-foreground sm:text-base">{t("subtitle")}</p>
        </div>

        <div className="mx-auto mt-10 grid max-w-6xl gap-5 md:grid-cols-2 lg:grid-cols-4">
          {PRODUCTS.map((product, index) => {
            const isAnnual = product.id === "unlimited-annual";
            const isRecommended = index === 2;
            const cardClass = isAnnual
              ? "pricing-card-annual border-amber-300/70 bg-[linear-gradient(145deg,hsl(42_96%_56%/.16),hsl(var(--card)/.94)_54%)] shadow-[0_20px_70px_hsl(42_96%_56%/.16)]"
              : isRecommended
                ? "pricing-card-featured border-primary/70 bg-primary/[0.06] shadow-[0_20px_70px_hsl(var(--primary)/.12)]"
                : "border-border bg-card/70";

            return (
              <article className={`pricing-card relative flex flex-col overflow-hidden rounded-xl border p-6 sm:p-7 ${cardClass}`} key={product.id}>
                {isAnnual && <span className="pricing-ribbon" aria-label="Best annual value">Best value</span>}
                {isRecommended && <span className="pricing-badge absolute right-4 top-4 rounded-full bg-primary px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-primary-foreground">Recommended</span>}
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">{product.interval === "year" ? "Annual" : "Monthly"}</p>
                <h2 className="mt-4 text-xl font-semibold tracking-[-0.03em]">{product.name}</h2>
                <p className="mt-2 min-h-12 text-sm leading-6 text-muted-foreground">{product.description}</p>
                <p className="mt-7 text-4xl font-semibold tracking-[-0.05em]">${(product.priceInCents / 100).toFixed(product.priceInCents < 1000 ? 2 : 0)} <span className="text-sm font-normal text-muted-foreground">/ {product.interval}</span></p>
                <ul className="mt-7 grid flex-1 content-start gap-3 text-sm text-muted-foreground">
                  <li className="flex gap-2"><span className="text-primary">✓</span>{product.access}</li>
                </ul>
                <div className="mt-8">
                  <Link
                    href={`/signup?plan=${product.id}`}
                    className="block w-full rounded-md bg-primary px-4 py-3 text-center text-xs font-bold text-primary-foreground transition-transform hover:-translate-y-0.5"
                  >
                    {t("subscribeButton")}
                  </Link>
                </div>
                <div className="mt-5 border-t border-border/70 pt-4" aria-label="Accepted payment methods">
                  <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Pay securely with</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {PAYMENT_METHODS.map((method) => (
                      <span className={`checkout-brand ${method.className}`} key={method.name}>{method.name}</span>
                    ))}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
        <p className="mx-auto mt-10 max-w-2xl text-center text-xs leading-5 text-muted-foreground">Secure recurring billing is handled by Stripe. Cancel your subscription through the customer billing portal.</p>

        <section className="mt-16">
          <h2 className="mb-6 text-center text-2xl font-bold text-foreground">{t("faqTitle")}</h2>
          <div className="mx-auto max-w-3xl space-y-3">
            {FAQ_ITEMS.map((item, i) => (
              <details
                key={i}
                className="group rounded-xl border border-border bg-card p-5 open:shadow-sm"
              >
                <summary className="cursor-pointer text-sm font-semibold text-foreground marker:hidden">
                  {item.q}
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <p className="mx-auto mt-12 max-w-3xl text-center text-xs text-muted-foreground">
          {t("termsNote")}
        </p>
      </section>
    </main>
  );
}
