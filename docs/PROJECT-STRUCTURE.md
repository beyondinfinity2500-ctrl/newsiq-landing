# Project structure

```text
src/
├── app/                 Next.js routes, metadata, sitemap, robots
│   └── [locale]/        Localized public route tree
├── components/          Presentation components and shadcn/ui
├── config/              Site, locale, navigation, environment config
├── features/            Bounded contexts: news, admin, auth, ai, i18n, seo
├── i18n/                next-intl request configuration
├── lib/                 Supabase, AI, validation, errors, logging, security
├── messages/            One JSON message bundle per supported locale
└── types/               Shared domain types

docs/                    Architecture and operating decisions
```

New code should live in the narrowest matching feature or shared layer. Do not place database queries in UI files or provider-specific AI code in a page.
