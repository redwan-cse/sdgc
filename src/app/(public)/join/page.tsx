import { RegisterForm } from "@/features/auth/components/register-form";

export const metadata = {
  title: "Become A Member",
  description:
    "Join the Saugatuck Douglas Garden Club. Register your member profile, select volunteer project interests, and connect with fellow gardeners.",
};

export default function JoinPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
      <div className="text-center space-y-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-primary">
          Join Our Growing Community
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-foreground">
          Become A Member
        </h1>
        <p className="max-w-2xl mx-auto text-base text-muted-foreground">
          Complete the member registration form below to create your club profile. Dues are $50 for
          calendar year 2026.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 sm:p-10 shadow-sm">
        <RegisterForm />
      </div>
    </div>
  );
}
