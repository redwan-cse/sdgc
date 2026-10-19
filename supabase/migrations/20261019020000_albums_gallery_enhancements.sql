-- Migration: 20261019020000_albums_gallery_enhancements.sql
-- Upgrade albums with category and cover asset support

ALTER TABLE albums ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'Garden Walk';
ALTER TABLE albums ADD COLUMN IF NOT EXISTS cover_asset_id uuid REFERENCES media_assets(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_albums_category ON albums(category);
CREATE INDEX IF NOT EXISTS idx_albums_year ON albums(year DESC);

-- Update existing albums with authentic categories
UPDATE albums SET category = 'Garden Walk' WHERE slug = 'garden-walk-highlights';
UPDATE albums SET category = 'Civic Beautification' WHERE slug = 'civic-beautification';

-- Seed media assets for rich gallery display
INSERT INTO media_assets (id, storage_path, mime_type, size_bytes, width, height, alt_text, caption, is_public)
VALUES
  ('b0000001-0000-0000-0000-000000000001', '/images/gallery/garden-walk/2O8A8017-scaled.jpeg', 'image/jpeg', 245000, 1600, 1067, 'Vibrant perennial border at Saugatuck cottage garden', 'Sunlit cottage perennial border featuring coneflowers, hostas, and lavender.', true),
  ('b0000001-0000-0000-0000-000000000002', '/images/gallery/garden-walk/2O8A8020-scaled.jpeg', 'image/jpeg', 260000, 1600, 1067, 'Stone garden pathway through blooming hydrangeas', 'Historic fieldstone walkway framed by Annabelle hydrangeas in full summer bloom.', true),
  ('b0000001-0000-0000-0000-000000000003', '/images/gallery/garden-walk/2O8A8025-scaled.jpeg', 'image/jpeg', 230000, 1600, 1067, 'Water feature and koi pond with native ferns', 'Tranquil shade garden with naturalized water feature and Japanese painted ferns.', true),
  ('b0000001-0000-0000-0000-000000000004', '/images/gallery/garden-walk/2O8A8037-scaled.jpeg', 'image/jpeg', 275000, 1600, 1067, 'Artistic garden sculpture nestled in flowering perennials', 'Sculptural garden accent surrounded by Russian sage and black-eyed Susans.', true),
  ('b0000001-0000-0000-0000-000000000005', '/images/gallery/downtown-planters.jpeg', 'image/jpeg', 210000, 1600, 1067, 'Municipal street planters overflowing with summer annuals', 'Civic beautification planters along Center Street in Douglas maintained by SDGC volunteers.', true),
  ('b0000001-0000-0000-0000-000000000006', '/images/gallery/community-beautification-pots.jpeg', 'image/jpeg', 225000, 1600, 1067, 'Waterfront park floral urns with coleus and sweet potato vine', 'Decorative ornamental urns at Saugatuck waterfront park installed for the summer season.', true),
  ('b0000001-0000-0000-0000-000000000007', '/images/content/6th-grade-workshop.jpeg', 'image/jpeg', 195000, 1600, 1067, 'Students learning seed planting in school greenhouse', 'SDGC Master Gardeners mentoring 6th grade students on heirloom seed germination.', true),
  ('b0000001-0000-0000-0000-000000000008', '/images/gallery/educational-programs.jpeg', 'image/jpeg', 215000, 1600, 1067, 'Native pollinator garden workshop demonstration', 'Interactive presentation on attracting monarch butterflies and native Michigan pollinators.', true),
  ('b0000001-0000-0000-0000-000000000009', '/images/content/plant-sale-old-schoolhouse.jpeg', 'image/jpeg', 235000, 1600, 1067, 'Annual SDGC plant sale tables at the Old School House', 'Community neighbors browsing locally propagated perennials at the historic Old School House.', true),
  ('b0000001-0000-0000-0000-000000000010', '/images/content/garden-awards-plaque.jpeg', 'image/jpeg', 180000, 1600, 1067, 'SDGC Civic Beautification and Landscape Award plaque', 'Annual awards celebrating distinguished residential and commercial landscape design.', true),
  ('b0000001-0000-0000-0000-000000000011', '/images/gallery/garden-walk/2O8A8032-scaled.jpeg', 'image/jpeg', 240000, 1600, 1067, 'Historic cottage garden roses and perennial border', 'English cottage roses climbing a weathered cedar arbor in Douglas.', true),
  ('b0000001-0000-0000-0000-000000000012', '/images/gallery/garden-walk/2O8A8042-scaled.jpeg', 'image/jpeg', 255000, 1600, 1067, 'Pollinator meadow with echinacea and native grasses', 'Sun-drenched coastal meadow garden buzzing with Michigan honeybees.', true)
ON CONFLICT (id) DO UPDATE SET
  storage_path = EXCLUDED.storage_path,
  alt_text = EXCLUDED.alt_text,
  caption = EXCLUDED.caption,
  is_public = EXCLUDED.is_public;

-- Seed authentic thematic albums
INSERT INTO albums (id, slug, title, description, year, category, is_public)
VALUES
  ('c0000001-0000-0000-0000-000000000001', 'garden-walk-2025', 'Garden Walk 2025: Coastal Blooms', 'Strolling through six private historic cottage gardens across Douglas and Saugatuck on a sunlit July weekend.', 2025, 'Garden Walk', true),
  ('c0000001-0000-0000-0000-000000000002', 'civic-planters-2025', 'Civic Beautification & Downtown Planters', 'Volunteer seasonal plantings, floral hanging baskets, and decorative municipal urns along Center and Culver streets.', 2025, 'Civic Beautification', true),
  ('c0000001-0000-0000-0000-000000000003', 'youth-workshops-2025', 'Youth & 6th-Grade Gardening Workshops', 'Hands-on horticultural education, seed starting, and native pollinator study with local school students.', 2025, 'Workshops & Education', true),
  ('c0000001-0000-0000-0000-000000000004', 'plant-sale-2024', 'Annual Plant Sale at Old School House', 'Hundreds of member-grown perennials, heirloom pollinators, and native shrubs shared with our coastal community.', 2024, 'Plant Sales', true),
  ('c0000001-0000-0000-0000-000000000005', 'garden-awards-2024', 'Annual Landscape & Garden Awards', 'Celebrating outstanding residential gardens and commercial beautification efforts throughout our twin cities.', 2024, 'Member Gatherings', true),
  ('c0000001-0000-0000-0000-000000000006', 'historic-walks-archive', 'Historic Garden Walks Archive (2018–2023)', 'Retrospective of memorable cottage and coastal landscapes from earlier years of our signature annual garden tour.', 2023, 'Garden Walk', true)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  year = EXCLUDED.year,
  category = EXCLUDED.category,
  is_public = EXCLUDED.is_public;

-- Link media items to albums
INSERT INTO album_items (album_id, media_asset_id, sort_order)
VALUES
  -- Garden Walk 2025
  ('c0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', 1),
  ('c0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000002', 2),
  ('c0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000003', 3),
  ('c0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000004', 4),
  -- Civic Planters 2025
  ('c0000001-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000005', 1),
  ('c0000001-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000006', 2),
  -- Youth Workshops 2025
  ('c0000001-0000-0000-0000-000000000003', 'b0000001-0000-0000-0000-000000000007', 1),
  ('c0000001-0000-0000-0000-000000000003', 'b0000001-0000-0000-0000-000000000008', 2),
  -- Plant Sale 2024
  ('c0000001-0000-0000-0000-000000000004', 'b0000001-0000-0000-0000-000000000009', 1),
  -- Garden Awards 2024
  ('c0000001-0000-0000-0000-000000000005', 'b0000001-0000-0000-0000-000000000010', 1),
  -- Historic Walks Archive
  ('c0000001-0000-0000-0000-000000000006', 'b0000001-0000-0000-0000-000000000011', 1),
  ('c0000001-0000-0000-0000-000000000006', 'b0000001-0000-0000-0000-000000000012', 2)
ON CONFLICT (album_id, media_asset_id) DO NOTHING;

-- Set cover assets on albums
UPDATE albums SET cover_asset_id = 'b0000001-0000-0000-0000-000000000001' WHERE id = 'c0000001-0000-0000-0000-000000000001';
UPDATE albums SET cover_asset_id = 'b0000001-0000-0000-0000-000000000005' WHERE id = 'c0000001-0000-0000-0000-000000000002';
UPDATE albums SET cover_asset_id = 'b0000001-0000-0000-0000-000000000007' WHERE id = 'c0000001-0000-0000-0000-000000000003';
UPDATE albums SET cover_asset_id = 'b0000001-0000-0000-0000-000000000009' WHERE id = 'c0000001-0000-0000-0000-000000000004';
UPDATE albums SET cover_asset_id = 'b0000001-0000-0000-0000-000000000010' WHERE id = 'c0000001-0000-0000-0000-000000000005';
UPDATE albums SET cover_asset_id = 'b0000001-0000-0000-0000-000000000011' WHERE id = 'c0000001-0000-0000-0000-000000000006';
