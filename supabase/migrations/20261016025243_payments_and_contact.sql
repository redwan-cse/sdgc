-- Migration: payments_and_contact
-- Defines dues payments, payment reconciliation, and contact submissions inbox.

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  membership_id uuid not null references public.memberships(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  term_id uuid not null references public.membership_terms(id) on delete restrict,
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'USD',
  payment_method text not null check (payment_method in ('credit_card', 'check', 'cash')),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'failed', 'refunded')),
  provider text not null default 'manual',
  provider_transaction_id text,
  provider_event_id text unique,
  reconciled_by uuid references auth.users(id) on delete set null,
  reconciled_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index payments_membership_idx on public.payments(membership_id);
create index payments_user_idx on public.payments(user_id);
create index payments_status_idx on public.payments(status);
create index payments_provider_event_idx on public.payments(provider_event_id);

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  message text not null,
  status text not null default 'unread' check (status in ('unread', 'read', 'archived')),
  triaged_by uuid references auth.users(id) on delete set null,
  triaged_at timestamptz,
  created_at timestamptz not null default now()
);

create index contact_messages_status_idx on public.contact_messages(status);
create index contact_messages_created_at_idx on public.contact_messages(created_at desc);
