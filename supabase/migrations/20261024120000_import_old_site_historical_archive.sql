-- Migration: Import authentic historical archive from old site backup (2023-2024 seasons, historic albums, media assets, and venues)
-- Generated: 2026-10-24

-- 1. Insert Historical Venues
INSERT INTO public.venues (id, name, address, city, state, postal_code)
VALUES
  ('d7777777-1111-1111-1111-111111111111', 'All Saints Episcopal Church', '252 Grand Street', 'Saugatuck', 'MI', '49453'),
  ('d7777777-2222-2222-2222-222222222222', 'Saugatuck Center for the Arts', '400 Culver Street', 'Saugatuck', 'MI', '49453'),
  ('d7777777-3333-3333-3333-333333333333', 'Saugatuck-Douglas District Library', '174 Center Street', 'Douglas', 'MI', '49406'),
  ('d7777777-4444-4444-4444-444444444444', 'Wyncroft Winery', '1055 64th Street', 'Pullman', 'MI', '49450'),
  ('d7777777-5555-5555-5555-555555555555', 'Garden Crossings & Butterfly Sanctuary', '4902 96th Avenue', 'Zeeland', 'MI', '49464'),
  ('d7777777-6666-6666-6666-666666666666', 'Crane Orchards', '6054 124th Avenue', 'Fennville', 'MI', '49408'),
  ('d7777777-7777-7777-7777-777777777777', 'Spring Meadow Nursery Proven Winners', '12601 120th Avenue', 'Grand Haven', 'MI', '49417'),
  ('d7777777-8888-8888-8888-888888888888', 'Fieldsview Farm', '608 71st Street', 'South Haven', 'MI', '49090'),
  ('d7777777-9999-9999-9999-999999999999', 'Farmhouse Deli & Pantry', '100 Blue Star Highway', 'Douglas', 'MI', '49406'),
  ('d7777777-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Community Church of Douglas', '6874 Wiley Road', 'Douglas', 'MI', '49406'),
  ('d7777777-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Windridge Greenhouses', '7364 Adams Street', 'Zeeland', 'MI', '49464')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  city = EXCLUDED.city,
  state = EXCLUDED.state,
  postal_code = EXCLUDED.postal_code,
  updated_at = now();

-- 2. Insert Media Assets
INSERT INTO public.media_assets (id, storage_path, alt_text, caption, mime_type, size_bytes, width, height, is_public)
VALUES
  ('c8888888-8888-8888-8888-888888880001', 'https://res.cloudinary.com/p4wempwi/image/upload/v1792818403/sdgc-web/archive/garden-walk-historic/DSC_5487-scaled.jpg', 'Saugatuck Douglas Historic Showcase Garden View (DSC 5487 scaled)', 'Saugatuck Douglas Historic Showcase Garden View (DSC 5487 scaled)', 'image/jpeg', 756506, 2560, 1700, true),
  ('c8888888-8888-8888-8888-888888880002', 'https://res.cloudinary.com/p4wempwi/image/upload/v1792818404/sdgc-web/archive/garden-walk-historic/DSC_5492.jpg', 'Saugatuck Douglas Historic Showcase Garden View (DSC 5492)', 'Saugatuck Douglas Historic Showcase Garden View (DSC 5492)', 'image/jpeg', 349275, 1648, 1098, true),
  ('c8888888-8888-8888-8888-888888880003', 'https://res.cloudinary.com/p4wempwi/image/upload/v1792818404/sdgc-web/archive/garden-walk-historic/DSC_5494-scaled.jpg', 'Saugatuck Douglas Historic Showcase Garden View (DSC 5494 scaled)', 'Saugatuck Douglas Historic Showcase Garden View (DSC 5494 scaled)', 'image/jpeg', 566624, 2560, 1700, true),
  ('c8888888-8888-8888-8888-888888880004', 'https://res.cloudinary.com/p4wempwi/image/upload/v1792818406/sdgc-web/archive/garden-walk-historic/DSC_5500-scaled.jpg', 'Saugatuck Douglas Historic Showcase Garden View (DSC 5500 scaled)', 'Saugatuck Douglas Historic Showcase Garden View (DSC 5500 scaled)', 'image/jpeg', 297491, 2560, 1700, true),
  ('c8888888-8888-8888-8888-888888880005', 'https://res.cloudinary.com/p4wempwi/image/upload/v1792818407/sdgc-web/archive/garden-walk-historic/DSC_5501-scaled.jpg', 'Saugatuck Douglas Historic Showcase Garden View (DSC 5501 scaled)', 'Saugatuck Douglas Historic Showcase Garden View (DSC 5501 scaled)', 'image/jpeg', 494035, 2560, 1700, true),
  ('c8888888-8888-8888-8888-888888880006', 'https://res.cloudinary.com/p4wempwi/image/upload/v1792818408/sdgc-web/archive/garden-walk-historic/DSC_5533-scaled.jpg', 'Saugatuck Douglas Historic Showcase Garden View (DSC 5533 scaled)', 'Saugatuck Douglas Historic Showcase Garden View (DSC 5533 scaled)', 'image/jpeg', 487419, 2560, 1700, true),
  ('c8888888-8888-8888-8888-888888880007', 'https://res.cloudinary.com/p4wempwi/image/upload/v1792818409/sdgc-web/archive/garden-walk-historic/DSC_5543-scaled.jpg', 'Saugatuck Douglas Historic Showcase Garden View (DSC 5543 scaled)', 'Saugatuck Douglas Historic Showcase Garden View (DSC 5543 scaled)', 'image/jpeg', 531825, 2560, 1700, true),
  ('c8888888-8888-8888-8888-888888880008', 'https://res.cloudinary.com/p4wempwi/image/upload/v1792818410/sdgc-web/archive/garden-walk-historic/DSC_5544.jpg', 'Saugatuck Douglas Historic Showcase Garden View (DSC 5544)', 'Saugatuck Douglas Historic Showcase Garden View (DSC 5544)', 'image/jpeg', 555025, 1424, 2144, true),
  ('c8888888-8888-8888-8888-888888880009', 'https://res.cloudinary.com/p4wempwi/image/upload/v1792818410/sdgc-web/archive/garden-walk-historic/DSC_5545-scaled.jpg', 'Saugatuck Douglas Historic Showcase Garden View (DSC 5545 scaled)', 'Saugatuck Douglas Historic Showcase Garden View (DSC 5545 scaled)', 'image/jpeg', 588683, 2560, 1700, true),
  ('c8888888-8888-8888-8888-88888888000a', 'https://res.cloudinary.com/p4wempwi/image/upload/v1792818411/sdgc-web/archive/garden-walk-historic/DSC_5549-scaled.jpg', 'Saugatuck Douglas Historic Showcase Garden View (DSC 5549 scaled)', 'Saugatuck Douglas Historic Showcase Garden View (DSC 5549 scaled)', 'image/jpeg', 475041, 2560, 1700, true),
  ('c8888888-8888-8888-8888-88888888000b', 'https://res.cloudinary.com/p4wempwi/image/upload/v1792818412/sdgc-web/archive/garden-walk-historic/DSC_5571.jpg', 'Saugatuck Douglas Historic Showcase Garden View (DSC 5571)', 'Saugatuck Douglas Historic Showcase Garden View (DSC 5571)', 'image/jpeg', 604410, 1424, 2144, true),
  ('c8888888-8888-8888-8888-88888888000c', 'https://res.cloudinary.com/p4wempwi/image/upload/v1792818413/sdgc-web/archive/garden-walk-historic/DSC_5580-scaled.jpg', 'Saugatuck Douglas Historic Showcase Garden View (DSC 5580 scaled)', 'Saugatuck Douglas Historic Showcase Garden View (DSC 5580 scaled)', 'image/jpeg', 484064, 2560, 1700, true),
  ('c8888888-8888-8888-8888-88888888000d', 'https://res.cloudinary.com/p4wempwi/image/upload/v1792818415/sdgc-web/archive/garden-walk-historic/DSC_5916.jpg', 'Saugatuck Douglas Historic Showcase Garden View (DSC 5916)', 'Saugatuck Douglas Historic Showcase Garden View (DSC 5916)', 'image/jpeg', 827407, 2144, 1424, true),
  ('c8888888-8888-8888-8888-88888888000e', 'https://res.cloudinary.com/p4wempwi/image/upload/v1792818416/sdgc-web/archive/garden-walk-historic/DSC_5918-scaled.jpg', 'Saugatuck Douglas Historic Showcase Garden View (DSC 5918 scaled)', 'Saugatuck Douglas Historic Showcase Garden View (DSC 5918 scaled)', 'image/jpeg', 599827, 2560, 1700, true),
  ('c8888888-8888-8888-8888-88888888000f', 'https://res.cloudinary.com/p4wempwi/image/upload/v1792818417/sdgc-web/archive/garden-walk-historic/DSC_5934.jpg', 'Saugatuck Douglas Historic Showcase Garden View (DSC 5934)', 'Saugatuck Douglas Historic Showcase Garden View (DSC 5934)', 'image/jpeg', 551119, 1424, 2144, true),
  ('c8888888-8888-8888-8888-888888880010', 'https://res.cloudinary.com/p4wempwi/image/upload/v1792818418/sdgc-web/archive/garden-walk-historic/DSC_6605-scaled.jpg', 'Saugatuck Douglas Historic Showcase Garden View (DSC 6605 scaled)', 'Saugatuck Douglas Historic Showcase Garden View (DSC 6605 scaled)', 'image/jpeg', 435060, 2560, 1700, true),
  ('c8888888-8888-8888-8888-888888880011', 'https://res.cloudinary.com/p4wempwi/image/upload/v1792818419/sdgc-web/archive/garden-walk-historic/DSC_6606.jpg', 'Saugatuck Douglas Historic Showcase Garden View (DSC 6606)', 'Saugatuck Douglas Historic Showcase Garden View (DSC 6606)', 'image/jpeg', 680128, 1424, 2144, true),
  ('c8888888-8888-8888-8888-888888880012', 'https://res.cloudinary.com/p4wempwi/image/upload/v1792818420/sdgc-web/archive/garden-walk-historic/DSC_6618-scaled.jpg', 'Saugatuck Douglas Historic Showcase Garden View (DSC 6618 scaled)', 'Saugatuck Douglas Historic Showcase Garden View (DSC 6618 scaled)', 'image/jpeg', 518366, 2560, 1700, true),
  ('c8888888-8888-8888-8888-888888880013', 'https://res.cloudinary.com/p4wempwi/image/upload/v1792818421/sdgc-web/archive/garden-walk-historic/DSC_6657-scaled.jpg', 'Saugatuck Douglas Historic Showcase Garden View (DSC 6657 scaled)', 'Saugatuck Douglas Historic Showcase Garden View (DSC 6657 scaled)', 'image/jpeg', 456877, 2560, 1700, true),
  ('c8888888-8888-8888-8888-888888880014', 'https://res.cloudinary.com/p4wempwi/image/upload/v1792818422/sdgc-web/archive/garden-walk-historic/DSC_6673-scaled.jpg', 'Saugatuck Douglas Historic Showcase Garden View (DSC 6673 scaled)', 'Saugatuck Douglas Historic Showcase Garden View (DSC 6673 scaled)', 'image/jpeg', 434280, 2560, 1700, true),
  ('c8888888-8888-8888-8888-888888880015', 'https://res.cloudinary.com/p4wempwi/image/upload/v1792818422/sdgc-web/archive/garden-walk-historic/DSC_6690-scaled.jpg', 'Saugatuck Douglas Historic Showcase Garden View (DSC 6690 scaled)', 'Saugatuck Douglas Historic Showcase Garden View (DSC 6690 scaled)', 'image/jpeg', 252479, 2560, 1700, true),
  ('c8888888-8888-8888-8888-888888880016', 'https://res.cloudinary.com/p4wempwi/image/upload/v1792818423/sdgc-web/archive/garden-walk-historic/DSC_6692-scaled.jpg', 'Saugatuck Douglas Historic Showcase Garden View (DSC 6692 scaled)', 'Saugatuck Douglas Historic Showcase Garden View (DSC 6692 scaled)', 'image/jpeg', 454793, 2560, 1700, true),
  ('c8888888-8888-8888-8888-888888880017', 'https://res.cloudinary.com/p4wempwi/image/upload/v1792818424/sdgc-web/archive/garden-walk-historic/DSC_6697-scaled.jpg', 'Saugatuck Douglas Historic Showcase Garden View (DSC 6697 scaled)', 'Saugatuck Douglas Historic Showcase Garden View (DSC 6697 scaled)', 'image/jpeg', 427192, 2560, 1700, true),
  ('c8888888-8888-8888-8888-888888880018', 'https://res.cloudinary.com/p4wempwi/image/upload/v1792818425/sdgc-web/archive/garden-walk-historic/DSC_6701-scaled.jpg', 'Saugatuck Douglas Historic Showcase Garden View (DSC 6701 scaled)', 'Saugatuck Douglas Historic Showcase Garden View (DSC 6701 scaled)', 'image/jpeg', 377381, 2560, 1700, true),
  ('c8888888-8888-8888-8888-888888880019', 'https://res.cloudinary.com/p4wempwi/raw/upload/v1792818426/sdgc-web/archive/documents/BYLAWS-SDGC-FINAL.pdf', 'Saugatuck Douglas Garden Club Official Bylaws', 'Saugatuck Douglas Garden Club Official Bylaws', 'application/pdf', 89060, NULL, NULL, false),
  ('c8888888-8888-8888-8888-88888888001a', 'https://res.cloudinary.com/p4wempwi/image/upload/v1792818427/sdgc-web/archive/civic-beautification/Image-1-22-21-at-11.38-AM.jpg', 'Saugatuck Douglas Civic Beautification & Community Project (Image 1 22 21 at 11.38 AM)', 'Saugatuck Douglas Civic Beautification & Community Project (Image 1 22 21 at 11.38 AM)', 'image/jpeg', 193941, 640, 480, true),
  ('c8888888-8888-8888-8888-88888888001b', 'https://res.cloudinary.com/p4wempwi/image/upload/v1792818428/sdgc-web/archive/civic-beautification/Image-1-22-21-at-2.06-PM-1.jpg', 'Saugatuck Douglas Civic Beautification & Community Project (Image 1 22 21 at 2.06 PM 1)', 'Saugatuck Douglas Civic Beautification & Community Project (Image 1 22 21 at 2.06 PM 1)', 'image/jpeg', 213673, 640, 480, true),
  ('c8888888-8888-8888-8888-88888888001c', 'https://res.cloudinary.com/p4wempwi/image/upload/v1792818429/sdgc-web/archive/civic-beautification/Image-1-22-21-at-2.21-PM-scaled.jpg', 'Saugatuck Douglas Civic Beautification & Community Project (Image 1 22 21 at 2.21 PM scaled)', 'Saugatuck Douglas Civic Beautification & Community Project (Image 1 22 21 at 2.21 PM scaled)', 'image/jpeg', 1228218, 2560, 1920, true),
  ('c8888888-8888-8888-8888-88888888001d', 'https://res.cloudinary.com/p4wempwi/image/upload/v1792818430/sdgc-web/archive/civic-beautification/Image-1-22-21-at-2.22-PM-2-scaled.jpg', 'Saugatuck Douglas Civic Beautification & Community Project (Image 1 22 21 at 2.22 PM 2 scaled)', 'Saugatuck Douglas Civic Beautification & Community Project (Image 1 22 21 at 2.22 PM 2 scaled)', 'image/jpeg', 951785, 2560, 1920, true),
  ('c8888888-8888-8888-8888-88888888001e', 'https://res.cloudinary.com/p4wempwi/image/upload/v1792818431/sdgc-web/archive/civic-beautification/Image-1-22-21-at-2.24-PM-scaled.jpg', 'Saugatuck Douglas Civic Beautification & Community Project (Image 1 22 21 at 2.24 PM scaled)', 'Saugatuck Douglas Civic Beautification & Community Project (Image 1 22 21 at 2.24 PM scaled)', 'image/jpeg', 853692, 2560, 1920, true),
  ('c8888888-8888-8888-8888-88888888001f', 'https://res.cloudinary.com/p4wempwi/image/upload/v1792818432/sdgc-web/archive/civic-beautification/Image-1-22-21-at-2.26-PM-3.jpg', 'Saugatuck Douglas Civic Beautification & Community Project (Image 1 22 21 at 2.26 PM 3)', 'Saugatuck Douglas Civic Beautification & Community Project (Image 1 22 21 at 2.26 PM 3)', 'image/jpeg', 1371937, 2048, 1388, true),
  ('c8888888-8888-8888-8888-888888880020', 'https://res.cloudinary.com/p4wempwi/image/upload/v1792818433/sdgc-web/archive/civic-beautification/Image-1-22-21-at-2.26-PM-4.jpg', 'Saugatuck Douglas Civic Beautification & Community Project (Image 1 22 21 at 2.26 PM 4)', 'Saugatuck Douglas Civic Beautification & Community Project (Image 1 22 21 at 2.26 PM 4)', 'image/jpeg', 1242797, 2026, 2048, true),
  ('c8888888-8888-8888-8888-888888880021', 'https://res.cloudinary.com/p4wempwi/image/upload/v1792818435/sdgc-web/archive/civic-beautification/Image-1-22-21-at-2.58-PM.jpg', 'Saugatuck Douglas Civic Beautification & Community Project (Image 1 22 21 at 2.58 PM)', 'Saugatuck Douglas Civic Beautification & Community Project (Image 1 22 21 at 2.58 PM)', 'image/jpeg', 180207, 480, 640, true),
  ('c8888888-8888-8888-8888-888888880022', 'https://res.cloudinary.com/p4wempwi/raw/upload/v1792818436/sdgc-web/archive/documents/SDGC-Comunity-Beautification.pdf', 'SDGC Comunity Beautification', 'SDGC Comunity Beautification', 'application/pdf', 55154, NULL, NULL, false),
  ('c8888888-8888-8888-8888-888888880023', 'https://res.cloudinary.com/p4wempwi/raw/upload/v1792818437/sdgc-web/archive/documents/SDGC-LOCAL-GARDEN-AWARDS.pdf', 'SDGC LOCAL GARDEN AWARDS', 'SDGC LOCAL GARDEN AWARDS', 'application/pdf', 62258, NULL, NULL, false),
  ('c8888888-8888-8888-8888-888888880024', 'https://res.cloudinary.com/p4wempwi/raw/upload/v1792818438/sdgc-web/archive/documents/SDGC-SCHOLARSHIP-CHAIRPERSON.pdf', 'SDGC SCHOLARSHIP CHAIRPERSON', 'SDGC SCHOLARSHIP CHAIRPERSON', 'application/pdf', 64891, NULL, NULL, false),
  ('c8888888-8888-8888-8888-888888880025', 'https://res.cloudinary.com/p4wempwi/image/upload/v1792818438/sdgc-web/archive/garden-walk-2024/SDGC-2024-Walk.jpg', '46th Annual Saugatuck-Douglas Garden Walk Official Poster', '46th Annual Saugatuck-Douglas Garden Walk Official Poster', 'image/jpeg', 83051, 612, 792, true)
ON CONFLICT (id) DO UPDATE SET
  storage_path = EXCLUDED.storage_path,
  alt_text = EXCLUDED.alt_text,
  caption = EXCLUDED.caption,
  mime_type = EXCLUDED.mime_type,
  size_bytes = EXCLUDED.size_bytes,
  width = EXCLUDED.width,
  height = EXCLUDED.height,
  is_public = EXCLUDED.is_public,
  updated_at = now();

-- 3. Insert Historical Albums
INSERT INTO public.albums (id, slug, title, description, year, category, is_public, cover_asset_id)
VALUES
  ('a7777777-1111-1111-1111-111111111111', '46th-annual-garden-walk-2024', '46th Annual Garden Walk (2024)', 'Official photography, program artwork, and community celebration from the 46th Annual Saugatuck-Douglas Garden Walk held Saturday, July 20, 2024.', 2024, 'garden-walk', true, 'c8888888-8888-8888-8888-888888880025'),
  ('a7777777-2222-2222-2222-222222222222', 'historic-garden-walks-archive', 'Historic Garden Walk Sanctuaries (2015-2018)', 'Curated retrospective of private showcase gardens featured on historic Saugatuck-Douglas Garden Walks, capturing shade retreats, perennial borders, and coastal cottage landscapes.', 2018, 'garden-walk', true, 'c8888888-8888-8888-8888-88888888000e'),
  ('a7777777-3333-3333-3333-333333333333', 'youth-gardening-community-workshops', 'Youth Gardening & Community Workshops', 'Historical photography documenting SDGC civic street planters, downtown municipal urns, and 6th grade middle school floral workshops across Saugatuck and Douglas.', 2021, 'beautification', true, 'c8888888-8888-8888-8888-88888888001c')
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  year = EXCLUDED.year,
  category = EXCLUDED.category,
  cover_asset_id = EXCLUDED.cover_asset_id,
  is_public = EXCLUDED.is_public,
  updated_at = now();

-- 4. Link Album Items
INSERT INTO public.album_items (album_id, media_asset_id, sort_order)
VALUES
  ('a7777777-1111-1111-1111-111111111111', 'c8888888-8888-8888-8888-888888880025', 1),
  ('a7777777-2222-2222-2222-222222222222', 'c8888888-8888-8888-8888-888888880001', 1),
  ('a7777777-2222-2222-2222-222222222222', 'c8888888-8888-8888-8888-888888880002', 2),
  ('a7777777-2222-2222-2222-222222222222', 'c8888888-8888-8888-8888-888888880003', 3),
  ('a7777777-2222-2222-2222-222222222222', 'c8888888-8888-8888-8888-888888880004', 4),
  ('a7777777-2222-2222-2222-222222222222', 'c8888888-8888-8888-8888-888888880005', 5),
  ('a7777777-2222-2222-2222-222222222222', 'c8888888-8888-8888-8888-888888880006', 6),
  ('a7777777-2222-2222-2222-222222222222', 'c8888888-8888-8888-8888-888888880007', 7),
  ('a7777777-2222-2222-2222-222222222222', 'c8888888-8888-8888-8888-888888880008', 8),
  ('a7777777-2222-2222-2222-222222222222', 'c8888888-8888-8888-8888-888888880009', 9),
  ('a7777777-2222-2222-2222-222222222222', 'c8888888-8888-8888-8888-88888888000a', 10),
  ('a7777777-2222-2222-2222-222222222222', 'c8888888-8888-8888-8888-88888888000b', 11),
  ('a7777777-2222-2222-2222-222222222222', 'c8888888-8888-8888-8888-88888888000c', 12),
  ('a7777777-2222-2222-2222-222222222222', 'c8888888-8888-8888-8888-88888888000d', 13),
  ('a7777777-2222-2222-2222-222222222222', 'c8888888-8888-8888-8888-88888888000e', 14),
  ('a7777777-2222-2222-2222-222222222222', 'c8888888-8888-8888-8888-88888888000f', 15),
  ('a7777777-2222-2222-2222-222222222222', 'c8888888-8888-8888-8888-888888880010', 16),
  ('a7777777-2222-2222-2222-222222222222', 'c8888888-8888-8888-8888-888888880011', 17),
  ('a7777777-2222-2222-2222-222222222222', 'c8888888-8888-8888-8888-888888880012', 18),
  ('a7777777-2222-2222-2222-222222222222', 'c8888888-8888-8888-8888-888888880013', 19),
  ('a7777777-2222-2222-2222-222222222222', 'c8888888-8888-8888-8888-888888880014', 20),
  ('a7777777-2222-2222-2222-222222222222', 'c8888888-8888-8888-8888-888888880015', 21),
  ('a7777777-2222-2222-2222-222222222222', 'c8888888-8888-8888-8888-888888880016', 22),
  ('a7777777-2222-2222-2222-222222222222', 'c8888888-8888-8888-8888-888888880017', 23),
  ('a7777777-2222-2222-2222-222222222222', 'c8888888-8888-8888-8888-888888880018', 24),
  ('a7777777-3333-3333-3333-333333333333', 'c8888888-8888-8888-8888-88888888001a', 1),
  ('a7777777-3333-3333-3333-333333333333', 'c8888888-8888-8888-8888-88888888001b', 2),
  ('a7777777-3333-3333-3333-333333333333', 'c8888888-8888-8888-8888-88888888001c', 3),
  ('a7777777-3333-3333-3333-333333333333', 'c8888888-8888-8888-8888-88888888001d', 4),
  ('a7777777-3333-3333-3333-333333333333', 'c8888888-8888-8888-8888-88888888001e', 5),
  ('a7777777-3333-3333-3333-333333333333', 'c8888888-8888-8888-8888-88888888001f', 6),
  ('a7777777-3333-3333-3333-333333333333', 'c8888888-8888-8888-8888-888888880020', 7),
  ('a7777777-3333-3333-3333-333333333333', 'c8888888-8888-8888-8888-888888880021', 8)
ON CONFLICT (album_id, media_asset_id) DO UPDATE SET
  sort_order = EXCLUDED.sort_order;

-- 5. Insert Historical Events (2023 and 2024 Program Seasons)
INSERT INTO public.events (slug, title, starts_at, ends_at, timezone, all_day, category, status, venue_id, featured_image, excerpt, description)
VALUES
  ('welcome-back-tea-2023', 'Welcome Back Tea: 2023 Season Kickoff', '2023-04-10T14:00:00-04:00', '2023-04-10T16:00:00-04:00', 'America/Detroit', false, 'meeting', 'published', 'd7777777-1111-1111-1111-111111111111', NULL, 'Season kickoff gathering to renew friendships and unveil the 2023 calendar of programs and garden walk preparations.', 'Our annual Tea marks the official start of our Garden Club season! Members and prospective guests gathered to renew friendships, review the upcoming schedule of garden tours, workshops, and civic beautification projects.'),
  ('arbor-day-seedling-workshop-2023', 'Arbor Day Seedling Bagging Workshop', '2023-04-10T10:00:00-04:00', '2023-04-10T11:30:00-04:00', 'America/Detroit', false, 'workshop', 'published', 'd6666666-6666-6666-6666-666666666666', NULL, 'Packaging native seedling trees for local school students and Arbor Day community distribution.', 'Club members gathered at Huntree Nursery to package and bag native seedlings for local youth and community Arbor Day tree distribution across Saugatuck and Douglas.'),
  ('windridge-greenhouses-nursery-tour-2023', 'Windridge Greenhouses & Nursery Field Trip', '2023-05-15T10:00:00-04:00', '2023-05-15T12:00:00-04:00', 'America/Detroit', false, 'field_trip', 'published', 'd7777777-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NULL, 'Educational greenhouse tour exploring seasonal commercial bedding plants and container arrangement techniques.', 'Educational horticultural excursion to Windridge Greenhouses in Zeeland, exploring seasonal commercial bedding plants, container arrangement techniques, and greenhouse propagation.'),
  ('community-beautification-day-2023', 'Community Beautification Planting Day with Saugatuck 6th Graders', '2023-05-24T08:30:00-04:00', '2023-05-24T11:00:00-04:00', 'America/Detroit', false, 'beautification', 'published', 'd7777777-2222-2222-2222-222222222222', NULL, 'Annual intergenerational partnership planting downtown civic containers and municipal street planters.', 'Annual intergenerational community partnership: SDGC volunteer docents teamed up with Saugatuck Middle School 6th graders at the Saugatuck Center for the Arts to plant civic urns and downtown municipal street planters.'),
  ('45th-annual-garden-walk-fundraiser-2023', '45th Annual Saugatuck-Douglas Garden Walk Fundraiser & Plant Sale', '2023-07-15T10:00:00-04:00', '2023-07-15T16:00:00-04:00', 'America/Detroit', false, 'fundraiser', 'published', 'd2222222-2222-2222-2222-222222222222', NULL, 'Premier garden tour featuring 6 private coastal sanctuaries and member plant sale funding local scholarships.', 'The 45th Annual Garden Walk Fundraiser featured private showcase gardens throughout Saugatuck and Douglas, alongside our member-grown perennial plant sale at the Old School House in Douglas.'),
  ('presentation-on-bees-and-bee-keeping-2023', 'The World of Bees: Apiculture & Pollinator Conservation', '2023-08-21T10:00:00-04:00', '2023-08-21T11:30:00-04:00', 'America/Detroit', false, 'educational', 'published', 'd7777777-3333-3333-3333-333333333333', NULL, 'Guest presentation by Jeri Walsh Allis on honeybee biology, apiculture practices, and floral pollinator support.', 'Jeri Walsh Allis presented an insightful slide lecture on the honeybee lifecycle, hive social hierarchy, colony health challenges, and natural garden methods to foster pollinator safety.'),
  ('spring-meadow-nursery-tour-2023', 'Spring Meadow Nursery & Proven Winners Demonstration Gardens', '2023-09-18T10:00:00-04:00', '2023-09-18T12:30:00-04:00', 'America/Detroit', false, 'field_trip', 'published', 'd7777777-7777-7777-7777-777777777777', NULL, 'Guided tour through Proven Winners trial gardens in Grand Haven highlighting new woody plant cultivars.', 'Guided walking tour through the Proven Winners showcase and trial gardens at Spring Meadow Nursery in Grand Haven, examining cutting-edge ornamental shrub introductions and trial performance.'),
  ('landscape-design-using-native-plants-2023', 'Landscape Design Using Michigan Native Plants', '2023-10-16T10:00:00-04:00', '2023-10-16T11:30:00-04:00', 'America/Detroit', false, 'educational', 'published', 'd7777777-3333-3333-3333-333333333333', NULL, 'Landscape architect Rebecca Marquardt on integrating Great Lakes native perennials and shrubs.', 'Landscape architect Rebecca Marquardt provided practical design frameworks on integrating Great Lakes coastal native perennials, grasses, and shrubs into residential landscapes.'),
  ('creating-a-kokedama-moss-ball-garden-2023', 'Japanese Kokedama Moss Ball Art & Demonstration Workshop', '2023-11-13T10:00:00-04:00', '2023-11-13T12:00:00-04:00', 'America/Detroit', false, 'workshop', 'published', 'd2222222-2222-2222-2222-222222222222', NULL, 'Josephine Fowler from Puddingstone demonstrates the ancient Japanese art of hanging moss ball gardening.', 'Josephine Fowler from Puddingstone in Saugatuck led a live hands-on demonstration of traditional Japanese Kokedama moss ball garden creation.'),
  ('holiday-swag-workshop-2023', 'Civic Holiday Swags & Evergreen Bows Workshop', '2023-11-16T10:00:00-05:00', '2023-11-16T12:00:00-05:00', 'America/Detroit', false, 'workshop', 'published', 'd6666666-6666-6666-6666-666666666666', NULL, 'Members craft fresh evergreen boughs and velvet bows for community public building decorations.', 'Club members gathered at Huntree Nursery to assemble fresh pine, cedar, and fir holiday swags adorned with hand-tied red bows for public building displays throughout Saugatuck and Douglas.'),
  ('holiday-arrangements-for-senior-citizens-2023', 'Senior Living Holiday Floral Arrangements with 6th Graders', '2023-12-11T08:00:00-05:00', '2023-12-11T10:30:00-05:00', 'America/Detroit', false, 'workshop', 'published', 'd5555555-5555-5555-5555-555555555555', NULL, 'Mentoring middle school students to create festive seasonal table arrangements for area seniors.', 'SDGC volunteers visited Saugatuck Middle School to mentor 6th grade students in crafting fresh seasonal holiday centerpieces for local senior citizen living facilities.'),
  ('annual-holiday-party-2023', '2023 SDGC Annual Holiday Celebration Dinner', '2023-12-11T17:30:00-05:00', '2023-12-11T19:30:00-05:00', 'America/Detroit', false, 'social', 'published', 'd7777777-9999-9999-9999-999999999999', NULL, 'Year-end celebratory gathering and annual awards dinner with friends and fellow gardeners.', 'Festive evening holiday dinner celebration and annual awards banquet celebrating our members'' civic dedication.'),
  ('welcome-back-tea-2024', 'Welcome Back Tea: 2024 Season Opening', '2024-04-15T14:00:00-04:00', '2024-04-15T16:00:00-04:00', 'America/Detroit', false, 'meeting', 'published', 'd7777777-1111-1111-1111-111111111111', NULL, 'Seasonal kickoff tea reconnecting members and unveiling the 2024 speaker series and garden tour dates.', 'Seasonal opening tea held at All Saints Episcopal Church in Saugatuck to reconnect members and announce the 2024 garden tour itinerary.'),
  ('arbor-day-seedling-workshop-2024', '2024 Arbor Day Seedling Packaging Workshop', '2024-04-23T10:00:00-04:00', '2024-04-23T11:30:00-04:00', 'America/Detroit', false, 'workshop', 'published', 'd6666666-6666-6666-6666-666666666666', NULL, 'Volunteers gather at Huntree Nursery to bag bare-root saplings for community tree planting.', 'Volunteers met at Huntree Nursery to prepare native tree saplings for community Arbor Day distribution.'),
  ('wyncroft-winery-tour-2024', 'Wyncroft Winery Viticulture & Vineyard Grounds Tour', '2024-05-20T10:00:00-04:00', '2024-05-20T12:00:00-04:00', 'America/Detroit', false, 'field_trip', 'published', 'd7777777-4444-4444-4444-444444444444', NULL, 'Winemaker Jim Lester guides members through the vineyards exploring soil terroir and cold-climate viticulture.', 'Winemaker Jim Lester led club members on an educational walking tour of the European vinifera vineyards in Pullman, discussing soil geology, microclimates, and sustainable grape growing.'),
  ('saugatuck-community-beautification-2024', 'Saugatuck Civic Urns & Downtown Planters Workbee', '2024-05-22T08:30:00-04:00', '2024-05-22T10:30:00-04:00', 'America/Detroit', false, 'beautification', 'published', 'd7777777-2222-2222-2222-222222222222', NULL, 'Club docents work alongside Saugatuck 6th graders planting vibrant summer flowers across the city.', 'SDGC volunteers and 6th-grade students collaborated at the Saugatuck Center for the Arts to plant flowering annuals across downtown civic containers.'),
  ('new-member-party-2024', '2024 New Member Welcome Gathering', '2024-06-24T18:00:00-04:00', '2024-06-24T20:30:00-04:00', 'America/Detroit', false, 'social', 'published', 'd7777777-1111-1111-1111-111111111111', NULL, 'An evening garden social welcoming newly enrolled members into club activities and committees.', 'Celebratory evening mixer at All Saints Episcopal Church welcoming new garden club recruits.'),
  ('46th-annual-garden-walk-fundraiser-2024', '46th Annual Saugatuck-Douglas Garden Walk Fundraiser & Plant Sale', '2024-07-20T10:00:00-04:00', '2024-07-20T16:00:00-04:00', 'America/Detroit', false, 'fundraiser', 'published', 'd2222222-2222-2222-2222-222222222222', 'https://res.cloudinary.com/p4wempwi/image/upload/v1792818438/sdgc-web/archive/garden-walk-2024/SDGC-2024-Walk.jpg', 'Tour breathtaking private coastal gardens and purchase member-grown perennials to support local scholarships.', 'Our marquee annual community garden walk welcoming hundreds of visitors to discover breathtaking private garden retreats across Saugatuck and Douglas, supporting local high school scholarships.'),
  ('fieldsview-farm-tour-2024', 'Fieldsview Farm Flower Field Tour & U-Pick Experience', '2024-08-19T10:00:00-04:00', '2024-08-19T12:00:00-04:00', 'America/Detroit', false, 'field_trip', 'published', 'd7777777-8888-8888-8888-888888888888', NULL, 'Tour Derek and Amy''s cut-flower farm in South Haven with an opportunity for fresh bouquet harvesting.', 'Derek and Amy hosted a walk through their specialty cut-flower farm in South Haven, sharing organic cutting techniques and bouquet curation.'),
  ('garden-crossings-butterfly-house-2024', 'Garden Crossings Display Gardens & Butterfly Sanctuary Tour', '2024-09-16T10:00:00-04:00', '2024-09-16T12:00:00-04:00', 'America/Detroit', false, 'field_trip', 'published', 'd7777777-5555-5555-5555-555555555555', NULL, 'Behind-the-scenes walking tour through extensive perennial display beds and live butterfly greenhouse in Zeeland.', 'Heidi provided a behind-the-scenes guided tour through the renowned perennial display grounds and live butterfly house in Zeeland.'),
  ('how-to-use-conifers-in-the-landscape-2024', 'Evergreen Architecture: Using Conifers in Midwest Landscapes', '2024-10-21T10:00:00-04:00', '2024-10-21T11:30:00-04:00', 'America/Detroit', false, 'educational', 'published', 'd7777777-3333-3333-3333-333333333333', NULL, 'MSU professor of forestry Bert Clegg on conifer selections, winter interest, and Michigan soil suitability.', 'Bert Clegg, MSU professor of horticulture and forestry, delivered an informative slide presentation on dwarf, weeping, and upright conifer varieties suited to Michigan soil.'),
  ('holiday-workshop-and-swag-assembly-2024', '2024 Civic Evergreen Swag & Bow Assembly Workshop', '2024-11-14T10:00:00-05:00', '2024-11-14T12:30:00-05:00', 'America/Detroit', false, 'workshop', 'published', 'd6666666-6666-6666-6666-666666666666', NULL, 'Crafting pine and cedar evergreen swags for holiday displays across Saugatuck and Douglas public sites.', 'Members gathered at Huntree Nursery to craft fresh winter swags for civic lamp-posts, libraries, and historic municipal buildings.'),
  ('crane-orchards-heritage-visit-2024', 'Crane Orchards Century-Old Heritage & Agricultural Presentation', '2024-11-18T10:00:00-05:00', '2024-11-18T11:30:00-05:00', 'America/Detroit', false, 'educational', 'published', 'd7777777-6666-6666-6666-666666666666', NULL, 'Rob Crane on the rich agricultural history and fruit orchard legacy of the Fennville area.', 'Rob Crane presented the multi-generational history of fruit farming and orchard stewardship at Crane''s Orchards in Fennville.'),
  ('annual-holiday-celebration-2024', '2024 SDGC Annual Holiday Luncheon & Celebration', '2024-12-09T12:00:00-05:00', '2024-12-09T14:30:00-05:00', 'America/Detroit', false, 'social', 'published', 'd7777777-9999-9999-9999-999999999999', NULL, 'Year-end holiday feast celebrating volunteer milestones and committee achievements.', 'Year-end celebratory luncheon at the Farmhouse Deli & Pantry in Douglas, celebrating club achievements and honoring volunteer service.')
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  starts_at = EXCLUDED.starts_at,
  ends_at = EXCLUDED.ends_at,
  timezone = EXCLUDED.timezone,
  all_day = EXCLUDED.all_day,
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  venue_id = EXCLUDED.venue_id,
  featured_image = EXCLUDED.featured_image,
  excerpt = EXCLUDED.excerpt,
  description = EXCLUDED.description,
  updated_at = now();
