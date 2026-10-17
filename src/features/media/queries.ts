import { createClient } from "@/lib/supabase/server";
import type { AlbumSummary, MediaItem } from "./types";

const REAL_LOCAL_GALLERY_MEDIA: MediaItem[] = [
  {
    id: "gal-01",
    src: "/images/gallery/garden-walk-2025.jpeg",
    width: 1200,
    height: 800,
    alt: "Garden Walk Tour 2025 in full summer bloom",
    caption:
      "Spectacular private sanctuary along the Kalamazoo River during the annual Garden Walk.",
    albumId: "a1111111-1111-1111-1111-111111111111",
    year: 2025,
    order: 1,
  },
  {
    id: "gal-gw-01",
    src: "/images/gallery/garden-walk/2O8A8017-scaled.jpeg",
    width: 1200,
    height: 800,
    alt: "Lush shade garden with hostas and ferns on the annual tour",
    caption: "Verdant shade sanctuary featuring woodland perennials and Japanese maples.",
    albumId: "a1111111-1111-1111-1111-111111111111",
    year: 2025,
    order: 2,
  },
  {
    id: "gal-gw-02",
    src: "/images/gallery/garden-walk/2O8A8020-scaled.jpeg",
    width: 1200,
    height: 800,
    alt: "Sunlit perennial borders in peak July bloom",
    caption: "Coneflowers, black-eyed Susans, and ornamental grasses in full sun.",
    albumId: "a1111111-1111-1111-1111-111111111111",
    year: 2025,
    order: 3,
  },
  {
    id: "gal-gw-03",
    src: "/images/gallery/garden-walk/2O8A8022-scaled.jpeg",
    width: 1200,
    height: 800,
    alt: "Stone garden pathway and blooming borders",
    caption: "Handcrafted stone walkway winding through colorful pollinator beds.",
    albumId: "a1111111-1111-1111-1111-111111111111",
    year: 2025,
    order: 4,
  },
  {
    id: "gal-gw-04",
    src: "/images/gallery/garden-walk/2O8A8025-scaled.jpeg",
    width: 1200,
    height: 800,
    alt: "Architectural garden design with outdoor living spaces",
    caption: "Bespoke garden sitting area integrating native Michigan plantings.",
    albumId: "a1111111-1111-1111-1111-111111111111",
    year: 2025,
    order: 5,
  },
  {
    id: "gal-gw-05",
    src: "/images/gallery/garden-walk/2O8A8032-scaled.jpeg",
    width: 1200,
    height: 800,
    alt: "Woodland garden path beneath mature oaks",
    caption: "Tranquil woodland stroll garden in Saugatuck.",
    albumId: "a1111111-1111-1111-1111-111111111111",
    year: 2025,
    order: 6,
  },
  {
    id: "gal-gw-06",
    src: "/images/gallery/garden-walk/2O8A8037-scaled.jpeg",
    width: 1200,
    height: 800,
    alt: "Cottage perennial border bursting with vibrant color",
    caption: "Delphiniums, daylilies, and phlox in an English-style cottage garden.",
    albumId: "a1111111-1111-1111-1111-111111111111",
    year: 2025,
    order: 7,
  },
  {
    id: "gal-gw-07",
    src: "/images/gallery/garden-walk/2O8A8041-scaled.jpeg",
    width: 1200,
    height: 800,
    alt: "Natural garden water feature and reflection pool",
    caption: "Custom water garden providing a haven for frogs and birds.",
    albumId: "a1111111-1111-1111-1111-111111111111",
    year: 2025,
    order: 8,
  },
  {
    id: "gal-gw-08",
    src: "/images/gallery/garden-walk/2O8A8043-scaled.jpeg",
    width: 1200,
    height: 800,
    alt: "Lakeshore hydrangea borders and sculptured shrubs",
    caption: "Magnificent Annabelle and panicle hydrangeas framing private grounds.",
    albumId: "a1111111-1111-1111-1111-111111111111",
    year: 2025,
    order: 9,
  },
  {
    id: "gal-02",
    src: "/images/gallery/garden-walk-tourists.jpeg",
    width: 1200,
    height: 800,
    alt: "Garden enthusiasts enjoying garden paths",
    caption: "Visitors touring perennial borders and woodland cottage gardens.",
    albumId: "a1111111-1111-1111-1111-111111111111",
    year: 2025,
    order: 10,
  },
  {
    id: "gal-03",
    src: "/images/gallery/plant-sale-perennials.jpeg",
    width: 1200,
    height: 800,
    alt: "Membership Perennial Plant Sale at the Old School House",
    caption: "Hardy perennial divisions and garden treasures at the Old School House in Douglas.",
    albumId: "a1111111-1111-1111-1111-111111111111",
    year: 2025,
    order: 11,
  },
  {
    id: "gal-04",
    src: "/images/gallery/community-beautification-pots.jpeg",
    width: 1200,
    height: 800,
    alt: "Downtown sidewalk planters planted by club volunteers",
    caption: "Civic planters bringing vibrant seasonal colors to Saugatuck downtown sidewalks.",
    albumId: "a2222222-2222-2222-2222-222222222222",
    year: 2025,
    order: 4,
  },
  {
    id: "gal-05",
    src: "/images/gallery/volunteers-watering.jpeg",
    width: 1200,
    height: 800,
    alt: "Garden Club volunteers tending civic garden bump-outs",
    caption:
      "Dedicated 'Water Girls' team caring for Douglas City Hall corner plots throughout the summer.",
    albumId: "a2222222-2222-2222-2222-222222222222",
    year: 2025,
    order: 5,
  },
  {
    id: "gal-06",
    src: "/images/gallery/downtown-planters.jpeg",
    width: 1200,
    height: 800,
    alt: "Lush flowering urns outside public library",
    caption: "Douglas Library flower displays maintained through volunteer garden workbees.",
    albumId: "a2222222-2222-2222-2222-222222222222",
    year: 2025,
    order: 6,
  },
  {
    id: "gal-07",
    src: "/images/gallery/garden-awards.jpeg",
    width: 1200,
    height: 800,
    alt: "Local Garden Recognition Award winning garden",
    caption:
      "Residential award winner recognized for exceptional landscaping and native pollinator design.",
    albumId: "a2222222-2222-2222-2222-222222222222",
    year: 2025,
    order: 7,
  },
  {
    id: "gal-08",
    src: "/images/gallery/educational-programs.jpeg",
    width: 1200,
    height: 800,
    alt: "Monthly educational presentation and workshop",
    caption: "Guest lecture on organic soil health and native Michigan perennials.",
    albumId: "a1111111-1111-1111-1111-111111111111",
    year: 2025,
    order: 8,
  },
  {
    id: "gal-09",
    src: "/images/gallery/new-members-party.jpeg",
    width: 1200,
    height: 800,
    alt: "Annual New Member Reception and social celebration",
    caption: "Welcoming new garden lovers into the Saugatuck Douglas Garden Club family.",
    albumId: "a2222222-2222-2222-2222-222222222222",
    year: 2025,
    order: 9,
  },
];

interface RawAlbumRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  year: number | null;
}

export async function listMediaAlbums(): Promise<AlbumSummary[]> {
  const supabase = await createClient();
  const { data: albumsData } = await supabase
    .from("albums")
    .select("id, slug, title, description, year")
    .eq("is_public", true)
    .order("year", { ascending: false });

  if (albumsData && albumsData.length > 0) {
    const rows = albumsData as RawAlbumRow[];
    return rows.map((album) => {
      const items = REAL_LOCAL_GALLERY_MEDIA.filter((m) => m.albumId === album.id);
      return {
        id: album.id,
        slug: album.slug,
        title: album.title,
        description: album.description || undefined,
        year: album.year || undefined,
        coverImage: items[0],
        itemCount: items.length,
      };
    });
  }

  return [
    {
      id: "a1111111-1111-1111-1111-111111111111",
      slug: "garden-walk-highlights",
      title: "Garden Walk Highlights",
      description: "Tour highlights, private sanctuaries, and plant sales",
      year: 2025,
      coverImage: REAL_LOCAL_GALLERY_MEDIA[0],
      itemCount: 4,
    },
    {
      id: "a2222222-2222-2222-2222-222222222222",
      slug: "civic-beautification",
      title: "Civic Beautification Projects",
      description: "City sidewalk planters, library flowers, and bump-outs",
      year: 2025,
      coverImage: REAL_LOCAL_GALLERY_MEDIA[3],
      itemCount: 5,
    },
  ];
}

export async function listGalleryMedia(): Promise<MediaItem[]> {
  const supabase = await createClient();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";

  const { data: dbMedia, error } = await supabase
    .from("media_assets")
    .select(
      `
      id,
      storage_path,
      alt_text,
      caption,
      width,
      height,
      is_public,
      album_items (
        album_id,
        sort_order
      )
    `,
    )
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  if (!error && dbMedia && dbMedia.length > 0) {
    const storagePaths = dbMedia
      .map((m: Record<string, unknown>) => (m.storage_path as string) || "")
      .filter((p) => Boolean(p) && !p.startsWith("http") && !p.startsWith("/"));

    const signedUrlMap = new Map<string, string>();
    if (storagePaths.length > 0) {
      try {
        const { data: signedResults } = await supabase.storage
          .from("club-media")
          .createSignedUrls(storagePaths, 86400);

        if (signedResults) {
          for (const sr of signedResults) {
            if (sr.signedUrl && sr.path) {
              signedUrlMap.set(sr.path, sr.signedUrl);
            }
          }
        }
      } catch {
        // Fallback gracefully if storage API is unreachable
      }
    }

    const items: MediaItem[] = dbMedia.map((m: Record<string, unknown>) => {
      const albumItems = m.album_items as
        Array<{ album_id: string; sort_order: number }> | undefined;
      const albumItem = albumItems?.[0];
      const storagePath = (m.storage_path as string) || "";
      const src =
        storagePath.startsWith("http") || storagePath.startsWith("/")
          ? storagePath
          : signedUrlMap.get(storagePath) ||
            `${supabaseUrl}/storage/v1/object/public/club-media/${storagePath}`;

      return {
        id: m.id as string,
        src,
        width: (m.width as number) || 1200,
        height: (m.height as number) || 800,
        alt: (m.alt_text as string) || "Garden club photograph",
        caption: (m.caption as string) || undefined,
        albumId: albumItem?.album_id,
        order: albumItem?.sort_order || 0,
        isPublic: m.is_public as boolean,
        storagePath,
      };
    });

    // Merge with local curated gallery images so gallery display is vibrant and populated
    const nonDuplicatedLocal = REAL_LOCAL_GALLERY_MEDIA.filter(
      (rm) => !items.some((i) => i.id === rm.id),
    );
    return [...items, ...nonDuplicatedLocal];
  }

  return REAL_LOCAL_GALLERY_MEDIA;
}
