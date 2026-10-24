import { describe, expect, it } from "vitest";
import {
  slugifyNoticeTitle,
  isValidNoticeCategory,
  isValidNoticePriority,
  type NoticeCategory,
  type NoticePriority,
} from "./types";

describe("notices helpers and validation", () => {
  describe("slugifyNoticeTitle", () => {
    it("converts title to clean URL slug", () => {
      expect(slugifyNoticeTitle("First Autumn Frost Warning & Garden Protection")).toBe(
        "first-autumn-frost-warning-garden-protection",
      );
    });

    it("handles special characters, punctuation, and multiple spaces", () => {
      expect(slugifyNoticeTitle("  Urgent: 2026 Annual Garden Walk -- Call #1 Volunteers!  ")).toBe(
        "urgent-2026-annual-garden-walk-call-1-volunteers",
      );
    });

    it("handles single word titles", () => {
      expect(slugifyNoticeTitle("Announcements")).toBe("announcements");
    });
  });

  describe("isValidNoticeCategory", () => {
    it("validates recognized categories", () => {
      const valid: NoticeCategory[] = [
        "general",
        "urgent",
        "meeting",
        "volunteer",
        "event",
        "beautification",
      ];
      for (const cat of valid) {
        expect(isValidNoticeCategory(cat)).toBe(true);
      }
    });

    it("rejects unknown categories", () => {
      expect(isValidNoticeCategory("random")).toBe(false);
      expect(isValidNoticeCategory("")).toBe(false);
    });
  });

  describe("isValidNoticePriority", () => {
    it("validates priority levels", () => {
      const valid: NoticePriority[] = ["low", "normal", "high", "urgent"];
      for (const p of valid) {
        expect(isValidNoticePriority(p)).toBe(true);
      }
    });

    it("rejects unknown priority", () => {
      expect(isValidNoticePriority("critical")).toBe(false);
    });
  });
});
