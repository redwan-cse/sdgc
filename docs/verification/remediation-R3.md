# Remediation Verification: Work Package R3 - Annual Membership & Calendar Parity

**Date:** 2026-10-16  
**Status:** COMPLETE  
**Environment:** Local Docker Supabase stack (`sdgc`), Node.js 24, Next.js 16.4.1

---

## 1. Scope & Objectives

Remediate gaps identified in Work Package R3 of `docs/audit/ANTIGRAVITY-NEXT-STEPS.md`:

1. **Dynamic Michigan Term & Rate Resolution**:
   - Eliminate hardcoded year `2026` and `$50.00` rates from `auth/session.ts`, `membership/queries.ts`, `payments/queries.ts`, `payments/actions.ts`, and public/member pages (`/join`, `/membership`, `/directory`, `/admin/overview`).
   - Dynamically look up active and upcoming terms by Michigan calendar year (`America/Detroit`).
2. **Distinct Membership State Model**:
   - Model and preserve all five distinct application/membership states (`pending`, `approved`, `rejected`, `expired`, `suspended`) across database, types, actions, and UI without collapsing `expired` or `suspended` to `rejected`.
3. **Calendar Date Boundaries in `America/Detroit`**:
   - Fix date grouping in `events/calendar.ts` and `event-day-view.tsx` so near-midnight UTC events, Dec 31 / Jan 1 boundaries, spring/fall DST transitions, multi-day spans, and all-day midnight boundaries correctly map to their Michigan day.
4. **URL Search Parameters & Calendar Error Distinctions**:
   - Consistently preserve search query, category, view, and date parameters across view switcher (`list`, `month`, `day`).
   - Propagate database errors distinctly from an empty calendar in event queries and UI components.
5. **Treasurer Capability & Concurrency Protection**:
   - Align application capability checks with the database RPC capability matrix so the Treasurer persona (`memberships.approve`) can review and approve pending memberships.
   - Enforce optimistic concurrency control (`expectedVersion` mismatch returns `Stale version conflict`).

---

## 2. Changes Implemented

### 2.1 Calendar Timezone & Date Boundary Engine

- **`src/features/events/calendar.ts`**:
  - Implemented `getDetroitDateString(isoString, timeZone = "America/Detroit")` using `Intl.DateTimeFormat` with `en-CA` locale for strict `YYYY-MM-DD` formatting.
  - Implemented `eventOccursOnDate(event, targetDateStr, timeZone)` to determine date interval intersection across multi-day spans and all-day events using Detroit date boundaries.
  - Updated `getMonthMatrix(year, month, events, timeZone)` to group events onto calendar cells using `eventOccursOnDate`.
- **`src/features/events/calendar.test.ts`**:
  - Authored comprehensive unit regression suite covering:
    - Normal daytime events
    - Near-midnight UTC events (10:00 PM July 10 EDT is 02:00 UTC July 11)
    - Dec 31 / Jan 1 boundary in Detroit (10:00 PM Dec 31 EST is 03:00 UTC Jan 1)
    - Spring DST transition (March 8 EDT spring forward)
    - Fall DST transition (November 1 EST fall back)
    - Multi-day festival spans (July 10–12 spanning July 10, 11, 12)
    - All-day midnight boundaries (04:00 UTC July 11 to 04:00 UTC July 12)
  - All 7 unit tests pass.

### 2.2 Event Views, Filtering, and URL State Synchronization

- **`src/features/events/components/event-view-selector.tsx`**: Updated view links to preserve active `q` (search query) and `category` parameters across `list`, `month`, and `day` view transitions.
- **`src/features/events/components/event-list-view.tsx`**: Preserves search query when filtering or resetting views.
- **`src/features/events/components/event-month-view.tsx` & `event-day-view.tsx`**:
  - Updated to consume searchParams and synchronize calendar state with URL parameters.
  - Added explicit database error banner separating database failures from empty calendars.
- **`src/features/events/queries.ts`**:
  - Uses `getDetroitDateString` to default to current Michigan date.
  - Added bounded limit of 100 events and propagates database error message in `EventPage.error`.
- **`src/app/(public)/events/day/page.tsx` & `month/page.tsx`**: Updated to pass dynamic `searchParams` and error states.

### 2.3 Dynamic Membership Terms, Dues Rates, and States

- **`src/features/membership/types.ts` & `src/features/auth/types.ts`**:
  - Typed all 5 membership statuses: `"pending" | "approved" | "rejected" | "expired" | "suspended"`.
- **`src/features/membership/rules.ts`**:
  - Updated `isMembershipActive` to check `status === "approved"` and `!suspended`.
- **`src/features/payments/queries.ts`**:
  - `getCurrentTermInfo` queries `membership_terms` dynamically by Michigan year and date range fallback.
- **`src/features/payments/actions.ts`**:
  - `submitDuesPaymentAction` computes target year via `getMembershipYear()` and formats dynamic payment amounts.
- **`src/features/membership/queries.ts`**:
  - `getOwnMembershipSummary` dynamically resolves current Michigan term, reads authoritative `dues_cents`, and maps distinct `isSuspended` and exact `ApplicationStatus`.
- **`src/features/auth/session.ts`**:
  - Dynamically computes Michigan year and evaluates `isSuspended` and `isActiveMember` for all 5 statuses.
- **`src/app/(public)/join/page.tsx` & `membership/page.tsx`**:
  - Dynamically fetch current term year and rate from `getCurrentTermInfo`.
- **`src/features/membership/components/dues-card.tsx`**:
  - Displays dynamic dues amount and term year instead of hardcoded values.
- **`src/app/(member)/directory/page.tsx`**:
  - Uses dynamic `getMembershipYear()` in pending access notice.
- **`src/features/admin/components/admin-overview.tsx`**:
  - Updated dashboard label to `Active Members (Current Term)`.

### 2.4 Treasurer Capability & Optimistic Concurrency Control

- **`src/features/auth/authorization.ts`**:
  - Updated `hasCapability` and `requireCapability` to accept `Capability | readonly Capability[]`, returning true if the user possesses any of the required capabilities.
- **`src/features/admin/actions.ts`**:
  - `approveMembershipAction` authorizes `["members.manage", "memberships.approve"]`.
- **`src/features/admin/queries.ts`**:
  - `getAdminMembers` authorizes `["members.manage", "memberships.approve"]` and preserves distinct application statuses without collapsing to pending.
- **`src/app/(admin)/admin/members/page.tsx`**:
  - Uses `requireCapability(["members.manage", "memberships.approve"])`.

---

## 3. Automated Verification Evidence

### 3.1 Calendar Unit Regression Suite (`src/features/events/calendar.test.ts`)

```
✓ src/features/events/calendar.test.ts (7 tests) 40ms
  ✓ pins standard daytime event to Michigan day
  ✓ pins near-midnight UTC event to Michigan day (2026-07-11T02:00:00Z is 10 PM July 10 in Detroit)
  ✓ pins December 31 / January 1 transition in Detroit (2027-01-01T03:00:00Z is 10 PM Dec 31, 2026 in Detroit)
  ✓ correctly handles spring DST transition in Detroit (March 8, 2026)
  ✓ correctly handles fall DST transition in Detroit (November 1, 2026)
  ✓ pins multi-day event across all spanned Michigan dates
  ✓ pins all-day midnight boundary events
```

### 3.2 Integration Test Suite (`tests/integration/remediation-r3.test.ts`)

```
✓ tests/integration/remediation-r3.test.ts (7 tests) 1562ms
  ✓ R3: Annual Membership & Calendar Remediation Regression Suite (7)
    ✓ Dynamic Michigan Term Resolution & Dues Rates (1)
      ✓ dynamically resolves current Michigan membership term and dues rate from database 44ms
    ✓ Distinct Membership State Preservation (2)
      ✓ preserves distinct pending, approved, rejected, expired, and suspended statuses in database 716ms
      ✓ evaluates isMembershipActive correctly across all 5 membership states 1ms
    ✓ Treasurer Persona Approval Capability vs Editor / Member Denial (3)
      ✓ allows treasurer to approve pending membership via approve_membership RPC 185ms
      ✓ denies editor from approving pending membership via approve_membership RPC 175ms
      ✓ denies regular member from approving pending membership via approve_membership RPC 187ms
    ✓ Optimistic Concurrency Control on Membership Approval (1)
      ✓ fails with Stale version conflict when expectedVersion does not match current version 178ms
```

### 3.3 Full Test Matrix

1. **`npm run check`**:
   - Prettier formatting: PASS
   - Biome linting: 170 files checked, 0 errors, 0 warnings: PASS
   - TypeScript `tsc --noEmit`: PASS
   - Unit tests (9 test files, 44 tests): PASS
2. **`npm run test:integration`**:
   - 9 test files, 69 integration tests: PASS
3. **`npm run db:test`**:
   - 4 pgTAP files, 40 tests: PASS
4. **`npm run build`**:
   - Next.js 16.4.1 Turbopack production build: 28 static/dynamic routes compiled: PASS

---

## 4. Work Package Completion Checklist

- [x] Remove fixed year 2026 and static USD 50 amount from signup, session, membership, payments, and UI.
- [x] Support current Michigan term dynamically from database.
- [x] Model and preserve distinct `pending`, `approved`, `rejected`, `expired`, and `suspended` membership states.
- [x] Correct event date grouping to `America/Detroit` boundaries (near-midnight UTC, Dec 31 / Jan 1, DST transitions, multi-day, all-day).
- [x] Preserve URL state across event view switching and distinguish database failure from empty calendar.
- [x] Align treasurer approval permissions across page, query, action, and database RPC.
- [x] Enforce optimistic concurrency control on membership approval.
- [x] Write and pass regression suites before completing work package.
