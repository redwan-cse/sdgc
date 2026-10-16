"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/features/auth/types";
import { requireUser } from "@/features/auth/authorization";
import type { MemberProfileInput } from "@/features/membership/types";
import { memberProfileSchema } from "@/features/membership/validation";
import { createClient } from "@/lib/supabase/server";

export async function updateOwnProfileAction(
  input: MemberProfileInput,
): Promise<ActionResult<void>> {
  await requireUser("/profile");

  const parseResult = memberProfileSchema.safeParse(input);
  if (!parseResult.success) {
    return {
      success: false,
      error: "Please correct the errors in the form.",
      fieldErrors: parseResult.error.flatten().fieldErrors,
    };
  }

  const data = parseResult.data;
  const supabase = await createClient();

  // Atomically update profile and project interests via database transaction RPC
  const { error: rpcError } = await supabase.rpc("update_member_profile", {
    p_first_name: data.firstName,
    p_last_name: data.lastName,
    p_spouse_name: data.spouseFirstName || undefined,
    p_phone: data.phoneHome || undefined,
    p_secondary_phone: data.phoneCell || undefined,
    p_address_line1: data.addressLine1 || undefined,
    p_address_line2: data.addressLine2 || undefined,
    p_city: data.city || undefined,
    p_state: data.state || undefined,
    p_postal_code: data.zipCode || undefined,
    p_birth_month: data.birthMonth ?? undefined,
    p_birth_day: data.birthDay ?? undefined,
    p_is_master_gardener: data.masterGardener,
    p_directory_opt_out: data.directoryOptOut ?? false,
    p_gardening_interests: data.gardeningInterests || undefined,
    p_volunteer_experience: data.volunteerExperience || undefined,
    p_project_interests: data.projectInterests,
  });

  if (rpcError) {
    return {
      success: false,
      error: `Failed to update profile: ${rpcError.message}`,
    };
  }

  revalidatePath("/profile");
  return {
    success: true,
    data: undefined,
  };
}
