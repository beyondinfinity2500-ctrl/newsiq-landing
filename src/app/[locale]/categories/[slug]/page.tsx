import { getTranslations } from "next-intl/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPublishedArticles } from "@/features/news/data-access";
import { categories, getCategoryBySlug } from "@/config/categories";
import { NewsFeed } from "@/components/news/news-feed";
import { EmptyState } from "@/components/shared/empty-state";
import { Package } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return categories.map((c) => ({ slug: c.slug }));
}

export default async function CategoryPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const t = await getTranslations("nav");
  const category = getCategoryBySlug(slug);

  if (!category) return <EmptyState icon={<Package size={20} />} title="Category not found" />;

  const supabase = await createSupabaseServerClient();
  const articles = await getPublishedArticles(supabase, { locale, category: category.slug, limit: 20 });

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
      <h1 className="mb-6 text-2xl font-bold text-foreground">{t(`category.${category.slug}`)}</h1>

      <div className="mb-6 flex flex-wrap gap-2">
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            href={`/${locale}/categories/${cat.slug}`}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${cat.slug === category.slug ? "border-foreground bg-foreground text-background" : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"}`}
          >
            {t(`category.${cat.slug}`)}
          </Link>
        ))}
      </div>

      {articles.length > 0 ? (
        <NewsFeed articles={articles} locale={locale} />
      ) : (
        <EmptyState
          icon={<Package size={20} />}
          title="No articles in this category yet"
          description="Check back soon for the latest news in this category."
        />
      )}
    </div>
  );
}
