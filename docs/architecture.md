# NEWSiQ architecture

Phase 1 establishes boundaries without claiming a live database, authentication, AI processing, or editorial workflow.

## Boundaries

- `app/` and `components/`: presentation and route composition.
- `features/`: user-facing application workflows as they grow.
- `lib/news/`, `lib/markets/`: domain data and repositories.
- `lib/integrations/`: provider SDK adapters; server-only by default.
- `types/domain.ts`: stable contracts, locale registry, typed errors, SEO, pagination, and Phase 2 seams.
- `docs/`: decisions, deployment, security, and handoff notes.

The current site intentionally uses static preview content. `staticPostRepositoryWithPreview` is the safe adapter to replace in Phase 2 with a server-only Supabase repository.

## Data model handoff

The planned Supabase shape is `posts`, `post_translations`, `sources`, `entities`, `post_entities`, `market_assets`, and `persisted_analyses`. AI output belongs in persisted analysis records created by publication jobs; public rendering must never call an AI provider.

## Phase 2 prerequisite

Reconnect exactly one Supabase project, verify its project ref and URL, then apply reviewed schema and RLS through the approved workflow. Do not create a second project or infer a database from a Vercel integration label.

## Compatibility

Root routes remain unchanged to preserve bookmarks and SEO. Locale-prefixed routes are prepared by helpers but intentionally not enabled until redirects, canonical URLs, and language content are validated.
