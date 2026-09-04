-- Refresh published_at on the existing demo posts so the public homepage
-- orders them as "just published" regardless of when the original seed
-- migration ran. Safe to re-run.
--
-- This is an idempotent refresh of the seed data only — it does not touch
-- any production data because production deployments would not have these
-- specific demo slugs.

UPDATE posts
SET
  published_at = now() - (row_number() OVER (ORDER BY created_at)) * interval '2 hours',
  updated_at = now()
WHERE slug IN (
  'demo-central-bank-policy-update',
  'demo-tech-innovation-summit-2025',
  'demo-international-climate-agreement'
);
