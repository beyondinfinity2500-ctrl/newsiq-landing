-- Phase 5: expand post_status enum to support editorial workflow.
-- Old: ('draft', 'published', 'archived')
-- New: ('draft', 'pending_review', 'approved', 'published', 'rejected', 'archived')
--
-- Adding enum values is non-destructive in PostgreSQL: existing rows keep
-- their values, and we can ALTER the type to accept the new ones.
-- This migration is idempotent: it only adds values that are not already
-- present (a fresh database will already include them via the original
-- migration's enum, so this becomes a no-op).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'post_status' AND e.enumlabel = 'pending_review'
  ) THEN
    ALTER TYPE post_status ADD VALUE 'pending_review';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'post_status' AND e.enumlabel = 'approved'
  ) THEN
    ALTER TYPE post_status ADD VALUE 'approved';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'post_status' AND e.enumlabel = 'rejected'
  ) THEN
    ALTER TYPE post_status ADD VALUE 'rejected';
  END IF;
END $$;
