# Project instructions

## Purpose and authority

Build a Next.js + Supabase replacement for Saugatuck Douglas Garden Club. The user selected Antigravity to implement and test the website. This initialization task authorizes the foundation and planning; the execution prompt authorizes proceeding through development phases without asking for routine phase approvals.

Read `docs/ANTIGRAVITY-PROMPT.md`, `docs/CURRENT-SITE-AUDIT.md`, `docs/ARCHITECTURE.md`, `docs/DEVELOPMENT-PLAN.md`, and `docs/VERIFICATION-PLAN.md` before product implementation. Preserve user edits. Do not restart the project or replace its theme.

## Stack and structure

- Node 24, npm 11, `npm ci`, exact dependency versions, committed npm lockfile.
- Next.js App Router, React, strict TypeScript, Tailwind CSS 4, Supabase JS + SSR.
- `@/` maps to `src/`. Server Components by default; client boundaries only for interaction.
- Feature code belongs in `src/features/<domain>/`; routes delegate to that code.
- Use the supplied theme and logo. Fonts are local; never fetch Google Fonts during build.
- Site events and membership years use `America/Detroit`, not the developer machine timezone.
- Check documentation shipped with the installed Next.js version and current Supabase docs before using version-sensitive APIs. Next.js 16 uses `proxy.ts` for session refresh. Run Biome directly for linting; `next build` does not run the linter.

## Supabase and data

- Develop against the isolated **sdgc** Docker stack in this repository only. Do not reset or stop another project's containers.
- Never link a hosted project, run remote migrations, or use production credentials for tests.
- Run CLI `--help` before unfamiliar commands. Create migration files with `npx supabase migration new <name>`; do not invent migration timestamps.
- All schema, grants, policies, buckets, functions, and triggers must be reproducible from committed migrations. Do not leave Studio-only schema changes.
- Enable RLS for every exposed table; explicitly grant only needed operations. Test both allowed and denied access through real user clients.
- Keep elevated roles/approval/payment state out of user-editable fields. A client must never grant itself membership or a role.
- Use a validated server identity and a data-access authorization check for every protected mutation. A proxy redirect is not sufficient authorization.
- Never place a secret/service-role key in `NEXT_PUBLIC_*`, UI code, logs, fixtures, or Git. Default app clients use the publishable key.
- Regenerate `src/types/database.ts` from the real local schema after migration changes. Clients already use its `Database` generic; the bootstrap schema contains no application tables. Do not handwrite generated database types.
- Seeds use synthetic people and local email capture. Real exports go only in ignored `imports/private/`.

## Functional parity

- Track every verified function and discovered private feature in the parity inventory.
- Preserve annual, non-recurring dues and separate payment confirmation from manual membership approval.
- Preserve username-or-email login unless an explicit owner decision changes that requirement.
- Do not invent payment providers, private directories, online plant shops, scholarship applications, or ticketing behavior from marketing copy.
- Local payment simulation must be visibly labeled, server-controlled, and impossible to enable in production. A mock does not count as provider verification.
- Do not silently drop uncertain functionality. Continue independent work and report the exact missing evidence.

## Quality and completion

- Write meaningful failing tests before auth, RLS, payment transitions, import behavior, and other business rules; then implement and verify.
- Use Vitest, pgTAP, real local Supabase integration tests, and Playwright as assigned by the plan. Do not replace real RLS verification with mocks.
- Run `npm run check`, `npm run build`, affected browser tests, and the relevant database gates before marking a phase complete.
- Never claim a skipped/blocked check passed. Record commands, results, limitations, and artifacts in `docs/verification/phase-NN.md`.
- Commit coherent phase increments. Delivery is reviewable code and evidence; production publishing, DNS cutover, live financial actions, and importing private data need their own explicit instruction.
