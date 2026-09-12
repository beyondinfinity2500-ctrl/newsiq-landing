-- Add image processing status to posts table
-- Status flow: none → processing → ready | failed
-- Keeps editorial status unchanged: draft → pending_review → approved → published

ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS image_status text NOT NULL DEFAULT 'none'
  CHECK (image_status IN ('none', 'processing', 'ready', 'failed'));

COMMENT ON COLUMN posts.image_status IS 'Image processing state: none (default), processing, ready, failed. Separate from editorial status.';

-- Grant permissions: authenticated editors can update, public can read
GRANT UPDATE (image_status) ON posts TO authenticated;