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
  identifier: z.string().trim().min(2, "Please enter your username or email address"),
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

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: "New password must be different from your current password",
    path: ["newPassword"],
  });

export const mfaVerifySchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Security code must be exactly 6 digits"),
});

export const unenrollMfaSchema = z.object({
  password: z.string().min(1, "Current password is required to remove two-factor authentication"),
  factorId: z.string().min(1, "Factor ID is required"),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
export type MfaVerifyFormData = z.infer<typeof mfaVerifySchema>;
export type UnenrollMfaFormData = z.infer<typeof unenrollMfaSchema>;
