export const NEWS_CATEGORIES = ['Disaster', 'Markets', 'Geopolitics', 'Technology'] as const
export type NewsCategory = (typeof NEWS_CATEGORIES)[number]

export const PUBLICATION_STATES = ['draft', 'published', 'archived'] as const
export type PublicationState = (typeof PUBLICATION_STATES)[number]

export const USER_ROLES = ['visitor', 'registered', 'pro', 'editor', 'admin', 'super-admin'] as const
export type UserRole = (typeof USER_ROLES)[number]

export type Source = { id: string; name: string; url?: string; reliabilityScore?: number }
export type Entity = { id: string; name: string; type: 'company' | 'country' | 'commodity' | 'currency' | 'index' | 'person' | 'other' }
export type PostTranslation = { locale: string; headline: string; summary: string; content: string; slug: string; seoTitle?: string; seoDescription?: string }
export type Post = { id: string; canonicalSlug: string; category: NewsCategory; state: PublicationState; source: Source; entities: Entity[]; publishedAt?: string; createdAt: string; updatedAt: string; translations: PostTranslation[] }
export type MarketAsset = { symbol: string; name: string; assetClass: 'equity' | 'currency' | 'commodity' | 'crypto' | 'index'; price: number; changePercent: number; asOf: string }
export type PersistedAnalysis = { id: string; postId: string; model: string; version: string; generatedAt: string; impactSummary: string; confidence: number; riskFlags: string[] }

export interface PostRepository { listPublished(locale?: string): Promise<Post[]>; getBySlug(slug: string, locale?: string): Promise<Post | null> }
export interface TranslationRepository { get(postId: string, locale: string): Promise<PostTranslation | null> }
export interface NewsAnalysisService { analyze(post: Post): Promise<PersistedAnalysis> }
export interface TranslatorService { translate(post: Post, locale: string): Promise<PostTranslation> }
export interface SourceEnrichmentService { enrich(source: Source): Promise<Source> }

export type AuthorizationContext = { userId?: string; role: UserRole }
export function canManagePosts(context: AuthorizationContext) { return ['editor', 'admin', 'super-admin'].includes(context.role) }
export function canManageUsers(context: AuthorizationContext) { return ['admin', 'super-admin'].includes(context.role) }
export function canChangeSystemSettings(context: AuthorizationContext) { return context.role === 'super-admin' }

export type SeoDocument = { title: string; description: string; canonical: string; locale: string; alternates: Record<string, string>; type: 'website' | 'article' }
export type ArticleStructuredData = { '@context': 'https://schema.org'; '@type': 'NewsArticle'; headline: string; datePublished?: string; dateModified?: string; url: string; inLanguage: string }
export type PageResult<T> = { items: T[]; nextCursor?: string; hasMore: boolean }
export type PageRequest = { cursor?: string; limit?: number }
export type ValidationResult<T> = { success: true; data: T } | { success: false; errors: string[] }
export type NewsletterSignup = { email: string }
export type CheckoutPlan = 'pro-monthly' | 'pro-yearly'
export type IntegrationName = 'supabase' | 'stripe' | 'ai-gateway'

export const supportedLocales = ['en', 'zh', 'es', 'fr', 'de', 'ja', 'ko', 'tr', 'ar', 'pt-BR', 'id', 'ms', 'fa', 'hi', 'ru'] as const
export type SupportedLocale = (typeof supportedLocales)[number]
export type LocaleDirection = 'ltr' | 'rtl'
export type LocaleDefinition = { code: SupportedLocale; tag: string; name: string; nativeName: string; direction: LocaleDirection; default?: boolean }

export const localeDefinitions: readonly LocaleDefinition[] = [
  { code: 'en', tag: 'en-US', name: 'English', nativeName: 'English', direction: 'ltr', default: true },
  { code: 'zh', tag: 'zh-CN', name: 'Chinese', nativeName: '中文', direction: 'ltr' },
  { code: 'es', tag: 'es-ES', name: 'Spanish', nativeName: 'Español', direction: 'ltr' },
  { code: 'fr', tag: 'fr-FR', name: 'French', nativeName: 'Français', direction: 'ltr' },
  { code: 'de', tag: 'de-DE', name: 'German', nativeName: 'Deutsch', direction: 'ltr' },
  { code: 'ja', tag: 'ja-JP', name: 'Japanese', nativeName: '日本語', direction: 'ltr' },
  { code: 'ko', tag: 'ko-KR', name: 'Korean', nativeName: '한국어', direction: 'ltr' },
  { code: 'tr', tag: 'tr-TR', name: 'Turkish', nativeName: 'Türkçe', direction: 'ltr' },
  { code: 'ar', tag: 'ar', name: 'Arabic', nativeName: 'العربية', direction: 'rtl' },
  { code: 'pt-BR', tag: 'pt-BR', name: 'Portuguese', nativeName: 'Português', direction: 'ltr' },
  { code: 'id', tag: 'id-ID', name: 'Indonesian', nativeName: 'Bahasa Indonesia', direction: 'ltr' },
  { code: 'ms', tag: 'ms-MY', name: 'Malay', nativeName: 'Bahasa Melayu', direction: 'ltr' },
  { code: 'fa', tag: 'fa-IR', name: 'Persian', nativeName: 'فارسی', direction: 'rtl' },
  { code: 'hi', tag: 'hi-IN', name: 'Hindi', nativeName: 'हिन्दी', direction: 'ltr' },
  { code: 'ru', tag: 'ru-RU', name: 'Russian', nativeName: 'Русский', direction: 'ltr' },
] as const

export const defaultLocale: SupportedLocale = 'en'
export function getLocaleDefinition(locale: string) { return localeDefinitions.find((item) => item.code === locale) ?? localeDefinitions[0] }
export function isSupportedLocale(locale: string): locale is SupportedLocale { return supportedLocales.includes(locale as SupportedLocale) }
export function localeDirection(locale: string): LocaleDirection { return getLocaleDefinition(locale).direction }
export function localizedPath(path: string, locale: SupportedLocale = defaultLocale) { const normalized = path.startsWith('/') ? path : `/${path}`; return locale === defaultLocale ? normalized : `/${locale}${normalized === '/' ? '' : normalized}` }

export const baseUrl = 'https://newsiq.top'
export function absoluteUrl(path: string) { return new URL(path.startsWith('/') ? path : `/${path}`, baseUrl).toString() }
export function buildHreflang(path: string) { return Object.fromEntries(localeDefinitions.map((locale) => [locale.tag, absoluteUrl(localizedPath(path, locale.code))])) }
export function buildCanonical(path: string) { return absoluteUrl(path) }
export function buildArticleStructuredData(post: Pick<Post, 'canonicalSlug' | 'publishedAt' | 'updatedAt'>, translation: Pick<PostTranslation, 'headline' | 'locale'>): ArticleStructuredData { return { '@context': 'https://schema.org', '@type': 'NewsArticle', headline: translation.headline, datePublished: post.publishedAt, dateModified: post.updatedAt, url: absoluteUrl(`/news/${post.canonicalSlug}`), inLanguage: getLocaleDefinition(translation.locale).tag } }

export function validateNewsletterSignup(input: unknown): ValidationResult<NewsletterSignup> { if (!input || typeof input !== 'object' || typeof (input as { email?: unknown }).email !== 'string') return { success: false, errors: ['Email is required.'] }; const email = (input as { email: string }).email.trim().toLowerCase(); return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? { success: true, data: { email } } : { success: false, errors: ['Enter a valid email address.'] } }
export function normalizeLimit(limit?: number) { return Math.min(Math.max(Math.floor(limit ?? 20), 1), 100) }
export function encodeCursor(value: string) { return Buffer.from(value, 'utf8').toString('base64url') }
export function decodeCursor(value?: string) { if (!value) return undefined; try { return Buffer.from(value, 'base64url').toString('utf8') } catch { return undefined } }

export type AppErrorCode = 'VALIDATION_ERROR' | 'NOT_FOUND' | 'UNAUTHORIZED' | 'INTEGRATION_UNAVAILABLE' | 'INTERNAL_ERROR'
export class AppError extends Error { constructor(public readonly code: AppErrorCode, message: string, public readonly cause?: unknown) { super(message); this.name = 'AppError' } }
export function logEvent(event: string, metadata?: Record<string, unknown>) { if (process.env.NODE_ENV !== 'production') console.info(`[newsiq] ${event}`, metadata ?? {}) }

export const integrationStatus = { supabase: 'not-configured', stripe: 'configured-for-checkout-route', 'ai-gateway': 'not-configured' } as const
export function requirePublicSupabaseConfig() { const url = process.env.NEXT_PUBLIC_SUPABASE_URL; if (!url) throw new AppError('INTEGRATION_UNAVAILABLE', 'Supabase is not configured.'); return { url } }

export const staticPostRepository: PostRepository = { async listPublished() { return [] }, async getBySlug() { return null } }
export const unavailableAnalysisService: NewsAnalysisService = { async analyze() { throw new AppError('INTEGRATION_UNAVAILABLE', 'AI analysis is not configured.') } }
export const unavailableTranslatorService: TranslatorService = { async translate() { throw new AppError('INTEGRATION_UNAVAILABLE', 'Translation is not configured.') } }
export const unavailableSourceEnrichmentService: SourceEnrichmentService = { async enrich() { throw new AppError('INTEGRATION_UNAVAILABLE', 'Source enrichment is not configured.') } }

export const phaseOneBoundaries = { database: 'contracts-only', auth: 'contracts-only', ai: 'interfaces-only', payments: 'existing-checkout-route', localization: 'registry-and-helpers', seo: 'shared-helpers' } as const
export const securityRules = ['Never expose service_role or secret keys to the browser.', 'Client role checks are not authorization.', 'Every future public table needs RLS and explicit Data API grants.', 'AI results must be persisted during publication, never generated per public request.'] as const
export const futureSupabaseTables = ['posts', 'post_translations', 'sources', 'entities', 'post_entities', 'market_assets', 'persisted_analyses'] as const
export const futurePhaseTwo = ['Reconnect one deliberate Supabase project and verify its ref.', 'Apply reviewed schema and RLS through the approved workflow.', 'Implement editor publishing, localized routes, storage, and persisted AI jobs.'] as const
export const supportedIntegrationEnv = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'STRIPE_SECRET_KEY', 'STRIPE_PUBLISHABLE_KEY', 'AI_GATEWAY_API_KEY'] as const

export function safeParseJson<T>(value: string, fallback: T): T { try { return JSON.parse(value) as T } catch { return fallback } }
export function createRequestId() { return crypto.randomUUID() }
export function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null }
export function toErrorMessage(error: unknown) { return error instanceof Error ? error.message : 'Unexpected error.' }
export function redactSecrets(metadata: Record<string, unknown>) { return Object.fromEntries(Object.entries(metadata).map(([key, value]) => /key|secret|token|password/i.test(key) ? [key, '[REDACTED]'] : [key, value])) }
export function getPublicConfig() { return { supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? null } }
export function getServerConfig() { return { stripeSecretConfigured: Boolean(process.env.STRIPE_SECRET_KEY), aiConfigured: Boolean(process.env.AI_GATEWAY_API_KEY) } }
export function mapStaticNewsItem(item: { id: string; category: NewsCategory; headline: string; summary: string; source: string; time: string; locked?: boolean }): Post { return { id: item.id, canonicalSlug: item.id, category: item.category, state: 'published', source: { id: item.source, name: item.source }, entities: [], publishedAt: undefined, createdAt: new Date(0).toISOString(), updatedAt: new Date(0).toISOString(), translations: [{ locale: 'en', headline: item.headline, summary: item.summary, content: item.summary, slug: item.id }] } }

export function buildMetadata(title: string, description: string, path = '/') { return { title, description, alternates: { canonical: buildCanonical(path), languages: buildHreflang(path) }, openGraph: { title, description, url: buildCanonical(path), type: 'website' as const } } }
export function buildArticleMetadata(post: Post, translation: PostTranslation) { return { title: translation.seoTitle ?? translation.headline, description: translation.seoDescription ?? translation.summary, alternates: { canonical: buildCanonical(`/news/${post.canonicalSlug}`), languages: buildHreflang(`/news/${post.canonicalSlug}`) }, openGraph: { title: translation.headline, description: translation.summary, url: buildCanonical(`/news/${post.canonicalSlug}`), type: 'article' as const } } }
export function getLocaleFromPath(pathname: string): SupportedLocale { const segment = pathname.split('/').filter(Boolean)[0]; return segment && isSupportedLocale(segment) ? segment : defaultLocale }
export function stripLocale(pathname: string) { const locale = getLocaleFromPath(pathname); return locale === defaultLocale ? pathname : pathname.replace(`/${locale}`, '') || '/' }
export function requireRole(context: AuthorizationContext, roles: readonly UserRole[]) { if (!roles.includes(context.role)) throw new AppError('UNAUTHORIZED', 'You do not have permission to perform this action.') }
export function hasConfiguredSupabaseKey() { return Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) }
export const appName = 'NEWSiQ'
export const appDescription = 'Global news and financial intelligence with concise context and market impact signals.'
export const primaryRoutes = ['/', '/markets', '/subscribe', '/about', '/terms'] as const
export const publicContentPolicy = 'Static preview content is intentionally non-authoritative until verified sources and publication workflows are connected.'
export const noLiveDatabaseNotice = 'No live Supabase database is assumed in Phase 1.'
export const localeTags = Object.fromEntries(localeDefinitions.map((locale) => [locale.code, locale.tag])) as Record<SupportedLocale, string>
export const rtlLocales = localeDefinitions.filter((locale) => locale.direction === 'rtl').map((locale) => locale.code)
export const ltrLocales = localeDefinitions.filter((locale) => locale.direction === 'ltr').map((locale) => locale.code)
export type AppRoute = (typeof primaryRoutes)[number]
export type NewsFilter = 'Live feed' | NewsCategory
export type SortOrder = 'newest' | 'oldest' | 'relevance'
export type SearchParams = { q?: string; category?: NewsCategory; locale?: SupportedLocale; cursor?: string; limit?: string }
export const defaultPageSize = 20
export const maxPageSize = 100
export const productTiers = [{ id: 'free', label: 'Free' }, { id: 'pro', label: 'Pro' }] as const
export const roleHierarchy: Record<UserRole, number> = { visitor: 0, registered: 1, pro: 2, editor: 3, admin: 4, 'super-admin': 5 }
export function isAtLeastRole(role: UserRole, minimum: UserRole) { return roleHierarchy[role] >= roleHierarchy[minimum] }
export const analysisStates = ['queued', 'processing', 'complete', 'failed'] as const
export type AnalysisState = (typeof analysisStates)[number]
export const contentStates = PUBLICATION_STATES
export type ContentState = PublicationState
export type HealthStatus = { ok: boolean; database: 'connected' | 'not-configured' | 'unknown'; timestamp: string }
export function getHealthStatus(): HealthStatus { return { ok: true, database: hasConfiguredSupabaseKey() ? 'unknown' : 'not-configured', timestamp: new Date().toISOString() } }
export const defaultSeoImage = '/og-image.png'
export function normalizePath(path: string) { return `/${path.replace(/^\/+/, '').replace(/\/+$/, '')}` || '/' }
export function toSlug(value: string) { return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') }
export function isValidSlug(value: string) { return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) }
export function clampConfidence(value: number) { return Math.min(Math.max(value, 0), 1) }
export function parseBoolean(value: string | undefined) { return value === 'true' }
export const contentDisclaimer = 'Contextual analysis is informational and not financial advice.'
export const version = 'phase-1-foundation'
export type Nullable<T> = T | null
export type MaybePromise<T> = T | Promise<T>
export type AsyncFactory<T> = () => Promise<T>
export type Id = string
export type ISODate = string
export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }
export type JsonObject = { [key: string]: JsonValue }
export type ApiResponse<T> = { data: T; requestId: string } | { error: { code: AppErrorCode; message: string }; requestId: string }
export function ok<T>(data: T, requestId = createRequestId()): ApiResponse<T> { return { data, requestId } }
export function fail(code: AppErrorCode, message: string, requestId = createRequestId()): ApiResponse<never> { return { error: { code, message }, requestId } }
export const isPhaseOne = true
export const futureLocaleRoutePattern = '/:locale/*'
export const dataAccessRule = 'Use repositories from server modules; never query a database directly from presentation components.'
export const aiAccessRule = 'Run analysis on publication jobs and persist results; do not call AI from public page rendering.'
export const authAccessRule = 'Authorize on the server using trusted session claims and database-backed roles.'
export const integrationAccessRule = 'Keep external SDK calls behind lib/integrations adapters.'
export const seoAccessRule = 'One canonical post identity with locale alternates; avoid duplicate localized content URLs.'
export const buildInfo = { name: appName, version, routes: primaryRoutes, locales: supportedLocales.length }
export function isNonEmptyString(value: unknown): value is string { return typeof value === 'string' && value.trim().length > 0 }
export function assertNonEmpty(value: unknown, field: string): asserts value is string { if (!isNonEmptyString(value)) throw new AppError('VALIDATION_ERROR', `${field} is required.`) }
export function safeUrl(value: string) { try { return new URL(value) } catch { return null } }
export const forbiddenClientEnvPrefixes = ['SUPABASE_SERVICE_ROLE', 'STRIPE_SECRET', 'AI_GATEWAY_API_KEY'] as const
export const folderBoundaries = { presentation: 'app/ and components/', application: 'features/ and use-cases/', data: 'lib/*/repositories', integrations: 'lib/integrations/', shared: 'types/ and lib/config/' } as const
export const documentationIndex = ['docs/architecture.md', 'docs/environment.md', 'docs/security.md', 'docs/i18n-seo.md'] as const
export const migrationNote = 'Phase 2 should replace staticPostRepository with a server-only Supabase repository after one project is explicitly reconnected.'
export const buildStamp = '2026-08-22'
export const supportedAssetClasses = ['equity', 'currency', 'commodity', 'crypto', 'index'] as const
export const supportedEntityTypes = ['company', 'country', 'commodity', 'currency', 'index', 'person', 'other'] as const
export function isSupportedAssetClass(value: string): value is (typeof supportedAssetClasses)[number] { return supportedAssetClasses.includes(value as never) }
export function isSupportedEntityType(value: string): value is (typeof supportedEntityTypes)[number] { return supportedEntityTypes.includes(value as never) }
export const defaultAnalysisModel = 'unconfigured'
export const defaultSourceReliability = 0.5
export const defaultCurrency = 'USD'
export const defaultTimezone = 'UTC'
export const currentPhase = 1 as const
export const nextPhase = 2 as const
export const phaseOneComplete = false
export const databaseRequiredForPublishing = true
export const staticPreviewAllowed = true
export const externalSecretsNeverLogged = true
export const browserSafeConfigKeys = ['NEXT_PUBLIC_SUPABASE_URL'] as const
export const serverOnlyConfigKeys = ['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'STRIPE_SECRET_KEY', 'AI_GATEWAY_API_KEY'] as const
export function getDefaultLocale() { return localeDefinitions.find((locale) => locale.default) ?? localeDefinitions[0] }
export const defaultLocaleDefinition = getDefaultLocale()
export const primaryBrand = 'NEWSiQ'
export const dataRetentionPolicy = 'Retain only necessary publication, audit, and consent records; define deletion workflows before production launch.'
export const observabilityPolicy = 'Log request IDs and event names; redact tokens, keys, passwords, and personal data.'
export const accessibilityPolicy = 'Use semantic landmarks, labels, keyboard focus, contrast, and locale-aware direction.'
export const qualityGate = ['typecheck', 'build', 'lint', 'preview smoke test'] as const
export function isProduction() { return process.env.NODE_ENV === 'production' }
export function isDevelopment() { return process.env.NODE_ENV !== 'production' }
export const repoName = 'newsiq-landing'
export const canonicalDomain = 'newsiq.top'
export const canonicalOrigin = `https://${canonicalDomain}`
export const contactPath = '/about'
export const feedPath = '/feed.xml'
export const robotsPath = '/robots.txt'
export const sitemapPath = '/sitemap.xml'
export const phaseOneSummary = 'Maintainable contracts and boundaries while preserving the static public experience.'
export const phaseTwoSummary = 'Reconnect Supabase, apply reviewed schema/RLS, and implement persisted editorial workflows.'
export function normalizeEmail(email: string) { return email.trim().toLowerCase() }
export function getLocaleTag(locale: string) { return getLocaleDefinition(locale).tag }
export function getLocaleName(locale: string) { return getLocaleDefinition(locale).nativeName }
export function getLocaleCodeFromTag(tag: string) { return localeDefinitions.find((locale) => locale.tag === tag)?.code ?? defaultLocale }
export const allLocaleCodes = [...supportedLocales]
export const allLocaleTags = localeDefinitions.map((locale) => locale.tag)
export const allRoutes = [...primaryRoutes, '/live', '/admin']
export function isPublicRoute(pathname: string) { return primaryRoutes.includes(pathname as AppRoute) || pathname === '/live' }
export function isAdminRoute(pathname: string) { return pathname === '/admin' || pathname.startsWith('/admin/') }
export const publicApiPolicy = 'Public APIs should return stable envelopes with request IDs and typed error codes.'
export const noDatabaseFallback = 'When no database is configured, use static preview data and display honest status messaging.'
export function createPageResult<T>(items: T[], nextCursor?: string): PageResult<T> { return { items, nextCursor, hasMore: Boolean(nextCursor) } }
export const emptyPageResult = <T,>(): PageResult<T> => ({ items: [], hasMore: false })
export const timestamp = () => new Date().toISOString()
export function omitUndefined<T extends Record<string, unknown>>(object: T) { return Object.fromEntries(Object.entries(object).filter(([, value]) => value !== undefined)) as Partial<T> }
export const schemaVersion = 1
export const apiVersion = 'v1'
export const supportedApiVersions = ['v1'] as const
export const localeFallbackChain = ['en'] as const
export function fallbackLocale() { return defaultLocale }
export const maxHeadlineLength = 240
export const maxSummaryLength = 1000
export const maxContentLength = 100000
export function truncate(value: string, max: number) { return value.length <= max ? value : `${value.slice(0, max - 1)}…` }
export const legalDisclaimer = 'NEWSiQ provides informational context, not investment, legal, or emergency advice.'
export const accessibilityLocaleNote = 'Direction is derived from locale metadata rather than user input.'
export const releaseChannel = 'preview'
export const featureFlags = { liveDatabase: false, editorialWorkflow: false, aiAnalysis: false, localizedRoutes: false } as const
export type FeatureFlags = typeof featureFlags
export const changelogEntry = { version, date: buildStamp, summary: phaseOneSummary }
export const END_OF_FOUNDATION_CONTRACTS = true
// This file is intentionally the stable contract surface for Phase 1. Keep provider SDKs out of it.

import { newsItems } from '../lib/news/data'
export type { NewsItem } from '../lib/news/types'
export { newsItems }
export const staticNewsPosts = newsItems.map(mapStaticNewsItem)
export const staticPostRepositoryWithPreview: PostRepository = { async listPublished(locale = 'en') { return staticNewsPosts.map((post) => ({ ...post, translations: post.translations.filter((translation) => translation.locale === locale || locale === 'en') })) }, async getBySlug(slug, locale = 'en') { return (await this.listPublished(locale)).find((post) => post.canonicalSlug === slug) ?? null } }
export const postRepository = staticPostRepositoryWithPreview
export const newsRepository = postRepository
export const analysisService = unavailableAnalysisService
export const translatorService = unavailableTranslatorService
export const sourceEnrichmentService = unavailableSourceEnrichmentService
export const staticAdapterNotice = 'Static adapter active: Supabase is intentionally not assumed in Phase 1.'
export const configNotice = 'Configuration helpers distinguish public URL metadata from server-only credentials.'
export const seoNotice = 'SEO helpers generate one canonical identity with locale alternates.'
export const authNotice = 'Authorization contracts are not an active authentication system.'
export const aiNotice = 'AI interfaces are seams only; no provider call is made.'
export const finalContractMarker = 'NEWSIQ_FOUNDATION_READY'
export default { appName, version, supportedLocales, primaryRoutes, phaseOneBoundaries }

// Compatibility aliases for early consumers.
export type PostStatus = PublicationState
export type Role = UserRole
export type Locale = SupportedLocale
export const locales = localeDefinitions
export const roles = USER_ROLES
export const categories = NEWS_CATEGORIES
export function isRole(value: string): value is UserRole { return USER_ROLES.includes(value as UserRole) }
export function isCategory(value: string): value is NewsCategory { return NEWS_CATEGORIES.includes(value as NewsCategory) }
export const defaultSeo = { title: appName, description: appDescription }
export const runtimeConfig = { public: getPublicConfig(), server: getServerConfig() }
export const routeConfig = { primaryRoutes, allRoutes }
export const securityConfig = { rules: securityRules, neverLogSecrets: externalSecretsNeverLogged }
export const localeConfig = { definitions: localeDefinitions, default: defaultLocale, rtl: rtlLocales }
export const repositoryConfig = { posts: postRepository }
export const serviceConfig = { analysis: analysisService, translation: translatorService, enrichment: sourceEnrichmentService }
export const foundationConfig = { version, phase: currentPhase, database: phaseOneBoundaries.database }
export const __private = { normalizeEmail, truncate, timestamp }

export function getTranslation(post: Post, locale: string) { return post.translations.find((translation) => translation.locale === locale) ?? post.translations[0] }
export function getLocalizedPostUrl(post: Pick<Post, 'canonicalSlug'>, locale: SupportedLocale = defaultLocale) { return localizedPath(`/news/${post.canonicalSlug}`, locale) }
export function getPostCanonicalUrl(post: Pick<Post, 'canonicalSlug'>) { return absoluteUrl(`/news/${post.canonicalSlug}`) }
export function getPostAlternates(post: Pick<Post, 'canonicalSlug'>) { return buildHreflang(`/news/${post.canonicalSlug}`) }
export function getStructuredData(post: Post, locale = defaultLocale) { const translation = getTranslation(post, locale); return buildArticleStructuredData(post, translation) }
export function serializePublicPost(post: Post, locale = defaultLocale) { const translation = getTranslation(post, locale); return { id: post.id, slug: post.canonicalSlug, category: post.category, headline: translation.headline, summary: translation.summary, source: post.source.name, publishedAt: post.publishedAt } }
export function assertPublicPost(post: Post | null): asserts post is Post { if (!post || post.state !== 'published') throw new AppError('NOT_FOUND', 'Post not found.') }
export function getRoleLabel(role: UserRole) { return role.replace('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) }
export const publicRoles = ['visitor', 'registered', 'pro'] as const
export const editorialRoles = ['editor', 'admin', 'super-admin'] as const
export const administratorRoles = ['admin', 'super-admin'] as const
export const superAdministratorRoles = ['super-admin'] as const
export const phaseTwoRequiredEnv = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'] as const
export const phaseTwoRequiredTables = futureSupabaseTables
export const foundationContractCount = Object.keys(foundationConfig).length
export const generatedAt = buildStamp
export const sourceOfTruth = 'types/domain.ts'
export const implementationStatus = 'approved-foundation'
export const noDestructiveExternalActions = true
export const preserveRootRoutes = true
export const preserveStaticPreview = true
export const useServerRepositories = true
export const usePersistedAiResults = true
export const useRls = true
export const useTrustedRoleClaims = true
export const useCanonicalSeo = true
export const useLocaleRegistry = true
export const useTypedErrors = true
export const useRedactedLogging = true
export const usePagination = true
export const useValidation = true
export const foundationReady = true
export const END = true

export type FoundationMarker = typeof finalContractMarker
export type FoundationStatus = { ready: boolean; version: string; phase: number }
export function getFoundationStatus(): FoundationStatus { return { ready: foundationReady, version, phase: currentPhase } }
export const foundationStatus = getFoundationStatus()
export const contractSummary = { domains: ['posts', 'translations', 'markets', 'seo', 'auth', 'analysis'], boundaries: folderBoundaries, status: foundationStatus }
export const sourceReliabilityRange = { min: 0, max: 1 }
export const confidenceRange = sourceReliabilityRange
export const validEmailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const maxCursorLength = 512
export const defaultLocaleTag = defaultLocaleDefinition.tag
export const defaultDirection = defaultLocaleDefinition.direction
export const staticDataMode = true
export const databaseMode = 'disabled-until-reconnected' as const
export const aiMode = 'interfaces-only' as const
export const authMode = 'contracts-only' as const
export const paymentMode = 'existing-route-only' as const
export const seoMode = 'shared-primitives' as const
export const i18nMode = 'registry-only' as const
export const endOfFile = true
