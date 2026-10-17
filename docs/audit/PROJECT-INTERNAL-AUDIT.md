# SDGC Replacement Platform: Full Project & Technical Audit

**Audit Date:** October 17, 2026  
**Target Codebase:** `sdgc` (Next.js 16.4.1, React 19, Tailwind CSS 4, Supabase JS/SSR)  
**Remediation Baseline:** Completed Work Packages R0 through R6

---

## 1. Architectural Overview & Technical Posture

The platform is constructed with modern Next.js App Router architecture and strict TypeScript:

- **Server Components by Default:** Page routes and data fetching execute on the server without leaking database credentials or exposing internal state.
- **Client Boundaries Only Where Needed:** Client components (`use client`) are isolated strictly to interactive forms, filter bars, theme switches, and administrative interfaces.
- **Feature-Based Modular Structure:** Domain logic is organized under `src/features/{admin,auth,contact,content,events,media,membership,payments,tickets}`.
- **Zero-Trust Security Model:** Database Row-Level Security (RLS) is enabled on 100% of exposed application tables. Server Actions enforce verified server sessions and role/capability checks (`requireRole`, `requireCapability`) before executing mutations.

---

## 2. Parity Assessment & Legacy Functional Mapping

| Feature Area                   | Legacy WordPress Implementation                            | Modern Next.js + Supabase Implementation                                                                     | Functional Status |
| :----------------------------- | :--------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------- | :---------------- |
| **Public Branding & Logo**     | Divi Theme header, raster logo                             | Local SVG/PNG brand assets, responsive navigation, dark/light theme toggle                                   | Verified Parity   |
| **Member Registration**        | Ultimate Member form (20 fields)                           | Validated `RegisterForm` capturing 8 project choices, gardening & volunteer background, address line 2       | Verified Parity   |
| **Authentication Identifiers** | Login via Username OR Email                                | Dual-identifier authentication via RPC username resolver (`find_email_by_identifier`)                        | Verified Parity   |
| **Membership Dues Model**      | $50/calendar year, non-recurring, manual approval required | Dynamic `membership_terms`, offline check reconciliation, distinct 5 lifecycle states                        | Verified Parity   |
| **Events Calendar**            | The Events Calendar (List, Month, Day views)               | Custom calendar with List, Month grid, Day view, `.ics` feed, and timezone normalization (`America/Detroit`) | Verified Parity   |
| **Photo Gallery**              | Divi Gallery module                                        | Dynamic gallery with album filters, persistent `media_assets`, accessible focus modal, and 1.5x zoom         | Verified Parity   |
| **Event Ticketing**            | Legacy `/tickets-checkout/` ticket purchasing              | Dedicated `/tickets-checkout` for advance tickets ($20 vs $25 day-of), completely separated from dues        | Verified Parity   |
| **Contact Submissions**        | Divi form + CleanTalk Anti-Spam                            | Validated Server Action with honeypot spam protection, admin inbox triage, and local notification capture    | Verified Parity   |
| **Administrative Control**     | WordPress WP-Admin dashboard                               | Specialized RBAC management workspaces with capability-aligned permissions for Admin, Editor, and Treasurer  | Verified Parity   |
| **Discovery Routes**           | 22 legacy WordPress endpoints                              | Configured HTTP 308 permanent redirects preserving query strings (`docs/audit/PARITY-LEDGER.md`)             | Verified Parity   |

---

## 3. Security Analysis & Hardening Posture

### Strengths & Controls Implemented

- **Row-Level Security (RLS):** All exposed tables (`profiles`, `profile_interests`, `user_roles`, `memberships`, `membership_terms`, `payments`, `events`, `event_categories`, `pages`, `contact_messages`, `media_assets`, `audit_events`, `legacy_mappings`) have strict RLS policies prohibiting unauthenticated reads and unauthorized mutations.
- **Client Mount Protection:** Authentication and contact forms implement a `mounted` state guard and `suppressHydrationWarning` on parent wrappers, mitigating hydration mismatches caused by browser extensions.
- **Immutability of Administrative Roles:** Role assignments cannot be performed via direct table updates; they require explicit PostgreSQL security definer functions with audit logging. Trigger `prevent_last_admin_removal` prevents accidental lockout.
- **Service Key Seclusion:** Zero reliance on service-role keys in public bundles; client components strictly use the publishable key.
- **Content Security Policy (CSP):** Implemented in `next.config.ts` security headers with compatible defense-in-depth directives (`default-src 'self'`, `frame-ancestors 'none'`, restricted `connect-src`).

---

## 4. Readiness Classification

Readiness is separated into explicit, verifiable tiers:

1. **Frontend Ready: VERIFIED**
   - All 32 routes compiled cleanly with Turbopack.
   - Zero critical or serious WCAG 2.1 AA accessibility violations.
   - Responsive layouts verified on Desktop and Mobile.
2. **Migrations & Schema Ready: VERIFIED**
   - Committed migrations reproduce the complete schema from scratch.
   - 40/40 pgTAP tests passing.
   - 0 schema lint errors; 0 drift with TypeScript database types.
3. **Local Full-Stack Ready: VERIFIED**
   - Isolated Docker stack running smoothly (ports 54321–54324).
   - 9 synthetic test personas provisioned.
   - 100% pass rate across 44 unit tests, 104 integration tests, and 140 Playwright E2E browser tests.
4. **Legacy Parity Verified: VERIFIED**
   - 22 legacy routes mapped via permanent 308 redirects.
   - Ticket checkout separated from annual membership dues.
   - Importer CLI reconciled and verified zero-PII compliant.
5. **Production Ready: PENDING OPERATIONAL PREREQUISITES**
   - Hosted Supabase project configuration.
   - Production Stripe merchant API keys & webhook secret.
   - Production transactional SMTP provider credentials.
   - Real private member export import.
   - DNS cutover.
