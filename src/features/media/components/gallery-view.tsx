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
  const [isZoomed, setIsZoomed] = React.useState<boolean>(false);

  const triggerRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const originalTriggerIndexRef = React.useRef<number | null>(null);
  const lightboxRef = React.useRef<HTMLDivElement>(null);
  const contentContainerRef = React.useRef<HTMLDivElement>(null);

  const filteredMedia = React.useMemo(() => {
    if (selectedAlbumId === "all") return media;
    return media.filter((item) => item.albumId === selectedAlbumId);
  }, [media, selectedAlbumId]);

  const activeImage = activeImageIndex !== null ? filteredMedia[activeImageIndex] : null;

  const handleClose = React.useCallback(() => {
    const returnIndex = originalTriggerIndexRef.current ?? activeImageIndex;
    setActiveImageIndex(null);
    setIsZoomed(false);
    if (returnIndex !== null && triggerRefs.current[returnIndex]) {
      triggerRefs.current[returnIndex]?.focus();
    }
  }, [activeImageIndex]);

  // Handle keyboard navigation, focus trap & inert background in Lightbox
  React.useEffect(() => {
    if (activeImageIndex === null) return;

    // Apply inert and aria-hidden to the background content
    const container = contentContainerRef.current;
    if (container) {
      container.inert = true;
      container.setAttribute("aria-hidden", "true");
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
        return;
      }

      if (e.key === "ArrowRight") {
        e.preventDefault();
        setIsZoomed(false);
        setActiveImageIndex((prev) =>
          prev !== null && prev < filteredMedia.length - 1 ? prev + 1 : 0,
        );
        return;
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setIsZoomed(false);
        setActiveImageIndex((prev) =>
          prev !== null && prev > 0 ? prev - 1 : filteredMedia.length - 1,
        );
        return;
      }

      // Focus containment / trap inside dialog
      if (e.key === "Tab") {
        const dialog = lightboxRef.current;
        if (!dialog) return;

        const focusableElements = dialog.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement && lastElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement && firstElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    // Set initial focus to close button
    const timeout = setTimeout(() => {
      const closeBtn = lightboxRef.current?.querySelector<HTMLButtonElement>("button[data-close]");
      closeBtn?.focus();
    }, 50);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      if (container) {
        container.inert = false;
        container.removeAttribute("aria-hidden");
      }
      clearTimeout(timeout);
    };
  }, [activeImageIndex, filteredMedia.length, handleClose]);

  return (
    <div>
      {/* Background Content Container (inert when modal is open) */}
      <div ref={contentContainerRef}>
        {/* Album Filters */}
        <div className="flex flex-wrap gap-2 mb-8" role="tablist" aria-label="Photo Albums">
          <button
            id="tab-all"
            type="button"
            role="tab"
            aria-selected={selectedAlbumId === "all"}
            aria-controls="gallery-photo-grid"
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
                id={`tab-${album.id}`}
                type="button"
                role="tab"
                aria-selected={isSelected}
                aria-controls="gallery-photo-grid"
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
        <div id="gallery-photo-grid" role="tabpanel" aria-label="Photo gallery collection">
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
                  onClick={() => {
                    originalTriggerIndexRef.current = idx;
                    setActiveImageIndex(idx);
                  }}
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
        </div>
      </div>

      {/* Accessible Lightbox Modal */}
      {activeImage && activeImageIndex !== null && (
        <div
          ref={lightboxRef}
          role="dialog"
          aria-modal="true"
          aria-label="Image preview modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        >
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close image preview overlay"
            tabIndex={-1}
            className="fixed inset-0 bg-black/85 backdrop-blur-md cursor-default w-full h-full border-0 p-0 focus:outline-none"
            onClick={handleClose}
          />
          <div className="relative max-w-5xl w-full flex flex-col items-center">
            {/* Header / Actions toolbar */}
            <div className="w-full flex justify-between items-center text-white mb-3">
              <span className="text-sm font-medium">
                Photo {activeImageIndex + 1} of {filteredMedia.length}
              </span>

              <div className="flex items-center gap-2">
                {/* Zoom toggle button */}
                <button
                  type="button"
                  onClick={() => setIsZoomed((z) => !z)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white cursor-pointer transition-colors"
                  aria-label={isZoomed ? "Zoom out photo" : "Zoom in photo"}
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    {isZoomed ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"
                      />
                    )}
                  </svg>
                  {isZoomed ? "Zoom Out" : "Zoom In"}
                </button>

                {/* Close button */}
                <button
                  type="button"
                  data-close="true"
                  onClick={handleClose}
                  className="rounded-full bg-white/20 p-2 text-white hover:bg-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white cursor-pointer transition-colors"
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
            </div>

            {/* Main Image container with Next/Prev controls */}
            <div className="relative w-full aspect-4/3 max-h-[75vh] flex items-center justify-center bg-black/60 rounded-xl overflow-hidden border border-white/10">
              <button
                type="button"
                className={`flex items-center justify-center w-full h-full overflow-auto transition-transform duration-200 border-0 bg-transparent p-0 focus:outline-none ${
                  isZoomed ? "cursor-zoom-out scale-150" : "cursor-zoom-in"
                }`}
                onClick={() => setIsZoomed((z) => !z)}
                aria-label="Toggle photo zoom"
              >
                <Image
                  src={activeImage.src}
                  alt={activeImage.alt}
                  width={activeImage.width || 800}
                  height={activeImage.height || 600}
                  priority
                  className="max-h-[70vh] w-auto max-w-full object-contain select-none"
                />
              </button>

              {/* Prev button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsZoomed(false);
                  setActiveImageIndex((prev) =>
                    prev !== null && prev > 0 ? prev - 1 : filteredMedia.length - 1,
                  );
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2.5 text-white hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white cursor-pointer transition-colors"
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
                onClick={(e) => {
                  e.stopPropagation();
                  setIsZoomed(false);
                  setActiveImageIndex((prev) =>
                    prev !== null && prev < filteredMedia.length - 1 ? prev + 1 : 0,
                  );
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2.5 text-white hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white cursor-pointer transition-colors"
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
              <p className="mt-3 text-center text-sm text-white/90 max-w-2xl px-4">
                {activeImage.caption}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
