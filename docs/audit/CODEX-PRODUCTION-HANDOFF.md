# Codex Production Cutover & Deployment Runbook (Future Standing Guide)

> **IMPORTANT NOTICE: DO NOT EXECUTE DURING LOCAL v1.1 DEVELOPMENT**  
> This runbook is a future standing operational guide to be executed **only** when the club leadership explicitly authorizes live cloud deployment, selects a verified production domain, and supplies production credentials.  
> The current **v1.1 release is strictly a local development release with simulated payments** operating against the isolated local Docker Supabase stack.

---

## 1. Local Baseline & Verification State

Antigravity has fully developed, hardened, tested, and validated the Next.js App Router + Supabase platform locally against the isolated Docker stack (`sdgc`).

### Verified Quality Gates (Local Baseline)

- **Formatting & Linting:** Prettier & Biome (`biome lint . --error-on-warnings`) — 0 warnings, 0 errors across all files.
- **Strict TypeScript:** `next typegen && tsc --noEmit` — 0 type errors.
- **Unit Test Suite:** `npm test` — 9 files, 44 tests passing.
- **Integration Test Suite:** `npm run test:integration` — 12 files, 111 tests passing against real local Supabase Docker stack.
- **Database Schema & RLS:** `npm run db:lint` & `npm run db:test` — 40 pgTAP tests passing, 0 schema lints, 0 drift between committed migrations and generated local TypeScript types.
- **End-to-End Browser Tests:** `npm run test:e2e -- --workers=4` — 13 test files, 140 tests passing across Desktop Chromium and Mobile iPhone 13 viewports.
- **Production Build:** `npm run build` — 32 routes compiled via Turbopack in Next.js 16.4.1.

---

## 2. Operational Prerequisites (Operator Input Required Before Cutover)

Before an engineer or agent can execute live cutover, the club administrator or hosting operator must provision and provide the following cloud credentials:

1. **Hosted Supabase Project Reference:**
   - Create a project on [Supabase Cloud](https://supabase.com).
   - Retrieve `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.
2. **Stripe Merchant Production API Keys:**
   - Stripe Account configured for Saugatuck Douglas Garden Club.
   - `STRIPE_SECRET_KEY` (`sk_live_...`).
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (`pk_live_...`).
   - Webhook endpoint created in Stripe Dashboard listening for `checkout.session.completed`, `payment_intent.payment_failed`, and `charge.refunded`.
   - `STRIPE_WEBHOOK_SECRET` (`whsec_...`).
3. **Transactional Email / SMTP in Supabase Auth:**
   - Configure custom SMTP (SendGrid, Resend, Postmark, or AWS SES) in Supabase Auth Dashboard so password resets, invitations, and signups are delivered from the club's authorized domain.
4. **Verified Production Domain:**
   - Confirm selected production domain with club leadership (e.g. legacy `saugatuckdouglasgardenclub.com` or candidate `saugatuckdouglasgardenclub.org`).
5. **Private WordPress Member & Content Export:**
   - Place sanitized WordPress XML/JSON exports into `imports/private/` on the deployment runner if historical member migration is requested.
6. **DNS Host Access:**
   - Access to registrar/DNS provider to configure CNAME and A records.

---

## 3. Production Cutover Execution Plan (When Authorized)

When explicitly instructed to perform production cutover, follow these sequential phases:

### Phase 1: Pre-Flight Integrity & Environmental Separation

1. Verify that the local Git working tree is clean: `git status`.
2. Run standard local validation gate: `npm run check`.
3. Ensure `LOCAL_PAYMENTS_SIMULATION` is set to `false` in production environment variables so the application delegates to live Stripe Checkout.
4. Verify that `SUPABASE_SERVICE_ROLE_KEY` is NEVER leaked to any client bundle or `NEXT_PUBLIC_*` variable.

### Phase 2: Hosted Supabase Setup & Migration Replication

1. Authenticate with Supabase CLI:
   ```bash
   npx supabase login
   ```
2. Link the repository to the production hosted Supabase project:
   ```bash
   npx supabase link --project-ref <PROJECT_ID>
   ```
3. Apply all committed migrations to the remote database:
   ```bash
   npx supabase db push
   ```
   (All tables, RLS policies, RBAC security definer functions, storage buckets, and triggers will be idempotently created from the committed CLI migrations).
4. Verify remote storage bucket `club-media`:
   Ensure `club-media` exists with `public: false` so that the committed RLS policies on `storage.objects` protect member files, while public gallery items are served via authorized/signed URLs.
5. Generate fresh local database types from the local Docker instance whenever schema changes are made:
   ```bash
   npm run db:types
   ```
   _(Note: `npm run db:types` inspects the local Docker stack; do not handwrite generated database types)._

### Phase 3: Production Configuration & Webhooks

1. Configure production environment variables on Vercel / hosting platform:
   - `NEXT_PUBLIC_SITE_URL`: `https://<SELECTED_PRODUCTION_DOMAIN>`
   - `NEXT_PUBLIC_SUPABASE_URL`: `https://<PROJECT_ID>.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: `<HOSTED_ANON_KEY>`
   - `SUPABASE_SERVICE_ROLE_KEY`: `<HOSTED_SERVICE_ROLE_KEY>`
   - `LOCAL_PAYMENTS_SIMULATION`: `false`
   - `STRIPE_SECRET_KEY`: `sk_live_...`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: `pk_live_...`
   - `STRIPE_WEBHOOK_SECRET`: `whsec_...`
2. Configure Stripe Dashboard Webhook:
   - URL: `https://<SELECTED_PRODUCTION_DOMAIN>/api/webhooks/stripe`
   - Events:
     - `checkout.session.completed`
     - `payment_intent.payment_failed`
     - `charge.refunded`
   - Test webhook signing verification against `src/app/api/webhooks/stripe/route.ts`.
3. In Supabase Auth Dashboard:
   - Set Site URL: `https://<SELECTED_PRODUCTION_DOMAIN>`
   - Set Redirect URLs: `https://<SELECTED_PRODUCTION_DOMAIN>/**`, `https://<SELECTED_PRODUCTION_DOMAIN>/auth/callback`, `https://<SELECTED_PRODUCTION_DOMAIN>/auth/confirm`
   - Enable custom SMTP server so user confirmation and password reset emails are delivered from the club domain.

### Phase 4: Initial Administrative Seed & Data Migration (If Requested)

1. If initial club staff accounts need provisioning, create the initial administrator using Supabase Auth, then run:
   ```sql
   INSERT INTO public.user_roles (user_id, role, granted_by)
   VALUES ('<INITIAL_ADMIN_UUID>', 'admin', '<INITIAL_ADMIN_UUID>');
   ```
2. If historical WordPress member exports are present in `imports/private/`:
   - Run dry-run validation:
     ```bash
     node scripts/import-wordpress.mjs --dry-run --input-dir imports/private/
     ```
   - Inspect zero-PII audit output.
   - Execute production import using the migration runner against the production Supabase database.

### Phase 5: Production Deployment & Smoke Testing

1. Deploy production build to hosting provider (e.g. Vercel, Cloudflare, AWS Amplify).
2. Execute live smoke tests:
   - Public pages: `/`, `/about`, `/garden-walk`, `/events`, `/gallery`, `/contact`.
   - Legacy redirects: test `/aboutourclub` -> `/about`, `/becomeamember` -> `/join`.
   - Authentication: Test member signup, email verification receipt, login via username and email, password reset request.
   - Membership & Dues: Submit test application, verify term calculation (calendar year, $50 USD), test Stripe Checkout session creation.
   - Staff Approval Bylaw: Verify that when a payment completes, the payment status becomes `confirmed` but the membership status remains `pending` awaiting manual staff approval in `/admin/members`.
   - Admin Workspaces: Sign in as administrator and verify `/admin`, `/admin/members`, `/admin/dues`, `/admin/events`, `/admin/content`, `/admin/media`, `/admin/messages`.
3. DNS Cutover:
   - Configure Apex domain A record and CNAME record for `www`.
   - Validate SSL certificate provisioning.

---

## 4. Verification Checkpoint Before Running Production Cutover

Before executing this runbook, ensure:

1. All local quality gates pass (`npm run check`, `npm run build`, `npm run test:integration`, `npm run db:test`, `npm run test:e2e`).
2. Club leadership has explicitly authorized production cutover and supplied the verified domain and credentials.
3. Live credentials are never committed to Git or exposed to client-side bundles.
