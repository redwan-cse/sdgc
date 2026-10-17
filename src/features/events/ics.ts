/**
 * RFC 5545 iCalendar (.ics) Generator for Saugatuck Douglas Garden Club.
 * Formats events and calendar feeds for Google Calendar, Apple Calendar, and Microsoft Outlook.
 */

export interface IcsEventInput {
  id: string;
  slug: string;
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  allDay: boolean;
  timezone?: string;
  location?: string;
  url?: string;
}

/**
 * Escapes characters per RFC 5545 Section 3.3.11:
 * \ -> \\
 * ; -> \;
 * , -> \,
 * \n -> \n
 */
export function escapeIcsText(text: string): string {
  if (!text) return "";
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r\n|\n|\r/g, "\\n");
}

/**
 * Formats ISO date/time into iCalendar timestamp format.
 * All-day: YYYYMMDD
 * Timed: YYYYMMDDTHHMMSSZ (UTC normalized)
 */
export function formatIcsTimestamp(isoString: string, allDay = false): string {
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) {
    return "19700101T000000Z";
  }

  if (allDay) {
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${year}${month}${day}`;
  }

  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const hours = String(d.getUTCHours()).padStart(2, "0");
  const minutes = String(d.getUTCMinutes()).padStart(2, "0");
  const seconds = String(d.getUTCSeconds()).padStart(2, "0");

  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Generates an RFC 5545 VEVENT component.
 */
export function generateVEvent(event: IcsEventInput, nowTimestamp?: string): string {
  const dtStamp = nowTimestamp || formatIcsTimestamp(new Date().toISOString());
  const uid = `${event.id}@saugatuckdouglasgardenclub.com`;
  const summary = escapeIcsText(event.title);
  const description = escapeIcsText(event.description);
  const location = event.location ? escapeIcsText(event.location) : "";

  const lines: string[] = ["BEGIN:VEVENT", `UID:${uid}`, `DTSTAMP:${dtStamp}`];

  if (event.allDay) {
    lines.push(`DTSTART;VALUE=DATE:${formatIcsTimestamp(event.startsAt, true)}`);
    lines.push(`DTEND;VALUE=DATE:${formatIcsTimestamp(event.endsAt, true)}`);
  } else {
    lines.push(`DTSTART:${formatIcsTimestamp(event.startsAt)}`);
    lines.push(`DTEND:${formatIcsTimestamp(event.endsAt)}`);
  }

  lines.push(`SUMMARY:${summary}`);
  if (description) lines.push(`DESCRIPTION:${description}`);
  if (location) lines.push(`LOCATION:${location}`);
  if (event.url) lines.push(`URL:${event.url}`);

  lines.push("STATUS:CONFIRMED");
  lines.push("END:VEVENT");

  return lines.join("\r\n");
}

/**
 * Generates a complete RFC 5545 VCALENDAR feed string.
 */
export function generateICalendarFeed(
  events: IcsEventInput[],
  calendarName = "Saugatuck Douglas Garden Club Events",
): string {
  const now = formatIcsTimestamp(new Date().toISOString());
  const vevents = events.map((e) => generateVEvent(e, now)).join("\r\n");

  const calendarHeader = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Saugatuck Douglas Garden Club//SDGC Calendar Feed//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${calendarName}`,
    "X-WR-TIMEZONE:America/Detroit",
  ].join("\r\n");

  return `${calendarHeader}\r\n${vevents}\r\nEND:VCALENDAR\r\n`;
}
