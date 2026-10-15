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

  it("rejects empty name, invalid email, or short message", () => {
    const result = contactSchema.safeParse({
      name: "",
      email: "not-an-email",
      message: "short",
    });
    expect(result.success).toBe(false);
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
