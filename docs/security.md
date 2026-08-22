# Security and privacy

- Never expose `service_role`, secret keys, Stripe secrets, AI gateway credentials, or tokens in browser code.
- Environment variable names alone do not prove an integration is connected.
- Client-side role checks are presentation only; authorization must run server-side with trusted session claims and database-backed roles.
- Every future exposed Supabase table must use RLS and explicit Data API grants. Ownership predicates are required for user-owned rows.
- Avoid `user_metadata` for authorization decisions; use trusted app metadata or a database role relation.
- Public pages use static preview data while the database is unavailable. This is an explicit safe fallback, not a hidden persistence layer.
- Logs should include request IDs and event names, while redacting keys, passwords, tokens, and personal data.
- Newsletter and checkout endpoints must validate input server-side and use idempotency when payment creation is added.
