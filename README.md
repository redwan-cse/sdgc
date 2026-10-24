# Saugatuck-Douglas Garden Club (SDGC)

[![CI](https://github.com/sdgcmich/sdgc-web/actions/workflows/ci.yml/badge.svg)](https://github.com/sdgcmich/sdgc-web/actions/workflows/ci.yml)
[![CodeQL Security Analysis](https://github.com/sdgcmich/sdgc-web/actions/workflows/codeql.yml/badge.svg)](https://github.com/sdgcmich/sdgc-web/actions/workflows/codeql.yml)
[![Next.js](https://img.shields.io/badge/Next.js-16.4.2-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ecf8e?logo=supabase)](https://supabase.com/)

A modern, high-performance, and secure digital platform for the **Saugatuck-Douglas Garden Club** (Est. 1928, Federated 1947, 501(c)(3) nonprofit). Built with Next.js App Router, Supabase PostgreSQL, and Cloudinary, this application completely replaces the legacy WordPress site with enterprise-grade security, full Role-Based Access Control (RBAC), and interactive community tools.

---

## Key Highlights & Features

### 🌸 Public Discovery & Community Engagement

- **Dynamic Events Calendar**: Interactive event schedule supporting **List**, **Month grid**, and **Day schedule** views, complete with automated recurring event expansion and one-click `.ics` feed calendar subscription.
- **Curated Photo Gallery**: Responsive, filterable media showcases spanning modern and historical Garden Walks, civic beautification, and youth gardening projects, backed by Cloudinary CDN optimization and full-screen accessible lightboxes.
- **Club Notice Board**: Public announcements and committee updates with rich Markdown rendering (headers, formatted lists, blockquotes, and links).
- **Club Heritage & Bylaws**: Dedicated history section covering SDGC's 1928 founding and federation with Michigan Garden Clubs District IV, with direct access to official Club Bylaws (PDF).
- **Protected Contact Workflow**: Inquiries routed through an anti-spam honeypot and server-side rate-limited form submission.

### 🎟️ Annual Garden Walk

- Dedicated showcase celebrating over 46 years of community garden walk traditions in Saugatuck and Douglas.
- Interactive ticket reservation and simulated payment workflow.

### 👥 Member Portal

- **Self-Service Profiles**: Member profile management with granular privacy controls (toggle visibility of phone, email, and street address).
- **Community Member Directory**: Searchable, privacy-aware directory for active club members.
- **Annual Dues Management**: Real-time status tracking for annual dues, payment receipts, and automated confirmation badges.

### 🛡️ Enterprise Security & Governance

- **MFA (AAL2 Enforcement)**: Strict Authenticator Assurance Level 2 enforcement via Time-based One-Time Passwords (TOTP) for high-privilege administrative actions.
- **Password-Protected MFA Unenroll**: Requires explicit password verification before removing second-factor protection.
- **Row Level Security (RLS)**: Comprehensive PostgreSQL RLS policies on all database tables ensure strict tenant and role isolation.
- **Role-Based Access Control (RBAC)**: Fine-grained permissions across `public`, `member`, `admin`, and `superadmin` roles.
- **Static Security Audits**: Continuous automated scanning via GitHub CodeQL and Dependabot. See [SECURITY.md](SECURITY.md) for vulnerability reporting guidelines.

### ⚙️ Dedicated Admin Suite

- **Analytics & Operations Overview**: High-level statistics on active members, dues collections, upcoming events, and pending messages.
- **Event & Venue Management**: Full management suite for scheduling club meetings, field trips, and workshops across regional venues.
- **Media & Album Manager**: Upload, tag, categorize, and organize media assets into curated public albums.
- **Member Management**: Member roster administration, status updates, and administrative role assignment.
- **Notice Management**: Live Markdown preview and publishing interface for instant club notices.

---

## Technology Stack

| Layer                  | Technologies                                                                                                     |
| :--------------------- | :--------------------------------------------------------------------------------------------------------------- |
| **Frontend Framework** | [Next.js 16.4.2](https://nextjs.org/) (App Router, Server Components, Server Actions)                            |
| **Language & Tooling** | [TypeScript 5](https://www.typescriptlang.org/), [Biome](https://biomejs.dev/), [Prettier](https://prettier.io/) |
| **Styling & Theme**    | [Tailwind CSS v4](https://tailwindcss.com/), Radix UI accessible primitives, Lucide icons, Dark/Light mode       |
| **Backend & Database** | [Supabase](https://supabase.com/) (PostgreSQL 15, Row Level Security, Auth, Storage, pgTAP)                      |
| **Media Delivery**     | [Cloudinary](https://cloudinary.com/) (CDN image optimization, responsive formats, automatic compression)        |
| **Testing & Quality**  | [Vitest](https://vitest.dev/) (82 unit tests), [Playwright](https://playwright.dev/) (26 browser E2E journeys)   |
| **Security & CI/CD**   | GitHub Actions (lint, typegen, build, db test, CodeQL static analysis, high-audit gates)                         |

---

## Project Structure

```text
sdgc-web/
├── .github/
│   └── workflows/          # GitHub Actions CI & CodeQL workflows
├── public/                 # Static assets, brand logo, and icons
├── src/
│   ├── app/                # Next.js App Router (Public routes, Auth, Admin, API)
│   ├── components/         # Shared UI components (Markdown, ThemeToggle, Lightbox)
│   ├── config/             # Application constants and navigation manifests
│   ├── features/           # Domain feature slices
│   │   ├── admin/          # Admin dashboard, overview, and roster management
│   │   ├── auth/           # Login, registration, password recovery, MFA verification
│   │   ├── contact/        # Contact form validation and message storage
│   │   ├── events/         # Calendar views, query layer, .ics generator
│   │   ├── media/          # Album queries, gallery components, and asset viewers
│   │   ├── membership/     # Profile editor, member directory, dues tracking
│   │   ├── notices/        # Notice board, markdown parser, admin editor
│   │   └── payments/       # Dues checkout, payment simulation, Stripe provider
│   ├── lib/                # Storage, Cloudinary manifests, Supabase clients
│   └── types/              # Database models, auth personas, and domain types
├── supabase/
│   ├── migrations/         # Sequential database schema and RLS migrations
│   ├── tests/              # pgTAP database unit and security tests
│   └── seed.sql            # Local development seed data
├── tests/
│   ├── e2e/                # Playwright end-to-end browser journeys
│   ├── integration/        # Supabase API, RLS, and auth integration tests
│   └── unit/               # Vitest unit test suites
└── SECURITY.md             # Responsible vulnerability disclosure policy
```

---

## Quick Start & Local Development

### Prerequisites

- **Node.js**: `v24.x` (managed via `.nvmrc`)
- **npm**: `v11.x`
- **Docker**: Required for local Supabase database and authentication emulation.

### 1. Installation

Clone the repository and install dependencies using clean install:

```sh
git clone https://github.com/sdgcmich/sdgc-web.git
cd sdgc-web
npm ci
```

### 2. Environment Configuration

Copy the template and populate required credentials:

```sh
cp .env.example .env.local
```

### 3. Start Local Database & Development Server

To run with local Supabase:

```sh
# Start local Supabase Docker stack (PostgreSQL, Auth, Studio)
npm run db:start

# Seed database and extract environment variables
npm run db:reset

# Launch the Next.js development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the application.

---

## Verification & Testing Scripts

The repository enforces strict quality, security, and formatting gates before any merge:

```sh
# Run all code quality checks (Prettier, Biome, Next route typegen, tsc, Vitest)
npm run check

# Run unit tests only
npm test

# Run database integration tests against local Supabase
npm run test:integration

# Run Playwright end-to-end browser tests
npx playwright install chromium
npm run test:e2e

# Run database schema linter and pgTAP security tests
npm run db:lint
npm run db:test

# Verify production build bundle
npm run build
```

---

## Security & Responsible Disclosure

We prioritize the safety of our community data. If you discover a potential vulnerability, please review our [Security Policy](SECURITY.md) and submit a private report via [GitHub Private Vulnerability Reporting](https://github.com/sdgcmich/sdgc-web/security/advisories) or email `sdgcmich@gmail.com`.

---

## Heritage & Attribution

The **Saugatuck-Douglas Garden Club** is a nonprofit community organization serving Saugatuck and Douglas, Michigan since 1928.

- All historic photographs, garden walk artwork, and official documents are preserved and published with permission of the SDGC Executive Board.
- Designed and engineered with modern web standards to ensure accessibility, sustainability, and longevity.
