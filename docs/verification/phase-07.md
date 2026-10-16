# Phase 07 Verification: Migration Tooling, SEO Metadata, & Cutover Evidence

Date: 2026-10-16  
Environment: Node v24.19.0, npm 11.17.0, Next.js 16.4.1 (Turbopack), Vitest 5.0.5, Playwright 1.58.2, Supabase CLI 2.121.0, PostgreSQL 15.8 (Docker), Windows 11

## Verification Summary

| Check                          | Command                                                                                                | Actual Outcome                                                                                                                                      | Status |
| :----------------------------- | :----------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------- | :----- |
| **Synthetic Export Fixtures**  | Inspected `tests/fixtures/synthetic-export/`                                                           | Created 5 synthetic fixture datasets (`pages.json`, `venues.json`, `events.json`, `media.json`, `users.json`) with XSS test cases and phpass hashes | PASS   |
| **WordPress Migration Tool**   | `node scripts/import-wordpress.mjs --dry-run`                                                          | Zero-PII report generated with SHA-256 file hashes, XSS sanitization warning, password hash rejection, and missing media warning                    | PASS   |
| **Hosted Target Guardrail**    | `node scripts/import-wordpress.mjs --supabase-url https://example.supabase.co`                         | Script strictly blocked execution with `CRITICAL SECURITY VIOLATION: Hosted or remote Supabase target rejected`                                     | PASS   |
| **Replay Idempotency**         | `node scripts/import-wordpress.mjs --apply` (repeated)                                                 | Double execution produced zero duplicate records in `pages`, `events`, `venues`, `media_assets`, `profiles`, and `legacy_mappings`                  | PASS   |
| **Route Audit Suite**          | `node scripts/audit-routes.mjs http://127.0.0.1:3000`                                                  | 16/16 routes verified; 308 redirects verified; query parameters preserved; 404 handling verified                                                    | PASS   |
| **Format Check**               | `npm run format:check`                                                                                 | Prettier formatted across all 153 files, 0 issues                                                                                                   | PASS   |
| **Biome Lint**                 | `npm run lint`                                                                                         | Biome checked 153 files, 0 errors, 0 warnings                                                                                                       | PASS   |
| **Route & TypeScript Types**   | `npm run typecheck`                                                                                    | Next.js route typegen succeeded, `tsc --noEmit` 0 errors                                                                                            | PASS   |
| **Vitest Unit Tests**          | `npm test`                                                                                             | 4 test suites, 16/16 unit tests passed                                                                                                              | PASS   |
| **Integration Test Suite**     | `npm run test:integration`                                                                             | 6 test suites (`migration.test.ts`, `admin-permissions.test.ts`, `payments.test.ts`, `auth.test.ts`, `rls.test.ts`, `storage.test.ts`), 50/50 pass  | PASS   |
| **Production Build**           | `npm run build`                                                                                        | Next.js Turbopack build succeeded; all 27 static and dynamic routes compiled cleanly                                                                | PASS   |
| **Phase 07 Playwright E2E**    | `npx playwright test tests/e2e/phase-07.spec.ts`                                                       | 10/10 tests passed across Desktop Chromium and Mobile (iPhone 13)                                                                                   | PASS   |
| **Cross-Phase E2E Regression** | `npx playwright test tests/e2e/phase-05.spec.ts tests/e2e/phase-06.spec.ts tests/e2e/phase-07.spec.ts` | 44/44 tests passed with zero regressions                                                                                                            | PASS   |
| **Visual Screenshot Evidence** | Saved in `artifacts/phase-07/`                                                                         | 6 full-page screenshots captured for desktop and mobile viewports                                                                                   | PASS   |

---

## Architectural & Security Implementation

### 1. WordPress Migration Script (`scripts/import-wordpress.mjs`)

- **Default Dry-Run:** Script defaults to `--dry-run` and requires `--apply` or `--no-dry-run` to execute database modifications.
- **Hosted Target Enforcement:**
  - Validates `supabaseUrl` hostname.
  - Rejects any destination other than `127.0.0.1`, `localhost`, or `::1` with exit code 1.
- **XSS HTML Sanitization:**
  - Function `sanitizeHtml()` strips all `<script>`, `<iframe>`, `<object>`, `<embed>`, inline event handlers (`onload=`, `onerror=`, `onclick=`), and `javascript:` URIs.
  - Verified by unit tests and database assertions on `suspicious-announcement` post.
- **WordPress Password Hash Safety:**
  - Detects WordPress `phpass` password hashes (`$P$...` / MD5).
  - Never copies legacy hashes into Supabase Auth passwords.
  - Provisions accounts with `must_reset_password: true` and temporary tokens for a secure invitation/password reset flow.
- **Missing Media Fallback:**
  - If a media asset file is missing from the export archive, flags a warning in the execution report without crashing the batch.
- **Idempotent Replay (MIG-01):**
  - Database upserts match on unique natural keys (`slug`, `name`, `storage_path`, `username`) and record entries in `public.legacy_mappings`.
  - Re-running the script twice on identical fixtures creates 0 duplicate rows.
- **Zero-PII Audit Report:**
  - Calculates SHA-256 hashes for all input files.
  - Reports entity processing metrics (created, updated, skipped, rejected).
  - Omits email addresses, phone numbers, and credentials from logs.

---

### 2. SEO, Metadata, & Structured Data

- **Robots Policy (`src/app/robots.ts`):**
  - Delivers `User-Agent: *` with `Allow: /`.
  - Disallows private, administrative, and member endpoints: `/admin/`, `/profile/`, `/directory/`, `/auth/`, `/reset-password`, `/forgot-password`, `/api/`.
  - Directs search engines to `${baseUrl}/sitemap.xml`.
- **Dynamic Sitemap (`src/app/sitemap.ts`):**
  - Aggregates canonical static routes: `/`, `/about`, `/garden-walk`, `/events`, `/gallery`, `/membership`, `/contact`, `/join`.
  - Dynamically queries published events from `public.events` table.
  - Dynamically queries published pages from `public.pages` table.
  - Excludes all administrative, member, and authentication paths.
- **MetadataBase & Open Graph (`src/app/layout.tsx`):**
  - Injects `metadataBase` with canonical root URL.
  - Defines Open Graph tags (`og:title`, `og:description`, `og:url`, `og:site_name`, `og:image`, `og:locale: en_US`).
  - Defines Twitter card (`summary_large_image`).
- **Event Structured Data (`src/app/(public)/event/[slug]/page.tsx`):**
  - Injects `<script type="application/ld+json">` with `schema.org/Event`.
  - Validates event name, description, ISO start/end dates in `America/Detroit` timezone.
  - Includes `location` object of type `Place` with structured `PostalAddress`.
  - Includes `offers` object linking to ticket checkout URL when present.

---

### 3. Legacy Route Redirection & Query Survival (SEO-01)

- **HTTP 308 Permanent Redirects (`next.config.ts`):**
  - `/aboutourclub` and `/aboutourclub/` -> `/about`
  - `/becomeamember` and `/becomeamember/` -> `/join`
  - `/wp-login.php` -> `/login`
  - `/wp-admin` and `/wp-admin/` -> `/admin`
  - `/wp-admin/:path*` -> `/admin`
  - `/feed` and `/feed/` -> `/events`
  - `/events/feed` and `/events/feed/` -> `/events`
- **Query Parameter Preservation:**
  - Next.js permanent redirects retain query parameters (`/becomeamember?campaign=spring2026&ref=posters` -> `/join?campaign=spring2026&ref=posters`).
  - Verified by automated route audit and Playwright tests.
- **404 Handling:**
  - Non-existent routes return HTTP 404 with custom branded navigation back to safety.

---

## Migration Documentation Suite

The following comprehensive guides were authored in `docs/migration/`:

1. [`docs/migration/runbook.md`](file:///J:/DevDrive/sdgc/docs/migration/runbook.md): Step-by-step technical operator guide for dry-run verification, live local execution, replay testing, and route auditing.
2. [`docs/migration/field-mapping.md`](file:///J:/DevDrive/sdgc/docs/migration/field-mapping.md): Field-level schema mappings between WordPress tables and Supabase tables.
3. [`docs/migration/redirects.md`](file:///J:/DevDrive/sdgc/docs/migration/redirects.md): Complete legacy redirection catalog, query parameter preservation behavior, and verification commands.
4. [`docs/migration/account-transition.md`](file:///J:/DevDrive/sdgc/docs/migration/account-transition.md): Security rationale for phpass password rejection, member invitation workflow, and email communication templates.

---

## Visual Screenshot Artifacts

All screenshots recorded at full page resolution:

- `artifacts/phase-07/01-seo-event-ld.png`: Desktop Event detail page showing Schema.org JSON-LD and Open Graph tags.
- `artifacts/phase-07/01-seo-event-ld-mobile.png`: Mobile view of event detail page with structured data.
- `artifacts/phase-07/02-not-found.png`: Desktop 404 Page Not Found error view.
- `artifacts/phase-07/02-not-found-mobile.png`: Mobile 404 view.
- `artifacts/phase-07/03-redirected-join.png`: Desktop `/becomeamember` redirected to `/join?campaign=spring2026&ref=posters` with query params intact.
- `artifacts/phase-07/03-redirected-join-mobile.png`: Mobile redirected join view.
