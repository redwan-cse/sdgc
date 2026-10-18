import { describe, expect, it } from "vitest";
import {
  CLUB_TIMEZONE,
  eventOccursOnDate,
  getDetroitDateString,
  getDetroitDayBounds,
  getDetroitMonthBounds,
  getMonthMatrix,
} from "./calendar";
import type { EventSummary } from "./types";

function createMockEvent(overrides: Partial<EventSummary>): EventSummary {
  return {
    id: "test-event-1",
    slug: "test-event-1",
    title: "Test Event",
    description: "Test description",
    startsAt: "2026-07-11T14:00:00Z",
    endsAt: "2026-07-11T16:00:00Z",
    timezone: CLUB_TIMEZONE,
    allDay: false,
    venueName: "Saugatuck Center",
    ...overrides,
  };
}

describe("R3 Calendar Behavior: America/Detroit Date Grouping & DST Boundaries", () => {
  it("computes accurate Detroit day bounds across summer EDT and winter EST", () => {
    // Summer EDT (UTC-4)
    const summerBounds = getDetroitDayBounds("2026-07-11");
    expect(summerBounds.startIso).toBe("2026-07-11T04:00:00.000Z");
    expect(summerBounds.endIso).toBe("2026-07-12T03:59:00.000Z");

    // Winter EST (UTC-5)
    const winterBounds = getDetroitDayBounds("2026-12-10");
    expect(winterBounds.startIso).toBe("2026-12-10T05:00:00.000Z");
    expect(winterBounds.endIso).toBe("2026-12-11T04:59:00.000Z");
  });

  it("computes accurate Detroit month bounds for 30 and 31 day months", () => {
    const juneBounds = getDetroitMonthBounds(2026, 6);
    expect(juneBounds.startIso).toBe("2026-06-01T04:00:00.000Z");
    expect(juneBounds.endIso).toBe("2026-07-01T03:59:00.000Z");

    const julyBounds = getDetroitMonthBounds(2026, 7);
    expect(julyBounds.startIso).toBe("2026-07-01T04:00:00.000Z");
    expect(julyBounds.endIso).toBe("2026-08-01T03:59:00.000Z");
  });

  it("pins near-midnight UTC event to Michigan day (2026-07-11T02:00:00Z is 10 PM July 10 in Detroit)", () => {
    // 02:00:00Z on July 11 is 22:00:00 (10 PM) on July 10 in Detroit (EDT, UTC-4)
    const lateNightEvent = createMockEvent({
      startsAt: "2026-07-11T02:00:00Z",
      endsAt: "2026-07-11T03:30:00Z", // 11:30 PM July 10 in Detroit
    });

    const detroitDate = getDetroitDateString(lateNightEvent.startsAt);
    expect(detroitDate).toBe("2026-07-10");

    // Must be assigned to July 10 in Detroit, NOT July 11
    expect(eventOccursOnDate(lateNightEvent, "2026-07-10")).toBe(true);
    expect(eventOccursOnDate(lateNightEvent, "2026-07-11")).toBe(false);
  });

  it("pins December 31 / January 1 transition in Detroit (2027-01-01T03:00:00Z is 10 PM Dec 31, 2026 in Detroit)", () => {
    // In winter (EST, UTC-5), 03:00:00Z on Jan 1 2027 is 22:00:00 (10 PM) on Dec 31 2026 in Detroit
    const newYearsEveEvent = createMockEvent({
      startsAt: "2027-01-01T03:00:00Z",
      endsAt: "2027-01-01T04:30:00Z", // 11:30 PM Dec 31 in Detroit
    });

    const detroitDate = getDetroitDateString(newYearsEveEvent.startsAt);
    expect(detroitDate).toBe("2026-12-31");

    expect(eventOccursOnDate(newYearsEveEvent, "2026-12-31")).toBe(true);
    expect(eventOccursOnDate(newYearsEveEvent, "2027-01-01")).toBe(false);

    // Event starting at 05:00:00Z on Jan 1 2027 is midnight (00:00) on Jan 1 2027 in Detroit
    const newYearsDayEvent = createMockEvent({
      startsAt: "2027-01-01T05:00:00Z",
      endsAt: "2027-01-01T07:00:00Z",
    });
    expect(getDetroitDateString(newYearsDayEvent.startsAt)).toBe("2027-01-01");
    expect(eventOccursOnDate(newYearsDayEvent, "2026-12-31")).toBe(false);
    expect(eventOccursOnDate(newYearsDayEvent, "2027-01-01")).toBe(true);
  });

  it("correctly handles spring DST transition in Detroit (March 8, 2026)", () => {
    // In 2026, Detroit transitions from UTC-5 (EST) to UTC-4 (EDT) on March 8 at 2:00 AM
    // 06:30:00Z on March 8, 2026 is 02:30:00 EDT (after the spring forward)
    const springEvent = createMockEvent({
      startsAt: "2026-03-08T06:30:00Z",
      endsAt: "2026-03-08T08:00:00Z",
    });

    expect(getDetroitDateString(springEvent.startsAt)).toBe("2026-03-08");
    expect(eventOccursOnDate(springEvent, "2026-03-08")).toBe(true);
    expect(eventOccursOnDate(springEvent, "2026-03-07")).toBe(false);
  });

  it("correctly handles fall DST transition in Detroit (November 1, 2026)", () => {
    // In 2026, Detroit transitions from UTC-4 (EDT) to UTC-5 (EST) on November 1 at 2:00 AM
    // 05:30:00Z on November 1, 2026 is 00:30:00 (12:30 AM EST, after the fall back)
    const fallEvent = createMockEvent({
      startsAt: "2026-11-01T05:30:00Z",
      endsAt: "2026-11-01T07:00:00Z",
    });

    expect(getDetroitDateString(fallEvent.startsAt)).toBe("2026-11-01");
    expect(eventOccursOnDate(fallEvent, "2026-11-01")).toBe(true);
    expect(eventOccursOnDate(fallEvent, "2026-10-31")).toBe(false);
  });

  it("correctly groups multi-day events across all included Detroit dates", () => {
    // Starts July 10 at 10 AM EDT (14:00Z) and ends July 12 at 4 PM EDT (20:00Z)
    const festivalEvent = createMockEvent({
      startsAt: "2026-07-10T14:00:00Z",
      endsAt: "2026-07-12T20:00:00Z",
    });

    expect(eventOccursOnDate(festivalEvent, "2026-07-09")).toBe(false);
    expect(eventOccursOnDate(festivalEvent, "2026-07-10")).toBe(true);
    expect(eventOccursOnDate(festivalEvent, "2026-07-11")).toBe(true);
    expect(eventOccursOnDate(festivalEvent, "2026-07-12")).toBe(true);
    expect(eventOccursOnDate(festivalEvent, "2026-07-13")).toBe(false);
  });

  it("handles all-day events ending at midnight without bleeding into the following day", () => {
    // All-day event on July 11: 00:00 EDT (July 11 04:00:00Z) to July 12 00:00 EDT (July 12 04:00:00Z)
    const allDayEvent = createMockEvent({
      startsAt: "2026-07-11T04:00:00Z",
      endsAt: "2026-07-12T04:00:00Z",
      allDay: true,
    });

    expect(eventOccursOnDate(allDayEvent, "2026-07-10")).toBe(false);
    expect(eventOccursOnDate(allDayEvent, "2026-07-11")).toBe(true);
    expect(eventOccursOnDate(allDayEvent, "2026-07-12")).toBe(false);
  });

  it("getMonthMatrix places events into cells based on Michigan date rather than UTC substring", () => {
    // Event at 10 PM July 10 in Detroit (startsAt: 2026-07-11T02:00:00Z)
    const event = createMockEvent({
      startsAt: "2026-07-11T02:00:00Z",
      endsAt: "2026-07-11T03:00:00Z",
    });

    const matrix = getMonthMatrix(2026, 7, [event]);
    const allDays = matrix.flat();

    const july10Cell = allDays.find((d) => d.date === "2026-07-10");
    const july11Cell = allDays.find((d) => d.date === "2026-07-11");

    expect(july10Cell).toBeDefined();
    expect(july11Cell).toBeDefined();
    expect(july10Cell?.events.length).toBe(1);
    expect(july11Cell?.events.length).toBe(0);
  });
});
