"use client";

import * as React from "react";
import Link from "next/link";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "../validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPasswordForm() {
  const [formData, setFormData] = React.useState<ForgotPasswordFormData>({
    email: "",
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setStatusMessage(null);

    const result = forgotPasswordSchema.safeParse(formData);
    if (!result.success) {
      setErrors({ email: result.error.issues[0]?.message || "Invalid email" });
      return;
    }

    setIsSubmitting(true);
    // Preview interaction (P4 connects real Supabase resetPasswordForEmail)
    try {
      await new Promise((res) => setTimeout(res, 300));
      setStatusMessage(
        "If an account exists with that email address, a password reset link has been dispatched to your local mail capture inbox.",
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
        <Input
          id="forgot-email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ email: e.target.value })}
          placeholder="daisy@example.com"
          error={errors.email}
          aria-describedby={errors.email ? "forgot-email-error" : undefined}
        />
        {errors.email && (
          <p id="forgot-email-error" className="mt-1 text-xs text-destructive">
            {errors.email}
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
