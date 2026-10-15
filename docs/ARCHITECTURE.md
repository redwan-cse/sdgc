# Architecture and delivery specification

## Intent and selected approach

Replace the existing WordPress club site while preserving its public, membership, event, payment, contact, and editorial functions. Antigravity will deliver the frontend and reproducible Supabase migrations first, then prove those flows against local Docker Supabase. This initialization contains no application schema or completed member flows.

Use one Next.js App Router application with feature-oriented code and Supabase Postgres/Auth/Storage. Server Components read public data; Server Actions/Route Handlers validate mutations; a small data-access layer applies authorization; Postgres constraints, grants, and RLS enforce access independently of the UI. Use the Supabase client directly with generated types. A separate API/ORM adds a second data model without a current need; static mock-only pages cannot satisfy membership/contact/admin behavior. Both are intentionally outside the selected foundation.

## Fixed constraints

- Node 24, npm 11; exact direct dependency versions and committed lockfile.
- Strict TypeScript, `@/` alias, App Router, Tailwind CSS 4.
- Preserve supplied tweakcn theme and `public/images/brand/sdgc-logo.jpg`.
- Local database project ID `sdgc`; use only this repo's Docker stack.
- Club timezone `America/Detroit`; USD amounts stored as integer cents.
- Annual membership follows a calendar year; no automatic recurring dues.
- Payment confirmation and manual membership approval are separate decisions.
- No service-role key in client code; no real member data in fixtures or Git.
- No production deployment, hosted database changes, live charges, or real outbound mail during local delivery.

## Target routes and module responsibilities

| Area                    | Routes                                                                                                          | Feature module                                      |
| ----------------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| Public identity/content | `/`, `/aboutourclub`, `/garden-walk`, `/gallery`, `/contact`                                                    | `features/content`, `features/media`, shared layout |
| Events                  | `/events`, `/events/month`, `/events/day`, `/event/[slug]`                                                      | `features/events`                                   |
| Authentication          | `/login`, `/becomeamember`, `/forgot-password`, `/reset-password`, `/auth/callback`, `/auth/confirm`            | `features/auth`                                     |
| Member                  | `/profile`, `/membership`                                                                                       | `features/membership`                               |
| Administration          | `/admin`, `/admin/content`, `/admin/events`, `/admin/media`, `/admin/members`, `/admin/dues`, `/admin/messages` | `features/admin` with per-operation authorization   |
| Provider HTTP boundary  | Discovered checkout callbacks/webhooks only                                                                     | `features/payments` and minimal route handlers      |

Routes are targets, not claims about unseen private URLs. Prefer keeping legacy slugs; add permanent redirects from every changed legacy URL, including actual profile/account/plugin URLs found in P0. Preserve query parameters and inbound event links. Never use a catch-all redirect that hides missing content. Missing content returns 404; deleted content can be a documented 410.

Create `(public)`, `(auth)`, `(member)`, and `(admin)` route groups only as layouts need them; avoid generating empty product routes. Shared UI primitives belong in `components/ui`; domain-specific forms, queries, actions, validation, and tests stay in their feature folders. Introduce shadcn components when useful using its Tailwind 4 conventions, without overwriting the existing theme. Avoid a large UI library at initialization.

## Data model for migration design

These are proposed contracts to finalize against P0 evidence. Use UUID primary keys, explicit constraints/indexes, `created_at`/`updated_at`, server-owned audit fields, and deterministic legacy identifiers. Avoid a catch-all JSON table for identity and financial records.

| Entity                                   | Responsibility and minimum fields                                                                                                                                                                                                                           |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `profiles`                               | `user_id` FK to `auth.users`; normalized unique username, name/address/phones, birth month/day, spouse, Master Gardener flag, interests/experience. Private owner/admin access. Email identity belongs in Auth; changing email uses the verified auth flow. |
| `project_interests`, `profile_interests` | Stable codes for eight existing registration choices; unique user/choice join.                                                                                                                                                                              |
| `membership_terms`                       | Unique `year`, `dues_cents`, `currency`, opening/closing dates. Keep historical terms unchanged when new rates are published.                                                                                                                               |
| `memberships`                            | Unique `(user_id, term_id)`, application/approval status, approved_by/at and expiry rules. Do not equate an authenticated account with an active membership.                                                                                                |
| `payments`                               | Membership/term reference, method, expected/confirmed amount, status, provider ID where applicable, unique provider event/reference, reconciliation actor/time. No card details.                                                                            |
| `user_roles` in private schema           | Trusted admin/editor/treasurer capabilities; users cannot create/change roles. Active membership is evaluated separately. Bootstrap local admin only through ignored test provisioning.                                                                     |
| `pages`, `site_settings`                 | Typed/sanitized page content, slug, draft/published status, publication timestamps, navigation and approved external links. Whitelist rendering; never execute imported HTML/scripts.                                                                       |
| `events`, `venues`                       | Unique slug, title/description, status/visibility, start/end `timestamptz`, timezone, all-day local dates if needed, venue/address, approved ticket URL. Add recurrence/categories only when verified.                                                      |
| `albums`, `media_assets`, `album_items`  | Public/private visibility, storage path, MIME/type/size, dimensions, alt/caption, year/order; separate publication from upload.                                                                                                                             |
| `contact_messages`                       | Validated sender fields, message, received/triaged state, consent metadata if observed; private staff inbox. No public read/list.                                                                                                                           |
| `audit_events`                           | Append-only privileged actions for approval, payment reconciliation and content publication, with actor/time/entity; avoid storing credentials or unnecessary personal content.                                                                             |
| `legacy_mappings` / redirect ledger      | Deterministic old ID/URL to new ID/URL. Idempotent imports and reconciliation reports. Keep private export payloads out of public tables.                                                                                                                   |

Separate migrations into content, identity/membership, payments, RLS/functions/grants, storage, then any later verified additions. Each step must replay from empty local database. Seeds are synthetic and idempotent; Auth users and Storage objects need a provisioning script using their APIs, not direct writes to internal tables.

## Authorization contract

User clarification (2026-10-15): the existing site has a member login panel and a WordPress administrator panel. **RBAC and member profile management are mandatory application scope**, even while the private WordPress screens still need inspection. Build separate member and administrator experiences; admin functionality is part of local delivery.

| Capability                                                                 | Visitor | Registered / pending | Active member | Editor                     | Treasurer                  | Admin |
| -------------------------------------------------------------------------- | ------- | -------------------- | ------------- | -------------------------- | -------------------------- | ----- |
| Read published public pages/events/media; submit contact                   | Yes     | Yes                  | Yes           | Yes                        | Yes                        | Yes   |
| Read/edit own permitted profile; view own dues/payment history             | No      | Yes                  | Yes           | Own                        | Own                        | Own   |
| View verified active-member-only resources                                 | No      | No                   | Yes           | Requires active membership | Requires active membership | Yes   |
| Create/edit/publish public content, events, media                          | No      | No                   | No            | Yes                        | No                         | Yes   |
| Read member applications/payment records; reconcile dues and approve terms | No      | No                   | No            | No                         | Yes                        | Yes   |
| Manage members, privileged roles, system settings and contact inbox        | No      | No                   | No            | No                         | No                         | Yes   |

Roles are additive capabilities, not a single numeric ranking. A user may be both editor and treasurer; neither automatically grants active membership or admin. Start with member/admin experiences, then expose editor/treasurer views using these same permissions. An admin may manage another member's allowed profile fields with an audit record, but password/email identity changes use Auth's secure workflows. Privileged role changes must be audited and must not remove the last administrator. Test session freshness/revocation after role removal. Future owner decisions can narrow the capability matrix, but must update tests and policy together.

Anonymous users read **published public** content, events and media only. Anonymous contact submission passes through a validated, rate-limited server boundary; there is no arbitrary public read of submissions. Decide between a restricted submission RPC or a narrow server-only elevated writer and test that decision directly.

Authenticated users edit only their own permitted profile fields and read their own memberships/payment history. Column privileges, restricted RPCs, or separated tables must prevent profile updates from changing trusted fields. Unapproved/expired members cannot access active-member-only data. Directory access and opt-in rules remain unverified; no public directory should be invented.

Editors manage public content/events/media; treasurers reconcile payments and approve memberships if assigned that capability; admins manage roles/settings. Every protected server action checks identity and capability near the data access. SQL policies also enforce the same boundary. A helper that reads private role tables may require a tightly scoped SECURITY DEFINER function with empty/fixed `search_path`, explicit grants, and dedicated denial tests; do not use definer functions as a general permission workaround. RLS alone does not restrict columns. Views must use security-invoker semantics or be private.

Use `@supabase/ssr` clients with generated `Database` types. The bootstrap types reflect an empty application schema; P3 regenerates them after migrations. P4 adds `src/proxy.ts` session refresh with the installed SDK's current cache/header behavior, validates identity using the documented verified-user/claims method, protects mutations again in the DAL, and prevents caching of personal responses. Never trust `getSession()` alone for server authorization. Validate return destinations against a local-path allowlist to stop open redirects.

Username-or-email login requires a server-side resolver with generic errors and persistent rate limits. Never expose a username-to-email query to public clients. If an elevated lookup is necessary, isolate it behind `server-only`, return no email to the browser, and test that lookup/response timing does not trivially enumerate accounts. Provider/auth lockout behavior must remain effective.

## Membership and payment states

`registered/unverified email` → `authenticated profile` → `application pending` → `payment pending/confirmed` → **authorized manual approval** → `active for term` → `expired`. Rejection, suspension, payment failure/refund, and next-year renewal must be explicit states. Preserve history rather than overwriting last year's record. The same user may have multiple term records, one per year.

All monetary amounts and term selection come from the server. Checkout success URLs only display status; they never mark a payment paid. Verify provider callbacks/signatures, deduplicate provider events, and update records transactionally. Mail checks require staff reconciliation. Local test adapters must preserve these rules and require a server-side development/test gate that fails closed in production. Until P0 identifies the provider, define an adapter contract and test implementation rather than selecting Stripe/PayPal without evidence. No automatic membership activation from any callback.

## Content, accessibility, and performance

Retain club tone, readable typography, keyboard navigation, visible focus, labels/errors, sensible tap targets, responsive views from 360px, reduced-motion support, image alt text, and an accessible lightbox/calendar. Target WCAG 2.2 AA; check theme contrast rather than assuming the palette passes. Light is the initial default; dark tokens remain available and must be verified if a theme switch is implemented.

Load independent server queries in parallel. Paginate/filter event/media/admin lists server-side. Use `next/image` with known dimensions and narrow storage host patterns. Do not cache personalized data in public caches. Public content can use documented caching/revalidation with deliberate invalidation after admin publish. Build public metadata, canonical URLs from validated site configuration, Open Graph images, sitemap, robots, and valid event structured data in P7. Prevent indexing of private/admin/auth pages.

## Delivery boundaries

Frontend previews may use typed synthetic fixtures in P2; Phase 4 onward must use real local Supabase for completed flows. Empty/loading/error/permission states are part of each feature. A green UI with mocked database calls does not satisfy integration delivery.

Final delivery includes source, lockfile, migrations, synthetic seeds/provisioning, generated types, reproducible local setup, browser/database evidence, route/media/import reconciliation, remaining external prerequisites, and a concise handover. Complete-parity status remains blocked while private features or transaction behavior are unknown; independent implementation should continue.

Technical references checked during setup: [Next.js installation/configuration](https://nextjs.org/docs/app/getting-started/installation), [Supabase local Docker workflow](https://supabase.com/docs/guides/local-development), [Supabase SSR clients](https://supabase.com/docs/guides/auth/server-side/creating-a-client), [database testing](https://supabase.com/docs/guides/database/testing). Recheck against the pinned versions before implementation.
