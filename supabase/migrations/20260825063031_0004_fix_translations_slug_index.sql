/*
# Fix: Make post_translations slug unique per locale

## Summary
The previous migration created a global unique index on post_translations.slug,
which prevents the same slug from existing in different locales. This changes
it to a composite unique index on (slug, locale) so the same article can share
a slug across languages while still preventing duplicates within one locale.

## Changes
- Drop the unique index idx_translations_slug on post_translations.slug
- Create composite unique index idx_translations_slug_locale on (slug, locale)
*/

DROP INDEX IF EXISTS idx_translations_slug;
CREATE UNIQUE INDEX IF NOT EXISTS idx_translations_slug_locale ON post_translations(slug, locale);
