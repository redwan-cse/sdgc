"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCapability } from "@/features/auth/authorization";
import type { ActionResult } from "./types";

export async function approveMembershipAction(input: {
  membershipId: string;
  expectedVersion?: number;
}): Promise<ActionResult> {
  await requireCapability(["members.manage", "memberships.approve"]);
  const supabase = await createClient();

  // Call atomic PostgreSQL procedure
  const { data, error } = await supabase.rpc("approve_membership", {
    p_membership_id: input.membershipId,
    p_expected_version: input.expectedVersion,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  const result = data as { success: boolean; error?: string; new_version?: number };
  if (!result.success) {
    return { success: false, error: result.error || "Approval failed" };
  }

  revalidatePath("/admin/members");
  revalidatePath("/admin");
  revalidatePath("/directory");
  return { success: true, message: "Membership approved successfully", data: result };
}

export async function reconcilePaymentAction(input: {
  paymentId: string;
  notes?: string;
}): Promise<ActionResult> {
  await requireCapability("dues.reconcile");
  const supabase = await createClient();

  // Call atomic PostgreSQL procedure
  const { data, error } = await supabase.rpc("reconcile_payment", {
    p_payment_id: input.paymentId,
    p_notes: input.notes,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  const result = data as { success: boolean; error?: string };
  if (!result.success) {
    return { success: false, error: result.error || "Reconciliation failed" };
  }

  revalidatePath("/admin/dues");
  revalidatePath("/admin");
  revalidatePath("/directory");
  return { success: true, message: "Payment reconciled and confirmed" };
}

export async function setUserRolesAction(input: {
  userId: string;
  roles: ("admin" | "editor" | "treasurer")[];
}): Promise<ActionResult> {
  const adminUser = await requireCapability("roles.manage");
  const supabase = await createClient();

  const VALID_ROLES = new Set(["admin", "editor", "treasurer"]);
  for (const r of input.roles) {
    if (!VALID_ROLES.has(r)) {
      return { success: false, error: `Invalid role code: ${r}` };
    }
  }

  // Check last-admin protection before updating
  if (!input.roles.includes("admin")) {
    const { count, error: countErr } = await supabase
      .from("user_roles")
      .select("user_id", { count: "exact", head: true })
      .eq("role", "admin")
      .neq("user_id", input.userId);

    if (countErr || (count !== null && count < 1)) {
      return { success: false, error: "Cannot remove the last administrator" };
    }
  }

  // Get current roles
  const { data: currentRoles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", input.userId);

  const existing = new Set((currentRoles ?? []).map((r) => r.role));
  const desired = new Set(input.roles);

  // Roles to remove
  const toRemove = [...existing].filter((r) => !desired.has(r as "admin" | "editor" | "treasurer"));
  // Roles to add
  const toAdd = [...desired].filter((r) => !existing.has(r));

  for (const r of toRemove) {
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", input.userId)
      .eq("role", r);
    if (error) return { success: false, error: error.message };
  }

  for (const r of toAdd) {
    const { error } = await supabase.from("user_roles").insert({
      user_id: input.userId,
      role: r,
      granted_by: adminUser.id,
    });
    if (error) return { success: false, error: error.message };
  }

  // Record audit log
  await supabase.from("audit_events").insert({
    actor_id: adminUser.id,
    action: "roles.updated",
    entity_type: "user",
    entity_id: input.userId,
    details: { roles: input.roles, removed: toRemove, added: toAdd },
  });

  revalidatePath("/admin/members");
  return { success: true, message: "User roles updated successfully" };
}

export async function createEventAction(input: {
  title: string;
  slug: string;
  startsAt: string;
  endsAt?: string;
  category?: string;
  status: "published" | "draft";
  venueId?: string;
  description?: string;
}): Promise<ActionResult> {
  const user = await requireCapability("events.manage");
  const supabase = await createClient();

  const endsAt =
    input.endsAt || new Date(new Date(input.startsAt).getTime() + 2 * 3600000).toISOString();
  const description = input.description || input.title;

  const { data, error } = await supabase
    .from("events")
    .insert({
      title: input.title,
      slug: input.slug,
      starts_at: input.startsAt,
      ends_at: endsAt,
      excerpt: input.category || null,
      status: input.status,
      venue_id: input.venueId || null,
      description,
    })
    .select("id")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  // Audit event
  await supabase.from("audit_events").insert({
    actor_id: user.id,
    action: "event.created",
    entity_type: "event",
    entity_id: data.id,
    details: { title: input.title, slug: input.slug, status: input.status },
  });

  revalidatePath("/events");
  revalidatePath("/admin/events");
  revalidatePath("/admin");
  return { success: true, message: "Event created successfully", data };
}

export async function deleteEventAction(id: string): Promise<ActionResult> {
  const user = await requireCapability("events.manage");
  const supabase = await createClient();

  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) {
    return { success: false, error: error.message };
  }

  await supabase.from("audit_events").insert({
    actor_id: user.id,
    action: "event.deleted",
    entity_type: "event",
    entity_id: id,
  });

  revalidatePath("/events");
  revalidatePath("/admin/events");
  revalidatePath("/admin");
  return { success: true, message: "Event removed successfully" };
}

export async function updatePageAction(
  slug: string,
  input: {
    title: string;
    subtitle?: string;
    status: "published" | "draft";
  },
): Promise<ActionResult> {
  const user = await requireCapability("content.manage");
  const supabase = await createClient();

  const { error } = await supabase
    .from("pages")
    .update({
      title: input.title,
      meta_description: input.subtitle || null,
      status: input.status,
      updated_at: new Date().toISOString(),
    })
    .eq("slug", slug);

  if (error) {
    return { success: false, error: error.message };
  }

  await supabase.from("audit_events").insert({
    actor_id: user.id,
    action: "page.updated",
    entity_type: "page",
    entity_id: slug,
    details: input,
  });

  revalidatePath(`/`);
  revalidatePath(`/${slug}`);
  revalidatePath("/admin/content");
  return { success: true, message: "Page copy updated successfully" };
}

export async function updateMessageStatusAction(
  id: string,
  status: "unread" | "read" | "archived",
): Promise<ActionResult> {
  const user = await requireCapability("messages.manage");
  const supabase = await createClient();

  const { error } = await supabase
    .from("contact_messages")
    .update({
      status,
      triaged_by: user.id,
      triaged_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/messages");
  revalidatePath("/admin");
  return { success: true, message: "Message status updated" };
}
