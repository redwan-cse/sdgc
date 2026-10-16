import { describe, expect, it } from "vitest";
import { sanitizeReturnTo } from "./redirects";

describe("R1.5: Login Return Destination Sanitization", () => {
  it("allows valid local internal application paths", () => {
    expect(sanitizeReturnTo("/profile")).toBe("/profile");
    expect(sanitizeReturnTo("/directory")).toBe("/directory");
    expect(sanitizeReturnTo("/admin/members")).toBe("/admin/members");
    expect(sanitizeReturnTo("/admin/members?page=2&filter=active#top")).toBe(
      "/admin/members?page=2&filter=active#top",
    );
    expect(sanitizeReturnTo("/events/2026/annual-walk")).toBe("/events/2026/annual-walk");
  });

  it("defaults to /profile for empty, undefined, or root inputs", () => {
    expect(sanitizeReturnTo(null)).toBe("/profile");
    expect(sanitizeReturnTo(undefined)).toBe("/profile");
    expect(sanitizeReturnTo("")).toBe("/profile");
    expect(sanitizeReturnTo("   ")).toBe("/profile");
    expect(sanitizeReturnTo("/")).toBe("/profile");
  });

  it("rejects protocol-relative open redirect attacks", () => {
    expect(sanitizeReturnTo("//evil.com")).toBe("/profile");
    expect(sanitizeReturnTo("///evil.com")).toBe("/profile");
    expect(sanitizeReturnTo("////evil.com/phish")).toBe("/profile");
  });

  it("rejects backslash evasion techniques", () => {
    expect(sanitizeReturnTo("/\\evil.com")).toBe("/profile");
    expect(sanitizeReturnTo("/\\\\evil.com")).toBe("/profile");
    expect(sanitizeReturnTo("\\evil.com")).toBe("/profile");
    expect(sanitizeReturnTo("\\\\evil.com")).toBe("/profile");
    expect(sanitizeReturnTo("/path\\to\\somewhere")).toBe("/profile");
  });

  it("rejects URL-encoded slash and backslash tricks", () => {
    expect(sanitizeReturnTo("/%2fevil.com")).toBe("/profile");
    expect(sanitizeReturnTo("/%2F%2Fevil.com")).toBe("/profile");
    expect(sanitizeReturnTo("/%5cevil.com")).toBe("/profile");
    expect(sanitizeReturnTo("/%5C%5Cevil.com")).toBe("/profile");
  });

  it("rejects external absolute URLs and schemes", () => {
    expect(sanitizeReturnTo("https://evil.com")).toBe("/profile");
    expect(sanitizeReturnTo("http://evil.com/steal")).toBe("/profile");
    expect(sanitizeReturnTo("javascript:alert(1)")).toBe("/profile");
    expect(sanitizeReturnTo("data:text/html,<script>alert(1)</script>")).toBe("/profile");
    expect(sanitizeReturnTo("vbscript:msgbox(1)")).toBe("/profile");
  });

  it("rejects control characters, newlines, and carriage returns", () => {
    expect(sanitizeReturnTo("/path\r\nevil.com")).toBe("/profile");
    expect(sanitizeReturnTo("/path\nevil.com")).toBe("/profile");
    expect(sanitizeReturnTo("/path\tevil.com")).toBe("/profile");
    expect(sanitizeReturnTo("/path\0evil.com")).toBe("/profile");
  });

  it("rejects relative paths without a leading slash", () => {
    expect(sanitizeReturnTo("admin")).toBe("/profile");
    expect(sanitizeReturnTo("profile/settings")).toBe("/profile");
    expect(sanitizeReturnTo("javascript")).toBe("/profile");
  });
});
