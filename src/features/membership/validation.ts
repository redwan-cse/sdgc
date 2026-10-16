import { z } from "zod";
import { PROJECT_INTEREST_CHOICES } from "./types";

const MAX_DAYS_IN_MONTH: Record<number, number> = {
  1: 31,
  2: 29, // Leap day supported without collecting birth year
  3: 31,
  4: 30,
  5: 31,
  6: 30,
  7: 31,
  8: 31,
  9: 30,
  10: 31,
  11: 30,
  12: 31,
};

const projectCodes = PROJECT_INTEREST_CHOICES.map((c) => c.code) as [string, ...string[]];

export const memberProfileSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(3, "Username must be at least 3 characters")
      .max(30, "Username must be at most 30 characters")
      .regex(
        /^[a-zA-Z0-9_-]+$/,
        "Username may only contain letters, numbers, underscores, and hyphens",
      ),
    firstName: z.string().trim().min(1, "First name is required"),
    lastName: z.string().trim().min(1, "Last name is required"),
    email: z.string().trim().email("Please enter a valid email address"),
    phoneHome: z.string().trim().optional().or(z.literal("")),
    phoneCell: z.string().trim().optional().or(z.literal("")),
    addressLine1: z.string().trim().optional().or(z.literal("")),
    addressLine2: z.string().trim().optional().or(z.literal("")),
    city: z.string().trim().optional().or(z.literal("")),
    state: z.string().trim().optional().or(z.literal("")),
    zipCode: z.string().trim().optional().or(z.literal("")),
    birthMonth: z.coerce.number().int().min(1).max(12).optional().nullable(),
    birthDay: z.coerce.number().int().min(1).max(31).optional().nullable(),
    spouseFirstName: z.string().trim().optional().or(z.literal("")),
    masterGardener: z.boolean().default(false),
    directoryOptOut: z.boolean().default(false),
    interestsExperience: z.string().trim().optional().or(z.literal("")),
    projectInterests: z.array(z.enum(projectCodes)).default([]),
  })
  .refine(
    (data) => {
      // Both month and day must be provided or both omitted
      const hasMonth = typeof data.birthMonth === "number" && !Number.isNaN(data.birthMonth);
      const hasDay = typeof data.birthDay === "number" && !Number.isNaN(data.birthDay);

      if (hasMonth !== hasDay) {
        return false;
      }

      if (hasMonth && hasDay) {
        const maxDays = MAX_DAYS_IN_MONTH[data.birthMonth as number];
        if (!maxDays || (data.birthDay as number) > maxDays) {
          return false;
        }
      }

      return true;
    },
    {
      message: "Please enter a valid birth month and day (e.g. Feb 29 is valid, Feb 30 is not)",
      path: ["birthDay"],
    },
  );

export type MemberProfileFormData = z.infer<typeof memberProfileSchema>;
