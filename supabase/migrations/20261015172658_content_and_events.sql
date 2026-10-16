-- Migration: content_and_events
-- Defines public content, civic pages, venues, calendar events, media records, and legacy mapping tables.

create extension if not exists "pgcrypto";

-- Venues
create table public.venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  city text default 'Saugatuck',
  state text default 'MI',
  postal_code text default '49453',
  url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Events
create table public.events (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  excerpt text,
  description text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  timezone text not null default 'America/Detroit',
  all_day boolean not null default false,
  venue_id uuid references public.venues(id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'published', 'cancelled')),
  ticket_url text,
  featured_image text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_valid_range check (ends_at >= starts_at)
);

create index events_starts_at_idx on public.events(starts_at);
create index events_status_idx on public.events(status);
create index events_slug_idx on public.events(slug);

-- Pages (Civic content & announcements)
create table public.pages (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  content text not null,
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  meta_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index pages_slug_idx on public.pages(slug);
create index pages_status_idx on public.pages(status);

-- Site settings (key-value configuration)
create table public.site_settings (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value jsonb not null default '{}'::jsonb,
  description text,
  updated_at timestamptz not null default now()
);

-- Media Assets
create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null unique,
  mime_type text not null,
  size_bytes bigint not null,
  width integer,
  height integer,
  alt_text text not null default '',
  caption text,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Albums
create table public.albums (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text,
  year integer,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Album items (Join between albums and media)
create table public.album_items (
  album_id uuid not null references public.albums(id) on delete cascade,
  media_asset_id uuid not null references public.media_assets(id) on delete cascade,
  sort_order integer not null default 0,
  primary key (album_id, media_asset_id)
);

create index album_items_sort_idx on public.album_items(album_id, sort_order);

-- Legacy URL & ID mappings for SEO redirect continuity
create table public.legacy_mappings (
  id uuid primary key default gen_random_uuid(),
  legacy_id text,
  legacy_url text not null unique,
  target_url text not null,
  entity_type text not null,
  created_at timestamptz not null default now()
);

create index legacy_mappings_url_idx on public.legacy_mappings(legacy_url);
