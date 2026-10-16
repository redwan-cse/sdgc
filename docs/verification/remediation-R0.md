# Remediation R0 Verification: Healthy, Reproducible Verification Environment

**Execution Date:** October 16, 2026  
**Target:** Local Docker Supabase Stack (`sdgc`) & Integration Test Infrastructure

---

## 1. Local Container Port Bindings Inspection

The running containers were inspected with `docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"`:

- `supabase_db_sdgc`: Port `0.0.0.0:54322->5432/tcp` (Healthy)
- `supabase_kong_sdgc`: Port `0.0.0.0:54321->8000/tcp` (Healthy)
- `supabase_studio_sdgc`: Port `0.0.0.0:54323->3000/tcp` (Healthy)
- `supabase_inbucket_sdgc`: Port `0.0.0.0:54324->8025/tcp` (Healthy)
- Other project containers (`sb-scratch`) remained untouched and unpruned.

Service connectivity was directly verified:

- Auth health endpoint `http://127.0.0.1:54321/auth/v1/health` responded `HTTP 200`.

---

## 2. Fail-Fast Loopback Preflight Guardrails

Replaced substring checks with strict parsed `URL.hostname` validations:

1. `scripts/provision-local.mjs`:
   ```javascript
   const parsedUrl = new URL(supabaseUrl);
   if (parsedUrl.hostname !== "127.0.0.1" && parsedUrl.hostname !== "localhost") {
     console.error(
       "FATAL: Provisioning only permitted against local loopback Supabase stack. Got hostname:",
       parsedUrl.hostname,
     );
     process.exit(1);
   }
   ```
2. `tests/integration/setup.ts`:
   ```typescript
   const parsedUrl = new URL(supabaseUrl);
   if (parsedUrl.hostname !== "127.0.0.1" && parsedUrl.hostname !== "localhost") {
     throw new Error(
       `Integration tests only permitted against local loopback Supabase stack. Target hostname was: ${parsedUrl.hostname}`,
     );
   }
   ```

---

## 3. Negative Assertion Hardening

Updated policy test assertions in `tests/integration/rls.test.ts` and `tests/integration/payments.test.ts`:

- Replaced synthetic/random UUID foreign keys (`crypto.randomUUID()`) with valid, existing foreign key references (`term_id` and `membership_id`).
- Asserted the exact permission denial code and error message (`error.code === "42501"` or `/violates row-level security|permission denied/i`) rather than generic `error != null`, ensuring foreign-key constraint errors cannot masquerade as RLS denial passes.

---

## 4. Disposable Rehearsal & Verification Results

Executed full replay from scratch:

```powershell
npm run db:reset; npm run db:provision
```

Output:

- All migrations applied cleanly:
  - `20261015172658_content_and_events.sql`
  - `20261016022434_identity_and_membership.sql`
  - `20261016025243_payments_and_contact.sql`
  - `20261016025317_rbac_and_audit.sql`
  - `20261016025339_rls_and_grants.sql`
  - `20261016025356_storage_and_media.sql`
  - `20261016052755_directory_and_admin_operations.sql`
- Seeds applied cleanly from `supabase/seed.sql`.
- Synthetic personas provisioned cleanly to `tests/.auth/local-fixtures.json`.

Verification Gates:

1. `npm run db:lint`: **0 schema errors** (extensions & public).
2. `npm run db:test`: **4 files, 39 tests passed** (pgTAP).
3. `npm run test:integration`: **6 files, 50 tests passed** (Vitest).
