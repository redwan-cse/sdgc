-- Migration: contact_inquiries_enhancements
-- Adds sender_type, category, subject, and attachment_url to public.contact_messages for richer inquiries.

alter table public.contact_messages
  add column if not exists sender_type text,
  add column if not exists category text,
  add column if not exists subject text,
  add column if not exists attachment_url text;

-- Add index on category for fast admin filtering
create index if not exists contact_messages_category_idx on public.contact_messages(category);
create index if not exists contact_messages_sender_type_idx on public.contact_messages(sender_type);
