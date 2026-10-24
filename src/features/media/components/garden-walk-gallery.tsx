"use client";

import * as React from "react";
import Image from "next/image";

export interface GardenWalkPhoto {
  id: string;
  src: string;
  alt: string;
  caption: string;
}

interface GardenWalkGalleryProps {
  photos: GardenWalkPhoto[];
}

export function GardenWalkGallery({ photos }: GardenWalkGalleryProps) {
  const [activePhotoIndex, setActivePhotoIndex] = React.useState<number | null>(null);
  const [isZoomed, setIsZoomed] = React.useState(false);

  const activePhoto =
    activePhotoIndex !== null && photos[activePhotoIndex] ? photos[activePhotoIndex] : null;

  // Keyboard navigation
  React.useEffect(() => {
    if (activePhotoIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActivePhotoIndex(null);
        setIsZoomed(false);
      } else if (e.key === "ArrowLeft") {
        setIsZoomed(false);
        setActivePhotoIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : photos.length - 1));
      } else if (e.key === "ArrowRight") {
        setIsZoomed(false);
        setActivePhotoIndex((prev) => (prev !== null && prev < photos.length - 1 ? prev + 1 : 0));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activePhotoIndex, photos.length]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-baseline gap-2 border-b border-border/60 pb-3">
        <div>
          <h2 className="font-serif text-2xl font-bold text-foreground">
            Photographs from Past Garden Walks
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Click any photograph to view in high-resolution full screen with captions.
          </p>
        </div>
        <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
          {photos.length} Curated Views
        </span>
      </div>

      {/* Photo Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {photos.map((photo, index) => (
          <button
            key={photo.id}
            type="button"
            aria-haspopup="dialog"
            aria-label={`View photo ${index + 1}: ${photo.caption}`}
            onClick={() => {
              setActivePhotoIndex(index);
              setIsZoomed(false);
            }}
            className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-xs hover:shadow-lg hover:border-primary/40 transition-all duration-300 text-left flex flex-col focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
          >
            <div className="relative aspect-4/3 w-full overflow-hidden bg-muted">
              <Image
                src={photo.src}
                alt={photo.alt}
                width={600}
                height={450}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-108"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-white bg-black/40 backdrop-blur-xs px-2.5 py-1 rounded-full">
                  <svg
                    aria-hidden="true"
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6"
                    />
                  </svg>
                  Click to Expand
                </span>
              </div>
            </div>
            <p className="p-3.5 text-xs text-muted-foreground leading-relaxed flex-1 group-hover:text-foreground transition-colors">
              {photo.caption}
            </p>
          </button>
        ))}
      </div>

      {/* Interactive Lightbox Modal */}
      {activePhoto !== null && activePhotoIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-2 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={activePhoto.alt}
        >
          {/* Top Bar with Controls */}
          <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-wider bg-white/10 px-3 py-1 rounded-full backdrop-blur-xs">
                Garden Walk Archive
              </span>
              <span className="text-xs text-neutral-300 font-mono">
                {activePhotoIndex + 1} of {photos.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsZoomed(!isZoomed)}
                className="rounded-full bg-white/10 hover:bg-white/20 p-2 text-white transition-colors cursor-pointer"
                title={isZoomed ? "Zoom out" : "Zoom in"}
                aria-label={isZoomed ? "Zoom out" : "Zoom in"}
              >
                <svg
                  aria-hidden="true"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  {isZoomed ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM13.5 10.5h-6"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6"
                    />
                  )}
                </svg>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActivePhotoIndex(null);
                  setIsZoomed(false);
                }}
                className="rounded-full bg-white/10 hover:bg-white/20 p-2 text-white transition-colors cursor-pointer"
                title="Close viewer (Esc)"
                aria-label="Close viewer"
              >
                <svg
                  aria-hidden="true"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Previous Button */}
          <button
            type="button"
            onClick={() => {
              setIsZoomed(false);
              setActivePhotoIndex((prev) =>
                prev !== null && prev > 0 ? prev - 1 : photos.length - 1,
              );
            }}
            className="absolute left-3 sm:left-6 z-10 rounded-full bg-white/10 hover:bg-white/25 p-3 text-white transition-colors cursor-pointer"
            aria-label="Previous photograph"
          >
            <svg
              aria-hidden="true"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2.5"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>

          {/* Next Button */}
          <button
            type="button"
            onClick={() => {
              setIsZoomed(false);
              setActivePhotoIndex((prev) =>
                prev !== null && prev < photos.length - 1 ? prev + 1 : 0,
              );
            }}
            className="absolute right-3 sm:right-6 z-10 rounded-full bg-white/10 hover:bg-white/25 p-3 text-white transition-colors cursor-pointer"
            aria-label="Next photograph"
          >
            <svg
              aria-hidden="true"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2.5"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>

          {/* Central Image & Caption Container */}
          <div className="relative max-h-[85vh] max-w-[90vw] flex flex-col items-center">
            <button
              type="button"
              aria-label={isZoomed ? "Zoom out photo" : "Zoom in photo"}
              className={`relative overflow-hidden rounded-xl transition-all duration-300 text-left ${
                isZoomed ? "cursor-zoom-out scale-125" : "cursor-zoom-in"
              }`}
              onClick={() => setIsZoomed(!isZoomed)}
            >
              <Image
                src={activePhoto.src}
                alt={activePhoto.alt}
                width={1200}
                height={900}
                className="max-h-[72vh] w-auto object-contain rounded-xl shadow-2xl"
                priority
              />
            </button>

            {/* Bottom Caption Bar */}
            <div className="mt-4 max-w-2xl text-center px-4 py-2.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10">
              <p className="text-sm font-medium text-white">{activePhoto.caption}</p>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Saugatuck-Douglas Garden Club • Annual Garden Walk Showcase
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
