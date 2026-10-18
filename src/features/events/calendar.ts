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

export function getDetroitDateString(isoString: string, timeZone: string = CLUB_TIMEZONE): string {
  const date = new Date(isoString);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function eventOccursOnDate(
  event: EventSummary,
  targetDateStr: string, // YYYY-MM-DD
  timeZone: string = CLUB_TIMEZONE,
): boolean {
  const startDateStr = getDetroitDateString(event.startsAt, timeZone);

  const startDate = new Date(event.startsAt);
  const endDate = new Date(event.endsAt);

  // If endsAt is before or equal to startsAt, it only occurs on startDate
  if (endDate.getTime() <= startDate.getTime()) {
    return startDateStr === targetDateStr;
  }

  // Adjust end date by 1 millisecond to handle midnight boundaries (e.g. 00:00 concluding the prior day)
  const adjustedEndIso = new Date(endDate.getTime() - 1).toISOString();
  const endDateStr = getDetroitDateString(adjustedEndIso, timeZone);

  return startDateStr <= targetDateStr && targetDateStr <= endDateStr;
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
      events: events.filter((e) => eventOccursOnDate(e, dateStr, timeZone)),
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
      events: events.filter((e) => eventOccursOnDate(e, dateStr, timeZone)),
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
        events: events.filter((e) => eventOccursOnDate(e, dateStr, timeZone)),
      });
      nextDay++;
    }
    weeks.push(currentWeek);
  }

  return weeks;
}

/**
 * Formats a UTC ISO string into a datetime-local input string (YYYY-MM-DDTHH:mm)
 * strictly in the America/Detroit timezone regardless of the user's browser location.
 */
export function formatDetroitDateTimeLocal(isoString: string): string {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return "";

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: CLUB_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(d);
  const partMap: Record<string, string> = {};
  for (const p of parts) {
    partMap[p.type] = p.value;
  }

  const hour = partMap.hour === "24" ? "00" : partMap.hour;
  return `${partMap.year}-${partMap.month}-${partMap.day}T${hour}:${partMap.minute}`;
}

/**
 * Parses a datetime-local input string (YYYY-MM-DDTHH:mm) representing America/Detroit wall time
 * into a UTC ISO string, accurately accounting for EDT/EST daylight saving time boundaries.
 */
export function parseDetroitDateTimeLocal(dateTimeLocalStr: string): string {
  if (!dateTimeLocalStr) return "";
  const [datePart, timePart] = dateTimeLocalStr.split("T");
  if (!datePart || !timePart) return "";
  const dateSegments = datePart.split("-").map(Number);
  const timeSegments = timePart.split(":").map(Number);
  const year = dateSegments[0] ?? 2026;
  const month = dateSegments[1] ?? 1;
  const day = dateSegments[2] ?? 1;
  const hour = timeSegments[0] ?? 0;
  const minute = timeSegments[1] ?? 0;

  // Guess UTC timestamp by treating wall time as UTC
  const guessUtc = Date.UTC(year, month - 1, day, hour, minute);

  // Measure the offset in Detroit at guessUtc
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: CLUB_TIMEZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  });

  const detroitParts = formatter.formatToParts(new Date(guessUtc));
  const pMap: Record<string, number> = {};
  for (const p of detroitParts) {
    if (p.type !== "literal") pMap[p.type] = Number(p.value);
  }

  const pYear = pMap.year ?? year;
  const pMonth = pMap.month ?? month;
  const pDay = pMap.day ?? day;
  const pHour = pMap.hour === 24 ? 0 : (pMap.hour ?? hour);
  const pMinute = pMap.minute ?? minute;
  const pSecond = pMap.second ?? 0;

  const detroitUtcTime = Date.UTC(pYear, pMonth - 1, pDay, pHour, pMinute, pSecond);
  const offsetMs = detroitUtcTime - guessUtc;

  // The true UTC instant is guessUtc minus offsetMs
  const realUtc = new Date(guessUtc - offsetMs);
  return realUtc.toISOString();
}

/**
 * Returns the UTC ISO start and end boundary strings covering an entire America/Detroit calendar day.
 */
export function getDetroitDayBounds(dateStr: string): { startIso: string; endIso: string } {
  const startIso = parseDetroitDateTimeLocal(`${dateStr}T00:00`);
  const endIso = parseDetroitDateTimeLocal(`${dateStr}T23:59`);
  return { startIso, endIso };
}

/**
 * Returns the UTC ISO start and end boundary strings covering an entire America/Detroit calendar month.
 */
export function getDetroitMonthBounds(
  year: number,
  month: number,
): { startIso: string; endIso: string } {
  const startStr = `${year}-${String(month).padStart(2, "0")}-01T00:00`;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const endStr = `${year}-${String(month).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}T23:59`;
  return {
    startIso: parseDetroitDateTimeLocal(startStr),
    endIso: parseDetroitDateTimeLocal(endStr),
  };
}
