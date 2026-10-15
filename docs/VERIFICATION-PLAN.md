# Verification and delivery gates

## Evidence rules

Every phase produces `docs/verification/phase-NN.md` with commit, environment/versions, parity IDs, exact commands, pass/fail/blocked status, test totals, and artifact paths. Keep raw logs/screenshots/traces in ignored `artifacts/` or CI artifacts, without tokens or real member data. Record a failing check before a business-rule fix, then its passing result. A mocked test cannot prove RLS or provider behavior.

Use synthetic personas: anonymous, email-unconfirmed, registered/pending, active member A, active member B, expired, suspended, editor, treasurer, admin. These identities are generated locally; credentials live only in ignored test state. Editor/treasurer role and active membership are independent dimensions. Include a combined editor+treasurer persona to prove additive roles without admin escalation.

## Commands and when they become mandatory

| Command                                   | Purpose                                                                  | Required from                       |
| ----------------------------------------- | ------------------------------------------------------------------------ | ----------------------------------- |
| `npm ci`                                  | Reproducible lockfile install                                            | P1                                  |
| `npm run check`                           | Prettier, Biome, generated route types, TypeScript and unit tests        | Every code phase                    |
| `npm run build`                           | Production compilation and prerender validation                          | Every code phase                    |
| `npm run test:e2e`                        | Desktop/mobile browser journeys against built app                        | P1; suite grows per phase           |
| `npm run db:reset`                        | Replay this project's migrations and seed                                | P3                                  |
| `npm run db:provision`                    | Create synthetic Auth/Storage personas/data via local APIs               | Add in P3                           |
| `npm run db:lint`                         | Database function/schema lint; warnings fail                             | P3                                  |
| `npm run db:test`                         | pgTAP schema/RLS/role invariants                                         | P3                                  |
| `npm run test:integration`                | Real local Supabase Data API/Auth/Storage tests                          | Add in P3; mandatory from P3 onward |
| `npm run db:types`                        | Regenerate schema types; fail CI on committed drift                      | P3                                  |
| `npm audit --omit=dev --audit-level=high` | Production dependency advisories                                         | P1 and delivery                     |
| `npm audit`                               | Review development advisories separately; record remediation/disposition | P1 and delivery                     |

Commands marked "Add in P3" deliberately do not exist at bootstrap. P3 must implement them and wire CI, rather than recording them as skipped forever. Once application migrations exist, the checked-in database CI job automatically starts/reset/lints/tests/type-checks the schema. Antigravity adds API integration and full-stack browser provisioning to that job in P3/P4.

## Acceptance test catalog

| IDs / owner         | Required cases and assertions                                                                                                                                                                                                                               |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UI-01 / P2          | Header/footer links work; mobile menu traps/restores focus appropriately; Escape closes overlays; skip link reaches main; 360px has no horizontal overflow.                                                                                                 |
| UI-02 / P2/P8       | All forms have labels, visible required/error states, preserved input after error, double-submit protection and keyboard access. Axe has no serious/critical violations; manual contrast and keyboard checks are recorded.                                  |
| AUTH-01 / P4        | Signup persists every required profile field and selected interest once; confirmation email appears locally; unconfirmed users do not gain member access. Duplicate username/email and password mismatch yield safe errors.                                 |
| AUTH-02 / P4        | Email and username login both work; invalid credentials do not disclose user/email existence; logout invalidates application access. Refresh works after an access-token expiry; private pages never enter public caches.                                   |
| AUTH-03 / P4        | Recovery succeeds through local mail capture; expired/reused link fails; password change requires appropriate auth state. External/encoded `next` URLs cannot redirect outside the site.                                                                    |
| RBAC-01 / P3/P4/P6  | Anonymous, member, editor, treasurer, combined roles and admin each match the architecture matrix, tested by URL, server mutation and Data API. Denied UI access alone is insufficient.                                                                     |
| RBAC-02 / P3/P4     | Member A cannot read/update B's profile or payment history by forging IDs. Public queries cannot read PII, drafts, messages or private documents. No owner can update trusted role/approval/payment columns via extra payload fields.                       |
| RBAC-03 / P4/P6     | Role removal and suspension block actions with existing cookies; last-admin removal fails; assigning another privileged role requires an authorized admin and produces an audit record.                                                                     |
| PROF-01 / P4        | Optional address/phone/spouse fields round-trip; allowed birthday month/day validates including February 29 without inventing a birth year; Master Gardener and eight interest codes round-trip. Auth email changes use verification.                       |
| MEM-01 / P3/P4      | One membership per user/term; approved current term is active, pending/expired/suspended is not. At `2027-01-01T03:00:00Z`, Michigan is still in membership year 2026; at `2027-01-01T05:00:00Z`, year is 2027.                                             |
| PAY-01 / P5         | Server term/rate overrides tampered form amounts. Checkout redirect cannot confirm payment. Invalid signature or mismatched amount/currency fails; duplicate/out-of-order provider events are handled once. Confirmed payment still awaits manual approval. |
| PAY-02 / P5/P6      | Check instructions are accurate; only treasury/admin can reconcile and approve. Failed/refunded payments are visible; next-year renewal preserves history; concurrent duplicate approval/reconciliation is safe.                                            |
| EVT-01 / P5         | Keyword/date filtering, list/month/day, previous/upcoming and event detail work on real data. Draft/private events do not leak. Validate empty, past, multi-day, all-day and cancelled states where supported.                                              |
| EVT-02 / P5         | America/Detroit spring/fall DST transitions preserve intended displayed local times; no one-day shift for all-day events or date-picker URLs. Calendar export/subscription is tested if P0 verifies it.                                                     |
| MEDIA-01 / P3/P5/P6 | Public gallery shows only published media; keyboard lightbox works; captions/alt/order persist; upload MIME/size is validated; replacement requires authorized insert/select/update; private objects deny public download.                                  |
| CON-01 / P5         | Valid contact persists before success; invalid fields/honeypot/rate-limited traffic fails; visitor cannot list messages. Notification failure does not discard a saved message; retries avoid duplicate messages.                                           |
| ADM-01 / P6         | Staff can create/edit/publish/unpublish appropriate content/events/albums; changes revalidate public views; members cannot call these actions directly. Member approval/role/profile management and inbox operations follow capabilities and are auditable. |
| MIG-01 / P7         | Repeat synthetic import twice with same IDs: same counts/no duplicate users, memberships or media. Invalid rows produce a rejection report; unsafe markup never executes. No credentials or private exports tracked.                                        |
| SEO-01 / P7         | Every old route returns its preserved page or deliberate 301/308 without loops; query parameters survive intended redirects; unknown routes return 404; canonical/sitemap excludes private routes; event JSON-LD validates.                                 |

## Database test method

Test schema constraints with pgTAP transactions that roll back. Verify RLS/grants using realistic `anon`/`authenticated` identities and claims plus actual API tests from local Auth sessions. Include successful and denied UPDATE/INSERT/DELETE/SELECT; a service-role client is only for fixture setup and assertions requiring privilege, never evidence that member access controls work. Test views, functions and Storage separately. Inspect grants and exposed schemas as well as table policies.

For a fresh replay, use only the disposable `sdgc` database. Run reset, provision and tests, then reset/provision again to prove repeatability. Ensure no uncommitted schema drift remains; regenerate types and compare to Git. Test failure returns a nonzero exit code and blocks the phase.

## Browser and performance evidence

Bootstrap runs Chromium desktop/mobile. P8 adds real Firefox/WebKit projects when supported. Cover both public and authenticated journeys, fresh pages and direct deep links; capture errors from console/network and resolve unexpected application failures. Persist Playwright reports/traces only on failure or meaningful milestone screenshots.

Target LCP ≤2.5s and CLS ≤0.1 on representative public pages with realistic seeded media and a documented mobile-throttling profile. INP ≤200ms requires meaningful interaction/field evidence; do not claim it from an empty page or a single Lighthouse run. Use a recorded mobile Lighthouse performance/accessibility audit as a lab signal; report actual metrics and fixtures, not a guaranteed production score. Check desktop/mobile navigation, image sizing and gallery pagination manually.

## Fresh-checkout delivery rehearsal

1. Verify a clean checkout and Node/npm/Docker versions; run `npm ci`.
2. Read local stack/project ID and occupied ports. Start only `sdgc`; copy `.env.example` to ignored `.env.local` and populate local keys.
3. Run reset, synthetic provision, DB lint, pgTAP and API integration tests. Regenerate database types and verify no diff.
4. Run `npm run check`, production dependency audit, `npm run build` and all browser journeys using local API/Auth/Storage/email capture.
5. Repeat migration/import replay checks, route/media reconciliation and permission matrix. Inspect tracked files for secrets/private payloads.
6. Produce `docs/DELIVERY.md` with setup commands, test totals, commit, links to phase evidence, parity status, provider/WordPress export gaps, and next operational actions.

## Completion labels

- **Frontend ready:** P2 evidence exists; any fixture data is disclosed.
- **Migrations ready:** P3 replay/RLS/type evidence exists.
- **Local full-stack ready:** P4–P6 flows use real Docker services and tests pass.
- **Legacy parity verified:** every discovered current function is mapped and tested; no unknown private requirement remains.
- **Production ready:** requires separate environment, provider, content/account migration and operational review; it is not implied by local readiness.

If a provider sandbox or private-site evidence is unavailable, deliver all unaffected code and mark that specific label blocked. Never convert a missing prerequisite into a passing check.
