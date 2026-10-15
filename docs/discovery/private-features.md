# Private Features and Discovery Status

## Overview

The owner confirmed on 2026-10-15:
- The legacy WordPress website includes a **member login panel** and a **WordPress administrator panel**.
- **Role-Based Access Control (RBAC)**, member profile management, and separate member and admin areas are **mandatory product deliverables**.

## Evidence and Discovery Limitations

1. **Host Reachability:** Direct HTTP connections to `https://saugatuckdouglasgardenclub.com/` timed out or returned HTTP 403 from the local execution environment, preventing automated crawling of internal WordPress REST endpoints (`/wp-json/`) or sitemap inspection.
2. **Private WordPress Exports:** No private WordPress database dump (SQL/WXR XML), authenticated session cookie, or plugin list has been provided yet.
3. **Payment Provider:** The live payment gateway (e.g. Stripe, PayPal, Authorize.net, or WooCommerce) utilized by the WordPress site has not been identified by credentials or public form markers.
4. **Member-Only Resources:** Whether the club had downloadable member-only bylaws, minutes, or a member directory with opt-in flags remains unverified.

## Modeled Architecture and Strategy

To ensure zero blocker to local implementation:
1. **RBAC Matrix:** Built into the architecture specification (`docs/ARCHITECTURE.md`) with explicit roles: `admin`, `editor`, `treasurer`, plus `active_member`, `registered/pending`, `expired`, and `suspended`.
2. **Member Profile Fields:** All fields observed on the public registration page (`becomeamember`) are modeled in full:
   - Username (unique, normalized)
   - First and Last Name
   - Email (Auth identity)
   - Street Address, Address Line 2, City, State, ZIP
   - Home Phone, Cell Phone
   - Birth Month and Birth Day (1-12, 1-31; no birth year collected)
   - Spouse First Name
   - Master Gardener flag (boolean)
   - Gardening Interests & Volunteer Experience (text)
   - 8 Project Choices:
     1. Community Beautification
     2. 6th Grade Workshop
     3. New Member Reception
     4. Club Website
     5. Community Garden Recognition Awards
     6. Garden Walk Fund Raiser
     7. Community Charitable Contributions
     8. Holiday Decoration Workshop
3. **Membership & Dues:**
   - USD $50 for calendar year 2026.
   - Non-recurring, annual term (January 1 – December 31, America/Detroit).
   - Distinct lifecycle: Application Pending -> Payment Pending -> Payment Confirmed -> **Manual Staff Approval** -> Active.
   - Dual payment methods: Credit Card (via test adapter locally; sandbox ready) and Mail-in Check ($50 to SDGC, P.O. Box 1011, Douglas, MI 49406).
4. **Admin Experience:** Complete administration covering:
   - Page content editing
   - Event CRUD & scheduling
   - Photo gallery / media management
   - Member roster & profile reviews
   - Dues reconciliation & membership approval
   - Contact messages inbox
   - Role assignments with audit logging and last-admin protection

## Action Items When Authorized Access is Provided

- Reconcile `docs/discovery/parity.csv` with the actual installed WordPress plugins and private screens.
- Inspect any private member document storage.
- Connect the production payment provider when API keys are authorized.
