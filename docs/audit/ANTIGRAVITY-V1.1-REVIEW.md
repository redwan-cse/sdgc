# v1.1 local release review and correction prompt

Reviewed **2026-10-17**, at **2cbee76f4a425109bb11d38185bdcce16460800e**.

## Decision and scope

**Changes requested before v1.1 acceptance.** The existing automated gates pass, but focused checks expose business and authorization defects that those tests do not detect.

The owner clarified that **v1.1 is a local development release using simulations**. No real payment account or hosted Supabase project is connected. That is acceptable for this release. Do not require live Stripe, remote Supabase, production SMTP, DNS changes or a real member import to satisfy this review. A production cutover is not the current assignment.

The `StripePaymentProvider` currently generates session-shaped identifiers without contacting Stripe. Treat it as a contract stub, not a verified sandbox integration. A clearly identified, isolated local simulator is acceptable; an unconfigured public webhook accepting forged confirmations or an unlabeled paid ticket receipt is not an adequate simulation boundary. Correct the production handoff accordingly.

Codex reviewed source and ran the checks below. Application code and migrations were not changed. Focused probes used local synthetic data; their temporary payment, media object/metadata and audit rows were removed. Notification probes sent only to local Mailpit.

## Independently observed verification

| Gate                                     | Result                                                                                                                            |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Initial Git status                       | Clean `main` at the revision above                                                                                                |
| `npm run check`                          | Passed: formatting, Biome, TypeScript, 44 unit tests in 9 files                                                                   |
| `npm run build`                          | Passed: 32 route entries                                                                                                          |
| `npm run db:lint`                        | Passed: no schema errors/warnings                                                                                                 |
| `npm run db:test`                        | Passed: 40 tests in 4 files                                                                                                       |
| `npm run test:integration`               | Passed: 104 tests in 12 files                                                                                                     |
| `npm run test:e2e -- --workers=4`        | Passed: 140 tests, desktop Chromium and Chromium with the iPhone 13 viewport, approximately 1.3 minutes                           |
| Local type generation compared in memory | Matches committed types after Prettier normalization; raw Windows generator formatting differs. No generated file was overwritten |
| Client artifact secret check             | Local service-role literal absent from 53 inspected `.next/static` files; the literal was not printed                             |
| Current GitHub CI                        | Successful at this exact revision: <https://github.com/redwan-cse/sdgc/actions/runs/39001896049>                                  |
| Fresh database reset/replay              | Not repeated in this review; current-stack gates passing do not independently prove a fresh replay                                |

Browser execution repeatedly logged failed Storage image optimization requests: loopback upstreams were blocked by Next.js's private-IP protection. Some requested paths also refer to nonexistent seed assets. The passing tests do not establish that these images loaded. Keep deliberately missing-image fixtures out of the normal gallery, and assert successful image decoding for actual content.

## Confirmed improvements to preserve

- Signup now has a database provisioning trigger; it whitelists profile fields and creates pending membership rather than trusting role/payment metadata.
- Address Line 2 and separate gardening/experience fields exist through the application and schema.
- Username resolution uses exact normalized equality rather than `ILIKE` wildcard matching.
- Profile/interests updates use an owner-scoped atomic RPC.
- Direct member access to another member's private profile columns is restricted. The directory projection excludes address/birthday/spouse and filters ineligible targets.
- Anonymous contact-table inserts and ordinary-member direct audit inserts are revoked.
- JSON-LD serialization and login return-path validation have dedicated fixes/tests.
- The local payment adapter rejects hosted Supabase URLs and supports a separately flagged local production-build test mode. Keep that separation.
- Real local notification capture works when Mailpit is reachable. Its failure/retry behavior still needs correction below.

## Required corrections

### V11-01 — Make financial simulation and the webhook boundary explicit

**Evidence:** `src/features/payments/stripe-provider.ts:83–86` accepts a signature-shaped header when the webhook secret is absent. `src/app/api/webhooks/stripe/route.ts:57–70` then confirms the referenced payment through the administrative client without validating the expected provider session, amount, currency or paid state.

**Local reproduction:** against a temporary synthetic USD 50 pending payment, an anonymous HTTP POST to the production-built local route with `t=1,v1=arbitrary-forged-signature`, `amount_total: 0`, `currency: "jpy"` and `payment_status: "unpaid"` returned HTTP 200 and set the payment to `confirmed`. Membership status stayed unchanged, as required, but the financial confirmation boundary failed.

**Implement:**

- With no configured webhook secret, reject/disable the provider webhook without writing financial state. Keep local simulated confirmation in the explicitly enabled loopback-only simulator path. An arbitrary signature-looking string must never serve as authentication.
- Use a local test webhook secret and correctly computed signatures for handler tests; no actual Stripe account is necessary. Test missing secret, invalid/stale signatures, malformed events, wrong amount/currency/session/term and unpaid completion.
- Bind any supported webhook transition to an existing expected payment/provider reference and allowed prior state. Store the session/payment-intent/charge mappings separately: completion currently saves a `cs_*` ID, but failure/refund branches search that same column using `pi_*`/`ch_*` IDs (`route.ts:67,109,124`).
- Use durable unique event records and atomic, idempotent transitions, including concurrent/reordered delivery. Do not ignore failure/refund database errors or acknowledge an unapplied transition as success.
- Keep real provider configuration explicitly **unconfigured/deferred**. Do not construct a fake `checkout.stripe.com` destination and describe it as a working provider session (`stripe-provider.ts:64–69`). A local mock checkout must remain visibly local and simulated.

For this local release, the whole Stripe path may instead remain explicitly disabled/unconfigured while the loopback-only simulator supplies the demo. In that case, unsupported provider lifecycle operations must fail closed, and real provider verification remains a future prerequisite. Do not require a real gateway connection merely to close this item.

### V11-02 — Make the ticket flow a safe, honest local simulation

`src/features/tickets/actions.ts:111–138` returns a random, unpersisted order with `status: "confirmed"` without payment or an explicit simulation guard. The component displays “Total Paid” and printable admission instructions. `getTicketEvents()` also always includes a hardcoded 2026 Garden Walk even if the published event is absent.

Keep ticket testing local and visibly labeled **simulated / no payment collected**. Gate the server action as strictly as the dues simulator, use the selected persisted event/configuration, and stop issuing unlabeled paid confirmations. Persist synthetic orders/receipts if the release claims a reloadable order workflow; otherwise identify the screen as a preview and remove the completed-ticketing parity claim. Do not invent inventory/check-in requirements without legacy evidence. No live merchant connection is required for v1.1.

### V11-03 — Repair current-term renewal and historical import behavior

- `src/features/membership/queries.ts:87–105` falls back to the latest historical membership. `/membership` uses that summary unchanged (`src/app/(public)/membership/page.tsx:24`), and `dues-card.tsx:26,43` treats its confirmed payment as current and submits its old year. Separate historical status from current-term eligibility so a paid 2026 member can renew for a configured 2027 term.
- `scripts/import-wordpress.mjs:548–564,693–702` assigns imported membership status to the current/latest term, ignoring the export's membership year. Preserve explicit historical terms and approval history; reject unknown terms instead of silently promoting old approval to a new year. Use Detroit time where a default is justified, not machine-local `getFullYear()`.
- Add a year-rollover browser/application test with a paid prior term and no current membership, then simulate current-term payment and prove manual approval is still separate. Add a real synthetic importer apply test proving prior-year approval cannot grant current-year membership.

### V11-04 — Stop event editing from corrupting time and venue

`admin-events.tsx:47–48` copies UTC strings into `datetime-local`; lines 65–66 interpret them in the browser timezone. An unchanged `2026-07-11T14:00:00Z` saves as `18:00Z` in Detroit or `08:00Z` in Dhaka. Convert Detroit wall time explicitly in both directions for create/edit, including DST ambiguity handling appropriate to the UI.

The editor submits `venueName` without `venueId` (`admin-events.tsx:61–70`), while `updateEventAction` writes `venue_id: input.venueId || null` (`admin/actions.ts:300`). Thus a normal edit clears an existing venue. Preserve the ID, implement actual venue selection/update, and verify persistence after reload.

Add browser tests in Detroit and a different developer timezone: open an existing event, save without changes, and verify the stored instant and venue are unchanged; also test an intentional change.

### V11-05 — Enforce media privacy at the object boundary

`admin/actions.ts:415–423` changes only `media_assets.is_public`. The Storage SELECT policy in `20261016025356_storage_and_media.sql:12–17` authorizes every path outside `private/` independently of that flag.

**Local reproduction:** a temporary media row with `is_public: false` was absent from anonymous metadata queries, but its 68-byte object remained anonymously downloadable, and an anonymous client could mint a new signed URL for it.

Implement a forward migration coupling object access to the intended publication/privacy rules. Verify real allowed and denied downloads/signing before and after hiding an asset, using fresh anonymous/member/staff clients. Document the chosen behavior for previously issued signed URLs and image/CDN caches; test it rather than claiming that hiding a listing instantly revokes already cached bytes. Do not make the whole bucket public to fix gallery rendering.

### V11-06 — Finish persistent media administration and image rendering

- `/admin/media` uses the public query (`src/app/(admin)/admin/media/page.tsx:11`), which excludes hidden assets (`media/queries.ts:272`). Use a complete staff query so a hidden asset can be found and republished after reload.
- `media/queries.ts:324–331` merges/falls back to hardcoded local photographs with non-UUID IDs such as `gal-01`. Those items cannot be managed by UUID-backed edit/delete actions and cannot be unpublished. Import curated assets into the real model and remove the silent fallback. Keep an explicit empty/error state.
- The Add Asset form accepts a Storage path; `createMediaAssetAction` inserts metadata only (`admin/actions.ts:489–500`). Implement an actual file picker/upload with validated type/size/object metadata. Use authorized URLs for private-bucket previews, not `/object/public/` fallbacks.
- Derive album membership/count/order/cover from real `album_items`, rather than the hardcoded gallery array (`media/queries.ts:216`). Persist ordering and visibility changes.
- Fix local production-build image delivery with a narrowly scoped development/test configuration or suitable local image path. Preserve deployed SSRF protection. Assert actual image loading, not just presence of an `<img>` or card.

Acceptance includes upload → edit → publish → public render → hide → denied object access → staff reload → republish, plus delete and failure handling.

### V11-07 — Finish editable content and bounded calendar queries

- `getHomePageContent()` reads `content` but returns hardcoded sections; the homepage ignores its editable title (`content/queries.ts:88–133`, `src/app/(public)/page.tsx:44–49`). Garden Walk ignores its body/sections and hardcodes 2026/date/prices/event slug (`garden-walk/page.tsx:85–116`). The admin action/form only exposes title/subtitle/status. Implement real body editing and public rendering, with publish/unpublish behavior. Bind annual promotion details to verified content/events rather than invented defaults.
- `events/queries.ts:62–64` caps the query at the earliest 100 published events. Month/day routes do not pass the selected date range, so enough historical records make later dates disappear. Query Detroit-local intervals with multi-day overlap semantics and paginate list/history. Add a case with more than 100 historical rows and a current event.
- Prove these through the application: edit and reload public content, unpublish, change event ranges and reload. Raw SQL/REST row reads alone do not prove the renderer uses the data.

### V11-08 — Make audit records truthful and transactional

- `setUserRolesAction` still inserts directly into `audit_events` using the ordinary authenticated client (`admin/actions.ts:124–130`) despite the new revoked INSERT grant. The error is ignored. Other event/page/media actions retain the same pattern. There is no committed role-audit trigger supplying those records.
- The new `log_audit_event` RPC permits a treasurer to supply arbitrary action/entity/details (`20261016143005_security_and_privacy_boundaries.sql:105–121`). A local treasurer call inserting `roles.updated` without any role mutation succeeded; the synthetic row was then removed.

Generate trusted audit events inside capability-checked domain transactions/triggers. A role change and its audit record must succeed or fail together. Remove the publicly callable generic path for inventing trusted actions. Test successful grant/removal produces exactly one truthful event, unauthorized fabrication is denied, and a forced failure rolls back the operation.

### V11-09 — Complete importer identity resolution and failure reporting

The original username collision now rejects a different Auth email. The inverse path remains: if the imported username is absent, `listUsers()` finds a same-email Auth user but its existing profile is not loaded (`import-wordpress.mjs:589–610`). Reconciliation receives `existingProfile: null`, and the later upsert can overwrite a different existing username/profile. The current helper test supplies evidence the real caller omits.

Resolve complete Auth/profile identities in both directions, using reviewed stable mappings. Reject conflicts and lookup errors; paginate Auth lookups. Test the actual synthetic apply workflow, including rerun/idempotence and both conflict directions. Stop dependent membership/interests writes after a profile failure. Return a failing CLI status when the report has errors instead of printing unconditional success. Preserve the local-only target guard and zero-PII reporting.

### V11-10 — Complete local contact abuse limits and delivery retry

Direct table writes are closed, but the public action still has no durable submission limiter (`contact/actions.ts:37–50`). Add bounded durable abuse controls around the real writer and test allowed submissions, throttling, oversized input and recovery. Auth's rate limits do not limit this writer.

Local Mailpit delivery succeeds when available. On capture failure, however, `notifications.ts:72–81` reports success and adds the message to its process-local deduplication set. A second attempt is then skipped as “deduplicated.” This was reproduced with an unreachable loopback capture URL. Persist queued/delivered/failed state, mark delivery only after acknowledgment, and support bounded retry without duplicate capture. Test actual Mailpit receipt and an outage/restart/retry. Production SMTP remains deferred.

### V11-11 — Correct evidence and the release handoff

- Preserve the distinction between a **local simulation release**, verified provider sandbox behavior, legacy parity and production readiness. The absent production services are intentionally deferred, not a request for credentials.
- Correct `docs/DELIVERY.md`, `PROJECT-INTERNAL-AUDIT.md`, `PARITY-LEDGER.md` and the original `docs/discovery/parity.csv` together. The latter still has blocked private-site evidence. Do not turn redirects, raw row reads, fake provider references or screenshots into proof of complete private/provider parity.
- Rewrite `CODEX-PRODUCTION-HANDOFF.md` as a future, separately authorized runbook. It currently directs remote linking/push/import and uses inconsistent `.org` domains; the owner has not selected a new production domain. Do not execute it now. Also, `npm run db:types` explicitly generates **local** types, not production types.
- Strengthen tests rather than preserving their current count: follow actual local signup/recovery email URLs through app routes, test transactional rollback, verify image bytes/decoding, and cover the complete persisted admin journeys above. R6's fabricated signature must become a rejected case, not its successful provider-authentication fixture.

## Copyable instruction for Antigravity

Antigravity: v1.1 is a **local development release with simulated payments**, as explicitly clarified by the owner. Read `AGENTS.md`, this whole review, and the existing architecture/verification plans. Do not deploy, link remote Supabase, request production credentials, run live charges, change DNS, send external email or import private member data. Preserve the theme/logo and user changes.

Resolve V11-01 through V11-11 before asking Codex to accept v1.1. Start with the webhook and media-access boundaries, then current-term/import correctness, event editing, and persistent admin/content/contact workflows. Write meaningful failing regressions first; keep schema changes in forward CLI-created migrations and regenerate real local types. Retain and clearly label safe local simulations; implementing or connecting a real payment provider is not a v1.1 prerequisite. Remove production/provider claims unsupported by the implemented scope.

Work through these authorized local changes without routine phase approvals. Record evidence in `docs/verification/v1.1-corrections.md`, mapping every V11 item to changed files, tests, actual results and remaining evidence limitations. Commit coherent increments; verify the authenticated `redwan-cse` account before any authorized GitHub write. Keep the existing release tags intact and **do not publish/tag v1.1 until the corrected candidate is re-reviewed**.

Before returning: rehearse the isolated synthetic `sdgc` migration replay/provision, verify generated type consistency, and run schema lint, pgTAP, unit/integration checks, production build and affected desktop/mobile browser journeys. Never replace a failed or unexecuted check with a passing claim. Return the exact candidate commit and a V11-01–V11-11 acceptance matrix for Codex re-review.
