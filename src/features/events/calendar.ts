import type { EventSummary } from "./types";

export const CLUB_TIMEZONE = "America/Detroit";

export function formatEventDateTime(
  isoString: string,
  timeZone: string = CLUB_TIMEZONE,
  options?: Intl.DateTimeFormatOptions,
): string {
  const date = new Date(isoString);
  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone,
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    ...options,
  };
  return new Intl.DateTimeFormat("en-US", defaultOptions).format(date);
}

export function formatEventDate(isoString: string, timeZone: string = CLUB_TIMEZONE): string {
  const date = new Date(isoString);
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatEventTime(isoString: string, timeZone: string = CLUB_TIMEZONE): string {
  const date = new Date(isoString);
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export interface CalendarDay {
  date: string; // YYYY-MM-DD
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: EventSummary[];
}

export function getMonthMatrix(
  year: number,
  month: number, // 1-12
  events: EventSummary[],
  timeZone: string = CLUB_TIMEZONE,
): CalendarDay[][] {
  const firstDayOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const startDayOfWeek = firstDayOfMonth.getUTCDay(); // 0 = Sunday

  // Days in month
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const prevMonthDays = new Date(Date.UTC(year, month - 1, 0)).getUTCDate();

  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const weeks: CalendarDay[][] = [];
  let currentWeek: CalendarDay[] = [];

  // Previous month trailing days
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const dayNum = prevMonthDays - i;
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const dateStr = `${prevYear}-${String(prevMonth).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
    currentWeek.push({
      date: dateStr,
      dayNumber: dayNum,
      isCurrentMonth: false,
      isToday: dateStr === today,
      events: events.filter((e) => e.startsAt.startsWith(dateStr)),
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    currentWeek.push({
      date: dateStr,
      dayNumber: d,
      isCurrentMonth: true,
      isToday: dateStr === today,
      events: events.filter((e) => e.startsAt.startsWith(dateStr)),
    });

    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  // Next month leading days to complete the grid
  if (currentWeek.length > 0) {
    let nextDay = 1;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    while (currentWeek.length < 7) {
      const dateStr = `${nextYear}-${String(nextMonth).padStart(2, "0")}-${String(nextDay).padStart(2, "0")}`;
      currentWeek.push({
        date: dateStr,
        dayNumber: nextDay,
        isCurrentMonth: false,
        isToday: dateStr === today,
        events: events.filter((e) => e.startsAt.startsWith(dateStr)),
      });
      nextDay++;
    }
    weeks.push(currentWeek);
  }

  return weeks;
}
