/**
 * Data-driven category configuration.
 * Categories are NOT hardcoded into individual components — they come from here
 * and will eventually be sourced from the database.
 */

export interface CategoryConfig {
  slug: string;
  labelKey: string; // i18n key, e.g. "category.world"
  icon: string; // lucide icon name reference
}

export const categories: CategoryConfig[] = [
  { slug: "world", labelKey: "category.world", icon: "Globe2" },
  { slug: "politics", labelKey: "category.politics", icon: "Landmark" },
  { slug: "business", labelKey: "category.business", icon: "Briefcase" },
  { slug: "finance", labelKey: "category.finance", icon: "DollarSign" },
  { slug: "technology", labelKey: "category.technology", icon: "Cpu" },
  { slug: "crypto", labelKey: "category.crypto", icon: "Bitcoin" },
  { slug: "markets", labelKey: "category.markets", icon: "BarChart3" },
  { slug: "energy", labelKey: "category.energy", icon: "Zap" },
  { slug: "commodities", labelKey: "category.commodities", icon: "Package" },
  { slug: "science", labelKey: "category.science", icon: "FlaskConical" },
  { slug: "health", labelKey: "category.health", icon: "HeartPulse" },
  { slug: "climate", labelKey: "category.climate", icon: "CloudSun" },
  { slug: "sports", labelKey: "category.sports", icon: "Trophy" },
  { slug: "travel", labelKey: "category.travel", icon: "Plane" },
  { slug: "culture", labelKey: "category.culture", icon: "Palette" },
];

export function getCategoryBySlug(slug: string): CategoryConfig | undefined {
  return categories.find((c) => c.slug === slug);
}
