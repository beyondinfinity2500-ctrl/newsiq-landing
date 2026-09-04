import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { Link } from "@/i18n";
import { siteConfig } from "@/config/site";
import { TrendingUp, ShieldCheck, Layers } from "lucide-react";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "markets" });
  return {
    title: t("title"),
    description: t("subtitle"),
    alternates: {
      canonical: `${siteConfig.url}/${locale}/markets`,
      languages: Object.fromEntries(siteConfig.locales.map((l) => [l, `${siteConfig.url}/${l}/markets`])),
      ...{ "x-default": `${siteConfig.url}/en/markets` },
    },
    robots: { index: true, follow: true },
  };
}

const ASSET_CLASSES = ["commodities", "crypto", "forex", "bonds", "equities", "realEstate"] as const;
const ASSET_ICONS: Record<typeof ASSET_CLASSES[number], typeof Layers> = {
  commodities: Layers,
  crypto: TrendingUp,
  forex: TrendingUp,
  bonds: ShieldCheck,
  equities: TrendingUp,
  realEstate: Layers,
};

export default async function MarketsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(siteConfig.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("markets");

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 lg:px-6">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{t("title")}</h1>
        <p className="mt-2 text-base text-muted-foreground sm:text-lg">{t("subtitle")}</p>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">{t("intro")}</p>
      </header>

      <section>
        <h2 className="mb-4 text-2xl font-bold text-foreground">{t("assetClassesTitle")}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ASSET_CLASSES.map((key) => {
            const Icon = ASSET_ICONS[key];
            return (
              <div key={key} className="rounded-xl border border-border bg-card p-5">
                <Icon className="size-5 text-info" aria-hidden="true" />
                <p className="mt-3 text-sm font-medium text-foreground">{t(`assetClasses.${key}` as never)}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="mb-4 text-2xl font-bold text-foreground">{t("howTitle")}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("howBody")}</p>
      </section>

      <section className="mt-12 rounded-xl border border-warning/30 bg-warning/5 p-6">
        <h2 className="text-lg font-bold text-warning">{t("disclaimerTitle")}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("disclaimerBody")}</p>
      </section>

      <section className="mt-12 rounded-xl border border-info/30 bg-info/5 p-6">
        <h2 className="text-lg font-bold text-foreground">{t("ctaTitle")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("ctaBody")}</p>
        <Link
          href={`/${locale}`}
          className="mt-4 inline-flex items-center rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background transition-colors hover:bg-foreground/90"
        >
          {t("ctaButton")}
        </Link>
      </section>
    </div>
  );
}
