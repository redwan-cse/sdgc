"use client";

import * as React from "react";
import Image from "next/image";
import { FIXTURE_MEDIA, FIXTURE_ALBUMS } from "../../../../tests/fixtures/public-content";
import type { MediaItem, AlbumSummary } from "@/features/media/types";
import { Button } from "@/components/ui/button";

export function AdminMedia() {
  const [mediaList] = React.useState<MediaItem[]>(FIXTURE_MEDIA);
  const [albums] = React.useState<AlbumSummary[]>(FIXTURE_ALBUMS);
  const [notice, setNotice] = React.useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">
            Media Library & Gallery Curation
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload garden photographs, manage albums, organize display order, and configure
            accessibility alt text.
          </p>
        </div>

        <Button
          onClick={() =>
            setNotice(
              "Photo upload dialog: In Phase 3/5 this handles uploads directly to Supabase Storage media bucket.",
            )
          }
        >
          + Upload Photos
        </Button>
      </div>

      {notice && (
        <div
          className="rounded-lg bg-primary/10 border border-primary/20 p-3 text-xs text-primary"
          role="status"
        >
          {notice}
        </div>
      )}

      {/* Albums Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {albums.map((album) => (
          <div
            key={album.id}
            className="rounded-xl border border-border bg-card p-4 shadow-xs flex justify-between items-center"
          >
            <div>
              <h2 className="font-serif font-bold text-foreground text-base">{album.title}</h2>
              <p className="text-xs text-muted-foreground">{album.description}</p>
            </div>
            <span className="text-xs font-semibold bg-muted px-2.5 py-1 rounded-full text-muted-foreground">
              {album.itemCount} photos
            </span>
          </div>
        ))}
      </div>

      {/* Media Items Table */}
      <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        <div className="p-4 border-b border-border font-semibold text-sm">
          All Media Assets ({mediaList.length})
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="p-4">Thumbnail</th>
                <th className="p-4">Alt Text & Description</th>
                <th className="p-4">Year</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {mediaList.map((item) => (
                <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4">
                    <div className="h-12 w-12 rounded-md overflow-hidden bg-muted border border-border">
                      <Image
                        src={item.src}
                        alt={item.alt}
                        width={48}
                        height={48}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="font-medium text-foreground block text-xs">{item.alt}</span>
                    {item.caption && (
                      <span className="text-[11px] text-muted-foreground">{item.caption}</span>
                    )}
                  </td>
                  <td className="p-4 text-xs text-muted-foreground">{item.year || "2026"}</td>
                  <td className="p-4 text-right space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setNotice(`Editing alt text for: ${item.id}`)}
                    >
                      Edit Alt/Caption
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
