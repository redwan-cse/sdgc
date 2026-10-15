# Saugatuck Douglas Garden Club

Next.js + Supabase replacement for the club's WordPress website, including RBAC, member profile management, and a dedicated admin panel. This repository currently contains a runnable development foundation and the implementation handoff for Antigravity. The finished club website is **not implemented yet**.

## Start here

- [Antigravity execution prompt](docs/ANTIGRAVITY-PROMPT.md)
- [Phased development plan](docs/DEVELOPMENT-PLAN.md)
- [Verification and delivery gates](docs/VERIFICATION-PLAN.md)
- [Current-site feature inventory](docs/CURRENT-SITE-AUDIT.md)
- [Architecture and data contracts](docs/ARCHITECTURE.md)
- [Local Docker setup](docs/LOCAL-DEVELOPMENT.md)
- [Actual bootstrap verification](docs/BOOTSTRAP-STATUS.md)

## Quick start

Use Node 24 and npm 11. Commit `package-lock.json`; install with `npm ci` on subsequent checkouts.

```sh
npm ci
npm run dev
```

Open <http://127.0.0.1:3000>. The foundation page builds without database credentials. Database features will require `.env.local` populated from the local stack; see the local setup guide.

```sh
npm run check
npm run build
npx playwright install chromium
npm run test:e2e
```

## Layout

```text
src/app/                 App Router routes, layouts, metadata, HTTP boundaries
src/components/ui/       Shared accessible primitives (add as needed)
src/features/            Domain code: content, events, membership, contact, admin
src/config/              Public application constants
src/lib/supabase/        Browser and request-scoped server clients
src/types/               Generated local database types; regenerate with migrations
public/images/brand/     Supplied club logo
supabase/                Local config, ordered migrations, seed, pgTAP tests
tests/e2e/               Playwright browser journeys
tests/integration/       Real local Supabase API and RLS integration tests
tests/fixtures/          Synthetic test data; no member exports
scripts/                 Cross-platform development utilities
docs/                    Requirements, architecture, plans, evidence
docs/reference/theme/    Unmodified supplied tweakcn sources
```

Keep one application and one lockfile. No monorepo, separate API service, ORM, payment SDK, or CMS dependency is required for initialization. Antigravity adds a dependency only when its phase needs it.

## Brand

The supplied logo is preserved at `public/images/brand/sdgc-logo.jpg`. `src/app/globals.css` uses the supplied light/dark tweakcn theme. Inter and Lora are served locally from font packages. The original export remains in `docs/reference/theme/`; the app fixes its self-referencing font tokens and clamps an invalid shadow alpha of 1.13 to 1. No logo redesign was performed.

## Scope and delivery

The immediate delivery target is the complete frontend, Supabase migration files, and working integration against this project's Docker Supabase. Production deployment, live payments, real outbound email, and live WordPress member import are later operational actions. Unknown private WordPress features must be resolved or explicitly listed as blockers before claiming complete parity.

No license has been selected for the application or supplied club assets; do not assume public-repository visibility grants asset reuse rights.
