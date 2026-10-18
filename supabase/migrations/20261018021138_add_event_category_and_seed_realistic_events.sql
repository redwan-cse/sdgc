-- Migration: add_event_category_and_seed_realistic_events
-- Adds first-class category column to public.events, backfills categories, and seeds realistic future events.

-- 1. Add category column and index
alter table public.events add column if not exists category text;
create index if not exists events_category_idx on public.events(category);

-- 2. Backfill existing events with clean category values
update public.events
set category = 'Garden Walk'
where slug like '%garden-walk%' or excerpt = 'Garden Walk';

update public.events
set category = 'Community Projects'
where (slug like '%civic%' or slug like '%planters%') and category is null;

update public.events
set category = 'Workshops & Presentations'
where (slug like '%swap%' or slug like '%symposium%' or slug like '%workshop%') and category is null;

update public.events
set category = 'Workshops & Presentations'
where category is null;

-- 3. Seed realistic upcoming events for late 2026 and 2027
insert into public.events (
  id, slug, title, excerpt, description, starts_at, ends_at, timezone, all_day, venue_id, status, ticket_url, featured_image, category
) values
  (
    'e5555555-5555-5555-5555-555555555555',
    '2026-holiday-greens-wreath-workshop',
    'Holiday Greens & Wreath Making Workshop',
    'Design and craft festive natural wreaths using locally foraged evergreens, pinecones, and ribbons.',
    'Join fellow club members and neighbors for our hands-on holiday wreath workshop. Wire frames, fresh Michigan balsam, cedar, pine boughs, and decorative accents provided. Bring pruning shears and garden gloves.',
    '2026-11-21 10:00:00-05',
    '2026-11-21 13:00:00-05',
    'America/Detroit',
    false,
    'd2222222-2222-2222-2222-222222222222',
    'published',
    null,
    '/images/brand/sdgc-logo.jpg',
    'Workshops & Presentations'
  ),
  (
    'e6666666-6666-6666-6666-666666666666',
    '2026-annual-holiday-dinner-meeting',
    'Annual Holiday Dinner & General Meeting',
    'Celebrate the gardening season with our year-end member dinner, civic award presentation, and officer elections.',
    'Annual gathering of SDGC members and guests. We celebrate this year''s civic accomplishments, recognize volunteer milestones, elect incoming committee chairs, and enjoy a catered seasonal dinner.',
    '2026-12-10 18:00:00-05',
    '2026-12-10 21:00:00-05',
    'America/Detroit',
    false,
    'd1111111-1111-1111-1111-111111111111',
    'published',
    null,
    '/images/brand/sdgc-logo.jpg',
    'Club Business'
  ),
  (
    'e7777777-7777-7777-7777-777777777777',
    '2027-winter-seed-sowing-seminar',
    'Winter Seed Sowing & Native Stratification',
    'Master the technique of cold outdoor stratification in mini-greenhouses to germinate hardy native perennials.',
    'Learn how to propagate native Michigan wildflowers and grasses from seed during the deep freeze using recycled milk jugs and organic potting medium. Seeds and containers provided for hands-on demonstration.',
    '2027-02-20 10:30:00-05',
    '2027-02-20 12:30:00-05',
    'America/Detroit',
    false,
    'd2222222-2222-2222-2222-222222222222',
    'published',
    null,
    '/images/brand/sdgc-logo.jpg',
    'Workshops & Presentations'
  ),
  (
    'e8888888-8888-8888-8888-888888888888',
    '2027-early-spring-perennial-care',
    'Early Spring Perennial Care & Soil Preparation',
    'Essential soil prep, organic amending, and pruning guidance for early emergence coastal gardens.',
    'Expert tips from Michigan extension educators on waking up coastal garden beds, testing soil pH, protecting emerging spring ephemerals, and non-chemical pest management.',
    '2027-04-17 09:30:00-04',
    '2027-04-17 12:00:00-04',
    'America/Detroit',
    false,
    'd1111111-1111-1111-1111-111111111111',
    'published',
    null,
    '/images/brand/sdgc-logo.jpg',
    'Workshops & Presentations'
  ),
  (
    'e9999999-9999-9999-9999-999999999999',
    '2027-spring-perennial-seedling-swap',
    'Annual Spring Plant & Seedling Swap',
    'Bring healthy perennial divisions, seedlings, and garden supplies to share with fellow community gardeners.',
    'Our beloved community perennial exchange returns! Bring labeled potted perennials, native groundcovers, or vegetable starts. Master Gardeners on hand to answer planting and division questions.',
    '2027-05-15 09:00:00-04',
    '2027-05-15 12:00:00-04',
    'America/Detroit',
    false,
    'd2222222-2222-2222-2222-222222222222',
    'published',
    null,
    '/images/brand/sdgc-logo.jpg',
    'Social & Special Events'
  ),
  (
    'eaa11111-1111-1111-1111-111111111111',
    '2027-civic-planters-workbee',
    'Downtown Saugatuck & Douglas Civic Workbee',
    'Join our community volunteer workbee planting municipal containers throughout Saugatuck and Douglas.',
    'Help beautify our downtown streetscapes for the summer season! Volunteers plant dozens of decorative public planters along Center and Butler Streets. Gloves and planting trowels recommended.',
    '2027-06-05 08:30:00-04',
    '2027-06-05 12:30:00-04',
    'America/Detroit',
    false,
    'd3333333-3333-3333-3333-333333333333',
    'published',
    null,
    '/images/brand/sdgc-logo.jpg',
    'Community Projects'
  ),
  (
    'ebb22222-2222-2222-2222-222222222222',
    '2027-47th-annual-garden-walk',
    '47th Annual Garden Walk: Coastal Sanctuaries',
    'Tour six extraordinary private coastal gardens showcasing native landscapes, pollinator havens, and historic cottage charm.',
    'Our premier annual summer fundraiser invites visitors to explore spectacular private gardens in Saugatuck, Douglas, and Laketown. Ticket sales directly fund public school scholarships and municipal park plantings.',
    '2027-07-10 10:00:00-04',
    '2027-07-10 16:00:00-04',
    'America/Detroit',
    false,
    'd1111111-1111-1111-1111-111111111111',
    'published',
    '/tickets',
    '/images/brand/sdgc-logo.jpg',
    'Garden Walk'
  ),
  (
    'ecc33333-3333-3333-3333-333333333333',
    '2027-native-pollinators-lecture',
    'Native Pollinators & Dune Habitat Lecture',
    'An illustrated lecture on safeguarding Lake Michigan monarch pathways, solitary bees, and sand dune flora.',
    'Guest botanist lecture focusing on shoreline ecology, host plants, and how residential gardeners can establish pesticide-free sanctuary corridors connecting local natural preserves.',
    '2027-08-14 14:00:00-04',
    '2027-08-14 16:00:00-04',
    'America/Detroit',
    false,
    'd2222222-2222-2222-2222-222222222222',
    'published',
    null,
    '/images/brand/sdgc-logo.jpg',
    'Workshops & Presentations'
  )
on conflict (id) do update set
  category = excluded.category,
  title = excluded.title,
  starts_at = excluded.starts_at,
  ends_at = excluded.ends_at,
  status = excluded.status;
