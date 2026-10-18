import { resolveMediaUrl } from "@/lib/storage/media-url";
import { createClient } from "@/lib/supabase/server";
import type { AlbumSummary, MediaItem } from "./types";

export async function listMediaAlbums(): Promise<AlbumSummary[]> {
  const supabase = await createClient();
  const { data: albumsData } = await supabase
    .from("albums")
    .select(
      `
      id,
      slug,
      title,
      description,
      year,
      album_items (
        sort_order,
        media_assets (
          id,
          storage_path,
          alt_text,
          caption,
          width,
          height,
          is_public
        )
      )
    `,
    )
    .eq("is_public", true)
    .order("year", { ascending: false });

  if (albumsData && albumsData.length > 0) {
    return albumsData.map((album: Record<string, unknown>) => {
      const rawItems =
        (album.album_items as Array<{
          sort_order: number;
          media_assets: {
            id: string;
            storage_path: string;
            alt_text: string;
            caption: string | null;
            width: number;
            height: number;
            is_public: boolean;
          } | null;
        }>) || [];

      const publicItems = rawItems
        .filter((ai) => ai.media_assets?.is_public)
        .sort((a, b) => a.sort_order - b.sort_order);

      const coverAsset = publicItems[0]?.media_assets;
      const coverImage: MediaItem | undefined = coverAsset
        ? {
            id: coverAsset.id,
            src: resolveMediaUrl(coverAsset.storage_path),
            width: coverAsset.width || 1200,
            height: coverAsset.height || 800,
            alt: coverAsset.alt_text,
            caption: coverAsset.caption || undefined,
            albumId: album.id as string,
            order: publicItems[0]?.sort_order || 0,
            isPublic: coverAsset.is_public,
            storagePath: coverAsset.storage_path,
          }
        : undefined;

      return {
        id: album.id as string,
        slug: album.slug as string,
        title: album.title as string,
        description: (album.description as string) || undefined,
        year: (album.year as number) || undefined,
        coverImage,
        itemCount: publicItems.length,
      };
    });
  }

  return [];
}

async function listMediaItemsInternal(includePrivate: boolean): Promise<MediaItem[]> {
  const supabase = await createClient();

  let query = supabase.from("media_assets").select(`
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
    `);

  if (!includePrivate) {
    query = query.eq("is_public", true);
  }

  const { data: dbMedia, error } = await query.order("created_at", { ascending: false });

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

    const items: MediaItem[] = dbMedia
      .map((m: Record<string, unknown>): MediaItem | null => {
        const albumItems = m.album_items as
          Array<{ album_id: string; sort_order: number }> | undefined;
        const albumItem = albumItems?.[0];
        const storagePath = (m.storage_path as string) || "";
        const signedUrl = signedUrlMap.get(storagePath);
        const resolved = resolveMediaUrl(storagePath);
        const src = storagePath.startsWith("http")
          ? storagePath
          : resolved.startsWith("http")
            ? resolved
            : signedUrl || resolved;

        if (!src) {
          // Exclude assets whose underlying files do not exist
          return null;
        }

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
      })
      .filter((item): item is MediaItem => item !== null);

    return items;
  }

  return [];
}

export async function listGalleryMedia(): Promise<MediaItem[]> {
  return listMediaItemsInternal(false);
}

export async function listStaffMedia(): Promise<MediaItem[]> {
  return listMediaItemsInternal(true);
}
