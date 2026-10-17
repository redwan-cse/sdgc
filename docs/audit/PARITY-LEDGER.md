# Saugatuck Douglas Garden Club — Parity & Route Reconciliation Ledger

**Audited & Verified:** 2026-10-17  
**Architecture:** Next.js 16.4.1 (App Router) + Supabase (PostgreSQL 17, Row-Level Security, Storage)  
**Remediation Stage:** Remediation Package R5 Complete

---

## 1. Cataloged Route Parity & Redirect Matrix

Every one of the 22 cataloged WordPress routes discovered during the live crawl has been accounted for:

| # | Legacy WordPress Route | Legacy Component / Provider | Target Next.js Route | Status & Redirection | Verification Test ID |
|---|------------------------|-----------------------------|----------------------|----------------------|----------------------|
| 1 | `/` | Divi Home Page | `/` | **Live / Complete** (Queries `public.pages` `home` row, dynamic 3 upcoming events) | `tests/integration/remediation-r4.test.ts` |
| 2 | `/aboutourclub/` | Divi About Page | `/about` | **Permanent Redirect (308)** to `/about` | `tests/integration/remediation-r5.test.ts` |
| 3 | `/garden-walk/` | Divi Garden Walk Page | `/garden-walk` | **Live / Complete** (Queries `public.pages` `garden-walk` row, links to `/tickets-checkout`) | `tests/integration/remediation-r4.test.ts` |
| 4 | `/gallery/` | Divi Media Showcase | `/gallery` | **Live / Complete** (Dynamic media queries from `public.media_assets` and `club-media` storage) | `tests/integration/remediation-r4.test.ts` |
| 5 | `/membership/` | Divi / Membership Notice | `/membership` | **Live / Complete** (Dynamic calendar year term dues notice, $50 annual dues) | `tests/integration/remediation-r3.test.ts` |
| 6 | `/events/` | The Events Calendar (Archive) | `/events` | **Live / Complete** (List, Month, Day calendar views normalized to `America/Detroit`) | `tests/integration/remediation-r3.test.ts` |
| 7 | `/events/month/` | The Events Calendar (Month) | `/events/month` | **Live / Complete** (Detroit timezone month grid) | `tests/integration/remediation-r3.test.ts` |
| 8 | `/events/list/` | The Events Calendar (List) | `/events` | **Permanent Redirect (308)** to `/events` | `tests/integration/remediation-r5.test.ts` |
| 9 | `/events/day/` | The Events Calendar (Day) | `/events/day` | **Live / Complete** (Detroit timezone day schedule) | `tests/integration/remediation-r3.test.ts` |
| 10 | `/events-looped/` | Divi Event Calendar Module | `/events` | **Permanent Redirect (308)** to `/events` | `tests/integration/remediation-r5.test.ts` |
| 11 | `/event/[slug]/` | The Events Calendar (Single) | `/event/[slug]` | **Live / Complete** (Includes XSS-safe sanitized JSON-LD microdata) | `tests/integration/remediation-r1.test.ts` |
| 12 | `/becomeamember/` | Ultimate Member Registration | `/join` | **Permanent Redirect (308)** to `/join` (Full 20-field registration schema) | `tests/integration/remediation-r2.test.ts` |
| 13 | `/login/` | Ultimate Member Login | `/login` | **Live / Complete** (Dual username or email authentication) | `tests/integration/remediation-r1.test.ts` |
| 14 | `/members/` | Ultimate Member Directory | `/directory` | **Permanent Redirect (308)** to `/directory` (Restricted projection with opt-out) | `tests/integration/remediation-r1.test.ts` |
| 15 | `/user/`, `/account/` | Ultimate Member Profile | `/profile` | **Permanent Redirect (308)** to `/profile` (Self-service profile and dues state) | `tests/integration/remediation-r5.test.ts` |
| 16 | `/password-reset/` | Ultimate Member Reset | `/forgot-password` | **Permanent Redirect (308)** to `/forgot-password` | `tests/integration/remediation-r5.test.ts` |
| 17 | `/logout/` | WordPress / UM Logout | `/logout` | **Safe Session-Termination Route Handler** (Clears auth session, redirects to `/login?notice=signed_out`) | `tests/integration/remediation-r5.test.ts` |
| 18 | `/tickets-checkout/` | Event Tickets Checkout | `/tickets-checkout` | **Live / Complete** (Dedicated advance ticketing checkout flow for tours and events) | `tests/integration/remediation-r5.test.ts` |
| 19 | `/tickets-order/`, `/checkout/`, `/tickets/` | Event Tickets Cart & Order | `/tickets-checkout` | **Permanent Redirect (308)** to `/tickets-checkout` | `tests/integration/remediation-r5.test.ts` |
| 20 | `/payment-successful/` | UM Stripe Success Return | `/join?status=success` | **Permanent Redirect (308)** to `/join?status=success` | `tests/integration/remediation-r5.test.ts` |
| 21 | `/payment-cancelled/` | UM Stripe Cancel Return | `/join?status=cancelled` | **Permanent Redirect (308)** to `/join?status=cancelled` | `tests/integration/remediation-r5.test.ts` |
| 22 | `/already-subscribed/`, `/subscription-cancellation/`, `/customer-portal/`, `/stripe/` | UM Stripe Portal Pages | `/profile` (or `/join`) | **Permanent Redirect (308)** to `/profile` / `/join` (Preserves member portal deep links) | `tests/integration/remediation-r5.test.ts` |

---

## 2. Event Ticketing vs. Annual Membership Dues Separation

A critical club bylaw and governance requirement is the strict separation between:

1. **Event Ticket Admissions (`/tickets-checkout`)**:
   - Available to the general public without membership requirements.
   - Tickets sold for annual events (e.g. Garden Walk Fundraiser: $20 advance admission, $25 day-of admission).
   - Generates verifiable digital ticket order passes with unique references (e.g. `SDGC-TKT-2026-XXXX`) and check-in instructions for tour headquarters (Saugatuck City Hall).
   - **Strict Constraint**: Purchasing an event ticket **never** grants club membership, creates rows in `public.memberships`, or bypasses manual board review.

2. **Annual Club Membership Dues (`/membership`, `/join`, `/profile`)**:
   - Non-recurring $50.00 USD annual dues for the Detroit calendar year (Jan 1 – Dec 31).
   - Requires completed 20-field registration schema including gardening interests and project choices.
   - **Strict Constraint**: Online payment confirmation is strictly decoupled from membership approval. The membership remains in `pending` state until manually approved by authorized leadership (Administrator or Treasurer).

---

## 3. WordPress Importer CLI & Zero-PII Compliance

`scripts/import-wordpress.mjs` has been reconciled and hardened:

1. **CLI Flag Reconciliation**:
   - Accepts both `--input-dir <path>` and `--input <path>`, as well as `--input-dir=<path>` and `--input=<path>`.
   - Strictly rejects any unrecognized CLI argument with a descriptive fatal error and non-zero exit code.
2. **Dynamic Term Resolution**:
   - Dynamically resolves active membership term for the Detroit calendar year instead of hardcoding past years.
3. **Database Error Handling**:
   - Every database write (`venues`, `pages`, `events`, `media_assets`, `legacy_mappings`, `profiles`, `profile_interests`, `memberships`) checks returned errors and reports them in `report.errors` while incrementing `rejected` count.
4. **Zero-PII Summaries**:
   - Execution reports (`report.warnings`, `report.errors`) identify imported records by synthetic ID or record index (e.g. `record #wp-user-101`), completely eliminating raw email addresses and usernames from console and JSON outputs.
