# Comprehensive Engineering Review Prompt for OpenAI Codex

> **Instructions for the Reviewer:**  
> You are acting as a Principal Systems Architect and Staff Frontend Engineer. You have been tasked with performing a comprehensive technical review, security evaluation, and parity audit of the newly developed Next.js + Supabase replacement platform for the **Saugatuck Douglas Garden Club (SDGC)** against its live WordPress predecessor (`https://saugatuckdouglasgardenclub.com`).
>
> Please read the context below, review the architecture and code artifacts, and provide an actionable, prioritized report.

---

## 1. Project Context & Objectives

The Saugatuck Douglas Garden Club is transitioning from a legacy WordPress website (running on Divi, Ultimate Member, The Events Calendar, Event Tickets, and CleanTalk) to a modern, custom web application built with:

- **Framework:** Next.js 16.4.1 (App Router, Turbopack, React 19, Strict TypeScript)
- **Styling:** Tailwind CSS 4, CSS variables, dark/light theme support
- **Backend & Database:** Supabase (PostgreSQL 17, Supabase Auth, Row-Level Security, Storage)
- **Testing:** Vitest (unit), pgTAP & Supabase JS (integration), Playwright (E2E across Desktop & Mobile)

The initial version deliverable has been tagged and released as **`v1.0`**.

---

## 2. Empirical Ground Truth: Live Site Crawl Findings

A comprehensive crawl and REST API dump (`imports/live-crawl/`) of the active production site revealed the exact legacy architecture:

1. **Installed Plugins:**
   - `ultimate-member` + `um-stripe` (User registration, profile management, member directory, annual dues processing via Stripe)
   - `the-events-calendar` + `event-tickets` + `divi-event-calendar-module` (Events archive in List/Month/Day views, categories, ticketing checkout)
   - `cleantalk-spam-protect` (Bot deterrence for contact and signup)
   - `divi-*` (Layout and presentation modules)
2. **Page Routes (22 distinct pages cataloged):**
   - Core Public: Home (`/`), About (`/aboutourclub/`), Garden Walk (`/garden-walk/`), Gallery (`/gallery/`), Membership Overview (`/membership/`).
   - Events Calendar: `/events/`, `/events/month/`, `/events/list/`, `/events/day/`, `/events-looped/`, `/event/[slug]`.
   - Member & Auth: `/becomeamember/`, `/login/`, `/members/` (directory), `/user/` (profile), `/account/`, `/password-reset/`, `/logout/`.
   - Ticketing & Stripe: `/tickets-checkout/`, `/tickets-order/`, `/checkout/`, `/stripe/`, `/customer-portal/`, `/payment-successful/`, `/payment-cancelled/`, `/already-subscribed/`, `/subscription-cancellation/`.
3. **Registration Form Schema (20 fields in Ultimate Member):**
   - Credentials: `user_login`, `first_name`, `last_name`, `user_email`, `user_password`, `confirm_user_password`.
   - Address & Contact: `address_1`, `address_2`, `address_city`, `address_state_dropdown`, `address_zip`, `phone_number`, `phone_number_cell`.
   - Personal/Garden: `birth_month`, `birth_day_numeric` _(no birth year collected)_, `spouses_name_text`, `master_gardener` _(bool)_, `gardening_interests_textarea`, `work_experience_textarea`.
   - Volunteer Choices (8 checkboxes): Community Beautification, 6th Grade Workshop, New Member Reception, Club Website, Community Garden Recognition Awards, Garden Walk Fund Raiser, Community Charitable Contributions, Holiday Decoration Workshop.
4. **Dues & Financial Model:**
   - $50.00 USD annual rate for calendar year (Jan 1 to Dec 31). Non-recurring manual renewal.
   - Dual payment methods: Online Stripe Credit Card vs. Mail-in Check (P.O. Box 1011, Douglas, MI 49406).
   - Strict club bylaw requirement: **Membership approval remains separate and manual even after successful online payment.**

---

## 3. Current Implementation State in Next.js + Supabase

1. **Parity Achievements:**
   - Full 20-field registration form implemented in [register-form.tsx](file:///J:/DevDrive/sdgc/src/features/auth/components/register-form.tsx) and validated via Zod.
   - Dual username-or-email authentication implemented in [login-form.tsx](file:///J:/DevDrive/sdgc/src/features/auth/components/login-form.tsx) via PostgreSQL RPC `find_email_by_identifier`.
   - Full events calendar system ([events-calendar.tsx](file:///J:/DevDrive/sdgc/src/features/events/components/events-calendar.tsx)) supporting List, Month grid, and Day views normalized to `America/Detroit` timezone.
   - Complete 6-domain Admin Dashboard ([src/features/admin/components/](file:///J:/DevDrive/sdgc/src/features/admin/components/)) covering Members, Dues Reconciliation, Events, Content, Messages, and Media.
   - Row-Level Security (RLS) enabled and verified on 100% of exposed database tables.
   - Client mount-guard protection implemented across all forms to prevent DOM mismatch errors from password managers (Bitwarden, 1Password, etc.).
2. **Current Limitations / Work-in-Progress:**
   - Dues payments currently use a server-controlled local simulation adapter (`LOCAL_PAYMENTS_SIMULATION=true`).
   - Legacy event ticket checkout (`/tickets-checkout/`) is currently represented by event information and Garden Walk ticketing callout.
   - Avatar photo upload is not yet wired to a Supabase Storage bucket.
   - Gallery does not yet have a fullscreen zoomable modal lightbox.

---

## 4. Specific Codex Review Tasks

Please analyze the repository and provide your detailed technical assessment across the following four areas:

### Task A: Code Quality, Modularity & Architecture

- Review the separation of concerns between Server Components (`src/app/`) and Client Components (`src/features/*/components/`).
- Evaluate error boundary handling, Zod schema validation, and typed Server Actions.
- Verify adherence to Next.js 16 conventions (e.g. `proxy.ts`, font optimization, script loading strategies).

### Task B: Functional & Schema Parity Verification

- Compare our schema against the 20 legacy Ultimate Member registration fields and 8 club project choices.
- Review the dues lifecycle states (`pending`, `active`, `expired`, `suspended`) and verify that online payment confirmation is decoupled from manual membership approval.
- Check calendar view timezone handling and multi-view routing (`/events`, `/events/month`, `/events/day`).

### Task C: Security & Resilience Audit

- Review the Row-Level Security (RLS) policies in `supabase/migrations/` to identify any potential privilege escalation or data leak vulnerabilities.
- Audit form hydration resilience against third-party extensions and autofill scripts.
- Evaluate the anti-spam and bot deterrence model (honeypot fields vs. Cloudflare Turnstile/CleanTalk).
- Confirm zero exposure of sensitive keys (`SUPABASE_SERVICE_ROLE_KEY` is never exposed to the client or `NEXT_PUBLIC_*`).

### Task D: Prioritized Action Plan & Production Roadmap

Provide a structured, prioritized checklist categorized into:

- **Priority 1 (Critical / Pre-Production):** Missing production integrations (Live Stripe webhooks, transactional email SMTP, 301 legacy URL redirects).
- **Priority 2 (Parity Enhancements):** Dedicated event ticketing checkout flow, Supabase Storage avatar uploads, `.ics` calendar subscription feeds.
- **Priority 3 (UI Polish & DX):** Accessible gallery modal lightbox, advanced directory search filters, inline password strength meters.

---

## 5. Instructions for Formatting Your Response

- Provide clear code examples and diff snippets where architectural improvements are recommended.
- Include file references using relative paths (e.g. `src/features/auth/components/login-form.tsx`).
- Highlight any potential breaking edge cases or security oversights before production cutover.
