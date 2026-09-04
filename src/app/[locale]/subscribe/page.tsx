import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { Link } from "@/i18n";
import { siteConfig } from "@/config/site";
import { Check, Sparkles, Users } from "lucide-react";

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

const TIERS = ["free", "pro", "team"] as const;
const TIER_ICONS: Record<typeof TIERS[number], typeof Check> = {
  free: Check,
  pro: Sparkles,
  team: Users,
};

/**
 * Pricing features per tier. We hardcode them here (rather than translating)
 * so the build can statically prerender every locale without round-tripping
 * through next-intl's array support. The labels are kept in English by
 * design — pricing details are universally understood and product-legal
 * copy is reviewed manually, not generated.
 */
const TIER_FEATURES: Record<typeof TIERS[number], string[]> = {
  free: [
    "All published news, in every supported language",
    "Short AI financial preview per article",
    "Reading history and saved articles",
    "Email newsletter (weekly digest)",
  ],
  pro: [
    "Everything in Free",
    "Full market-impact analysis (assets, direction, strength, time horizon, confidence)",
    "Key risks and opportunities per story",
    "Historical context and related-market connections",
    "Priority access to new features and languages",
  ],
  team: [
    "Everything in Pro",
    "API access to the market-impact feed",
    "Slack/Teams alerting on high-impact stories",
    "Custom source ingestion for your team",
    "Priority editorial support",
  ],
};

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
    <div className="mx-auto max-w-6xl px-4 py-10 lg:px-6">
      <header className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{t("title")}</h1>
        <p className="mt-2 text-base text-muted-foreground sm:text-lg">{t("subtitle")}</p>
        <p className="mx-auto mt-4 max-w-2xl text-sm text-muted-foreground">{t("intro")}</p>
      </header>

      <div className="grid gap-5 lg:grid-cols-3">
        {TIERS.map((tier) => {
          const Icon = TIER_ICONS[tier];
          const isPro = tier === "pro";
          return (
            <div
              key={tier}
              className={`relative flex flex-col rounded-2xl border bg-card p-6 ${
                isPro ? "border-info shadow-lg ring-1 ring-info/30" : "border-border"
              }`}
            >
              {isPro && (
                <span className="absolute -top-3 start-6 rounded-full bg-info px-3 py-1 text-xs font-semibold text-info-foreground">
                  {t("pro.mostPopular")}
                </span>
              )}
              <div className="flex items-center gap-2">
                <Icon className="size-5 text-info" aria-hidden="true" />
                <h2 className="text-lg font-bold text-foreground">{t(`${tier}.name` as never)}</h2>
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-foreground">
                  {tier === "team" ? "" : "$"}
                  {t(`${tier}.price` as never)}
                </span>
                <span className="text-sm text-muted-foreground">/ {t(`${tier}.period` as never)}</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{t(`${tier}.tagline` as never)}</p>
              <ul className="mt-5 flex-1 space-y-2.5">
                {TIER_FEATURES[tier].map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                    <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              {tier === "free" ? (
                <Link
                  href={`/${locale}/signup`}
                  className="mt-6 inline-flex items-center justify-center rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                >
                  {t(`${tier}.cta` as never)}
                </Link>
              ) : tier === "pro" ? (
                <Link
                  href={`/${locale}/signup?plan=pro`}
                  className="mt-6 inline-flex items-center justify-center rounded-lg bg-info px-4 py-2.5 text-sm font-semibold text-info-foreground transition-colors hover:bg-info/90"
                >
                  {t(`${tier}.cta` as never)}
                </Link>
              ) : (
                <Link
                  href={`/${locale}/contact`}
                  className="mt-6 inline-flex items-center justify-center rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                >
                  {t(`${tier}.cta` as never)}
                </Link>
              )}
            </div>
          );
        })}
      </div>

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
    </div>
  );
}
