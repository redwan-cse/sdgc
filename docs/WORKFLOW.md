# Saugatuck Douglas Garden Club — Git & Deployment Workflow

This document establishes the official development and deployment policy for the SDGC platform now that the live production site is active on Vercel at [https://sdgc.redwan.work/](https://sdgc.redwan.work/).

---

## 1. Core Principles

1. **`main` Branch is Production**:
   - The `main` branch directly mirrors what is deployed to production on Vercel.
   - Direct commits to `main` are restricted. All changes must arrive via a verified Pull Request.

2. **Branch & PR for Everything**:
   - Every feature, bugfix, schema migration, or chore must be developed in a dedicated git branch and merged via a Pull Request.

3. **All Checks Must Pass Before Merging**:
   - Pull Requests cannot be merged until all automated GitHub Actions CI checks and Vercel preview builds pass.

---

## 2. Branch Naming Convention

Use clear, descriptive branch prefixes:

| Type                   | Branch Pattern                             | Example                        |
| :--------------------- | :----------------------------------------- | :----------------------------- |
| **New Feature**        | `feat/<feature-name>`                      | `feat/ticket-scanning-qr`      |
| **Bug Fix**            | `fix/<issue-name>`                         | `fix/mobile-calendar-touch`    |
| **Performance / UI**   | `ui/<description>` or `perf/<description>` | `ui/gallery-lightbox-zoom`     |
| **Database Migration** | `db/<migration-name>`                      | `db/add-volunteer-preferences` |
| **Maintenance / Deps** | `chore/<task-name>`                        | `chore/bump-dependencies`      |

---

## 3. Step-by-Step Development Lifecycle

### Step 1: Create a Feature Branch

Ensure local `main` is up-to-date and branch off:

```bash
git checkout main
git pull origin main
git checkout -b feat/my-new-feature
```

### Step 2: Implement Changes & Test Locally

Implement your code and verify quality gates locally before pushing:

```bash
# 1. Format, lint, typecheck, and unit test
npm run check

# 2. Verify Next.js Turbopack build
npm run build
```

If your changes involve database migrations:

```bash
# Run Supabase integration and pgTAP tests
npm run test:integration
npm run db:test
```

### Step 3: Commit Cleanly

Write concise, Conventional Commit messages:

```bash
git add .
git commit -m "feat(events): add recurring volunteer shift scheduling"
```

### Step 4: Push Branch and Open a Pull Request

Push your branch to GitHub:

```bash
git push -u origin feat/my-new-feature
```

Open a PR using GitHub Web or GitHub CLI (`gh`):

```bash
gh pr create --title "feat(events): add recurring volunteer shift scheduling" --body "### Description\nDetails of the change...\n\n### Verification\n- npm run check passed\n- npm run build passed"
```

---

## 4. Pull Request CI Gates & Automation

When a PR is opened or updated, GitHub Actions automatically runs the verification workflow:

1. **Frontend CI (`.github/workflows/ci.yml`)**:
   - `npm ci`
   - `npm run check` (Prettier code style, Biome linting, TypeScript route typecheck, Vitest unit tests)
   - `npm audit` (Dependency vulnerability scanner)
   - `npm run build` (Next.js Turbopack production compilation)

2. **Database CI (`.github/workflows/ci.yml`)**:
   - Spin up isolated Docker Supabase service stack
   - Run all database migrations sequentially
   - Validate schema drift
   - Execute pgTAP database test suite
   - Execute Integration test suite
   - Execute Playwright E2E test suite across Desktop and Mobile viewports

3. **Vercel Preview Deployment**:
   - Vercel automatically creates a unique Preview Deployment for the branch (e.g., `https://sdgc-web-git-feat-my-feature-*.vercel.app`).
   - Use the preview link to visually review changes in a production-identical cloud environment.

---

## 5. Merging & Production Release

1. **Review & Approval**:
   - Verify all GitHub Actions checks display green checkmarks (`✓`).
   - Confirm Vercel Preview Deployment is healthy.
2. **Squash and Merge**:
   - Merge the PR into `main` using **Squash and Merge** to maintain a clean git history.
3. **Automatic Production Deployment**:
   - Merging to `main` triggers Vercel's automated production pipeline.
   - Changes are deployed live to [https://sdgc.redwan.work/](https://sdgc.redwan.work/) in under 60 seconds with zero downtime.

---

## 6. Version Tags & Milestones

For milestone releases (e.g. `v1.3.0`):

1. Update `version` in `package.json` and `package-lock.json` via PR.
2. Tag the release on `main`:
   ```bash
   git tag -a v1.3.0 -m "Release v1.3.0"
   git push origin main --tags
   ```
3. Create the GitHub release using `gh release create`.
