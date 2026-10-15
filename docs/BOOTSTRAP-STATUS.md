# Bootstrap status

Initialized on 2026-10-15. This document records actual setup evidence. It does not certify the completed club website.

## Implemented foundation

- Single Next.js 16.4.1 / React 19.3.1 app, strict TypeScript, Tailwind 4.3.3.
- Supabase JS 2.118.0 / SSR 0.12.7 clients and pinned CLI 2.121.0.
- Supplied logo and theme preserved; locally served Inter/Lora; corrected self-referencing font tokens and invalid shadow opacity in active CSS only.
- Biome + Prettier, Vitest, Playwright, Git ignores/editor/runtime settings, CI and dependency updates.
- Generated Supabase local config with explicit grants mode, email confirmation, isolated project ID and synthetic-seed placeholder.
- Generated `src/types/database.ts` from the real empty local application schema; both clients use its `Database` generic. `db:env` creates the ignored local environment without printing keys.
- Evidence-based feature audit, architecture/RBAC matrix, phase plan, verification plan, local runbook and Antigravity prompt.

## Verification

| Check                                 | Actual result                                                                                  |
| ------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `npm ci`                              | Passed; 104 packages installed from lockfile, zero reported vulnerabilities                    |
| `npm run check`                       | Passed: formatting, Biome lint, route type generation, strict TypeScript and 2 unit tests      |
| `npm run build`                       | Passed: optimized Next.js build and public/404 prerendering                                    |
| `npm run test:e2e`                    | Passed: 4 tests across desktop and mobile Chromium (identity page and 404/navigation)          |
| `npm audit` and production-only audit | Both reported zero vulnerabilities                                                             |
| `npm run db:start`                    | Passed: isolated `sdgc` Docker stack initialized and running                                   |
| Service health requests               | Data API, Auth settings, Storage buckets, local email capture and Studio all returned HTTP 200 |
| `npm run db:env`                      | Created ignored `.env.local` from local CLI status; no keys printed by the helper              |
| `npm run db:lint`                     | Passed; no schema errors in the baseline schemas                                               |
| `npm run db:types`                    | Passed; actual local types generated successfully                                              |
| Git ignore review                     | `.env.local`, dependencies, builds, temporary source drop and browser results ignored          |

The stack was left running for local development: API `127.0.0.1:54321`, Postgres `54322`, Studio `54323`, email capture `54324`. No command stopped/reset the unrelated scratch stack. The local environment file remains ignored and was not published.

GitHub Actions has a frontend job and a database job. The database job explicitly skips application gates until SQL migrations exist; P3 must add real pgTAP/API fixtures and tests. Actions are pinned to verified release commits. Consult the GitHub run for remote CI status; local verification is listed above.

## Scope still assigned to Antigravity

No application migrations, role policies, member/admin panel, payment provider integration, or real WordPress data import have been implemented in this bootstrap. `db:test` has no application pgTAP tests yet and is not claimed as passed. The existing logo/theme/foundation are a starting point, not a finished frontend.

Private WordPress screens, additional member-only functionality, actual payment/ticket provider behavior, historical assets and an authorized data export remain discovery dependencies. The owner confirmed RBAC/member profiles and member/admin areas as mandatory. These requirements are explicitly covered by the architecture, phased implementation plan and acceptance tests.

## Host/tool observations

Restricted command execution failed on an unrelated locked BitLocker `I:` volume; the approved alternate execution mode succeeded. Direct legacy-site fetch returned 403, so the initial public audit uses readable indexed extracts plus the directly readable Garden Walk page and records that confidence limitation.
