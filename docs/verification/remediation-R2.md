# Remediation Verification: Work Package R2 - Signup, Recovery, and Profile Parity

**Date:** 2026-10-16  
**Status:** COMPLETE  
**Environment:** Local Docker Supabase stack (`sdgc`), Node.js 24, Next.js 16.4.1

---

## 1. Scope & Objectives

Remediate gaps identified in Work Package R2 of `docs/audit/ANTIGRAVITY-NEXT-STEPS.md`:

1. **Unconfirmed Signup Provisioning**: Provision profile, project interests, and pending membership row upon registration even before email confirmation, ensuring no registration state is lost.
2. **Email Confirmation & Password Recovery Flows**: Implement a dedicated `/auth/confirm` route handler supporting OTP tokens (`token_hash`) and PKCE exchange, validating against local Mailpit capture.
3. **Profile Schema Parity**:
   - Split single `interests_experience` field into `gardening_interests` and `volunteer_experience`.
   - Restore Address Line 2 (`address_line2`) in registration form and profile editor.
   - Update `public.member_directory` security barrier view to expose both fields cleanly.
4. **Atomic Profile Mutation**: Implement an atomic `update_member_profile` RPC transaction updating profile columns and project interests in a single database transaction.
5. **Exact Username Normalization**: Enforce case normalization with `lower(username)` unique index and exact `.eq("username", ...)` lookup, eliminating SQL `ILIKE` wildcard `_` collisions.
6. **Fixture Member Removal**: Eliminate `FIXTURE_MEMBER` fallback from `/profile/page.tsx` so authenticated users without profiles see an error rather than mock data.

---

## 2. Changes Implemented

### 2.1 Database & Migrations

- **Migration**: `supabase/migrations/20261016150653_signup_and_profile_parity.sql`
  - Added `gardening_interests` (text) and `volunteer_experience` (text) to `public.profiles`, backfilling from `interests_experience`.
  - Created unique index `profiles_username_lower_idx` on `lower(username)`.
  - Recreated `public.member_directory` view to expose `gardening_interests` and `volunteer_experience`.
  - Implemented `handle_new_user()` `SECURITY DEFINER` trigger function on `auth.users` to automatically and idempotently provision `profiles`, `profile_interests`, and initial pending `memberships` using registration metadata.
  - Implemented atomic `update_member_profile(...)` RPC function.
- Regenerated `src/types/database.ts` via `npm run db:types`.

### 2.2 Auth & Email Handling

- **`/auth/confirm/route.ts`**: Implemented route handler handling both PKCE code exchange and OTP verification (`token_hash` / `token`) with strict `sanitizeReturnTo` protection.
- **`/auth/callback/route.ts`**: Added recovery and OTP token support.
- **`src/features/auth/actions.ts`**:
  - `resolveIdentifierToEmail`: Normalizes usernames to lowercase and uses exact `.eq("username", normalized)` rather than `ILIKE`.
  - `registerAction`: Passes complete metadata and sets `emailRedirectTo: "/auth/confirm?next=/profile"`.

### 2.3 Profile & Directory Components

- **`src/features/membership/types.ts` & `validation.ts`**: Added `gardeningInterests` and `volunteerExperience` with 2000-character caps; updated schemas.
- **`src/features/membership/actions.ts`**: Updated `updateOwnProfileAction` to call atomic `update_member_profile` RPC.
- **`src/features/membership/queries.ts`**: Updated `getOwnProfile` and `getMemberDirectory` to return separated fields.
- **`src/features/auth/components/register-form.tsx`**: Restored Address Line 2 (`reg-address2`) and separated Gardening Interests from Work & Volunteer Experience.
- **`src/features/membership/components/profile-editor.tsx`**: Added separate textareas for Gardening Interests and Work/Volunteer Experience.
- **`src/app/(member)/profile/page.tsx`**: Removed `FIXTURE_MEMBER` fallback; renders a user-friendly error state when profile record is absent.
- **`scripts/import-wordpress.mjs`**: Updated import mappings to populate `gardening_interests` and `volunteer_experience` and normalize usernames.

---

## 3. Automated Verification Evidence

### 3.1 Integration Test Suite (`tests/integration/remediation-r2.test.ts`)

Run command: `npm run test:integration`

```
✓ tests/integration/remediation-r2.test.ts (4 tests) 1020ms
  ✓ R2: Signup, Recovery, and Profile Parity Regression Suite (4)
    ✓ idempotently provisions profile, project interests, and pending membership for unconfirmed signup
    ✓ atomically updates profile and project interests including Address Line 2 and separate gardening/volunteer interests
    ✓ exact username lookup avoids SQL ILIKE wildcard underscore bug and enforces case normalization
    ✓ end-to-end signup confirmation and password recovery via local Mailpit capture (402ms)
```

### 3.2 Database Verification (pgTAP & Linter)

- `npm run db:lint`: 0 schema errors found.
- `npm run db:test`: All 4 test files and 40 subtests passed:
  - `supabase/tests/membership.test.sql`: PASS
  - `supabase/tests/rls.test.sql`: PASS
  - `supabase/tests/roles.test.sql`: PASS
  - `supabase/tests/schema.test.sql`: PASS

### 3.3 Quality Gates

- `npm run format:check`: PASS (All matched files use Prettier style).
- `npm run lint`: PASS (`biome lint . --error-on-warnings` checked 168 files in 117ms; 0 warnings, 0 errors).
- `npm run typecheck`: PASS (`next typegen && tsc --noEmit` completed with 0 errors).
- `npm test`: PASS (8 test files, 37 unit tests passing).
- `npm run build`: PASS (Turbopack production build optimized in 8.3s).
