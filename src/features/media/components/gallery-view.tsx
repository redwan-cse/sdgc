"use client";

import * as React from "react";
import Image from "next/image";
import type { MediaItem, AlbumSummary } from "../types";

interface GalleryViewProps {
  albums: AlbumSummary[];
  media: MediaItem[];
}

export function GalleryView({ albums, media }: GalleryViewProps) {
  const [selectedAlbumId, setSelectedAlbumId] = React.useState<string | "all">("all");
  const [activeImageIndex, setActiveImageIndex] = React.useState<number | null>(null);
  const triggerRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const lightboxRef = React.useRef<HTMLDivElement>(null);

  const filteredMedia = React.useMemo(() => {
    if (selectedAlbumId === "all") return media;
    return media.filter((item) => item.albumId === selectedAlbumId);
  }, [media, selectedAlbumId]);

  const activeImage = activeImageIndex !== null ? filteredMedia[activeImageIndex] : null;

  // Handle keyboard navigation in Lightbox
  React.useEffect(() => {
    if (activeImageIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        const prevIndex = activeImageIndex;
        setActiveImageIndex(null);
        triggerRefs.current[prevIndex]?.focus();
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setActiveImageIndex((prev) =>
          prev !== null && prev < filteredMedia.length - 1 ? prev + 1 : 0,
        );
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setActiveImageIndex((prev) =>
          prev !== null && prev > 0 ? prev - 1 : filteredMedia.length - 1,
        );
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    // Set focus to close button
    const timeout = setTimeout(() => {
      const closeBtn = lightboxRef.current?.querySelector<HTMLButtonElement>("button[data-close]");
      closeBtn?.focus();
    }, 50);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      clearTimeout(timeout);
    };
  }, [activeImageIndex, filteredMedia.length]);

  return (
    <div>
      {/* Album Filters */}
      <div className="flex flex-wrap gap-2 mb-8" role="tablist" aria-label="Photo Albums">
        <button
          type="button"
          role="tab"
          aria-selected={selectedAlbumId === "all"}
          onClick={() => setSelectedAlbumId("all")}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
            selectedAlbumId === "all"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          All Photos ({media.length})
        </button>
        {albums.map((album) => {
          const isSelected = selectedAlbumId === album.id;
          return (
            <button
              key={album.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => setSelectedAlbumId(album.id)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
                isSelected
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {album.title} ({album.itemCount})
            </button>
          );
        })}
      </div>

      {/* Media Grid */}
      {filteredMedia.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
          No photos found in this album.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredMedia.map((item, idx) => (
            <button
              key={item.id}
              ref={(el) => {
                triggerRefs.current[idx] = el;
              }}
              type="button"
              aria-haspopup="dialog"
              onClick={() => setActiveImageIndex(idx)}
              className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card text-left shadow-2xs hover:shadow-md transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
              aria-label={`View photo: ${item.caption || item.alt}`}
            >
              <div className="relative aspect-4/3 w-full overflow-hidden bg-muted">
                <Image
                  src={item.src}
                  alt={item.alt}
                  width={item.width || 600}
                  height={item.height || 450}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              {item.caption && (
                <div className="p-3">
                  <p className="text-xs text-muted-foreground line-clamp-2">{item.caption}</p>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {activeImage && activeImageIndex !== null && (
        <div
          ref={lightboxRef}
          role="dialog"
          aria-modal="true"
          aria-label="Image preview modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-6"
        >
          <div className="relative max-w-4xl w-full flex flex-col items-center">
            {/* Header / Close button */}
            <div className="w-full flex justify-between items-center text-white mb-2">
              <span className="text-sm font-medium">
                Photo {activeImageIndex + 1} of {filteredMedia.length}
              </span>
              <button
                type="button"
                data-close="true"
                onClick={() => {
                  const prevIndex = activeImageIndex;
                  setActiveImageIndex(null);
                  triggerRefs.current[prevIndex]?.focus();
                }}
                className="rounded-full bg-white/20 p-2 text-white hover:bg-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white cursor-pointer"
                aria-label="Close image lightbox"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Main Image container with Next/Prev controls */}
            <div className="relative w-full aspect-4/3 max-h-[75vh] flex items-center justify-center bg-black/50 rounded-lg overflow-hidden">
              <Image
                src={activeImage.src}
                alt={activeImage.alt}
                width={activeImage.width || 800}
                height={activeImage.height || 600}
                priority
                className="max-h-[70vh] w-auto max-w-full object-contain"
              />

              {/* Prev button */}
              <button
                type="button"
                onClick={() =>
                  setActiveImageIndex((prev) =>
                    prev !== null && prev > 0 ? prev - 1 : filteredMedia.length - 1,
                  )
                }
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white cursor-pointer"
                aria-label="Previous photo"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              {/* Next button */}
              <button
                type="button"
                onClick={() =>
                  setActiveImageIndex((prev) =>
                    prev !== null && prev < filteredMedia.length - 1 ? prev + 1 : 0,
                  )
                }
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white cursor-pointer"
                aria-label="Next photo"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>

            {/* Caption */}
            {activeImage.caption && (
              <p className="mt-3 text-center text-sm text-white/90 max-w-xl">
                {activeImage.caption}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
