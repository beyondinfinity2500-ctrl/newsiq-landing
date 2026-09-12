/**
 * Editorial image variants & naming.
 *
 * A master editorial image is stored once; responsive variants are derived
 * from it (640 / 960 / 1280). Next.js Image handles format negotiation
 * (AVIF → WebP → JPEG) and srcset generation from these presets.
 *
 * Variant targets (optimization goals, not hard limits):
 *   feed thumbnails: 20–50 KB
 *   article hero:    50–120 KB
 */

export const IMAGE_WIDTHS = { small: 640, medium: 960, large: 1280 } as const;

export type ImageVariantKey = keyof typeof IMAGE_WIDTHS;

export const FEED_IMAGE_SIZES =
  "(max-width: 640px) 100vw, (max-width: 1280px) 92vw, 680px";

export const HERO_IMAGE_SIZES =
  "(max-width: 640px) 100vw, (max-width: 768px) 92vw, 672px";

/**
 * Build a stable, descriptive, SEO-friendly filename from the article
 * subject. Never use camera-style names (IMG_293829.jpg).
 *
 *   semanticImageFilename("Strait of Hormuz shipping", "oil", "impact")
 *   → "strait-of-hormuz-shipping-oil-impact"
 */
export function semanticImageFilename(...parts: Array<string | null | undefined>): string {
  const slug = parts
    .filter((p): p is string => typeof p === "string" && p.trim().length > 0)
    .join(" ")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug || "editorial-image";
}