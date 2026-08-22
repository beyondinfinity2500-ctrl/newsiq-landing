# Environment and deployment

## Phase 1

The app builds and renders with static data. Supabase is not assumed to be connected; the presence of `NEXT_PUBLIC_SUPABASE_URL` alone does not establish a working database. No schema, migration, or SQL is part of this phase.

Public browser configuration may include a Supabase URL and publishable key. Server-only credentials must never use a `NEXT_PUBLIC_` prefix and must not be imported by client components.

## Phase 2 checklist

1. Reconnect one intentional Supabase project.
2. Verify the project ref and URL match the intended project.
3. Add the publishable key through the project environment settings.
4. Apply reviewed schema, RLS, and Data API grants.
5. Replace the static repository with a server-only adapter.
6. Test authenticated editor permissions and public reads.
7. Redeploy and verify production routes.

Stripe remains behind the existing checkout route. AI and translation are interfaces only until a provider and persisted job workflow are explicitly approved.
