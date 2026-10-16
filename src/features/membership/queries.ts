import "server-only";

import { requireUser } from "@/features/auth/authorization";
import type {
  MemberProfile,
  MembershipSummary,
  ProjectInterestCode,
} from "@/features/membership/types";
import { isMembershipActive } from "@/features/membership/rules";
import { createClient } from "@/lib/supabase/server";

export async function getOwnProfile(): Promise<MemberProfile | null> {
  const user = await requireUser("/profile");
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profile) {
    return null;
  }

  const { data: interestsData } = await supabase
    .from("profile_interests")
    .select("project_code")
    .eq("user_id", user.id);

  const projectInterests = (interestsData?.map((i) => i.project_code) ??
    []) as ProjectInterestCode[];

  return {
    userId: profile.id,
    username: profile.username,
    firstName: profile.first_name,
    lastName: profile.last_name,
    email: user.email,
    phoneHome: profile.phone ?? undefined,
    phoneCell: profile.secondary_phone ?? undefined,
    addressLine1: profile.address_line1 ?? undefined,
    addressLine2: profile.address_line2 ?? undefined,
    city: profile.city ?? undefined,
    state: profile.state ?? undefined,
    zipCode: profile.postal_code ?? undefined,
    birthMonth: profile.birth_month ?? undefined,
    birthDay: profile.birth_day ?? undefined,
    spouseFirstName: profile.spouse_name ?? undefined,
    masterGardener: profile.is_master_gardener,
    interestsExperience: profile.interests_experience ?? undefined,
    projectInterests,
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
  };
}

export async function getOwnMembershipSummary(): Promise<MembershipSummary | null> {
  const user = await requireUser("/profile");
  const supabase = await createClient();

  // Find membership for current term (2026)
  const currentYear = 2026;
  const { data: membership } = await supabase
    .from("memberships")
    .select(
      `
      id,
      user_id,
      status,
      approved_at,
      approved_by,
      membership_terms!inner(id, year, dues_cents)
    `,
    )
    .eq("user_id", user.id)
    .eq("membership_terms.year", currentYear)
    .maybeSingle();

  if (!membership) {
    return null;
  }

  // Find payments for this membership (prioritize confirmed over pending)
  const { data: payments } = await supabase
    .from("payments")
    .select("status, payment_method, amount_cents")
    .eq("membership_id", membership.id)
    .order("created_at", { ascending: false });

  const payment =
    payments?.find((p) => p.status === "confirmed" || p.status === "succeeded") ?? payments?.[0];

  const isApproved = membership.status === "approved";
  const isSuspended = false; // DB check constraint: status is pending, approved, or expired
  const isActive = isMembershipActive(
    {
      approved: isApproved,
      suspended: isSuspended,
      year: currentYear,
    },
    new Date(),
  );

  return {
    id: membership.id,
    userId: membership.user_id,
    year: currentYear,
    duesCents: membership.membership_terms.dues_cents,
    currency: "USD",
    applicationStatus:
      membership.status === "approved"
        ? "approved"
        : membership.status === "expired"
          ? "rejected"
          : "pending",
    paymentStatus:
      payment?.status === "confirmed" || payment?.status === "succeeded"
        ? "confirmed"
        : payment?.status === "failed"
          ? "failed"
          : "pending",
    paymentMethod: payment?.payment_method === "check" ? "check" : "credit_card",
    isApproved,
    isSuspended,
    approvedAt: membership.approved_at ?? undefined,
    approvedBy: membership.approved_by ?? undefined,
    isActive,
  };
}
