"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPasswordAction } from "@/features/auth/actions";
import { type ResetPasswordFormData, resetPasswordSchema } from "../validation";

export function ResetPasswordForm() {
  const [formData, setFormData] = React.useState<ResetPasswordFormData>({
    password: "",
    passwordConfirmation: "",
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setStatusMessage(null);
    setErrorMessage(null);

    const result = resetPasswordSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        if (issue.path[0]) {
          fieldErrors[issue.path[0] as string] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await resetPasswordAction(formData.password);
      if (res.success) {
        setStatusMessage(
          "Password updated successfully! You can now log in with your new credentials.",
        );
      } else {
        setErrorMessage(res.error);
      }
    } catch {
      setErrorMessage("Failed to update password. Your recovery link may have expired.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {statusMessage && (
        <div
          className="rounded-md bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-600/30 p-4 text-xs text-emerald-800 dark:text-emerald-300"
          role="status"
        >
          {statusMessage}
        </div>
      )}

      {errorMessage && (
        <div
          className="rounded-md bg-destructive/10 border border-destructive/20 p-4 text-xs text-destructive"
          role="alert"
        >
          {errorMessage}
        </div>
      )}

      <div>
        <Label htmlFor="reset-new-password" required>
          New Password{" "}
          <span className="text-xs font-normal text-muted-foreground">(Min. 12 characters)</span>
        </Label>
        <Input
          id="reset-new-password"
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          placeholder="••••••••••••"
          error={errors.password}
          aria-describedby={errors.password ? "reset-pwd-error" : undefined}
        />
        {errors.password && (
          <p id="reset-pwd-error" className="mt-1 text-xs text-destructive">
            {errors.password}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="reset-confirm-password" required>
          Confirm New Password
        </Label>
        <Input
          id="reset-confirm-password"
          type="password"
          value={formData.passwordConfirmation}
          onChange={(e) =>
            setFormData({
              ...formData,
              passwordConfirmation: e.target.value,
            })
          }
          placeholder="••••••••••••"
          error={errors.passwordConfirmation}
          aria-describedby={errors.passwordConfirmation ? "reset-confirm-error" : undefined}
        />
        {errors.passwordConfirmation && (
          <p id="reset-confirm-error" className="mt-1 text-xs text-destructive">
            {errors.passwordConfirmation}
          </p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Updating Password..." : "Set New Password"}
      </Button>

      <div className="text-center text-xs text-muted-foreground pt-4 border-t border-border">
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Return to Member Login
        </Link>
      </div>
    </form>
  );
}
