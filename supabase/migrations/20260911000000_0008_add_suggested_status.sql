-- Phase 8: add 'suggested' post_status for AI story suggestions.
-- Old: ('draft', 'pending_review', 'approved', 'published', 'rejected', 'archived')
-- New: ('draft', 'pending_review', 'approved', 'published', 'rejected', 'archived', 'suggested')
--
-- Adding enum values is non-destructive in PostgreSQL: existing rows keep
-- their values, and we can ALTER the type to accept the new ones.
-- This migration is idempotent: it only adds values that are not already
-- present.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'post_status' AND e.enumlabel = 'suggested'
  ) THEN
    ALTER TYPE post_status ADD VALUE 'suggested';
  END IF;
END $$;