import * as React from "react";
import { MfaVerifyForm } from "@/features/auth/components/mfa-verify-form";

export const metadata = {
  title: "Two-Factor Authentication",
  description: "Verify your identity using your authenticator app security code.",
};

interface MfaVerifyPageProps {
  searchParams?: Promise<{ returnTo?: string }>;
}

export default async function MfaVerifyPage({ searchParams }: MfaVerifyPageProps) {
  const params = await searchParams;
  const returnTo = params?.returnTo;

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
        <React.Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-muted/40" />}>
          <MfaVerifyForm returnTo={returnTo} />
        </React.Suspense>
      </div>
    </div>
  );
}
