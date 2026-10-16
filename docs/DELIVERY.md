# Saugatuck Douglas Garden Club — Delivery & Handover Guide

## 1. Project Overview

This repository contains the complete Next.js (App Router) and Supabase replacement for the Saugatuck Douglas Garden Club website. The project modernizes the club's web presence from an outdated WordPress installation to a modern, accessible, type-safe, and secure full-stack web application with role-based access control (RBAC), annual membership lifecycle management, and a dedicated administrative panel.

All work has been developed and validated strictly against the isolated local Docker Supabase stack, following all standards defined in `docs/ANTIGRAVITY-PROMPT.md`, `docs/ARCHITECTURE.md`, `docs/DEVELOPMENT-PLAN.md`, and `docs/VERIFICATION-PLAN.md`.

---

## 2. Technology Stack & Architecture

- **Framework:** Next.js 16.4.1 (React 19, Server Components by default, App Router, Turbopack).
- **Styling & Theme:** Tailwind CSS 4 with local theme configuration supporting Dark, Light, and System themes.
- **Typography:** Local self-hosted Inter (sans-serif) and Lora (serif) font packages; zero external Google Font fetching during build.
- **Database & Auth:** PostgreSQL 15.8 via Supabase CLI in Docker, Row-Level Security (RLS) on all exposed tables, Supabase SSR proxy session management.
- **Code Quality & Linting:** Biome 2.5.15 (`--error-on-warnings`), Prettier 3.9.10, strict TypeScript 5.9.3.
- **Testing:** Vitest 5.0.5 (unit & integration tests), pgTAP (database schema & RLS tests), Playwright 1.64.1 (E2E browser tests across desktop and mobile).
- **Timezone Safety:** All calendar events, meetings, and term deadlines standardized to `America/Detroit`.

---

## 3. RBAC Test Personas & Test Credentials

The local environment includes 9 pre-provisioned synthetic personas covering every administrative role and membership lifecycle state. Use these credentials to verify and test any role in the application:

**Universal Password for All Personas:** `Password123!`

| Role / State          | Email Address                 | Username            | Roles                     | Status (2026 Term) | Testing Description                                            |
| :-------------------- | :---------------------------- | :------------------ | :------------------------ | :----------------- | :------------------------------------------------------------- |
| **Super Admin**       | `admin@sdgc.local`            | `super_admin`       | `["admin"]`               | _Staff_            | Full access to all 7 admin panels and private directory        |
| **Content Editor**    | `editor@sdgc.local`           | `content_editor`    | `["editor"]`              | _Staff_            | Manage events calendar, page copy, and media assets            |
| **Dues Treasurer**    | `treasurer@sdgc.local`        | `dues_treasurer`    | `["treasurer"]`           | _Staff_            | Manage dues ledger, manual check reconciliation, term rates    |
| **Combined Staff**    | `editor_treasurer@sdgc.local` | `combined_staff`    | `["editor", "treasurer"]` | _Staff_            | Multi-role user with both editorial and financial capabilities |
| **Active Member**     | `member@sdgc.local`           | `active_member`     | `[]`                      | `approved`         | Active member with access to private directory and profile     |
| **Member Beta**       | `member_b@sdgc.local`         | `member_beta`       | `[]`                      | `approved`         | Secondary active member for directory search testing           |
| **Pending Applicant** | `pending@sdgc.local`          | `pending_applicant` | `[]`                      | `pending`          | Application pending approval; directory shows locked notice    |
| **Expired Member**    | `expired@sdgc.local`          | `expired_member`    | `[]`                      | `expired`          | Past member awaiting renewal; directory shows locked notice    |
| **Suspended Member**  | `suspended@sdgc.local`        | `suspended_member`  | `[]`                      | `suspended`        | Inactive member; directory shows locked notice                 |

> [!NOTE]
> All users can authenticate using **either their email address OR username** on `/login`.

---

## 4. Key Features & Verified Capabilities

### A. Public Website

- **Modern Homepage (`/`):** Hero section with authentic imagery, upcoming event teasers, mission pillars, Garden Walk highlight, and accessible footer.
- **About Our Club (`/about`):** Civic project history, community beautification story, 6th grade outreach, and committee initiatives.
- **Annual Garden Walk (`/garden-walk`):** Showcase of the club's signature annual fundraiser with historical photo gallery.
- **Events Calendar (`/events`):** Full multi-view calendar (List view, Month grid, and Day view) with Detroit timezone formatting and Event JSON-LD schema markup.
- **Photo Gallery (`/gallery`):** Responsive grid of downloaded WordPress media with keyboard-accessible lightbox modal.
- **Join / Membership (`/join` & `/membership`):** Complete registration flow capturing 8 civic project interests, master gardener status, contact details, and annual dues policy ($50/year).
- **Contact Us (`/contact`):** Validated contact form with honeypot anti-spam protection, writing directly to the admin inquiries inbox.
- **Theme Toggle:** Sun/Moon toggle in the header allowing manual switching between Light, Dark, or System mode with local storage persistence.

### B. Legacy Route Preservation

Automatic permanent 308 redirects from historical WordPress discovery paths:

- `/aboutourclub` → `/about`
- `/becomeamember` → `/join`
- `/garden-tour` & `/tour` → `/garden-walk`
- `/calendar` & `/schedule` → `/events`
- All query parameters (`?ref=...`) are preserved during redirects.

### C. Member Portal (`/profile` & `/directory`)

- **Profile Management (`/profile`):** Secure self-service profile editor allowing members to update contact info, address, phone numbers, and project interests.
- **Private Member Directory (`/directory`):** Gated by `is_active_member()` database security function. Features instant live search by name, city, and project interest. Inactive/pending members receive a friendly locked status banner with instructions.

### D. Administrative Panel (`/admin`)

- **Executive Dashboard (`/admin`):** Real-time club metrics (active members, pending approvals, unreconciled dues, upcoming events, unread messages).
- **Member Management (`/admin/members`):** Review pending registrations, inspect applicant details, manually grant membership approvals, and assign RBAC roles.
- **Dues Reconciliation (`/admin/dues`):** Financial ledger tracking annual dues, recording check receipt numbers/notes, and reconciling payments.
- **Events Scheduler (`/admin/events`):** Add, publish, and delete club meetings, plant sales, and workdays.
- **Page Copy Editor (`/admin/content`):** Structured CMS interface for editing public page titles, subtitles, and publishing status.
- **Contact Submissions (`/admin/messages`):** Review inbound public inquiries and manage triage status.
- **Media Library (`/admin/media`):** Browse, upload, and organize assets in the Supabase `club-media` storage bucket.

---

## 5. Verification Status & Production Quality

| Quality Gate          | Verification Command       | Outcome                                                               |
| :-------------------- | :------------------------- | :-------------------------------------------------------------------- |
| **Linting**           | `npm run lint`             | Checked 154 files; 0 errors, 0 warnings (Biome `--error-on-warnings`) |
| **Formatting**        | `npm run format:check`     | 100% compliant with Prettier rules                                    |
| **Type Safety**       | `npm run typecheck`        | Next.js typegen succeeded; `tsc --noEmit` 0 errors                    |
| **Unit Tests**        | `npm test`                 | 16/16 passed (Vitest)                                                 |
| **Integration Tests** | `npm run test:integration` | 50/50 passed against local Supabase Docker stack                      |
| **pgTAP Tests**       | `npm run db:test`          | 39/39 passed (PostgreSQL schema & RLS policies)                       |
| **Database Drift**    | `npm run db:types`         | Generated types match committed migrations with zero git diff         |
| **Security Audit**    | `npm audit`                | 0 vulnerabilities (0 low, 0 moderate, 0 high, 0 critical)             |
| **Code Scanning**     | GitHub CodeQL              | All alerts remediated; 0 open alerts                                  |
| **E2E Browser Tests** | `npm run test:e2e`         | 132/132 passed across Desktop Chromium and Mobile iPhone 13           |
| **Production Build**  | `npm run build`            | All 27 static and dynamic routes compiled cleanly via Turbopack       |

---

## 6. How to Run Locally

### Prerequisites

- Node.js 24 (`.nvmrc` included) and npm 11.
- Docker Desktop (for the local Supabase stack).

### Quick Start Commands

```bash
# 1. Install exact locked dependencies
npm ci

# 2. Start the local Docker Supabase stack
npm run db:start

# 3. Provision environment keys (generates local .env.local)
npm run db:env

# 4. Reset migrations and seed database
npm run db:reset

# 5. Provision synthetic test personas
npm run db:provision

# 6. Run the Next.js development server
npm run dev
```

Open **http://127.0.0.1:3000** in your browser to explore the website. Sign in with any of the personas listed in Section 3 to test administrative and member capabilities.

---

## 7. Migration Tooling

When real WordPress exports become available:

```bash
# Dry run verification (produces zero-PII audit report):
node scripts/import-wordpress.mjs --dry-run --input-dir imports/private/

# Apply migration locally:
node scripts/import-wordpress.mjs --apply --input-dir imports/private/
```

> [!CAUTION]
> The migration script enforces strict loopback target protection. It will immediately terminate with an error if pointed at any hosted or remote URL. Real exports must never be committed to Git.
