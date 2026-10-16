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
  const user = await requireUser("/profile");

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

  // Update profile for authenticated user identity only
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      first_name: data.firstName,
      last_name: data.lastName,
      spouse_name: data.spouseFirstName || null,
      phone: data.phoneHome || null,
      secondary_phone: data.phoneCell || null,
      address_line1: data.addressLine1 || null,
      address_line2: data.addressLine2 || null,
      city: data.city || null,
      state: data.state || null,
      postal_code: data.zipCode || null,
      birth_month: data.birthMonth || null,
      birth_day: data.birthDay || null,
      is_master_gardener: data.masterGardener,
      interests_experience: data.interestsExperience || null,
    })
    .eq("id", user.id);

  if (profileError) {
    return {
      success: false,
      error: `Failed to update profile: ${profileError.message}`,
    };
  }

  // Update project interests: delete existing, then re-insert
  await supabase.from("profile_interests").delete().eq("user_id", user.id);

  if (data.projectInterests.length > 0) {
    const interestRows = data.projectInterests.map((code) => ({
      user_id: user.id,
      project_code: code,
    }));
    const { error: interestError } = await supabase.from("profile_interests").insert(interestRows);

    if (interestError) {
      return {
        success: false,
        error: `Failed to update project interests: ${interestError.message}`,
      };
    }
  }

  revalidatePath("/profile");
  return {
    success: true,
    data: undefined,
  };
}
