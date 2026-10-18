"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPasswordAction } from "@/features/auth/actions";
import { type ForgotPasswordFormData, forgotPasswordSchema } from "../validation";

export function ForgotPasswordForm() {
  const [mounted, setMounted] = React.useState(false);
  const [formData, setFormData] = React.useState<ForgotPasswordFormData>({
    identifier: "",
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="space-y-6" aria-busy="true">
        <div className="space-y-2">
          <div className="h-4 w-40 bg-muted/40 rounded" />
          <div className="h-10 w-full rounded-md border border-input bg-background/50" />
        </div>
        <div className="h-10 w-full rounded-md bg-primary/20" />
        <div className="text-center text-xs text-muted-foreground pt-4 border-t border-border">
          Remember your password?{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Return to Member Login
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setStatusMessage(null);

    const result = forgotPasswordSchema.safeParse(formData);
    if (!result.success) {
      setErrors({ identifier: result.error.issues[0]?.message || "Invalid input" });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await forgotPasswordAction(formData.identifier);
      if (res.success) {
        setStatusMessage(
          "If an account exists with that email address, a password reset link has been dispatched to your inbox.",
        );
      } else {
        setErrors({ identifier: res.error });
      }
    } catch {
      setStatusMessage(
        "If an account exists with that email address, a password reset link has been dispatched to your inbox.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {statusMessage && (
        <div
          className="rounded-md bg-primary/10 border border-primary/20 p-4 text-xs text-primary"
          role="status"
        >
          {statusMessage}
        </div>
      )}

      <div>
        <Label htmlFor="forgot-email" required>
          Account Email Address
        </Label>
        <p className="text-xs text-muted-foreground mt-0.5 mb-1.5">
          Enter your email address or club username to receive a password reset link.
        </p>
        <Input
          id="forgot-email"
          value={formData.identifier}
          onChange={(e) => setFormData({ identifier: e.target.value })}
          placeholder="daisy or daisy@example.com"
          autoComplete="username"
          error={errors.identifier}
          aria-describedby={errors.identifier ? "forgot-email-error" : undefined}
        />
        {errors.identifier && (
          <p id="forgot-email-error" className="mt-1 text-xs text-destructive">
            {errors.identifier}
          </p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Sending Reset Link..." : "Send Password Reset Link"}
      </Button>

      <div className="text-center text-xs text-muted-foreground pt-4 border-t border-border">
        Remember your password?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Return to Member Login
        </Link>
      </div>
    </form>
  );
}
