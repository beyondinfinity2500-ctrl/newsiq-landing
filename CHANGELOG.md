# Changelog

All notable changes to NewsIQ are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/) and dates are ISO 8601
(YYYY-MM-DD).

## 2026-09-04 — Production incident fix

### Issue
- `https://newsiq.top/` redirected to `/en` as expected, but `/en`
  produced a Next.js production "Application error: a client-side
  exception has occurred" overlay.
- The HTML rendered correctly on the server (200 OK, 3 demo news
  cards visible in the static markup), but the browser could not
  hydrate because the JavaScript chunks referenced from the RSC
  payload were not reachable on the Vercel CDN (404 for several
  `/_next/static/chunks/*.js` files, including the Supabase client
  bundle).

### Root cause
- Vercel was serving a stale deployment. The HTML's
  `next-flight-data` payload referenced a `b:` (buildId) that
  corresponded to a previous commit, and several of the chunks
  emitted during that older build were no longer being served by
  the CDN. Without those chunks, the browser could not execute the
  client React tree, so React's root error boundary surfaced the
  generic Next.js "Application error" message.

### Fix
- A new commit is pushed to `main` to force Vercel to rebuild and
  redeploy. The current `main` (HEAD) is the canonical build artifact
  that matches the routes published in the sitemap.

### Notes
- No application code was changed in this commit. The previous
  `feat(static-pages)` and `fix(routing)` commits already contain the
  correct home page, locale layout, middleware, and data access
  layer. The chunks produced by `next build` locally are healthy
  (verified — `next build` produces 609 static pages without
  errors).
- If the issue recurs, verify in Vercel Dashboard → Deployments that
  the most recent deployment is `Ready` and that its commit matches
  the latest commit on `main`.
