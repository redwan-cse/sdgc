# WordPress to Supabase Field Mapping Specification

This document details the exact schema transformations between legacy WordPress data structures (from WXR XML, WP REST API, or SQL exports) and the destination Supabase PostgreSQL tables.

---

## 1. Civic Pages & Announcements (`wp_posts` -> `public.pages`)

| WordPress Field                 | Supabase Target Column      | Type          | Transformation & Validation Rules                                                                                                                        |
| :------------------------------ | :-------------------------- | :------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `post_name`                     | `pages.slug`                | `text`        | Cleaned lowercase alphanumeric slug with hyphens. Unique constraint.                                                                                     |
| `post_title`                    | `pages.title`               | `text`        | Plain text title. Escaped entities unescaped.                                                                                                            |
| `post_content`                  | `pages.content`             | `text`        | **Sanitized HTML**. All `<script>`, `<iframe>`, `<object>`, `<embed>`, inline event handlers (`onload`, `onerror`), and `javascript:` URIs are stripped. |
| `post_status`                   | `pages.status`              | `text`        | Mapped: `'publish'` -> `'published'`, all other statuses -> `'draft'`.                                                                                   |
| `post_date_gmt` / `post_date`   | `pages.published_at`        | `timestamptz` | Converted to ISO-8601 with timezone awareness (`America/Detroit`).                                                                                       |
| `post_excerpt` / Yoast SEO desc | `pages.meta_description`    | `text`        | Trimmed text summary up to 160 characters.                                                                                                               |
| `ID`                            | `legacy_mappings.legacy_id` | `text`        | Recorded in `public.legacy_mappings` for traceability and redirect auditing.                                                                             |

---

## 2. Venues (`wp_posts` [tribe_venue] -> `public.venues`)

| WordPress Field | Supabase Target Column | Type   | Transformation & Validation Rules           |
| :-------------- | :--------------------- | :----- | :------------------------------------------ |
| `post_title`    | `venues.name`          | `text` | Venue facility or business name.            |
| `_VenueAddress` | `venues.address`       | `text` | Street address.                             |
| `_VenueCity`    | `venues.city`          | `text` | Default `'Saugatuck'` if null.              |
| `_VenueState`   | `venues.state`         | `text` | Default `'MI'`.                             |
| `_VenueZip`     | `venues.postal_code`   | `text` | 5-digit US postal code (default `'49453'`). |
| `_VenueURL`     | `venues.url`           | `text` | Validated HTTP/HTTPS web address.           |

---

## 3. Events (`wp_posts` [tribe_events] -> `public.events`)

| WordPress Field           | Supabase Target Column  | Type          | Transformation & Validation Rules                                         |
| :------------------------ | :---------------------- | :------------ | :------------------------------------------------------------------------ |
| `post_name`               | `events.slug`           | `text`        | Unique event URL slug.                                                    |
| `post_title`              | `events.title`          | `text`        | Event headline.                                                           |
| `post_excerpt`            | `events.excerpt`        | `text`        | Plain text summary.                                                       |
| `post_content`            | `events.description`    | `text`        | Sanitized description markup.                                             |
| `_EventStartDate`         | `events.starts_at`      | `timestamptz` | Interpreted in `America/Detroit` timezone.                                |
| `_EventEndDate`           | `events.ends_at`        | `timestamptz` | Verified `ends_at >= starts_at`.                                          |
| `_EventTimezone`          | `events.timezone`       | `text`        | Fixed to `'America/Detroit'`.                                             |
| `_EventAllDay`            | `events.all_day`        | `boolean`     | `'yes'` or `1` -> `true`, else `false`.                                   |
| `_EventVenueID`           | `events.venue_id`       | `uuid`        | Foreign key resolved via venue mapping.                                   |
| `post_status`             | `events.status`         | `text`        | `'publish'` -> `'published'`, `'trash'` -> `'cancelled'`, else `'draft'`. |
| `_EventURL` / Ticket link | `events.ticket_url`     | `text`        | Valid external checkout or registration URL.                              |
| `_thumbnail_id`           | `events.featured_image` | `text`        | Relative storage path to asset in Supabase storage.                       |

---

## 4. Media Assets (`wp_posts` [attachment] -> `public.media_assets`)

| WordPress Field            | Supabase Target Column      | Type      | Transformation & Validation Rules                                 |
| :------------------------- | :-------------------------- | :-------- | :---------------------------------------------------------------- |
| `guid` / file path         | `media_assets.storage_path` | `text`    | Normalized relative storage path (e.g. `gallery/imagename.jpg`).  |
| `post_mime_type`           | `media_assets.mime_type`    | `text`    | Valid image MIME types (`image/jpeg`, `image/png`, `image/webp`). |
| `filesize`                 | `media_assets.size_bytes`   | `bigint`  | Byte size of asset. Missing files flagged in report.              |
| `width`                    | `media_assets.width`        | `integer` | Pixel width.                                                      |
| `height`                   | `media_assets.height`       | `integer` | Pixel height.                                                     |
| `_wp_attachment_image_alt` | `media_assets.alt_text`     | `text`    | Descriptive alternative text for accessibility.                   |
| `post_excerpt`             | `media_assets.caption`      | `text`    | Optional caption.                                                 |

---

## 5. Member Profiles & Identity (`wp_users` + `wp_usermeta` -> `auth.users` & `public.profiles`)

| WordPress Field        | Target Location & Column              | Security & Business Rules                                                                                                                                                     |
| :--------------------- | :------------------------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `user_login`           | `public.profiles.username`            | Alphanumeric username. Preserved for username-or-email login.                                                                                                                 |
| `user_email`           | `auth.users.email`                    | Normalized lowercase email address.                                                                                                                                           |
| `user_pass` (`$P$...`) | **REJECTED / NOT IMPORTED**           | WordPress phpass hashes are cryptographically incompatible with Supabase bcrypt/scrypt. Account is created with `must_reset_password: true` and an invitation/recovery token. |
| `first_name`           | `public.profiles.first_name`          | First name.                                                                                                                                                                   |
| `last_name`            | `public.profiles.last_name`           | Last name.                                                                                                                                                                    |
| `phone`                | `public.profiles.phone`               | Contact phone number.                                                                                                                                                         |
| `secondary_phone`      | `public.profiles.secondary_phone`     | Optional alternate phone.                                                                                                                                                     |
| `address_1`            | `public.profiles.address_line1`       | Primary street address. Optional.                                                                                                                                             |
| `address_2`            | `public.profiles.address_line2`       | Suite, unit, or apartment number. Optional.                                                                                                                                   |
| `city`                 | `public.profiles.city`                | City (default `'Saugatuck'`).                                                                                                                                                 |
| `state`                | `public.profiles.state`               | State code (default `'MI'`).                                                                                                                                                  |
| `postcode`             | `public.profiles.postal_code`         | Postal code (default `'49453'`).                                                                                                                                              |
| `birth_month` / `day`  | `public.profiles.birth_month` / `day` | Validated month (1-12) and day (1-31). No birth year is recorded.                                                                                                             |
| `spouse_name`          | `public.profiles.spouse_name`         | Optional spouse/partner name.                                                                                                                                                 |
| `is_master_gardener`   | `public.profiles.is_master_gardener`  | Boolean flag.                                                                                                                                                                 |
| `interests`            | `public.profile_interests`            | Mapped to the eight canonical civic project codes (`beautification`, `grade6`, `reception`, `website`, `garden_awards`, `garden_walk`, `charitable`, `holiday`).              |

---

## 6. Memberships & Dues History (`custom_membership` -> `public.memberships`)

| WordPress Data    | Supabase Target Column  | Business Logic                                                                               |
| :---------------- | :---------------------- | :------------------------------------------------------------------------------------------- |
| `membership_year` | `membership_terms.year` | Term resolved (e.g. 2026). Dues rate fixed at $50.00 USD (5000 cents).                       |
| `payment_status`  | `memberships.status`    | Separate from approval. Confirmed payment defaults to `pending` until manual board approval. |
| `notes`           | `memberships.notes`     | Audit trail of payment confirmation and manual verification.                                 |
