-- Migration: content_truth_and_garden_walk_parity
-- Corrects historical founding date to 1928, updates logo captions, and synchronizes page copy.

-- 1. Correct history in public.pages
update public.pages
set
  title = 'About Saugatuck Douglas Garden Club',
  content = 'Organized in 1928, the Saugatuck Douglas Garden Club works continuously to beautify and enhance the communities of Saugatuck and Douglas through floral landscaping, educational workshops, environmental conservation, and civic partnership. For nearly a century, our members have planted downtown civic containers, tended public library gardens, awarded educational scholarships to local graduating high school seniors, and hosted our premier annual Garden Walk fundraiser.',
  meta_description = 'Learn about our history since 1928, civic landscaping, youth outreach, and annual Garden Walk.',
  updated_at = now()
where slug in ('about', 'aboutourclub');

-- 2. Update garden-walk page copy in public.pages
update public.pages
set
  title = 'Annual Garden Walk',
  content = 'The Garden Walk is the club''s premier annual fundraising tour. For over four decades, local residents open their private landscapes to the public, sharing horticultural inspiration, native shade sanctuaries, and coastal cottage borders. Self-guided walking and driving routes begin at the Old School House in Douglas, featuring docent-guided garden features and local plant sales.',
  meta_description = 'Tour private coastal gardens in Saugatuck and Douglas. Proceeds support local high school scholarships and civic beautification.',
  updated_at = now()
where slug = 'garden-walk';

-- 3. Ensure home page record exists in public.pages
insert into public.pages (slug, title, content, status, published_at, meta_description)
values (
  'home',
  'Saugatuck Douglas Garden Club',
  'For nearly a century since 1928, the Saugatuck Douglas Garden Club has planned, planted, and maintained vibrant public floral displays throughout Saugatuck and Douglas, Michigan. Civic landscaping, coastal habitat protection, and scholarship programs remain at the heart of our mission.',
  'published',
  now(),
  'Cultivating civic landscaping, horticultural education, and lakeshore community spirit across Saugatuck and Douglas since 1928.'
)
on conflict (slug) do update set
  title = excluded.title,
  content = excluded.content,
  meta_description = excluded.meta_description,
  updated_at = now();

-- 4. Correct media asset caption to 1928
update public.media_assets
set
  alt_text = 'Saugatuck Douglas Garden Club official logo',
  caption = 'Official club insignia since 1928',
  updated_at = now()
where storage_path = 'public/sdgc-logo.jpg';

-- 5. Set ticket_url for 2027 Garden Walk event
update public.events
set ticket_url = '/tickets-checkout'
where slug = '2027-47th-annual-garden-walk';
