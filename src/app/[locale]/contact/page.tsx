import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { siteConfig } from "@/config/site";
import { StaticPageShell } from "@/components/layout/static-page-shell";
import { Mail } from "lucide-react";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });
  return {
    title: t("title"),
    description: t("subtitle"),
    alternates: {
      canonical: `${siteConfig.url}/${locale}/contact`,
      languages: Object.fromEntries(siteConfig.locales.map((l) => [l, `${siteConfig.url}/${l}/contact`])),
      ...{ "x-default": `${siteConfig.url}/en/contact` },
    },
    robots: { index: true, follow: true },
  };
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(siteConfig.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("contact");

  return (
    <StaticPageShell
      locale={locale}
      title={t("title")}
      subtitle={t("subtitle")}
      relatedLinks={[
        { href: `/${locale}/about`, label: "About" },
        { href: `/${locale}/advertising`, label: "Advertising" },
        { href: `/${locale}/editorial-policy`, label: "Editorial Policy" },
      ]}
    >
      <p className="text-sm leading-relaxed text-muted-foreground">{t("responseTime")}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-lg font-bold text-foreground">{t("general")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("generalText")}</p>
          <a
            href={`mailto:${t("emailValue")}`}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <Mail className="size-4" aria-hidden="true" />
            {t("emailValue")}
          </a>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-lg font-bold text-foreground">{t("press")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("pressText")}</p>
          <a
            href={`mailto:${t("pressEmail")}`}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <Mail className="size-4" aria-hidden="true" />
            {t("pressEmail")}
          </a>
        </div>
      </div>
    </StaticPageShell>
  );
}
