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
    id: "gal-02",
    src: "/images/gallery/garden-walk-tourists.jpeg",
    width: 1200,
    height: 800,
    alt: "Garden enthusiasts enjoying garden paths",
    caption: "Visitors touring perennial borders and woodland cottage gardens.",
    albumId: "a1111111-1111-1111-1111-111111111111",
    year: 2025,
    order: 2,
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
    order: 3,
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
  return REAL_LOCAL_GALLERY_MEDIA;
}
