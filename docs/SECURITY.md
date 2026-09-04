# Security principles

1. Public Supabase keys may be used in the browser; service-role keys may not.
2. Row Level Security is the authoritative database authorization boundary. Every future table must enable RLS and use separate CRUD policies.
3. Roles are checked server-side and must also be enforced by database policies or protected server operations.
4. Validate every external input at the boundary with Zod. Do not trust client role, status, ownership, or moderation fields.
5. Store uploaded media in private, scoped storage paths when it contains user or admin data. Validate type, size, and ownership server-side.
6. AI output is untrusted data. Sanitize rendered rich text and never inject raw HTML without an allowlist.
7. Keep secrets in deployment secret storage. Never place provider keys in client components or committed documentation.
