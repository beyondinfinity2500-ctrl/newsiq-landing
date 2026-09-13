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
  { name: "Mastercard", className: "checkout-mastercard" },
  { name: "Stripe", className: "checkout-stripe" },
];

const OFFLINE_METHODS = [
  { name: "TNG eWallet", icon: "💳" },
  { name: "WebMoney", icon: "🌐" },
];

const FAQ_ITEMS: Array<{ q: string; a: string }> = [
  { q: "What are AI Analysis Credits?", a: "Each credit unlocks one full AI-generated market impact analysis for a news story. Credits reset monthly and do not roll over." },
  { q: "Can I cancel anytime?", a: "Yes. Monthly plans can be cancelled from your account page at any time. You keep access until the end of the current billing period." },
  { q: "What happens when I run out of credits?", a: "You can still read all news stories. To unlock AI Analysis for additional stories, upgrade to a higher tier or wait for your credits to reset next month." },
  { q: "Is my payment information secure?", a: "Payments are processed by a third-party provider. NewsIQ never sees or stores your card number." },
  { q: "What is the difference between the plans?", a: "AI Analysis — 30 gives you 30 credits per month. AI Analysis — 300 gives you 300 credits. Premium gives you unlimited AI Analysis with priority queue and early access to new features." },
];

function formatPrice(priceInCents: number): string {
  const dollars = priceInCents / 100
  return dollars % 1 === 0 ? `$${dollars}` : `$${dollars.toFixed(2)}`
}

export default async function SubscribePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(siteConfig.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("subscribe");

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="page-grid" aria-hidden="true" />
      <section className="relative z-10 mx-auto max-w-7xl px-5 py-16 sm:py-24 lg:px-8">
        <Breadcrumbs current={t("title")} />
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">NEWSiQ / Membership</p>
          <h1 className="mt-3 text-balance text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">{t("title")}</h1>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-sm leading-6 text-muted-foreground sm:text-base">{t("subtitle")}</p>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl gap-6 sm:grid-cols-3">
          {[
            { icon: "📊", titleKey: "valueMarketImpact", descKey: "valueMarketImpactDesc" },
            { icon: "⚡", titleKey: "valueRealTime", descKey: "valueRealTimeDesc" },
            { icon: "🌍", titleKey: "valueMultilingual", descKey: "valueMultilingualDesc" },
          ].map((item) => (
            <div key={item.titleKey} className="text-center">
              <span className="text-3xl" aria-hidden="true">{item.icon}</span>
              <h3 className="mt-3 text-sm font-semibold text-foreground">{t(item.titleKey)}</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t(item.descKey)}</p>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl gap-5 md:grid-cols-3">
          {PRODUCTS.map((product) => {
            const isFeatured = product.isPremium
            const cardClass = isFeatured
              ? "pricing-card-featured border-primary/70 bg-primary/[0.06] shadow-[0_20px_70px_hsl(var(--primary)/.12)]"
              : "border-border bg-card/70";

            return (
              <article className={`pricing-card relative flex flex-col overflow-hidden rounded-xl border p-6 sm:p-7 ${cardClass}`} key={product.id}>
                {isFeatured && <span className="pricing-badge absolute right-4 top-4 rounded-full bg-primary px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-primary-foreground">Recommended</span>}
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">{product.interval}</p>
                <h2 className="mt-4 text-xl font-semibold tracking-[-0.03em]">{product.name}</h2>
                <p className="mt-2 min-h-12 text-sm leading-6 text-muted-foreground">{product.description}</p>
                <p className="mt-7 text-4xl font-semibold tracking-[-0.05em]">{formatPrice(product.priceInCents)} <span className="text-sm font-normal text-muted-foreground">/ {product.interval}</span></p>
                <ul className="mt-7 grid flex-1 content-start gap-3 text-sm text-muted-foreground">
                  {product.features.map((feature) => (
                    <li className="flex gap-2" key={feature}><span className="text-primary">✓</span>{feature}</li>
                  ))}
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

        <section className="mt-16 rounded-xl border border-border bg-card/70 p-6 sm:p-8">
          <h2 className="text-xl font-bold text-foreground">{t("offlinePaymentTitle")}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("offlinePaymentDescription")}</p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {OFFLINE_METHODS.map((method) => (
              <div key={method.name} className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-4 py-2.5">
                <span className="text-xl" aria-hidden="true">{method.icon}</span>
                <span className="text-sm font-medium text-foreground">{method.name}</span>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <h3 className="text-sm font-semibold text-foreground mb-4">{t("offlineWorkflowTitle")}</h3>
            <ol className="space-y-3">
              {[
                t("offlineStep1"),
                t("offlineStep2"),
                t("offlineStep3"),
                t("offlineStep4"),
                t("offlineStep5"),
                t("offlineStep6"),
                t("offlineStep7"),
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{i + 1}</span>
                  <span className="text-muted-foreground leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-6 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/5 px-4 py-3">
            <span className="text-sm" aria-hidden="true">⏳</span>
            <p className="text-xs leading-relaxed text-muted-foreground">{t("offlinePaymentNote")}</p>
          </div>
        </section>

        <p className="mx-auto mt-12 max-w-3xl text-center text-xs text-muted-foreground">
          {t("termsNote")}
        </p>
      </section>
    </main>
  );
}
