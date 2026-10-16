import "server-only";

import type { AppRole, AuthSessionUser } from "@/features/auth/types";
import { getCurrentUser } from "@/features/auth/authorization";
import { createClient } from "@/lib/supabase/server";

export async function getAuthSession(): Promise<AuthSessionUser | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();

  // Load profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  // Load roles
  const { data: rolesData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  const roles = (rolesData?.map((r) => r.role) ?? []) as AppRole[];

  // Load current term membership status
  const currentYear = 2026;
  const { data: membershipData } = await supabase
    .from("memberships")
    .select("status, membership_terms!inner(year)")
    .eq("user_id", user.id)
    .eq("membership_terms.year", currentYear)
    .maybeSingle();

  return {
    id: user.id,
    email: user.email,
    username: profile?.username ?? user.email.split("@")[0] ?? "user",
    roles,
    capabilities: [],
    profile: profile
      ? {
          userId: profile.id,
          username: profile.username,
          firstName: profile.first_name,
          lastName: profile.last_name,
          spouseFirstName: profile.spouse_name ?? undefined,
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
          masterGardener: profile.is_master_gardener,
          projectInterests: [],
          interestsExperience: profile.interests_experience ?? undefined,
        }
      : undefined,
    membershipStatus:
      (membershipData?.status as "approved" | "pending" | "expired" | undefined) ?? "none",
  };
}
