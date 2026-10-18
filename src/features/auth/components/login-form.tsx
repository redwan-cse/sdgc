"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction } from "@/features/auth/actions";
import { type LoginFormData, loginSchema } from "../validation";

export function LoginForm() {
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  const registered = searchParams.get("registered");
  const reset = searchParams.get("reset");
  const notice = searchParams.get("notice");
  const confirmed = searchParams.get("confirmed");

  let infoNotice: string | null = null;
  if (registered === "true") {
    infoNotice =
      "Your member application has been received! Please verify your email or sign in below.";
  } else if (reset === "true") {
    infoNotice =
      "Your password has been updated successfully. Please sign in with your new password.";
  } else if (notice === "signed_out") {
    infoNotice = "You have been signed out safely.";
  } else if (confirmed === "true") {
    infoNotice = "Your email has been confirmed! Please sign in to access your membership.";
  }

  const [mounted, setMounted] = React.useState(false);
  const [formData, setFormData] = React.useState<LoginFormData>({
    identifier: "",
    password: "",
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="space-y-6" aria-busy="true">
        <div className="space-y-2">
          <div className="h-4 w-44 bg-muted/40 rounded" />
          <div className="h-10 w-full rounded-md border border-input bg-background/50" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="h-4 w-20 bg-muted/40 rounded" />
            <div className="h-4 w-24 bg-muted/40 rounded" />
          </div>
          <div className="h-10 w-full rounded-md border border-input bg-background/50" />
        </div>
        <div className="h-10 w-full rounded-md bg-primary/20" />
        <div className="text-center text-xs text-muted-foreground pt-4 border-t border-border">
          Not a member yet?{" "}
          <Link href="/join" className="font-semibold text-primary hover:underline">
            Create New Member Profile &rarr;
          </Link>
        </div>
      </div>
    );
  }

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
        window.location.href = res.data.returnTo;
      }
    } catch {
      setErrorMessage("An unexpected network error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6" suppressHydrationWarning>
      {infoNotice && (
        <div
          className="rounded-md bg-primary/10 border border-primary/20 p-3.5 text-xs text-primary font-medium"
          role="status"
        >
          {infoNotice}
        </div>
      )}

      {errorMessage && (
        <div
          className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive"
          role="alert"
        >
          {errorMessage}
        </div>
      )}

      <div suppressHydrationWarning>
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

      <div suppressHydrationWarning>
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
        <Link href="/join" className="font-semibold text-primary hover:underline">
          Create New Member Profile &rarr;
        </Link>
      </div>
    </form>
  );
}
