import { describe, expect, it } from "vitest";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  mfaVerifySchema,
  unenrollMfaSchema,
} from "./validation";

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

describe("changePasswordSchema", () => {
  it("accepts valid password change with distinct old and new passwords", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "OldPassword123!",
      newPassword: "BrandNewSecurePassword456!",
      confirmPassword: "BrandNewSecurePassword456!",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty current password", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "",
      newPassword: "BrandNewSecurePassword456!",
      confirmPassword: "BrandNewSecurePassword456!",
    });
    expect(result.success).toBe(false);
  });

  it("rejects new password under 8 characters", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "OldPassword123!",
      newPassword: "short",
      confirmPassword: "short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects mismatched confirm password", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "OldPassword123!",
      newPassword: "BrandNewSecurePassword456!",
      confirmPassword: "DifferentPassword789!",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("New passwords do not match");
    }
  });

  it("rejects setting new password identical to current password", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "SamePassword123!",
      newPassword: "SamePassword123!",
      confirmPassword: "SamePassword123!",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "New password must be different from your current password",
      );
    }
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

  it("accepts separate gardeningInterests and volunteerExperience fields", () => {
    const result = registerSchema.safeParse({
      ...validBase,
      addressLine2: "Suite 400",
      gardeningInterests: "Dahlias, hostas, and shade perennials",
      volunteerExperience: "Past chairperson for annual plant sales",
      directoryOptOut: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.gardeningInterests).toBe("Dahlias, hostas, and shade perennials");
      expect(result.data.volunteerExperience).toBe("Past chairperson for annual plant sales");
      expect(result.data.addressLine2).toBe("Suite 400");
      expect(result.data.directoryOptOut).toBe(true);
    }
  });

  it("rejects invalid project interest codes", () => {
    const result = registerSchema.safeParse({
      ...validBase,
      projectInterests: ["unknown_code"],
    });
    expect(result.success).toBe(false);
  });
});

describe("forgotPasswordSchema", () => {
  it("accepts valid email address", () => {
    const result = forgotPasswordSchema.safeParse({
      identifier: "daisy@example.com",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid username", () => {
    const result = forgotPasswordSchema.safeParse({
      identifier: "daisy_miller",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty or single character identifier", () => {
    const result = forgotPasswordSchema.safeParse({
      identifier: "a",
    });
    expect(result.success).toBe(false);
  });
});

describe("mfaVerifySchema", () => {
  it("accepts valid 6-digit numeric security code", () => {
    const result = mfaVerifySchema.safeParse({ code: "123456" });
    expect(result.success).toBe(true);
  });

  it("trims whitespace around code", () => {
    const result = mfaVerifySchema.safeParse({ code: " 654321 " });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.code).toBe("654321");
    }
  });

  it("rejects codes with letters or symbols", () => {
    const result = mfaVerifySchema.safeParse({ code: "12A456" });
    expect(result.success).toBe(false);
  });

  it("rejects codes with length other than 6", () => {
    expect(mfaVerifySchema.safeParse({ code: "12345" }).success).toBe(false);
    expect(mfaVerifySchema.safeParse({ code: "1234567" }).success).toBe(false);
    expect(mfaVerifySchema.safeParse({ code: "" }).success).toBe(false);
  });
});

describe("unenrollMfaSchema", () => {
  it("accepts valid password and factorId", () => {
    const result = unenrollMfaSchema.safeParse({
      password: "CurrentPassword123!",
      factorId: "factor-uuid-1234",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty password", () => {
    const result = unenrollMfaSchema.safeParse({
      password: "",
      factorId: "factor-uuid-1234",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty factorId", () => {
    const result = unenrollMfaSchema.safeParse({
      password: "CurrentPassword123!",
      factorId: "",
    });
    expect(result.success).toBe(false);
  });
});
