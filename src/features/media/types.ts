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
  category?: string;
  coverAssetId?: string;
  coverImage?: MediaItem;
  itemCount: number;
  items?: MediaItem[];
  isPublic?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AlbumDetail extends AlbumSummary {
  items: MediaItem[];
}
