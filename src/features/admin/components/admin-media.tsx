"use client";

import * as React from "react";
import Image from "next/image";
import type { MediaItem, AlbumSummary } from "@/features/media/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { createMediaAssetAction, updateMediaAssetAction, deleteMediaAssetAction } from "../actions";

interface AdminMediaProps {
  initialMedia?: MediaItem[];
  initialAlbums?: AlbumSummary[];
}

export function AdminMedia({ initialMedia = [], initialAlbums = [] }: AdminMediaProps) {
  const [mediaList, setMediaList] = React.useState<MediaItem[]>(initialMedia);
  const [albums] = React.useState<AlbumSummary[]>(initialAlbums);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [isError, setIsError] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Upload/Create modal state
  const [isUploadOpen, setIsUploadOpen] = React.useState(false);
  const [newStoragePath, setNewStoragePath] = React.useState("");
  const [newAltText, setNewAltText] = React.useState("");
  const [newCaption, setNewCaption] = React.useState("");
  const [newIsPublic, setNewIsPublic] = React.useState(true);

  // Edit modal state
  const [editingItem, setEditingItem] = React.useState<MediaItem | null>(null);
  const [editAltText, setEditAltText] = React.useState("");
  const [editCaption, setEditCaption] = React.useState("");
  const [editIsPublic, setEditIsPublic] = React.useState(true);

  React.useEffect(() => {
    setMediaList(initialMedia);
  }, [initialMedia]);

  const handleCreateMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoragePath.trim() || !newAltText.trim()) return;

    setIsSubmitting(true);
    setIsError(false);
    try {
      const res = await createMediaAssetAction({
        storagePath: newStoragePath.trim(),
        altText: newAltText.trim(),
        caption: newCaption.trim() || undefined,
        isPublic: newIsPublic,
      });

      if (res.success && res.data) {
        const createdId = (res.data as { id: string }).id;
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
        const newSrc = `${supabaseUrl}/storage/v1/object/public/club-media/${newStoragePath.trim()}`;

        setMediaList((prev) => [
          {
            id: createdId,
            src: newSrc,
            width: 1200,
            height: 800,
            alt: newAltText.trim(),
            caption: newCaption.trim() || undefined,
            isPublic: newIsPublic,
            storagePath: newStoragePath.trim(),
          },
          ...prev,
        ]);
        setNotice(`Media asset "${newAltText}" created successfully.`);
        setIsUploadOpen(false);
        setNewStoragePath("");
        setNewAltText("");
        setNewCaption("");
      } else {
        setIsError(true);
        setNotice(`Failed to save media asset: ${res.error}`);
      }
    } catch (err: unknown) {
      setIsError(true);
      setNotice(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (item: MediaItem) => {
    setEditingItem(item);
    setEditAltText(item.alt);
    setEditCaption(item.caption || "");
    setEditIsPublic(item.isPublic ?? true);
  };

  const handleUpdateMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editAltText.trim()) return;

    setIsSubmitting(true);
    setIsError(false);
    try {
      const res = await updateMediaAssetAction({
        id: editingItem.id,
        altText: editAltText.trim(),
        caption: editCaption.trim() || undefined,
        isPublic: editIsPublic,
      });

      if (res.success) {
        setMediaList((prev) =>
          prev.map((item) =>
            item.id === editingItem.id
              ? {
                  ...item,
                  alt: editAltText.trim(),
                  caption: editCaption.trim() || undefined,
                  isPublic: editIsPublic,
                }
              : item,
          ),
        );
        setNotice(`Media asset "${editAltText}" updated.`);
        setEditingItem(null);
      } else {
        setIsError(true);
        setNotice(`Failed to update media: ${res.error}`);
      }
    } catch (err: unknown) {
      setIsError(true);
      setNotice(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMedia = async (id: string, alt: string) => {
    if (!confirm(`Are you sure you want to remove "${alt}"?`)) return;

    setIsSubmitting(true);
    setIsError(false);
    try {
      const res = await deleteMediaAssetAction(id);
      if (res.success) {
        setMediaList((prev) => prev.filter((item) => item.id !== id));
        setNotice(`Media asset "${alt}" deleted.`);
      } else {
        setIsError(true);
        setNotice(`Failed to delete media: ${res.error}`);
      }
    } catch (err: unknown) {
      setIsError(true);
      setNotice(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

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

        <Button onClick={() => setIsUploadOpen(true)}>+ Add Media Asset</Button>
      </div>

      {notice && (
        <div
          className={`rounded-lg p-3 text-xs border ${
            isError
              ? "bg-rose-50 dark:bg-rose-950/30 border-rose-600/30 text-rose-800 dark:text-rose-300"
              : "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-600/30 text-emerald-800 dark:text-emerald-300"
          }`}
          role="status"
        >
          {notice}
        </div>
      )}

      {/* Albums Summary */}
      {albums.length > 0 && (
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
      )}

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
                <th className="p-4">Visibility</th>
                <th className="p-4">Storage Path</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {mediaList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground text-xs">
                    No media assets found. Click &quot;Add Media Asset&quot; to register new photos.
                  </td>
                </tr>
              ) : (
                mediaList.map((item) => (
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
                    <td className="p-4 text-xs">
                      {item.isPublic !== false ? (
                        <Badge variant="success">Public</Badge>
                      ) : (
                        <Badge variant="outline">Hidden</Badge>
                      )}
                    </td>
                    <td className="p-4 font-mono text-[11px] text-muted-foreground">
                      {item.storagePath || "external"}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isSubmitting}
                        onClick={() => handleOpenEdit(item)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={isSubmitting}
                        onClick={() => handleDeleteMedia(item.id, item.alt)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload/Add Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4">
            <h2 className="font-serif text-xl font-bold text-foreground">Add New Media Asset</h2>
            <p className="text-xs text-muted-foreground">
              Register a photo stored in the club storage bucket or gallery collection.
            </p>

            <form onSubmit={handleCreateMedia} className="space-y-4 pt-2">
              <div>
                <label
                  htmlFor="new-storage-path"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                >
                  Storage Path *
                </label>
                <Input
                  id="new-storage-path"
                  required
                  placeholder="e.g. gallery/rose-garden-2026.jpg"
                  value={newStoragePath}
                  onChange={(e) => setNewStoragePath(e.target.value)}
                />
              </div>

              <div>
                <label
                  htmlFor="new-alt-text"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                >
                  Accessibility Alt Text *
                </label>
                <Input
                  id="new-alt-text"
                  required
                  placeholder="Descriptive label for screen readers"
                  value={newAltText}
                  onChange={(e) => setNewAltText(e.target.value)}
                />
              </div>

              <div>
                <label
                  htmlFor="new-caption"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                >
                  Caption (Optional)
                </label>
                <Input
                  id="new-caption"
                  placeholder="Public display caption"
                  value={newCaption}
                  onChange={(e) => setNewCaption(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="new-is-public"
                  type="checkbox"
                  checked={newIsPublic}
                  onChange={(e) => setNewIsPublic(e.target.checked)}
                  className="rounded border border-input"
                />
                <label htmlFor="new-is-public" className="text-xs text-foreground font-medium">
                  Visible to public gallery visitors
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsUploadOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  Save Asset
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4">
            <h2 className="font-serif text-xl font-bold text-foreground">Edit Media Asset</h2>
            <p className="text-xs text-muted-foreground">
              Update accessibility alt text, public caption, and visibility status.
            </p>

            <form onSubmit={handleUpdateMedia} className="space-y-4 pt-2">
              <div>
                <label
                  htmlFor="edit-alt-text"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                >
                  Accessibility Alt Text *
                </label>
                <Input
                  id="edit-alt-text"
                  required
                  value={editAltText}
                  onChange={(e) => setEditAltText(e.target.value)}
                />
              </div>

              <div>
                <label
                  htmlFor="edit-caption"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                >
                  Caption
                </label>
                <Input
                  id="edit-caption"
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="edit-is-public"
                  type="checkbox"
                  checked={editIsPublic}
                  onChange={(e) => setEditIsPublic(e.target.checked)}
                  className="rounded border border-input"
                />
                <label htmlFor="edit-is-public" className="text-xs text-foreground font-medium">
                  Visible to public gallery visitors
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingItem(null)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
