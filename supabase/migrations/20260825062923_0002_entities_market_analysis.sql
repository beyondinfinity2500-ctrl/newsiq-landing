/*
# NewsIQ Core Database Foundation — Part 2

## Summary
Creates entities, financial_assets, post_entities (junction), market_analyses,
and ai_analyses tables. These support entity-based news discovery, financial
asset tracking, and AI-generated market impact analysis.

## New Tables

### entities
- Normalized entities: person, company, organization, country, location, financial_asset, other
- slug for URL routing, metadata JSONB for flexible attributes

### financial_assets
- Financial instruments: stock, index, cryptocurrency, commodity, currency, bond, ETF, other
- symbol, exchange, currency, country for market data correlation
- is_active flag; metadata JSONB for extended attributes

### post_entities (junction)
- Many-to-many between posts and entities
- Enables queries: news about a company, person, country, financial asset

### market_analyses
- AI-generated market impact analysis per post (and optionally per asset)
- direction: positive, negative, neutral
- impact_strength: low, medium, high
- confidence_score (0-100)
- time_horizon: short, medium, long
- risks and opportunities as text arrays
- model_name, model_version for auditability
- IMPORTANT: This is analysis, NOT personalized financial advice.
  No Buy/Sell/Hold recommendations.

### ai_analyses
- Generic AI analysis records (news_analyzer, market_impact, translation)
- provider name + JSONB result for flexible storage
- Links to post_id

## Security (RLS)
- entities: public read; editors+ manage
- financial_assets: public read for active; editors+ manage
- post_entities: public read (via published posts); editors+ manage
- market_analyses: public read; editors+ manage
- ai_analyses: public read; editors+ manage

## Indexes
- entities: slug (unique), entity_type
- financial_assets: symbol (unique), asset_type, country
- post_entities: post_id, entity_id, unique(post_id, entity_id)
- market_analyses: post_id, asset_id
- ai_analyses: post_id, analysis_type
*/

-- ============================================================================
-- ENTITY ENUM
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE entity_type AS ENUM ('person', 'company', 'organization', 'country', 'location', 'financial_asset', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE asset_type AS ENUM ('stock', 'index', 'cryptocurrency', 'commodity', 'currency', 'bond', 'etf', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE market_direction AS ENUM ('positive', 'negative', 'neutral');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE impact_strength AS ENUM ('low', 'medium', 'high');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE time_horizon AS ENUM ('short', 'medium', 'long');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE analysis_type AS ENUM ('news_analyzer', 'market_impact', 'translation');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
-- ENTITIES
-- ============================================================================

CREATE TABLE IF NOT EXISTS entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type entity_type NOT NULL,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE entities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "entities_select_public" ON entities;
CREATE POLICY "entities_select_public" ON entities FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "entities_insert_editor" ON entities;
CREATE POLICY "entities_insert_editor" ON entities FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "entities_update_editor" ON entities;
CREATE POLICY "entities_update_editor" ON entities FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin', 'super_admin'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "entities_delete_admin" ON entities;
CREATE POLICY "entities_delete_admin" ON entities FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin'))
  );

CREATE INDEX IF NOT EXISTS idx_entities_slug ON entities(slug);
CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(entity_type);
CREATE INDEX IF NOT EXISTS idx_entities_name ON entities(name);

-- ============================================================================
-- FINANCIAL ASSETS
-- ============================================================================

CREATE TABLE IF NOT EXISTS financial_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol text NOT NULL UNIQUE,
  name text NOT NULL,
  asset_type asset_type NOT NULL DEFAULT 'stock',
  exchange text,
  currency text DEFAULT 'USD',
  country text,
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE financial_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "financial_assets_select_public" ON financial_assets;
CREATE POLICY "financial_assets_select_public" ON financial_assets FOR SELECT
  TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS "financial_assets_select_all_editor" ON financial_assets;
CREATE POLICY "financial_assets_select_all_editor" ON financial_assets FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "financial_assets_insert_editor" ON financial_assets;
CREATE POLICY "financial_assets_insert_editor" ON financial_assets FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "financial_assets_update_editor" ON financial_assets;
CREATE POLICY "financial_assets_update_editor" ON financial_assets FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin', 'super_admin'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "financial_assets_delete_admin" ON financial_assets;
CREATE POLICY "financial_assets_delete_admin" ON financial_assets FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin'))
  );

CREATE INDEX IF NOT EXISTS idx_financial_assets_symbol ON financial_assets(symbol);
CREATE INDEX IF NOT EXISTS idx_financial_assets_type ON financial_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_financial_assets_country ON financial_assets(country);
CREATE INDEX IF NOT EXISTS idx_financial_assets_active ON financial_assets(is_active) WHERE is_active = true;

-- ============================================================================
-- POST_ENTITIES (junction)
-- ============================================================================

CREATE TABLE IF NOT EXISTS post_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  entity_id uuid NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(post_id, entity_id)
);

ALTER TABLE post_entities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "post_entities_select_public" ON post_entities;
CREATE POLICY "post_entities_select_public" ON post_entities FOR SELECT
  TO anon, authenticated USING (
    EXISTS (SELECT 1 FROM posts p WHERE p.id = post_entities.post_id AND p.status = 'published')
  );

DROP POLICY IF EXISTS "post_entities_select_all_editor" ON post_entities;
CREATE POLICY "post_entities_select_all_editor" ON post_entities FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "post_entities_insert_editor" ON post_entities;
CREATE POLICY "post_entities_insert_editor" ON post_entities FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "post_entities_delete_editor" ON post_entities;
CREATE POLICY "post_entities_delete_editor" ON post_entities FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin', 'super_admin'))
  );

CREATE INDEX IF NOT EXISTS idx_post_entities_post ON post_entities(post_id);
CREATE INDEX IF NOT EXISTS idx_post_entities_entity ON post_entities(entity_id);

-- ============================================================================
-- MARKET ANALYSES
-- ============================================================================

CREATE TABLE IF NOT EXISTS market_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  asset_id uuid REFERENCES financial_assets(id) ON DELETE SET NULL,
  direction market_direction NOT NULL DEFAULT 'neutral',
  impact_strength impact_strength NOT NULL DEFAULT 'medium',
  confidence_score integer NOT NULL DEFAULT 50 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  time_horizon time_horizon NOT NULL DEFAULT 'medium',
  summary text,
  risks text[] NOT NULL DEFAULT '{}',
  opportunities text[] NOT NULL DEFAULT '{}',
  model_name text,
  model_version text,
  generated_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE market_analyses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "market_analyses_select_public" ON market_analyses;
CREATE POLICY "market_analyses_select_public" ON market_analyses FOR SELECT
  TO anon, authenticated USING (
    EXISTS (SELECT 1 FROM posts p WHERE p.id = market_analyses.post_id AND p.status = 'published')
  );

DROP POLICY IF EXISTS "market_analyses_select_all_editor" ON market_analyses;
CREATE POLICY "market_analyses_select_all_editor" ON market_analyses FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "market_analyses_insert_editor" ON market_analyses;
CREATE POLICY "market_analyses_insert_editor" ON market_analyses FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "market_analyses_update_editor" ON market_analyses;
CREATE POLICY "market_analyses_update_editor" ON market_analyses FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin', 'super_admin'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "market_analyses_delete_admin" ON market_analyses;
CREATE POLICY "market_analyses_delete_admin" ON market_analyses FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin'))
  );

CREATE INDEX IF NOT EXISTS idx_market_analyses_post ON market_analyses(post_id);
CREATE INDEX IF NOT EXISTS idx_market_analyses_asset ON market_analyses(asset_id);

-- ============================================================================
-- AI ANALYSES
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  analysis_type analysis_type NOT NULL,
  provider text NOT NULL,
  result jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ai_analyses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_analyses_select_public" ON ai_analyses;
CREATE POLICY "ai_analyses_select_public" ON ai_analyses FOR SELECT
  TO anon, authenticated USING (
    EXISTS (SELECT 1 FROM posts p WHERE p.id = ai_analyses.post_id AND p.status = 'published')
  );

DROP POLICY IF EXISTS "ai_analyses_select_all_editor" ON ai_analyses;
CREATE POLICY "ai_analyses_select_all_editor" ON ai_analyses FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "ai_analyses_insert_editor" ON ai_analyses;
CREATE POLICY "ai_analyses_insert_editor" ON ai_analyses FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "ai_analyses_delete_admin" ON ai_analyses;
CREATE POLICY "ai_analyses_delete_admin" ON ai_analyses FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin'))
  );

CREATE INDEX IF NOT EXISTS idx_ai_analyses_post ON ai_analyses(post_id);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_type ON ai_analyses(analysis_type);

-- ============================================================================
-- UPDATED_AT TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS trg_entities_updated_at ON entities;
CREATE TRIGGER trg_entities_updated_at BEFORE UPDATE ON entities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_financial_assets_updated_at ON financial_assets;
CREATE TRIGGER trg_financial_assets_updated_at BEFORE UPDATE ON financial_assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_market_analyses_updated_at ON market_analyses;
CREATE TRIGGER trg_market_analyses_updated_at BEFORE UPDATE ON market_analyses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
