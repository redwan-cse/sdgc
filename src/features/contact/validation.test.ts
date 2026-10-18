import { describe, expect, it } from "vitest";
import { contactSchema } from "./validation";

describe("contactSchema", () => {
  it("accepts valid contact submission", () => {
    const result = contactSchema.safeParse({
      name: "Jane Smith",
      email: "jane@example.com",
      phone: "269-555-0144",
      message: "Hello! I would love to learn more about the annual garden tour.",
    });
    expect(result.success).toBe(true);
  });

  it("accepts full submission with persona, category, subject, and valid attachment link", () => {
    const result = contactSchema.safeParse({
      name: "Margaret Fuller",
      email: "margaret@example.org",
      phone: "(269) 857-2291",
      senderType: "Prospective Member",
      category: "Garden Walk 2026",
      subject: "Advance ticket inquiries for group tour",
      attachmentUrl: "https://drive.google.com/file/d/example/view",
      message:
        "We have a group of 12 visiting Saugatuck and would love to attend the 2026 Garden Walk.",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name, invalid email, or short message", () => {
    const result = contactSchema.safeParse({
      name: "",
      email: "not-an-email",
      message: "short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid attachment URLs without http/https protocol", () => {
    const result = contactSchema.safeParse({
      name: "Valid Name",
      email: "valid@example.com",
      message: "This is a legitimate message body with enough length.",
      attachmentUrl: "not-a-valid-url",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("http:// or https://");
    }
  });

  it("rejects message exceeding 1000 characters", () => {
    const longMessage = "a".repeat(1001);
    const result = contactSchema.safeParse({
      name: "Valid Name",
      email: "valid@example.com",
      message: longMessage,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("cannot exceed 1000 characters");
    }
  });

  it("rejects submission if honeypot is populated", () => {
    const result = contactSchema.safeParse({
      name: "Spam Bot",
      email: "bot@spam.com",
      message: "Spam message here that is long enough.",
      honeypot: "http://spam.url",
    });
    expect(result.success).toBe(false);
  });
});
