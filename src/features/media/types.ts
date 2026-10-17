export interface MediaItem {
  id: string;
  src: string;
  width: number;
  height: number;
  alt: string;
  caption?: string;
  albumId?: string;
  year?: number;
  order?: number;
  isPublic?: boolean;
  storagePath?: string;
}

export interface AlbumSummary {
  id: string;
  slug: string;
  title: string;
  description?: string;
  year?: number;
  coverImage?: MediaItem;
  itemCount: number;
}
