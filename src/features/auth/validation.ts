import { z } from "zod";
import { memberProfileSchema } from "@/features/membership/validation";

export const loginSchema = z.object({
  identifier: z.string().trim().min(3, "Please enter your username or email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = memberProfileSchema
  .and(
    z.object({
      password: z.string().min(12, "Password must be at least 12 characters"),
      passwordConfirmation: z.string().min(1, "Please confirm your password"),
    }),
  )
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "Passwords do not match",
    path: ["passwordConfirmation"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(12, "Password must be at least 12 characters"),
    passwordConfirmation: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "Passwords do not match",
    path: ["passwordConfirmation"],
  });

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
