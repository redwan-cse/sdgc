import { resolveMediaUrl } from "@/lib/storage/media-url";
import { createClient } from "@/lib/supabase/server";
import type { AlbumDetail, AlbumSummary, MediaItem } from "./types";

interface RawMediaAsset {
  id: string;
  storage_path: string;
  alt_text: string;
  caption: string | null;
  width: number | null;
  height: number | null;
  is_public: boolean;
}

interface RawAlbumItem {
  sort_order: number;
  media_assets: RawMediaAsset | null;
}

export async function listMediaAlbums(options?: {
  includePrivate?: boolean;
}): Promise<AlbumSummary[]> {
  const supabase = await createClient();
  let query = supabase
    .from("albums")
    .select(
      `
      id,
      slug,
      title,
      description,
      year,
      category,
      cover_asset_id,
      is_public,
      created_at,
      updated_at,
      cover_asset:media_assets!cover_asset_id (
        id,
        storage_path,
        alt_text,
        caption,
        width,
        height,
        is_public
      ),
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
    .order("year", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (!options?.includePrivate) {
    query = query.eq("is_public", true);
  }

  const { data: albumsData, error } = await query;

  if (error || !albumsData) {
    return [];
  }

  return albumsData.map((album: Record<string, unknown>): AlbumSummary => {
    const rawItems = (album.album_items as RawAlbumItem[]) || [];
    const filteredItems = rawItems
      .filter((ai) => options?.includePrivate || ai.media_assets?.is_public)
      .sort((a, b) => a.sort_order - b.sort_order);

    const rawCover = album.cover_asset as unknown;
    const coverAsset: RawMediaAsset | null = Array.isArray(rawCover)
      ? (rawCover[0] as RawMediaAsset | null)
      : (rawCover as RawMediaAsset | null) || filteredItems[0]?.media_assets || null;

    const coverImage: MediaItem | undefined = coverAsset
      ? {
          id: coverAsset.id,
          src: resolveMediaUrl(coverAsset.storage_path),
          width: coverAsset.width || 1200,
          height: coverAsset.height || 800,
          alt: coverAsset.alt_text || (album.title as string),
          caption: coverAsset.caption || undefined,
          albumId: album.id as string,
          order: 0,
          isPublic: coverAsset.is_public,
          storagePath: coverAsset.storage_path,
        }
      : undefined;

    const items: MediaItem[] = filteredItems
      .filter((ai): ai is { sort_order: number; media_assets: RawMediaAsset } =>
        Boolean(ai.media_assets),
      )
      .map((ai) => ({
        id: ai.media_assets.id,
        src: resolveMediaUrl(ai.media_assets.storage_path),
        width: ai.media_assets.width || 1200,
        height: ai.media_assets.height || 800,
        alt: ai.media_assets.alt_text || (album.title as string),
        caption: ai.media_assets.caption || undefined,
        albumId: album.id as string,
        order: ai.sort_order,
        isPublic: ai.media_assets.is_public,
        storagePath: ai.media_assets.storage_path,
      }));

    return {
      id: album.id as string,
      slug: album.slug as string,
      title: album.title as string,
      description: (album.description as string) || undefined,
      year: (album.year as number) || undefined,
      category: (album.category as string) || "Garden Walk",
      coverAssetId: (album.cover_asset_id as string) || undefined,
      coverImage,
      itemCount: filteredItems.length,
      items,
      isPublic: album.is_public as boolean,
      createdAt: album.created_at as string,
      updatedAt: album.updated_at as string,
    };
  });
}

export async function getAlbumBySlug(
  slug: string,
  options?: { includePrivate?: boolean },
): Promise<AlbumDetail | null> {
  const supabase = await createClient();
  let query = supabase
    .from("albums")
    .select(
      `
      id,
      slug,
      title,
      description,
      year,
      category,
      cover_asset_id,
      is_public,
      created_at,
      updated_at,
      cover_asset:media_assets!cover_asset_id (
        id,
        storage_path,
        alt_text,
        caption,
        width,
        height,
        is_public
      ),
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
    .eq("slug", slug);

  if (!options?.includePrivate) {
    query = query.eq("is_public", true);
  }

  const { data: albumData, error } = await query.maybeSingle();

  if (error || !albumData) {
    return null;
  }

  const rawItems = (albumData.album_items as RawAlbumItem[]) || [];
  const validItems = rawItems
    .filter((ai) => options?.includePrivate || ai.media_assets?.is_public)
    .filter((ai): ai is { sort_order: number; media_assets: RawMediaAsset } =>
      Boolean(ai.media_assets),
    )
    .sort((a, b) => a.sort_order - b.sort_order);

  const items: MediaItem[] = validItems.map((item) => {
    const ma = item.media_assets;
    return {
      id: ma.id,
      src: resolveMediaUrl(ma.storage_path),
      width: ma.width || 1200,
      height: ma.height || 800,
      alt: ma.alt_text || albumData.title,
      caption: ma.caption || undefined,
      albumId: albumData.id,
      order: item.sort_order,
      isPublic: ma.is_public,
      storagePath: ma.storage_path,
    };
  });

  const rawCover = albumData.cover_asset as unknown;
  const coverAsset: RawMediaAsset | null = Array.isArray(rawCover)
    ? (rawCover[0] as RawMediaAsset | null)
    : (rawCover as RawMediaAsset | null) || validItems[0]?.media_assets || null;

  const coverImage: MediaItem | undefined = coverAsset
    ? {
        id: coverAsset.id,
        src: resolveMediaUrl(coverAsset.storage_path),
        width: coverAsset.width || 1200,
        height: coverAsset.height || 800,
        alt: coverAsset.alt_text || albumData.title,
        caption: coverAsset.caption || undefined,
        albumId: albumData.id,
        order: 0,
        isPublic: coverAsset.is_public,
        storagePath: coverAsset.storage_path,
      }
    : undefined;

  return {
    id: albumData.id,
    slug: albumData.slug,
    title: albumData.title,
    description: albumData.description || undefined,
    year: albumData.year || undefined,
    category: albumData.category || "Garden Walk",
    coverAssetId: albumData.cover_asset_id || undefined,
    coverImage,
    itemCount: items.length,
    isPublic: albumData.is_public,
    createdAt: albumData.created_at,
    updatedAt: albumData.updated_at,
    items,
  };
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
    const items: MediaItem[] = dbMedia
      .map((m: Record<string, unknown>): MediaItem | null => {
        const albumItems = m.album_items as
          Array<{ album_id: string; sort_order: number }> | undefined;
        const albumItem = albumItems?.[0];
        const storagePath = (m.storage_path as string) || "";
        const src = resolveMediaUrl(storagePath);

        if (!src) {
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
