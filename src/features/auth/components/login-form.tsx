"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction } from "@/features/auth/actions";
import { type LoginFormData, loginSchema } from "../validation";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");

  const [formData, setFormData] = React.useState<LoginFormData>({
    identifier: "",
    password: "",
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setErrorMessage(null);

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
    try {
      const formPayload = new FormData();
      formPayload.append("identifier", formData.identifier);
      formPayload.append("password", formData.password);
      if (returnTo) {
        formPayload.append("returnTo", returnTo);
      }

      const res = await loginAction(formPayload);
      if (!res.success) {
        setErrorMessage(res.error);
        if (res.fieldErrors) {
          const mapped: Record<string, string> = {};
          for (const [k, v] of Object.entries(res.fieldErrors)) {
            if (v?.[0]) mapped[k] = v[0];
          }
          setErrors(mapped);
        }
      } else {
        router.push(res.data.returnTo as Parameters<typeof router.push>[0]);
        router.refresh();
      }
    } catch {
      setErrorMessage("An unexpected network error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {errorMessage && (
        <div
          className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive"
          role="alert"
        >
          {errorMessage}
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
