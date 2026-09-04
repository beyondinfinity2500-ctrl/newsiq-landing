# Security principles

1. Public Supabase keys may be used in the browser; service-role keys may not.
   The admin client (`createSupabaseAdminClient`) is only ever imported from
   server modules (`"use server"` actions, route handlers) and never from a
   client component.
2. Row Level Security is the authoritative database authorization boundary.
   Every future table must enable RLS and use separate CRUD policies.
3. Roles are checked server-side and must also be enforced by database
   policies or protected server operations. The
   `profiles_update_own_safe` policy in migration `0005` blocks any
   `UPDATE` on `profiles` that would change the `role` column, even for
   the row's own owner. Role changes can only happen through
   `changeRoleAction` (super_admin only) which uses the service-role
   client.
4. Validate every external input at the boundary with Zod (see
   `src/lib/validation/`). Do not trust client role, status, ownership,
   or moderation fields. Authentication inputs (`signUpSchema`,
   `signInSchema`, etc.) and profile inputs (`updateProfileSchema`)
   are validated in every Server Action before reaching Supabase.
5. Store uploaded media in private, scoped storage paths when it
   contains user or admin data. Validate type, size, and ownership
   server-side.
6. AI output is untrusted data. Sanitize rendered rich text and never
   inject raw HTML without an allowlist.
7. Keep secrets in deployment secret storage. Never place provider
   keys in client components or committed documentation.

## Authentication (Phase 4)

Supabase Auth is the only identity provider. The middleware refreshes
the session cookie on every page request and `auth.getUser()` is used
(instead of `getSession()`) so the session is validated against the
Supabase Auth server, not just decoded from the cookie. This prevents
trivial cookie tampering from impersonating a user.

Email + password is the only sign-in method wired in Phase 4. The
architecture leaves room for OAuth providers in a later phase: the
`/auth/callback` route already calls `exchangeCodeForSession(code)`,
so adding a "Continue with Google" button only requires a new Server
Action that calls `supabase.auth.signInWithOAuth({ provider, ... })`
and redirects to the provider.

## Authorization model (Phase 4)

There are two layers and both must agree:

1. **First line of defense** (fast fail in UI / Server Actions):
   `requireAuth`, `requireRole`, `requireEditor`, `requireAdmin`,
   `requireSuperAdmin` in `src/lib/security/authorization.ts`. These
   run on the server and throw typed errors. They never read roles
   from the client.
2. **Authoritative** (database): RLS policies in Supabase. Every
   privileged operation is designed so that even if a request slips
   past the first check, the database will reject it.

The client `useAuth()` hook and the `isEditorOrAbove` helper are
**display-only**. They are used to decide which UI elements to show
(e.g. the "Admin" link in the header). Hiding UI is not security;
real enforcement happens on the server.

## Password reset security

The reset flow is:

1. User submits email at `/forgot-password` → `forgotPasswordAction`
   calls `supabase.auth.resetPasswordForEmail` with
   `redirectTo: <site>/<locale>/reset-password`.
2. User receives an email with a magic link. Supabase creates a
   recovery session when they click it.
3. The `/reset-password` page is gated: if `getUser()` returns
   nothing the page renders an "expired" message instead of the form
   (no reset possible without a session).
4. `resetPasswordAction` calls `supabase.auth.updateUser({ password })`
   on the existing session and redirects to `/login?message=password-reset`.

## Session security

- Sessions are stored in HttpOnly cookies by `@supabase/ssr`. They
  are not accessible to JavaScript.
- `auth.getUser()` is used (not `getSession()`) in the middleware and
  in every privileged server-side code path, so cookie tampering is
  detected by the Supabase Auth server.
- The `service_role_key` is read from `process.env` only on the
  server and only inside `createSupabaseAdminClient`. It is never
  exposed to the client bundle.
