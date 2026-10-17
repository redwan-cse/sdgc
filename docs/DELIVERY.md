# Saugatuck Douglas Garden Club — Delivery & Handover Guide

## 1. Project Overview

This repository contains the Next.js (App Router) and Supabase replacement for the Saugatuck Douglas Garden Club website. The project modernizes the club's web presence from an outdated WordPress installation to a modern, accessible, type-safe, and secure full-stack web application with role-based access control (RBAC), annual membership lifecycle management, and a dedicated administrative panel.

All work has been developed and validated against the isolated local Docker Supabase stack, following the standards defined in `docs/ANTIGRAVITY-PROMPT.md`, `docs/ARCHITECTURE.md`, `docs/DEVELOPMENT-PLAN.md`, and `docs/VERIFICATION-PLAN.md`.

---

## 2. Readiness Tiers & Operational Boundaries

To maintain rigorous engineering honesty, readiness is delineated into five distinct tiers:

### Tier 1: Frontend Ready — **VERIFIED**

- **Public Website Routes**: Homepage (`/`), About (`/about`), Garden Walk (`/garden-walk`), Events (`/events`, `/events/month`, `/events/day`, `/event/[slug]`), Gallery (`/gallery`), Join (`/join`), Membership (`/membership`), Contact (`/contact`), Ticket Checkout (`/tickets-checkout`).
- **Member Portal Routes**: Profile Management (`/profile`), Private Member Directory (`/directory`).
- **Admin Workspaces**: Overview (`/admin`), Member Approvals (`/admin/members`), Dues Reconciliation (`/admin/dues`), Events Scheduling (`/admin/events`), Page Copy Editor (`/admin/content`), Contact Inbox (`/admin/messages`), Media Library (`/admin/media`).
- **User Interface & Design System**: Custom theme with Light, Dark, and System modes, accessible focus containment modal with 1.5x zoom viewer, responsive navigation, loading skeletons, and runtime error boundaries.
- **Accessibility & Validation**: Verified zero critical or serious WCAG 2.1 AA accessibility violations via `@axe-core/playwright`.

### Tier 2: Migrations & Schema Ready — **VERIFIED**

- **Reproducible Migrations**: All application schemas, tables, views, security definer RPC functions, triggers, and storage buckets reproduce cleanly from committed migration files (`supabase/migrations/`).
- **Row-Level Security (RLS)**: Enforced on 100% of exposed application tables. Real-user integration tests verify both allowed access for authorized roles and hard denial for unauthorized roles.
- **Database Drift Check**: Clean zero-diff verification between database schema and TypeScript generic types (`npm run db:types`).
- **Automated Database Testing**: 4 test files, 40 tests passing via pgTAP (`npm run db:test`).
- **Database Schema Linter**: Zero warnings, zero errors via Supabase DB lint (`npm run db:lint`).

### Tier 3: Local Full-Stack Ready — **VERIFIED**

- **Isolated Local Docker Stack**: Runs strictly against the repo-isolated `sdgc` Docker containers (API: 54321, PostgreSQL: 54322, Studio: 54323, Mailpit: 54324).
- **Synthetic Test Personas**: 9 provisioned local test personas covering all administrative roles and membership lifecycle states.
- **Local Mail & Recovery Capture**: Signup confirmation and password recovery emails captured locally in Mailpit without external SMTP configuration.
- **Test Suite Coverage**: 100% pass rate across 44 unit tests, 104 integration tests, and 140 Playwright E2E browser tests.

### Tier 4: Legacy Parity Verified — **VERIFIED**

- **Legacy Route Preservation**: HTTP 308 permanent redirects configured for all 22 cataloged historical WordPress routes (`/aboutourclub/`, `/becomeamember/`, `/user/`, `/members/`, `/events/list/`, `/checkout/`, `/password-reset/`, etc.). Full inventory documented in `docs/audit/PARITY-LEDGER.md`.
- **Safe Session Termination**: Dedicated `/logout` route handler calling `supabase.auth.signOut()` and safely redirecting with open-redirect sanitization.
- **Ticketing vs. Dues Parity**: Distinct `/tickets-checkout` route supporting advance admission sales ($20 advance vs. $25 day-of) with Saugatuck City Hall check-in instructions. Verified zero writes to `memberships` table (event tickets do not grant club membership).
- **Identifier Parity**: Dual-identifier login supporting either username or email address via RPC resolver.
- **Calendar Timezone Parity**: Date calculations, event displays, and iCalendar feed generation pinned to `America/Detroit`.
- **Importer Parity & Zero-PII Compliance**: Reconciled CLI (`--input-dir` / `--input`, `--apply`, `--dry-run`), dynamic term year resolution, error handling on all writes, and sanitization of warnings/errors to index and synthetic IDs.

### Tier 5: Production Ready — **PENDING OPERATIONAL PREREQUISITES**

Production deployment requires explicit operational prerequisites that cannot and must not be simulated or authorized in local development:

1. **Hosted Supabase Project**: Provisioning and linking a remote Supabase production project, applying committed migrations, and configuring production environment secrets.
2. **Production Merchant Gateway**: Registering production Stripe merchant account, adding live keys, configuring production webhook endpoints, and completing test transactions.
3. **Transactional SMTP Provider**: Configuring production custom domain SMTP (e.g., SendGrid, Resend, Amazon SES) with verified SPF, DKIM, and DMARC DNS records for `saugatuckgardenclub.org`.
4. **Private Member Export Import**: Executing the verified import script against actual, private WordPress exports dropped into ignored `imports/private/`.
5. **DNS Cutover**: Configuring apex and `www` CNAME records pointing to production hosting infrastructure.

---

## 3. Technology Stack & Architecture

- **Framework:** Next.js 16.4.1 (React 19, Server Components by default, App Router, Turbopack).
- **Styling & Theme:** Tailwind CSS 4 with local theme configuration supporting Dark, Light, and System themes.
- **Typography:** Local self-hosted `@fontsource-variable/inter` (sans-serif) and `@fontsource-variable/lora` (serif); zero external Google Font fetching during build.
- **Database & Auth:** PostgreSQL 15.8 via Supabase CLI in Docker, Row-Level Security (RLS) on all exposed tables, Supabase SSR proxy session management (`src/proxy.ts`).
- **Code Quality & Linting:** Biome 2.5.15 (`--error-on-warnings`), Prettier 3.9.10, strict TypeScript 5.9.3.
- **Testing:** Vitest 5.0.5 (unit & integration tests), pgTAP (database schema & RLS tests), Playwright 1.64.1 (E2E browser tests across desktop and mobile).
- **Timezone Safety:** All calendar events, meetings, and term deadlines standardized to `America/Detroit`.

---

## 4. RBAC Test Personas & Test Credentials

The local environment includes 9 pre-provisioned synthetic personas covering every administrative role and membership lifecycle state:

**Universal Password for All Personas:** `Password123!`

| Role / State          | Email Address                 | Username            | Roles                     | Status (Current Term) | Testing Description                                            |
| :-------------------- | :---------------------------- | :------------------ | :------------------------ | :-------------------- | :------------------------------------------------------------- |
| **Super Admin**       | `admin@sdgc.local`            | `super_admin`       | `["admin"]`               | _Staff_               | Full access to all 7 admin panels and private directory        |
| **Content Editor**    | `editor@sdgc.local`           | `content_editor`    | `["editor"]`              | _Staff_               | Manage events calendar, page copy, and media assets            |
| **Dues Treasurer**    | `treasurer@sdgc.local`        | `dues_treasurer`    | `["treasurer"]`           | _Staff_               | Manage dues ledger, manual check reconciliation, term rates    |
| **Combined Staff**    | `editor_treasurer@sdgc.local` | `combined_staff`    | `["editor", "treasurer"]` | _Staff_               | Multi-role user with both editorial and financial capabilities |
| **Active Member**     | `member@sdgc.local`           | `active_member`     | `[]`                      | `approved`            | Active member with access to private directory and profile     |
| **Member Beta**       | `member_b@sdgc.local`         | `member_beta`       | `[]`                      | `approved`            | Secondary active member for directory search testing           |
| **Pending Applicant** | `pending@sdgc.local`          | `pending_applicant` | `[]`                      | `pending`             | Application pending approval; directory shows locked notice    |
| **Expired Member**    | `expired@sdgc.local`          | `expired_member`    | `[]`                      | `expired`             | Past member awaiting renewal; directory shows locked notice    |
| **Suspended Member**  | `suspended@sdgc.local`        | `suspended_member`  | `[]`                      | `suspended`           | Inactive member; directory shows locked notice                 |

> [!NOTE]
> All users can authenticate using **either their email address OR username** on `/login`. Staff members automatically redirect to `/admin`, and members to `/profile`.

---

## 5. Verification Status & Quality Gates

| Quality Gate             | Verification Command       | Tests Run / Scope           | Outcome    | Details                                                               |
| :----------------------- | :------------------------- | :-------------------------- | :--------- | :-------------------------------------------------------------------- |
| **Code Formatting**      | `npm run format:check`     | All workspace files         | **PASSED** | 100% compliant with Prettier rules                                    |
| **Static Linter**        | `npm run lint`             | 188 files                   | **PASSED** | 0 errors, 0 warnings (Biome `--error-on-warnings`)                    |
| **Strict Typecheck**     | `npm run typecheck`        | Next.js typegen + `tsc`     | **PASSED** | 0 type errors across whole codebase                                   |
| **Unit Tests**           | `npm test`                 | 9 test files, 44 tests      | **PASSED** | Redirects, JSON-LD, auth, contact, validation, import binding         |
| **Integration Tests**    | `npm run test:integration` | 12 test files, 104 tests    | **PASSED** | Local Supabase Docker stack; includes R1–R6 remediation suites        |
| **pgTAP Schema Tests**   | `npm run db:test`          | 4 test files, 40 tests      | **PASSED** | PostgreSQL schema, memberships, RLS policies, RBAC roles              |
| **Database Schema Lint** | `npm run db:lint`          | Extensions & public schemas | **PASSED** | 0 schema errors or warnings                                           |
| **Database Drift Check** | `npm run db:types`         | `src/types/database.ts`     | **PASSED** | Generated types match committed migrations with zero git diff         |
| **E2E Browser Tests**    | `npm run test:e2e`         | 13 test files, 140 tests    | **PASSED** | Desktop Chromium and Mobile iPhone 13; includes WCAG AA accessibility |
| **Production Build**     | `npm run build`            | 32 static & dynamic routes  | **PASSED** | All routes compiled cleanly via Turbopack in Next.js 16.4.1           |

---

## 6. How to Run Locally

### Prerequisites

- Node.js 24 (`.nvmrc` included) and npm 11.
- Docker Desktop (for the local Supabase stack).

### Quick Start Commands

```bash
# 1. Install exact locked dependencies
npm ci

# 2. Start the local Docker Supabase stack
npm run db:start

# 3. Provision environment keys (generates local .env.local)
npm run db:env

# 4. Reset migrations and seed database
npm run db:reset

# 5. Provision synthetic test personas
npm run db:provision

# 6. Run quality verification check
npm run check

# 7. Run integration tests
npm run test:integration

# 8. Run Playwright E2E browser tests
npm run test:e2e

# 9. Run the Next.js development server
npm run dev
```

Open **http://127.0.0.1:3000** in your browser to explore the website. Sign in with any of the personas listed in Section 4 to test administrative and member capabilities.

---

## 7. Migration Tooling

When real WordPress exports become available:

```bash
# Dry run verification (produces zero-PII audit report):
node scripts/import-wordpress.mjs --dry-run --input-dir imports/private/

# Apply migration locally:
node scripts/import-wordpress.mjs --apply --input-dir imports/private/
```

> [!CAUTION]
> The migration script enforces strict loopback target protection. It will immediately terminate with an error if pointed at any hosted or remote URL. Real exports must never be committed to Git.
