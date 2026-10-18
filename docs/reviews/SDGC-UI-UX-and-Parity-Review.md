# SDGC: UI/UX and legacy-parity review

**Review date:** October 18, 2026  
**Repository snapshot:** [`6967d1c`][commit], version 1.1.0  
**Verdict:** Keep the green palette, club logo, and Inter/Lora typography. Fix factual content, incomplete journeys, and privacy/financial safeguards before another visual overhaul.

The rebuild has substantial functionality already. This is not a case of needing to recreate calendars, a gallery, or a member portal from scratch. The remaining problems are a mixture of incorrect content, partially connected features, missing legacy data, and interaction defects.

## What this review establishes

I visually inspected all seven supplied screenshots, compared the original public website with the current source, and traced public, member, payment, and administrative workflows. Source findings are pinned to the commit above.

**No new-site browser session, build, test suite, real authentication email, payment, or database operation was executed.** The screenshots do not identify their exact build. Mobile findings below come from source, not supplied mobile screenshots. Private WordPress behavior remains unverified.

The repository's [v1.1 review][v11] explicitly describes an approved **local release with simulations**. Real Stripe, hosted Supabase, external email, private-data import, and deployment are separate work, not prerequisites for this UI patch.

## 1. Fix before client acceptance

### A01. Admin profile editing can silently undo a member's privacy choice

**High priority, confirmed in current source.**

The admin editor omits directory opt-out, alternate phone, and spouse name. Its save action supplies `false` or empty strings for those omitted properties, and the latest database function writes them unconditionally. Editing an address can therefore make an otherwise eligible opted-out member directory-visible and erase the other two fields.

There is a second incomplete feature here: **Administrative Notes appears to save, but does not persist.** The editor updates its local state and passes `notes`; the server action does not store it.

**Patch:** Use validated partial-update semantics, preserving every untouched field. Store staff notes behind staff-only permissions, or remove the misleading editable control until supported. Do not expose staff notes through the member directory.

**Acceptance:** Edit only an address, reload through a fresh session, and verify opt-out, alternate phone, spouse name, and all other untouched fields remain unchanged. Save a note and prove it persists while ordinary members cannot read it.

Sources: [editor][admin-members], [save action][admin-actions], [latest profile RPC][workflow-migration]. Birthday is not overwritten by this RPC; this finding should not be expanded to claim that it is.

### A02. Approval and dues reconciliation allow invalid business-state transitions

**High priority, confirmed in current source. This is not an anonymous authorization bypass.**

An authorized operator can approve an unpaid membership. The active-member predicate then checks approval and term dates, not payment. The approval function also accepts any non-approved status, including suspended or rejected records, without a distinct reinstatement decision.

The reconciliation function can mark any non-confirmed payment confirmed, rather than limiting the normal check-clearing workflow to eligible pending checks. Failed/refunded/card records need different treatment. Some administrative displays flatten these distinctions and hardcode `Paid ($50)`.

**Patch:** Enforce the documented payment-plus-manual-approval contract in the database and UI. Define allowed transitions explicitly; keep any client-approved waiver or reinstatement policy separate and audited. Preserve failed/refunded states. Show the actual term, amount, method, and proposed transition before confirmation.

**Acceptance:** Unpaid approval cannot silently grant active-directory access; clearing a check does not itself approve membership; failed/refunded/card records cannot pass through ordinary paper-check reconciliation. A changed dues rate is reflected consistently without rewriting historical payment amounts.

Sources: [approval/reconciliation functions][approval-migration], [active-member predicate][rbac-migration], [admin editor][admin-members], [legacy dues policy][legacy-membership].

### A03. Replace contradictory and unsupported content with one approved source of truth

**High priority, confirmed source and legacy-content differences.**

| Fact                | Original website                                                                                                   | Rebuild evidence                                                          | Required correction                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Club history        | Homepage says founded in **1928**.                                                                                 | Home/About headings say **1980**, and the migration seeds that year.      | Reconcile with the client; do not retain an unsupported replacement history.                                    |
| 2026 Garden Walk    | Event page says **July 18, 10 a.m. to 4 p.m.**, **$15 plus a $2 online convenience fee**.                          | Garden Walk and ticket code use **July 11** and **$20/$25**.              | Store approved historical/event facts centrally. Do not present either historical offer as currently on sale.   |
| Tour start/check-in | Old content refers to the Old School House and History Center at Center Street.                                    | Simulated receipt tells visitors to bring it to **Saugatuck City Hall**.  | Verify the actual start location; never invent admission instructions.                                          |
| Upcoming activities | Legacy list currently shows **Nov. 9 Board Meeting, Nov. 10 Potluck at Fenn Valley Winery, Dec. 7 Holiday Party**. | Supplied calendar shows zero upcoming events and sample archived records. | Reconcile/import authorized public event data. The calendar engine exists; missing real records are a data gap. |
| Scholarships        | Legacy About supports two local students' higher education.                                                        | Copy narrows eligibility to horticulture/botany and related degrees.      | Remove unsupported eligibility restrictions unless the client confirms them.                                    |

The Garden Walk page also displays an unconditional ticket CTA after the event has ended. The homepage's upcoming-event query substitutes past events when there are no future events, while the heading still says â€œUpcoming Club Events.â€

**Acceptance:** Current, ongoing, past, cancelled, and not-yet-announced events have truthful states. Dates, fees, venue, ticket availability, and metadata agree everywhere. No invented future event is used to fill an empty calendar.

Sources: [legacy home][legacy-home], [legacy About][legacy-about], [legacy Garden Walk event][legacy-walk-event], [legacy upcoming list][legacy-events], [new home][home], [new About][about], [new Garden Walk][walk], [content queries][content], [event queries][event-queries], [ticket actions][ticket-actions].

### A04. Account navigation disappears at tablet widths

**High priority, confirmed source defect.**

The public header enables desktop navigation at `md`, hides the mobile controls at `md`, but does not show account actions until `lg`. Between those breakpoints, approximately **768 to 1023 CSS pixels**, Login/Join/Profile and the theme control disappear from the header.

The mobile menu also lacks a sign-out action. If an open menu is hidden by a breakpoint change, its body-scroll lock/focus handling needs cleanup.

**Patch:** Use one coordinated breakpoint or a compact intermediate layout. Retain public and account navigation at every width. Add nested-route active states and `aria-current`; close and clean up the mobile dialog when its layout becomes inactive.

**Acceptance:** Test 767, 768, 820, 1023, and 1024 pixels, anonymous/member/staff states, keyboard navigation, and resizing with the menu open.

Sources: [header][header], [mobile navigation][mobile-nav].

### A05. Calendar filtering is partly cosmetic and date boundaries are wrong

**High priority, confirmed source defects.**

The UI derives category buttons from `event.category`, but the public event query never populates that field. Search/category state lives only in React and does not survive refresh or view switching. Server-side search only queries titles, while the interface promises keyword or venue search.

Day/month routes build UTC-midnight bounds for dates that the UI treats as Detroit-local dates. Late-evening and DST-boundary events can fall outside the query. Events are classified as past from their start time, so an ongoing event is already treated as past. Cancelled records are excluded by the published-only detail query rather than retaining a useful cancellation notice. Raising the list cap to 500 is not pagination.

**Patch:** Connect real categories, URL-backed filters, consistent search semantics, Detroit-local half-open intervals, explicit ongoing/past status, retained public cancellation notices, and bounded pagination.

**Acceptance:** Real category choices appear; search by a known venue works; filters survive refresh/back/forward and list/month/day changes. Cover Detroit late evening, DST, multi-day overlap, invalid dates, cancellation, and more than 500 historical records.

Sources: [event query][event-queries], [list controls][event-list], [day route][event-day], [month route][event-month].

### A06. Registration and recovery need a complete next-step journey

**Confirmed UX/parity gaps; recovery-link execution still needs verification.**

Registration redirects to login after 1.5 seconds instead of retaining a clear email-confirmation state. Login does not render several generated registration/logout/callback notices. The old reset page accepts **username or email**; the new recovery action accepts email only.

The recovery email redirect points directly to `/reset-password`, while code exchange is handled elsewhere. That is a likely failure for a PKCE/code link, but the actual captured email/template must be followed before calling it a reproduced failure.

The registration data model includes directory opt-out, but the form offers no checkbox. Required fields use visual asterisks without consistently passing required semantics to the inputs. Form inputs also need explicit names/autocomplete hints.

**Patch:** Provide a durable confirmation-pending screen, bounded resend, allowlisted login notices, username/email recovery, usable expired-link handling, a real directory-privacy choice, password visibility controls, and an error summary focused on the first invalid field.

**Acceptance:** Follow actual locally captured signup/recovery links, not synthetic session shortcuts. Confirm successful reset, expired/used link behavior, generic unknown-identifier responses, privacy-field round-trip, and retained form values after errors.

Sources: [registration form][register], [auth actions][auth-actions], [login form][login-form], [legacy password reset][legacy-reset].

### A07. The CMS cannot edit much of the content it claims to manage

**Confirmed missing administration capability.**

The page editor and save action expose only title, subtitle/meta-description, and publication status. Home/About read some persisted body content but keep most sections and CTAs hardcoded. **Garden Walk uses its queried title/subtitle but ignores the returned body sections entirely.**

**Patch:** Add a small validated structured-content editor using existing project patterns, not a replacement CMS. Allow authorized staff to update real body sections, approved images, captions, and relevant CTA/event references. Render those values publicly and preserve preview/publish semantics.

**Acceptance:** Change a sentence in each managed page, save, reload the public page, and see exactly that change. Draft content stays private. No duplicate About aliases cause a single-row query failure.

Sources: [content editor][admin-content], [page action][admin-actions], [content queries][content], [Garden Walk renderer][walk].

### A08. Ticketing is a local preview, not completed sales parity

**Confirmed limitation; live integration is intentionally deferred.**

Ticket checkout is now explicitly local-simulation gated, which is good. However, it still lists past ticketed events, assigns every event $20/$25 pricing, returns an unpersisted order, hardcodes 2026 in references, and supplies unsupported check-in instructions. Receipt/email promises must match what exists.

The Stripe-named adapter is a contract stub, not proof of provider integration. Keep it unconfigured/disabled outside the explicit simulator rather than requesting live credentials for this patch.

**Acceptance:** Past/cancelled/closed-sale events are rejected server-side. The preview says **â€œSimulation, no payment collected, not valid for admission.â€** Either persist and reload synthetic orders with local delivery capture, or clearly describe the screen as a non-persistent preview. Ticket orders never grant membership.

Sources: [ticket implementation][ticket-actions], [Stripe adapter][stripe-provider], [v1.1 scope][v11].

## 2. UI improvements by screen

These refine the existing design rather than replacing it.

| Screen             | Recommendation                                                                                                                                                                                                                                                                                                                            |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Join**           | Shorten the repeated dues explanation. Keep all legacy fields, but group account, contact, and optional interests clearly. Use â€œCreate account and apply,â€ explain confirmation/payment/manual approval, add privacy choice and password visibility. Do not add a complicated wizard just to shorten the screenshot.                   |
| **Gallery**        | Correct captions and alt text before polishing the grid. The screenshots label a registration-table photo as a shade garden and a plant-sale sign as a woodland garden. Repeated images have unrelated descriptions. Keep the logo out of event-photo results unless explicitly in a brand album; do not invent photo dates or locations. |
| **Garden Walk**    | Lead with one verified garden/community photograph and a compact date/time/location/ticket-status block. Show an archive state now. â€œTour Route & Detailsâ€ should not promise a route map if the destination only contains a description.                                                                                              |
| **Events**         | Distinguish â€œNo events scheduledâ€ from â€œNo search resultsâ€ and from a loading failure. Offer clear filters, reset, next-available date, and a newest-first archive. Preserve the list/month/day controls already implemented.                                                                                                       |
| **Contact**        | Keep the simple form, enlarge labels/input text, and add a short approved data-use explanation. Success should mean the message reached the club inbox, not imply unverified email delivery or an invented response time.                                                                                                                 |
| **Login**          | Retain the clean card, reduce unnecessary empty space where helpful, add show/hide password, and explain signup, logout, confirmation failure, and expired-session states. Preserve username login.                                                                                                                                       |
| **Admin overview** | Keep the sidebar and summary cards, but make relevant counters lead to filtered work queues. Add actionable pending approvals/messages rather than filling empty space with decorative charts. Show the current term and actual financial states. Use a collapsible mobile navigation.                                                    |
| **Shared shell**   | Simplify the public footer: move admin-only links behind staff access and put contact in a public section. This is clarity, not an authorization control. Replace literal `&nearr;` rendering with an icon and remove internal wording such as â€œReal RBAC audit enabled.â€                                                              |

The gallery engine already includes filtering and a lightbox. Improve deterministic multi-album membership and image order instead of rebuilding it. Verify actual image decoding, caption/image matches, full captions in the viewer, Escape/arrow navigation, and return focus.

Sources: supplied screenshots; [gallery query][media-queries], [gallery viewer][gallery-view], [admin shell][admin-shell], [footer][footer].

### Readability and interaction standards

Use approximately 16px body/input text, 14px supporting labels, comfortable line spacing, and roughly 44px touch targets as design goals. Several current inputs use 14px text and very pale borders. Preserve the palette but measure actual contrast in both themes; do not infer WCAG conformance from screenshots.

Keep keyboard focus visible, associate every error with its field, announce success/failure, and respect reduced motion. Member/content/role editors currently use custom modal containers without a complete dialog/focus-management contract; fix those, not just the public gallery.

The yellow autofilled fields, purple password-manager controls, and development indicator in the screenshots are **not evidence of hardcoded credentials or production UI defects**. Registration state initializes empty. Correct autocomplete attributes and retest in a clean browser profile.

Sources: [input primitive][input], [registration][register], [admin members][admin-members], [content editor][admin-content], [theme tokens][theme].

## 3. Missing versus already implemented

| Capability                                           | Assessment                                                                                                                                                  |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Home, About, Garden Walk, contact routes             | Present; facts, dated promotion, and editorial control need correction.                                                                                     |
| List/month/day/detail calendar                       | Present; filtering, timezone boundaries, cancellation, and data migration are incomplete.                                                                   |
| Per-event/calendar ICS and adjacent-event navigation | Implemented. Do not list these as absent. Verify actual download/import behavior.                                                                           |
| Gallery, album filters, lightbox                     | Implemented. Caption accuracy, multi-album behavior, media completeness, and browser accessibility still need work.                                         |
| Username/email login and profile fields              | Implemented. Username recovery, confirmation guidance, privacy choice, and persisted admin editing are incomplete.                                          |
| Directory and role-based administration              | Implemented. Fix privacy-preserving writes and capability-aware UI; authenticated legacy parity remains unknown.                                            |
| Annual dues, checks, manual approval                 | Implemented in local scope; state guards, retry/idempotency, term eligibility, and accurate displays need review.                                           |
| Page/media/contact administration                    | Present, but body editing, persistent notes, and durable notification-delivery tracking are incomplete.                                                     |
| Public ticket purchases                              | Local simulation only, not verified real ticket commerce. Preserve that distinction.                                                                        |
| Legacy URLs and historical records                   | Core redirects exist. Reconcile actual linked day/date/category/organizer/venue routes and archive records; redirects alone do not prove functional parity. |
| Full private WordPress parity                        | Unknown until an authorized member/admin walkthrough or sanitized inventory is supplied.                                                                    |
| Production payment/mail/deployment                   | Deferred operational work, not authorization granted by this review.                                                                                        |

Do not invent a plant shop, scholarship application portal, recurring subscriptions, newsletter, or donation checkout from marketing copy or leftover WordPress plugin pages.

## 4. Other completion checks

**Contact reliability:** Messages are durably stored and abuse controls exist. Local notification delivery still needs persistent queued/delivered/failed state and bounded retry rather than relying on process memory. Keep a received message successful even if notification delivery fails, and expose the delivery problem to authorized staff. [Contact action][contact-action], [notification dispatcher][notifications].

**Search visibility:** Root metadata declares `/` as canonical while public routes largely omit overrides. Verify rendered canonical tags and fix per-route canonicals, sitemap aliases, and event structured data. Do not mark a paid event as free/in stock because only a ticket URL exists. Use valid Schema.org statuses; there is no `EventCompleted` EventStatusType. [Root metadata][root-layout], [sitemap][sitemap], [event detail][event-detail].

**Evidence hygiene:** The README still describes a bootstrap, while delivery/parity documents claim broad completion. Reconcile those documents with current, exact-commit evidence. Existing test counts and prior green runs do not establish that these newly identified cases pass. [README][readme], [delivery][delivery], [parity ledger][parity].

## 5. What still needs client or runtime evidence

Confirm authoritative club history, event date/price/fee/check-in details, scholarship eligibility, media captions/rights, directory disclosure wording, and any payment-waiver policy. Treat the legacy website as dated evidence, not automatic approval of next year's content.

Verify private member documents, downloads, exports, and other hidden WordPress functions through authorized access. Confirm production provider configuration only in a separately approved operational phase.

For the patch, require exact-head tests and screenshots covering anonymous/member/editor/treasurer/admin roles, 320px through desktop layouts, light/dark/system themes, keyboard use, zoom/reflow, actual local email links, and persisted save/reload journeys. The accompanying Antigravity prompt provides the dependency order and acceptance cases.

## Sources

The links below pin source code to the reviewed version. Original-site pages can change after this review.

Screenshots supplied with the request: [1](https://t90182137473.p.clickup-attachments.com/t90182137473/ff7625fa-6ee8-4686-98cd-0074f6b9bee8/image.png), [2](https://t90182137473.p.clickup-attachments.com/t90182137473/43fd6a3b-efd9-4a21-af40-fcffa71a39fa/image.png), [3](https://t90182137473.p.clickup-attachments.com/t90182137473/70a8d528-ead9-40f5-a604-656a5ccece59/image.png), [4](https://t90182137473.p.clickup-attachments.com/t90182137473/59d9201f-ea97-4565-858a-9a8ae427fefa/image.png), [5](https://t90182137473.p.clickup-attachments.com/t90182137473/20cd5e13-d13d-4976-bc37-e5db75ffe9de/image.png), [6](https://t90182137473.p.clickup-attachments.com/t90182137473/a050e9cd-3d37-44d6-aba8-613ae8e06bf4/image.png), [7](https://t90182137473.p.clickup-attachments.com/t90182137473/8bfbb21b-ae19-49cd-9e56-05f823d3c1b9/image.png).

[commit]: https://github.com/redwan-cse/sdgc/commit/6967d1ccd76f41808acbae3da9d23114bd24b32e
[legacy-home]: https://saugatuckdouglasgardenclub.com/
[legacy-about]: https://saugatuckdouglasgardenclub.com/aboutourclub/
[legacy-walk-event]: https://saugatuckdouglasgardenclub.com/event/2026-garden-walk-fundraiser/
[legacy-events]: https://saugatuckdouglasgardenclub.com/events/list/
[legacy-membership]: https://saugatuckdouglasgardenclub.com/membership/
[legacy-reset]: https://saugatuckdouglasgardenclub.com/password-reset/
[v11]: https://github.com/redwan-cse/sdgc/blob/6967d1ccd76f41808acbae3da9d23114bd24b32e/docs/audit/ANTIGRAVITY-V1.1-REVIEW.md
[admin-members]: https://github.com/redwan-cse/sdgc/blob/6967d1ccd76f41808acbae3da9d23114bd24b32e/src/features/admin/components/admin-members.tsx
[admin-actions]: https://github.com/redwan-cse/sdgc/blob/6967d1ccd76f41808acbae3da9d23114bd24b32e/src/features/admin/actions.ts
[workflow-migration]: https://github.com/redwan-cse/sdgc/blob/6967d1ccd76f41808acbae3da9d23114bd24b32e/supabase/migrations/20261017024112_persistent_workflows_and_admin_parity.sql
[approval-migration]: https://github.com/redwan-cse/sdgc/blob/6967d1ccd76f41808acbae3da9d23114bd24b32e/supabase/migrations/20261016052755_directory_and_admin_operations.sql
[rbac-migration]: https://github.com/redwan-cse/sdgc/blob/6967d1ccd76f41808acbae3da9d23114bd24b32e/supabase/migrations/20261016025317_rbac_and_audit.sql
[home]: https://github.com/redwan-cse/sdgc/blob/6967d1ccd76f41808acbae3da9d23114bd24b32e/src/app/%28public%29/page.tsx
[about]: https://github.com/redwan-cse/sdgc/blob/6967d1ccd76f41808acbae3da9d23114bd24b32e/src/app/%28public%29/about/page.tsx
[walk]: https://github.com/redwan-cse/sdgc/blob/6967d1ccd76f41808acbae3da9d23114bd24b32e/src/app/%28public%29/garden-walk/page.tsx
[content]: https://github.com/redwan-cse/sdgc/blob/6967d1ccd76f41808acbae3da9d23114bd24b32e/src/features/content/queries.ts
[event-queries]: https://github.com/redwan-cse/sdgc/blob/6967d1ccd76f41808acbae3da9d23114bd24b32e/src/features/events/queries.ts
[ticket-actions]: https://github.com/redwan-cse/sdgc/blob/6967d1ccd76f41808acbae3da9d23114bd24b32e/src/features/tickets/actions.ts
[header]: https://github.com/redwan-cse/sdgc/blob/6967d1ccd76f41808acbae3da9d23114bd24b32e/src/components/layout/site-header.tsx
[mobile-nav]: https://github.com/redwan-cse/sdgc/blob/6967d1ccd76f41808acbae3da9d23114bd24b32e/src/components/layout/mobile-navigation.tsx
[event-list]: https://github.com/redwan-cse/sdgc/blob/6967d1ccd76f41808acbae3da9d23114bd24b32e/src/features/events/components/event-list-view.tsx
[event-day]: https://github.com/redwan-cse/sdgc/blob/6967d1ccd76f41808acbae3da9d23114bd24b32e/src/app/%28public%29/events/day/page.tsx
[event-month]: https://github.com/redwan-cse/sdgc/blob/6967d1ccd76f41808acbae3da9d23114bd24b32e/src/app/%28public%29/events/month/page.tsx
[register]: https://github.com/redwan-cse/sdgc/blob/6967d1ccd76f41808acbae3da9d23114bd24b32e/src/features/auth/components/register-form.tsx
[auth-actions]: https://github.com/redwan-cse/sdgc/blob/6967d1ccd76f41808acbae3da9d23114bd24b32e/src/features/auth/actions.ts
[login-form]: https://github.com/redwan-cse/sdgc/blob/6967d1ccd76f41808acbae3da9d23114bd24b32e/src/features/auth/components/login-form.tsx
[admin-content]: https://github.com/redwan-cse/sdgc/blob/6967d1ccd76f41808acbae3da9d23114bd24b32e/src/features/admin/components/admin-content.tsx
[stripe-provider]: https://github.com/redwan-cse/sdgc/blob/6967d1ccd76f41808acbae3da9d23114bd24b32e/src/features/payments/stripe-provider.ts
[media-queries]: https://github.com/redwan-cse/sdgc/blob/6967d1ccd76f41808acbae3da9d23114bd24b32e/src/features/media/queries.ts
[gallery-view]: https://github.com/redwan-cse/sdgc/blob/6967d1ccd76f41808acbae3da9d23114bd24b32e/src/features/media/components/gallery-view.tsx
[admin-shell]: https://github.com/redwan-cse/sdgc/blob/6967d1ccd76f41808acbae3da9d23114bd24b32e/src/features/admin/components/admin-shell.tsx
[footer]: https://github.com/redwan-cse/sdgc/blob/6967d1ccd76f41808acbae3da9d23114bd24b32e/src/components/layout/site-footer.tsx
[input]: https://github.com/redwan-cse/sdgc/blob/6967d1ccd76f41808acbae3da9d23114bd24b32e/src/components/ui/input.tsx
[theme]: https://github.com/redwan-cse/sdgc/blob/6967d1ccd76f41808acbae3da9d23114bd24b32e/src/app/globals.css
[contact-action]: https://github.com/redwan-cse/sdgc/blob/6967d1ccd76f41808acbae3da9d23114bd24b32e/src/features/contact/actions.ts
[notifications]: https://github.com/redwan-cse/sdgc/blob/6967d1ccd76f41808acbae3da9d23114bd24b32e/src/features/contact/notifications.ts
[root-layout]: https://github.com/redwan-cse/sdgc/blob/6967d1ccd76f41808acbae3da9d23114bd24b32e/src/app/layout.tsx
[sitemap]: https://github.com/redwan-cse/sdgc/blob/6967d1ccd76f41808acbae3da9d23114bd24b32e/src/app/sitemap.ts
[event-detail]: https://github.com/redwan-cse/sdgc/blob/6967d1ccd76f41808acbae3da9d23114bd24b32e/src/app/%28public%29/event/%5Bslug%5D/page.tsx
[readme]: https://github.com/redwan-cse/sdgc/blob/6967d1ccd76f41808acbae3da9d23114bd24b32e/README.md
[delivery]: https://github.com/redwan-cse/sdgc/blob/6967d1ccd76f41808acbae3da9d23114bd24b32e/docs/DELIVERY.md
[parity]: https://github.com/redwan-cse/sdgc/blob/6967d1ccd76f41808acbae3da9d23114bd24b32e/docs/audit/PARITY-LEDGER.md
