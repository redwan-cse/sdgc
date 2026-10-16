-- Migration: identity_and_membership
-- Defines project interests, member profiles, profile interest selections, annual terms, and memberships.

-- Authentic eight legacy civic project interests
create table public.project_interests (
  code text primary key,
  label text not null,
  description text,
  sort_order integer not null default 0
);

insert into public.project_interests (code, label, sort_order) values
  ('beautification', 'Community Beautification', 1),
  ('grade6', '6th Grade Workshop', 2),
  ('reception', 'New Member Reception', 3),
  ('website', 'Club Website', 4),
  ('garden_awards', 'Community Garden Recognition Awards', 5),
  ('garden_walk', 'Garden Walk Fund Raiser', 6),
  ('charitable', 'Community Charitable Contributions', 7),
  ('holiday', 'Holiday Decoration Workshop', 8);

-- Member profiles tied to auth.users
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  first_name text not null,
  last_name text not null,
  phone text,
  secondary_phone text,
  address_line1 text,
  address_line2 text,
  city text default 'Saugatuck',
  state text default 'MI',
  postal_code text default '49453',
  birth_month integer check (birth_month between 1 and 12),
  birth_day integer check (birth_day between 1 and 31),
  spouse_name text,
  is_master_gardener boolean not null default false,
  interests_experience text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint valid_birthday check (
    (birth_month is null and birth_day is null) or (
      birth_month is not null and birth_day is not null and (
        (birth_month in (1, 3, 5, 7, 8, 10, 12) and birth_day <= 31) or
        (birth_month in (4, 6, 9, 11) and birth_day <= 30) or
        (birth_month = 2 and birth_day <= 29)
      )
    )
  )
);

create index profiles_username_idx on public.profiles(username);
create index profiles_last_name_idx on public.profiles(last_name, first_name);

-- Join table for member project selections
create table public.profile_interests (
  user_id uuid not null references public.profiles(id) on delete cascade,
  project_code text not null references public.project_interests(code) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, project_code)
);

-- Annual membership terms (calendar year)
create table public.membership_terms (
  id uuid primary key default gen_random_uuid(),
  year integer unique not null check (year >= 2020),
  dues_cents integer not null check (dues_cents >= 0),
  currency text not null default 'USD',
  opens_at timestamptz not null,
  closes_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint valid_term_dates check (closes_at > opens_at)
);

create index membership_terms_year_idx on public.membership_terms(year);

-- Membership applications and approval state
create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  term_id uuid not null references public.membership_terms(id) on delete restrict,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'expired', 'suspended')),
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, term_id)
);

create index memberships_user_term_idx on public.memberships(user_id, term_id);
create index memberships_status_idx on public.memberships(status);
