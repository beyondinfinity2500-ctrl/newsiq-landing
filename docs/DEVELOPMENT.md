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
