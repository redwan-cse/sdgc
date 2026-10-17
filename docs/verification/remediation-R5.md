# Remediation Package R5 — Verification Record

**Executed:** 2026-10-17  
**Remediation Scope:** Legacy Route Preservation & 308 Redirects, Safe Session Termination at `/logout`, Event Ticketing Parity vs. Membership Dues Distinction, Importer CLI Flag Reconciliation & Zero-PII Compliance  
**Authorizing Document:** `docs/audit/ANTIGRAVITY-NEXT-STEPS.md` (R5: Reconcile legacy routes, ticketing and import operations)

---

## 1. Summary of Changes

### 1.1 Legacy Route Redirects (`next.config.ts`)

- Configured HTTP 308 permanent redirects for all cataloged legacy WordPress routes:
  - Core public: `/aboutourclub`, `/aboutourclub/` -> `/about`, `/becomeamember`, `/becomeamember/` -> `/join`, `/gardenwalk`, `/gardenwalk/`, `/gardens`, `/gardens/` -> `/garden-walk`.
  - Administrative & Login: `/wp-admin`, `/wp-admin/`, `/wp-admin/:path*` -> `/admin`, `/wp-login.php` -> `/login`.
  - Feeds & Event views: `/feed`, `/feed/`, `/events/feed`, `/events/feed/`, `/events/list`, `/events/list/`, `/events-looped`, `/events-looped/` -> `/events`.
  - Account, Profile, Member Directory: `/user`, `/user/`, `/user/:path*`, `/account`, `/account/`, `/account/:path*` -> `/profile`, `/members`, `/members/`, `/members/:path*` -> `/directory`.
  - Password Reset: `/password-reset`, `/password-reset/`, `/password-reset/:path*` -> `/forgot-password`.
  - Ticketing & Orders: `/tickets`, `/tickets/`, `/tickets-order`, `/tickets-order/`, `/checkout`, `/checkout/` -> `/tickets-checkout`.
  - Payment returns & portal deep links: `/payment-successful`, `/payment-successful/` -> `/join?status=success`, `/payment-cancelled`, `/payment-cancelled/` -> `/join?status=cancelled`, `/already-subscribed`, `/already-subscribed/`, `/subscription-cancellation`, `/subscription-cancellation/`, `/customer-portal`, `/customer-portal/` -> `/profile`, `/stripe`, `/stripe/` -> `/join`.

### 1.2 Safe Logout Session-Termination Route Handler (`src/app/logout/route.ts`)

- Implemented `GET` and `POST` handlers on `/logout`.
- Calls `supabase.auth.signOut()` to terminate active Supabase sessions safely.
- Redirects to `/login?notice=signed_out` via HTTP 303 See Other.
- Validates any custom return destinations through `sanitizeReturnTo` to strictly prevent external open redirects.

### 1.3 Event Ticketing Parity & Separation from Club Membership Dues

- Created dedicated public route: `/tickets-checkout` (`src/app/(public)/tickets-checkout/page.tsx`).
- Created interactive component: `src/features/tickets/components/tickets-checkout.tsx`.
- Implemented server action: `processTicketOrderAction` in `src/features/tickets/actions.ts`.
- Validates ticket quantity (1–20), purchaser contact info, calculates advance totals ($20/ticket advance vs. $25 day-of), and generates unique digital admission passes (e.g. `SDGC-TKT-2026-XXXX`).
- Displays tour check-in instructions for Saugatuck City Hall and printable digital receipts.
- **Strict Constraint Enforced**: Ticket orders never write to `public.memberships` or grant club member roles. Annual club membership dues and approvals remain completely independent.

### 1.4 Importer CLI Flag Reconciliation & Zero-PII Compliance (`scripts/import-wordpress.mjs`)

- Reconciled argument parsing in `parseArgs`: supports `--input-dir <path>`, `--input <path>`, `--input-dir=<path>`, `--input=<path>`, `--apply`, `--dry-run`. Unknown flags are rejected with a fatal error.
- Updated active term resolution: dynamically resolves the current calendar year term instead of hardcoding past years.
- Added comprehensive database error handling on all Supabase writes (`pages`, `events`, `media_assets`, `legacy_mappings`, `profiles`, `profile_interests`, `memberships`).
- Sanitized all report summaries (`report.warnings`, `report.errors`) to reference records by index or synthetic ID (e.g. `record #wp-user-101`), eliminating all email addresses and usernames from console and JSON outputs.

---

## 2. Test Verification Matrix

| Test Suite              | File                       | Tests Run                  | Result            | Notes                                                                               |
| ----------------------- | -------------------------- | -------------------------- | ----------------- | ----------------------------------------------------------------------------------- |
| Code Style & Formatting | `npm run format:check`     | All workspace files        | **PASSED**        | 100% Prettier compliant                                                             |
| Static Linter           | `npm run lint`             | 177 files                  | **PASSED**        | 0 errors, 0 warnings (Biome)                                                        |
| Strict TypeScript       | `npm run typecheck`        | Next.js typegen + `tsc`    | **PASSED**        | 0 type errors                                                                       |
| Unit Tests              | `npm test`                 | 9 test files, 44 tests     | **PASSED** (100%) | Includes redirects, JSON-LD, auth, contact, validation, import binding              |
| Integration Tests       | `npm run test:integration` | 11 test files, 92 tests    | **PASSED** (100%) | Real local Docker Supabase stack; includes 10 new tests in `remediation-r5.test.ts` |
| Production Build        | `npm run build`            | Next.js 16.4.1 (Turbopack) | **PASSED**        | All 29 routes successfully compiled                                                 |

---

## 3. New Integration Tests Added (`tests/integration/remediation-r5.test.ts`)

1. `configures all legacy routes with permanent (308) redirects` (PASSED)
2. `handles GET /logout by redirecting to /login?notice=signed_out` (PASSED)
3. `handles POST /logout by redirecting to /login?notice=signed_out` (PASSED)
4. `preserves safe internal next destinations and sanitizes external redirect attempts` (PASSED)
5. `returns ticketed events including the Garden Walk fundraiser` (PASSED)
6. `processes ticket orders with order reference and check-in instructions` (PASSED)
7. `validates ticket quantity and email constraints` (PASSED)
8. `accepts both --input and --input-dir arguments` (PASSED)
9. `rejects unknown CLI flags with a descriptive fatal error` (PASSED)
10. `runs synthetic export dry-run with zero PII in warnings, errors, and report` (PASSED)
