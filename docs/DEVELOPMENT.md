# Development conventions

- TypeScript is strict; avoid `any`.
- Prefer small named functions and explicit interfaces.
- Use server components by default. Add `use client` only for browser interaction.
- Validate request input at the route or action boundary.
- Use `maybeSingle()` for optional database results.
- Return visible loading, empty, and error states in user-facing flows.
- Keep locale-independent paths in configuration and prefix them at render time.
- Add tests alongside business rules as features are implemented.

## Environment

The deployment provides the Supabase connection values. Local development uses the same variable names. Public values use the `NEXT_PUBLIC_` prefix; service-role and AI provider keys must remain server-only.

## Deployment

The app is designed for Vercel with Supabase as the backend. Before production, apply reviewed database migrations through the Supabase integration, configure auth redirect URLs, set the production site URL, and verify RLS with an anon-key request.
