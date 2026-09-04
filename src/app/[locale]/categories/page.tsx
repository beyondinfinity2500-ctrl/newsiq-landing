import { getTranslations } from "next-intl/server";
import { categories } from "@/config/categories";
import Link from "next/link";

export default async function CategoriesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations("nav");

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
      <h1 className="mb-6 text-2xl font-bold text-foreground">{t("categories")}</h1>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            href={`/${locale}/categories/${cat.slug}`}
            className="group rounded-xl border border-border bg-card p-4 transition-all hover:border-foreground/15 hover:shadow-md"
          >
            <h2 className="text-base font-semibold text-foreground transition-colors group-hover:text-primary">
              {t(`category.${cat.slug}`)}
            </h2>
          </Link>
        ))}
      </div>
    </div>
  );
}
