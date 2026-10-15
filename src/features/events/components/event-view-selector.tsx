"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { EventCalendarView } from "../types";

interface EventViewSelectorProps {
  currentView: EventCalendarView;
  selectedMonth?: string; // YYYY-MM
  onMonthChange?: (newMonth: string) => void;
}

export function EventViewSelector({ currentView }: EventViewSelectorProps) {
  const pathname = usePathname();

  const views: { view: EventCalendarView; label: string; href: Route }[] = [
    { view: "list", label: "List View", href: "/events" },
    { view: "month", label: "Month Calendar", href: "/events/month" },
    { view: "day", label: "Day Schedule", href: "/events/day" },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4 mb-6">
      <div className="flex items-center space-x-1 rounded-lg border border-border bg-card p-1 shadow-2xs">
        {views.map((v) => {
          const isActive = pathname === v.href || currentView === v.view;
          return (
            <Link
              key={v.view}
              href={v.href}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {v.label}
            </Link>
          );
        })}
      </div>

      <div className="text-xs text-muted-foreground">
        Times displayed in{" "}
        <span className="font-semibold text-foreground">America/Detroit (EST/EDT)</span>
      </div>
    </div>
  );
}
