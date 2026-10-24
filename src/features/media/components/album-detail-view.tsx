"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AlbumDetail } from "../types";

interface AlbumDetailViewProps {
  album: AlbumDetail;
}

export function AlbumDetailView({ album }: AlbumDetailViewProps) {
  const [activeImageIndex, setActiveImageIndex] = React.useState<number | null>(null);
  const [isZoomed, setIsZoomed] = React.useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const activeImage =
    activeImageIndex !== null && album.items[activeImageIndex]
      ? album.items[activeImageIndex]
      : null;

  // Handle URL hash / search params for deep linking to photo
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const photoId = params.get("photo");
      if (photoId) {
        const foundIndex = album.items.findIndex((item) => item.id === photoId);
        if (foundIndex !== -1) {
          setActiveImageIndex(foundIndex);
        }
      }
    }
  }, [album.items]);

  // Keyboard navigation for lightbox
  React.useEffect(() => {
    if (activeImageIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveImageIndex(null);
        setIsZoomed(false);
      } else if (e.key === "ArrowLeft") {
        setIsZoomed(false);
        setActiveImageIndex((prev) =>
          prev !== null && prev > 0 ? prev - 1 : album.items.length - 1,
        );
      } else if (e.key === "ArrowRight") {
        setIsZoomed(false);
        setActiveImageIndex((prev) =>
          prev !== null && prev < album.items.length - 1 ? prev + 1 : 0,
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeImageIndex, album.items.length]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${album.title} | SDGC Gallery`,
          text: album.description || `Browse photo memories from ${album.title}`,
          url: window.location.href,
        });
        return;
      } catch {
        // User cancelled or share failed, fallback to modal
      }
    }
    setIsShareModalOpen(true);
  };

  const currentUrl = typeof window !== "undefined" ? window.location.href : "";
  const encodedUrl = encodeURIComponent(currentUrl);
  const encodedTitle = encodeURIComponent(`${album.title} - Saugatuck-Douglas Garden Club`);

  return (
    <div className="space-y-8">
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/gallery"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
        >
          <svg
            className="h-4 w-4 transition-transform group-hover:-translate-x-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Gallery Archive
        </Link>

        {/* Share Button */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleNativeShare}
            className="gap-2 shadow-xs"
          >
            <svg
              className="h-4 w-4 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
            Share Album
          </Button>

          {album.items.length > 0 && (
            <Button
              type="button"
              size="sm"
              onClick={() => setActiveImageIndex(0)}
              className="gap-2 shadow-xs"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              View Slideshow
            </Button>
          )}
        </div>
      </div>

      {/* Album Header Banner */}
      <div className="rounded-3xl border border-border/80 bg-card/60 p-6 sm:p-8 backdrop-blur-xs shadow-xs space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {album.year && (
            <Badge variant="outline" className="font-semibold text-xs px-2.5 py-0.5">
              {album.year}
            </Badge>
          )}
          {album.category && (
            <Badge variant="secondary" className="font-medium text-xs px-2.5 py-0.5">
              {album.category}
            </Badge>
          )}
          <Badge variant="outline" className="text-muted-foreground text-xs px-2.5 py-0.5">
            {album.itemCount} {album.itemCount === 1 ? "photo" : "photos"}
          </Badge>
        </div>

        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
          {album.title}
        </h1>

        {album.description && (
          <p className="max-w-3xl text-base text-muted-foreground leading-relaxed">
            {album.description}
          </p>
        )}
      </div>

      {/* Photos Grid */}
      {album.items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center space-y-3">
          <p className="font-serif text-lg font-bold text-foreground">
            No photos in this album yet
          </p>
          <p className="text-sm text-muted-foreground">
            Club officers are curating and uploading photos for this collection.
          </p>
          <Link href="/gallery">
            <Button variant="outline" size="sm" className="mt-2">
              Explore other albums
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {album.items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              aria-haspopup="dialog"
              onClick={() => setActiveImageIndex(index)}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-card text-left transition-all duration-300 hover:shadow-lg hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
              aria-label={`View photo: ${item.caption || item.alt}`}
            >
              <div className="relative aspect-4/3 w-full overflow-hidden bg-muted">
                <Image
                  src={item.src}
                  alt={item.alt}
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex items-end p-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-xs">
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"
                      />
                    </svg>
                    Enlarge
                  </span>
                </div>
              </div>

              {item.caption && (
                <div className="p-3">
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {item.caption}
                  </p>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Share Modal Dialog */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="fixed inset-0 bg-black/60 backdrop-blur-xs border-0 p-0 cursor-default"
            onClick={() => setIsShareModalOpen(false)}
            aria-label="Close share overlay"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-modal-title"
            className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5"
          >
            <div className="flex items-center justify-between">
              <h2 id="share-modal-title" className="font-serif text-xl font-bold text-foreground">
                Share this Album
              </h2>
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Close dialog"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Anyone with this link can view all photographs and memories from{" "}
              <strong className="text-foreground">{album.title}</strong>.
            </p>

            {/* Direct Copy Input */}
            <div className="space-y-1.5">
              <label
                htmlFor="album-share-link-input"
                className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
              >
                Album Direct Link
              </label>
              <div className="flex gap-2">
                <input
                  id="album-share-link-input"
                  type="text"
                  readOnly
                  value={currentUrl}
                  className="w-full rounded-lg border border-input bg-muted/50 px-3 py-2 text-xs font-mono text-foreground focus:outline-none"
                />
                <Button
                  type="button"
                  onClick={handleCopyLink}
                  size="sm"
                  className="shrink-0 gap-1.5"
                >
                  {copied ? (
                    <>
                      <svg
                        className="h-4 w-4 text-emerald-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    "Copy"
                  )}
                </Button>
              </div>
            </div>

            {/* Social Shortcuts */}
            <div className="space-y-2 pt-2 border-t border-border">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Share on Social
              </span>
              <div className="grid grid-cols-3 gap-2">
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card p-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                >
                  Facebook
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card p-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                >
                  X (Twitter)
                </a>
                <a
                  href={`https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card p-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                >
                  WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Accessible Full-screen Lightbox */}
      {activeImage && activeImageIndex !== null && (
        <div
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
            onClick={() => {
              setActiveImageIndex(null);
              setIsZoomed(false);
            }}
          />

          <div className="relative max-w-5xl w-full flex flex-col items-center z-10">
            {/* Top Toolbar */}
            <div className="w-full flex justify-between items-center text-white mb-3">
              <span className="text-sm font-medium">
                Photo {activeImageIndex + 1} of {album.items.length}
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
                  onClick={() => {
                    setActiveImageIndex(null);
                    setIsZoomed(false);
                  }}
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

            {/* Main Image Container */}
            <div className="relative w-full aspect-4/3 max-h-[75vh] flex items-center justify-center bg-black/60 rounded-2xl overflow-hidden border border-white/10">
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
                  width={activeImage.width || 1200}
                  height={activeImage.height || 800}
                  priority
                  className="max-h-[70vh] w-auto max-w-full object-contain select-none"
                />
              </button>

              {/* Prev Button */}
              {album.items.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsZoomed(false);
                    setActiveImageIndex((prev) =>
                      prev !== null && prev > 0 ? prev - 1 : album.items.length - 1,
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
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}

              {/* Next Button */}
              {album.items.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsZoomed(false);
                    setActiveImageIndex((prev) =>
                      prev !== null && prev < album.items.length - 1 ? prev + 1 : 0,
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
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
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
