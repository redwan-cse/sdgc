"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { ActionResult } from "@/features/auth/types";
import { loginSchema, registerSchema } from "@/features/auth/validation";
import { getPublicSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

function sanitizeReturnTo(returnTo?: string | null): string {
  if (!returnTo) return "/profile";
  // Prevent open redirect: must start with / and not //
  if (returnTo.startsWith("/") && !returnTo.startsWith("//")) {
    return returnTo;
  }
  return "/profile";
}

async function resolveIdentifierToEmail(identifier: string): Promise<string> {
  const trimmed = identifier.trim();
  if (trimmed.includes("@")) {
    return trimmed;
  }

  // Lookup email for username using service role on server
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return trimmed;
  }

  const env = getPublicSupabaseEnv();
  const admin = createAdminClient<Database>(env.url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .ilike("username", trimmed)
    .maybeSingle();

  if (!profile) {
    // Return dummy email so signInWithPassword fails with uniform timing/error
    return "nonexistent-user@invalid.local";
  }

  const { data: userData } = await admin.auth.admin.getUserById(profile.id);
  return userData?.user?.email ?? "nonexistent-user@invalid.local";
}

export async function loginAction(formData: FormData): Promise<ActionResult<{ returnTo: string }>> {
  const rawIdentifier = formData.get("identifier");
  const rawPassword = formData.get("password");
  const rawReturnTo = formData.get("returnTo");

  const parseResult = loginSchema.safeParse({
    identifier: rawIdentifier,
    password: rawPassword,
  });

  if (!parseResult.success) {
    return {
      success: false,
      error: "Please provide a valid username/email and password.",
      fieldErrors: parseResult.error.flatten().fieldErrors,
    };
  }

  const { identifier, password } = parseResult.data;
  const targetEmail = await resolveIdentifierToEmail(identifier);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: targetEmail,
    password,
  });

  if (error) {
    // Return a generic error to prevent username or email enumeration
    return {
      success: false,
      error: "Invalid username, email, or password.",
    };
  }

  revalidatePath("/", "layout");
  const destination = sanitizeReturnTo(rawReturnTo as string | null);
  return {
    success: true,
    data: { returnTo: destination },
  };
}

export async function registerAction(
  formData: FormData,
): Promise<ActionResult<{ userId: string }>> {
  const rawData: Record<string, unknown> = {};
  formData.forEach((value, key) => {
    if (key === "projectInterests") {
      if (!rawData[key]) rawData[key] = [];
      (rawData[key] as string[]).push(value as string);
    } else if (key === "masterGardener") {
      rawData[key] = value === "true" || value === "on";
    } else if (key === "birthMonth" || key === "birthDay") {
      const num = Number(value);
      rawData[key] = Number.isNaN(num) || num === 0 ? undefined : num;
    } else {
      rawData[key] = value;
    }
  });

  const parseResult = registerSchema.safeParse(rawData);
  if (!parseResult.success) {
    return {
      success: false,
      error: "Please correct the errors in the form.",
      fieldErrors: parseResult.error.flatten().fieldErrors,
    };
  }

  const data = parseResult.data;
  const supabase = await createClient();

  // Create Auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        username: data.username,
        first_name: data.firstName,
        last_name: data.lastName,
      },
    },
  });

  if (authError || !authData.user) {
    return {
      success: false,
      error: authError?.message || "Failed to create account. Please try again.",
    };
  }

  const userId = authData.user.id;

  // Insert profile using server client
  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: userId,
      username: data.username.toLowerCase(),
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
    },
    { onConflict: "id" },
  );

  if (profileError) {
    return {
      success: false,
      error: `Profile creation failed: ${profileError.message}`,
    };
  }

  // Insert project interests
  if (data.projectInterests.length > 0) {
    const interestRows = data.projectInterests.map((code) => ({
      user_id: userId,
      project_code: code,
    }));
    await supabase
      .from("profile_interests")
      .upsert(interestRows, { onConflict: "user_id,project_code" });
  }

  // Create pending membership for 2026 term
  const { data: term } = await supabase
    .from("membership_terms")
    .select("id")
    .eq("year", 2026)
    .maybeSingle();

  if (term) {
    await supabase.from("memberships").upsert(
      {
        user_id: userId,
        term_id: term.id,
        status: "pending",
      },
      { onConflict: "user_id,term_id" },
    );
  }

  revalidatePath("/", "layout");
  return {
    success: true,
    data: { userId },
  };
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function forgotPasswordAction(email: string): Promise<ActionResult<string>> {
  if (!email?.includes("@")) {
    return {
      success: false,
      error: "Please enter a valid email address.",
    };
  }

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://127.0.0.1:3000";

  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/reset-password`,
  });

  // Always return success to prevent email enumeration
  return {
    success: true,
    data: "If an account matches that email, a password recovery link has been sent.",
  };
}

export async function resetPasswordAction(newPassword: string): Promise<ActionResult<void>> {
  if (!newPassword || newPassword.length < 12) {
    return {
      success: false,
      error: "Password must be at least 12 characters.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  revalidatePath("/", "layout");
  return {
    success: true,
    data: undefined,
  };
}
