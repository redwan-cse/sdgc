"use client";

import * as React from "react";
import Link from "next/link";
import { getMonthMatrix, formatEventTime } from "../calendar";
import type { EventSummary } from "../types";

interface EventMonthViewProps {
  events: EventSummary[];
  initialYear?: number;
  initialMonth?: number;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function EventMonthView({
  events,
  initialYear = 2026,
  initialMonth = 7, // Default July 2026 (Garden Walk month)
}: EventMonthViewProps) {
  const [year, setYear] = React.useState(initialYear);
  const [month, setMonth] = React.useState(initialMonth);

  const handlePrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const matrix = React.useMemo(() => {
    return getMonthMatrix(year, month, events);
  }, [year, month, events]);

  return (
    <div className="space-y-4">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-2xl font-bold text-foreground">
          {MONTH_NAMES[month - 1]} {year}
        </h2>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="rounded-md border border-border bg-card p-2 text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
            aria-label="Previous month"
          >
            <svg
              className="h-4 w-4"
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
          <button
            type="button"
            onClick={() => {
              setYear(2026);
              setMonth(7);
            }}
            className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted cursor-pointer"
          >
            Today / July &apos;26
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="rounded-md border border-border bg-card p-2 text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
            aria-label="Next month"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Responsive Calendar Grid */}
      <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-border bg-muted/50 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground py-2">
          {WEEKDAYS.map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 divide-x divide-y divide-border">
          {matrix.flatMap((week) =>
            week.map((cell) => (
              <div
                key={cell.date}
                className={`min-h-[90px] sm:min-h-[110px] p-1.5 sm:p-2 flex flex-col justify-between transition-colors ${
                  cell.isCurrentMonth
                    ? "bg-card text-foreground"
                    : "bg-muted/30 text-muted-foreground/60"
                } ${cell.isToday ? "ring-2 ring-inset ring-primary" : ""}`}
              >
                <div className="flex justify-between items-center">
                  <span
                    className={`text-xs font-semibold rounded-full h-5 w-5 flex items-center justify-center ${
                      cell.isToday ? "bg-primary text-primary-foreground" : "text-foreground"
                    }`}
                  >
                    {cell.dayNumber}
                  </span>
                  {cell.events.length > 0 && (
                    <span className="hidden sm:inline-block text-[10px] font-bold text-primary">
                      {cell.events.length} event{cell.events.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                <div className="mt-1 space-y-1">
                  {cell.events.map((e) => (
                    <Link
                      key={e.id}
                      href={`/event/${e.slug}`}
                      className="block truncate rounded bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary hover:bg-primary/20 transition-colors"
                      title={`${e.title} (${formatEventTime(e.startsAt)})`}
                    >
                      <span className="font-semibold">{formatEventTime(e.startsAt)}</span> {e.title}
                    </Link>
                  ))}
                </div>
              </div>
            )),
          )}
        </div>
      </div>
    </div>
  );
}
