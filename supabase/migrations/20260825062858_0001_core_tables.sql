/*
# NewsIQ Core Database Foundation — Part 1

## Summary
Creates the foundational tables for the NewsIQ platform: profiles, sources,
countries, categories (with hierarchical support), posts, post_translations,
and media metadata.

## New Tables

### profiles
- Links to Supabase Auth users (id = auth.users.id)
- Stores display_name, avatar_url, preferred_locale, timezone, role
- role controls editorial/admin access (user, pro, editor, admin, super_admin)

### sources
- News source registry (name, domain, url, country, language, source_type)
- credibility_score (0-100) for editorial reliability assessment
- verification_status tracks source vetting state
- is_active flag for soft-disable

### countries
- Normalized country reference (ISO 3166-1 alpha-2 and alpha-3 codes)
- name, native_name, region for geographic filtering
- ISO codes are unique

### categories
- Hierarchical category tree (parent_id self-reference)
- slug, name, description, icon, sort_order, is_active
- Data-driven — replaces hardcoded category config

### posts
- Main news article table
- Links to source, country, category, author (profile)
- verification_status: unverified, verified, disputed, developing, likely
- importance: low, medium, high, breaking
- content_type: news, breaking, developing, eyewitness, analysis
- status: draft, published, archived
- Eyewitness reports are NEVER automatically verified

### post_translations
- Multilingual translations for posts (one row per post+locale)
- Unique constraint on (post_id, locale) prevents duplicates
- slug is unique per locale for URL routing
- seo_title, seo_description for per-locale SEO
- translation_status: draft, reviewed, published

### media
- Metadata for media assets stored in Supabase Storage
- Links to posts, stores storage_path, public_url, dimensions, alt_text

## Security (RLS)
- profiles: users read own profile; editors+ read all; users update own
- sources: public read for active; editors+ manage
- countries: public read
- categories: public read; editors+ manage
- posts: public read published; editors+ manage all
- post_translations: public read published; editors+ manage
- media: public read; editors+ manage

## Indexes
- posts: published_at, status, category_id, country_id, source_id, verification_status, importance
- post_translations: locale, slug (unique), post_id+locale (unique)
- sources: domain (unique), country
- categories: slug (unique), parent_id
- countries: iso2 (unique), iso3 (unique)
- media: post_id
*/

-- ============================================================================
-- ENUMS
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('visitor', 'user', 'pro', 'editor', 'admin', 'super_admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE post_status AS ENUM ('draft', 'published', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE verification_status AS ENUM ('unverified', 'verified', 'disputed', 'developing', 'likely');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE importance_level AS ENUM ('low', 'medium', 'high', 'breaking');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE content_type AS ENUM ('news', 'breaking', 'developing', 'eyewitness', 'analysis');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE source_type AS ENUM ('agency', 'media', 'social', 'official', 'community', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE source_verification_status AS ENUM ('unverified', 'under_review', 'verified', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE translation_status AS ENUM ('draft', 'reviewed', 'published');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE media_type AS ENUM ('image', 'video', 'audio', 'document', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE continent_type AS ENUM ('africa', 'asia', 'europe', 'north_america', 'south_america', 'oceania', 'middle_east', 'global');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
-- PROFILES
-- ============================================================================

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  preferred_locale text DEFAULT 'en',
  timezone text DEFAULT 'UTC',
  role user_role NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_select_all_editor" ON profiles;
CREATE POLICY "profiles_select_all_editor" ON profiles FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- ============================================================================
-- SOURCES
-- ============================================================================

CREATE TABLE IF NOT EXISTS sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  domain text UNIQUE,
  url text,
  country text,
  language text DEFAULT 'en',
  source_type source_type DEFAULT 'media',
  credibility_score integer NOT NULL DEFAULT 50 CHECK (credibility_score >= 0 AND credibility_score <= 100),
  verification_status source_verification_status NOT NULL DEFAULT 'unverified',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sources_select_public" ON sources;
CREATE POLICY "sources_select_public" ON sources FOR SELECT
  TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS "sources_select_all_editor" ON sources;
CREATE POLICY "sources_select_all_editor" ON sources FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "sources_insert_editor" ON sources;
CREATE POLICY "sources_insert_editor" ON sources FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "sources_update_editor" ON sources;
CREATE POLICY "sources_update_editor" ON sources FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin', 'super_admin'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "sources_delete_admin" ON sources;
CREATE POLICY "sources_delete_admin" ON sources FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin'))
  );

CREATE INDEX IF NOT EXISTS idx_sources_domain ON sources(domain);
CREATE INDEX IF NOT EXISTS idx_sources_country ON sources(country);
CREATE INDEX IF NOT EXISTS idx_sources_active ON sources(is_active) WHERE is_active = true;

-- ============================================================================
-- COUNTRIES
-- ============================================================================

CREATE TABLE IF NOT EXISTS countries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  iso2 text NOT NULL UNIQUE,
  iso3 text NOT NULL UNIQUE,
  name text NOT NULL,
  native_name text,
  region text,
  continent continent_type,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE countries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "countries_select_public" ON countries;
CREATE POLICY "countries_select_public" ON countries FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "countries_insert_editor" ON countries;
CREATE POLICY "countries_insert_editor" ON countries FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "countries_update_editor" ON countries;
CREATE POLICY "countries_update_editor" ON countries FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin', 'super_admin'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "countries_delete_admin" ON countries;
CREATE POLICY "countries_delete_admin" ON countries FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin'))
  );

CREATE INDEX IF NOT EXISTS idx_countries_name ON countries(name);
CREATE INDEX IF NOT EXISTS idx_countries_region ON countries(region);

-- ============================================================================
-- CATEGORIES
-- ============================================================================

CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  parent_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  icon text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories_select_public" ON categories;
CREATE POLICY "categories_select_public" ON categories FOR SELECT
  TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS "categories_select_all_editor" ON categories;
CREATE POLICY "categories_select_all_editor" ON categories FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "categories_insert_editor" ON categories;
CREATE POLICY "categories_insert_editor" ON categories FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "categories_update_editor" ON categories;
CREATE POLICY "categories_update_editor" ON categories FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin', 'super_admin'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "categories_delete_admin" ON categories;
CREATE POLICY "categories_delete_admin" ON categories FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin'))
  );

CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_sort ON categories(sort_order);

-- ============================================================================
-- POSTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  title text NOT NULL,
  summary text,
  content text,
  source_id uuid REFERENCES sources(id) ON DELETE SET NULL,
  country_id uuid REFERENCES countries(id) ON DELETE SET NULL,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  author_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  verification_status verification_status NOT NULL DEFAULT 'unverified',
  importance importance_level NOT NULL DEFAULT 'medium',
  content_type content_type NOT NULL DEFAULT 'news',
  status post_status NOT NULL DEFAULT 'draft',
  original_locale text NOT NULL DEFAULT 'en',
  source_url text,
  country text,
  continent continent_type,
  entities text[] NOT NULL DEFAULT '{}',
  financial_assets text[] NOT NULL DEFAULT '{}',
  hashtags text[] NOT NULL DEFAULT '{}',
  cover_image_url text,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Public can read published posts
DROP POLICY IF EXISTS "posts_select_published" ON posts;
CREATE POLICY "posts_select_published" ON posts FOR SELECT
  TO anon, authenticated USING (status = 'published');

-- Editors+ can read all posts
DROP POLICY IF EXISTS "posts_select_all_editor" ON posts;
CREATE POLICY "posts_select_all_editor" ON posts FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin', 'super_admin'))
  );

-- Editors+ can insert posts
DROP POLICY IF EXISTS "posts_insert_editor" ON posts;
CREATE POLICY "posts_insert_editor" ON posts FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin', 'super_admin'))
  );

-- Editors+ can update posts
DROP POLICY IF EXISTS "posts_update_editor" ON posts;
CREATE POLICY "posts_update_editor" ON posts FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin', 'super_admin'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin', 'super_admin'))
  );

-- Admins+ can delete posts
DROP POLICY IF EXISTS "posts_delete_admin" ON posts;
CREATE POLICY "posts_delete_admin" ON posts FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin'))
  );

CREATE INDEX IF NOT EXISTS idx_posts_published_at ON posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category_id);
CREATE INDEX IF NOT EXISTS idx_posts_country ON posts(country_id);
CREATE INDEX IF NOT EXISTS idx_posts_source ON posts(source_id);
CREATE INDEX IF NOT EXISTS idx_posts_verification ON posts(verification_status);
CREATE INDEX IF NOT EXISTS idx_posts_importance ON posts(importance);
CREATE INDEX IF NOT EXISTS idx_posts_content_type ON posts(content_type);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);

-- ============================================================================
-- POST_TRANSLATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS post_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  locale text NOT NULL,
  title text NOT NULL,
  summary text,
  content text,
  slug text NOT NULL,
  seo_title text,
  seo_description text,
  og_image_url text,
  translation_status translation_status NOT NULL DEFAULT 'draft',
  is_original boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(post_id, locale)
);

ALTER TABLE post_translations ENABLE ROW LEVEL SECURITY;

-- Public can read published translations
DROP POLICY IF EXISTS "translations_select_published" ON post_translations;
CREATE POLICY "translations_select_published" ON post_translations FOR SELECT
  TO anon, authenticated USING (
    translation_status = 'published'
    OR EXISTS (
      SELECT 1 FROM posts p
      WHERE p.id = post_translations.post_id
      AND p.status = 'published'
    )
  );

-- Editors+ can read all translations
DROP POLICY IF EXISTS "translations_select_all_editor" ON post_translations;
CREATE POLICY "translations_select_all_editor" ON post_translations FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin', 'super_admin'))
  );

-- Editors+ can insert translations
DROP POLICY IF EXISTS "translations_insert_editor" ON post_translations;
CREATE POLICY "translations_insert_editor" ON post_translations FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin', 'super_admin'))
  );

-- Editors+ can update translations
DROP POLICY IF EXISTS "translations_update_editor" ON post_translations;
CREATE POLICY "translations_update_editor" ON post_translations FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin', 'super_admin'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin', 'super_admin'))
  );

-- Admins+ can delete translations
DROP POLICY IF EXISTS "translations_delete_admin" ON post_translations;
CREATE POLICY "translations_delete_admin" ON post_translations FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin'))
  );

CREATE UNIQUE INDEX IF NOT EXISTS idx_translations_slug ON post_translations(slug);
CREATE INDEX IF NOT EXISTS idx_translations_locale ON post_translations(locale);
CREATE INDEX IF NOT EXISTS idx_translations_post_id ON post_translations(post_id);
CREATE INDEX IF NOT EXISTS idx_translations_status ON post_translations(translation_status);

-- ============================================================================
-- MEDIA
-- ============================================================================

CREATE TABLE IF NOT EXISTS media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  public_url text,
  media_type media_type NOT NULL DEFAULT 'image',
  alt_text text,
  caption text,
  width integer,
  height integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "media_select_public" ON media;
CREATE POLICY "media_select_public" ON media FOR SELECT
  TO anon, authenticated USING (
    EXISTS (SELECT 1 FROM posts p WHERE p.id = media.post_id AND p.status = 'published')
  );

DROP POLICY IF EXISTS "media_select_all_editor" ON media;
CREATE POLICY "media_select_all_editor" ON media FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "media_insert_editor" ON media;
CREATE POLICY "media_insert_editor" ON media FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "media_update_editor" ON media;
CREATE POLICY "media_update_editor" ON media FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin', 'super_admin'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "media_delete_admin" ON media;
CREATE POLICY "media_delete_admin" ON media FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin'))
  );

CREATE INDEX IF NOT EXISTS idx_media_post_id ON media(post_id);

-- ============================================================================
-- UPDATED_AT TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON profiles;
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_sources_updated_at ON sources;
CREATE TRIGGER trg_sources_updated_at BEFORE UPDATE ON sources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_categories_updated_at ON categories;
CREATE TRIGGER trg_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_posts_updated_at ON posts;
CREATE TRIGGER trg_posts_updated_at BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_translations_updated_at ON post_translations;
CREATE TRIGGER trg_translations_updated_at BEFORE UPDATE ON post_translations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
