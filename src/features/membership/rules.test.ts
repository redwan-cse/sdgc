import { describe, expect, it } from "vitest";
import { getMembershipYear, isMembershipActive } from "./rules";

describe("getMembershipYear", () => {
  it("asserts Michigan year differs from UTC at 2027-01-01T03:00:00Z and changes at 2027-01-01T05:00:00Z", () => {
    const at0300Z = new Date("2027-01-01T03:00:00Z");
    const at0500Z = new Date("2027-01-01T05:00:00Z");

    // In UTC, year is 2027 for both:
    expect(at0300Z.getUTCFullYear()).toBe(2027);
    expect(at0500Z.getUTCFullYear()).toBe(2027);

    // In Michigan (America/Detroit), at 03:00:00Z it is still Dec 31 22:00:00 2026:
    expect(getMembershipYear(at0300Z, "America/Detroit")).toBe(2026);

    // In Michigan, at 05:00:00Z it turns midnight Jan 1 2027:
    expect(getMembershipYear(at0500Z, "America/Detroit")).toBe(2027);
  });
});

describe("isMembershipActive", () => {
  it("requires approval and non-suspension for the current year", () => {
    const testDate = new Date("2026-06-15T12:00:00Z");

    // Approved for current year: active
    expect(isMembershipActive({ approved: true, suspended: false, year: 2026 }, testDate)).toBe(
      true,
    );

    // Unapproved: not active
    expect(isMembershipActive({ approved: false, suspended: false, year: 2026 }, testDate)).toBe(
      false,
    );

    // Suspended: not active
    expect(isMembershipActive({ approved: true, suspended: true, year: 2026 }, testDate)).toBe(
      false,
    );

    // Past year (expired): not active
    expect(isMembershipActive({ approved: true, suspended: false, year: 2025 }, testDate)).toBe(
      false,
    );
  });
});
