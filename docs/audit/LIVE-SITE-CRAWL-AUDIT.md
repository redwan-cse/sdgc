# Live Site Crawl & Feature Audit: Saugatuck Douglas Garden Club

**Audit Date:** October 16, 2026  
**Target Domain:** `https://saugatuckdouglasgardenclub.com`  
**Crawl Archive Location:** `imports/live-crawl/` (HTML dumps, WP REST API payloads, media manifest)

---

## 1. Executive Summary

A full crawl and REST API dump of the active production website was performed. The live site is an active WordPress installation hosted on Apache, utilizing the **Divi Theme** along with a specialized suite of community and event plugins:

- **Membership & Profiles:** Ultimate Member (`ultimate-member`) + Ultimate Member Stripe Extension (`um-stripe`).
- **Events & Ticketing:** The Events Calendar (`the-events-calendar`) + Event Tickets (`event-tickets`) + Divi Events Calendar Module (`divi-event-calendar-module`).
- **Spam Deterrence:** CleanTalk Spam Protect (`cleantalk-spam-protect`).
- **Design & Layout:** Elegant Themes Divi + Divi Assistant (`divi-assistant`, `divi-image-helper`, `divi-responsive-helper`).

All **22 pages**, **3 active calendar events**, **venues**, **organizers**, and **161 media assets** were successfully indexed and dumped into the local repository.

---

## 2. Complete Page & Functional Inventory

The following table catalogs every public and authenticated route discovered on the live site:

| ID       | URL Path                      | Page Title / Slug                       | Underlying Plugin / System   | Functional Purpose & Key Features                                                                                                    |
| :------- | :---------------------------- | :-------------------------------------- | :--------------------------- | :----------------------------------------------------------------------------------------------------------------------------------- |
| **P-01** | `/`                           | Home (`gardener-5`)                     | Divi Builder                 | Hero banner, mission statement, announcements, upcoming events loop, embedded contact form, Facebook link.                           |
| **P-02** | `/aboutourclub/`              | About Our Club                          | Divi Builder                 | Descriptions of fundraisers, 2 scholarship awards for local high schools, garden recognition awards, beautification projects.        |
| **P-03** | `/garden-walk/`               | Garden Walk                             | Divi Builder                 | Annual Garden Walk promotion, poster, ticket callout, 2024/2025 photo archive, volunteer highlights.                                 |
| **P-04** | `/gallery/`                   | Gallery                                 | Divi Gallery Module          | Photo gallery showcasing local gardens, civic planting, and past garden walks.                                                       |
| **P-05** | `/becomeamember/`             | Become A Member                         | Ultimate Member (`um-78411`) | New member registration form collecting 20 personal, address, and horticultural interest fields.                                     |
| **P-06** | `/membership/`                | Membership Information                  | Divi + Stripe Checkout       | Dues overview ($50/year, Jan 1–Dec 31, non-recurring), payment instructions (Stripe credit card vs. check by mail to P.O. Box 1011). |
| **P-07** | `/events/`                    | Events Calendar (List View)             | The Events Calendar          | Paginated list of upcoming club events, date navigation, search bar.                                                                 |
| **P-08** | `/events/month/`              | Events Calendar (Month Grid)            | The Events Calendar          | Interactive monthly calendar grid with tooltips and date drill-down.                                                                 |
| **P-09** | `/events/day/`                | Events Calendar (Day View)              | The Events Calendar          | Single-day hourly breakdown of scheduled club activities.                                                                            |
| **P-10** | `/events-looped/`             | Events Looped                           | Divi + TEC                   | Custom looped card view of club meetings and social gatherings.                                                                      |
| **P-11** | `/login/`                     | Login                                   | Ultimate Member              | Authentication form accepting Username or E-mail Address, password, "Keep me signed in", password recovery link.                     |
| **P-12** | `/members/`                   | Member Directory (`Restricted content`) | Ultimate Member Directory    | Access-controlled member directory showing active members, photos, contact details, and project roles.                               |
| **P-13** | `/user/`                      | Edit Profile                            | Ultimate Member              | Self-service profile editor, avatar photo uploader, contact updates, membership status badge.                                        |
| **P-14** | `/account/`                   | Account Settings                        | Ultimate Member              | Account email management, password changes, notification preferences.                                                                |
| **P-15** | `/password-reset/`            | Password Reset                          | Ultimate Member              | Email/username submission form to trigger WordPress password reset link.                                                             |
| **P-16** | `/logout/`                    | Logout                                  | Ultimate Member              | Session termination endpoint.                                                                                                        |
| **P-17** | `/tickets-checkout/`          | Tickets Checkout                        | Event Tickets                | Cart and checkout page for event tickets (e.g. Garden Walk admissions). Supports Stripe & PayPal.                                    |
| **P-18** | `/tickets-order/`             | Order Completed                         | Event Tickets                | Confirmation and ticket receipt screen after successful event ticket purchase.                                                       |
| **P-19** | `/checkout/`                  | Payment Checkout                        | UM Stripe Extension          | Hosted credit-card dues checkout processing via Stripe.                                                                              |
| **P-20** | `/stripe/`                    | Stripe Checkout URL                     | UM Stripe Extension          | Direct redirect bridge to Stripe Checkout session.                                                                                   |
| **P-21** | `/customer-portal/`           | Customer Portal                         | Stripe Billing               | Self-service billing portal for managing payment methods and viewing transaction receipts.                                           |
| **P-22** | `/payment-successful/`        | Payment Successful                      | UM Stripe Extension          | Return landing page displaying payment confirmation details.                                                                         |
| **P-23** | `/payment-cancelled/`         | Payment Canceled                        | UM Stripe Extension          | Cancellation notice when a user aborts checkout.                                                                                     |
| **P-24** | `/already-subscribed/`        | Already Subscribed                      | UM Stripe Extension          | Notice displayed if a user attempts to pay for an already active term.                                                               |
| **P-25** | `/subscription-cancellation/` | Subscription Cancellation               | UM Stripe Extension          | Confirmation workflow for cancelling recurring membership terms.                                                                     |

---

## 3. Registration Form Schema (Ultimate Member Parity)

Inspection of the rendered HTML on `/becomeamember/` confirms the exact field schema utilized by the club:

1. `user_login` — Desired Username _(Required)_
2. `first_name` — First Name _(Required)_
3. `last_name` — Last Name _(Required)_
4. `user_email` — Email Address _(Required)_
5. `user_password` — Password _(Required)_
6. `confirm_user_password` — Password Confirmation _(Required)_
7. `address_1` — Street Address
8. `address_2` — Apartment/Suite/Unit
9. `address_city` — City
10. `address_state_dropdown` — State (Dropdown, defaults to MI)
11. `address_zip` — ZIP / Postal Code
12. `phone_number` — Primary / Home Phone
13. `phone_number_cell` — Cell Phone
14. `birth_month` — Birth Month (1–12; year is deliberately omitted for privacy)
15. `birth_day_numeric` — Birth Day (1–31)
16. `spouses_name_text` — Spouse's First Name
17. `master_gardener` — Master Gardener Certification (Yes/No checkbox)
18. `gardening_interests_textarea` — Gardening Interests & Specialties
19. `work_experience_textarea` — Professional / Volunteer Background
20. `club_projects_checkbox` — Eight (8) specific club project volunteer options:
    - _Community Beautification_
    - _6th Grade Workshop_
    - _New Member Reception_
    - _Club Website_
    - _Community Garden Recognition Awards_
    - _Garden Walk Fund Raiser_
    - _Community Charitable Contributions_
    - _Holiday Decoration Workshop_

---

## 4. Dues & Payment Lifecycle Analysis

The WordPress site implements annual dues with the following strict business constraints:

- **Rate:** $50.00 USD per calendar year (January 1 to December 31).
- **Renewal:** Does _not_ automatically charge members on renewal; members manually initiate renewal each season.
- **Payment Options:**
  - **Online Credit Card:** Handled via Stripe (`um-stripe`).
  - **Mail-in Check:** Payable to _Saugatuck Douglas Garden Club_, mailed to _P.O. Box 1011, Douglas, MI 49406_.
- **Manual Verification:** Even after a successful Stripe payment, the bylaws dictate that membership status remains pending until verified by the club treasurer or board.

---

## 5. Events & Ticketing (The Events Calendar)

- **Event Taxonomy:** Monthly Board Meetings, Workshops, Garden Walk.
- **Sample Live Events:**
  - _Board Meeting:_ Monthly board sessions at private residences (e.g. Patti Birkes) or civic halls.
  - _Potluck at Fenn Valley Winery:_ Annual member gathering and wine tasting in Fennville, MI.
  - _Holiday Party:_ Annual end-of-year celebratory dinner.
- **Ticketing:** Integrated via `event-tickets` plugin supporting RSVP and paid admission (tickets checkout/order screens).

---

## 6. Media & Image Asset Inventory

The media dump identified **161 images and documents** in `wp-content/uploads/`.

- High-resolution Garden Walk photographic archives (2024 & 2025).
- Official logos (`SDGC-Logov2-transparent.png`, `SDGC-Logov3-transparent-modified.png`, square icons).
- Historical flyers, event posters, and community workshop banners.
- All 161 media files have been verified and mirrored locally in `public/images/wordpress/` for instant access.
