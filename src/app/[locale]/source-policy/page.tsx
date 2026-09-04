import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { siteConfig } from "@/config/site";
import { StaticPageShell } from "@/components/layout/static-page-shell";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "sourcePolicy" });
  return {
    title: t("title"),
    description: t("subtitle"),
    alternates: {
      canonical: `${siteConfig.url}/${locale}/source-policy`,
      languages: Object.fromEntries(siteConfig.locales.map((l) => [l, `${siteConfig.url}/${l}/source-policy`])),
      ...{ "x-default": `${siteConfig.url}/en/source-policy` },
    },
    robots: { index: true, follow: true },
  };
}

const SECTIONS = ["criteria", "verification", "types", "removal"] as const;

export default async function SourcePolicyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(siteConfig.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("sourcePolicy");

  return (
    <StaticPageShell
      locale={locale}
      title={t("title")}
      subtitle={t("subtitle")}
      relatedLinks={[
        { href: `/${locale}/editorial-policy`, label: "Editorial Policy" },
        { href: `/${locale}/about`, label: "About" },
      ]}
    >
      <p className="text-sm leading-relaxed text-muted-foreground">{t("intro")}</p>

      <div className="mt-8 space-y-8">
        {SECTIONS.map((s) => (
          <section key={s}>
            <h2 className="text-lg font-bold text-foreground">{t(`sections.${s}.title` as never)}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(`sections.${s}.body` as never)}</p>
          </section>
        ))}
      </div>
    </StaticPageShell>
  );
}
