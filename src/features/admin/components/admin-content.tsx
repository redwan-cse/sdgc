"use client";

import * as React from "react";
import type { Route } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PageRow {
  slug: string;
  title: string;
  url: string;
  lastUpdated: string;
  status: "published" | "draft";
}

const PAGES: PageRow[] = [
  { slug: "home", title: "Homepage", url: "/", lastUpdated: "2026-10-15", status: "published" },
  {
    slug: "about",
    title: "About Our Club",
    url: "/about",
    lastUpdated: "2026-10-15",
    status: "published",
  },
  {
    slug: "garden-walk",
    title: "Annual Garden Walk",
    url: "/garden-walk",
    lastUpdated: "2026-10-15",
    status: "published",
  },
  {
    slug: "membership",
    title: "Membership & Dues Policy",
    url: "/membership",
    lastUpdated: "2026-10-15",
    status: "published",
  },
];

export function AdminContent() {
  const [notice, setNotice] = React.useState<string | null>(null);

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
          className="rounded-lg bg-primary/10 border border-primary/20 p-3 text-xs text-primary"
          role="status"
        >
          {notice}
        </div>
      )}

      <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        <div className="p-4 border-b border-border font-semibold text-sm">Managed Club Pages</div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="p-4">Page Title</th>
                <th className="p-4">Route Path</th>
                <th className="p-4">Status</th>
                <th className="p-4">Last Updated</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {PAGES.map((p) => (
                <tr key={p.slug} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-semibold text-foreground">{p.title}</td>
                  <td className="p-4 font-mono text-xs text-muted-foreground">
                    <Link href={p.url as Route} className="hover:underline">
                      {p.url}
                    </Link>
                  </td>
                  <td className="p-4">
                    <Badge variant="success">Published</Badge>
                  </td>
                  <td className="p-4 text-xs text-muted-foreground">{p.lastUpdated}</td>
                  <td className="p-4 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setNotice(`Editing content sections for: ${p.title}`)}
                    >
                      Edit Content
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
