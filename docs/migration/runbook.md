# WordPress Migration Runbook

## Overview

This runbook guides technical operators through the migration of legacy WordPress content, events, venues, media assets, and member records into the modern Next.js + Supabase architecture for the **Saugatuck Douglas Garden Club (SDGC)**.

All procedures adhere to strict security constraints:

- **Local-Only Docker Environment:** The migration tool strictly blocks remote or hosted Supabase targets (`*.supabase.co`).
- **No Raw Password Imports:** WordPress `phpass` password hashes are never imported into Supabase Auth.
- **XSS Sanitization:** All raw post HTML is sanitized to remove scripts, iframes, and inline event handlers.
- **Replay Idempotency:** The import process uses deterministic unique keys and `legacy_mappings` to ensure multiple executions produce zero duplicate records.

---

## Prerequisites

1. **Local Environment:**
   - Node.js v24.x, npm v11.x
   - Local Docker-based Supabase running (`npm run db:status` indicates healthy containers on port `54321`)
2. **Export Files:**
   - Synthetic export fixtures reside in `tests/fixtures/synthetic-export/`
   - Real authorized production exports must be placed in git-ignored `imports/private/` (never committed to repository)
3. **Environment Variables:**
   - Local `.env.local` containing `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`

---

## Step-by-Step Migration Procedure

### Step 1: Pre-Flight Verification & Dry-Run

Run the migration script in default dry-run mode against the export directory:

```bash
node scripts/import-wordpress.mjs --dry-run --input tests/fixtures/synthetic-export
```

**Expected Output:**

- SHA-256 integrity hash calculated for every JSON export file.
- Entity counts processed (Pages, Venues, Events, Media, Users, Legacy Mappings).
- Sanitization warnings for suspicious HTML markup.
- Password hash rejection warnings confirming accounts will undergo secure invitation/reset.
- Zero-PII console report.

### Step 2: Live Local Import Execution

Execute the database writes against the local Supabase instance:

```bash
node scripts/import-wordpress.mjs --apply --input tests/fixtures/synthetic-export
```

**What Occurs:**

1. Venues are inserted into `public.venues`.
2. Pages are sanitized and upserted into `public.pages`.
3. Events are sanitized and linked to venue UUIDs in `public.events`.
4. Media assets are recorded in `public.media_assets`.
5. Auth user records are provisioned with temporary invitation flags (never using WordPress hashes) and profiles populated in `public.profiles`.
6. Member project interests and annual membership term records are linked.
7. Legacy URLs are registered in `public.legacy_mappings`.

### Step 3: Replay Idempotency Verification

Run the live import a second time using the exact same arguments:

```bash
node scripts/import-wordpress.mjs --apply --input tests/fixtures/synthetic-export
```

**Success Criteria:**

- 0 duplicate rows created.
- Existing rows are updated in place.
- Entity counts remain identical.

### Step 4: Route Audit & Redirect Verification

Start the local application (`npm run dev` or `npm run build && npm run start`), then run:

```bash
node scripts/audit-routes.mjs http://localhost:3000
```

**Assertions:**

- Legacy routes (e.g., `/aboutourclub`, `/becomeamember`, `/wp-login.php`, `/wp-admin`) issue permanent 308 redirects.
- Query parameters survive redirects without truncation (`/becomeamember?source=poster` -> `/join?source=poster`).
- No redirect loops detected.
- Unknown URLs return valid 404 responses.

---

## Troubleshooting & Incident Response

| Symptom                                                                  | Root Cause                                    | Resolution                                                                                 |
| :----------------------------------------------------------------------- | :-------------------------------------------- | :----------------------------------------------------------------------------------------- |
| `CRITICAL SECURITY VIOLATION: Hosted or remote Supabase target rejected` | Script was invoked with a remote Supabase URL | Migration is only authorized for `127.0.0.1` or `localhost`. Verify `--supabase-url` flag. |
| `Media asset source file missing`                                        | Export archive omitted physical media asset   | Expected warning. Asset metadata is safely captured; fallback placeholder is served.       |
| `Auth creation failed: User already registered`                          | Replay encountered existing auth email        | Script automatically catches and links profile to existing auth record.                    |
