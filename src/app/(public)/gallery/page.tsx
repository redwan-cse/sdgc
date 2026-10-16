import { listGalleryMedia, listMediaAlbums } from "@/features/media/queries";
import { GalleryView } from "@/features/media/components/gallery-view";

export const metadata = {
  title: "Photo Gallery",
  description:
    "Explore photo albums of Saugatuck Douglas Garden Club community beautification projects, civic plantings, and annual Garden Walks.",
};

export default async function GalleryPage() {
  const albums = await listMediaAlbums();
  const media = await listGalleryMedia();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
      <div className="space-y-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-primary">
          Visual Memories & Civic Beauty
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-foreground">
          Club Photo Gallery
        </h1>
        <p className="max-w-2xl text-base text-muted-foreground leading-relaxed">
          Browse highlights from our annual Garden Walks, community plantings at the Douglas Library
          and Saugatuck waterfront, and seasonal youth workshops.
        </p>
      </div>

      <GalleryView albums={albums} media={media} />
    </div>
  );
}
