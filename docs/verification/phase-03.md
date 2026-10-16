# Phase 03 Verification: Reproducible Supabase Schema, RLS, Storage, Seeds, & Tests

Date: 2026-10-16  
Environment: Node v24.19.0, npm 11.17.0, Next.js 16.4.1 (Turbopack), Vitest 5.0.5, Supabase CLI 2.121.0, PostgreSQL 15.8 (Docker), Windows 11

## Verification Summary

| Check                         | Command                    | Actual Outcome                                                                                                                              | Status |
| ----------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| Database Reset                | `npm run db:reset`         | Replayed empty-to-working database; 6 migrations applied in exact chronological sequence; seed data inserted                                | PASS   |
| Schema Lint                   | `npm run db:lint`          | 0 errors, 0 warnings across `public` and `extensions` schemas                                                                               | PASS   |
| pgTAP Database Tests          | `npm run db:test`          | 4 test suites (`membership.test.sql`, `rls.test.sql`, `roles.test.sql`, `schema.test.sql`), 39/39 tests passed                              | PASS   |
| Real-Client Integration Tests | `npm run test:integration` | 2 test suites (`rls.test.ts`, `storage.test.ts`), 17/17 tests passed with authenticated tokens and anonymous client                         | PASS   |
| Synthetic Provisioning        | `npm run db:provision`     | Provisioned 6 synthetic personas in auth, profiles, roles, and memberships; seeded storage objects; wrote `tests/.auth/local-fixtures.json` | PASS   |
| Database TypeScript Types     | `npm run db:types`         | Regenerated `src/types/database.ts` from live local schema with 0 drift                                                                     | PASS   |
| Full Code Check               | `npm run check`            | Prettier clean, Biome clean (108 files, 0 warnings, 0 errors), Next.js route typegen clean, TypeScript no errors, 16 unit tests passed      | PASS   |
| Production Build              | `npm run build`            | Next.js Turbopack build succeeded in ~1.6s; all 23 static/dynamic routes compiled cleanly                                                   | PASS   |
| E2E & WCAG Audits             | `npm run test:e2e`         | 50/50 Playwright tests passed across Desktop and Mobile viewports with 0 critical/serious a11y violations                                   | PASS   |

---

## Migrations Delivered & Applied

All database structures are codified in committed, reproducible migration files in `supabase/migrations/`:

1. [`20261015172658_content_and_events.sql`](file:///J:/DevDrive/sdgc/supabase/migrations/20261015172658_content_and_events.sql):
   - Tables: `venues`, `events`, `pages`, `site_settings`, `media_assets`, `albums`, `album_items`, `legacy_mappings`.
   - Constraints: Valid start/end event ranges, unique legacy slug mappings, nonnegative sort orders, cascade deletions.
2. [`20261016022434_identity_and_membership.sql`](file:///J:/DevDrive/sdgc/supabase/migrations/20261016022434_identity_and_membership.sql):
   - Tables: `project_interests` (seeded with 8 legacy civic project interests), `profiles` (with case-insensitive normalized username, phone, address, and Feb 29 leap-day calendar check constraint), `profile_interests`, `membership_terms`, `memberships`.
   - Constraints: One active membership per user per year term (`unique(user_id, term_id)`).
3. [`20261016025243_payments_and_contact.sql`](file:///J:/DevDrive/sdgc/supabase/migrations/20261016025243_payments_and_contact.sql):
   - Tables: `payments` (strict `check(amount_cents >= 0)`, idempotent provider transaction references), `contact_messages` (honeypot detection, read tracking).
4. [`20261016025317_rbac_and_audit.sql`](file:///J:/DevDrive/sdgc/supabase/migrations/20261016025317_rbac_and_audit.sql):
   - Tables: `user_roles` (admin, editor, treasurer), `audit_events` (append-only audit log).
   - Security Functions: `has_role(role_name, user_id)`, `has_capability(capability_name, user_id)`, `is_active_member(user_id)`.
   - Triggers: `protect_last_admin` (prevents deletion or role downgrade of the sole remaining administrator).
5. [`20261016025339_rls_and_grants.sql`](file:///J:/DevDrive/sdgc/supabase/migrations/20261016025339_rls_and_grants.sql):
   - Row-Level Security enabled on all 17 public tables.
   - Least-privilege `GRANT` statements: `anon` granted only read access to published content, venues, terms, and insertion into contact messages. Private tables denied to `anon`.
   - RLS Policies: Profile self-read/update, member-only directory read, editor content/events management, treasurer dues reconciliation, admin full management.
6. [`20261016025356_storage_and_media.sql`](file:///J:/DevDrive/sdgc/supabase/migrations/20261016025356_storage_and_media.sql):
   - Storage bucket: `club-media` configured as private (`public: false`) so all downloads enforce `storage.objects` RLS.
   - Policies: Public can read non-private media paths (`(storage.foldername(name))[1] is distinct from 'private'`), staff with `media.manage` capability can read private documents and upload/modify media assets.

---

## Test Suites & Evidence

### 1. pgTAP Database Tests (`supabase test db`)

- **`supabase/tests/schema.test.sql`**: Verifies all 17 tables, foreign keys, constraints (leap year birth dates, username lowercase check, event time order, nonnegative payment amount). (16 tests — PASS)
- **`supabase/tests/roles.test.sql`**: Verifies capability mapping for editor, treasurer, admin, and last-admin deletion prevention trigger. (7 tests — PASS)
- **`supabase/tests/membership.test.sql`**: Verifies unique term years, single membership per user per term, valid status enum, active member function. (5 tests — PASS)
- **`supabase/tests/rls.test.sql`**: Verifies anonymous and authenticated RLS evaluation directly in Postgres. (11 tests — PASS)
- **Total: 39 tests — 0 failures.**

### 2. Real-Client Integration Tests (`npm run test:integration`)

Executed with real network clients and real JWT tokens against local Supabase:

- **`tests/integration/rls.test.ts`**:
  - Anonymous reading published content & venues: PASS
  - Anonymous reading draft pages/events: DENIED (empty)
  - Anonymous reading profiles/rosters: DENIED (Postgres 42501 permission denied)
  - Anonymous reading contact messages & payments: DENIED (Postgres 42501 permission denied)
  - Anonymous reading audit events & user roles: DENIED (Postgres 42501 permission denied)
  - Member A updating own profile: PASS
  - Member A updating Member B's profile: DENIED (zero rows affected; profile B untouched)
  - Member granting self admin role: DENIED
  - Member approving self membership: DENIED
  - Member forging payment confirmation: DENIED
  - Admin reading audit events & roles: PASS
  - Treasurer reading payments: PASS
  - Editor reading draft content: PASS
- **`tests/integration/storage.test.ts`**:
  - Anonymous reading public media: PASS
  - Anonymous reading private media: DENIED (error returned)
  - Regular member uploading to public media: DENIED
  - Editor uploading media: PASS
- **Total: 17 integration tests — 0 failures.**

### 3. MCP Server Integration

- Built-in Supabase MCP server configured over stdio bridge [`scripts/supabase-mcp-bridge.mjs`](file:///J:/DevDrive/sdgc/scripts/supabase-mcp-bridge.mjs) connected to `http://127.0.0.1:54321/mcp`.
- Registered schemas for `list_tables`, `execute_sql`, `apply_migration`, `get_advisors`, `get_publishable_keys`, `generate_typescript_types` in `C:\Users\redwan\.gemini\antigravity-ide\mcp\supabase/`.
- Configured in `.agent/mcp_config.json` and `.agents/mcp_config.json`.
