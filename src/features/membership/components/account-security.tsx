"use client";

import * as React from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePasswordAction } from "@/features/auth/actions";
import { createClient } from "@/lib/supabase/client";

interface FactorRecord {
  id: string;
  friendly_name?: string;
  factor_type: string;
  status: "verified" | "unverified";
  created_at: string;
}

interface AccountSecurityProps {
  userEmail?: string;
}

export function AccountSecurity({ userEmail }: AccountSecurityProps) {
  // Password State
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [passwordError, setPasswordError] = React.useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = React.useState<string | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = React.useState(false);

  // MFA State
  const [mfaFactors, setMfaFactors] = React.useState<FactorRecord[]>([]);
  const [mfaLoading, setMfaLoading] = React.useState(true);
  const [mfaError, setMfaError] = React.useState<string | null>(null);
  const [mfaNotice, setMfaNotice] = React.useState<string | null>(null);

  // MFA Enrollment Modal State
  const [isEnrolling, setIsEnrolling] = React.useState(false);
  const [enrollData, setEnrollData] = React.useState<{
    factorId: string;
    qrCode: string;
    secret: string;
  } | null>(null);
  const [verificationCode, setVerificationCode] = React.useState("");
  const [enrollError, setEnrollError] = React.useState<string | null>(null);
  const [isVerifyingEnroll, setIsVerifyingEnroll] = React.useState(false);
  const [copiedKey, setCopiedKey] = React.useState(false);

  // Unenroll Modal State
  const [factorToUnenroll, setFactorToUnenroll] = React.useState<string | null>(null);
  const [isUnenrolling, setIsUnenrolling] = React.useState(false);

  const fetchFactors = React.useCallback(async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (!error && data) {
        const verifiedTotp = (data.totp || []).map((f) => ({
          id: f.id,
          friendly_name: f.friendly_name,
          factor_type: f.factor_type,
          status: f.status as "verified" | "unverified",
          created_at: f.created_at,
        }));
        setMfaFactors(verifiedTotp);
      }
    } catch {
      setMfaError("Unable to load two-factor authentication status.");
    } finally {
      setMfaLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchFactors();
  }, [fetchFactors]);

  // Handle Password Submit
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword) {
      setPasswordError("Please enter your current password.");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    if (newPassword === currentPassword) {
      setPasswordError("New password must be different from your current password.");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const formData = new FormData();
      formData.append("currentPassword", currentPassword);
      formData.append("newPassword", newPassword);
      formData.append("confirmPassword", confirmPassword);

      const res = await changePasswordAction(formData);
      if (res.success) {
        setPasswordSuccess("Your password has been updated successfully.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPasswordError(res.error || "Failed to update password.");
      }
    } catch {
      setPasswordError("An unexpected network error occurred while updating your password.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Start MFA Enrollment
  const handleStartEnroll = async () => {
    setEnrollError(null);
    setMfaNotice(null);
    setIsEnrolling(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Authenticator App",
        issuer: "SDGC",
      });

      if (error || !data || data.type !== "totp") {
        setEnrollError(error?.message || "Failed to start two-factor enrollment.");
        return;
      }

      setEnrollData({
        factorId: data.id,
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
      });
    } catch {
      setEnrollError("Network error initializing authenticator QR code.");
    }
  };

  // Confirm MFA Enrollment
  const handleVerifyEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnrollError(null);

    const cleanCode = verificationCode.replace(/\D/g, "").trim();
    if (cleanCode.length !== 6) {
      setEnrollError("Please enter a valid 6-digit verification code.");
      return;
    }

    if (!enrollData?.factorId) {
      setEnrollError("Enrollment session expired. Please try again.");
      return;
    }

    setIsVerifyingEnroll(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.mfa.challengeAndVerify({
        factorId: enrollData.factorId,
        code: cleanCode,
      });

      if (error || !data) {
        setEnrollError(
          "Invalid code. Please verify the code in your authenticator app and try again.",
        );
        return;
      }

      // Success!
      setIsEnrolling(false);
      setEnrollData(null);
      setVerificationCode("");
      setMfaNotice("Two-factor authentication (TOTP) has been activated successfully!");
      fetchFactors();
    } catch {
      setEnrollError("Network error confirming verification code.");
    } finally {
      setIsVerifyingEnroll(false);
    }
  };

  // Cancel MFA Enrollment
  const handleCancelEnroll = async () => {
    if (enrollData?.factorId) {
      try {
        const supabase = createClient();
        await supabase.auth.mfa.unenroll({ factorId: enrollData.factorId });
      } catch {
        // Non-blocking cleanup
      }
    }
    setIsEnrolling(false);
    setEnrollData(null);
    setVerificationCode("");
    setEnrollError(null);
  };

  // Unenroll MFA Factor
  const handleUnenroll = async () => {
    if (!factorToUnenroll) return;
    setIsUnenrolling(true);
    setMfaError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.mfa.unenroll({ factorId: factorToUnenroll });
      if (error) {
        setMfaError(error.message);
      } else {
        setMfaNotice("Two-factor authentication has been removed.");
        setFactorToUnenroll(null);
        fetchFactors();
      }
    } catch {
      setMfaError("Network error removing two-factor factor.");
    } finally {
      setIsUnenrolling(false);
    }
  };

  const copySecretKey = () => {
    if (enrollData?.secret) {
      navigator.clipboard.writeText(enrollData.secret);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const hasVerifiedFactor = mfaFactors.some((f) => f.status === "verified");

  return (
    <div className="space-y-10">
      {/* Section 1: Change Password */}
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xs space-y-6">
        <div className="border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <svg
              className="h-5 w-5 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-foreground">
              Account Password
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Update your account sign-in credentials. To ensure security, you must provide your
            current password before saving a new one.
          </p>
        </div>

        {passwordNotice(passwordSuccess, passwordError)}

        <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-xl" noValidate>
          {userEmail && (
            <div className="text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-lg border border-border/50">
              Account Email: <span className="font-semibold text-foreground">{userEmail}</span>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="current-password" required>
                Current Password
              </Label>
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="text-[11px] text-primary hover:underline cursor-pointer"
              >
                {showCurrentPassword ? "Hide" : "Show"}
              </button>
            </div>
            <Input
              id="current-password"
              type={showCurrentPassword ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter your current password"
              autoComplete="current-password"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="new-password" required>
                  New Password
                </Label>
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="text-[11px] text-primary hover:underline cursor-pointer"
                >
                  {showNewPassword ? "Hide" : "Show"}
                </button>
              </div>
              <Input
                id="new-password"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                autoComplete="new-password"
              />
            </div>

            <div>
              <Label htmlFor="confirm-password" required>
                Confirm New Password
              </Label>
              <Input
                id="confirm-password"
                type={showNewPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={isUpdatingPassword || !currentPassword || !newPassword || !confirmPassword}
            >
              {isUpdatingPassword ? "Updating Password..." : "Update Password"}
            </Button>
          </div>
        </form>
      </div>

      {/* Section 2: Two-Factor Authentication (TOTP / AAL2) */}
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xs space-y-6">
        <div className="border-b border-border/60 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5 text-primary"
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
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-foreground">
                Two-Factor Authentication (MFA / TOTP)
              </h2>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Elevate your account to Assurance Level 2 (AAL2). When enabled, signing in requires an
              authenticator app security code in addition to your password.
            </p>
          </div>

          <div>
            {mfaLoading ? (
              <span className="text-xs text-muted-foreground">Checking security level...</span>
            ) : hasVerifiedFactor ? (
              <Badge variant="success" className="py-1 px-3">
                Active (AAL2 Protected)
              </Badge>
            ) : (
              <Badge variant="outline" className="py-1 px-3">
                Not Configured (AAL1)
              </Badge>
            )}
          </div>
        </div>

        {mfaNotice && (
          <div
            className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-600/30 p-3.5 text-xs text-emerald-800 dark:text-emerald-300 font-medium"
            role="status"
          >
            {mfaNotice}
          </div>
        )}

        {mfaError && (
          <div
            className="rounded-lg bg-destructive/10 border border-destructive/20 p-3.5 text-xs text-destructive font-medium"
            role="alert"
          >
            {mfaError}
          </div>
        )}

        {hasVerifiedFactor ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-muted/20 p-4 divide-y divide-border/60">
              {mfaFactors
                .filter((f) => f.status === "verified")
                .map((factor) => (
                  <div
                    key={factor.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground">
                          {factor.friendly_name || "Authenticator App"}
                        </span>
                        <Badge variant="secondary" className="text-[10px]">
                          TOTP
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Configured: {new Date(factor.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFactorToUnenroll(factor.id)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      Remove Authenticator
                    </Button>
                  </div>
                ))}
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Your account is protected by an Authenticator App. Any sign-in attempt from a new
              browser session will prompt for your 6-digit code.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-border/80 bg-muted/10 p-5 space-y-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Two-Factor Authentication is <strong>optional</strong>, but highly recommended for all
              members and required for organizational safety. Compatible with Google Authenticator,
              Apple Passwords, 1Password, Microsoft Authenticator, and Authy.
            </p>

            <Button onClick={handleStartEnroll} disabled={isEnrolling} variant="outline">
              <svg
                className="h-4 w-4 mr-2 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Configure Authenticator App (TOTP)
            </Button>
          </div>
        )}
      </div>

      {/* MFA Enrollment Modal Dialog */}
      {isEnrolling && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mfa-enroll-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl space-y-5">
            <div className="flex justify-between items-start border-b border-border/60 pb-3">
              <div>
                <h3 id="mfa-enroll-title" className="font-serif text-xl font-bold text-foreground">
                  Set Up Authenticator App
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Scan the QR code or enter the secret key manually
                </p>
              </div>
              <button
                type="button"
                onClick={handleCancelEnroll}
                className="text-muted-foreground hover:text-foreground text-sm font-semibold p-1"
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            {enrollError && (
              <div
                className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive font-medium"
                role="alert"
              >
                {enrollError}
              </div>
            )}

            {enrollData ? (
              <form onSubmit={handleVerifyEnrollment} className="space-y-4" noValidate>
                {/* QR Code Container */}
                <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-border shadow-2xs">
                  <Image
                    src={
                      enrollData.qrCode.startsWith("data:")
                        ? enrollData.qrCode
                        : `data:image/svg+xml;utf-8,${encodeURIComponent(enrollData.qrCode)}`
                    }
                    alt="Authenticator App QR Code"
                    width={176}
                    height={176}
                    unoptimized
                    className="h-44 w-44 object-contain"
                  />
                  <span className="text-[11px] font-medium text-neutral-600 mt-2">
                    Scan using your authenticator app
                  </span>
                </div>

                {/* Secret Key manual copy */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium">
                      Secret Key (Manual Entry):
                    </span>
                    <button
                      type="button"
                      onClick={copySecretKey}
                      className="text-primary hover:underline font-semibold text-[11px]"
                    >
                      {copiedKey ? "Copied!" : "Copy Key"}
                    </button>
                  </div>
                  <div className="font-mono text-xs bg-muted/50 p-2 rounded border border-border break-all select-all text-center">
                    {enrollData.secret}
                  </div>
                </div>

                {/* Verification Code Input */}
                <div>
                  <Label htmlFor="enroll-verify-code" required>
                    Enter 6-Digit Code from App
                  </Label>
                  <Input
                    id="enroll-verify-code"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="000000"
                    className="text-center font-mono text-xl tracking-[0.25em]"
                    autoFocus
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={handleCancelEnroll}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isVerifyingEnroll || verificationCode.length !== 6}
                  >
                    {isVerifyingEnroll ? "Verifying..." : "Verify & Enable"}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="py-8 text-center text-xs text-muted-foreground animate-pulse">
                Generating secure TOTP secret key...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Unenroll Confirmation Modal Dialog */}
      {factorToUnenroll && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="unenroll-title"
        >
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4">
            <h3 id="unenroll-title" className="font-serif text-lg font-bold text-foreground">
              Remove Two-Factor Authentication?
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to disable two-factor authentication? Your account will only be
              protected by your password (Assurance Level 1).
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFactorToUnenroll(null)}
                disabled={isUnenrolling}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleUnenroll}
                disabled={isUnenrolling}
              >
                {isUnenrolling ? "Removing..." : "Yes, Remove MFA"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function passwordNotice(success: string | null, error: string | null) {
  if (success) {
    return (
      <div
        className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-600/30 p-3.5 text-xs text-emerald-800 dark:text-emerald-300 font-medium"
        role="status"
      >
        {success}
      </div>
    );
  }
  if (error) {
    return (
      <div
        className="rounded-lg bg-destructive/10 border border-destructive/20 p-3.5 text-xs text-destructive font-medium"
        role="alert"
      >
        {error}
      </div>
    );
  }
  return null;
}
