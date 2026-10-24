"use client";

import * as React from "react";
import Link from "next/link";
import type { Route } from "next";
import type { Notice } from "../types";

interface NoticeDetailProps {
  notice: Notice;
}

export function NoticeDetail({ notice }: NoticeDetailProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Non-blocking
    }
  };

  const formattedDate = new Date(notice.publishedAt).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <article className="space-y-8 max-w-4xl mx-auto">
      {/* Back Link & Meta Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-4">
        <Link
          href={"/notices" as Route}
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; Back to Notice Board
        </Link>

        <button
          type="button"
          onClick={handleCopyLink}
          className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
        >
          {copied ? "Link Copied!" : "Share Notice"}
        </button>
      </div>

      {/* Main Notice Article */}
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-10 shadow-xs space-y-6">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
              {notice.category}
            </span>
            {notice.isPinned && (
              <span className="text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-500/15 border border-amber-500/30 px-3 py-1 rounded-full">
                ★ Pinned Announcement
              </span>
            )}
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
            {notice.title}
          </h1>

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1">
            <span>Published {formattedDate}</span>
            <span>&bull;</span>
            <span>{notice.authorName ? `Posted by ${notice.authorName}` : "Club Officers"}</span>
          </div>
        </div>

        {notice.excerpt && (
          <div className="rounded-2xl border-l-4 border-primary bg-primary/5 p-4 text-sm font-medium text-foreground leading-relaxed">
            {notice.excerpt}
          </div>
        )}

        {/* Content Body with whitespace preservation & typography */}
        <div className="prose prose-neutral dark:prose-invert max-w-none text-foreground leading-relaxed text-sm sm:text-base whitespace-pre-line pt-2">
          {notice.content}
        </div>

        {/* Footer info & inquiries */}
        <div className="border-t border-border/60 pt-6 mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>
            Questions regarding this announcement? Reach out through our{" "}
            <Link href={"/contact" as Route} className="text-primary font-semibold hover:underline">
              Contact Page
            </Link>
            .
          </p>
          <Link
            href={"/notices" as Route}
            className="text-xs font-bold text-primary hover:underline"
          >
            &larr; View All Club Notices
          </Link>
        </div>
      </div>
    </article>
  );
}
