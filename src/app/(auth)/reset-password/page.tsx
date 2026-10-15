import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

export const metadata = {
  title: "Set New Password",
  description: "Set a new password for your SDGC member account.",
};

export default function ResetPasswordPage() {
  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center space-y-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-primary">
          Security Update
        </span>
        <h1 className="font-serif text-3xl font-bold text-foreground">Create New Password</h1>
        <p className="text-xs text-muted-foreground">
          Enter and confirm your new password below (minimum 12 characters).
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
        <ResetPasswordForm />
      </div>
    </div>
  );
}
