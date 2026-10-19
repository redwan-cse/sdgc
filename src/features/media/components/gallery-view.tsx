"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AlbumSummary, MediaItem } from "../types";

interface GalleryViewProps {
  albums: AlbumSummary[];
  media: MediaItem[];
}

export function GalleryView({ albums, media }: GalleryViewProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedYear, setSelectedYear] = React.useState<string>("all");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");
  const [selectedAlbumId, setSelectedAlbumId] = React.useState<string>("all");
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 9;

  // Lightbox state for photo stream
  const [activeImageIndex, setActiveImageIndex] = React.useState<number | null>(null);
  const [isZoomed, setIsZoomed] = React.useState(false);

  const triggerRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const originalTriggerIndexRef = React.useRef<number | null>(null);
  const lightboxRef = React.useRef<HTMLDivElement>(null);
  const contentContainerRef = React.useRef<HTMLDivElement>(null);

  // Extract distinct years and categories
  const years = React.useMemo(() => {
    const set = new Set<number>();
    for (const a of albums) {
      if (a.year) set.add(a.year);
    }
    return Array.from(set).sort((a, b) => b - a);
  }, [albums]);

  const categories = React.useMemo(() => {
    const set = new Set<string>();
    for (const a of albums) {
      if (a.category) set.add(a.category);
    }
    return Array.from(set).sort();
  }, [albums]);

  // Featured Album (top / first album with cover)
  const featuredAlbum = React.useMemo(() => {
    return albums.find((a) => a.coverImage) || albums[0] || null;
  }, [albums]);

  // Filtered albums for Archive Grid
  const filteredAlbums = React.useMemo(() => {
    return albums.filter((album) => {
      if (selectedAlbumId !== "all" && album.id !== selectedAlbumId) {
        return false;
      }
      if (selectedYear !== "all" && album.year?.toString() !== selectedYear) {
        return false;
      }
      if (selectedCategory !== "all" && album.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = album.title.toLowerCase().includes(q);
        const matchDesc = album.description?.toLowerCase().includes(q) ?? false;
        const matchCat = album.category?.toLowerCase().includes(q) ?? false;
        const matchYear = album.year?.toString().includes(q) ?? false;
        return matchTitle || matchDesc || matchCat || matchYear;
      }
      return true;
    });
  }, [albums, selectedAlbumId, selectedYear, selectedCategory, searchQuery]);

  // Filtered media for Photo Stream Grid
  const filteredMedia = React.useMemo(() => {
    return media.filter((item) => {
      if (selectedAlbumId !== "all" && item.albumId !== selectedAlbumId) {
        return false;
      }
      if (selectedYear !== "all" && item.year?.toString() !== selectedYear) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchCaption = item.caption?.toLowerCase().includes(q) ?? false;
        const matchAlt = item.alt?.toLowerCase().includes(q) ?? false;
        return matchCaption || matchAlt;
      }
      return true;
    });
  }, [media, selectedAlbumId, selectedYear, searchQuery]);

  // Pagination for albums
  const totalPages = Math.ceil(filteredAlbums.length / itemsPerPage) || 1;
  const paginatedAlbums = React.useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAlbums.slice(start, start + itemsPerPage);
  }, [filteredAlbums, currentPage]);

  // Reset page when filters change
  // biome-ignore lint/correctness/useExhaustiveDependencies: Reset page on filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedYear, selectedCategory, selectedAlbumId]);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedYear !== "all" ||
    selectedCategory !== "all" ||
    selectedAlbumId !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedYear("all");
    setSelectedCategory("all");
    setSelectedAlbumId("all");
  };

  const handleCloseLightbox = React.useCallback(() => {
    const returnIndex = originalTriggerIndexRef.current ?? activeImageIndex;
    setActiveImageIndex(null);
    setIsZoomed(false);
    if (returnIndex !== null && triggerRefs.current[returnIndex]) {
      triggerRefs.current[returnIndex]?.focus();
    }
  }, [activeImageIndex]);

  // Keyboard navigation & accessibility for lightbox
  React.useEffect(() => {
    if (activeImageIndex === null) return;

    const container = contentContainerRef.current;
    if (container) {
      container.inert = true;
      container.setAttribute("aria-hidden", "true");
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleCloseLightbox();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setIsZoomed(false);
        setActiveImageIndex((prev) =>
          prev !== null && prev > 0 ? prev - 1 : filteredMedia.length - 1,
        );
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setIsZoomed(false);
        setActiveImageIndex((prev) =>
          prev !== null && prev < filteredMedia.length - 1 ? prev + 1 : 0,
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (container) {
        container.inert = false;
        container.removeAttribute("aria-hidden");
      }
    };
  }, [activeImageIndex, filteredMedia.length, handleCloseLightbox]);

  const totalPhotoCount = React.useMemo(() => {
    return albums.reduce((acc, curr) => acc + curr.itemCount, 0) || media.length;
  }, [albums, media]);

  return (
    <div className="space-y-10">
      <div ref={contentContainerRef} className="space-y-10">
        {/* 1. JnUITS-Inspired Hero Archive Banner */}
        <div className="rounded-3xl border border-border/80 bg-card/60 p-6 sm:p-10 backdrop-blur-xs shadow-xs relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Text & Stats Column */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                  SDGC GALLERY ARCHIVE
                </span>
                <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-[1.15]">
                  Club Photo Gallery
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl">
                  Event albums, coastal blooms, and society memories by year preserved from the
                  Saugatuck-Douglas Garden Club public archive.
                </p>
              </div>

              {/* 3 Metric Stat Boxes */}
              <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-md pt-2">
                <div className="rounded-2xl border border-border/70 bg-card/80 p-4 text-center shadow-2xs">
                  <div className="font-serif text-2xl sm:text-3xl font-bold text-foreground">
                    {albums.length}
                  </div>
                  <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-0.5">
                    ALBUMS
                  </div>
                </div>

                <div className="rounded-2xl border border-border/70 bg-card/80 p-4 text-center shadow-2xs">
                  <div className="font-serif text-2xl sm:text-3xl font-bold text-foreground">
                    {totalPhotoCount}+
                  </div>
                  <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-0.5">
                    PHOTOS
                  </div>
                </div>

                <div className="rounded-2xl border border-border/70 bg-card/80 p-4 text-center shadow-2xs">
                  <div className="font-serif text-2xl sm:text-3xl font-bold text-foreground">
                    75
                  </div>
                  <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-0.5">
                    YEARS
                  </div>
                </div>
              </div>
            </div>

            {/* Right Featured Album Spotlight */}
            {featuredAlbum && (
              <div className="lg:col-span-5">
                <Link
                  href={`/gallery/${featuredAlbum.slug}`}
                  className="group relative block aspect-16/10 sm:aspect-4/3 w-full rounded-2xl overflow-hidden border border-border/80 shadow-md transition-all duration-300 hover:shadow-xl hover:border-primary/50"
                >
                  {featuredAlbum.coverImage ? (
                    <Image
                      src={featuredAlbum.coverImage.src}
                      alt={featuredAlbum.coverImage.alt || featuredAlbum.title}
                      fill
                      unoptimized={
                        featuredAlbum.coverImage.src.includes("127.0.0.1") ||
                        featuredAlbum.coverImage.src.includes("localhost")
                      }
                      sizes="(min-width: 1024px) 40vw, 100vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">
                      Featured Album
                    </div>
                  )}
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent flex flex-col justify-end p-5 sm:p-6 text-white">
                    <div className="flex items-center gap-2 mb-1.5">
                      {featuredAlbum.year && (
                        <span className="rounded-md bg-white/20 px-2 py-0.5 text-[11px] font-semibold tracking-wider text-white backdrop-blur-xs">
                          {featuredAlbum.year}
                        </span>
                      )}
                      {featuredAlbum.category && (
                        <span className="rounded-md bg-white/20 px-2 py-0.5 text-[11px] font-semibold tracking-wider text-white backdrop-blur-xs">
                          {featuredAlbum.category}
                        </span>
                      )}
                    </div>
                    <h2 className="font-serif text-lg sm:text-xl font-bold leading-tight group-hover:text-primary-foreground transition-colors">
                      {featuredAlbum.title}
                    </h2>
                    <p className="text-xs text-white/80 line-clamp-1 mt-1 font-light">
                      {featuredAlbum.description || "Click to browse all photos and memories"}
                    </p>
                  </div>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* 2. Search & Filter Bar with Album Quick-Tabs */}
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-xs space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-center">
            {/* Search Input */}
            <div className="md:col-span-6 relative">
              <svg
                className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <Input
                type="text"
                placeholder="Search by event, caption, category, or year..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 text-sm bg-background"
              />
            </div>

            {/* Year Dropdown */}
            <div className="md:col-span-3">
              <select
                aria-label="Filter albums by year"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
              >
                <option value="all">All years</option>
                {years.map((y) => (
                  <option key={y} value={y.toString()}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Dropdown */}
            <div className="md:col-span-3">
              <select
                aria-label="Filter albums by category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
              >
                <option value="all">All categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Album Quick Tabs (tablist) */}
          <div
            className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/60"
            role="tablist"
            aria-label="Photo Albums"
          >
            <button
              id="tab-all"
              type="button"
              role="tab"
              aria-selected={selectedAlbumId === "all"}
              aria-controls="gallery-photo-grid"
              onClick={() => {
                setSelectedAlbumId("all");
              }}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
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
                  onClick={() => {
                    setSelectedAlbumId(album.id);
                  }}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
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

          {/* Active Filter Pill & Reset */}
          {hasActiveFilters && (
            <div className="flex items-center justify-between pt-1 border-t border-border/40 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 font-semibold text-primary">
                FILTERS ACTIVE
              </span>
              <button
                type="button"
                onClick={clearFilters}
                className="hover:text-foreground underline underline-offset-4 cursor-pointer"
              >
                Reset all filters
              </button>
            </div>
          )}
        </div>

        {/* 3. Albums Archive Grid */}
        <div className="space-y-6">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              ALBUMS
            </span>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-foreground">
                Browse the Archive
              </h2>
              <span className="text-xs text-muted-foreground">
                Showing {filteredAlbums.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}-
                {Math.min(currentPage * itemsPerPage, filteredAlbums.length)} of{" "}
                {filteredAlbums.length} albums
              </span>
            </div>
          </div>

          {filteredAlbums.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center space-y-3">
              <p className="font-serif text-lg font-bold text-foreground">
                No albums match your filter
              </p>
              <p className="text-sm text-muted-foreground">
                Try selecting &quot;All years&quot; or clearing your search term.
              </p>
              <Button type="button" variant="outline" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {paginatedAlbums.map((album) => (
                <Link
                  key={album.id}
                  href={`/gallery/${album.slug}`}
                  className="group flex flex-col rounded-2xl border border-border/80 bg-card overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-primary/40 hover:-translate-y-1"
                >
                  {/* Cover Image Container */}
                  <div className="relative aspect-16/10 w-full overflow-hidden bg-muted">
                    {album.coverImage ? (
                      <Image
                        src={album.coverImage.src}
                        alt={album.coverImage.alt || album.title}
                        fill
                        unoptimized={
                          album.coverImage.src.includes("127.0.0.1") ||
                          album.coverImage.src.includes("localhost")
                        }
                        sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                        No cover photograph
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex flex-col flex-1 space-y-3">
                    {/* Meta Badge Row */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {album.year && (
                        <Badge variant="outline" className="text-[11px] font-semibold px-2 py-0.5">
                          {album.year}
                        </Badge>
                      )}
                      {album.category && (
                        <Badge variant="secondary" className="text-[11px] font-medium px-2 py-0.5">
                          {album.category}
                        </Badge>
                      )}
                      <Badge
                        variant="outline"
                        className="text-[11px] text-muted-foreground px-2 py-0.5"
                      >
                        {album.itemCount} {album.itemCount === 1 ? "photo" : "photos"}
                      </Badge>
                    </div>

                    <div className="space-y-1 flex-1">
                      <h3 className="font-serif text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                        {album.title}
                      </h3>
                      {album.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {album.description}
                        </p>
                      )}
                    </div>

                    {/* Card Link Footer */}
                    <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs text-primary font-semibold">
                      <span>Explore Album</span>
                      <svg
                        className="h-4 w-4 transition-transform group-hover:translate-x-1"
                        aria-hidden="true"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M14 5l7 7m0 0l-7 7m7-7H3"
                        />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              {Array.from({ length: totalPages }).map((_, i) => {
                const pageNum = i + 1;
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "primary" : "outline"}
                    size="sm"
                    className="w-9 p-0"
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          )}
        </div>

        {/* 4. Society Photographs Stream & Grid */}
        <div
          id="gallery-photo-grid"
          role="tabpanel"
          aria-label="Photo gallery collection"
          className="space-y-6 pt-6 border-t border-border/60"
        >
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              PHOTO STREAM
            </span>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-foreground">
                Society Photographs ({filteredMedia.length})
              </h2>
              <span className="text-xs text-muted-foreground">
                Click any photo to enlarge in full-screen Lightbox
              </span>
            </div>
          </div>

          {filteredMedia.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
              No photos found in this view.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {filteredMedia.map((item, index) => (
                <button
                  key={item.id}
                  ref={(el) => {
                    triggerRefs.current[index] = el;
                  }}
                  type="button"
                  aria-haspopup="dialog"
                  onClick={() => {
                    originalTriggerIndexRef.current = index;
                    setActiveImageIndex(index);
                  }}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-card text-left transition-all duration-300 hover:shadow-lg hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
                  aria-label={`View photo: ${item.caption || item.alt}`}
                >
                  <div className="relative aspect-4/3 w-full overflow-hidden bg-muted">
                    <Image
                      src={item.src}
                      alt={item.alt}
                      fill
                      unoptimized={item.src.includes("127.0.0.1") || item.src.includes("localhost")}
                      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex items-end p-3">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-xs">
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
        </div>
      </div>

      {/* Accessible Lightbox Modal */}
      {activeImageIndex !== null && filteredMedia[activeImageIndex] && (
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
            onClick={handleCloseLightbox}
          />

          <div className="relative max-w-5xl w-full flex flex-col items-center z-10">
            {/* Top Bar */}
            <div className="w-full flex justify-between items-center text-white mb-3 px-1">
              <span className="text-sm font-medium">
                Photo {activeImageIndex + 1} of {filteredMedia.length}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsZoomed((z) => !z)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/30 cursor-pointer transition-colors"
                  aria-label={isZoomed ? "Zoom out" : "Zoom in"}
                >
                  {isZoomed ? "Zoom Out" : "Zoom In"}
                </button>
                <button
                  type="button"
                  data-close="true"
                  onClick={handleCloseLightbox}
                  className="rounded-full bg-white/20 p-2 text-white hover:bg-white/30 cursor-pointer transition-colors"
                  aria-label="Close lightbox"
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Main Image container with Next/Prev controls */}
            <div className="relative w-full aspect-4/3 max-h-[75vh] flex items-center justify-center bg-black/60 rounded-2xl overflow-hidden border border-white/10">
              <button
                type="button"
                className={`flex items-center justify-center w-full h-full border-0 bg-transparent p-0 focus:outline-none ${
                  isZoomed ? "cursor-zoom-out scale-150" : "cursor-zoom-in"
                }`}
                onClick={() => setIsZoomed((z) => !z)}
                aria-label="Toggle photo zoom"
              >
                <Image
                  src={filteredMedia[activeImageIndex].src}
                  alt={filteredMedia[activeImageIndex].alt}
                  width={filteredMedia[activeImageIndex].width || 1200}
                  height={filteredMedia[activeImageIndex].height || 800}
                  unoptimized={
                    filteredMedia[activeImageIndex].src.includes("127.0.0.1") ||
                    filteredMedia[activeImageIndex].src.includes("localhost")
                  }
                  priority
                  className="max-h-[70vh] w-auto max-w-full object-contain select-none transition-transform duration-200"
                />
              </button>

              {/* Prev button */}
              {filteredMedia.length > 1 && (
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
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}

              {/* Next button */}
              {filteredMedia.length > 1 && (
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
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>

            {/* Caption */}
            {filteredMedia[activeImageIndex].caption && (
              <p className="mt-3 text-center text-sm text-white/90 max-w-2xl px-4">
                {filteredMedia[activeImageIndex].caption}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
