import "server-only";

import { redirect } from "next/navigation";
import type { AppRole, Capability } from "@/features/auth/types";
import { createClient } from "@/lib/supabase/server";

export interface AuthenticatedUser {
  id: string;
  email: string;
}

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user || !user.email) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
  };
}

export async function requireUser(returnTo?: string): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();

  if (!user) {
    const loginUrl = (
      returnTo ? `/login?returnTo=${encodeURIComponent(returnTo)}` : "/login"
    ) as Parameters<typeof redirect>[0];
    redirect(loginUrl);
  }

  return user;
}

export async function requireCapability(
  capability: Capability,
  returnTo?: string,
): Promise<AuthenticatedUser> {
  const user = await requireUser(returnTo);
  const supabase = await createClient();

  const { data: hasCap, error } = await supabase.rpc("has_capability", {
    capability_name: capability,
    check_user_id: user.id,
  });

  if (error || !hasCap) {
    redirect("/login?error=unauthorized");
  }

  return user;
}

export async function requireRole(role: AppRole, returnTo?: string): Promise<AuthenticatedUser> {
  const user = await requireUser(returnTo);
  const supabase = await createClient();

  const { data: hasR, error } = await supabase.rpc("has_role", {
    role_name: role,
    check_user_id: user.id,
  });

  if (error || !hasR) {
    redirect("/login?error=unauthorized");
  }

  return user;
}
