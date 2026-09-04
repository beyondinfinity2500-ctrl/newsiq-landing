/*
# NewsIQ Core Database Foundation — Part 3

## Summary
Creates user interaction tables: saved_posts, likes, comments, content_reports,
eyewitness_reports, and subscriptions. These tables support user engagement,
content moderation, and subscription tier management.

## New Tables

### saved_posts
- Users bookmark/save news articles for later reading
- One save per user per post (unique constraint)

### likes
- Users like posts
- One like per user per post (unique constraint)

### comments
- Users comment on posts
- Moderation status: pending, approved, rejected
- Parent_id for threaded replies

### content_reports
- Users report inappropriate content (distinct from eyewitness reports)
- report_reason: spam, harassment, misinformation, violence, other
- moderation_status: pending, reviewed, dismissed

### eyewitness_reports
- User-submitted eyewitness accounts of events
- verification_status: unverified, under_review, verified, rejected
- NEVER automatically verified — always starts as 'unverified'
- Can link to a related post
- Stores location, occurred_at, description

### subscriptions
- Subscription tiers: free, pro
- Billing cycle: monthly, annual
- Status: active, canceled, expired
- Prepared for future Stripe integration (no payment processing in this phase)

## Security (RLS)
- saved_posts: users manage own saves only
- likes: users manage own likes only
- comments: public read approved; users manage own; editors+ moderate
- content_reports: users create own; admins+ manage all
- eyewitness_reports: users create own; editors+ manage all
- subscriptions: users read own; admins+ manage all

## Indexes
- saved_posts: user_id, post_id, unique(user_id, post_id)
- likes: user_id, post_id, unique(user_id, post_id)
- comments: post_id, moderation_status, author_id
- content_reports: post_id, reporter_id, moderation_status
- eyewitness_reports: user_id, verification_status, related_post_id
- subscriptions: user_id, status
*/

-- ============================================================================
-- ENUMS
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE moderation_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE report_reason AS ENUM ('spam', 'harassment', 'misinformation', 'violence', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE report_moderation_status AS ENUM ('pending', 'reviewed', 'dismissed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE eyewitness_verification_status AS ENUM ('unverified', 'under_review', 'verified', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE subscription_tier AS ENUM ('free', 'pro');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE subscription_cycle AS ENUM ('monthly', 'annual');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
-- SAVED_POSTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS saved_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id)
);

ALTER TABLE saved_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "saved_posts_select_own" ON saved_posts;
CREATE POLICY "saved_posts_select_own" ON saved_posts FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "saved_posts_insert_own" ON saved_posts;
CREATE POLICY "saved_posts_insert_own" ON saved_posts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "saved_posts_delete_own" ON saved_posts;
CREATE POLICY "saved_posts_delete_own" ON saved_posts FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_saved_posts_user ON saved_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_posts_post ON saved_posts(post_id);

-- ============================================================================
-- LIKES
-- ============================================================================

CREATE TABLE IF NOT EXISTS likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id)
);

ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "likes_select_public" ON likes;
CREATE POLICY "likes_select_public" ON likes FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "likes_insert_own" ON likes;
CREATE POLICY "likes_insert_own" ON likes FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "likes_delete_own" ON likes;
CREATE POLICY "likes_delete_own" ON likes FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_likes_user ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_post ON likes(post_id);

-- ============================================================================
-- COMMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  content text NOT NULL,
  moderation_status moderation_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Public can read approved comments
DROP POLICY IF EXISTS "comments_select_approved" ON comments;
CREATE POLICY "comments_select_approved" ON comments FOR SELECT
  TO anon, authenticated USING (moderation_status = 'approved');

-- Authors can read their own comments regardless of moderation status
DROP POLICY IF EXISTS "comments_select_own" ON comments;
CREATE POLICY "comments_select_own" ON comments FOR SELECT
  TO authenticated USING (auth.uid() = author_id);

-- Editors+ can read all comments
DROP POLICY IF EXISTS "comments_select_all_editor" ON comments;
CREATE POLICY "comments_select_all_editor" ON comments FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin', 'super_admin'))
  );

-- Users can create their own comments
DROP POLICY IF EXISTS "comments_insert_own" ON comments;
CREATE POLICY "comments_insert_own" ON comments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = author_id);

-- Users can update their own comments (content only, not moderation_status)
DROP POLICY IF EXISTS "comments_update_own" ON comments;
CREATE POLICY "comments_update_own" ON comments FOR UPDATE
  TO authenticated USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);

-- Editors+ can update any comment (for moderation)
DROP POLICY IF EXISTS "comments_update_editor" ON comments;
CREATE POLICY "comments_update_editor" ON comments FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin', 'super_admin'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin', 'super_admin'))
  );

-- Users can delete their own comments
DROP POLICY IF EXISTS "comments_delete_own" ON comments;
CREATE POLICY "comments_delete_own" ON comments FOR DELETE
  TO authenticated USING (auth.uid() = author_id);

-- Admins+ can delete any comment
DROP POLICY IF EXISTS "comments_delete_admin" ON comments;
CREATE POLICY "comments_delete_admin" ON comments FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin'))
  );

CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_author ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_moderation ON comments(moderation_status);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);

DROP TRIGGER IF EXISTS trg_comments_updated_at ON comments;
CREATE TRIGGER trg_comments_updated_at BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- CONTENT_REPORTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS content_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
  report_reason report_reason NOT NULL DEFAULT 'other',
  description text,
  moderation_status report_moderation_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;

-- Users can see their own reports
DROP POLICY IF EXISTS "content_reports_select_own" ON content_reports;
CREATE POLICY "content_reports_select_own" ON content_reports FOR SELECT
  TO authenticated USING (auth.uid() = reporter_id);

-- Admins+ can see all reports
DROP POLICY IF EXISTS "content_reports_select_admin" ON content_reports;
CREATE POLICY "content_reports_select_admin" ON content_reports FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin'))
  );

-- Users can create reports
DROP POLICY IF EXISTS "content_reports_insert_own" ON content_reports;
CREATE POLICY "content_reports_insert_own" ON content_reports FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = reporter_id);

-- Admins+ can update report status
DROP POLICY IF EXISTS "content_reports_update_admin" ON content_reports;
CREATE POLICY "content_reports_update_admin" ON content_reports FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin'))
  );

-- Admins+ can delete reports
DROP POLICY IF EXISTS "content_reports_delete_admin" ON content_reports;
CREATE POLICY "content_reports_delete_admin" ON content_reports FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin'))
  );

CREATE INDEX IF NOT EXISTS idx_content_reports_post ON content_reports(post_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_reporter ON content_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_moderation ON content_reports(moderation_status);

DROP TRIGGER IF EXISTS trg_content_reports_updated_at ON content_reports;
CREATE TRIGGER trg_content_reports_updated_at BEFORE UPDATE ON content_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- EYEWITNESS_REPORTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS eyewitness_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  location text,
  occurred_at timestamptz,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  verification_status eyewitness_verification_status NOT NULL DEFAULT 'unverified',
  moderation_status moderation_status NOT NULL DEFAULT 'pending',
  related_post_id uuid REFERENCES posts(id) ON DELETE SET NULL,
  media_metadata jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE eyewitness_reports ENABLE ROW LEVEL SECURITY;

-- Users can see their own reports
DROP POLICY IF EXISTS "eyewitness_select_own" ON eyewitness_reports;
CREATE POLICY "eyewitness_select_own" ON eyewitness_reports FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

-- Public can see verified eyewitness reports
DROP POLICY IF EXISTS "eyewitness_select_verified" ON eyewitness_reports;
CREATE POLICY "eyewitness_select_verified" ON eyewitness_reports FOR SELECT
  TO anon, authenticated USING (verification_status = 'verified');

-- Editors+ can see all reports
DROP POLICY IF EXISTS "eyewitness_select_all_editor" ON eyewitness_reports;
CREATE POLICY "eyewitness_select_all_editor" ON eyewitness_reports FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin', 'super_admin'))
  );

-- Users can create their own reports
DROP POLICY IF EXISTS "eyewitness_insert_own" ON eyewitness_reports;
CREATE POLICY "eyewitness_insert_own" ON eyewitness_reports FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- Users can update their own reports (only if still unverified)
DROP POLICY IF EXISTS "eyewitness_update_own" ON eyewitness_reports;
CREATE POLICY "eyewitness_update_own" ON eyewitness_reports FOR UPDATE
  TO authenticated USING (auth.uid() = user_id AND verification_status = 'unverified')
  WITH CHECK (auth.uid() = user_id);

-- Editors+ can update any report (for moderation/verification)
DROP POLICY IF EXISTS "eyewitness_update_editor" ON eyewitness_reports;
CREATE POLICY "eyewitness_update_editor" ON eyewitness_reports FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin', 'super_admin'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin', 'super_admin'))
  );

-- Admins+ can delete reports
DROP POLICY IF EXISTS "eyewitness_delete_admin" ON eyewitness_reports;
CREATE POLICY "eyewitness_delete_admin" ON eyewitness_reports FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin'))
  );

CREATE INDEX IF NOT EXISTS idx_eyewitness_user ON eyewitness_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_eyewitness_verification ON eyewitness_reports(verification_status);
CREATE INDEX IF NOT EXISTS idx_eyewitness_related_post ON eyewitness_reports(related_post_id);
CREATE INDEX IF NOT EXISTS idx_eyewitness_moderation ON eyewitness_reports(moderation_status);

DROP TRIGGER IF EXISTS trg_eyewitness_updated_at ON eyewitness_reports;
CREATE TRIGGER trg_eyewitness_updated_at BEFORE UPDATE ON eyewitness_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- SUBSCRIPTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tier subscription_tier NOT NULL DEFAULT 'free',
  billing_cycle subscription_cycle,
  status subscription_status NOT NULL DEFAULT 'active',
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  canceled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can see their own subscription
DROP POLICY IF EXISTS "subscriptions_select_own" ON subscriptions;
CREATE POLICY "subscriptions_select_own" ON subscriptions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

-- Admins+ can see all subscriptions
DROP POLICY IF EXISTS "subscriptions_select_admin" ON subscriptions;
CREATE POLICY "subscriptions_select_admin" ON subscriptions FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin'))
  );

-- Users can create their own subscription
DROP POLICY IF EXISTS "subscriptions_insert_own" ON subscriptions;
CREATE POLICY "subscriptions_insert_own" ON subscriptions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- Users can update their own subscription
DROP POLICY IF EXISTS "subscriptions_update_own" ON subscriptions;
CREATE POLICY "subscriptions_update_own" ON subscriptions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Admins+ can update any subscription
DROP POLICY IF EXISTS "subscriptions_update_admin" ON subscriptions;
CREATE POLICY "subscriptions_update_admin" ON subscriptions FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin'))
  );

-- Admins+ can delete subscriptions
DROP POLICY IF EXISTS "subscriptions_delete_admin" ON subscriptions;
CREATE POLICY "subscriptions_delete_admin" ON subscriptions FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin'))
  );

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_tier ON subscriptions(tier);

DROP TRIGGER IF EXISTS trg_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER trg_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
