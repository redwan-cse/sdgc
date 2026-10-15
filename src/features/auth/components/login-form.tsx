"use client";

import * as React from "react";
import Link from "next/link";
import { loginSchema, type LoginFormData } from "../validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const [formData, setFormData] = React.useState<LoginFormData>({
    identifier: "",
    password: "",
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setStatusMessage(null);

    const result = loginSchema.safeParse(formData);
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
    // Preview interaction (P4 connects real Supabase Auth SSR session)
    try {
      await new Promise((res) => setTimeout(res, 300));
      setStatusMessage(
        "Frontend preview: Authentication form validated. Server authentication connects in Phase 4.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {statusMessage && (
        <div
          className="rounded-md bg-primary/10 border border-primary/20 p-3 text-xs text-primary"
          role="status"
        >
          {statusMessage}
        </div>
      )}

      <div>
        <Label htmlFor="login-identifier" required>
          Username or Email Address
        </Label>
        <Input
          id="login-identifier"
          value={formData.identifier}
          onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
          placeholder="Enter your username or email"
          autoComplete="username"
          error={errors.identifier}
          aria-describedby={errors.identifier ? "identifier-error" : undefined}
        />
        {errors.identifier && (
          <p id="identifier-error" className="mt-1 text-xs text-destructive">
            {errors.identifier}
          </p>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between">
          <Label htmlFor="login-password" required>
            Password
          </Label>
          <Link href="/forgot-password" className="text-xs text-primary hover:underline">
            Forgot password?
          </Link>
        </div>
        <Input
          id="login-password"
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          placeholder="••••••••••••"
          autoComplete="current-password"
          error={errors.password}
          aria-describedby={errors.password ? "password-error" : undefined}
        />
        {errors.password && (
          <p id="password-error" className="mt-1 text-xs text-destructive">
            {errors.password}
          </p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Signing In..." : "Sign In to Member Area"}
      </Button>

      <div className="text-center text-xs text-muted-foreground pt-4 border-t border-border">
        Not a member yet?{" "}
        <Link href="/becomeamember" className="font-semibold text-primary hover:underline">
          Create New Member Profile &rarr;
        </Link>
      </div>
    </form>
  );
}
