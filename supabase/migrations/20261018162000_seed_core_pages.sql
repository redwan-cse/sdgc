-- Migration: seed_core_pages
-- Ensures about and garden-walk page rows exist with canonical copy.

INSERT INTO public.pages (slug, title, content, status, published_at, meta_description)
VALUES
(
  'about',
  'About Saugatuck Douglas Garden Club',
  'Organized in 1928, the Saugatuck Douglas Garden Club works continuously to beautify and enhance the communities of Saugatuck and Douglas through floral landscaping, educational workshops, environmental conservation, and civic partnership. For nearly a century, our members have planted downtown civic containers, tended public library gardens, awarded educational scholarships to local graduating high school seniors, and hosted our premier annual Garden Walk fundraiser.',
  'published',
  now(),
  'Learn about our history since 1928, civic landscaping, youth outreach, and annual Garden Walk.'
),
(
  'garden-walk',
  'Annual Garden Walk',
  'The Garden Walk is the club''s premier annual fundraising tour. For over four decades, local residents open their private landscapes to the public, sharing horticultural inspiration, native shade sanctuaries, and coastal cottage borders. Self-guided walking and driving routes begin at the Old School House in Douglas, featuring docent-guided garden features and local plant sales.',
  'published',
  now(),
  'Tour private coastal gardens in Saugatuck and Douglas. Proceeds support local high school scholarships and civic beautification.'
)
ON CONFLICT (slug) DO UPDATE SET
  title = excluded.title,
  content = excluded.content,
  meta_description = excluded.meta_description,
  status = excluded.status,
  updated_at = now();
