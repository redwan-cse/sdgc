"use client";

import * as React from "react";
import type { Route } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { AdminPageRecord } from "../types";
import { updatePageAction } from "../actions";

interface AdminContentProps {
  initialPages: AdminPageRecord[];
}

export function AdminContent({ initialPages }: AdminContentProps) {
  const [pages, setPages] = React.useState<AdminPageRecord[]>(initialPages);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [isError, setIsError] = React.useState(false);
  const [editingPage, setEditingPage] = React.useState<AdminPageRecord | null>(null);
  const [editTitle, setEditTitle] = React.useState("");
  const [editSubtitle, setEditSubtitle] = React.useState("");
  const [editStatus, setEditStatus] = React.useState<"published" | "draft">("published");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    setPages(initialPages);
  }, [initialPages]);

  const handleOpenEdit = (p: AdminPageRecord) => {
    setEditingPage(p);
    setEditTitle(p.title);
    setEditSubtitle(p.subtitle || "");
    setEditStatus(p.status);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPage || !editTitle.trim()) return;

    setIsSubmitting(true);
    setIsError(false);
    try {
      const res = await updatePageAction(editingPage.slug, {
        title: editTitle.trim(),
        subtitle: editSubtitle.trim() || undefined,
        status: editStatus,
      });

      if (res.success) {
        setPages((prev) =>
          prev.map((p) =>
            p.slug === editingPage.slug
              ? {
                  ...p,
                  title: editTitle.trim(),
                  subtitle: editSubtitle.trim() || undefined,
                  status: editStatus,
                  updatedAt: new Date().toISOString(),
                }
              : p,
          ),
        );
        setNotice(`Page copy for "${editTitle}" updated successfully.`);
        setEditingPage(null);
      } else {
        setIsError(true);
        setNotice(`Failed to update page: ${res.error}`);
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
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground">Page Content & Site Copy</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage static structured page copy, community mission statements, and civic program
          highlights.
        </p>
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

      <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        <div className="p-4 border-b border-border font-semibold text-sm">
          Managed Club Pages ({pages.length})
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="p-4">Page Title</th>
                <th className="p-4">Slug / Path</th>
                <th className="p-4">Status</th>
                <th className="p-4">Last Updated</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pages.map((p) => {
                const url = p.slug === "home" ? "/" : `/${p.slug}`;
                return (
                  <tr key={p.slug} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <span className="font-semibold text-foreground block">{p.title}</span>
                      {p.subtitle && (
                        <span className="text-xs text-muted-foreground block truncate max-w-xs">
                          {p.subtitle}
                        </span>
                      )}
                    </td>
                    <td className="p-4 font-mono text-xs text-muted-foreground">
                      <Link href={url as Route} className="hover:underline">
                        {url}
                      </Link>
                    </td>
                    <td className="p-4">
                      {p.status === "published" ? (
                        <Badge variant="success">Published</Badge>
                      ) : (
                        <Badge variant="outline">Draft</Badge>
                      )}
                    </td>
                    <td className="p-4 text-xs text-muted-foreground">
                      {new Date(p.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <Button size="sm" variant="outline" onClick={() => handleOpenEdit(p)}>
                        Edit Copy
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Page Edit Modal */}
      {editingPage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4">
            <h2 className="font-serif text-xl font-bold text-foreground">
              Edit Page: {editingPage.slug}
            </h2>
            <form onSubmit={handleSave} className="space-y-4 pt-2">
              <div>
                <label
                  htmlFor="edit-page-title"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                >
                  Page Title *
                </label>
                <Input
                  id="edit-page-title"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              </div>

              <div>
                <label
                  htmlFor="edit-page-subtitle"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                >
                  Subtitle / Mission Lead
                </label>
                <textarea
                  id="edit-page-subtitle"
                  rows={3}
                  value={editSubtitle}
                  onChange={(e) => setEditSubtitle(e.target.value)}
                  className="w-full rounded-md border border-input bg-background p-3 text-sm text-foreground shadow-xs focus:ring-primary focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="edit-page-status"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                >
                  Status
                </label>
                <select
                  id="edit-page-status"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as "published" | "draft")}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft (Hidden)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingPage(null)}
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
