"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

interface MfaVerifyFormProps {
  returnTo?: string;
}

export function MfaVerifyForm({ returnTo }: MfaVerifyFormProps) {
  const [code, setCode] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [factorId, setFactorId] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadFactors() {
      try {
        const supabase = createClient();
        const { data, error: factorError } = await supabase.auth.mfa.listFactors();
        if (factorError || !data) {
          setError("Failed to retrieve authentication factors.");
          setIsLoading(false);
          return;
        }

        const verifiedFactor =
          data.totp.find((f) => f.status === "verified") ||
          data.all.find((f) => f.status === "verified");

        if (!verifiedFactor) {
          // No verified factor requiring challenge; forward to destination
          window.location.href = returnTo || "/profile";
          return;
        }

        setFactorId(verifiedFactor.id);
      } catch {
        setError("Network error initializing authentication challenge.");
      } finally {
        setIsLoading(false);
      }
    }

    loadFactors();
  }, [returnTo]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanCode = code.replace(/\D/g, "").trim();
    if (cleanCode.length !== 6) {
      setError("Please enter a valid 6-digit verification code.");
      return;
    }

    if (!factorId) {
      setError("No active two-factor authentication factor found.");
      return;
    }

    setIsVerifying(true);
    try {
      const supabase = createClient();
      const { data, error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: cleanCode,
      });

      if (verifyError || !data) {
        setError("Invalid verification code. Please check your authenticator app and try again.");
        return;
      }

      // Elevated to AAL2 successfully!
      const destination = returnTo?.startsWith("/") ? returnTo : "/profile";
      window.location.href = destination;
    } catch {
      setError("An unexpected network error occurred. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-6 w-36 bg-muted/60 rounded" />
        <div className="h-12 bg-muted/40 rounded-md" />
        <div className="h-10 bg-primary/20 rounded-md" />
      </div>
    );
  }

  return (
    <form onSubmit={handleVerify} className="space-y-6" noValidate>
      <div className="text-center space-y-2">
        <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
            />
          </svg>
        </div>
        <h2 className="font-serif text-2xl font-bold text-foreground">Two-Factor Authentication</h2>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
          Open your authenticator app (Google Authenticator, Apple Passwords, 1Password, or Authy)
          and enter the current 6-digit security code.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive font-medium text-center"
        >
          {error}
        </div>
      )}

      <div>
        <Label htmlFor="mfa-code" required className="text-center block mb-2">
          6-Digit Security Code
        </Label>
        <Input
          id="mfa-code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          placeholder="000000"
          className="text-center font-mono text-2xl tracking-[0.3em] h-12"
          autoFocus
        />
      </div>

      <Button type="submit" disabled={isVerifying || code.length !== 6} className="w-full">
        {isVerifying ? "Verifying Code..." : "Verify & Sign In"}
      </Button>

      <div className="text-center pt-2">
        <Link
          href="/login?notice=signed_out"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; Cancel &amp; Return to Sign In
        </Link>
      </div>
    </form>
  );
}
