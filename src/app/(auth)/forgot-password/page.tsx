import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";

export const metadata = {
  title: "Forgot Password",
  description: "Request a password reset link for your SDGC member account.",
};

export default function ForgotPasswordPage() {
  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center space-y-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-primary">
          Account Recovery
        </span>
        <h1 className="font-serif text-3xl font-bold text-foreground">Reset Your Password</h1>
        <p className="text-xs text-muted-foreground">
          Enter your registered email address to receive password reset instructions.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
