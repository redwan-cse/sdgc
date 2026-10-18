# Admin & Member Portal Verification Report & Unified Alignment Plan

**Evaluation Date:** October 18, 2026  
**Target Revision:** `v1.2` post-alignment baseline (`commit 1909c7e`)  
**Evaluation Target:** Next.js 16.4.1 (Turbopack) + Local Docker Supabase Stack (`sdgc`)  
**Input Documents Evaluated:**

1. `J:\temp\Admin+astra6.txt` (Astra 6 Dashboard & Member Portal Review)
2. `J:\temp\Admin+opus5.5.txt` (Opus 5.5 Admin System Audit & Stories)
3. `J:\temp\SDGC-Admin-and-Member-Portal-Review.md` (Visual & Architectural Portal Audit)

---

## 1. Executive Ground-Truth Claims Verification Ledger

Every claim and recommendation in the three review reports was evaluated against the active codebase. Below is the ground-truth ledger categorizing each finding as **CONFIRMED TRUE**, **ALREADY RESOLVED**, or **PROHIBITED / OUT OF SCOPE**.

### 1.1 Confirmed True Claims (Requiring Implementation)

| ID          | Review Claim                                                        | Active Code Ground Truth                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Severity        | Status             | Planned Resolution                                                                                                                                                                                                       |
| :---------- | :------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------- | :----------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ADM-V01** | **`workExperience` vs `volunteerExperience` Mapping Loss**          | In [`src/features/admin/queries.ts`](file:///J:/DevDrive/sdgc/src/features/admin/queries.ts#L108), `listAdminMembers()` maps `m.work_experience` to `workExperience`, but `AdminMemberRecord` has both and [`admin-members.tsx`](file:///J:/DevDrive/sdgc/src/features/admin/components/admin-members.tsx#L60) reads `member.volunteerExperience`. Because it is undefined, opening the modal blanks out existing volunteer text, which is then overwritten on save.                                                                                                 | **HIGH**        | **CONFIRMED TRUE** | Normalize mapping in `queries.ts`, `types.ts`, and `admin-members.tsx` so volunteer experience loads and survives save.                                                                                                  |
| **ADM-V02** | **Dues Journal Status Badge & Action Collapsing**                   | In [`src/features/admin/components/admin-dues.tsx`](file:///J:/DevDrive/sdgc/src/features/admin/components/admin-dues.tsx#L248-L253), any status that is not `confirmed` is hardcoded to render `<Badge variant="warning">Awaiting Clearance</Badge>`. In the reconciliation column (line 286), any status not `pending` is labeled `Reconciled` (even failed or refunded records). Additionally, the inline reconcile button was offered for pending card payments.                                                                                                 | **HIGH**        | **CONFIRMED TRUE** | Provide distinct status tokens: `confirmed` (green), `pending` (yellow), `failed` (red), `refunded` (purple/gray). Restrict inline check reconciliation button strictly to `method === 'check' && status === 'pending'`. |
| **ADM-V03** | **Overview Metrics Cross-Term Inflation & Fallback Placeholders**   | In [`src/features/admin/queries.ts`](file:///J:/DevDrive/sdgc/src/features/admin/queries.ts#L18-L35), `getAdminOverviewStats()` counts active members across all historical terms rather than the active term, and counts draft events in upcoming events. If a query fails, it silently defaults to 0. In [`admin-overview.tsx`](file:///J:/DevDrive/sdgc/src/features/admin/components/admin-overview.tsx#L14), hardcoded fallbacks ("48", "3", "2") render when metrics are absent. Metric cards also link to root admin lists rather than filtered queues.       | **MEDIUM-HIGH** | **CONFIRMED TRUE** | Scope active members to `status === 'approved' && term_year === currentYear`. Exclude draft events (`status === 'published'`). Return typed error state if queries fail. Link cards to filtered lists.                   |
| **ADM-V04** | **Contact Inbox State De-synchronization**                          | In [`src/features/admin/components/admin-messages.tsx`](file:///J:/DevDrive/sdgc/src/features/admin/components/admin-messages.tsx#L14-L35), the component maintains both `messages` list and `activeMessage` object in separate states. When an unread message is clicked, `handleStatusChange` runs asynchronously and updates `messages`, but can close over stale `activeMessage`, leaving the detail view showing "unread" while the list badge says "Read". "Reply via Email" is also a raw `mailto:` link presented as in-app communication.                   | **MEDIUM**      | **CONFIRMED TRUE** | Store `selectedMessageId` and derive active message from `messages`. Explicitly label email handoff as "Open in Email App (`mailto:`)". Add status filters (All, Unread, Read, Archived).                                |
| **ADM-V05** | **Member Portal Dues Route Disconnect & Empty State Fixture**       | In [`src/features/membership/components/member-shell.tsx`](file:///J:/DevDrive/sdgc/src/features/membership/components/member-shell.tsx#L133), the "Annual Dues" link routes to `/membership`, which is in the `(public)` route group, stripping the member portal shell. Furthermore, in [`src/app/(public)/membership/page.tsx`](<file:///J:/DevDrive/sdgc/src/app/(public)/membership/page.tsx#L25-L33>), if a member has not applied yet, it falls back to `FIXTURE_MEMBERSHIP` with `paymentStatus: "pending"`, misleading new users that a payment is pending. | **HIGH**        | **CONFIRMED TRUE** | Add dedicated portal route `/membership` inside `(member)` shell (or render `MemberShell` for authenticated users) with owner-scoped payment history and truthful "No payment submitted" state.                          |
| **ADM-V06** | **Member Directory Code Aliases, Identifiers & Affordances**        | In [`src/features/membership/components/member-directory.tsx`](file:///J:/DevDrive/sdgc/src/features/membership/components/member-directory.tsx#L195-L203), database codes (`beautification`, `garden_walk`, etc.) fail lookup in `PROJECT_INTEREST_CHOICES` and print raw snake_case keys. The card also displays `@username` login identifiers, uses emoji icons (`📍`, `📞`), and lacks an explicit Call button affordance.                                                                                                                                       | **MEDIUM**      | **CONFIRMED TRUE** | Map all database committee codes to human labels. Remove `@username` handles from the directory card. Replace emojis with accessible Lucide SVG icons and add a clear Call button.                                       |
| **ADM-V07** | **Event Creation Lacks Venue Selection & Missing Cancelled Status** | In [`src/features/admin/components/admin-events.tsx`](file:///J:/DevDrive/sdgc/src/features/admin/components/admin-events.tsx#L28-L35), the create event modal does not expose a venue selector, preventing venue assignment during event creation. In addition, the status selector only offers `published` and `draft`, omitting `cancelled`.                                                                                                                                                                                                                      | **MEDIUM**      | **CONFIRMED TRUE** | Add venue dropdown to event create/edit dialogs querying `public.venues`. Add `cancelled` status option with distinct UI badge.                                                                                          |
| **ADM-V08** | **Media Storage Partial Deletion Failure & Real Upload Flow**       | In [`src/features/admin/actions.ts`](file:///J:/DevDrive/sdgc/src/features/admin/actions.ts#L455-L460), `deleteMediaAssetAction` executes `storage.remove()` without checking success before deleting the database row, risking orphaned storage files. It also attempts storage removal on static `/images/...` assets. In [`admin-media.tsx`](file:///J:/DevDrive/sdgc/src/features/admin/components/admin-media.tsx#L25), "Upload" is an input for a storage path string rather than an actual file upload input, and edit modals lack image previews.            | **MEDIUM-HIGH** | **CONFIRMED TRUE** | Differentiate `/images/` static files from storage objects. Verify storage deletion response before database deletion. Add file upload handling to `admin-media.tsx` with thumbnail preview in the edit dialog.          |
| **ADM-V09** | **Accessible Dialog Semantics & Role Separation**                   | Media and event modals in admin panels lack `role="dialog"`, `aria-modal="true"`, focus containment, and Escape key dismissal. Shell navigation should also reflect server-derived role capabilities (e.g. treasurers shouldn't see editorial links).                                                                                                                                                                                                                                                                                                                | **MEDIUM**      | **CONFIRMED TRUE** | Standardize admin dialogs with accessible attributes and keyboard controls. Filter sidebar navigation items based on user's granted roles.                                                                               |

---

### 1.2 Claims Already Resolved by Today's v1.2 Commits

| Claim                                                                       | How it was Resolved                                                                                                                                    | Commit Evidence                                                                                                           |
| :-------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------ |
| **Admin profile update wipes `directory_opt_out`, secondary phone, spouse** | Upgraded `admin_update_member_profile()` SQL function with `COALESCE` and added directory opt-out, alt phone, spouse, and notes fields to admin modal. | [`2a95b0d`](file:///j:/DevDrive/sdgc/supabase/migrations/20261018014724_admin_member_privacy_notes_and_state_guards.sql)  |
| **Unpaid members can be approved**                                          | Hardened `approve_membership()` RPC to mandate confirmed dues payment or an audited waiver reason.                                                     | [`2a95b0d`](file:///j:/DevDrive/sdgc/supabase/migrations/20261018014724_admin_member_privacy_notes_and_state_guards.sql)  |
| **Reconcile allows card/failed payments**                                   | Hardened `reconcile_payment()` RPC to restrict reconciliation strictly to `payment_method = 'check'` and `status = 'pending'`.                         | [`2a95b0d`](file:///j:/DevDrive/sdgc/supabase/migrations/20261018014724_admin_member_privacy_notes_and_state_guards.sql)  |
| **Events day/month Detroit boundaries & ongoing event logic**               | Fixed ISO Detroit timestamp boundary queries and updated `isPast` condition to compare against `endsDate < now`.                                       | [`cae1b9d`](file:///j:/DevDrive/sdgc/supabase/migrations/20261018021138_add_event_category_and_seed_realistic_events.sql) |
| **Founding year contradiction**                                             | Replaced 1980 / 1978 with **1928** across all public pages, badges, captions, and history copy.                                                        | [`4adccde`](file:///j:/DevDrive/sdgc/supabase/migrations/20261018022024_content_truth_and_garden_walk_parity.sql)         |
| **Registration lacks directory opt-out & has premature redirect**           | Added `directory_opt_out` checkbox to registration; replaced 1.5s redirect with durable 3-step confirmation card.                                      | [`1909c7e`](file:///j:/DevDrive/sdgc/docs/verification/phase-09-v1.2-alignment.md)                                        |
| **Password reset fails for usernames**                                      | Upgraded `forgotPasswordAction` to resolve username OR email before calling Supabase password reset.                                                   | [`1909c7e`](file:///j:/DevDrive/sdgc/docs/verification/phase-09-v1.2-alignment.md)                                        |
| **Footer Axe WCAG contrast violation**                                      | Removed low-contrast link and replaced with public community links. 100% Axe pass across all routes.                                                   | [`1909c7e`](file:///j:/DevDrive/sdgc/docs/verification/phase-09-v1.2-alignment.md)                                        |

---

### 1.3 Discarded / Prohibited / Unwarranted Suggestions

1. **External Google Fonts**: Opus/Astra suggested checking typography imports. **PROHIBITED** by project rules: all fonts must remain strictly local via `next/font/local`.
2. **Live Stripe / Remote Supabase**: Suggestions to connect live Stripe keys or hosted Supabase. **PROHIBITED** by project rules: use only the isolated local Docker Supabase stack `sdgc` and server-controlled payment simulation.
3. **Platform Rewrite / CRM Features**: Suggestions to build a full donor CRM, attendance ticketing systems, complex recurring subscriptions, or custom chat. **DISCARDED**: Outside club scope and charter parity.

---

## 2. Unified Phase-by-Phase Implementation Plan

The plan is structured into 4 cohesive phases designed for zero regressions, strict test coverage, and clean verification.

```
Phase A: Member Profile & Roster Data Integrity (ADM-V01, ADM-V06)
   │
   ▼
Phase B: Financial Journal & Overview Metrics Precision (ADM-V02, ADM-V03, ADM-V05)
   │
   ▼
Phase C: Editorial Tools — Media Storage, Events & Contact Inbox (ADM-V04, ADM-V07, ADM-V08)
   │
   ▼
Phase D: Accessible Workspace Shell, Role-Gated Navigation & Full Verification (ADM-V09)
```

---

### Phase A: Member Profile & Roster Data Integrity

**Objective:** Guarantee that volunteer experience and all profile fields load and save without data loss, and polish member directory cards with clean human labels, icons, and privacy.

#### Tasks:

1. **Resolve `workExperience` vs `volunteerExperience` Mapping:**
   - In [`src/features/admin/queries.ts`](file:///J:/DevDrive/sdgc/src/features/admin/queries.ts): Update `listAdminMembers()` to populate `volunteerExperience: (m.work_experience as string) || (m.volunteer_experience as string) || undefined`.
   - In [`src/features/admin/components/admin-members.tsx`](file:///J:/DevDrive/sdgc/src/features/admin/components/admin-members.tsx): Ensure `handleOpenEditProfile` and `handleSaveProfile` accurately round-trip `volunteerExperience`.
2. **Normalize Project Committee Labels & Directory Privacy:**
   - In [`src/features/membership/components/member-directory.tsx`](file:///J:/DevDrive/sdgc/src/features/membership/components/member-directory.tsx):
     - Create a robust code-to-label dictionary that handles both canonical keys (`community_beautification`) and database keys (`beautification`, `workshop`, `reception`, `website`, `garden_awards`, `garden_walk`, `charitable`, `holiday`).
     - Remove the `@username` handle from the public directory card (keep user's full name and Master Gardener badge).
     - Replace raw emojis (`📍`, `📞`) with Lucide SVG icons (`MapPin`, `Phone`).
     - Add an explicit "Call" button/affordance for telephone numbers.

#### Verification & Exit Criteria:

- Unit/Integration test: Admin editing an address retains volunteer experience and all other profile fields on save and reload.
- Directory visual test: All 8 volunteer committees render clean titles; no `@username` handles displayed; emojis replaced by SVG icons.

---

### Phase B: Financial Journal & Overview Metrics Precision

**Objective:** Correct dues status mappings, enforce check-only reconciliation UI, align admin overview metrics to the current membership term, and provide a dedicated member portal dues view.

#### Tasks:

1. **Dues Journal Badges & Check Reconciliation Guard:**
   - In [`src/features/admin/components/admin-dues.tsx`](file:///J:/DevDrive/sdgc/src/features/admin/components/admin-dues.tsx):
     - Update status column to render distinct badges:
       - `confirmed`: `<Badge variant="success">Confirmed</Badge>`
       - `pending`: `<Badge variant="warning">Awaiting Clearance</Badge>`
       - `failed`: `<Badge variant="destructive">Failed</Badge>`
       - `refunded`: `<Badge variant="outline">Refunded</Badge>`
     - Update reconciliation column: Only show "Reconciled" for `status === "confirmed"`. For `failed` or `refunded`, show "Closed".
     - Restrict the inline "Reconcile" action strictly to records where `r.paymentMethod === "check" && r.status === "pending"`.
     - Display term dates inclusively ("Jan 1 – Dec 31, 2026").
2. **Current-Term Scoped Overview Metrics:**
   - In [`src/features/admin/queries.ts`](file:///J:/DevDrive/sdgc/src/features/admin/queries.ts):
     - In `getAdminOverviewStats()`, query active term year and count members where `status = 'approved'` for that specific term year.
     - Filter upcoming events to exclude drafts (`starts_at >= now && status = 'published'`).
     - Throw a typed error if database queries fail rather than masking as zeros.
   - In [`src/features/admin/components/admin-overview.tsx`](file:///J:/DevDrive/sdgc/src/features/admin/components/admin-overview.tsx):
     - Remove fallback placeholder numbers ("48", "3", "2"). If metrics are unavailable, render "—" or an explicit notice.
     - Update metric card links to deep-link to filtered list views (`/admin/members?status=pending`, `/admin/dues?status=pending`, etc.).
3. **Dedicated Member Portal Dues Route:**
   - In [`src/app/(member)/dues/page.tsx`](<file:///J:/DevDrive/sdgc/src/app/(member)/dues/page.tsx>) (or integrating into `(member)` shell):
     - Render `DuesCard` inside `MemberShell` with the member's current term status and owner-scoped payment history.
     - Eliminate the `FIXTURE_MEMBERSHIP` fallback so unsubmitted applicants see a truthful "No payment submitted" state with options to pay by check or simulate online payment.
     - Update [`src/features/membership/components/member-shell.tsx`](file:///J:/DevDrive/sdgc/src/features/membership/components/member-shell.tsx) navigation to point to `/dues`.

#### Verification & Exit Criteria:

- Integration test: Dues journal properly displays failed, refunded, pending, and confirmed states; card payments cannot be reconciled as checks.
- Admin overview test: Draft events and historical term members do not inflate operational counts.
- Member portal test: Clicking "Annual Dues" keeps user inside `MemberShell`; new members see accurate "No payment submitted" state.

---

### Phase C: Editorial Tools — Media Storage, Events & Contact Inbox

**Objective:** Harden media deletion against orphaned storage files, support real photo uploads, enable venue selection and cancellation in events, and fix contact inbox state synchronization.

#### Tasks:

1. **Media Storage Deletion & Upload Flow:**
   - In [`src/features/admin/actions.ts`](file:///J:/DevDrive/sdgc/src/features/admin/actions.ts):
     - In `deleteMediaAssetAction`, check whether `storage_path` starts with `/images/` (static repository asset) or is a managed object in `club-media`.
     - For managed objects, verify `supabase.storage.from("club-media").remove(...)` succeeds before deleting the database row.
   - In [`src/features/admin/components/admin-media.tsx`](file:///J:/DevDrive/sdgc/src/features/admin/components/admin-media.tsx):
     - Add file picker `<input type="file" accept="image/*" />` allowing operators to upload real image files directly into the local Supabase `club-media` bucket.
     - Display image thumbnail preview in the edit dialog.
2. **Events Venue Selection & Cancellation Status:**
   - In [`src/features/admin/components/admin-events.tsx`](file:///J:/DevDrive/sdgc/src/features/admin/components/admin-events.tsx):
     - Add a venue selection dropdown in both "Add Event" and "Edit Event" modals populated from `public.venues`.
     - Add `cancelled` to the status selector (`published`, `draft`, `cancelled`).
     - Display a distinct status badge for cancelled events.
3. **Contact Inbox State Synchronization:**
   - In [`src/features/admin/components/admin-messages.tsx`](file:///J:/DevDrive/sdgc/src/features/admin/components/admin-messages.tsx):
     - Store `selectedMessageId: string | null` and derive `activeMessage = messages.find(m => m.id === selectedMessageId)`.
     - When marking a message as read or archived, update `messages` so both list badge and detail view update synchronously.
     - Relabel "Reply via Email" as "Open in Email App (`mailto:`)" with clear visual indication.

#### Verification & Exit Criteria:

- Integration test: Deleting managed media verifies storage removal; static images are safely unlinked without storage errors.
- Event management test: Creating an event assigns venue ID; cancelling an event renders cancelled badge.
- Inbox test: Clicking an unread message marks it read and updates both list badge and detail view immediately.

---

### Phase D: Accessible Workspace Shell, Role-Gated Navigation & Full Verification

**Objective:** Standardize accessible dialog patterns, enforce role-based navigation visibility, and execute the full automated verification suite.

#### Tasks:

1. **Accessible Dialogs:**
   - Standardize modals in `admin-members.tsx`, `admin-events.tsx`, `admin-media.tsx`, and `admin-content.tsx` with:
     - `role="dialog"` and `aria-modal="true"`.
     - Accessible dialog titles (`aria-labelledby`).
     - Keyboard `Escape` key listener to dismiss modal safely.
2. **Role-Gated Shell Navigation:**
   - In [`src/features/admin/components/admin-shell.tsx`](file:///J:/DevDrive/sdgc/src/features/admin/components/admin-shell.tsx):
     - Hide Editorial links (`Events`, `Content`, `Media`) for pure `treasurer` role.
     - Hide Financial links (`Dues`, `Roster`) for pure `editor` role.
     - Retain full access for `admin` and combined roles.
3. **Full Automated Quality & Regression Gates:**
   - Run `npm run check` (formatting, linting, typecheck, unit tests).
   - Run `npm run test:integration` (all database and API integration tests).
   - Run `npm run db:lint` and `npm run db:test` (Supabase schema and pgTAP tests).
   - Run `npm run build` (Turbopack production build).
   - Run `npx playwright test --workers=4` (full E2E test suite across desktop and mobile).
   - Record results in `docs/verification/phase-10-admin-member-portal-alignment.md`.

---

## 3. Risk & Safety Guardrails

- **Database Safety**: All schema or function changes must use `npx supabase migration new <name>`; never drop production/seed tables.
- **Local Isolation**: Run only against local Docker Supabase stack `sdgc` (`localhost:54321-54324`).
- **Secret Isolation**: Never expose service-role key or JWT secrets to client code or documentation.
- **Timezone**: All event and membership term computations must strictly use `America/Detroit`.
- **Theme Integrity**: Preserve tweakcn green light/dark theme, local typography, and responsive drawer patterns.
