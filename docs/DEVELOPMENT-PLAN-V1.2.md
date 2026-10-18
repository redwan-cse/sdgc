# SDGC Development Plan v1.2 — UI/UX, Parity & Data Integrity Alignment

**Context & Baseline:** Post-v1.1 Release (`commit 6967d1c`). Built from the independent reviews of Astra 6, Opus 5.5, and the detailed UI/UX & Parity Review (`docs/reviews/`).
**Target Environment:** Local Docker Supabase (`sdgc`), Next.js 16 App Router, Node 24, strict TypeScript, Tailwind CSS 4, tweakcn theme, local fonts. No remote Supabase, no live Stripe, no production email.

---

## 1. Review Claims Verification Ledger

The 3 reviews evaluated screenshots of all public pages, forms, and administrative panels alongside the legacy WordPress site (<https://saugatuckdouglasgardenclub.com/>). Below is the ground-truth verification of their findings against the active codebase.

| ID      | Review Claim                                                    | Codebase Ground Truth                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Status                     | Action Required                                                                                                                                                                          |
| ------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A01** | **Admin profile edit overwrites privacy & notes**               | In [`src/features/admin/actions.ts`](file:///j:/DevDrive/sdgc/src/features/admin/actions.ts#L366-L378), `adminUpdateMemberProfileAction` passes `input.directoryOptOut ?? false`, `input.altPhone                                                                                                                                                                                                                                                                                                                                                                                      |                            | ""`, `input.spouseFirstName                                                                                                                                                              |     | ""`to RPC`admin_update_member_profile`. Because the admin modal omits these fields, it clobbers user privacy opt-outs and secondary phones. Admin `notes` are also completely ignored. | **CONFIRMED CRITICAL** | Support partial profile updates in SQL/RPC. Add admin notes persistence to member profiles. |
| **A02** | **Invalid state transitions in approval & dues reconciliation** | In `supabase/migrations/20261016052755_directory_and_admin_operations.sql`, `approve_membership()` allows approving rejected/suspended/expired records without checking payment state. `reconcile_payment()` allows any non-confirmed record (even card/failed/refunded) to be reconciled as check.                                                                                                                                                                                                                                                                                    | **CONFIRMED CRITICAL**     | Enforce payment-plus-approval state machine. Check payments only reconcilable from `pending` check records. Unpaid records cannot grant active directory status.                         |
| **A03** | **Content contradictions & missing data**                       | - Rebuild claims "Since 1980" in [`src/app/(public)/page.tsx`](<file:///j:/DevDrive/sdgc/src/app/(public)/page.tsx#L42>) and [`src/app/(public)/about/page.tsx`](<file:///j:/DevDrive/sdgc/src/app/(public)/about/page.tsx#L23>); legacy homepage says **1928**.<br>- Garden Walk: rebuild hardcodes July 11 and $20/$25; legacy says July 18, 10am-4pm, $15+$2 fee.<br>- Check-in: receipt says Saugatuck City Hall; legacy says Old School House / History Center (Center St).<br>- Events: Zero upcoming events seeded; homepage displays past events under "Upcoming Club Events". | **CONFIRMED HIGH**         | Reconcile dates, founding year, check-in location, and scholarship wording. Seed realistic upcoming events.                                                                              |
| **A04** | **Header tablet navigation gap (768px–1023px)**                 | In [`src/components/layout/site-header.tsx`](file:///j:/DevDrive/sdgc/src/components/layout/site-header.tsx#L70-L85), desktop navigation is `hidden md:flex`, mobile toggle is `md:hidden`, but account actions (Login, Join, Theme Toggle, Profile) are `hidden lg:flex`. Between 768px and 1023px, account actions completely vanish. Mobile drawer also lacks sign-out.                                                                                                                                                                                                             | **CONFIRMED HIGH**         | Coordinate breakpoints across desktop nav and account actions. Add user auth state & sign-out to mobile drawer.                                                                          |
| **A05** | **Calendar filtering cosmetic & date boundary flaws**           | In [`src/features/events/queries.ts`](file:///j:/DevDrive/sdgc/src/features/events/queries.ts#L41-L60), `listEvents()` does not select `category`, leaving category filter pills blank. Search only queries `title.ilike`, ignoring venue. In [`src/features/events/components/event-list-view.tsx`](file:///j:/DevDrive/sdgc/src/features/events/components/event-list-view.tsx#L122), `startsDate < now` marks ongoing events as past. Day/month views lose URL params.                                                                                                              | **CONFIRMED HIGH**         | Populate `category` from SQL. Expand search to `title, venue, description`. Fix ongoing event condition. Sync URL search params across views.                                            |
| **A06** | **Registration & recovery journey incomplete**                  | In [`src/features/auth/components/register-form.tsx`](file:///j:/DevDrive/sdgc/src/features/auth/components/register-form.tsx), signup auto-redirects after 1.5s to `/login?registered=true`, but [`src/features/auth/components/login-form.tsx`](file:///j:/DevDrive/sdgc/src/features/auth/components/login-form.tsx) ignores the query param. Form lacks directory opt-out toggle. Legacy supported username-or-email reset; current only takes email.                                                                                                                              | **CONFIRMED MEDIUM-HIGH**  | Add durable confirmation-pending screen. Display allowlisted query notices on login page. Add directory opt-out checkbox to registration. Support username or email lookup for recovery. |
| **A07** | **CMS content editing disconnect**                              | In [`src/app/(public)/garden-walk/page.tsx`](<file:///j:/DevDrive/sdgc/src/app/(public)/garden-walk/page.tsx#L81-L120>), page sections, dates, and prices are hardcoded in JSX, ignoring CMS database content. [`src/features/admin/components/admin-content.tsx`](file:///j:/DevDrive/sdgc/src/features/admin/components/admin-content.tsx) only edits title and subtitle.                                                                                                                                                                                                            | **CONFIRMED MEDIUM-HIGH**  | Allow structured section editing (body, date, pricing, CTA) in admin CMS. Render CMS sections on Garden Walk page.                                                                       |
| **A08** | **Ticket checkout simulation disclaimers & past event gating**  | Ticket checkout allows purchasing tickets for past events and issues instructions to present passes at Saugatuck City Hall.                                                                                                                                                                                                                                                                                                                                                                                                                                                            | **CONFIRMED MEDIUM**       | Add prominent disclaimer: "Simulation. No payment collected. Not valid for admission." Server-side reject past/closed events.                                                            |
| **A09** | **Gallery media captions & album curation**                     | Seeded media captions in migration `20261017050113` had mismatches (e.g., registration table labeled shade garden). Repeated photos lack distinctive alt text.                                                                                                                                                                                                                                                                                                                                                                                                                         | **CONFIRMED MEDIUM**       | Fix seeded photo captions and alt text. Ensure deterministic album categorization.                                                                                                       |
| **N01** | _External Google Fonts suggestion_                              | Opus / Astra suggested checking typography font imports.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | **DISCARDED / PROHIBITED** | Project rule: Fonts are strictly local (`next/font/local`). Never fetch Google Fonts at build time.                                                                                      |
| **N02** | _Live Stripe integration suggestion_                            | Mentioned Stripe keys / live webhook configuration.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | **DISCARDED / PROHIBITED** | Project rule: No live charges or third-party keys during local development. Simulation must remain local and clearly labeled.                                                            |
| **N03** | _Next.js middleware recommendation_                             | Suggested standard `middleware.ts` for routing.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | **DISCARDED / PROHIBITED** | Project rule: Next.js 16 in this repository uses `src/proxy.ts` for session refresh. Kept intact.                                                                                        |

---

## 2. Phase-by-Phase Implementation Roadmap

The implementation is structured into 5 cohesive phases ordered strictly by dependency, stability, and risk.

```
Phase 1: Member Data Privacy & Financial State Guards (SQL, RPC, Actions)
   │
   ▼
Phase 2: Navigation, Responsive Breakpoints & Shell Layout (Header, Drawer, Footer)
   │
   ▼
Phase 3: Events Engine & Calendar Parity (Queries, Category Pills, Search, Intervals)
   │
   ▼
Phase 4: Content Truth, CMS Body Editing & Garden Walk (Central Facts, CMS Renderer, Tickets)
   │
   ▼
Phase 5: Auth Journeys, Gallery Polish & Full Verification Suite (Signup, Reset, Captions, Vitest/Playwright)
```

---

### Phase 1: Member Data Privacy & Financial State Guards

**Objective:** Prevent administrative overwriting of member privacy/contact info and guarantee the integrity of membership approval and dues reconciliation state transitions.

#### Tasks:

1. **Partial Profile Updates & Notes Persistence in RPC/Actions**
   - **Target Files:**
     - `supabase/migrations/<timestamp>_admin_member_privacy_and_notes.sql`
     - [`src/features/admin/actions.ts`](file:///j:/DevDrive/sdgc/src/features/admin/actions.ts)
     - [`src/features/admin/components/admin-members.tsx`](file:///j:/DevDrive/sdgc/src/features/admin/components/admin-members.tsx)
   - **Implementation:**
     - Update `admin_update_member_profile()` SQL function to take nullable parameters and use `COALESCE(p_directory_opt_out, directory_opt_out)` and `COALESCE(p_alt_phone, alt_phone)` so omitting them does not wipe existing data.
     - Add `admin_notes` column to `member_profiles` if not present, and persist notes when the admin saves the form.
     - Add directory opt-out toggle and alternate phone fields to the admin member edit modal.
2. **Harden Membership Approval & Payment Reconciliation**
   - **Target Files:**
     - `supabase/migrations/<timestamp>_state_machine_guards.sql`
     - [`src/features/admin/actions.ts`](file:///j:/DevDrive/sdgc/src/features/admin/actions.ts)
     - [`src/features/admin/components/admin-dues.tsx`](file:///j:/DevDrive/sdgc/src/features/admin/components/admin-dues.tsx)
   - **Implementation:**
     - Update `approve_membership(p_user_id)`: Verify that member has confirmed payment for the current membership year (or explicit documented waiver) before status transitions to `approved`. Disallow approving `suspended` or `rejected` members without explicit status reset.
     - Update `reconcile_payment(p_payment_id)`: Guard that payment `method = 'check'` and `status = 'pending'`. Prevent card, failed, or refunded payments from being arbitrarily reconciled as checks.
3. **Regenerate Database Types:**
   - Run `npx supabase gen types typescript --local > src/types/database.ts`.

#### Verification & Exit Criteria:

- Unit test in `tests/admin/member-update.test.ts`: Admin edit without touching privacy does not toggle `directory_opt_out` from true to false.
- Database tests: `approve_membership()` fails for unpaid user; `reconcile_payment()` rejects non-check or already-refunded payment.

---

### Phase 2: Navigation, Responsive Breakpoints & Shell Layout

**Objective:** Eliminate the 768px–1023px tablet breakpoint gap, integrate user auth state in mobile navigation, and polish header/footer accessibility.

#### Tasks:

1. **Unify Responsive Breakpoints in Site Header**
   - **Target Files:**
     - [`src/components/layout/site-header.tsx`](file:///j:/DevDrive/sdgc/src/components/layout/site-header.tsx)
     - [`src/components/layout/mobile-navigation.tsx`](file:///j:/DevDrive/sdgc/src/components/layout/mobile-navigation.tsx)
   - **Implementation:**
     - Align desktop nav and account actions so they both switch at `lg` (1024px), or provide a compact tablet layout at `md` (768px–1023px) showing icons/avatars.
     - Ensure Login, Join, ThemeToggle, and Profile buttons are accessible across 768px, 820px, and 1024px.
2. **Mobile Drawer Auth & Sign-Out Integration**
   - **Target Files:**
     - [`src/components/layout/mobile-navigation.tsx`](file:///j:/DevDrive/sdgc/src/components/layout/mobile-navigation.tsx)
   - **Implementation:**
     - Pass current user profile/role to mobile navigation drawer.
     - If authenticated, display member profile link, role badge, and a sign-out button.
     - Add active route indicator (`aria-current="page"`) to both desktop and mobile nav items.
     - Ensure mobile drawer closes cleanly on navigation and restores body scroll.
3. **Public Footer Polish**
   - **Target Files:**
     - [`src/components/layout/site-footer.tsx`](file:///j:/DevDrive/sdgc/src/components/layout/site-footer.tsx)
   - **Implementation:**
     - Hide back-office / admin links from anonymous users unless they have `editor`, `treasurer`, or `admin` role.
     - Replace raw HTML entity `&nearr;` with an accessible Lucide icon (`ArrowUpRight`).
     - Remove internal development phrasing like "Real RBAC audit enabled".

#### Verification & Exit Criteria:

- Playwright viewport tests at 375px (mobile), 768px (iPad Mini), 820px (iPad Air), 1024px (desktop).
- Header account buttons visible on all viewports; mobile drawer sign-out functional.

---

### Phase 3: Events Engine & Calendar Parity

**Objective:** Repair event categories, expand search scope to venues and descriptions, correct ongoing vs. past time logic, and sync filters across views.

#### Tasks:

1. **Fix Category Query & Filtering**
   - **Target Files:**
     - [`src/features/events/queries.ts`](file:///j:/DevDrive/sdgc/src/features/events/queries.ts)
     - [`src/features/events/components/event-list-view.tsx`](file:///j:/DevDrive/sdgc/src/features/events/components/event-list-view.tsx)
   - **Implementation:**
     - Ensure `listEvents()` queries and returns `category` (or category relationships).
     - Populate the category filter pills dynamically from database categories.
2. **Expand Search Semantics**
   - **Target Files:**
     - [`src/features/events/queries.ts`](file:///j:/DevDrive/sdgc/src/features/events/queries.ts)
   - **Implementation:**
     - Update event search filter to query `title`, `venue`, and `description` using PostgreSQL `or(title.ilike.%${q}%,venue.ilike.%${q}%,description.ilike.%${q}%)`.
3. **Correct Ongoing vs. Past Classification & Local Timezone Half-Open Intervals**
   - **Target Files:**
     - [`src/features/events/queries.ts`](file:///j:/DevDrive/sdgc/src/features/events/queries.ts)
     - [`src/features/events/components/event-list-view.tsx`](file:///j:/DevDrive/sdgc/src/features/events/components/event-list-view.tsx)
     - [`src/app/(public)/events/day/page.tsx`](<file:///j:/DevDrive/sdgc/src/app/(public)/events/day/page.tsx>)
     - [`src/app/(public)/events/month/page.tsx`](<file:///j:/DevDrive/sdgc/src/app/(public)/events/month/page.tsx>)
   - **Implementation:**
     - Classify an event as past only if `endsDate < now` (or `startsDate < endOfDay` for all-day events). An event that started 1 hour ago but runs for 3 hours must show as "Ongoing / Today".
     - Build date intervals using `America/Detroit` local boundaries rather than raw UTC midnight to prevent late-evening events from shifting days.
     - Retain URL search parameters (`?category=...&q=...`) when switching between List, Month, and Day views.
4. **Seed Realistic Upcoming Events**
   - **Target Files:**
     - `supabase/migrations/<timestamp>_seed_realistic_events.sql`
   - **Implementation:**
     - Seed authentic upcoming club events matching the legacy calendar (e.g. Board Meetings, Member Potlucks, Holiday Decorating Workshops, Annual Meeting) with future dates.

#### Verification & Exit Criteria:

- Venue search (e.g. "Fenn Valley" or "Douglas") returns matching events.
- Category pills filter the list accurately.
- Switching between List, Month, and Day preserves query parameters.

---

### Phase 4: Content Truth, CMS Body Editing & Garden Walk

**Objective:** Align site copy with verified historical facts, connect the Garden Walk page to CMS database content, and implement truthful ticket simulation disclaimers.

#### Tasks:

1. **Club History & Core Facts Reconciliation**
   - **Target Files:**
     - [`src/app/(public)/page.tsx`](<file:///j:/DevDrive/sdgc/src/app/(public)/page.tsx>)
     - [`src/app/(public)/about/page.tsx`](<file:///j:/DevDrive/sdgc/src/app/(public)/about/page.tsx>)
     - [`src/features/content/queries.ts`](file:///j:/DevDrive/sdgc/src/features/content/queries.ts)
   - **Implementation:**
     - Reconcile founding year: Legacy homepage states founded in **1928**; update headers ("Cultivating Community Since 1928" or reconcile with club archives).
     - Scholarship copy: Support for local high school seniors pursuing higher education (remove unwarranted restrictions to horticulture degrees only unless confirmed).
     - Homepage event query: Show "Upcoming Club Events" only when future events exist; render clear empty state or distinct "Recent Highlights" archive instead of mislabeling past events.
2. **Connect Garden Walk Page to CMS Content Model**
   - **Target Files:**
     - [`src/app/(public)/garden-walk/page.tsx`](<file:///j:/DevDrive/sdgc/src/app/(public)/garden-walk/page.tsx>)
     - [`src/features/content/queries.ts`](file:///j:/DevDrive/sdgc/src/features/content/queries.ts)
     - [`src/features/admin/components/admin-content.tsx`](file:///j:/DevDrive/sdgc/src/features/admin/components/admin-content.tsx)
     - [`src/features/admin/actions.ts`](file:///j:/DevDrive/sdgc/src/features/admin/actions.ts)
   - **Implementation:**
     - Replace hardcoded sections in `garden-walk/page.tsx` with dynamic sections from `content_pages` / `content_sections`.
     - Allow staff in `admin-content.tsx` to edit structured body sections, event date/time, ticket status, and check-in location.
     - Garden Walk fact alignment: July 18, 10am–4pm, $15 + $2 online convenience fee, check-in at Old School House (Center St) per legacy records.
3. **Ticketing Simulation Disclaimer & Event Date Gating**
   - **Target Files:**
     - [`src/features/tickets/actions.ts`](file:///j:/DevDrive/sdgc/src/features/tickets/actions.ts)
     - [`src/features/tickets/components/tickets-checkout.tsx`](file:///j:/DevDrive/sdgc/src/features/tickets/components/tickets-checkout.tsx)
   - **Implementation:**
     - Reject ticket purchases server-side for events that have ended or closed sales.
     - Prominently display banner and receipt disclaimer: **"Simulation Mode: No payment collected. Not valid for admission."**
     - Remove misleading instructions telling users to present the simulated pass at Saugatuck City Hall.

#### Verification & Exit Criteria:

- Editing a section in `admin-content.tsx` updates the public Garden Walk page immediately on save.
- Past events cannot be selected or submitted in ticket checkout.
- Home and About page historical copy reflects 1928 founding facts.

---

### Phase 5: Auth Journeys, Gallery Polish & Full Verification Suite

**Objective:** Complete next-step guidance for registration and recovery, polish gallery metadata and captions, and execute the full test verification suite.

#### Tasks:

1. **Durable Registration Confirmation & Directory Opt-Out**
   - **Target Files:**
     - [`src/features/auth/components/register-form.tsx`](file:///j:/DevDrive/sdgc/src/features/auth/components/register-form.tsx)
     - [`src/features/auth/components/login-form.tsx`](file:///j:/DevDrive/sdgc/src/features/auth/components/login-form.tsx)
   - **Implementation:**
     - Add explicit `directory_opt_out` checkbox to registration: "Include my contact details in the private Member Directory (opt out to remain hidden)".
     - Replace instant 1.5s redirect on registration with a durable confirmation screen: "Account Created! Check your email to confirm your address before logging in."
     - Support allowlisted query notices in `login-form.tsx` (e.g. `?registered=true`, `?reset=true`, `?expired=true`).
     - Support username or email lookup in password recovery flow.
2. **Gallery Captions & Media Metadata**
   - **Target Files:**
     - `supabase/migrations/<timestamp>_curate_gallery_captions.sql`
     - [`src/features/media/components/gallery-view.tsx`](file:///j:/DevDrive/sdgc/src/features/media/components/gallery-view.tsx)
   - **Implementation:**
     - Correct mismatched captions (registration table photo, plant sale photo).
     - Provide descriptive alt text for all 40+ authentic garden walk photos.
     - Ensure lightbox displays full captions, accessible keyboard navigation (Escape, Left/Right arrows), and restores focus.
3. **Full Quality & Parity Verification Run**
   - Run Biome linting: `npm run check`.
   - Run Next.js production build: `npm run build`.
   - Run Vitest test suite: `npm test`.
   - Run Playwright responsive and functional suite: `npx playwright test`.
   - Generate release verification artifact in `docs/verification/phase-09-v1.2-alignment.md`.

---

## 3. Risk & Safety Matrix

| Risk Area               | Precaution                                                                                                    |
| ----------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Database Migrations** | Use `npx supabase migration new <name>`; test up and down migrations; regenerate types immediately.           |
| **Data Loss**           | Never truncate or drop application tables without confirmed backup; use safe `COALESCE` for partial updates.  |
| **Breakpoints**         | Test specifically at 768px, 820px, and 1024px in both light and dark themes.                                  |
| **Email / Auth**        | Test with locally captured Inbucket mail (`http://localhost:54324`); follow real captured verification links. |
| **External Calls**      | Zero network dependencies during build; strictly local fonts and local Docker database.                       |
