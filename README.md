# NewsIQ

NewsIQ is a production-oriented global micro-news platform foundation for `newsiq.top`. It is designed around multilingual publishing, persisted AI analysis, market context, source reliability, and a future editorial/admin workflow.

## Foundation included

- Next.js 15 App Router with strict TypeScript
- Tailwind CSS and shadcn/ui primitives
- 15 locale-prefixed routes with RTL support for Arabic and Persian
- Supabase browser/server/admin client boundaries
- Provider-neutral AI contracts for analysis, translation, and market impact
- Central validation, error, logging, authorization, and SEO utilities
- Sitemap, robots rules, health endpoint, and localized metadata foundations
- Concise architecture and security documentation

## Current scope

This is Phase 1. It intentionally does not apply database tables, add authentication screens, or connect an AI provider yet. Those are Phase 2 work and should be implemented as complete flows with reviewed RLS policies.

See `docs/ARCHITECTURE.md`, `docs/PROJECT-STRUCTURE.md`, `docs/SECURITY.md`, `docs/DEVELOPMENT.md`, and `docs/ROADMAP.md` before extending the project.
