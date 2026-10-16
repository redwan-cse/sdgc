# Antigravity remediation handoff

Reviewed on **2026-10-16**, against **c1d85fc07ca0ab1e59d5eae559c79947995295d4**.

## Review decision

Continue development. The delivered application has a substantial frontend and working architectural foundations, but the claims of complete parity and production readiness are not supported by the current implementation. Do not begin production cutover or treat `v1.0` as an acceptance certificate.

This handoff is a prioritized implementation plan, not a claim that the listed problems have been fixed. Codex did not modify application code, migrations or member records during this review.

## Independently observed verification

| Check                                | Result on review                                                                                       |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| `npm run check`                      | Passed: formatting, Biome, TypeScript, 16 unit tests                                                   |
| `npm run build`                      | Passed: optimized build and 27 route entries                                                           |
| `npm run db:lint`                    | Blocked: connection refused at `127.0.0.1:54322`                                                       |
| `npm run db:test`                    | Blocked: same database connection failure                                                              |
| `npm run test:integration`           | Failed in current environment: 32 failed, 12 passed, 6 skipped, 50 total; connection failures dominate |
| `npx playwright test --list`         | Discovered 140 tests across desktop/mobile Chromium; discovery is not execution                        |
| Full browser execution               | Not rerun because the backing local API/database ports are unavailable                                 |
| Read-only Docker/Postgres inspection | PostgreSQL 17.11; 17 public application tables have RLS enabled                                        |

Docker reported healthy `sdgc` containers, but the database's configured HostPort 54322 had an empty effective `NetworkSettings.Ports` binding. API calls also refused port 54321. `npm run db:start` reported the stack already running and did not restore these bindings. This is an environment blocker, not proof that every failed integration assertion is an application defect. No reset, destructive volume operation or change to another project's stack was performed.

The 12 passing integration assertions are not a clean bill of health: some denial tests accept any returned error, including connection failure. Test health and specific failure reasons must be established before interpreting security-denial results.

## Execute these work packages in order

### R0 — Establish a healthy, reproducible verification environment

- Inspect the `sdgc` container/volume identity and effective host bindings, then restore this project's API/database/Studio/mail ports. Preserve needed local data before recreating containers. Leave `sb-scratch` and every other project alone; never use global stop/prune commands.
- Add a fail-fast preflight to integration/browser testing: correct project, parsed loopback URL, healthy API/Auth/Storage, reachable database, and provisioned synthetic personas. Replace substring hostname checks in `scripts/provision-local.mjs:25` and `tests/integration/setup.ts:32` with exact parsed hostname checks.
- Rehearse a disposable fresh local reset/provision/replay using the committed migrations. Do not import real private data during this work.
- Correct the reported PostgreSQL version and test totals in delivery evidence. Record failures and environment blockers without converting them into passes.

**Acceptance:** all local services reachable; reset/provision twice succeeds; DB lint, pgTAP and integration tests run against the intended stack. Negative tests assert the actual denied operation and permission behavior, not merely `error != null`. Use valid foreign keys/status values in policy tests so constraint errors cannot masquerade as RLS protection.

### R1 — Close security and privacy boundaries before polish

Implement each fix with a failing regression first, then a forward migration where database behavior changes. Preserve migration history.

1. **Event JSON-LD:** `src/app/(public)/event/[slug]/page.tsx:84` embeds raw `JSON.stringify(jsonLd)` in a script. Editor-controlled titles/descriptions can terminate that element. Use HTML-safe serialization, for example `JSON.stringify(jsonLd).replace(/</g, "\\u003c")` as the serialized source. Keep ordinary text intact. Test title/description/venue input containing script-closing text and assert it remains inert in the public page. Do not rely on the importer or CSP to repair this sink.
2. **Directory privacy:** `supabase/migrations/20261016052755_directory_and_admin_operations.sql:15` lets an active requester select complete opted-in profile rows. Combined with the table-wide grant at `20261016025339_rls_and_grants.sql:254`, direct API callers can read address, birthday and spouse columns omitted by the UI, including ineligible target profiles. Keep private profiles owner/staff-only; implement a restricted directory projection with explicit field/visibility rules and target eligibility. Provide real opt-in/out management. Test private-column denial, User A/B isolation, and pending/expired/suspended/opted-out targets through actual user clients. Confirm exact legacy directory rules from authorized evidence; do not assume every profile consents.
3. **Contact write boundary:** anonymous table INSERT at `20261016025339_rls_and_grants.sql:202` bypasses the form action and allows caller-controlled status/timestamps. Revoke general direct submission access and use the narrow server writer or an equivalently restricted RPC. Add bounded field lengths, server-owned metadata, durable abuse limits and inbox pagination. Test direct API denial, oversized/bulk/repeated input and legitimate persistence. A honeypot alone is insufficient; Auth's limits do not cover this contact writer.
4. **Trusted audit trail:** ordinary authenticated INSERT at `20261016025339_rls_and_grants.sql:224` permits fabricated administrative action/entity/details/time records under the caller's own actor ID. Generate trusted audit records inside capability-checked transactions/triggers, deriving actor/action/time. Test that pending members cannot append trusted events and successful privileged operations produce exactly one truthful record. Keep any client telemetry separate.
5. **Login return destination:** the prefix filter at `src/features/auth/actions.ts:12` accepts slash/backslash variants that the router normalizes as external. Parse against a trusted origin, require same origin, reject backslashes/control characters, and return only approved local path/search/hash. Test literal and encoded variants as well as valid internal returns. Apply a shared policy to callback flows where appropriate; do not assume their current concatenation has the identical flaw.
6. **Simulation boundary:** `src/features/payments/local-provider.ts:15` allows production simulation if either flag is true, then the action confirms dues using the service-role client. Replace that general override with an explicit server-only local-test mechanism that verifies the intended loopback backend and fails closed for a deployed/hosted target, even with copied local flags. Document the separate local production-build test mode needed by Playwright. Reject unsupported simulation before creating an intent. Do not change the rule that payment confirmation still requires separate manual membership approval.
7. **Import identity binding:** `scripts/import-wordpress.mjs:468` accepts a username match without comparing the destination Auth email to the exported identity, then applies PII and membership to that ID. Resolve stable reviewed legacy mappings and verified identity; reject username/email conflicts for reconciliation. Test an existing destination account with a legacy username but different email and prove that no profile or membership transfers. This is conditional on an authorized import into a populated destination; no actual identity takeover was executed in review.

**Acceptance:** focused regression suites pass through both application and direct database/API boundaries; unauthorized calls cannot bypass UI controls. No real provider, private export or production deployment is needed to close these code defects.

### R2 — Repair real signup, recovery and profile parity

- `src/features/auth/actions.ts:127` calls signup, then immediately writes profiles using the ordinary client at line 149. Email confirmation is enabled in config and the running Auth container, so a fresh unconfirmed signup has no authenticated session for those writes. No application profile-provisioning trigger was found on `auth.users`. Implement safe, idempotent provisioning that preserves the submitted allowed fields while keeping privileged state server-owned. Do not solve this by disabling email confirmation or publicly granting arbitrary profile writes.
- Make signup confirmation and recovery URLs reach the correct callback/token-verification route. Verify fresh-account creation, local email receipt, confirmation, login, profile/interests/pending-term creation, duplicate identity handling, expired/reused recovery, and password reset end to end. Current Auth tests mostly use pre-confirmed provisioned personas and do not demonstrate this path.
- Restore **Address Line 2** as an editable registration/profile control. It exists in types/state but the form does not render an input (`register-form.tsx:358` and corresponding profile form).
- Preserve **gardening interests** and **work/volunteer experience** separately. The current schema/UI collapses both into `interestsExperience` (`membership/validation.ts:46`, `register-form.tsx:486`), contradicting the audited legacy fields. Add migration/backfill/import mapping and exact round-trip tests. Keep all eight existing project choices.
- Make username normalization/uniqueness consistent in schema, signup, profile and import. Use exact normalized lookup rather than allowing SQL `ILIKE` wildcard semantics to interpret identifier underscores. Test case collisions and underscore identifiers.
- Make profile/interests updates atomic or explicitly recoverable. Do not ignore interest/membership write errors or show success after only part of the operation persisted. Remove `FIXTURE_MEMBER` fallback from a real authenticated profile failure (`src/app/(member)/profile/page.tsx:33`).
- Provide actual account email/password management if verified as legacy scope; route email changes through Auth verification.

**Acceptance:** a fresh user can complete signup/confirmation and round-trip every separate field and interest through reloads; no manual fixture provisioning or Studio edit is required for normal registration.

### R3 — Correct annual membership and calendar behavior

- Remove fixed year 2026 from signup, `auth/session.ts:29`, `membership/queries.ts:64`, `payments/queries.ts:21`, payment defaults and related UI. Use the current Michigan term, preserve prior-term history and support the next term without a code release. Do not hardcode the displayed USD 50 amount when the authoritative term rate changes.
- Preserve distinct pending/approved/rejected/expired/suspended and payment pending/confirmed/failed/refunded states. `membership/queries.ts:96` currently hardcodes `isSuspended = false` and maps expired to rejected. Use a consistent typed state model across DB, UI and actions.
- Fix date grouping in `events/calendar.ts:84,96,117` and `event-day-view.tsx:22`: comparing the UTC timestamp string prefix does not assign an event to its Michigan calendar day. Use Detroit-local date boundaries and overlap rules, including DST, all-day and multi-day events.
- Replace fixed July 2026 defaults in month/day routes with the current or requested date. Validate/persist date/search/category/view state in URLs and preserve it across view changes and refreshes. Add actual bounded server-side filtering/pagination; distinguish database failure from an empty calendar.
- Align treasurer approval behavior: the DB RPC allows treasury approval, but `approveMembershipAction` requires admin-only `members.manage`. Implement the architecture's capability matrix consistently across page/query/action/RPC, or document an explicit owner-approved policy change. Enforce current-term/reconciliation rules in the approval transaction, with required concurrency protection where specified.

**Acceptance:** tests pin December 31/January 1 in Detroit, both DST transitions, near-midnight UTC events, multi-day/all-day cases, all membership/payment states, and treasurer/admin permissions with existing sessions.

### R4 — Replace preview/admin placeholders with persistent workflows

- Homepage and Garden Walk still import `tests/fixtures/public-content`; homepage upcoming events come from `FIXTURE_EVENTS`. Read real published content/events. Reconcile dates and club history against source evidence rather than inventing copy.
- About queries fetch `pages.content` but render hardcoded sections, including fallback content after unpublish (`features/content/queries.ts:19`). Wire structured body editing/publication/revalidation to actual public rendering. A staff unpublish must not silently redisplay the same content from a fallback.
- Admin media Upload/Edit buttons only call `setNotice` (`admin-media.tsx:35,113`). Build actual validated upload, replacement/deletion, alt/caption editing, album ordering and visibility changes. No requirement may depend on routine manual Studio operation.
- `listGalleryMedia()` returns a hardcoded 17-item list (`features/media/queries.ts:251`); downloading 161 source files is not displaying/managing 161 assets. Use real media/album metadata, Storage URLs or signed URLs as appropriate, pagination and deliberate empty/error states. Enforce privacy at the byte-download boundary as well as metadata, including visibility changes.
- Finish member administration and use real authorized identity data. `admin/queries.ts:115` fabricates `${username}@example.com`; it must not appear as a member's real email. Add missing member detail/profile editing and permitted status/term operations, with auditing.
- Complete event editing, venue/category management and yearly dues/rate management required by the plan. Audit every button: if it only opens a notice or modifies local state, either implement persistence or label it incomplete.

**Acceptance:** upload/edit/publish/unpublish/profile/admin changes survive reload, appear in the relevant public/member view, and remain subject to the full role matrix. No production feature silently uses test fixtures or fabricated identities.

### R5 — Reconcile legacy routes, ticketing and import operations

- Rebuild the parity/route ledger from the crawl plus authorized private evidence. Most parity rows remain `in_progress` or `blocked`; many newly crawled account/ticket routes are not mapped. Plugin presence and shortcode pages do not prove a fully functioning provider workflow.
- Preserve or intentionally redirect `/user/`, profile variants, `/members/`, `/account/`, `/password-reset/`, `/events/list/`, `/events-looped/` and verified financial/ticket return routes. Give `/logout/` equivalent safe session-termination behavior rather than a misleading unrelated redirect. Test query strings, legacy deep links, 404s and redirect cycles. Existing Next permanent 308 redirects are valid permanent redirects; do not change them to 301 solely for terminology.
- Do **not** map `/tickets-checkout/` to generic `/events` and mark paid ticket functionality complete. Implement or preserve the verified purchase/order/receipt journey. Keep event ticket purchases distinct from annual membership dues. Do not invent subscriptions because a plugin installed default cancellation pages; annual dues remain non-recurring unless the owner changes that rule.
- Fix the importer CLI/runbook mismatch: code recognizes `--input`, delivery docs use ignored `--input-dir`. Choose a documented interface and reject unknown flags; test actual CLI arguments so an apply cannot silently import synthetic fixtures instead of the chosen export.
- Complete accurate field/status/media/legacy-ID mapping and account reset/invite behavior. Handle all returned database errors before reporting success. Remove usernames and other personal content from claimed zero-PII summaries. Verify idempotence, partial failure, conflicts, media byte transfer and count/hash reconciliation with synthetic exports before any authorized private import.

**Acceptance:** each verified legacy capability has a route, persisted implementation and named passing test; missing evidence is precisely blocked. Real private exports stay out of Git and are not imported during this remediation assignment.

### R6 — Finish verified integrations and accessibility

- After code correctness is established, implement the confirmed payment provider in **sandbox/test mode**, with verified server pricing, signed callbacks/webhooks, event deduplication, failure/refund/cancel handling and receipts. Browser success redirects must never confirm payment or approve membership. If provider configuration is missing, finish the adapter/contracts/tests and report that specific test as blocked; do not ask for live charges.
- Implement contact notification delivery and retry/deduplication to local capture first. Treat production SMTP/domain credentials as a separate operational prerequisite. Do not send real external mail during tests.
- Add authenticated avatar upload if confirmed as legacy behavior, with owner-only object writes and validated size/type. Add `.ics` exports/subscriptions if verified by the old calendar controls; do not label a redirect to HTML as a working calendar feed.
- The gallery **already has a basic modal**, contrary to parts of the review prompt. Improve it rather than rewriting it: focus containment, inert background, consistent return-to-original-trigger behavior after arrow navigation, proper tabs/buttons semantics, and any verified zoom feature. Add keyboard regression tests and manual extension/autofill testing. Mount guards and suppressed warnings do not prove immunity to every password manager.
- Add appropriate loading/error boundaries. Treat a strict CSP as compatible defense in depth after fixing injection sinks; do not paste `script-src 'self'` without testing Next.js inline/nonce/hydration requirements. Verify no service-role literal enters client build artifacts without printing the key.

**Acceptance:** local/sandbox integration contracts, failure paths and accessibility behaviors are evidenced. External prerequisites remain explicit, never replaced with a mock success claim.

### R7 — Re-run delivery and correct the completion record

- Run a fresh disposable `sdgc` replay/provision, `db:lint`, `db:test`, `test:integration`, type regeneration/drift check, `npm run check`, production build and full affected desktop/mobile browser suites. Add Firefox/WebKit where supported; disclose unsupported checks. Check current CI at the actual reviewed commit.
- Add meaningful assertions for every fix above. A test name, screenshot, rendered button, generic network error or mocked provider does not prove behavior/persistence/authorization.
- Update `docs/DELIVERY.md`, the internal audit, phase verification and parity ledger. Separate **frontend ready**, **migrations ready**, **local full-stack ready**, **legacy parity verified** and **production ready**. Remove unsupported “100% match,” “exceeded,” “completely immune,” and “production-grade” claims.
- Record exact commit, commands, results, fixture scope, screenshots/traces and remaining blockers. Report current-source credential inspection separately from a full history/provider audit.
- Commit coherent remediation increments. Preserve the existing release tag; propose a new reviewable release only after the corresponding acceptance gates pass.

## Copyable execution instruction

Antigravity: read `AGENTS.md`, this entire handoff and the original architecture/verification plan. Treat the findings as evidence to verify and repair, not proof that fixes already exist. Execute R0–R7 in dependency order, writing regression tests before business/security changes and recording evidence under `docs/verification/remediation-RN.md`. Keep working through authorized local code changes without routine phase confirmations. Preserve the supplied theme/logo and user edits. Do not deploy, link a hosted Supabase project, charge money, send real external mail, or import real private member data. Finish independent work before reporting missing credentials or private-site evidence. Return a matrix of each item, changed files, tests actually run, outcomes and precise remaining blockers for Codex re-review.
