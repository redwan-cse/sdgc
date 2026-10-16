# Legacy URL Redirection & SEO Preservation Strategy

## 1. Objectives

During migration from legacy WordPress to the modern Next.js architecture, URL continuity is critical to preserve:

1. Search engine indexing, domain authority, and organic rankings.
2. Inbound links from community partner websites, social media posts, printed event flyers, and QR codes.
3. Bookmarks and cached browser links for returning club members.

All redirect rules use **HTTP 308 (Permanent Redirect)** to signal permanent relocation while strictly preserving HTTP methods and request parameters.

---

## 2. Redirection Matrix

| Legacy Source Route | Target Destination | Status Code | Purpose / Context                                                 |
| :------------------ | :----------------- | :---------- | :---------------------------------------------------------------- |
| `/aboutourclub`     | `/about`           | `308`       | Legacy unspaced slug redirected to clean modern canonical route.  |
| `/aboutourclub/`    | `/about`           | `308`       | Trailing slash variant.                                           |
| `/becomeamember`    | `/join`            | `308`       | Legacy registration slug redirected to modern onboarding route.   |
| `/becomeamember/`   | `/join`            | `308`       | Trailing slash variant.                                           |
| `/wp-login.php`     | `/login`           | `308`       | Legacy WordPress login form redirected to modern authentication.  |
| `/wp-admin`         | `/admin`           | `308`       | Legacy WordPress dashboard root redirected to modern admin panel. |
| `/wp-admin/:path*`  | `/admin`           | `308`       | Legacy admin sub-paths collapsed to modern admin area.            |
| `/feed`             | `/events`          | `308`       | Legacy WordPress RSS feed redirected to events listing.           |
| `/feed/`            | `/events`          | `308`       | Trailing slash variant.                                           |
| `/events/feed`      | `/events`          | `308`       | Legacy calendar RSS feed.                                         |
| `/events/feed/`     | `/events`          | `308`       | Trailing slash variant.                                           |

---

## 3. Query Parameter Preservation

Marketing campaigns, printed flyers, and email blasts often append tracking query parameters:

- `https://saugatuckdouglasgardenclub.com/becomeamember?source=poster&year=2026`
- `https://saugatuckdouglasgardenclub.com/aboutourclub?utm_source=library_newsletter`

**Next.js Behavior:**
Next.js redirects automatically retain query parameters when executing permanent redirects. A visitor requesting `/becomeamember?ref=poster` receives a 308 response redirecting to `/join?ref=poster`. This is continuously verified by `scripts/audit-routes.mjs` and Playwright tests.

---

## 4. Preserved Direct Canonical Routes

The following core paths remain identical between legacy WordPress and Next.js, requiring no redirection:

- `/` (Homepage)
- `/garden-walk` (Annual Garden Walk fundraiser)
- `/events` (Events calendar list)
- `/events/month` (Monthly grid calendar view)
- `/events/day` (Single-day agenda view)
- `/event/:slug` (Specific event detail pages)
- `/gallery` (Community photo albums)
- `/contact` (Civic inquiry contact form)
- `/membership` (Dues status and renewal portal)
- `/login` (Member authentication)
- `/forgot-password` (Self-service recovery)
- `/profile` (Authenticated member profile management)
- `/directory` (Authenticated member directory)
- `/admin` (Role-protected management dashboard)

---

## 5. Verification Commands

To verify that all redirection rules are active, free of loops, and preserving query strings:

```bash
# Automated Node route audit
node scripts/audit-routes.mjs http://localhost:3000

# Automated Playwright test
npx playwright test tests/e2e/phase-07.spec.ts
```
