# Development conventions

- TypeScript is strict; avoid `any`.
- Prefer small named functions and explicit interfaces.
- Use server components by default. Add `use client` only for browser interaction.
- Validate request input at the route or action boundary with Zod schemas in
  `src/lib/validation/`.
- Use `maybeSingle()` for optional database results.
- Return visible loading, empty, and error states in user-facing flows.
- Keep locale-independent paths in configuration and prefix them at render time.
- Add tests alongside business rules as features are implemented.

## Environment

The deployment provides the Supabase connection values. Local development uses the same variable names. Public values use the `NEXT_PUBLIC_` prefix; service-role and AI provider keys must remain server-only.

See `.env.example` for the canonical list. Required for the current build:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL` (defaults to `https://newsiq.top`)

Optional / required by later phases:

- `SUPABASE_SERVICE_ROLE_KEY` — server-only, required for any privileged
  Server Action that bypasses RLS (currently `changeRoleAction` in
  `src/features/auth/actions.ts`).
- `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` — server-only, Phase 4+.

## Deployment

The app is designed for Vercel with Supabase as the backend. Before production, apply reviewed database migrations through the Supabase integration, configure auth redirect URLs, set the production site URL, and verify RLS with an anon-key request.

## Authentication (Phase 4)

Authentication is built on Supabase Auth (`@supabase/ssr`) and is wired
through the existing Server Action + client React Context architecture.

### Clients

| Client | Module | Use |
| --- | --- | --- |
| Browser | `createSupabaseBrowserClient` in `src/lib/supabase/client.ts` | `"use client"` components only |
| Server (per-request) | `createSupabaseServerClient` in `src/lib/supabase/server.ts` | Server Components, Server Actions, route handlers |
| Admin (service role) | `createSupabaseAdminClient` in `src/lib/supabase/admin.ts` | Privileged operations that must bypass RLS |

Never import the admin client from a client component.

### Session lifecycle

`src/middleware.ts` runs on every page request (matcher excludes `_next`,
static files, and `/api/*`). It:

1. Runs `next-intl` locale routing.
2. Creates a per-request server client and calls `supabase.auth.getUser()`
   (which validates the session against the Supabase Auth server) so the
   cookies are refreshed and written back on the response.
3. If the user is not authenticated and the path is `<locale>/admin/*`,
   redirects to `<locale>/login?next=...` (defense in depth — the
   authoritative role check still happens at the page level).

### Server Actions

All authentication flows live in `src/features/auth/actions.ts` as
`"use server"` Server Actions:

- `signUpAction(formData)` — calls `supabase.auth.signUp`. A database
  trigger (`handle_new_user`, migration `0005`) creates the matching
  `profiles` row with `role = 'user'`. After signup the user is redirected
  to `/login?message=check-email`.
- `signInAction(formData)` — `supabase.auth.signInWithPassword`.
- `signOutAction()` — `supabase.auth.signOut`.
- `forgotPasswordAction(formData)` — `supabase.auth.resetPasswordForEmail`.
- `resetPasswordAction(formData)` — `supabase.auth.updateUser({ password })`
  (only allowed when the user reached this page via a recovery link,
  enforced by the Supabase session).
- `updateProfileAction(formData)` — updates `display_name`, `avatar_url`,
  `preferred_locale`, `timezone` on `profiles` for the authenticated user.
  Cannot change `role` — see RLS below.
- `changeRoleAction(formData)` — **privileged** Server Action guarded by
  `requireSuperAdmin` and the admin client. Currently headless: no admin
  UI yet, but the security boundary is in place so a future admin page
  can call it without re-implementing authorization.

All actions validate input with Zod (`src/lib/validation/`) and emit
structured log lines through `src/lib/logger/`.

### Auth state on the client

`AuthProvider` in `src/features/auth/auth-context.tsx` exposes
`{ user, profile, role, loading, refresh }` via the `useAuth()` hook.
On mount it calls `supabase.auth.getUser()` and subscribes to
`onAuthStateChange`, keeping the profile in sync after sign-in / sign-out.

The provider is mounted in `src/app/[locale]/layout.tsx` so the whole
locale tree sees consistent auth state.

### Routes

| Route | File | Public? |
| --- | --- | --- |
| `/<locale>/login` | `src/app/[locale]/login/page.tsx` | yes |
| `/<locale>/signup` | `src/app/[locale]/signup/page.tsx` | yes |
| `/<locale>/forgot-password` | `src/app/[locale]/forgot-password/page.tsx` | yes |
| `/<locale>/reset-password` | `src/app/[locale]/reset-password/page.tsx` | gated (session required) |
| `/<locale>/auth/callback` | `src/app/[locale]/auth/callback/route.ts` | OAuth code exchange |
| `/<locale>/profile` | `src/app/[locale]/profile/page.tsx` | auth required |
| `/<locale>/admin/*` | various | editor+ required |

All auth and account pages set `robots: { index: false, follow: false }`
so they do not compete with public news in search.

### i18n & RTL

All auth forms use `useTranslations("auth")` from `next-intl` and read
their text from `src/messages/<locale>.json` — no hardcoded strings.
The existing `textDirection(locale)` helper in `src/config/site.ts`
already drives `<html dir>` for `ar` and `fa`, so the auth UI inherits
RTL support automatically.

## Authorization (Phase 4)

Roles live in the `user_role` PostgreSQL enum (migration `0001`) and
have a numeric hierarchy in `src/lib/security/authorization.ts`:

```
visitor < user < pro < editor < admin < super_admin
```

Server-side helpers in `src/lib/security/authorization.ts`:

- `getCurrentUser(client)` — returns the Supabase `User` or `null`.
- `getUserRole(client)` — returns the role from the `profiles` table
  (defaulting to `"user"` for any authenticated user without a profile
  row, and `"visitor"` for anonymous requests).
- `hasMinRole(role, requiredRole)` — pure numeric comparison.
- `requireAuth`, `requireRole`, `requireEditor`, `requireAdmin`,
  `requireSuperAdmin` — throw `UnauthorizedError` / `ForbiddenError`
  from `src/lib/errors/`.
- `isEditorOrAbove(role)` — client-side UI helper, NOT a security
  boundary. Used by `auth-nav.tsx` and `mobile-nav.tsx` to decide
  whether to show the admin link.

These helpers are the first line of defense. **RLS is authoritative.**
The `profiles_update_own_safe` policy in migration `0005` blocks users
from changing their own `role` even at the SQL level.

## Profiles (Phase 4)

- A row in `public.profiles` is created automatically the moment a new
  user signs up, by the `on_auth_user_created` trigger in migration
  `0005`. The trigger runs with `SECURITY DEFINER` and `ON CONFLICT
  DO NOTHING` so it is safe to re-run.
- Default values: `role = 'user'`, `preferred_locale = 'en'`,
  `timezone = 'UTC'`.
- A user can read and update their own row (RLS), but the `update`
  policy prevents role escalation by checking that the new `role`
  equals the current `role` for the same user.
- Editors and admins have broader read access (`profiles_select_all_editor`)
  for editorial workflows.

## Legacy code (not part of Phase 4)

The following files at the repository root are remnants of the Bolt
export and are NOT imported by `src/`:

- `lib/products.ts`, `lib/news/*`, `lib/markets/*` — duplicate type
  definitions and seed data; safe to remove but kept during Phase 4 to
  avoid scope creep.
- `sitemap.ts` (root) — Next uses `src/app/sitemap.ts` instead; the
  root file is dead.

## News ingestion (Phase 5)

The ingestion pipeline lives in `src/features/ingestion/pipeline.ts`
and is invoked exclusively from the server. It is provider-neutral
and consists of five layers:

```
Source Adapter (RSS/Atom today; REST tomorrow)
     ↓
Normalizer (raw → NormalizedArticle)
     ↓
Deduplicator (source+external_id, canonical URL, content fingerprint)
     ↓
Validator (Zod shape)
     ↓
Post Repository (insert as `pending_review` — never auto-publish)
```

### Adding a new source

1. Insert a row into `sources` with `feed_url`, `default_language`,
   and `country_code` populated. Use the admin UI (`/<locale>/admin/sources/new`)
   or the `createSource` data-access helper.
2. Set `is_active = true` and `verification_status = 'verified'`
   (admins only) before triggering ingestion.
3. Either wait for the cron schedule or call
   `POST /api/cron/ingest` with `{ "sourceId": "<uuid>" }` and the
   `x-cron-secret` header.

### Editorial workflow

Post status lifecycle:

```
draft → pending_review → approved → published → (archived)
                  ↓
               rejected
```

- **draft** — created via the editorial UI; not visible to anyone.
- **pending_review** — created by the ingestion pipeline; awaits editor.
- **approved** — passed review; ready to publish.
- **published** — publicly visible. RLS (`posts_select_published`) is
  the authoritative gate.
- **rejected** — failed review; never auto-promoted.
- **archived** — removed from public listings but retained in DB.

Server Actions in `src/features/editorial/actions.ts`:

- `publishPostAction(formData)` — promoted to `published`. Editor+.
- `unpublishPostAction(formData)` — moved back to `draft`. Editor+.
- `reviewPostAction(formData)` — `pending_review` → `approved` or
  `rejected`. Editor+.

Normal users **cannot** call any of these: the first line of defense
is `requireEditor`; the second is RLS (`posts_insert_editor`,
`posts_update_editor`).

## Scheduled ingestion (Phase 5)

- Endpoint: `POST /api/cron/ingest` (see `src/app/api/cron/ingest/route.ts`).
- Authorization: `x-cron-secret` header compared against
  `process.env.CRON_SECRET`. Vercel Cron supplies this automatically
  when configured in `vercel.json`.
- Body (optional): `{ "sourceId": "<uuid>" }`. Omit to ingest every
  active source.
- Schedule: declared in `vercel.json` (`crons` array) — currently
  `0 */2 * * *` (every 2 hours).
- Service role client is used because the route bypasses RLS by
  design; this is the only path that does so for ingestion.

Configure `CRON_SECRET` in Vercel > Project > Settings > Environment
Variables before the first deploy. Generate with
`openssl rand -hex 32`.

## Multilingual architecture (Phase 6)

### Supported locales

The full list lives in `siteConfig.locales` (`src/config/site.ts:13`):
`en, zh, es, fr, de, ja, ko, tr, ar, pt-br, id, ms, fa, hi, ru`.
Default locale is `en`. RTL is automatically applied for `ar` and `fa`
via the `textDirection(locale)` helper used in the locale layout.

### URL structure

Locale-prefixed paths only — no subdomains, no cookies:

```
/en                       homepage
/en/news/<slug>           article
/en/categories/<slug>     category
/en/search?q=...          search
```

The first segment must always be a valid locale. The middleware
(`src/middleware.ts`) enforces this and refreshes the Supabase session.

### Translation data model

A single `posts` row holds source-level metadata (status, source,
original locale, importance, etc.). Each translation is a row in
`post_translations` with `UNIQUE(post_id, locale)`. The article page
(`src/app/[locale]/news/[slug]/page.tsx`) loads by slug, then prefers:

1. The requested locale (must have `translation_status` in
   `completed` / `published`).
2. The default locale (`en`).
3. The post's original locale.

Whichever is used sets `is_fallback: true` on the returned record so the
UI can show a "showing the X original" notice.

### SEO

- `localizedUrl(locale, path)` is the single source for canonical URLs.
- `articleMetadata({ availableLocales, ... })` builds hreflang links
  **only** for translations that actually exist in the database, plus an
  `x-default` pointing to the default locale.
- Sitemap (`src/app/sitemap.ts`) emits per-locale homepages, all category
  pages, and one URL per `published` post × public translation (bounded
  to 5,000 entries).
- The `robots.ts` keeps `/admin` and `/api/` disallowed; nothing else
  changed in Phase 6.
- NewsArticle JSON-LD is rendered inline on article pages with the
  localized title, description, URL and publication date.

### Translation service boundary (Phase 7-ready)

`src/features/translation/provider.ts` defines the narrow contract that
Phase 7 will satisfy. Phase 6 ships only a no-op provider that flags
every request as `review_required`. The interface guarantees:

- React components never import an AI SDK.
- Provider keys are never bundled in the client.
- The active provider is swappable from a single server-side call site.

### Search

`searchPublishedArticles(query, { locale })` runs an ILIKE query on
title, summary and content of `published` posts with a public
translation in the requested locale. No embeddings, no semantic ranking
— that lands in a later phase.

### RLS

No RLS changes in Phase 6. Public visitors still read only
`status = 'published'` posts whose translation is `completed` /
`published` (enforced by the data-access filters; RLS is the
authoritative gate).

## AI analysis (Phase 7)

### Architecture

```
article (server-only)
  ↓
buildAnalysisPrompt()      ← src/lib/ai/prompts.ts
  ↓
AnalysisProvider           ← src/lib/ai/provider.ts (OpenAI-compatible)
  ↓
Zod validation             ← src/lib/validation/ (aiAnalysisSchema)
  ↓
ai_analyses row            ← status: processing → completed | failed | review_required
  ↓
getLatestAnalysis()        ← src/features/news/data-access.ts (read path, RLS-respecting)
  ↓
AiAnalysisSection          ← src/components/ai/ai-analysis-section.tsx (public UI)
```

The browser never calls the AI provider. The provider adapter uses raw
`fetch` against an OpenAI-compatible endpoint, so the same code works
against OpenAI, OpenRouter, Anthropic, vLLM, LM Studio, etc. — only the
base URL, API key, and model name change.

### Provider configuration (server-side env)

- `AI_PROVIDER_BASE_URL` (default: OpenAI or Anthropic depending on which
  key is set)
- `AI_PROVIDER_API_KEY` (or reuse `OPENAI_API_KEY` / `ANTHROPIC_API_KEY`)
- `AI_PROVIDER_MODEL` (default: `gpt-4o-mini` or `claude-3-5-sonnet-latest`)

If no key is set, `AnalysisProvider.isConfigured()` returns false and
the service refuses to call out — no crashes, no half-baked rows.

### Prompt versioning

`ANALYSIS_VERSION` in `src/lib/ai/prompts.ts` is stamped on every
generated row. Bump it only when the prompt changes semantics. Old
analyses are kept (one row per `(post_id, analysis_version)`) so
historical results are never silently rewritten.

### Caching / idempotency

`generateNewsAnalysis({ postId })` first looks up a `completed` row for
`(postId, ANALYSIS_VERSION)`. If present, it is returned unchanged. The
`force: true` flag (used by the editorial regenerate Server Action)
bypasses the cache.

### Retry & failure handling

The provider retries up to 3 times on `429` and `5xx` with exponential
backoff (1s, 2s, 4s) and a 30s per-attempt timeout. After the budget is
exhausted the row is marked `failed` with a sanitized error message (no
secrets) and `ExternalServiceError` is thrown.

Validation failures (Zod) mark the row `review_required` and preserve
the raw output for editorial inspection. Only `completed` rows are
visible to anonymous visitors.

### Prompt injection

Article body is treated as untrusted data. It is embedded between
sentinel markers (`<<<ARTICLE_START>>>` / `<<<ARTICLE_END>>>`) and the
system prompt instructs the model to analyze, not obey. Trusted
metadata (title, source, country) is newline-stripped and length-capped
before embedding so it cannot be used to confuse the boundary.

### Editorial review

`src/features/ai/actions.ts` exposes two Server Actions:

- `regenerateAnalysisAction` — editor+, forces a fresh analysis, uses
  the service-role client because the writer path needs to insert
  regardless of RLS.
- `reviewAnalysisAction` — editor+ approves a `review_required` row
  (promotes to `completed`); admin+ can also reject a `completed` row
  (marks `failed`).

### Public UI

`AiAnalysisSection` renders the analysis inline on the article page,
behind a clear "AI Analysis" header with a non-dismissible disclaimer:

> Generated by an AI model from this article. Not a verified fact. Not
> financial advice.

The section is hidden entirely when no `completed` analysis exists. A
future "Free vs Pro" gate can wrap it; for Phase 7 the full structure
is shown to everyone, with the disclaimer making the AI nature
unambiguous.
