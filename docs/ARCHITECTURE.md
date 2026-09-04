# NewsIQ architecture

## Layers

- **Presentation:** `src/app`, `src/components` — routes, layouts, and reusable UI. Pages render data; they do not contain business rules.
- **Application:** `src/features` — use cases and feature boundaries. News is the first bounded context.
- **Data:** `src/features/*/data-access.ts`, `src/lib/supabase` — the only place where database queries are defined.
- **Integration:** `src/lib/ai` — provider-neutral contracts for analysis, translation, and market impact.
- **Shared:** `src/config`, `src/lib`, `src/types`, `src/constants` — cross-cutting infrastructure.

## Routing

All public URLs use `src/app/[locale]` and a required language prefix. Locale configuration lives in `src/config/site.ts`; message bundles live in `src/messages`. `/admin` and `/api` remain outside localized public pages.

## Server/client boundaries

Pages, layouts, data access, and Supabase server clients are server-first. Browser Supabase access is limited to client components and uses the anon key. The service-role client is server-only and requires an explicit authorization check before every privileged operation.

## News model

A language-independent `posts` entity is related to many `post_translations` rows. AI analysis is stored as a result and read during delivery; it is never generated during a public page request. The database schema is intentionally deferred to the next phase so it can be applied with reviewed RLS policies.

## Future processing

Publishing will enqueue analysis and translation work. Providers implement the contracts in `src/lib/ai/types.ts`; feature code depends on capability interfaces rather than a vendor.
