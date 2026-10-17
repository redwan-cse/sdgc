# Codex Production Cutover & Deployment Handoff

**Handoff Date:** October 17, 2026  
**Repository:** `sdgc` (`J:\DevDrive\sdgc`)  
**Target Domain:** `https://saugatuckdouglasgardenclub.org` (or legacy domain `https://saugatuckdouglasgardenclub.com`)  
**Antigravity Baseline:** R0 through R7 Complete + Pre-Production Hardening (100% Quality Gates Passed)

---

## 1. Executive Summary & Verification State

Antigravity has fully developed, hardened, tested, and validated the Next.js App Router + Supabase platform locally against the isolated Docker stack (`sdgc`).

### Verified Quality Gates (Local Baseline)

- **Formatting & Linting:** Prettier & Biome (`biome lint . --error-on-warnings`) — 0 warnings, 0 errors across 188 files.
- **Strict TypeScript:** `next typegen && tsc --noEmit` — 0 type errors.
- **Unit Test Suite:** `npm test` — 9 files, 44 tests passing.
- **Integration Test Suite:** `npm run test:integration` — 12 files, 104 tests passing against real local Supabase Docker stack.
- **Database Schema & RLS:** `npm run db:lint` & `npm run db:test` — 40 pgTAP tests passing, 0 schema lints, 0 drift between committed migrations and generated TypeScript types.
- **End-to-End Browser Tests:** `npm run test:e2e` — 13 test files, 140 tests passing across Desktop Chromium and Mobile iPhone 13 viewports with zero WCAG 2.1 AA accessibility violations.
- **Production Build:** `npm run build` — 32 routes compiled via Turbopack in Next.js 16.4.1.

---

## 2. Operational Prerequisites (Operator Input Required)

Before Codex can execute live cutover, the club administrator or hosting operator must provision the following cloud credentials:

1. **Hosted Supabase Project Reference:**
   - Create a project on [Supabase Cloud](https://supabase.com).
   - Retrieve `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.
2. **Stripe Merchant Production API Keys:**
   - Stripe Account configured for Saugatuck Douglas Garden Club.
   - `STRIPE_SECRET_KEY` (`sk_live_...` or `sk_test_...` for live staging).
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (`pk_live_...`).
   - Webhook endpoint created pointing to `https://<production-domain>/api/webhooks/stripe` listening for `checkout.session.completed`, `payment_intent.payment_failed`, and `charge.refunded`.
   - `STRIPE_WEBHOOK_SECRET` (`whsec_...`).
3. **Transactional Email / SMTP in Supabase Auth:**
   - Configure custom SMTP (SendGrid, Resend, Postmark, or AWS SES) in Supabase Auth Dashboard so password resets, invitations, and signups are delivered from `@saugatuckdouglasgardenclub.org`.
4. **Private WordPress Member & Content Export:**
   - Place sanitized WordPress XML/JSON exports into `imports/private/` on the deployment runner if historical data migration is requested.
5. **DNS Host Access:**
   - Access to registrar/DNS DNS provider to configure CNAME and A records.

---

## 3. Exact Prompt to Provide to OpenAI Codex

Copy the entire block below and paste it directly into Codex:

````markdown
You are OpenAI Codex performing the final production cutover and deployment pass for the Saugatuck Douglas Garden Club (SDGC) website.

### Workspace Context & Repository Authority

- Repository path: `J:\DevDrive\sdgc`
- Repository baseline: Antigravity has completed Phases P0–P8 and Remediation Work Packages R0–R7.
- Full documentation is in `AGENTS.md`, `docs/ARCHITECTURE.md`, `docs/DELIVERY.md`, `docs/audit/PROJECT-INTERNAL-AUDIT.md`, and `docs/audit/PARITY-LEDGER.md`.
- Stack: Node 24, npm 11, Next.js 16.4.1 (App Router), React 19, Tailwind CSS 4, Supabase JS/SSR.
- Theme: tweakcn light/dark palette in `src/app/globals.css`. Do not alter or replace this theme.
- Club Timezone: All membership terms and events operate under `America/Detroit`.

### Current Verification Status

The local repository currently passes 100% of quality checks:

- 44 unit tests (`npm test`)
- 104 integration tests (`npm run test:integration`)
- 40 pgTAP schema tests (`npm run db:test`)
- 140 Playwright E2E browser tests (`npm run test:e2e`)
- 0 Biome warnings, 0 TypeScript errors, 32 Turbopack routes compiled (`npm run build`).

### Your Assignment: Final Production Cutover Pass

Execute the production deployment pass systematically following these sequential phases:

#### Phase 1: Pre-Flight Integrity & Environmental Separation

1. Verify that the local Git working tree is clean: `git status`.
2. Run standard local validation gate: `npm run check`. Do not proceed if any check fails.
3. Review `.env.example` vs deployment target environment. Ensure `LOCAL_PAYMENTS_SIMULATION` is set to `false` in production so the application delegates to Stripe Checkout.
4. Verify that `SUPABASE_SERVICE_ROLE_KEY` is NEVER leaked to any client bundle or `NEXT_PUBLIC_*` variable.

#### Phase 2: Hosted Supabase Setup & Migration Replication

1. Authenticate with Supabase CLI:
   `npx supabase login`
2. Link the repository to the production hosted Supabase project:
   `npx supabase link --project-ref <PROJECT_ID>`
3. Apply all committed migrations to the remote database:
   `npx supabase db push`
   (All tables, RLS policies, RBAC security definer functions, storage buckets, and triggers will be idempotently created).
4. Verify remote storage bucket `club-media`:
   Ensure `club-media` exists with `public: false` so that the committed RLS policies on `storage.objects` protect member files, while public gallery items are served via authenticated/signed URLs.
5. Generate fresh production database types if any remote schema discrepancies are detected:
   `npm run db:types`

#### Phase 3: Production Configuration & Webhooks

1. Configure production environment variables on Vercel / Hosting platform:
   - `NEXT_PUBLIC_SITE_URL`: `https://saugatuckdouglasgardenclub.org`
   - `NEXT_PUBLIC_SUPABASE_URL`: `https://<PROJECT_ID>.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: `<HOSTED_ANON_KEY>`
   - `SUPABASE_SERVICE_ROLE_KEY`: `<HOSTED_SERVICE_ROLE_KEY>`
   - `LOCAL_PAYMENTS_SIMULATION`: `false`
   - `NEXT_PUBLIC_LOCAL_PAYMENTS_ENABLED`: `false`
   - `STRIPE_SECRET_KEY`: `sk_live_...`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: `pk_live_...`
   - `STRIPE_WEBHOOK_SECRET`: `whsec_...`
2. Configure Stripe Dashboard Webhook:
   - URL: `https://<PRODUCTION_DOMAIN>/api/webhooks/stripe`
   - Events:
     - `checkout.session.completed`
     - `payment_intent.payment_failed`
     - `charge.refunded`
   - Test webhook signing verification against `src/app/api/webhooks/stripe/route.ts`.
3. In Supabase Auth Dashboard:
   - Set Site URL: `https://<PRODUCTION_DOMAIN>`
   - Set Redirect URLs: `https://<PRODUCTION_DOMAIN>/**`, `https://<PRODUCTION_DOMAIN>/auth/callback`, `https://<PRODUCTION_DOMAIN>/auth/confirm`
   - Enable custom SMTP server so user confirmation and password reset emails are delivered from the club domain.

#### Phase 4: Initial Administrative Seed & Data Migration (If Requested)

1. If initial club staff accounts need provisioning, create the initial administrator using Supabase Auth, then run:
   ```sql
   INSERT INTO public.user_roles (user_id, role, granted_by)
   VALUES ('<INITIAL_ADMIN_UUID>', 'admin', '<INITIAL_ADMIN_UUID>');
   ```
````

2. If historical WordPress member exports are present in `imports/private/`:
   - Run dry-run validation:
     `node scripts/import-wordpress.mjs --dry-run --input-dir imports/private/`
   - Inspect zero-PII audit output.
   - Execute production import using the migration runner against the production Supabase database.

#### Phase 5: Production Deployment & Smoke Testing

1. Deploy production build to hosting provider (e.g., `vercel --prod` or CI/CD pipeline).
2. Execute live smoke tests:
   - Public pages: `/`, `/about`, `/garden-walk`, `/events`, `/gallery`, `/contact`.
   - Legacy redirects: test `/wp-login.php` -> `/login`, `/aboutourclub` -> `/about`, `/becomeamember` -> `/join`.
   - Authentication: Test member signup, email verification receipt, login via username and email, password reset request.
   - Membership & Dues: Submit test application, verify term calculation (calendar year 2026, $50 USD), test Stripe Checkout session creation.
   - Staff Approval Bylaw: Verify that when a payment completes, the payment status becomes `confirmed` but the membership status remains `pending` awaiting manual staff approval in `/admin/members`.
   - Admin Workspaces: Sign in as administrator and verify `/admin`, `/admin/members`, `/admin/dues`, `/admin/events`, `/admin/content`, `/admin/media`, `/admin/messages`.
3. DNS Cutover:
   - Configure Apex domain A record and CNAME record for `www`.
   - Validate SSL certificate provisioning.

#### Completion Delivery

Document the production cutover actions, deployment URL, verified smoke test results, and final DNS status in `docs/verification/production-cutover.md`.

```

---

## 4. Verification Checkpoint Before Running Codex

Before invoking Codex, ensure you have:
1. Committed all Antigravity remediation files (current commit `719bfc2`).
2. Run `npm run check` to verify formatting, linter, TypeScript types, and unit tests.
3. Prepared the hosted Supabase and Stripe live credentials in a secure manager.
```
