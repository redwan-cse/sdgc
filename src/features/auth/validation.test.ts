import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "./validation";

describe("loginSchema", () => {
  it("accepts valid identifier and password", () => {
    const result = loginSchema.safeParse({
      identifier: "testuser",
      password: "secretpassword123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty identifier or password", () => {
    const result = loginSchema.safeParse({
      identifier: "",
      password: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("registerSchema", () => {
  const validBase = {
    username: "daisy_miller",
    firstName: "Daisy",
    lastName: "Miller",
    email: "daisy@example.com",
    masterGardener: true,
    projectInterests: ["community_beautification", "garden_walk_fundraiser"],
    password: "CorrectHorseBatteryStaple12!",
    passwordConfirmation: "CorrectHorseBatteryStaple12!",
  };

  it("accepts valid registration with required fields only", () => {
    const result = registerSchema.safeParse(validBase);
    expect(result.success).toBe(true);
  });

  it("accepts optional address, phones, and spouse", () => {
    const result = registerSchema.safeParse({
      ...validBase,
      phoneHome: "269-555-0123",
      phoneCell: "269-555-0199",
      addressLine1: "123 Center St",
      addressLine2: "Apt 2B",
      city: "Douglas",
      state: "MI",
      zipCode: "49406",
      spouseFirstName: "Robert",
      interestsExperience: "Perennials and native pollinator gardens.",
    });
    expect(result.success).toBe(true);
  });

  it("validates February 29 as a valid birth day without requiring a year", () => {
    const result = registerSchema.safeParse({
      ...validBase,
      birthMonth: 2,
      birthDay: 29,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid birthday month/day combinations like February 30 or April 31", () => {
    const feb30 = registerSchema.safeParse({
      ...validBase,
      birthMonth: 2,
      birthDay: 30,
    });
    expect(feb30.success).toBe(false);

    const apr31 = registerSchema.safeParse({
      ...validBase,
      birthMonth: 4,
      birthDay: 31,
    });
    expect(apr31.success).toBe(false);

    const monthOnly = registerSchema.safeParse({
      ...validBase,
      birthMonth: 5,
    });
    expect(monthOnly.success).toBe(false);
  });

  it("rejects password mismatch", () => {
    const result = registerSchema.safeParse({
      ...validBase,
      passwordConfirmation: "DifferentPassword123!",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password under 12 characters", () => {
    const result = registerSchema.safeParse({
      ...validBase,
      password: "short",
      passwordConfirmation: "short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid project interest codes", () => {
    const result = registerSchema.safeParse({
      ...validBase,
      projectInterests: ["unknown_code"],
    });
    expect(result.success).toBe(false);
  });
});
