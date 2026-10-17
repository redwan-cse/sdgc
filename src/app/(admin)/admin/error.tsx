"use client";

import { useEffect } from "react";
import Link from "next/link";
import type { Route } from "next";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Administrative Workspace Error:", error.message);
  }, [error]);

  return (
    <div
      role="alert"
      className="rounded-2xl border border-destructive/20 bg-card p-8 text-center shadow-sm space-y-6"
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>

      <div className="space-y-2">
        <h2 className="font-serif text-2xl font-bold text-foreground">
          Administrative Module Error
        </h2>
        <p className="text-sm text-muted-foreground">
          A failure occurred while communicating with the administrative data layer. Please check
          your network connection and session status.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Retry Admin Operation
        </button>
        <Link
          href={"/admin" as Route}
          className="rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
        >
          Back to Overview
        </Link>
      </div>
    </div>
  );
}
