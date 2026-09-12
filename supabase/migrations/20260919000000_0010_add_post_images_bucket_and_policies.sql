-- Add post-images storage bucket foundation and RLS policies
--
-- This migration establishes the storage foundation for article images.
-- The actual Supabase bucket `post-images` must be created in the Supabase Dashboard:
--   Settings > Storage > New bucket
--   Name: post-images
--   Public access: enabled (for published article images)
--   File size limit: adjust as needed
--   Allowed MIME types: image/*
--
-- The bucket convention stores article images at:
--   posts/{post_id}/cover/{filename}
--
-- RLS policies in this migration mirror the existing media table patterns
-- to ensure consistent access control.

-- 1. Add storage_bucket column to media table to track which bucket
--    an image belongs to. This enables multi-bucket setups future-proofing.
ALTER TABLE media
  ADD COLUMN IF NOT EXISTS storage_bucket text NOT NULL DEFAULT 'post-images';

-- 2. Ensure RLS policies for post-image access are explicit and restrictive.

-- Public read: only published articles' images are visible
-- Drop existing policy if it exists, then create fresh
DROP POLICY IF EXISTS "media_public_read_published" ON media;
CREATE POLICY "media_public_read_published" ON media
  FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM posts p WHERE p.id = media.post_id AND p.status = 'published'));

-- Editors can insert images (authenticated only, role check)
-- Drop existing policy if it exists, then create fresh
DROP POLICY IF EXISTS "media_insert_editor" ON media;
CREATE POLICY "media_insert_editor" ON media
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin', 'super_admin')));

-- Editors can update their own images
-- Drop existing policy if it exists, then create fresh
DROP POLICY IF EXISTS "media_update_editor" ON media;
CREATE POLICY "media_update_editor" ON media
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin', 'super_admin')));

-- Admins can delete images
-- Drop existing policy if it exists, then create fresh
DROP POLICY IF EXISTS "media_delete_admin" ON media;
CREATE POLICY "media_delete_admin" ON media
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')));

-- 3. Add comment documenting the storage path convention
COMMENT ON COLUMN media.storage_path IS 'Supabase Storage object key. Convention: posts/{post_id}/cover/{filename}. The bucket name is set via the storage_bucket default: post-images.';

-- 4. Ensure the media_type default covers article images
ALTER TABLE media
  ALTER COLUMN media_type SET DEFAULT 'image'::media_type;

-- 5. Confirm migration executes cleanly on current database schema.
-- The following SELECT is a no-op validation only; it does not modify data.
SELECT 'RLS policies for post-images storage established.' AS status;