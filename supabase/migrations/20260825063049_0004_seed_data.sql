/*
# NewsIQ Seed Data

## Summary
Inserts minimal development seed data:
- 15 categories matching the existing UI config
- 10 countries
- 3 sources (demo)
- 3 sample posts with English and Persian translations

All data is clearly marked as demo. No real-world breaking news is fabricated
as verified. Sample posts use neutral, clearly fictional content.

## Tables Populated
- categories: world, politics, business, finance, technology, crypto, markets,
  energy, commodities, science, health, climate, sports, travel, culture
- countries: US, GB, DE, FR, JP, CN, IR, BR, IN, AE
- sources: 3 demo sources with varying credibility scores
- posts: 3 demo posts (published)
- post_translations: English + Persian for each post
*/

-- ============================================================================
-- CATEGORIES
-- ============================================================================

INSERT INTO categories (slug, name, description, icon, sort_order, is_active) VALUES
  ('world', 'World News', 'Global news and international affairs', 'Globe2', 1, true),
  ('politics', 'Politics', 'Political news and government policy', 'Landmark', 2, true),
  ('business', 'Business', 'Business and corporate news', 'Briefcase', 3, true),
  ('finance', 'Finance', 'Financial markets and economic analysis', 'DollarSign', 4, true),
  ('technology', 'Technology', 'Tech industry and innovation', 'Cpu', 5, true),
  ('crypto', 'Cryptocurrency', 'Crypto and blockchain news', 'Bitcoin', 6, true),
  ('markets', 'Markets', 'Stock market and trading', 'BarChart3', 7, true),
  ('energy', 'Energy', 'Energy sector news', 'Zap', 8, true),
  ('commodities', 'Commodities', 'Commodity markets', 'Package', 9, true),
  ('science', 'Science', 'Scientific discoveries and research', 'FlaskConical', 10, true),
  ('health', 'Health', 'Health and medical news', 'HeartPulse', 11, true),
  ('climate', 'Climate', 'Climate and environment', 'CloudSun', 12, true),
  ('sports', 'Sports', 'Sports news and results', 'Trophy', 13, true),
  ('travel', 'Travel', 'Travel and tourism', 'Plane', 14, true),
  ('culture', 'Culture', 'Arts, culture, and entertainment', 'Palette', 15, true)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- COUNTRIES
-- ============================================================================

INSERT INTO countries (iso2, iso3, name, native_name, region, continent) VALUES
  ('US', 'USA', 'United States', 'United States', 'North America', 'north_america'),
  ('GB', 'GBR', 'United Kingdom', 'United Kingdom', 'Europe', 'europe'),
  ('DE', 'DEU', 'Germany', 'Deutschland', 'Europe', 'europe'),
  ('FR', 'FRA', 'France', 'France', 'Europe', 'europe'),
  ('JP', 'JPN', 'Japan', '日本', 'Asia', 'asia'),
  ('CN', 'CHN', 'China', '中国', 'Asia', 'asia'),
  ('IR', 'IRN', 'Iran', 'ایران', 'Asia', 'middle_east'),
  ('BR', 'BRA', 'Brazil', 'Brasil', 'South America', 'south_america'),
  ('IN', 'IND', 'India', 'भारत', 'Asia', 'asia'),
  ('AE', 'ARE', 'United Arab Emirates', 'الإمارات العربية المتحدة', 'Middle East', 'middle_east')
ON CONFLICT (iso2) DO NOTHING;

-- ============================================================================
-- SOURCES
-- ============================================================================

INSERT INTO sources (name, domain, url, country, language, source_type, credibility_score, verification_status, is_active) VALUES
  ('Demo News Agency', 'demo-agency.example', 'https://demo-agency.example', 'US', 'en', 'agency', 85, 'verified', true),
  ('Demo Media Outlet', 'demo-media.example', 'https://demo-media.example', 'GB', 'en', 'media', 72, 'verified', true),
  ('Demo Community Reports', 'demo-community.example', 'https://demo-community.example', 'US', 'en', 'community', 45, 'under_review', true)
ON CONFLICT (domain) DO NOTHING;

-- ============================================================================
-- SAMPLE POSTS
-- ============================================================================

DO $$
DECLARE
  v_cat_tech uuid;
  v_cat_finance uuid;
  v_cat_world uuid;
  v_source_agency uuid;
  v_source_media uuid;
  v_post1 uuid;
  v_post2 uuid;
  v_post3 uuid;
BEGIN
  SELECT id INTO v_cat_tech FROM categories WHERE slug = 'technology';
  SELECT id INTO v_cat_finance FROM categories WHERE slug = 'finance';
  SELECT id INTO v_cat_world FROM categories WHERE slug = 'world';
  SELECT id INTO v_source_agency FROM sources WHERE domain = 'demo-agency.example';
  SELECT id INTO v_source_media FROM sources WHERE domain = 'demo-media.example';

  -- Post 1: Technology demo
  INSERT INTO posts (
    slug, title, summary, content, source_id, category_id,
    verification_status, importance, content_type, status,
    original_locale, source_url, country, continent,
    entities, financial_assets, hashtags, published_at
  ) VALUES (
    'demo-tech-innovation-summit-2025',
    'Demo: Global Tech Innovation Summit Announces Breakthrough',
    'A demo article about a fictional technology summit showcasing AI and quantum computing advances.',
    'This is a demo article for development purposes. It describes a fictional technology innovation summit where leading researchers presented advances in artificial intelligence and quantum computing. No real events are depicted.',
    v_source_agency, v_cat_tech,
    'verified', 'high', 'news', 'published',
    'en', 'https://demo-agency.example/tech-summit', 'US', 'north_america',
    ARRAY['AI', 'Quantum Computing'], ARRAY['bitcoin'], ARRAY['technology', 'AI', 'innovation'],
    now() - interval '2 hours'
  ) RETURNING id INTO v_post1;

  INSERT INTO post_translations (post_id, locale, title, summary, content, slug, seo_title, seo_description, translation_status, is_original) VALUES
    (v_post1, 'en',
     'Demo: Global Tech Innovation Summit Announces Breakthrough',
     'A demo article about a fictional technology summit showcasing AI and quantum computing advances.',
     'This is a demo article for development purposes. It describes a fictional technology innovation summit where leading researchers presented advances in artificial intelligence and quantum computing. No real events are depicted.',
     'demo-tech-innovation-summit-2025',
     'Demo: Tech Innovation Summit 2025',
     'A demo article about a fictional technology summit.',
     'published', true),
    (v_post1, 'fa',
     'دمو: اجلاس نوآوری فناوری جهانی دستاوردهای جدید را اعلام می‌کند',
     'یک مقاله دمو درباره یک اجلاس تخیلی فناوری که دستاوردهای هوش مصنوعی و محاسبات کوانتومی را به نمایش می‌گذارد.',
     'این یک مقاله دمو برای اهداف توسعه است. این مقاله یک اجلاس تخیلی نوآوری فناوری را توصیف می‌کند که در آن پژوهشگران برجسته پیشرفت‌هایی در هوش مصنوعی و محاسبات کوانتومی ارائه کردند. هیچ رویداد واقعی به تصویر کشیده نشده است.',
     'demo-tech-innovation-summit-2025',
     'دمو: اجلاس نوآوری فناوری ۲۰۲۵',
     'یک مقاله دمو درباره یک اجلاس تخیلی فناوری.',
     'published', false)
  ON CONFLICT (post_id, locale) DO NOTHING;

  -- Post 2: Finance demo (breaking)
  INSERT INTO posts (
    slug, title, summary, content, source_id, category_id,
    verification_status, importance, content_type, status,
    original_locale, source_url, country, continent,
    entities, financial_assets, hashtags, published_at
  ) VALUES (
    'demo-central-bank-policy-update',
    'Demo: Central Bank Announces New Monetary Policy Framework',
    'A demo breaking article about a fictional central bank policy change.',
    'This is a demo article for development purposes. It describes a fictional central bank announcing a new monetary policy framework. No real policy changes are depicted.',
    v_source_agency, v_cat_finance,
    'developing', 'breaking', 'breaking', 'published',
    'en', 'https://demo-agency.example/central-bank', 'US', 'north_america',
    ARRAY['Central Bank'], ARRAY['gold', 'oil', 'forex'], ARRAY['finance', 'monetary-policy', 'central-bank'],
    now() - interval '30 minutes'
  ) RETURNING id INTO v_post2;

  INSERT INTO post_translations (post_id, locale, title, summary, content, slug, seo_title, seo_description, translation_status, is_original) VALUES
    (v_post2, 'en',
     'Demo: Central Bank Announces New Monetary Policy Framework',
     'A demo breaking article about a fictional central bank policy change.',
     'This is a demo article for development purposes. It describes a fictional central bank announcing a new monetary policy framework. No real policy changes are depicted.',
     'demo-central-bank-policy-update',
     'Demo: Central Bank Policy Update',
     'A demo breaking article about a fictional central bank policy change.',
     'published', true),
    (v_post2, 'fa',
     'دمو: بانک مرکزی چارچوب جدید سیاست پولی را اعلام کرد',
     'یک مقاله دمو و در حال توسعه درباره یک تغییر سیاست تخیلی بانک مرکزی.',
     'این یک مقاله دمو برای اهداف توسعه است. این مقاله یک بانک مرکزی تخیلی را توصیف می‌کند که چارچوب جدید سیاست پولی را اعلام می‌کند. هیچ تغییر سیاست واقعی به تصویر کشیده نشده است.',
     'demo-central-bank-policy-update',
     'دمو: به‌روزرسانی سیاست بانک مرکزی',
     'یک مقاله دمو و در حال توسعه درباره یک تغییر سیاست تخیلی بانک مرکزی.',
     'published', false)
  ON CONFLICT (post_id, locale) DO NOTHING;

  -- Post 3: World news demo
  INSERT INTO posts (
    slug, title, summary, content, source_id, category_id,
    verification_status, importance, content_type, status,
    original_locale, source_url, country, continent,
    entities, financial_assets, hashtags, published_at
  ) VALUES (
    'demo-international-climate-agreement',
    'Demo: Nations Sign New Climate Cooperation Agreement',
    'A demo article about a fictional international climate agreement.',
    'This is a demo article for development purposes. It describes a fictional international climate cooperation agreement signed by multiple nations. No real agreements are depicted.',
    v_source_media, v_cat_world,
    'likely', 'medium', 'news', 'published',
    'en', 'https://demo-media.example/climate-agreement', 'FR', 'europe',
    ARRAY['UN', 'Climate'], ARRAY['natural_gas'], ARRAY['world', 'climate', 'cooperation'],
    now() - interval '1 day'
  ) RETURNING id INTO v_post3;

  INSERT INTO post_translations (post_id, locale, title, summary, content, slug, seo_title, seo_description, translation_status, is_original) VALUES
    (v_post3, 'en',
     'Demo: Nations Sign New Climate Cooperation Agreement',
     'A demo article about a fictional international climate agreement.',
     'This is a demo article for development purposes. It describes a fictional international climate cooperation agreement signed by multiple nations. No real agreements are depicted.',
     'demo-international-climate-agreement',
     'Demo: Climate Cooperation Agreement',
     'A demo article about a fictional international climate agreement.',
     'published', true),
    (v_post3, 'fa',
     'دمو: کشورها توافق‌نامه جدید همکاری اقلیمی را امضا کردند',
     'یک مقاله دمو درباره یک توافق‌نامه تخیلی اقلیمی بین‌المللی.',
     'این یک مقاله دمو برای اهداف توسعه است. این مقاله یک توافق‌نامه تخیلی همکاری اقلیمی بین‌المللی را توصیف می‌کند که توسط چندین کشور امضا شده است. هیچ توافق‌نامه واقعی به تصویر کشیده نشده است.',
     'demo-international-climate-agreement',
     'دمو: توافق‌نامه همکاری اقلیمی',
     'یک مقاله دمو درباره یک توافق‌نامه تخیلی اقلیمی بین‌المللی.',
     'published', false)
  ON CONFLICT (post_id, locale) DO NOTHING;
END $$;
