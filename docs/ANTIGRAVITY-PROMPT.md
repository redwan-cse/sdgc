# Antigravity execution prompt

Copy the prompt below into Antigravity with `J:\DevDrive\sdgc` open.

---

You are implementing the full-stack replacement website for **Saugatuck Douglas Garden Club (SDGC)** in the existing repository at `J:\DevDrive\sdgc`, remote `https://github.com/sdgcmich/sdgc`.

The repository has already been initialized. Continue its Next.js App Router + strict TypeScript + Tailwind 4 + Supabase foundation. Preserve the exact supplied tweakcn light/dark palette and the original club logo. The active theme is `src/app/globals.css`, the logo is `public/images/brand/sdgc-logo.jpg`, and untouched source references are in `docs/reference/theme/`. Fonts are served locally from Inter/Lora packages. Use Node 24, npm 11, `npm ci`, exact dependencies and the npm lockfile. Do not replace the scaffold with a different stack or theme.

Your assignment is to **develop, test, fix, and deliver** the frontend and reproducible Supabase migration files, then integrate and verify the full application against **this repository's Docker-based local Supabase**. The existing WordPress site is `https://saugatuckdouglasgardenclub.com/`. Preserve every current function. The owner explicitly confirms that the old site has a member login panel and a WordPress administrator panel: **RBAC, member profile management, a member area and an admin area are required**.

Before editing product code, read these files in order:

1. `AGENTS.md` and `GEMINI.md`.
2. `docs/BOOTSTRAP-STATUS.md` and `docs/LOCAL-DEVELOPMENT.md`.
3. `docs/CURRENT-SITE-AUDIT.md`.
4. `docs/ARCHITECTURE.md`, especially the capability matrix and membership/payment rules.
5. `docs/DEVELOPMENT-PLAN.md`.
6. `docs/VERIFICATION-PLAN.md`.

Execute phases **P0 through P8** in the development plan. The intended order is discovery and foundation verification → complete responsive frontend → Supabase schema/RLS/storage migrations and seeds → real Auth/RBAC/member profile flows → events/media/contact/annual dues integration → full admin panel → migration/SEO/URL preservation → final verification and delivery. Complete each phase's checks, record evidence, fix failures and commit coherent increments before marking it done. Keep working through authorized local development without asking for routine confirmation at every phase.

Functional requirements include the club's public pages and navigation, List/Month/Day event browsing and details, galleries and Garden Walk ticket action, username-or-email authentication with recovery, every observed profile field and project interest, yearly dues with credit-card/mail-check paths, manual membership approval, contact submission, and club administration. Public membership evidence shows USD 50 for calendar year 2026, no automatic annual renewal, and manual verification even after online payment. Model this as configurable yearly pricing and separate payment/approval states; do not make payment automatically grant membership. Use `America/Detroit` for club dates and term boundaries.

Implement real RBAC in server data access and Supabase grants/RLS. Members edit their own allowed profile fields; they cannot assign roles, approve memberships, confirm payments or access someone else's private records. Editors, treasurers and admins have the capabilities in the specification, with audited role/approval/reconciliation operations. UI hiding and proxy redirects alone are insufficient. Add denial tests using actual anonymous/member/staff Supabase clients and direct server-action/API attempts. Role revocation must also work with existing cookies.

Use the **sdgc** local stack and the pinned CLI from this repo. Inspect Docker/ports and run `npm run db:status` before starting/resetting. An unrelated `sb-scratch` stack may exist; do not reset, stop or remove it. Do not link a hosted Supabase project, deploy to production, change DNS, perform live charges, send real external email, or import real private WordPress data during this assignment. All fixtures must be synthetic; authentication/contact email uses local capture. Create ordered migration files with the CLI, commit all schema/grants/policies/buckets/functions/triggers, enable RLS on every exposed table, and explicitly grant access. Generate database types from the real local schema and use them in both Supabase clients.

The starting audit distinguishes public evidence from unverified behavior. Inspect actual private member/admin screens if authorized access becomes available, and add all discovered functions to the parity ledger. The payment provider/ticket transaction details and complete private feature set are not established yet. Do not invent them or silently remove them. Continue all independent work while recording the exact missing evidence. A clearly labeled local test payment adapter is allowed only when server-gated and disabled in production; it does not count as verified provider integration. Do not claim complete WordPress parity while required private behavior remains unknown.

Use the installed-version Next.js documentation and current Supabase documentation before version-sensitive implementation. Keep feature code under `src/features`, default to Server Components, validate all mutations, use generated types and sanitize imported content. Frontend fixtures are acceptable in P2, but completed P4–P6 journeys must use real local Supabase rather than mocked persistence or fake success states.

Verify with the commands and acceptance cases in `docs/VERIFICATION-PLAN.md`: standard formatting/lint/types/unit checks, production build, replay/reset/provision, database lint and pgTAP, real Supabase API/Auth/Storage integration, desktop/mobile Playwright and final accessibility/role/date/import tests. Add the missing P3 integration/provision scripts and CI gates as the plan specifies. Never report a skipped or blocked command as passed.

For each phase, update checklist/parity status and write `docs/verification/phase-NN.md` with commands, outcomes, test totals and artifact paths. At delivery, produce `docs/DELIVERY.md` containing setup instructions, implemented scope, migration/type/seed/provision files, role matrix, test evidence, route/content reconciliation, known gaps, and remaining external prerequisites. Distinguish **frontend ready**, **migrations ready**, **local full-stack ready**, **legacy parity verified**, and **production ready** accurately.

Start by inspecting the current files and actual bootstrap status, then perform P0/P1. Continue through the plan until the local delivery is complete or the remaining work genuinely depends on missing access/configuration. Deliver all unaffected work and a precise blocker report when that happens.

---
