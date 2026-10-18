# SDGC Development Plan v2.0 — Client Zoom Feedback & Full Parity Alignment

**Document Status:** Approved for Implementation  
**Baseline Commit:** `1f33bf8` (Phase A–D Complete, 150/150 Playwright E2E passing, CI green)  
**Target Environment:** Local Docker Supabase (`sdgc`), Next.js 16 App Router, Node 24, strict TypeScript, Tailwind CSS 4, tweakcn theme, local fonts (`America/Detroit` timezone).

---

## 1. Line-by-Line Client & Review Synthesis

| User / Client Feedback Item                                                                                                                                                                                                                  | Codebase Audit Finding                                                                                                                                                                                                                                                                                                                                                     | Architectural Solution & Plan Phase                                                                                                                                                                                                                                                                                                                                                                                       |
| :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **1. Tablet ("Tab Mode") Responsiveness**<br>_"I have checked the Tab Mode in dev tool. The tab mode has lots of responsiveness issues."_                                                                                                    | - In `AdminShell`, `aside` is hardcoded to `w-72` (288px) on `md` (768px–1023px), leaving only ~480px for admin tables.<br>- Tables in `/admin/members`, `/admin/dues`, `/admin/events` lack horizontal scroll wrappers or mobile/tablet card collapses.<br>- Public site header crams 8+ links into 768px.<br>- Grids (`md:grid-cols-4`) squeeze cards below 180px width. | **Phase 1: Tablet Breakpoints & Responsive Shell Overhaul**<br>- Make Admin sidebar collapsible with slide-over drawer on `< lg` (1024px).<br>- Add horizontal scroll containers (`overflow-x-auto min-w-[640px]`) for administrative tables.<br>- Adjust public header breakpoint to switch to mobile drawer below 1024px or compact tablet mode.<br>- Adjust card grids to `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`. |
| **2. Authentic Home Page Content & Photos**<br>_"I found thir exiting home page lots of better content than ours. And those are their choosen photos. We must bring everything in our home page."_                                           | Current `page.tsx` renders only 2 basic placeholder sections. The 161 authentic assets dumped in `public/images/wordpress/` are unused on the homepage.<br>Real copy: Mission motto, 4 core pillars, 1928 founding narrative, and real high-res photography.                                                                                                               | **Phase 2: Authentic Home Page Presentation & Visual Hierarchy**<br>- Rebuild homepage with authentic written copy and high-res photography (`DSC_2808`, `2O8A6013`, `DSC_7044`, `DSC_0553`, `2O8A6596`, `2O8A5979`).<br>- Present the Four Pillars in modern glassmorphic showcase cards with hover accents.<br>- Highlight the Welcoming Community & Membership narrative.                                              |
| **3. Real Upcoming Events & `seed.sql` Parity**<br>_"They have 3+ upcomming events. Their events are there key selling points. We must show those events in our sites as well. Maybe we can add everything into seed.sql"_                   | In `supabase/seed.sql`, seeded events were set in May/July 2026 (already past in test timeline October 2026), leaving homepage upcoming event loops empty.<br>Real calendar export contains authentic events (Board Meetings, Holiday Swag, Holiday Dinner, Welcome Back Tea, 47th Garden Walk).                                                                           | **Phase 3: Real Upcoming Events Engine & Seed Parity**<br>- Seed 5 authentic future events (Nov 2026 – July 2027) with verified venues in `supabase/seed.sql` and migration.<br>- Add dynamic "Featured Upcoming Events" section to homepage.<br>- Reconcile calendar views and category pills.                                                                                                                           |
| **4. Incomplete Features / Client Limitations**<br>_"Our clients claims the demo version we sends has lots of limitation and incomplete features"_                                                                                           | Prototype gaps: No inline venue creation, plain description textareas without formatting, rigid dues terms without deadline extensions, hardcoded settings, non-optimized image uploads.                                                                                                                                                                                   | **Phases 4–7**: Systematically implement end-to-end functionality for every reported limitation.                                                                                                                                                                                                                                                                                                                          |
| **5. Inline Venue Creation During Event Scheduling**<br>_"On admin page event scheduling an admin should be abale to create a new venue info and add it during event creation."_                                                             | In `src/features/admin/components/admin-events.tsx`, venue selection is a static dropdown. Admins cannot create a venue on the fly; they must leave the modal or edit the database.                                                                                                                                                                                        | **Phase 4: Admin Event Scheduling Upgrades**<br>- Add `createVenueAction` server action.<br>- Add "+ New Venue" toggle in Add/Edit Event dialog to enter venue name, address, city, state, zip, and website inline.<br>- Auto-select newly created venue upon save.                                                                                                                                                       |
| **6. Rich Markdown Formatting & Event Banner Picker**<br>_"They want rich markdown content or ms word basic functions formatting the description also might want to pick image or banner for the event."_                                    | Event description is a plain `<textarea rows={3}>`. No formatting toolbar or preview. Event banner / featured image cannot be chosen from the UI.                                                                                                                                                                                                                          | **Phase 4: Admin Event Scheduling Upgrades**<br>- Add markdown toolbar (Bold, Italic, Headings, Lists, Links, Quotes) with "Write / Preview" tabs.<br>- Add Image & Banner Picker allowing selection from media gallery or direct banner upload.<br>- Render banner on `/events/[slug]` and card thumbnails.                                                                                                              |
| **7. Dues Reconciliation & Term Deadline Extensions**<br>_"Dues Reconciliation : Sometimes they might need to extend the deadline and also might need to edit or add more detail on terms. etc..."_                                          | In `src/features/admin/components/admin-dues.tsx`, only dues dollar amount can be edited. Admins cannot extend `closes_at` deadline, adjust open dates, add term notes, or create new upcoming terms.                                                                                                                                                                      | **Phase 5: Dues Administration & Reconciliation Extensions**<br>- Implement `updateMembershipTermAction` and `createMembershipTermAction`.<br>- Build Term Management panel with "Extend Deadline", "Edit Term Details", and "+ Add Term" modals.<br>- Enhance Dues Reconciliation table with search, year filtering, and reconciliation memo notes.                                                                      |
| **8. Modular Media Storage (R2 / Cloudinary / Supabase)**<br>_"They said the media and album section needs huge works. They will probably use Cloudinary or Cloudflare R2"_                                                                  | `uploadMediaAssetAction` currently calls `supabase.storage.from('club-media')` directly, tightly coupling the codebase to Supabase storage.                                                                                                                                                                                                                                | **Phase 6: Modular Media Architecture & Storage Provider Adapter**<br>- Define `StorageProvider` interface (`upload`, `delete`, `getPublicUrl`).<br>- Implement `SupabaseStorageProvider`, `CloudflareR2StorageProvider`, and `CloudinaryStorageProvider`.<br>- Configure provider via `STORAGE_PROVIDER` environment variable (defaults to Supabase for local Docker).                                                   |
| **9. Auto-Optimize Photos During Upload**<br>_"Also they want to store auto optimize photos during upload, the optimization will still allow user to get rich quality photos even they see it in big desktop monitor but smaller file size"_ | Large raw images (up to 15MB) uploaded as-is. Causes slow loading on mobile and desktop.                                                                                                                                                                                                                                                                                   | **Phase 6: Sharp Image Auto-Optimization Pipeline**<br>- Install `sharp` dependency.<br>- Auto-resize to max width 1920px (preserving 4K desktop sharpness via Lanczos3 resampling).<br>- Convert to compressed WebP (quality 82%), reducing payload by 70–85%.<br>- Auto-generate 400px thumbnail for gallery grids and cards.<br>- Strip sensitive EXIF while preserving sRGB color profiles.                           |
| **10. Editable Phone, Email, Address & Social Media**<br>_"They want to update their phone, email, social media etc info from admin page instead of using hardcoded infos."_                                                                 | Contact information is hardcoded in `SiteFooter`, `contact/page.tsx`, and site headers. `site_settings` table has `'club_info'` but no admin editing interface.                                                                                                                                                                                                            | **Phase 7: Dynamic Site Settings & Contact Management**<br>- Create `/admin/settings` page and `AdminSettings` component.<br>- Allow editing Club Name, Phone, Email, Mailing Address, Meeting Location, Facebook URL, Instagram URL.<br>- Connect `SiteFooter`, `ContactPage`, and `SiteHeader` dynamically to live settings.                                                                                            |
| **11. CMS Editable Homepage Text & Pillars**<br>_"More important: The text content of site they written themselfs... Also they asked, it would be better if we allow them to update those texts from admin panel."_                          | In `/admin/content`, editing `home` only provides a single plain text box for `content`, ignoring the 4 pillars and mission sections.                                                                                                                                                                                                                                      | **Phase 7: Structured CMS Page Content Editor**<br>- Support structured editing for homepage: Hero Motto, 4 Pillars (Title, Description, Image, Link), and Membership Story in `/admin/content`.<br>- Render public pages dynamically from these saved structures.                                                                                                                                                        |
| **12. Site-Wide SEO & Structured Data**<br>_"They want to additional infos for SEO purpose on site."_                                                                                                                                        | Basic static metadata only. Missing Schema.org JSON-LD structured data (Organization, Events, Breadcrumbs) and complete OpenGraph/Twitter social cards.                                                                                                                                                                                                                    | **Phase 8: Comprehensive SEO & Social Meta Upgrades**<br>- Inject JSON-LD structured data for Organization (NGO), Events, and Breadcrumbs.<br>- Enhance OpenGraph and Twitter cards across all routes.<br>- Update `sitemap.ts` and `robots.ts` with dynamic event and page routes.                                                                                                                                       |

---

## 2. Phase-by-Phase Execution Roadmap

```
Phase 1: Tablet Breakpoints & Responsive Shell Overhaul (Admin Sidebar, Tables, Public Header)
   │
   ▼
Phase 2: Authentic Homepage Experience & Media Showcase (Motto, 4 Pillars, Real Photos)
   │
   ▼
Phase 3: Real Upcoming Events Engine & Seed Parity (5 Authentic Events, seed.sql Migration)
   │
   ▼
Phase 4: Admin Event Scheduling Upgrades (Inline Venue Creator, Markdown Toolbar, Banner Picker)
   │
   ▼
Phase 5: Dues Administration & Reconciliation Extensions (Deadline Extender, Term Editor)
   │
   ▼
Phase 6: Image Auto-Optimization (Sharp WebP) & Modular Storage Provider (R2/Cloudinary Adapter)
   │
   ▼
Phase 7: Dynamic Site Settings & Homepage CMS Editor (/admin/settings, Structured Content)
   │
   ▼
Phase 8: Comprehensive SEO, Structured Data (JSON-LD) & End-to-End Verification Suite
```

---

### Phase 1: Tablet Breakpoints & Responsive Shell Overhaul

**Goal:** Eliminate layout cramping, blown widths, and missing buttons between 768px and 1024px across the entire application.

#### Tasks:

1. **Admin Shell Tablet Drawer / Collapsible Sidebar:**
   - In [`src/features/admin/components/admin-shell.tsx`](file:///j:/DevDrive/sdgc/src/features/admin/components/admin-shell.tsx):
     - On `< lg` (below 1024px), collapse sidebar into a sliding sheet drawer opened via a hamburger toggle on the workspace top bar.
     - On `lg` (1024px+), keep the permanent sidebar.
     - Grant the main content container the full 768px–1024px width on tablets.
2. **Horizontal Table Scroll & Mobile/Tablet Card Views:**
   - In [`src/features/admin/components/admin-members.tsx`](file:///j:/DevDrive/sdgc/src/features/admin/components/admin-members.tsx):
     - Wrap members table in `<div className="overflow-x-auto min-w-full">` with `min-w-[700px]` table body.
     - Add sticky header and actions column.
   - In [`src/features/admin/components/admin-dues.tsx`](file:///j:/DevDrive/sdgc/src/features/admin/components/admin-dues.tsx):
     - Wrap reconciliation table in horizontal scroll wrapper.
   - In [`src/features/admin/components/admin-events.tsx`](file:///j:/DevDrive/sdgc/src/features/admin/components/admin-events.tsx):
     - Wrap events table in horizontal scroll wrapper.
3. **Public Header Tablet Navigation Coordination:**
   - In [`src/components/layout/site-header.tsx`](file:///j:/DevDrive/sdgc/src/components/layout/site-header.tsx):
     - Adjust breakpoint so navigation links and action buttons switch cleanly at `lg` (1024px).
     - At `md` (768px–1023px), provide either a clean compact icon bar or route into the slide-out mobile drawer with full auth actions (Profile, Admin, Sign Out, Login, Join).
4. **Public Grid Layout Adjustments:**
   - Review all `md:grid-cols-3` and `md:grid-cols-4` to ensure they use `sm:grid-cols-2 lg:grid-cols-4` so cards maintain at least 280px width on tablet viewports.

---

### Phase 2: Authentic Homepage Experience & Media Showcase

**Goal:** Transform the homepage into a visual showcase incorporating the client's authentic written copy and high-resolution club photography.

#### Tasks:

1. **Hero Section Evolution:**
   - Background: High-res authentic garden photography (`/images/wordpress/DSC_2808-scaled-1.jpg`) with gradient overlay.
   - Logo: `/images/wordpress/SDGC-Logov3-transparent-modified.png`.
   - Motto: _"We promote, encourage and support the use of flora to enrich and beautify Saugatuck and Douglas, Michigan, and surrounding areas."_
   - Heritage Badge: _"Cultivating Community Since 1928 • 501(c)(3) Nonprofit"_.
   - CTAs: Primary _"Become A Member"_, Secondary _"Annual Garden Walk"_, Tertiary _"Explore Events"_.
2. **The Four Pillars Showcase (Authentic Words & Photos):**
   - **Pillar 1: Scholarship Activities & Fundraisers**
     - Image: `/images/wordpress/2O8A6013-653x653-1.jpg`
     - Copy: High school senior scholarships from Saugatuck and Fennville, funded by the Garden Walk, member plant sale, and spring annuals sale.
   - **Pillar 2: Public Spaces & Community Beautification**
     - Image: `/images/wordpress/DSC_7044-651x651-1.jpg`
     - Copy: Planting and maintaining sidewalk pots and corner bump-outs in partnership with Saugatuck 6th graders.
   - **Pillar 3: Flower Power & Local Garden Recognition Awards**
     - Image: `/images/wordpress/DSC_0553-1349x1349-1.jpg`
     - Copy: Annual summer honors for residential, commercial, and window box landscaping.
   - **Pillar 4: Monthly Programs, Workshops & Outreach**
     - Image: `/images/wordpress/2O8A6596-1000x1000-1.jpg`
     - Copy: Hands-on seedling distribution, holiday swags for seniors, and monthly educational lectures.
3. **Welcoming Community & Membership Narrative:**
   - Image: `/images/wordpress/2O8A5979-scaled-e1746814119349.jpeg`
   - Copy: 85+ active members, third-Monday meetings, "buddy" system for newcomers, Welcome Back Tea, and Summer New Member Party.
4. **Key Selling Point: Featured Upcoming Events Section:**
   - Dynamic grid showcasing the next 3 authentic upcoming events with date, time, location, description, and direct RSVP/calendar link.

---

### Phase 3: Real Upcoming Events Engine & Seed Parity

**Goal:** Populate database with authentic upcoming club events matching the live calendar, permanently codified in `seed.sql`.

#### Tasks:

1. **Seed Migration for Authentic Events & Venues:**
   - Target files:
     - `supabase/migrations/<timestamp>_seed_authentic_upcoming_events.sql`
     - `supabase/seed.sql`
   - Seeded Venues:
     - _Old School House Douglas_ (130 Center St, Douglas, MI 49406)
     - _Saugatuck Woman's Club_ (303 Butler St, Saugatuck, MI 49453)
     - _Fenn Valley Vineyards_ (6130 122nd Ave, Fennville, MI 49408)
     - _Huntree Nursery_ (2315 Blue Star Hwy, Fennville, MI 49408)
     - _Saugatuck Center for the Arts_ (400 Culver St, Saugatuck, MI 49453)
   - Seeded Upcoming Events (Detroit Time, Future-DATED):
     - **Monthly Board Meeting**: November 9, 2026, 9:30 AM – 11:30 AM (Old School House)
     - **Holiday Swag & Senior Floral Arrangement Workshop**: December 5, 2026, 10:00 AM – 1:00 PM (Saugatuck Middle School)
     - **Annual Club Holiday Dinner & Celebration**: December 10, 2026, 6:00 PM – 9:00 PM (Fenn Valley)
     - **Welcome Back Tea & Annual Season Kickoff**: April 19, 2027, 2:00 PM – 4:00 PM (Saugatuck Woman's Club)
     - **47th Annual Garden Walk Fundraiser & Plant Sale**: July 17, 2027, 10:00 AM – 4:00 PM (Old School House Douglas)
2. **Apply Migration to Local Docker Database & Regenerate Types:**
   - Run `npx supabase db reset --local` or apply migration.
   - Run `npm run db:types` to refresh `src/types/database.ts`.
3. **Verify Public Calendar & Homepage Integration:**
   - Confirm upcoming events appear on `/`, `/events`, `/events/month`, and `/events/day`.

---

### Phase 4: Admin Event Scheduling Upgrades

**Goal:** Enable inline venue creation, rich markdown formatting for descriptions, and featured banner/image selection during event creation.

#### Tasks:

1. **Server Action for Venue Creation:**
   - In [`src/features/admin/actions.ts`](file:///j:/DevDrive/sdgc/src/features/admin/actions.ts):
     - Implement `createVenueAction(input: { name, address, city, state, postalCode, url })`.
     - Validate inputs with Zod, require `events.manage` capability, insert into `public.venues`.
2. **Inline Venue Creator in Admin Events Dialog:**
   - In [`src/features/admin/components/admin-events.tsx`](file:///j:/DevDrive/sdgc/src/features/admin/components/admin-events.tsx):
     - Add `+ New Venue` button next to Venue Location selector.
     - When clicked, expand inline venue creation fields.
     - Saving automatically invokes `createVenueAction`, adds to `venues` list, and selects the new venue immediately.
3. **Rich Markdown Formatting Toolbar:**
   - Provide formatting buttons above the description:
     - Bold (`**`), Italic (`*`), Heading 3 (`###`), Bullet List (`- `), Numbered List (`1. `), Link (`[text](url)`), Quote (`> `).
     - Add "Write" vs "Preview" tab toggle showing formatted HTML output.
4. **Event Banner & Featured Image Picker:**
   - Add image picker to Add/Edit Event dialog:
     - Select from uploaded media library or upload new banner image.
     - Persist image path to `events.featured_image`.
     - Display banner preview in dialog, on event cards, and at `/events/[slug]`.

---

### Phase 5: Dues Administration & Reconciliation Extensions

**Goal:** Enable administrators to extend payment deadlines, edit term schedules, adjust rates, and record reconciliation memos.

#### Tasks:

1. **Server Actions for Terms Management:**
   - In [`src/features/admin/actions.ts`](file:///j:/DevDrive/sdgc/src/features/admin/actions.ts):
     - `updateMembershipTermAction(input: { year, duesCents, opensAt, closesAt, description? })`.
     - `createMembershipTermAction(input: { year, duesCents, opensAt, closesAt, description? })`.
2. **Term Administration UI in `/admin/dues`:**
   - In [`src/features/admin/components/admin-dues.tsx`](file:///j:/DevDrive/sdgc/src/features/admin/components/admin-dues.tsx):
     - Build "Term Schedule & Deadlines" card showing active, past, and upcoming terms.
     - "Edit Term / Extend Deadline" button opening a modal to adjust `closes_at` (extending renewal deadlines), `opens_at`, dues rate, and description.
     - "+ Schedule New Term" button to prepare subsequent years.
3. **Reconciliation Features:**
   - Filter reconciliation table by Term Year.
   - Add search by check number / transaction reference.
   - Store administrative reconciliation notes on payment record.

---

### Phase 6: Image Auto-Optimization & Modular Media Architecture

**Goal:** Implement server-side Sharp image optimization on upload and abstract storage provider integration (supporting Supabase, Cloudflare R2, Cloudinary).

#### Tasks:

1. **Sharp Image Optimization Pipeline:**
   - Install exact dependency: `npm install sharp --save-exact`.
   - Create `src/lib/media/optimizer.ts`:
     - Resize large photos to max 1920px width using Lanczos3 resampling.
     - Convert to WebP at quality 82% (drastically smaller payload while crisp on 4K/Retina displays).
     - Strip GPS and camera metadata for member privacy while preserving sRGB profile.
     - Generate a 400px thumbnail WebP for gallery grids.
     - Return optimized buffer, thumbnail buffer, dimensions, and byte sizes.
2. **Modular Storage Provider Adapter:**
   - Create `src/lib/storage/provider.ts`:
     ```ts
     export interface StorageProvider {
       upload(
         buffer: Buffer,
         path: string,
         mimeType: string,
       ): Promise<{ path: string; url: string }>;
       delete(path: string): Promise<void>;
       getPublicUrl(path: string): string;
     }
     ```
   - Implement `SupabaseStorageProvider` (default Docker/local).
   - Implement `CloudflareR2StorageProvider` (S3-compatible, configured via env vars `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`).
   - Implement `CloudinaryStorageProvider` (configured via env vars `CLOUDINARY_URL`).
   - Create factory `getStorageProvider()` to resolve the active provider based on `STORAGE_PROVIDER` env.
3. **Integrate Optimization into Upload Action:**
   - In `uploadMediaAssetAction`, run uploaded buffer through optimizer before sending both full-res WebP and thumbnail to the storage provider.
   - Record dimensions, optimized file size, and thumbnail path in `media_assets`.

---

### Phase 7: Dynamic Site Settings & Homepage CMS Editor

**Goal:** Move all hardcoded contact info and homepage written copy into database-backed settings manageable from the admin panel.

#### Tasks:

1. **Site Settings Schema & Storage:**
   - Expand `public.site_settings` with key `'site_contact'`:
     ```json
     {
       "name": "Saugatuck Douglas Garden Club",
       "phone": "269-857-4148",
       "email": "info@saugatuckdouglasgardenclub.com",
       "address": "P.O. Box 1011",
       "city": "Douglas",
       "state": "MI",
       "postalCode": "49406",
       "meetingLocation": "Old School House, 130 Center St, Douglas, MI",
       "facebookUrl": "https://www.facebook.com/profile.php?id=100064728277239",
       "instagramUrl": "",
       "taxExemptNotice": "501(c)(3) Nonprofit Organization"
     }
     ```
   - Expand key `'homepage_content'` storing the motto, 4 pillar descriptions, and membership story.
2. **Admin Settings View (`/admin/settings`):**
   - Create `src/app/(admin)/admin/settings/page.tsx` and `src/features/admin/components/admin-settings.tsx`.
   - Forms to update contact details, mailing address, phone, email, and social links.
   - Add "Site Settings" to `AdminShell` navigation.
3. **Structured Homepage CMS Editor:**
   - In `/admin/content`, provide structured editors for the Homepage:
     - Hero Motto & Tagline
     - Four Pillars (Title, Description, Featured Photo, CTA Link)
     - Welcoming Community narrative
4. **Dynamic Rendering in Public Shell:**
   - Update `SiteFooter`, `ContactPage`, `SiteHeader`, and `page.tsx` to read live data via `getSiteSettings()`.

---

### Phase 8: Comprehensive SEO, Structured Data & Full Verification

**Goal:** Implement search engine optimization, JSON-LD schemas, social meta cards, and execute the full test suite.

#### Tasks:

1. **Schema.org Structured Data (JSON-LD):**
   - Organization / NGO schema on homepage: name, founding date (1928), logo, address, contact, social links.
   - Event schema on `/events` and `/events/[slug]`: startDate, endDate, venue/location, description, banner, offers.
   - BreadcrumbList schema on internal pages.
2. **Social Meta Tags:**
   - OpenGraph (`og:title`, `og:description`, `og:image`, `og:type`, `og:url`) on all public pages.
   - Twitter Card (`summary_large_image`).
   - Dynamic sitemap in `src/app/sitemap.ts` including all published pages and events.
3. **Full Quality & Verification Run:**
   - Biome formatting & linting: `npm run check`.
   - Production Next.js build: `npm run build`.
   - Unit & integration tests: `npm test` and `npm run test:integration`.
   - Playwright responsive tests at 768px (iPad Mini), 820px (iPad Air), 1024px, 1280px.
   - Document verification in `docs/verification/phase-10-client-parity-alignment.md`.

---

## 3. Exit Criteria Checklist

- [ ] All pages (public, member, admin) render cleanly without horizontal overflow at 768px and 820px ("Tab Mode").
- [ ] Admin sidebar collapses into mobile/tablet drawer below 1024px.
- [ ] Homepage showcases client's authentic written words, mission motto, and 4 high-res pillar photos.
- [ ] 5 authentic upcoming club events seeded and visible on homepage and calendar.
- [ ] Admins can create new venues inline within the event creation modal.
- [ ] Event descriptions support rich markdown formatting with preview, plus banner image picker.
- [ ] Dues terms allow deadline extensions and detail edits from `/admin/dues`.
- [ ] Modular storage adapter supports Supabase, Cloudflare R2, and Cloudinary.
- [ ] Image uploads are auto-optimized to WebP (<400KB) with thumbnails using Sharp.
- [ ] Phone, email, address, and social links are fully editable via `/admin/settings`.
- [ ] Homepage copy and pillars are fully editable via `/admin/content`.
- [ ] JSON-LD structured data and OpenGraph tags are valid across all routes.
- [ ] `npm run check` passes with 0 errors.
- [ ] `npm run build` succeeds cleanly.
- [ ] Playwright E2E test suite passes 100%.
