# Remediation R1 Verification: Security, Privacy, and Integrity Boundaries

**Execution Date:** October 16, 2026  
**Target:** Database RLS, Views, Audit Trail, Privacy Projection, Input Sanitization, and Boundary Enforcement  
**Migration:** `supabase/migrations/20261016143005_security_and_privacy_boundaries.sql`

---

## 1. Summary of Changes

Work Package R1 addresses the seven critical security, privacy, and integrity boundaries identified in the Codex review:

1. **Event JSON-LD HTML-Safe Serialization (`R1.1`)**:
   - Implemented `serializeJsonLd()` in `src/lib/jsonld.ts` which replaces `<` with `\u003c` in serialized JSON-LD script blocks to prevent HTML tag breakouts and script injection.
   - Applied to `src/app/(public)/event/[slug]/page.tsx`.
   - Verified by unit tests in `src/lib/jsonld.test.ts`.

2. **Directory Privacy & Profiles Column Isolation (`R1.2`)**:
   - Replaced the overly broad `SELECT` policy on `public.profiles`. The new policy restricts direct table reads strictly to `id = auth.uid()` or administrative staff with `members.manage` or `dues.reconcile` capabilities.
   - Created the secure projection view `public.member_directory` with `WITH (security_barrier = true)`:
     - Only accessible to callers who are verified active members (`public.is_active_member()`) or administrators with `members.manage` capability.
     - Automatically excludes members who have opted out (`directory_opt_out = true`) and members whose membership is not active in the current term (`NOT public.is_active_member(p.id)`).
     - Projects only non-sensitive directory fields (`id`, `username`, `first_name`, `last_name`, `city`, `state`, `phone`, `secondary_phone`, `is_master_gardener`, `interests_experience`, `project_interests`). Sensitive columns (`street_address`, `address_line2`, `postal_code`, administrative notes, etc.) are omitted entirely from the view.
   - Added `directory_opt_out` boolean column to `public.profiles` (defaults to `false`).
   - Exposed directory opt-out control in `src/features/membership/components/profile-editor.tsx` and `src/features/auth/components/register-form.tsx`.
   - Updated `getMemberDirectory()` query in `src/features/membership/queries.ts` to query `member_directory` view.

3. **Contact Message Write Boundary (`R1.3`)**:
   - Revoked direct `INSERT` permissions on `public.contact_messages` from `anon` and `authenticated` roles.
   - Added database-level `CHECK` constraints on payload lengths (name 1-200 chars, email 3-320 chars, message 1-5000 chars, subject max 200 chars).
   - Enforced that public contact submissions proceed strictly through the validated server action `submitContactAction` via the service-role client.

4. **Trusted Audit Trail Enforcement (`R1.4`)**:
   - Revoked direct `INSERT` permissions on `public.audit_events` from `authenticated` and `anon` roles.
   - Replaced direct client inserts with the trusted `SECURITY DEFINER` stored procedure `public.log_audit_event(action, entity_type, entity_id, details)`.
   - Verified that authenticated users and pending applicants cannot forge audit logs via direct REST inserts.

5. **Login Return Destination Sanitization (`R1.5`)**:
   - Implemented `sanitizeReturnTo()` in `src/features/auth/redirects.ts`.
   - Thoroughly rejects open redirects, external URLs (`http://`, `https://`), protocol-relative paths (`//evil.com`), Windows backslash paths (`/\evil.com`, `\evil.com`), encoded traversal/separators, and control characters, falling back safely to the specified default (`/` or `/profile`).
   - Integrated into `src/features/auth/actions.ts` (`loginAction`) and `src/app/auth/callback/route.ts`.
   - Verified by unit tests in `src/features/auth/redirects.test.ts`.

6. **Payment Simulation Boundary Enforcement (`R1.6`)**:
   - Hardened `LocalSimulatedPaymentProvider` in `src/features/payments/local-provider.ts` to strictly parse and verify `process.env.NEXT_PUBLIC_SUPABASE_URL` hostname as loopback (`127.0.0.1`, `localhost`, `::1`). Fails closed on any remote or hosted URL.
   - In production (`NODE_ENV === "production"`), simulated payments fail closed unless explicit local build testing is set via `ALLOW_LOCAL_PRODUCTION_BUILD_TESTING === "true"`.
   - Ignores client-side flags (`NEXT_PUBLIC_LOCAL_PAYMENTS_ENABLED`) as authorization for server-side dues execution.
   - Verified by unit tests in `src/features/payments/simulation.test.ts`.

7. **WordPress Import Arguments & Identity Binding (`R1.7`)**:
   - Updated `scripts/import-wordpress.mjs` `parseArgs` to support `--input-dir` and `--input` interchangeably and reject unrecognized arguments.
   - Implemented `reconcileLegacyUserIdentity()` to protect against account takeover when legacy usernames match existing profiles but Auth emails differ.
   - Verified by unit tests in `tests/unit/import-binding.test.ts`.

---

## 2. Verification Commands & Results

### TypeScript Verification (`npm run typecheck`)
```bash
> sdgc@0.1.0 typecheck
> next typegen && tsc --noEmit

Generating route types...
✓ Types generated successfully
```

### Full Codebase Check (`npm run check`)
```bash
> sdgc@0.1.0 check
> npm run format:check && npm run lint && npm run typecheck && npm test

> sdgc@0.1.0 format:check
> prettier --check .
All matched files use Prettier code style!

> sdgc@0.1.0 lint
> biome lint . --error-on-warnings
Checked 166 files in 122ms. No fixes applied.

> sdgc@0.1.0 typecheck
> next typegen && tsc --noEmit
Generating route types...
✓ Types generated successfully

> sdgc@0.1.0 test
> vitest run

 ✓ src/features/membership/rules.test.ts (2 tests)
 ✓ src/features/payments/simulation.test.ts (4 tests)
 ✓ src/features/auth/redirects.test.ts (8 tests)
 ✓ src/lib/jsonld.test.ts (2 tests)
 ✓ src/lib/env.test.ts (2 tests)
 ✓ src/features/contact/validation.test.ts (3 tests)
 ✓ src/features/auth/validation.test.ts (9 tests)
 ✓ tests/unit/import-binding.test.ts (6 tests)

 Test Files  8 passed (8)
      Tests  36 passed (36)
```

### Supabase Integration Tests (`npm run test:integration`)
```bash
> sdgc@0.1.0 test:integration
> vitest run --config vitest.integration.config.ts

 ✓ tests/integration/storage.test.ts (4 tests)
 ✓ tests/integration/auth.test.ts (11 tests)
 ✓ tests/integration/payments.test.ts (6 tests)
 ✓ tests/integration/remediation-r1.test.ts (8 tests)
 ✓ tests/integration/migration.test.ts (5 tests)
 ✓ tests/integration/rls.test.ts (13 tests)
 ✓ tests/integration/admin-permissions.test.ts (11 tests)

 Test Files  7 passed (7)
      Tests  58 passed (58)
```

### Database Schema Linting (`npm run db:lint`)
```bash
> sdgc@0.1.0 db:lint
> supabase db lint --local --level warning --fail-on warning

Connecting to local database...
Linting schema: extensions
Linting schema: public

No schema errors found
{"results":[],"message":"db lint"}
```

### pgTAP Database Tests (`npm run db:test`)
```bash
> sdgc@0.1.0 db:test
> supabase test db

Connecting to local database...
/DevDrive/sdgc/supabase/tests/membership.test.sql .. ok
/DevDrive/sdgc/supabase/tests/rls.test.sql ......... ok
/DevDrive/sdgc/supabase/tests/roles.test.sql ....... ok
/DevDrive/sdgc/supabase/tests/schema.test.sql ...... ok
All tests successful.
Files=4, Tests=40,  1 wallclock secs
Result: PASS
```

---

## 3. Boundary Verification Matrix

| Ref | Boundary Description | Target | Verification Method | Result |
|---|---|---|---|---|
| R1.1 | Event JSON-LD HTML tag escaping (`\u003c`) | Next.js Page & Helper | Unit Test (`src/lib/jsonld.test.ts`) | **PASS** |
| R1.2 | Direct `profiles` SELECT isolation & sensitive column hiding | Postgres RLS & Views | Integration Test (`remediation-r1.test.ts`) | **PASS** |
| R1.2 | `member_directory` security barrier & opt-out filtering | Postgres View | Integration Test (`remediation-r1.test.ts`) | **PASS** |
| R1.3 | Revoke direct contact message insert | Postgres Grants & Constraints | Integration Test (`remediation-r1.test.ts`) | **PASS** |
| R1.4 | Revoke direct audit event insert & require RPC | Postgres Grants & RPC | Integration Test (`remediation-r1.test.ts`) | **PASS** |
| R1.5 | Sanitization of `returnTo` against open redirects | Next.js Auth Actions | Unit Test (`src/features/auth/redirects.test.ts`) | **PASS** |
| R1.6 | Payment simulation fails closed on remote / production | Payments Provider | Unit Test (`src/features/payments/simulation.test.ts`) | **PASS** |
| R1.7 | Import CLI args (`--input-dir`/`--input`) and takeover prevention | Migration CLI | Unit Test (`tests/unit/import-binding.test.ts`) | **PASS** |
