import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireCapability } from "@/features/auth/authorization";
import type {
  AdminMetrics,
  AdminMemberRecord,
  AdminDuesRecord,
  AdminEventRecord,
  AdminPageRecord,
  AdminMessageRecord,
} from "./types";

export async function getAdminOverviewStats(): Promise<AdminMetrics> {
  const supabase = await createClient();

  const [membersRes, pendingRes, paymentsRes, eventsRes, messagesRes] = await Promise.all([
    supabase
      .from("memberships")
      .select("id", { count: "exact", head: true })
      .eq("status", "approved"),
    supabase
      .from("memberships")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase.from("payments").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .gte("starts_at", new Date().toISOString()),
    supabase
      .from("contact_messages")
      .select("id", { count: "exact", head: true })
      .eq("status", "unread"),
  ]);

  return {
    totalMembers: membersRes.count ?? 0,
    pendingApprovals: pendingRes.count ?? 0,
    unreconciledPayments: paymentsRes.count ?? 0,
    upcomingEvents: eventsRes.count ?? 0,
    unreadMessages: messagesRes.count ?? 0,
  };
}

export async function getAdminMembers(): Promise<AdminMemberRecord[]> {
  await requireCapability("members.manage");
  const supabase = await createClient();

  const { data: memberships, error } = await supabase
    .from("memberships")
    .select(
      `
      id,
      user_id,
      status,
      version,
      created_at,
      profiles!inner (
        id,
        username,
        first_name,
        last_name,
        is_master_gardener
      ),
      membership_terms!inner (
        year
      )
    `,
    )
    .order("created_at", { ascending: false });

  if (error || !memberships) {
    return [];
  }

  // Get payments and roles
  const userIds = memberships.map((m) => m.user_id);
  const membershipIds = memberships.map((m) => m.id);

  const [paymentsRes, rolesRes] = await Promise.all([
    supabase
      .from("payments")
      .select("membership_id, status, payment_method")
      .in("membership_id", membershipIds),
    supabase.from("user_roles").select("user_id, role").in("user_id", userIds),
  ]);

  const paymentsMap = new Map<string, { status: string; method: string }>();
  for (const p of paymentsRes.data ?? []) {
    // Prefer confirmed over pending
    if (!paymentsMap.has(p.membership_id) || p.status === "confirmed") {
      paymentsMap.set(p.membership_id, { status: p.status, method: p.payment_method });
    }
  }

  const rolesMap = new Map<string, string[]>();
  for (const r of rolesRes.data ?? []) {
    const list = rolesMap.get(r.user_id) ?? [];
    list.push(r.role);
    rolesMap.set(r.user_id, list);
  }

  return memberships.map((m) => {
    const p = m.profiles;
    const payment = paymentsMap.get(m.id);
    const roles = rolesMap.get(m.user_id) ?? ["member"];
    if (!roles.includes("member")) roles.unshift("member");

    return {
      id: m.id,
      userId: m.user_id,
      username: p.username,
      name: `${p.first_name} ${p.last_name}`.trim(),
      email: `${p.username}@example.com`,
      year: m.membership_terms.year,
      applicationStatus:
        m.status === "approved" ? "approved" : m.status === "rejected" ? "rejected" : "pending",
      paymentStatus:
        payment?.status === "confirmed"
          ? "confirmed"
          : payment?.status === "failed"
            ? "failed"
            : "pending",
      paymentMethod: payment?.method,
      isApproved: m.status === "approved",
      isMasterGardener: p.is_master_gardener,
      version: m.version,
      roles,
      appliedAt: m.created_at,
    };
  });
}

export async function getAdminDuesRecords(): Promise<AdminDuesRecord[]> {
  await requireCapability("dues.reconcile");
  const supabase = await createClient();

  const { data: payments, error } = await supabase
    .from("payments")
    .select(
      `
      id,
      membership_id,
      amount_cents,
      payment_method,
      status,
      notes,
      reconciled_at,
      reconciled_by,
      created_at,
      profiles!inner (
        username,
        first_name,
        last_name
      ),
      membership_terms!inner (
        year
      )
    `,
    )
    .order("created_at", { ascending: false });

  if (error || !payments) {
    return [];
  }

  return payments.map((p) => {
    const prof = p.profiles;
    return {
      id: p.id,
      membershipId: p.membership_id,
      memberName: `${prof.first_name} ${prof.last_name}`.trim(),
      memberUsername: prof.username,
      year: p.membership_terms.year,
      amountCents: p.amount_cents,
      paymentMethod: p.payment_method as "credit_card" | "check" | "cash",
      status: p.status as "pending" | "confirmed" | "failed" | "refunded",
      notes: p.notes ?? undefined,
      reconciledAt: p.reconciled_at ?? undefined,
      reconciledBy: p.reconciled_by ?? undefined,
      createdAt: p.created_at,
    };
  });
}

export async function getAdminEvents(): Promise<AdminEventRecord[]> {
  await requireCapability("events.manage");
  const supabase = await createClient();

  const { data: events, error } = await supabase
    .from("events")
    .select(
      `
      id,
      title,
      slug,
      starts_at,
      ends_at,
      excerpt,
      status,
      description,
      venue_id,
      venues (
        name
      )
    `,
    )
    .order("starts_at", { ascending: true });

  if (error || !events) {
    return [];
  }

  return events.map((e) => ({
    id: e.id,
    title: e.title,
    slug: e.slug,
    startsAt: e.starts_at,
    endsAt: e.ends_at,
    category: e.excerpt ?? undefined,
    status: e.status as "published" | "draft",
    venueName: e.venues?.name ?? undefined,
    venueId: e.venue_id ?? undefined,
    description: e.description,
  }));
}

export async function getAdminPages(): Promise<AdminPageRecord[]> {
  await requireCapability("content.manage");
  const supabase = await createClient();

  const { data: pages, error } = await supabase
    .from("pages")
    .select("id, slug, title, meta_description, status, updated_at")
    .order("title", { ascending: true });

  if (error || !pages) {
    return [];
  }

  return pages.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    subtitle: p.meta_description ?? undefined,
    status: p.status as "published" | "draft",
    updatedAt: p.updated_at,
  }));
}

export async function getAdminMessages(): Promise<AdminMessageRecord[]> {
  await requireCapability("messages.manage");
  const supabase = await createClient();

  const { data: messages, error } = await supabase
    .from("contact_messages")
    .select("id, name, email, phone, message, status, created_at")
    .order("created_at", { ascending: false });

  if (error || !messages) {
    return [];
  }

  return messages.map((m) => ({
    id: m.id,
    name: m.name,
    email: m.email,
    phone: m.phone ?? undefined,
    message: m.message,
    status: m.status as "unread" | "read" | "archived",
    createdAt: m.created_at,
  }));
}
