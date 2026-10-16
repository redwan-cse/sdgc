# SDGC Replacement Platform: Full Project & Technical Audit

**Audit Date:** October 16, 2026  
**Target Codebase:** `sdgc` (Next.js 16.4.1, React 19, Tailwind CSS 4, Supabase JS/SSR)  
**Release Tag:** `v1.0`

---

## 1. Architectural Overview & Health

The new platform is built with modern, production-grade Next.js App Router architecture and strict TypeScript:

- **Server Components by Default:** Page routes and data fetching execute on the server without leaking database credentials or exposing internal state.
- **Client Boundaries Only Where Needed:** Client components (`use client`) are isolated strictly to interactive forms, filter bars, theme switches, and administrative interfaces.
- **Feature-Based Modular Structure:** Domain logic is organized cleanly under `src/features/{auth,membership,events,contact,admin,content}`.
- **Zero-Trust Security Model:** Database Row-Level Security (RLS) is enabled on 100% of application tables. Server Actions enforce verified server sessions and role/capability checks (`requireRole`, `requireCapability`) before executing mutations.

---

## 2. Parity Assessment with Legacy WordPress Site

| Feature Area                   | Legacy WordPress Site                                      | New Next.js + Supabase Platform                                                                             | Parity Status  |
| :----------------------------- | :--------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------- | :------------: |
| **Public Branding & Logo**     | Divi Theme header, raster logo                             | Local SVG/PNG brand assets, responsive navigation, dark/light theme toggle                                  |  **Exceeded**  |
| **Member Registration**        | Ultimate Member form (20 fields)                           | Validated `RegisterForm` with exact 20 fields & 8 project choices                                           | **100% Match** |
| **Authentication Identifiers** | Login via Username OR Email                                | Supabase Auth + RPC username resolver (`find_email_by_identifier`)                                          | **100% Match** |
| **Membership Dues Model**      | $50/calendar year, non-recurring, manual approval required | Configurable `membership_terms`, offline check logging, payment state separation                            | **100% Match** |
| **Events Calendar**            | The Events Calendar (List, Month, Day views)               | Custom interactive calendar with List, Month grid, Day view, and timezone normalization (`America/Detroit`) | **100% Match** |
| **Photo Gallery**              | Divi Gallery module                                        | Dynamic gallery with category filters and 161 historical Garden Walk assets                                 | **100% Match** |
| **Contact Submissions**        | Divi form + CleanTalk Anti-Spam                            | Validated Server Action with honeypot spam protection & admin inbox                                         | **100% Match** |
| **Administrative Control**     | WordPress WP-Admin dashboard                               | Custom RBAC portal with 6 specialized management workspaces                                                 |  **Exceeded**  |

---

## 3. Frontend Gaps & UI Polish Opportunities

1. **Gallery Image Lightbox & Zoom Viewer:**
   - _Current State:_ `/gallery` displays a responsive CSS grid of photos with category filter pills.
   - _Opportunity:_ Add an accessible, keyboard-navigable fullscreen modal lightbox (allowing arrow key navigation, caption display, and high-resolution zooming) for the 161 historical Garden Walk photos.
2. **Event Calendar `.ics` / Google Calendar Subscriptions:**
   - _Current State:_ Users can view upcoming events in List, Month, and Day formats.
   - _Opportunity:_ Provide a dynamic `/events/feed.ics` export endpoint and an "Add to Google Calendar / Apple Calendar" button on single event detail pages (`/event/[slug]`).
3. **Member Profile Avatar Photo Upload:**
   - _Current State:_ The profile editor updates all text fields, phone numbers, addresses, and project interests.
   - _Opportunity:_ Integrate avatar image uploading to a secure Supabase Storage bucket (`avatars`) with client-side image cropping and resizing.
4. **Dedicated Event Ticketing / RSVP Checkout Flow:**
   - _Current State:_ Garden Walk promo displays event info and external ticket callout or payment instructions.
   - _Opportunity:_ Implement an in-app ticket cart and guest checkout workflow matching legacy `/tickets-checkout/` for events that charge individual admission fees.
5. **Customer Self-Service Billing Portal View:**
   - _Current State:_ Members view payment status and renewal prompts on `/profile`.
   - _Opportunity:_ Add a dedicated "Payment History & Invoices" tab on the profile page where members can view past receipts, download PDF invoices, or launch the Stripe Customer Portal.

---

## 4. Security Flows & Hardening Analysis

### Strengths

- **Row-Level Security (RLS):** All tables (`member_profiles`, `user_roles`, `membership_terms`, `dues_payments`, `events`, `event_categories`, `content_blocks`, `contact_messages`, `audit_events`) have strict RLS policies prohibiting unauthenticated reads and unauthorized mutations.
- **Client Mount Protection:** All authentication and contact forms implement a `mounted` state guard and `suppressHydrationWarning` on parent wrappers, completely immune to DOM injection errors caused by browser password manager extensions (Bitwarden, 1Password, etc.).
- **Immutability of Administrative Roles:** Role assignments cannot be performed via direct table updates; they require explicit PostgreSQL security definer functions with audit logging. Trigger `prevent_last_admin_removal` prevents accidental lockout.
- **Environment Isolation:** Zero reliance on legacy `ANON_KEY` or service-role keys in public bundles; strictly uses `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

### Security Hardening Next Steps

- **Rate Limiting & Abuse Deterrence:** While honeypot fields protect against basic automated spam bots, deploying **Cloudflare Turnstile** or Upstash Redis rate-limiting on `/join`, `/login`, and `/contact` will provide hardened protection against distributed credential stuffing and contact flood attacks.
- **Content Security Policy (CSP):** Configure strict CSP headers in `next.config.ts` (`script-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'`) to eliminate XSS and clickjacking vectors.

---

## 5. Production Readiness & Cutover Gaps

1. **Live Stripe Payment Integration:**
   - The current codebase uses a local simulation adapter (`LOCAL_PAYMENTS_SIMULATION=true`).
   - _To Launch:_ Provide production `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`, and implement the live Stripe Checkout Session creator and webhook listener (`/api/webhooks/stripe`) to transition payment records automatically upon charge completion.
2. **Transactional Email Service (SMTP):**
   - The local Docker stack uses local email capture.
   - _To Launch:_ Configure production transactional SMTP in Supabase Auth (e.g. Resend, SendGrid, Amazon SES) and brand email templates for email confirmations, dues payment receipts, and password reset links.
3. **Legacy URL Permanent Redirects (301):**
   - The live site contains legacy URLs bookmarked by members and indexed by Google.
   - _To Launch:_ Add permanent redirects in `next.config.ts`:
     - `/becomeamember/` $\rightarrow$ `/join`
     - `/aboutourclub/` $\rightarrow$ `/about`
     - `/user/` $\rightarrow$ `/profile`
     - `/members/` $\rightarrow$ `/directory`
     - `/password-reset/` $\rightarrow$ `/forgot-password`
     - `/tickets-checkout/` $\rightarrow$ `/events`
4. **Automated Database Backups & Point-In-Time Recovery (PITR):**
   - Ensure the production Supabase project has daily automated physical backups and WAL archiving enabled prior to importing private member rosters.
