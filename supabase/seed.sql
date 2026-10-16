-- Synthetic deterministic seed data for local SDGC development and testing.
-- No real club members or live credentials are used.

-- Site settings
insert into public.site_settings (key, value, description) values
  ('club_info', '{"name": "Saugatuck Douglas Garden Club", "email": "info@saugatuckdouglasgardenclub.com", "phone": "269-857-4148", "address": "P.O. Box 725, Saugatuck, MI 49453"}'::jsonb, 'General club contact details'),
  ('membership_config', '{"dues_cents": 5000, "current_year": 2026, "currency": "USD"}'::jsonb, 'Active annual dues configuration')
on conflict (key) do update set value = excluded.value;

-- Membership terms (2025 past, 2026 current, 2027 future)
insert into public.membership_terms (year, dues_cents, currency, opens_at, closes_at) values
  (2025, 5000, 'USD', '2025-01-01 00:00:00-05', '2025-12-31 23:59:59-05'),
  (2026, 5000, 'USD', '2026-01-01 00:00:00-05', '2026-12-31 23:59:59-05'),
  (2027, 5000, 'USD', '2027-01-01 00:00:00-05', '2027-12-31 23:59:59-05')
on conflict (year) do update set dues_cents = excluded.dues_cents;

-- Venues
insert into public.venues (id, name, address, city, state, postal_code, url) values
  ('d1111111-1111-1111-1111-111111111111', 'Saugatuck Woman''s Club', '303 Butler St', 'Saugatuck', 'MI', '49453', 'https://saugatuck.com/'),
  ('d2222222-2222-2222-2222-222222222222', 'Old School House Douglas', '130 Center St', 'Douglas', 'MI', '49406', 'https://sdhistoricalsociety.org/'),
  ('d3333333-3333-3333-3333-333333333333', 'Wick''s Park Gazebo', '449 Water St', 'Saugatuck', 'MI', '49453', null)
on conflict (id) do nothing;

-- Events
insert into public.events (id, slug, title, excerpt, description, starts_at, ends_at, timezone, all_day, venue_id, status, ticket_url, featured_image) values
  (
    'e1111111-1111-1111-1111-111111111111',
    '2026-garden-walk-fundraiser',
    '46th Annual Garden Walk Fundraiser',
    'Tour private, architect-designed coastal gardens in Saugatuck and Douglas. Proceeds support community beautification.',
    'Join us for our signature annual fundraiser. Experience diverse landscapes, native pollinators, and water conservation practices across five private coastal gardens. Self-guided walking and driving tour with local docents.',
    '2026-07-11 10:00:00-04',
    '2026-07-11 16:00:00-04',
    'America/Detroit',
    false,
    'd1111111-1111-1111-1111-111111111111',
    'published',
    'https://saugatuck-douglas-garden-club.ticketleap.com/46th-annual-garden-walk/',
    '/images/brand/sdgc-logo.jpg'
  ),
  (
    'e2222222-2222-2222-2222-222222222222',
    'spring-perennial-seedling-swap',
    'Spring Perennial & Seedling Swap',
    'Bring divisions, heirloom seedlings, and garden supplies to swap with fellow community gardeners.',
    'Annual member and community exchange of divided hardy perennials, organic vegetable seedlings, and gardening tools. Master Gardeners will be on site answering plant health and soil preparation questions.',
    '2026-05-16 09:30:00-04',
    '2026-05-16 12:30:00-04',
    'America/Detroit',
    false,
    'd2222222-2222-2222-2222-222222222222',
    'published',
    null,
    '/images/brand/sdgc-logo.jpg'
  ),
  (
    'e3333333-3333-3333-3333-333333333333',
    'community-planters-civic-beautification',
    'Civic Planters Summer Planting Day',
    'Annual planting day for Downtown Saugatuck and Douglas municipal flower containers.',
    'Volunteers unite to prepare, plant, and mulch decorative planters along Butler and Center Streets. Tools, soil, and nursery annuals provided by the club.',
    '2026-06-06 08:30:00-04',
    '2026-06-06 13:00:00-04',
    'America/Detroit',
    false,
    'd3333333-3333-3333-3333-333333333333',
    'published',
    null,
    '/images/brand/sdgc-logo.jpg'
  ),
  (
    'e4444444-4444-4444-4444-444444444444',
    'draft-fall-native-plant-symposium',
    'Draft: Fall Native Plant Symposium',
    'Preview of our upcoming autumn symposium on Great Lakes coastal dune preservation.',
    'Internal draft event for committee review and scheduling.',
    '2026-09-19 13:00:00-04',
    '2026-09-19 16:30:00-04',
    'America/Detroit',
    false,
    'd1111111-1111-1111-1111-111111111111',
    'draft',
    null,
    null
  )
on conflict (id) do nothing;

-- Pages
insert into public.pages (slug, title, content, status, published_at, meta_description) values
  (
    'aboutourclub',
    'About Saugatuck Douglas Garden Club',
    'Organized in 1978, the Saugatuck Douglas Garden Club works continuously to beautify and enhance the communities of Saugatuck and Douglas through floral landscaping, educational workshops, environmental conservation, and civic partnership.',
    'published',
    '2026-01-01 00:00:00-05',
    'Learn about our history, community projects, monthly meetings, and civic leadership.'
  ),
  (
    'garden-walk',
    'Annual Garden Walk',
    'The Garden Walk is the club''s premier annual fundraising event. For over four decades, local gardeners open their private landscapes to the public, sharing ideas and inspiration.',
    'published',
    '2026-01-01 00:00:00-05',
    'Details, tour schedules, and ticket links for the Saugatuck Douglas Annual Garden Walk.'
  )
on conflict (slug) do nothing;

-- Media Assets & Albums
insert into public.media_assets (id, storage_path, mime_type, size_bytes, width, height, alt_text, caption, is_public) values
  ('c1111111-1111-1111-1111-111111111111', 'public/sdgc-logo.jpg', 'image/jpeg', 48200, 800, 800, 'Saugatuck Douglas Garden Club official logo', 'Official club insignia since 1978', true),
  ('c2222222-2222-2222-2222-222222222222', 'public/garden-walk-2025-1.jpg', 'image/jpeg', 125000, 1200, 800, 'Cottage garden with perennial border in Douglas', 'Perennial border in historic Douglas cottage', true),
  ('c3333333-3333-3333-3333-333333333333', 'public/civic-beautification-1.jpg', 'image/jpeg', 98000, 1200, 800, 'Volunteers planting downtown civic containers', 'Civic beautification team on Butler Street', true),
  ('c4444444-4444-4444-4444-444444444444', 'private/board-minutes-2026.pdf', 'application/pdf', 245000, null, null, 'Private Board Minutes 2026', 'Restricted to board members', false)
on conflict (id) do nothing;

insert into public.albums (id, slug, title, description, year, is_public) values
  ('a1111111-1111-1111-1111-111111111111', 'garden-walk-highlights', 'Garden Walk Highlights', 'Select photos from recent Saugatuck Douglas Garden Walks.', 2025, true),
  ('a2222222-2222-2222-2222-222222222222', 'civic-beautification', 'Civic Beautification Projects', 'Community planting and municipal flower installations.', 2025, true)
on conflict (id) do nothing;

insert into public.album_items (album_id, media_asset_id, sort_order) values
  ('a1111111-1111-1111-1111-111111111111', 'c2222222-2222-2222-2222-222222222222', 1),
  ('a2222222-2222-2222-2222-222222222222', 'c3333333-3333-3333-3333-333333333333', 1)
on conflict (album_id, media_asset_id) do nothing;

-- Legacy URL mappings from P0 discovery
insert into public.legacy_mappings (legacy_id, legacy_url, target_url, entity_type) values
  ('wp-home', '/', '/', 'page'),
  ('wp-about', '/aboutourclub/', '/aboutourclub', 'page'),
  ('wp-garden-walk', '/garden-walk/', '/garden-walk', 'page'),
  ('wp-gallery', '/gallery/', '/gallery', 'page'),
  ('wp-events', '/events/', '/events', 'events'),
  ('wp-contact', '/contact/', '/contact', 'contact'),
  ('wp-membership', '/membership/', '/membership', 'page'),
  ('wp-becomeamember', '/becomeamember/', '/becomeamember', 'auth'),
  ('wp-login', '/login/', '/login', 'auth'),
  ('wp-profile', '/profile/', '/profile', 'member'),
  ('wp-admin', '/admin/', '/admin', 'admin')
on conflict (legacy_url) do nothing;
