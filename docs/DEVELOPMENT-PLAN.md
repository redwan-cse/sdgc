# SDGC Implementation Plan

> **For Antigravity:** implement this plan task by task in the current repository. Use `superpowers:executing-plans` if available. The user selected Antigravity as implementer; do not require Codex-specific tools or repeated phase approvals. Check off completed steps only after verification.

**Goal:** Deliver the complete SDGC frontend, Supabase migrations and working local full-stack behavior, preserving WordPress functionality including RBAC and member/admin panels.

**Architecture:** One Next.js App Router application with feature-oriented modules and Supabase Auth/Postgres/Storage. Build frontend structure first using explicit typed fixtures, then migrations, then real local integration. Database and server authorization remain mandatory even when UI controls hide restricted actions.

**Tech stack:** Node 24, npm 11, Next.js 16, React 19, strict TypeScript, Tailwind 4, supplied tweakcn theme, Supabase JS/SSR/CLI, Docker, Biome, Prettier, Vitest, pgTAP, Playwright.

**Spec:** [ARCHITECTURE.md](ARCHITECTURE.md), with evidence in [CURRENT-SITE-AUDIT.md](CURRENT-SITE-AUDIT.md). [VERIFICATION-PLAN.md](VERIFICATION-PLAN.md) defines mandatory test cases and release gates.

## Global constraints

- Node 24, npm 11; exact direct dependency versions and committed lockfile.
- Strict TypeScript, `@/` alias, App Router, Tailwind CSS 4.
- Preserve supplied tweakcn theme and `public/images/brand/sdgc-logo.jpg`.
- Local database project ID `sdgc`; use only this repo's Docker stack.
- Club timezone `America/Detroit`; USD amounts stored as integer cents.
- Annual membership follows a calendar year; no automatic recurring dues.
- Payment confirmation and manual membership approval are separate decisions.
- No service-role key in client code; no real member data in fixtures or Git.
- No production deployment, hosted database changes, live charges, or real outbound mail during local delivery.

## Review focus

These easily missed cases must receive named tests in their owning task:

1. User A forges User B's profile/payment IDs; both HTTP and database access must deny it (P3/P4/P6).
2. A successful payment callback repeats or arrives out of order; financial state changes once and membership still needs approval (P5).
3. A dues renewal crosses December 31 in Michigan, or an event crosses DST; year/date calculations remain correct (P3/P5).
4. A previously authorized user retains a cookie after role removal; privileged actions immediately fail according to the documented revocation strategy (P4/P6).
5. Import replay sees the same WordPress IDs/assets twice; no duplicates or silent route losses result (P7).

## Milestones and dependencies

| Phase | Deliverable                                      | Dependency                                       | Exit evidence                                            |
| ----- | ------------------------------------------------ | ------------------------------------------------ | -------------------------------------------------------- |
| P0    | Evidence-backed parity/route inventory           | Existing website and authorized private evidence | Source ledger, gaps and route list                       |
| P1    | Foundation health                                | Initialized repo                                 | Static checks, build, browser smoke, local config        |
| P2    | Complete responsive frontend surfaces            | P0 known scope + P1                              | Frontend screenshots, navigation/forms/empty-state tests |
| P3    | Reproducible schema, RLS, seed, generated types  | P0 data contracts + P2 interfaces                | Reset/replay, pgTAP, lint and real-client denials        |
| P4    | Real auth, RBAC, member profile panel            | P3                                               | Local signup/recovery and role/ownership tests           |
| P5    | Events/media/contact/dues/ticket integration     | P3/P4                                            | Persistent full-stack journeys, transaction tests        |
| P6    | Full admin panel                                 | P3–P5                                            | Role matrix, CRUD, audit and browser tests               |
| P7    | Migration tooling, SEO, URL/media reconciliation | Stable routes/schema                             | Idempotent dry run, redirect report and crawl            |
| P8    | Final verification and delivery                  | All phases                                       | Fresh setup, CI, parity matrix and handover              |

P0 discovery can continue while independent P1/P2 work proceeds. Missing private access or a payment provider is a recorded blocker for the affected feature/final parity claim, not a reason to stop all development. P2 is the frontend milestone; P3 is the migration milestone. Neither alone is full-stack acceptance.

## P0 — Verify WordPress parity

**Files:** create `docs/discovery/parity.csv`, `docs/discovery/routes.csv`, `docs/discovery/assets.csv`, `docs/discovery/private-features.md`; update `docs/CURRENT-SITE-AUDIT.md`.

**Interfaces:** consume the inventory IDs in the audit. Produce CSV rows with source URL, confidence, legacy behavior, target route, owning phase, test ID, status and blocker. Preserve legacy route/path/query data needed by P7.

- [ ] Inspect desktop/mobile public navigation and all reachable page/event/gallery/form controls without submitting to production. Record date and evidence for each verified behavior.
- [ ] Attempt sitemap, WP REST API and safe read-only inspection. Record actual HTTP failures. If private evidence is unavailable, list exactly which member/admin screens, role rules, forms, exports or providers remain unknown.
- [ ] Reconcile supplied profile fields and eight interest choices, annual dues/manual verification, event views and ticket actions against the matrix. Add every discovered function; do not silently replace it with a generic feature.
- [ ] Confirm at least one target route and one planned acceptance test for each verified ID. Commit `docs: record WordPress parity and migration inventory` with P0 evidence.

**Gate:** every known feature is assigned; unknowns have explicit impacts. Final parity certification cannot pass with unresolved unknown private functions.

## P1 — Verify the existing foundation

**Files:** existing root configuration, `src/app`, `src/lib`, `supabase/config.toml`, CI; create `docs/verification/phase-01.md`.

**Interfaces:** use the existing `createClient()` factories in `src/lib/supabase/client.ts` and `server.ts`; keep them request/browser scoped. Database credentials are required only when a feature calls them.

- [ ] Read `docs/BOOTSTRAP-STATUS.md`; run `npm ci`, `npm run check`, `npm run build`, and `npm run test:e2e`. Fix any environment-specific failures, preserving the supplied identity.
- [ ] Check `docker info`, `npx supabase --version`, `npm run db:status`; start the isolated stack if needed. Verify API/Auth/Storage and local email UI; never reuse or reset `sb-scratch`.
- [ ] Populate ignored `.env.local` using local status output, never production keys. Verify example files contain no secrets.
- [ ] Record actual versions/check results, commit any fixes. Retain smoke tests as the public shell evolves.

**Gate:** foundation builds and tests; local stack or precise environment failure is evidenced. P3+ integration gates require a functioning stack.

## P2 — Build the complete frontend

### Task 2.1: Shared shell and public/event/media surfaces

**Files:** `src/components/layout/{site-header,site-footer,mobile-navigation}.tsx`, required UI primitives, public routes in `src/app/(public)/`, `src/features/{content,events,media}/types.ts`, `tests/fixtures/public-content.ts`, `tests/e2e/public-site.spec.ts`, `tests/e2e/accessibility.spec.ts`.

**Interfaces:** `EventSummary` contains `id, slug, title, startsAt, endsAt, timezone, allDay, venueName`; `MediaItem` contains `id, src, width, height, alt, caption`; define exact typed content models before consuming them. P5 replaces fixture readers with data queries without changing view contracts.

- [ ] Add failing Playwright checks for public navigation, mobile menu keyboard behavior, event List/Month/Day selection, contact anchor/deep links and gallery keyboard close/return focus. Add `@axe-core/playwright` pinned exactly for automated accessibility checks.
- [ ] Implement the shared navigation/footer and home/about/Garden Walk/gallery/contact/events/detail surfaces using the supplied theme and original logo. Include responsive calendars and loading/empty/error states, and preserve observed content sections. Fixtures must be visibly documented as preview data.
- [ ] Verify at 360px, 768px and 1440px, keyboard-only navigation and light/dark contrast where supported. Save screenshots under ignored `artifacts/phase-02/` with a concise evidence document.

### Task 2.2: Authentication, member and admin UI contracts

**Files:** routes under `src/app/(auth)/`, `(member)/`, `(admin)/`; `src/features/{auth,membership,admin}/` view models and form components; `tests/e2e/panels-preview.spec.ts`.

**Interfaces:** define `MemberProfileInput` with the audit's fields and `MembershipSummary` with term/year, amount in cents, application status, payment status and approval status. Define `Capability` string unions matching the architecture matrix. Preview fixtures cannot grant real capabilities.

- [ ] Write form validation tests for required names/username/email, password confirmation, invalid birthday month/day, optional phones/address, and eight allowed project-interest codes. Use synthetic data only.
- [ ] Implement login/signup/recovery/reset screens, profile editor, dues status/payment method selection, admin shell, content/event/media/member/dues/message screens, and permission-denied/loading states. Clearly identify temporary non-persisting preview interactions; no fake success messages.
- [ ] Run P2 browser suites and `npm run check`; document how each UI maps to parity IDs. Commit `feat: build SDGC frontend surfaces`.

**Gate:** all known surfaces and form states are navigable/responsive. No claim of working auth/persistence yet. Protected previews stay in explicit development/test-only routing until authorization exists.

## P3 — Author migrations, RLS and deterministic fixtures

### Task 3.1: Domain schema and data constraints

**Files:** create migrations via CLI in `supabase/migrations/`, extend `supabase/seed.sql`, create `supabase/tests/schema.test.sql`, `supabase/tests/membership.test.sql`, `src/features/membership/rules.ts`, `src/features/membership/rules.test.ts`.

**Interfaces:** use the architecture entity contracts. Implement pure `getMembershipYear(at: Date, timeZone: string = "America/Detroit"): number` and `isMembershipActive(input: { approved: boolean; suspended: boolean; year: number }, at: Date): boolean`; database access independently checks equivalent term/approval rules. Add expiry dates if P0 establishes different semantics and update both contracts explicitly.

- [ ] Write failing pgTAP tests for unique normalized usernames, unique membership/user-year, nonnegative integer amounts, valid birth month/day, valid event ranges, FKs and payment-event uniqueness. Pure tests must assert Michigan year differs from UTC at `2027-01-01T03:00:00Z` and changes at `2027-01-01T05:00:00Z`.
- [ ] Use `npx supabase migration new <name>` for ordered content, identity/membership, payment, and security/storage migrations. Keep all application objects reproducible in files. Add no real members to seed.
- [ ] Apply using `npm run db:reset` on `sdgc`; run pgTAP and lint. Add synthetic published/draft content, past/future/DST/all-day events, separate yearly terms, albums and pending/expired states. No hardcoded credentials in SQL.

### Task 3.2: RLS, storage, generated types and real-client denial tests

**Files:** security/storage migrations; `supabase/tests/{rls,storage,roles}.test.sql`; `scripts/provision-local.mjs`; `tests/integration/{setup,rls,storage}.test.ts`; `vitest.integration.config.ts`; generated `src/types/database.ts`; update clients, package scripts and CI.

**Interfaces:** add `npm run test:integration` for real local API tests, `npm run db:provision` for idempotent synthetic Auth/Storage fixture creation, and an ignored local credential artifact. Both scripts reject non-loopback endpoints and validate the intended `sdgc` environment. Test persona IDs are loaded from provisioning output without logging passwords/tokens.

- [ ] Write denial tests for anonymous private reads, self role/approval/payment forgery, User A changing User B's profile, draft leakage and unauthorized Storage upload/replacement. Test permitted operations as well, using actual anon/authenticated tokens rather than only service-role clients.
- [ ] Implement grants, RLS, column protections and narrow privilege helpers matching the capability matrix; include both `USING` and `WITH CHECK` on updates. Create media bucket configuration and policies in migrations. Private media must not be reachable through public bucket URLs.
- [ ] Add local fixture provisioning through Auth/Storage APIs; generate types with `npm run db:types`, apply `Database` generics to both clients, and eliminate domain `any` casts. Add integration/type-drift gates to CI.
- [ ] Reset/reprovision twice; run `db:lint`, `db:test`, `test:integration`, `db:types`, and `git diff` for type drift, plus static checks. Commit `feat: add reproducible Supabase schema and RLS`.

**Gate:** empty-to-working schema replay succeeds; allowed and denied access is proven; generated types match. Migration files alone without RLS tests do not complete P3.

## P4 — Integrate authentication, RBAC and the member panel

**Files:** `src/proxy.ts`, `src/features/auth/{actions,validation,session,authorization}.ts`, `src/features/membership/{queries,actions,validation}.ts`, auth callback/confirm routes, member routes, `tests/e2e/{auth,member-profile,rbac}.spec.ts`, integration ownership/role tests.

**Interfaces:** `requireUser(): Promise<{ id: string }>` verifies the server identity; `requireCapability(capability: Capability): Promise<{ id: string }>` verifies current database permissions and denies unauthorized access. `updateOwnProfile(input: MemberProfileInput): Promise<ActionResult>` derives `user_id` from that identity. Define `ActionResult<T = void>` as a discriminated success/error union; never pass unrestricted database rows to clients.

- [ ] Add failing tests for signup/confirmation, username/email login, logout, wrong password generic error, expired recovery link, safe return paths, session refresh, and anonymous/member attempts to call admin actions directly.
- [ ] Implement cookie-based SSR auth using the installed SDK documentation, local email capture, protected member/admin layouts and per-action authorization. The login username resolver must not leak associated emails. Prevent public caching of private responses.
- [ ] Persist all observed profile fields and project interests; display current/prior term states and next actions. Email/password updates go through Auth. Test forged extra profile fields cannot assign roles, approval or confirmed payments.
- [ ] Verify member A/B isolation, suspended/expired restrictions, role removal with an existing cookie and no personal data in public responses. Run real local integration, browser and static checks; commit `feat: add member authentication profile management and RBAC`.

**Gate:** a real synthetic member can register, confirm email, log in, update their profile, recover password, and see their own annual status; unauthorized users cannot act as admin via URL, action or Data API.

## P5 — Connect public data, contact and financial workflows

### Task 5.1: Events, media and contact persistence

**Files:** `src/features/events/{queries,filters,calendar}.ts`, event routes, `src/features/media/queries.ts`, `src/features/contact/{actions,validation,rate-limit}.ts`, integration and browser suites for each.

**Interfaces:** `listEvents(filters: { query?: string; from?: string; to?: string; view: "list" | "month" | "day"; cursor?: string }): Promise<EventPage>` with validated bounded inputs; `submitContact(input: ContactInput): Promise<ActionResult<{ reference: string }>>` accepts name/email/optional phone/message and derives server-owned fields internally. Define exact `EventPage` and `ContactInput` alongside the feature.

- [ ] Write tests for search/date pagination, Michigan DST boundaries, all-day events, empty dates, unavailable media, contact validation, duplicate/rapid submission and private inbox denial.
- [ ] Replace fixture reads with typed Supabase queries, implement correct previous/upcoming links and verified export/subscription functionality. Query published data only; handle failed queries explicitly.
- [ ] Persist contact before reporting success; use durable rate limiting and honeypot protection. Capture notifications locally, test delivery failure without losing the saved message, and document retry behavior. No real mail provider is required for local delivery.

### Task 5.2: Annual dues and Garden Walk ticket action

**Files:** `src/features/payments/{types,service,provider,local-provider}.ts`, checkout/status/webhook routes as needed, dues UI/actions, payment migrations/tests; `tests/integration/payments.test.ts`, `tests/e2e/dues.spec.ts`.

**Interfaces:** `PaymentProvider.createCheckout(input: { paymentId: string; amountCents: number; currency: "USD"; returnPath: string }): Promise<{ checkoutUrl: string; providerReference: string }>`; a verified provider event maps to server-owned payment IDs/amounts. Create exact verified event types after provider discovery. Never send client-selected amounts as authoritative.

- [ ] Write failing tests for amount/term tampering, forged success URLs, duplicate/out-of-order callbacks, rejected signatures, failed/refunded payments, check reconciliation and repeated renewal attempts. Assert payment confirmation leaves membership awaiting manual approval.
- [ ] Implement credit-card and mail-check paths with server-owned pricing. Integrate the discovered provider in sandbox mode if configuration is available. Otherwise ship a production-disabled, visibly labeled local provider and document provider verification as blocked; do not count that as live checkout parity.
- [ ] Make the Garden Walk ticket link/action match the verified destination. Implement ticket sales or registration only if P0 establishes those as current functionality; preserve safe external checkout when that is how the original works.
- [ ] Run contact/events/media/payment integration and browser suites plus standard checks. Commit `feat: connect events contact and annual dues workflows` with P5 evidence.

**Gate:** real local persistence; no transaction can activate membership without authorized manual approval; no financial state changes based solely on browser input.

## P6 — Deliver the administrator panel

**Files:** admin routes and `src/features/admin/{content,events,media,members,dues,messages,roles}/` queries/actions/validation, audit migrations if needed, `tests/e2e/admin.spec.ts`, `tests/integration/admin-permissions.test.ts`.

**Interfaces:** all admin mutations call `requireCapability` and return `ActionResult`; `approveMembership(input: { membershipId: string; expectedVersion: number }): Promise<ActionResult>` checks payment/reconciliation rules and current term; `setUserRoles(input: { userId: string; roles: CapabilityRole[] }): Promise<ActionResult>` validates trusted role codes, prevents last-admin removal and audits the change. Add versioning/transaction primitives in the owning migration before using them.

- [ ] Write role-matrix tests proving editor cannot reconcile dues/manage roles, treasurer cannot publish/manage roles, member cannot read the staff inbox, and admin may manage member profiles with an audit record. Test stale concurrent approvals and last-admin protection.
- [ ] Build searchable/paginated member management, role assignment, pending applications/approvals, annual term/rate controls, card/check reconciliation, contact inbox, pages, event/venue CRUD and media/album ordering/alt text.
- [ ] Implement publish/unpublish and deletion confirmations with FK-safe handling, upload type/size validation and private/public storage rules. Verify a newly published change appears publicly and draft content remains private.
- [ ] Test every privileged path through UI, Server Actions/Route Handlers and direct API policies. Verify audit rows, revocation with existing sessions, keyboard/forms/error states. Commit `feat: deliver role-protected club administration`.

**Gate:** content and membership operations can be managed by appropriate local staff personas, without WordPress, Studio or manual SQL in routine use.

## P7 — Prepare migration, SEO and cutover evidence

**Files:** `scripts/import-wordpress.mjs`, `scripts/audit-routes.mjs`, `docs/migration/{runbook,field-mapping,redirects,account-transition}.md`, sanitized synthetic export fixture/tests, sitemap/robots/metadata, route redirect configuration.

**Interfaces:** importer defaults to `--dry-run`, accepts an explicit input directory and local target, uses stable legacy IDs, emits counts/hashes/rejections without PII, and is safe to replay. It must reject hosted targets in this local-delivery stage. Route audit consumes P0's route ledger and emits status/canonical/redirect-chain results.

- [ ] Write tests for duplicate import replay, malformed/suspicious HTML, missing media, absent optional profile fields, legacy slugs, password format incompatibility and redirect cycles/query loss.
- [ ] Implement a content/media/profile/dues migration mapping against an authorized export; use synthetic export fixtures until one is supplied. Do not copy WordPress passwords into Supabase or claim login continuity without a supported, explicitly verified mechanism; design a reset/invite flow by default.
- [ ] Add canonical metadata, sitemap, robots, Open Graph and valid Event structured data. Exclude private/auth/admin content; preserve legacy URLs or explicit permanent redirects. Do not index a local/test deployment.
- [ ] Run idempotent import dry runs and route/media reconciliation. Record actual vs expected counts and unresolved export/provider/private-screen dependencies. Commit `feat: add migration tooling and preserve legacy discovery paths`.

**Gate:** migration tooling is tested with fixtures; real-content certification requires the authorized export. No live data is imported during this task.

## P8 — Verify and hand over

**Files:** `docs/verification/phase-08.md`, `docs/DELIVERY.md`, updated parity CSV, README and local runbook, CI integration job.

- [ ] Follow the fresh-checkout procedure in `VERIFICATION-PLAN.md`: clean `npm ci`, local stack reset/reprovision, generated-type comparison, unit/pgTAP/API tests, production build and full browser journeys.
- [ ] Run desktop/mobile Chromium, add Firefox/WebKit in this phase where supported, verify keyboard/a11y/contrast and realistic media performance, and resolve observed failures. Record unsupported checks as blocked, not passed.
- [ ] Reconcile every parity ID with implementation and test evidence. List external prerequisites with precise impact. Do not mark full parity complete while private-feature discovery or required transaction behavior remains unknown.
- [ ] Deliver reproducible frontend, migrations, types, seeds/provisioning, migration runbooks, evidence and concise handover. Commit a coherent delivery increment and report changed files, test totals, known gaps and next operational actions.

**Gate:** all local-delivery checks pass, every verified requirement has evidence, no mock is presented as production integration, and all remaining external blockers are explicit. Stop at code delivery; production deployment is a separate instruction.
