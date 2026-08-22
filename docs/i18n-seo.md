# Localization and SEO

The registry supports 15 locales: en, zh, es, fr, de, ja, ko, tr, ar, pt-BR, id, ms, fa, hi, and ru. Arabic and Persian are RTL; all other supported locales are LTR.

`localizedPath`, `buildCanonical`, and `buildHreflang` provide one stable URL identity with locale alternates. Root routes remain the production surface in Phase 1. A future `/:locale/*` migration must add redirects, translated content, canonical validation, sitemap coverage, and hreflang tests before rollout.

Post translations are variants of one post identity, not separate articles. Structured data should use the translated headline and locale while retaining the canonical post URL.
