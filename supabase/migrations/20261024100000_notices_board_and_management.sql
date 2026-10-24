-- Create notices table for club notice board and announcements
create table if not exists public.notices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  content text not null,
  excerpt text,
  category text not null default 'general' check (category in ('general', 'urgent', 'meeting', 'volunteer', 'event', 'beautification')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  is_pinned boolean not null default false,
  is_published boolean not null default true,
  published_at timestamptz not null default now(),
  expires_at timestamptz,
  author_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexing
create index if not exists idx_notices_slug on public.notices(slug);
create index if not exists idx_notices_published on public.notices(is_published, published_at desc);
create index if not exists idx_notices_category on public.notices(category);
create index if not exists idx_notices_pinned on public.notices(is_pinned, published_at desc);

-- Enable Row Level Security
alter table public.notices enable row level security;

-- Drop existing policies if re-running
drop policy if exists "Public can view published active notices" on public.notices;
drop policy if exists "Staff with content capability can view all notices" on public.notices;
drop policy if exists "Staff with content capability can insert notices" on public.notices;
drop policy if exists "Staff with content capability can update notices" on public.notices;
drop policy if exists "Staff with content capability can delete notices" on public.notices;

create policy "Public can view published active notices"
  on public.notices
  for select
  using (
    is_published = true 
    and (expires_at is null or expires_at > now())
  );

create policy "Staff with content capability can view all notices"
  on public.notices
  for select
  using (
    public.has_capability('content.manage')
    or public.has_capability('content.publish')
    or public.has_role('admin')
    or public.has_role('editor')
  );

create policy "Staff with content capability can insert notices"
  on public.notices
  for insert
  with check (
    public.has_capability('content.publish')
    or public.has_role('admin')
    or public.has_role('editor')
  );

create policy "Staff with content capability can update notices"
  on public.notices
  for update
  using (
    public.has_capability('content.publish')
    or public.has_role('admin')
    or public.has_role('editor')
  );

create policy "Staff with content capability can delete notices"
  on public.notices
  for delete
  using (
    public.has_capability('content.publish')
    or public.has_role('admin')
    or public.has_role('editor')
  );

-- Seed Authentic Club Notices
insert into public.notices (id, title, slug, content, excerpt, category, priority, is_pinned, is_published, published_at)
values
  (
    'a1000000-0000-0000-0000-000000000001',
    'Frost Warning & Autumn Perennial Care Guide for Lakeshore Gardens',
    'frost-warning-autumn-perennial-care-guide',
    'With overnight temperatures projected to dip near 28°F across Allegan County and the Kalamazoo River valley this coming weekend, the SDGC Horticulture Committee advises members and local gardeners to protect tender specimens and prepare perennial borders for the winter dormant season.

### Recommended Steps:
1. **Container Plants & Tropicals**: Move potted geraniums, coleus, citrus, and succulents indoors immediately into bright, indirect sun.
2. **Mulching Root Zones**: Apply 2 to 3 inches of shredded hardwood or pine straw mulch around newly planted perennials, shrubs, and roses once the ground begins to freeze. Avoid piling mulch directly against woody stems.
3. **Hydration Before Freezes**: Water deeply before the first hard freeze. Moist soil retains heat significantly longer than desiccated soil, buffering sensitive root systems against freezing injury.
4. **Leave Seed Heads for Wildlife**: Resist shearing down coneflowers (Echinacea), black-eyed Susans (Rudbeckia), and ornamental grasses; their seed heads supply essential forage for overwintering goldfinches, chickadees, and native pollinators.

For questions, feel free to speak with a Master Gardener member at our upcoming general membership meeting.',
    'Urgent freeze notice for Allegan County: protect tender container specimens, deeply water root zones, and mulch newly planted perennials ahead of forecasted sub-freezing weekend temperatures.',
    'urgent',
    'high',
    true,
    true,
    now()
  ),
  (
    'a1000000-0000-0000-0000-000000000002',
    '2027 Annual Garden Walk: Host Gardens & Committee Volunteers Call',
    '2027-annual-garden-walk-host-gardens-volunteer-call',
    'Planning is underway for the **47th Annual Saugatuck-Douglas Garden Walk Fundraiser** scheduled for Saturday, July 10, 2027!

The Garden Walk Committee is actively seeking nominations for private gardens in Saugatuck, Douglas, and surrounding township areas to be featured on this beloved community tour. We welcome gardens of all scales and aesthetics—from lush shaded cottage retreats and lakeside hydrangea sanctuaries to certified native pollinator habitats and artistic vegetable landscapes.

### Volunteer Opportunities Open:
- **Garden Docents & Hosts**: 2-hour shifts greeting visitors, validating tickets, and answering tour questions.
- **Advance Ticket Ambassadors**: Assisting with local business retail flyer and brochure distribution.
- **Refreshments & Hospitality**: Providing baked goods and iced water stations for tour participants.
- **Plant Sale Coordinators**: Assisting with labeling, display, and checkout for our member-grown perennial plant sale at the Old School House.

To recommend a garden or volunteer for a committee shift, please contact our Garden Walk Chairs via the [Contact Page](/contact) or sign up directly with the committee.',
    'Nominations are now open for featured private tour gardens and volunteers for the 47th Annual Saugatuck-Douglas Garden Walk.',
    'volunteer',
    'normal',
    true,
    true,
    now() - interval '2 days'
  ),
  (
    'a1000000-0000-0000-0000-000000000003',
    'Next Monthly Club Meeting: Guest Presentation on Native Michigan Pollinators',
    'monthly-meeting-native-michigan-pollinators',
    'Please join us for our monthly general membership gathering and educational speaker program!

- **Date & Time**: Third Monday of the month at 6:30 PM (Social gathering & refreshments at 6:00 PM)
- **Location**: Old School House Discovery Center, 130 Center Street, Douglas, MI
- **Guest Speaker**: Dr. Clara H. Lindeman, Michigan State University Extension Horticulturist
- **Program Topic**: *"Creating Resilient Coastal Pollinator Habitats: Beyond Honeybees and Butterfly Bush"*

All club members, aspiring gardeners, and community guests are warmly invited to attend. Light botanical teas, coffee, and homemade treats will be provided by the Hospitality Committee. If you require special accommodations or carpooling, please let us know.',
    'Join us at the Old School House in Douglas for our upcoming general meeting featuring Dr. Clara Lindeman on resilient native pollinator habitats.',
    'meeting',
    'normal',
    false,
    true,
    now() - interval '4 days'
  ),
  (
    'a1000000-0000-0000-0000-000000000004',
    'Downtown Planters & Seasonal Urns: Fall Transition Complete',
    'downtown-planters-seasonal-urns-fall-transition-complete',
    'The Civic Beautification Committee is delighted to announce that all 32 public decorative urns and community street planters throughout downtown Saugatuck and Douglas have been transitioned into vibrant autumnal displays!

This year\'s arrangements feature deep purple and copper heirloom kales, trailing English ivy, goldenrod accents, ornamental peppers, and dwarf winterberries donated by local nurseries and funded through our Annual Garden Walk proceeds.

A heartfelt thank you to the twelve volunteer members who dedicated Saturday morning to weeding, soil conditioning, and planting!',
    'Civic Beautification team has completed fall planting for all 32 community planters and urns throughout downtown Saugatuck and Douglas.',
    'beautification',
    'normal',
    false,
    true,
    now() - interval '6 days'
  ),
  (
    'a1000000-0000-0000-0000-000000000005',
    '2027 Youth Horticulture Scholarship Applications Open',
    '2027-youth-horticulture-scholarship-applications-open',
    'The Saugatuck Douglas Garden Club is proud to offer two annual $1,500 academic scholarships to graduating high school seniors and enrolled college students residing in the Saugatuck Public School District or surrounding Allegan County communities pursuing studies in:

- Horticulture & Floriculture
- Landscape Architecture & Design
- Forestry, Botany, & Environmental Sciences
- Sustainable Agriculture & Soil Science

Applications and guidelines are available in our document library and can also be requested through the high school counseling office. Application deadline is April 15, 2027.',
    'Applications are now open for two annual $1,500 collegiate scholarships awarded to local students pursuing careers in horticultural and environmental sciences.',
    'general',
    'normal',
    false,
    true,
    now() - interval '10 days'
  )
on conflict (slug) do update set
  title = excluded.title,
  content = excluded.content,
  excerpt = excluded.excerpt,
  category = excluded.category,
  priority = excluded.priority,
  is_pinned = excluded.is_pinned,
  is_published = excluded.is_published,
  published_at = excluded.published_at;


-- Table Grants
GRANT SELECT ON TABLE public.notices TO anon;
GRANT ALL ON TABLE public.notices TO authenticated;
GRANT ALL ON TABLE public.notices TO service_role;
