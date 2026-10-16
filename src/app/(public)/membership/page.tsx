import { getCurrentUser } from "@/features/auth/authorization";
import { getOwnMembershipSummary } from "@/features/membership/queries";
import { getCurrentTermInfo } from "@/features/payments/queries";
import { FIXTURE_MEMBERSHIP } from "../../../../tests/fixtures/public-content";
import { DuesCard } from "@/features/membership/components/dues-card";

export const metadata = {
  title: "Annual Membership & Dues",
  description:
    "Annual dues rate ($50.00 for calendar year 2026), non-recurring renewal policy, online card payment, and mail-in check instructions for Saugatuck Douglas Garden Club.",
};

export default async function MembershipPage() {
  const user = await getCurrentUser();
  const summary = user ? await getOwnMembershipSummary() : null;
  const term = await getCurrentTermInfo();

  const membershipData = summary ?? {
    ...FIXTURE_MEMBERSHIP,
    duesCents: term?.duesCents ?? 5000,
    year: term?.year ?? 2026,
    userId: user?.id ?? "",
    paymentStatus: "pending",
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
      <div className="space-y-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-primary">
          Member Governance & Dues
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-foreground">
          Annual Membership & Dues
        </h1>
        <p className="max-w-2xl text-base text-muted-foreground leading-relaxed">
          SDGC membership runs on a calendar year basis (January 1 – December 31). In accordance
          with club bylaws, membership renewals are annual and non-recurring.
        </p>
      </div>

      <DuesCard membership={membershipData} isLoggedIn={Boolean(user)} />
    </div>
  );
}
